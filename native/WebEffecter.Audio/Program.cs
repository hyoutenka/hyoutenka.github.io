using System.Globalization;
using System.Threading;
using NAudio.Wave;

// This prototype keeps audio entirely inside one ASIO duplex callback. It does
// not route audio through a browser, a socket, a timer or a managed queue.
try
{
    var options = Arguments.Parse(args);
    if (options.List)
    {
        var names = AsioDevice.GetDriverNames();
        if (names.Length == 0) Console.WriteLine("No ASIO driver found. Install the manufacturer's audio driver.");
        foreach (var name in names) Console.WriteLine(name);
        return;
    }

    using var device = AsioDevice.Open(options.Driver!);
    var capabilities = device.Capabilities;
    Console.WriteLine($"Driver: {options.Driver}");
    Console.WriteLine($"Inputs: {capabilities.NbInputChannels}, outputs: {capabilities.NbOutputChannels}");
    for (var i = 0; i < capabilities.NbInputChannels; i++)
        Console.WriteLine($"  IN  {i}: {capabilities.InputChannelInfos[i].name}");
    for (var i = 0; i < capabilities.NbOutputChannels; i++)
        Console.WriteLine($"  OUT {i}: {capabilities.OutputChannelInfos[i].name}");

    if (options.Panel)
    {
        device.ShowControlPanel();
        return;
    }

    if (options.Input < 0 || options.Input >= capabilities.NbInputChannels ||
        options.Left < 0 || options.Left >= capabilities.NbOutputChannels ||
        options.Right < 0 || options.Right >= capabilities.NbOutputChannels ||
        options.Left == options.Right)
        throw new ArgumentException("Selected channel is outside the driver range, or outputs are the same. Use --list to inspect channels.");

    // The callback is intentionally allocation-free. A separate physical cable
    // test is required before a round-trip latency claim can be made.
    var processor = new MonitorProcessor(options.Measure, options.Gain, options.Rate);
    device.InitDuplex(new AsioDuplexOptions
    {
        InputChannels = [options.Input],
        OutputChannels = [options.Left, options.Right],
        SampleRate = options.Rate,
        BufferSize = options.Buffer,
        Processor = (in AsioProcessBuffers b) => processor.Process(in b)
    });

    var bufferMs = 1000.0 * device.FramesPerBuffer / options.Rate;
    var driverInputMs = 1000.0 * device.InputLatencySamples / options.Rate;
    var driverOutputMs = 1000.0 * device.OutputLatencySamples / options.Rate;
    Console.WriteLine($"ASIO buffer: {device.FramesPerBuffer} samples ({bufferMs:F2} ms)");
    Console.WriteLine($"Driver reports: input {driverInputMs:F2} ms, output {driverOutputMs:F2} ms");
    Console.WriteLine($"Driver-reported sum: {driverInputMs + driverOutputMs:F2} ms (NOT a measured round trip)");
    Console.WriteLine("Target: measured analogue loopback < 20 ms, no dropouts. Driver values alone cannot certify it.");
    if (options.Measure)
        Console.WriteLine("Loopback test: LEFT selected line output -> selected line input. Level is -30 dBFS; press Enter to stop.");
    else
        Console.WriteLine("Live dry monitor: selected input -> both selected outputs. Press Enter to stop.");

    device.ResyncOccurred += (_, _) => Interlocked.Increment(ref processor.Resyncs);
    device.Start();
    using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
    using var cancel = new CancellationTokenSource();
    var log = Task.Run(async () =>
    {
        try
        {
            while (await timer.WaitForNextTickAsync(cancel.Token))
            {
                var frames = Interlocked.Read(ref processor.Frames);
                var resyncs = Volatile.Read(ref processor.Resyncs);
                var measured = Interlocked.Read(ref processor.RoundTripFrames);
                Console.WriteLine(options.Measure
                    ? measured >= 0 ? $"Physical loopback: {1000.0 * measured / options.Rate:F2} ms · resyncs {resyncs}" : $"Waiting for return pulse · resyncs {resyncs}"
                    : $"Processed {frames / options.Rate}s · driver resyncs {resyncs}");
            }
        }
        catch (OperationCanceledException) { }
    });
    Console.ReadLine();
    cancel.Cancel();
    await log;
    device.Stop();
}
catch (Exception error)
{
    Console.Error.WriteLine(error.Message);
    Environment.ExitCode = 1;
}

