using System.Globalization;
using System.Runtime.InteropServices;
using System.Threading;
using NAudio.Wave;

// This prototype keeps audio entirely inside one ASIO duplex callback. It does
// not route audio through a browser, a socket, a timer or a managed queue.
internal static class Program
{
  // ASIO COM activation and the device lifetime stay on this same STA thread.
  [STAThread]
  private static int Main(string[] args)
  {
  try
  {
    if (Thread.CurrentThread.GetApartmentState() != ApartmentState.STA)
        throw new InvalidOperationException("ASIO requires an STA entry thread; this build was started without STA.");
    Console.WriteLine("WebEffecter.Audio · STA build 4");
    if (args.Contains("--self-test")) return LoopbackControl.SelfTestAsync().GetAwaiter().GetResult();
    if (args.Length == 0 || args.Contains("--install"))
        return QuickStart.Install(args);
    if (args.Contains("--uninstall"))
        return QuickStart.Uninstall();
    var options = Arguments.Parse(args);
    if (options.List)
    {
        var names = AsioDevice.GetDriverNames();
        if (names.Length == 0) Console.WriteLine("No ASIO driver found. Install the manufacturer's audio driver.");
        foreach (var name in names) Console.WriteLine(name);
        return 0;
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
        return 0;
    }

    if (options.Input < 0 || options.Input >= capabilities.NbInputChannels ||
        options.Left < 0 || options.Left >= capabilities.NbOutputChannels ||
        options.Right < 0 || options.Right >= capabilities.NbOutputChannels ||
        options.Left == options.Right)
        throw new ArgumentException("Selected channel is outside the driver range, or outputs are the same. Use --list to inspect channels.");

    // The callback is intentionally allocation-free. A separate physical cable
    // test is required before a round-trip latency claim can be made.
    var effects = options.Chain.Select(name => name switch
    {
        "janray" => (IAudioEffect)new JanRayEffect(options.Rate),
        "ocd" => new OcdEffect(options.Rate),
        _ => throw new ArgumentException($"Unsupported effect: {name}")
    }).ToArray();
    var processor = new MonitorProcessor(options.Measure, options.Tone, options.Gain, options.Rate, effects);
    if (args.Contains("--daemon")) processor.RequireWebControl();
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
    else if (options.Tone)
        Console.WriteLine("Output test: 440 Hz at -30 dBFS on both selected outputs. Turn headphones down first; press Enter to stop.");
    else
        Console.WriteLine($"Live monitor: selected input -> {(effects.Length == 0 ? "dry" : string.Join(" -> ", options.Chain))} -> both selected outputs. Press Enter to stop.");

    device.ResyncOccurred += (_, _) => Interlocked.Increment(ref processor.Resyncs);
    using var control = options.ControlPort is { } port ? new LoopbackControl(port, options.Rate, processor) : null;
    if (control is not null) Console.WriteLine($"Web chain control: http://127.0.0.1:{options.ControlPort}/ (local computer only)");
    device.Start();
    using var timer = new Timer(_ =>
    {
        var frames = Interlocked.Read(ref processor.Frames);
        var resyncs = Volatile.Read(ref processor.Resyncs);
        var measured = Interlocked.Read(ref processor.RoundTripFrames);
        var inputPeak = MonitorProcessor.FormatPeak(Interlocked.Exchange(ref processor.InputPeakBits, 0));
        var outputPeak = MonitorProcessor.FormatPeak(Interlocked.Exchange(ref processor.OutputPeakBits, 0));
        Console.WriteLine(options.Measure
            ? measured >= 0 ? $"Physical loopback: {1000.0 * measured / options.Rate:F2} ms · resyncs {resyncs}" : $"Waiting for return pulse · IN {inputPeak} · OUT {outputPeak} · resyncs {resyncs}"
            : $"Processed {frames / options.Rate}s · IN {inputPeak} · OUT {outputPeak} · driver resyncs {resyncs}");
    }, null, 1000, 1000);
    if (args.Contains("--daemon"))
        Thread.Sleep(Timeout.Infinite);
    else
        Console.ReadLine();
    timer.Change(Timeout.Infinite, Timeout.Infinite);
    device.Stop();
    return 0;
  }
  catch (Exception error)
  {
    Console.Error.WriteLine(error.Message);
    if (error is COMException com && com.HResult == unchecked((int)0x80004002))
        Console.Error.WriteLine("STA is enabled. Check that --driver matches --list exactly and that the interface's 64-bit ASIO driver is installed.");
    return 1;
  }
  }
}

internal sealed class MonitorProcessor(bool measure, bool tone, float gain, int sampleRate, IAudioEffect[] initialEffects)
{
    private IAudioEffect[] activeEffects = initialEffects;
    internal void SetEffects(IAudioEffect[] next) => Volatile.Write(ref activeEffects, next);
    internal int ActiveEffectCount => Volatile.Read(ref activeEffects).Length;
    private float outputLevel = 1;
    private int muted;
    private long lastWebControlTicks = DateTime.UtcNow.Ticks;
    private int webControlled;
    internal void SetOutput(float level, bool mute)
    {
        Volatile.Write(ref outputLevel, level);
        Volatile.Write(ref muted, mute ? 1 : 0);
        Interlocked.Exchange(ref lastWebControlTicks, DateTime.UtcNow.Ticks);
        Volatile.Write(ref webControlled, 1);
    }
    internal void RequireWebControl()
    {
        Volatile.Write(ref muted, 1);
        Volatile.Write(ref webControlled, 1);
    }
    internal void RefreshControl() => Interlocked.Exchange(ref lastWebControlTicks, DateTime.UtcNow.Ticks);
    internal long Frames;
    internal long RoundTripFrames = -1;
    internal int Resyncs;
    internal int InputPeakBits;
    internal int OutputPeakBits;
    private long pulseFrame = -1;