internal sealed class MonitorProcessor(bool measure, float gain, int sampleRate)
{
    internal long Frames;
    internal long RoundTripFrames = -1;
    internal int Resyncs;
    private long pulseFrame = -1;

    internal void Process(in AsioProcessBuffers b)
    {
        var first = Frames;
        var input = b.GetInput(0);
        var left = b.GetOutput(0);
        var right = b.GetOutput(1);

        if (measure)
        {
            // Inspect the captured block before writing the new output block.
            if (pulseFrame >= 0 && RoundTripFrames < 0)
            {
                for (var i = 0; i < b.Frames; i++)
                    if (MathF.Abs(input[i]) > 0.005f && first + i > pulseFrame)
                    {
                        Interlocked.Exchange(ref RoundTripFrames, first + i - pulseFrame);
                        break;
                    }
            }
            for (var i = 0; i < b.Frames; i++)
            {
                var frame = first + i;
                var pulseStart = 4L * b.Frames;
                // A short 1 kHz sine burst is more robust than a one-sample impulse.
                var value = frame >= pulseStart && frame < pulseStart + sampleRate / 100
                    ? 0.0316f * MathF.Sin(2 * MathF.PI * 1000 * (frame - pulseStart) / sampleRate) : 0;
                if (frame == pulseStart) pulseFrame = frame;
                left[i] = value;
                right[i] = 0;
            }
        }
        else
        {
            for (var i = 0; i < b.Frames; i++)
            {
                var v = Math.Clamp(input[i] * gain, -0.9f, 0.9f);
                left[i] = v;
                right[i] = v;
            }
        }
        Interlocked.Add(ref Frames, b.Frames);
    }
}

internal sealed record Arguments(bool List, bool Panel, bool Measure, string? Driver, int Input, int Left, int Right, int Rate, int? Buffer, float Gain)
{
    internal static Arguments Parse(string[] args)
    {
        if (args.Length == 0 || args.Contains("--help"))
        {
            Console.WriteLine("Usage: WebEffecter.Audio --list | --driver \"Focusrite USB ASIO\" [--input 0 --left 2 --right 3 --rate 48000 --buffer 64 --gain 0.5] [--measure | --panel]");
            Console.WriteLine("ASIO channels are ZERO-BASED. On a 4i4, outputs 2/3 normally represent 3/4; verify the printed channel names.");
            Environment.Exit(0);
        }
        string? Get(string key)
        {
            var at = Array.IndexOf(args, key);
            if (at < 0) return null;
            if (at + 1 >= args.Length || args[at + 1].StartsWith("--")) throw new ArgumentException($"Missing value for {key}");
            return args[at + 1];
        }
        int Number(string key, int fallback) => int.TryParse(Get(key), out var value) ? value : fallback;
        var driver = Get("--driver");
        if (!args.Contains("--list") && string.IsNullOrWhiteSpace(driver)) throw new ArgumentException("Specify --driver after --list.");
        var gain = float.TryParse(Get("--gain"), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) ? parsed : 0.5f;
        if (gain is < 0 or > 1) throw new ArgumentException("--gain must be from 0 to 1.");
        return new(args.Contains("--list"), args.Contains("--panel"), args.Contains("--measure"), driver,
            Number("--input", 0), Number("--left", 0), Number("--right", 1), Number("--rate", 48000),
            Get("--buffer") is { } raw ? int.Parse(raw, CultureInfo.InvariantCulture) : null, gain);
    }
}