    internal static string FormatPeak(int bits)
    {
        var peak = BitConverter.Int32BitsToSingle(bits);
        return peak > 0 ? $"{20 * Math.Log10(peak):F0} dBFS" : "-inf dBFS";
    }

    private static void RaisePeak(ref int target, float peak)
    {
        var bits = BitConverter.SingleToInt32Bits(MathF.Min(1, peak));
        int old;
        do
        {
            old = Volatile.Read(ref target);
            if (bits <= old) return;
        } while (Interlocked.CompareExchange(ref target, bits, old) != old);
    }

    internal void Process(in AsioProcessBuffers b)
    {
        var first = Frames;
        var input = b.GetInput(0);
        var left = b.GetOutput(0);
        var right = b.GetOutput(1);
        float inputPeak = 0, outputPeak = 0;

        for (var i = 0; i < b.Frames; i++) inputPeak = MathF.Max(inputPeak, MathF.Abs(input[i]));

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
                outputPeak = MathF.Max(outputPeak, MathF.Abs(value));
            }
        }
        else if (tone)
        {
            for (var i = 0; i < b.Frames; i++)
            {
                var value = 0.0316f * MathF.Sin(2 * MathF.PI * 440 * ((first + i) % sampleRate) / sampleRate);
                left[i] = right[i] = value;
                outputPeak = MathF.Max(outputPeak, MathF.Abs(value));
            }
        }
        else
        {
            var effects = Volatile.Read(ref activeEffects);
            // A closed tab must not leave a live guitar monitor open indefinitely.
            var stale = Volatile.Read(ref webControlled) != 0 &&
                DateTime.UtcNow.Ticks - Interlocked.Read(ref lastWebControlTicks) > TimeSpan.FromSeconds(6).Ticks;
            var outputScale = stale || Volatile.Read(ref muted) != 0 ? 0 : gain * Volatile.Read(ref outputLevel);
            for (var i = 0; i < b.Frames; i++)
            {
                var v = input[i];
                foreach (var effect in effects) v = effect.Process(v);
                v = Math.Clamp(v * outputScale, -0.9f, 0.9f);
                left[i] = v;
                right[i] = v;
                outputPeak = MathF.Max(outputPeak, MathF.Abs(v));
            }
        }
        RaisePeak(ref InputPeakBits, inputPeak);
        RaisePeak(ref OutputPeakBits, outputPeak);
        Interlocked.Add(ref Frames, b.Frames);
    }
}

internal sealed record Arguments(bool List, bool Panel, bool Measure, bool Tone, string? Driver, int Input, int Left, int Right, int Rate, int? Buffer, float Gain, string[] Chain, int? ControlPort)
{
    internal static Arguments Parse(string[] args)
    {
        if (args.Length == 0 || args.Contains("--help"))
        {
            Console.WriteLine("Usage: WebEffecter.Audio --list | --driver \"Focusrite USB ASIO\" [--input 1 --left 2 --right 3 --rate 48000 --buffer 64 --gain 0.5] [--chain janray,ocd] [--control-port 8765] [--tone | --measure | --panel]");
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
        if (args.Contains("--tone") && args.Contains("--measure")) throw new ArgumentException("Choose either --tone or --measure.");
        var chain = (Get("--chain") ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (chain.Length > 8 || chain.Any(name => name is not ("janray" or "ocd")))
            throw new ArgumentException("--chain accepts up to 8 comma-separated effects: janray,ocd.");
        if (chain.Length != 0 && (args.Contains("--tone") || args.Contains("--measure")))
            throw new ArgumentException("--chain cannot be combined with --tone or --measure.");
        var controlPort = Get("--control-port") is { } rawPort ? int.Parse(rawPort, CultureInfo.InvariantCulture) : (int?)null;
        if (controlPort is < 1024 or > 65535) throw new ArgumentException("--control-port must be between 1024 and 65535.");
        if (controlPort is not null && (args.Contains("--tone") || args.Contains("--measure") || args.Contains("--panel")))
            throw new ArgumentException("--control-port is for live guitar monitoring only.");
        var gain = float.TryParse(Get("--gain"), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) ? parsed : 0.5f;
        if (gain is < 0 or > 1) throw new ArgumentException("--gain must be from 0 to 1.");
        return new(args.Contains("--list"), args.Contains("--panel"), args.Contains("--measure"), args.Contains("--tone"), driver,
            Number("--input", 0), Number("--left", 0), Number("--right", 1), Number("--rate", 48000),
            Get("--buffer") is { } raw ? int.Parse(raw, CultureInfo.InvariantCulture) : null, gain, chain, controlPort);
    }
}
