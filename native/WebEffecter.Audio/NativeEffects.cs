using System.Text.Json;

// Native approximations keep every sample inside the ASIO callback. The catalog
// metadata is exported from catalog-models.js and embedded in the executable.
internal static class NativeEffectFactory
{
    internal sealed record Model(string Engine, string Voice, Dictionary<string, double> Defaults);
    internal sealed record DriveVoice(double Hp, double Mid, string Clip, double Gain, double Lp, double Level);
    private static readonly Dictionary<string, Model> models = new(StringComparer.OrdinalIgnoreCase);
    private static readonly Dictionary<string, DriveVoice> driveVoices = new(StringComparer.OrdinalIgnoreCase);
    private static readonly string[] basics =
        ["janray", "ocd", "compressor", "cp10", "drive", "eq", "chorus", "delay", "reverb", "tremolo", "amp", "saw", "synth"];

    static NativeEffectFactory()
    {
        using var stream = typeof(NativeEffectFactory).Assembly.GetManifestResourceStream("catalog-voices.json")
            ?? throw new InvalidOperationException("Embedded pedal catalog is missing.");
        using var document = JsonDocument.Parse(stream);
        foreach (var row in document.RootElement.GetProperty("models").EnumerateObject())
        {
            var fields = row.Value;
            var defaults = fields.GetProperty("defaults").EnumerateObject()
                .ToDictionary(p => p.Name, p => p.Value.GetDouble(), StringComparer.OrdinalIgnoreCase);
            models[row.Name] = new Model(fields.GetProperty("engine").GetString()!,
                fields.GetProperty("voice").GetString()!, defaults);
        }
        foreach (var row in document.RootElement.GetProperty("driveVoices").EnumerateObject())
        {
            var v = row.Value;
            driveVoices[row.Name] = new DriveVoice(v.GetProperty("hp").GetDouble(),
                v.GetProperty("mid").GetDouble(), v.GetProperty("clip").GetString()!,
                v.GetProperty("gain").GetDouble(), v.GetProperty("lp").GetDouble(),
                v.GetProperty("level").GetDouble());
        }
    }

    internal static string[] SupportedIds => basics.Concat(models.Keys.Where(id => models[id].Engine != "pitch"))
        .Append("ir").Order(StringComparer.Ordinal).ToArray();

    internal static IAudioEffect Create(string name, JsonElement values, int rate, float[]? impulse = null)
    {
        double P(string key, double fallback, double min = 0, double max = 100)
        {
            if (values.ValueKind != JsonValueKind.Object || !values.TryGetProperty(key, out var field)) return fallback;
            if (field.ValueKind != JsonValueKind.Number || !field.TryGetDouble(out var value) || !double.IsFinite(value) || value < min || value > max)
                throw new ArgumentException($"Invalid {name}.{key} value.");
            return value;
        }
        switch (name)
        {
            case "janray": return new JanRayEffect(rate, P("gain", 35), P("bass", 50), P("treble", 65), P("trim", 50), P("volume", 70));
            case "ocd": return new OcdEffect(rate, P("drive", 42), P("tone", 55), P("peak", 0, 0, 1), P("volume", 60));
            case "compressor": return new NativeCompressor(rate, P("threshold", -22, -40, 0), P("ratio", 4, 1, 12), 4, 160, 1, 1);
            case "cp10": return new NativeCompressor(rate, -9 - 27 * P("sustain", 55) / 100,
                1.6 + 4.9 * P("sustain", 55) / 100, 3 + .077 * Math.Pow(P("attack", 40) / 100, 2) * 1000,
                380, P("level", 65) / 100 * Math.Pow(10, (1.5 + 9.5 * P("sustain", 55) / 100) / 20), 1);
            case "drive": return new NativeDrive(rate, 1 + P("gain", 35) / 8, 900 + P("tone", 55) * 85, .52, "soft", 70);
            case "eq": return new NativeEq(rate, P("bass", 0, -12, 12), P("treble", 0, -12, 12));
            case "chorus": return new NativeModulation(rate, "chorus", P("rate", 35), 55, P("mix", 40), 0);
            case "delay": return new NativeDelay(rate, P("time", 320, 60, 800), P("feedback", 35, 0, 85), P("mix", 25, 0, 80), 10000);
            case "reverb": return new NativeReverb(rate, P("decay", 3, 1, 6), P("mix", 27, 0, 80), 50, 0);
            case "tremolo": return new NativeTremolo(rate, P("rate", 5, 1, 12), P("depth", 50), 0);
            case "amp": return new NativeAmp(rate, P("gain", 35), P("tone", 55), P("level", 60));
            case "saw": return new NativeSynth(rate, 0, P("attack", 25, 5, 500), P("release", 680, 80, 1800),
                P("vibrato", 7, 0, 30), P("brightness", 44));
            case "synth": return new NativeSynth(rate, (int)P("waveform", 0, 0, 2) + 1, P("attack", 20, 5, 500),
                P("release", 450, 80, 1800), 0, P("brightness", 60));
            case "ir": return new NativeIr(impulse, P("mix", 100) / 100);
        }
        if (!models.TryGetValue(name, out var model)) throw new ArgumentException($"Native engine does not support: {name}");
        double V(string key, double min = 0, double max = 100) => P(key,
            model.Defaults.TryGetValue(key, out var fallback) ? fallback : 0, min, max);
        switch (model.Engine)
        {
            case "drive":
            {
                var v = driveVoices[model.Voice];
                var gain = V("gain") / 100;
                var rat = name is "rat" or "rat2" or "turbo_rat" or "a3_groovim";
                var tone = V("tone");
                var cutoff = rat ? 9500 - tone * 78 : Math.Clamp(v.Lp * (.32 + tone / 100), 900, 12000);
                return new NativeDrive(rate, v.Gain * (.9 + gain * 12), cutoff,
                    v.Level * (.2 + V("level") / 100 * .9) / (1 + gain * 1.1), v.Clip, v.Hp,
                    v.Mid, v.Clip == "blend" ? .48 * (1 - gain * .74) : 0);
            }
            case "angel": return new NativeDrive(rate, 1 + V("gain") * .034, 5000 + V("treble") * 40,
                Math.Pow(V("volume") / 100, 1.4) * 1.35, "asym", 80, (V("bass") - 50) / 60);
            case "awesome": return new NativeDrive(rate, 1 + V("gain") * .065, 4500 + V("tone") * 55,
                Math.Pow(V("volume") / 100, 1.4) * 1.65, "blend", 170, 1, .45);
            case "groovim": return new NativeDrive(rate, .65 + V("gain") * .058, 9200 - V("filter") * 72,
                Math.Pow(V("volume") / 100, 1.4) * 1.2, "hard", 95, 1.8);
            case "comp": return new NativeCompressor(rate, -(name == "ross_comp" ? 15 : 12) - V("sustain") * .36,
                name == "ross_comp" ? 5 : 4.5, V("attack", 1), name == "ross_comp" ? 220 : 160,
                .65 + V("level") / 100 * 1.5, V("blend") / 100);
            case "delay":
            {
                var mode = V("mode", 0, 5);
                var dark = model.Voice == "analog" || mode == 1;
                var cutoff = dark ? name == "dm2" ? 2300 : 3300 : model.Voice == "tape" || mode == 2 ? 3500 : 9500;
                return new NativeDelay(rate, V("time", 50, 1200), V("feedback", 0, 85),
                    V("mix", 0, 80), Math.Max(700, cutoff * (.35 + V("tone") / 100)));
            }
            case "reverb":
            case "echoverb": return new NativeReverb(rate, V("decay", 1, 10), V("mix", 0, 80),
                V("tone"), V("predelay", 0, 150));
            case "tremolo": return new NativeTremolo(rate, .3 + V("rate", 1, 120) * .11,
                V("depth"), V("shape"));
            case "modulation": return new NativeModulation(rate, model.Voice,
                V("rate", 1), V("depth"), V("mix"), V("feedback", 0, 80));
            case "filter": return new NativeWah(rate, model.Voice == "envelope",
                V("sweep"), V("resonance", 1, 18), V("mix"));
            default: throw new ArgumentException($"Native engine does not support: {name}");
        }
    }
}

internal sealed class NativeDrive : IAudioEffect
{
    private readonly double pre, post, hpA, lpA, mid, clean;
    private readonly string clip;
    private double hpState, lpState;
    internal NativeDrive(int rate, double pre, double cutoff, double post, string clip, double hp = 75, double mid = 0, double clean = 0)
    {
        this.pre = pre; this.post = post; this.clip = clip; this.mid = mid; this.clean = clean;
        hpA = CircuitMath.Coefficient(hp, rate); lpA = CircuitMath.Coefficient(Math.Max(700, cutoff), rate);
    }
    public float Process(float input)
    {
        hpState += hpA * (input - hpState);
        var focused = (input - hpState) * (1 + mid * .15);
        var x = focused * pre;
        var shaped = clip switch
        {
            "hard" => Math.Clamp(x * 1.4, -.78, .78) / .78,
            "muff" => Math.Tanh(x * 4),
            "fuzz" => Math.Tanh(x * 6 + .13) - .13,
            "gated" => Math.Abs(x) < .12 ? 0 : Math.Tanh(x * 7),
            "octave" => Math.Tanh(x * 5) * .72 + (Math.Abs(Math.Tanh(x * 4)) - .6) * .45,
            "asym" => Math.Tanh(x * (x > 0 ? 2.7 : 1.8)),
            _ => Math.Tanh(x * 2.6)
        };
        lpState += lpA * (shaped - lpState);
        return (float)Math.Clamp(lpState * post + input * clean, -1, 1);
    }
}

internal sealed class NativeCompressor : IAudioEffect
{
    private readonly double threshold, ratio, attackA, releaseA, makeup, blend;
    private double envelope;
    internal NativeCompressor(int rate, double threshold, double ratio, double attackMs, double releaseMs, double makeup, double blend)
    {
        this.threshold = threshold; this.ratio = ratio; this.makeup = makeup; this.blend = blend;
        attackA = 1 - Math.Exp(-1 / (Math.Max(1, attackMs) * .001 * rate));
        releaseA = 1 - Math.Exp(-1 / (Math.Max(20, releaseMs) * .001 * rate));
    }
    public float Process(float input)
    {
        var magnitude = Math.Abs(input);
        envelope += (magnitude - envelope) * (magnitude > envelope ? attackA : releaseA);
        var over = 20 * Math.Log10(envelope + 1e-8) - threshold;
        var reduction = Math.Max(0, over) * (1 - 1 / ratio);
        var wet = input * makeup * Math.Pow(10, -reduction / 20);
        return (float)Math.Clamp(input * (1 - blend) + wet * blend, -1, 1);
    }
}

internal sealed class NativeEq : IAudioEffect
{
    private readonly double lowGain, highGain, lowA, highA;
    private double low, highCut;
    internal NativeEq(int rate, double bass, double treble)
    {
        lowGain = Math.Pow(10, bass / 20); highGain = Math.Pow(10, treble / 20);
        lowA = CircuitMath.Coefficient(250, rate); highA = CircuitMath.Coefficient(3200, rate);
    }
    public float Process(float input)
    {
        low += lowA * (input - low);
        highCut += highA * (input - highCut);
        return (float)(input + low * (lowGain - 1) + (input - highCut) * (highGain - 1));
    }
}

internal sealed class NativeAmp : IAudioEffect
{
    private readonly double hpA, toneA, drive, level;
    private double hp, lp;
    internal NativeAmp(int rate, double gain, double tone, double level)
    {
        hpA = CircuitMath.Coefficient(75, rate);
        toneA = CircuitMath.Coefficient(1500 + tone * 85, rate);
        drive = 1.5 + gain * .14; this.level = level / 100 * .38;
    }
    public float Process(float input)
    {
        hp += hpA * (input - hp);
        var driven = Math.Tanh((input - hp) * drive * 2.5) / Math.Tanh(2.5);
        lp += toneA * (driven - lp);
        return (float)(lp * level);
    }
}

internal sealed class NativeTremolo : IAudioEffect
{
    private readonly double step, depth, shape;
    private double phase;
    internal NativeTremolo(int rate, double hz, double depth, double shape)
    {
        step = hz / rate; this.depth = depth / 100; this.shape = shape;
    }
    public float Process(float input)
    {
        phase += step; if (phase >= 1) phase -= 1;
        var wave = shape > 75 ? (phase < .5 ? 1 : -1)
            : shape < 28 ? 1 - 4 * Math.Abs(phase - .5) : Math.Sin(2 * Math.PI * phase);
        return (float)(input * (1 - depth / 2 + wave * depth / 2));
    }
}

internal sealed class NativeDelay : IAudioEffect
{
    private readonly float[] line;
    private readonly int length;
    private readonly double feedback, mix, toneA;
    private int position;
    private double filtered;
    internal NativeDelay(int rate, double timeMs, double feedback, double mix, double cutoff)
    {
        line = new float[(int)(rate * 1.25) + 2];
        length = Math.Clamp((int)(timeMs * rate / 1000), 1, line.Length - 1);
        this.feedback = Math.Clamp(feedback / 100, 0, .85);
        this.mix = Math.Clamp(mix / 100, 0, .8);
        toneA = CircuitMath.Coefficient(cutoff, rate);
    }
    public float Process(float input)
    {
        var read = position - length;
        if (read < 0) read += line.Length;
        filtered += toneA * (line[read] - filtered);
        line[position] = (float)Math.Clamp(input + filtered * feedback, -1, 1);
        if (++position == line.Length) position = 0;
        return (float)(input * (1 - mix) + filtered * mix);
    }
}

// Four short feedback combs make an audible room tail. No dynamic allocation
// or graph rebuild occurs on the ASIO thread, and the dry guitar stays direct.
internal sealed class NativeReverb : IAudioEffect
{
    private readonly float[][] combs;
    private readonly int[] indices = new int[4];
    private readonly float[] predelay;
    private readonly double feedback, mix, toneA;
    private int prePosition;
    private double lowpassed;
    internal NativeReverb(int rate, double decay, double mix, double tone, double predelayMs)
    {
        combs = [new float[(int)(rate * .0297) | 1], new float[(int)(rate * .0371) | 1],
            new float[(int)(rate * .0411) | 1], new float[(int)(rate * .0437) | 1]];
        predelay = new float[Math.Max(1, (int)(rate * predelayMs / 1000))];
        feedback = Math.Clamp(Math.Pow(.001, .039 / Math.Max(.5, decay)), .55, .94);
        this.mix = Math.Clamp(mix / 100, 0, .8);
        toneA = CircuitMath.Coefficient(1000 + tone * 105, rate);
    }
    public float Process(float input)
    {
        var pre = predelay[prePosition];
        predelay[prePosition] = input;
        if (++prePosition == predelay.Length) prePosition = 0;
        var wet = 0.0;
        for (var i = 0; i < combs.Length; i++)
        {
            var line = combs[i];
            var delayed = line[indices[i]];
            line[indices[i]] = (float)Math.Clamp(pre + delayed * feedback, -1, 1);
            if (++indices[i] == line.Length) indices[i] = 0;
            wet += delayed * .25;
        }
        lowpassed += toneA * (wet - lowpassed);
        return (float)Math.Clamp(input * (1 - mix) + lowpassed * mix * 1.15, -1, 1);
    }
}

internal sealed class NativeModulation : IAudioEffect
{
    private readonly float[] line;
    private readonly int rate;
    private readonly string voice;
    private readonly double speed, depth, mix, feedback;
    private int position;
    private double phase, previous;
    internal NativeModulation(int rate, string voice, double speed, double depth, double mix, double feedback)
    {
        this.rate = rate; this.voice = voice;
        this.speed = (voice == "dimension" ? .04 + speed * .013 : .08 + speed * .047) / rate;
        this.depth = depth / 100; this.mix = mix / 100; this.feedback = feedback / 100 * .5;
        line = new float[(int)(rate * .08) + 4];
    }
    public float Process(float input)
    {
        phase += speed; if (phase >= 1) phase -= 1;
        var lfo = Math.Sin(phase * 2 * Math.PI);
        var baseSeconds = voice switch { "flanger" => .005, "chorus2" => .033, "dimension" => .019, _ => .022 };
        var swing = voice switch { "flanger" => .003, "chorus2" => .013, "dimension" => .004, _ => .007 };
        var offset = Math.Clamp((int)((baseSeconds + swing * depth * lfo) * rate), 1, line.Length - 2);
        var read = position - offset;
        if (read < 0) read += line.Length;
        var delayed = line[read];
        line[position] = (float)Math.Clamp(input + previous * feedback, -1, 1);
        if (++position == line.Length) position = 0;
        previous = delayed;
        return (float)(input * (1 - mix) + delayed * mix);
    }
}

internal sealed class NativeWah : IAudioEffect
{
    private readonly bool envelope;
    private readonly int rate;
    private readonly double sweep, resonance, mix;
    private double env, low, band;
    internal NativeWah(int rate, bool envelope, double sweep, double resonance, double mix)
    {
        this.rate = rate; this.envelope = envelope;
        this.sweep = sweep; this.resonance = resonance; this.mix = mix / 100;
    }
    public float Process(float input)
    {
        env += .001 * (Math.Abs(input) - env);
        var frequency = Math.Clamp(280 + sweep * (envelope ? 6 : 22) + (envelope ? env * 1800 : 0), 80, rate * .2);
        var f = 2 * Math.Sin(Math.PI * frequency / rate);
        band += f * (input - low - band / Math.Max(1, resonance));
        low += f * band;
        return (float)Math.Clamp(input * (1 - mix) + band * mix * 1.5, -1, 1);
    }
}

// The same 2048-sample ring and normalized autocorrelation shape used by the
// browser saw worklet. Pitch is mono and the new oscillator is zero-buffered.
internal sealed class NativeSynth : IAudioEffect
{
    private readonly float[] ring = new float[2048];
    private readonly float[] samples = new float[1024];
    private readonly double[] correlations = new double[256];
    private readonly int rate, waveform, stride, count;
    private readonly double attackA, releaseA, vibrato, brightnessA;
    private int position, counter;
    private double frequency = 220, smooth = 220, level, envelope, phase, time, brightnessState;
    private bool hasPitch;
    internal NativeSynth(int rate, int waveform, double attackMs, double releaseMs, double vibrato, double brightness)
    {
        this.rate = rate; this.waveform = waveform; this.vibrato = vibrato;
        stride = Math.Max(1, (int)Math.Round(rate / 11025.0));
        count = Math.Min(1024, ring.Length / stride);
        attackA = 1 - Math.Exp(-1 / (attackMs * .001 * rate));
        releaseA = 1 - Math.Exp(-1 / (releaseMs * .001 * rate));
        brightnessA = CircuitMath.Coefficient(1100 + brightness * 65, rate);
    }
    private void Detect()
    {
        double energy = 0;
        for (var i = 0; i < count; i++)
        {
            var index = (position - (count - i) * stride + ring.Length * 4) % ring.Length;
            var x = ring[index];
            samples[i] = x; energy += x * x;
        }
        level = Math.Sqrt(energy / count);
        if (level < .008) { if (envelope < .01) hasPitch = false; return; }
        var effectiveRate = rate / (double)stride;
        var minLag = (int)(effectiveRate / 1100);
        var maxLag = Math.Min((int)(effectiveRate / 72), count / 2);
        double best = 0;
        for (var lag = minLag; lag <= maxLag; lag++)
        {
            double dot = 0, aEnergy = 0, bEnergy = 0;
            for (var i = 0; i < count - lag; i += 2)
            {
                var a = samples[i]; var b = samples[i + lag];
                dot += a * b; aEnergy += a * a; bEnergy += b * b;
            }
            var score = dot / (Math.Sqrt(aEnergy * bEnergy) + 1e-10);
            correlations[lag] = score;
            if (score > best) best = score;
        }
        if (best <= .72) return;
        for (var lag = minLag + 1; lag < maxLag; lag++)
        {
            if (correlations[lag] < correlations[lag - 1] || correlations[lag] <= correlations[lag + 1]
                || correlations[lag] < best - .10 || correlations[lag] <= .72) continue;
            var a = correlations[lag - 1]; var b = correlations[lag]; var c = correlations[lag + 1];
            var denominator = a - 2 * b + c;
            var offset = Math.Clamp(.5 * (a - c) / (Math.Abs(denominator) < 1e-9 ? 1 : denominator), -.5, .5);
            var next = effectiveRate / (lag + offset);
            if (next >= 72 && next <= 1100)
            {
                frequency = next;
                if (!hasPitch) { smooth = next; hasPitch = true; }
            }
            break;
        }
    }
    public float Process(float input)
    {
        ring[position] = input;
        if (++position == ring.Length) position = 0;
        if (++counter >= 512) { counter = 0; Detect(); }
        var target = level > .008 ? Math.Min(.7, Math.Sqrt(level * 2) * .65) : 0;
        envelope += (target - envelope) * (target > envelope ? attackA : releaseA);
        smooth += (frequency - smooth) * .0013;
        time += 1.0 / rate;
        var hz = Math.Max(72, smooth) * Math.Pow(2, vibrato * Math.Sin(2 * Math.PI * 5.1 * time) / 1200);
        var dt = hz / rate;
        phase += dt; if (phase >= 1) phase -= 1;
        var saw = 2 * phase - 1;
        if (phase < dt) { var t = phase / dt; saw -= t + t - t * t - 1; }
        else if (phase > 1 - dt) { var t = (phase - 1) / dt; saw -= t * t + t + t + 1; }
        var wave = waveform switch
        {
            1 => Math.Sin(2 * Math.PI * phase),
            2 => 1 - 4 * Math.Abs(phase - .5),
            3 => Math.Tanh(5 * Math.Sin(2 * Math.PI * phase)),
            _ => saw
        };
        var output = wave * envelope * .95;
        brightnessState += brightnessA * (output - brightnessState);
        return (float)brightnessState;
    }
}

internal sealed class NativeIr : IAudioEffect
{
    private readonly float[]? impulse, history;
    private readonly double mix;
    private int position;
    internal NativeIr(float[]? impulse, double mix)
    {
        this.impulse = impulse;
        this.mix = impulse is null ? 0 : mix;
        history = new float[impulse?.Length ?? 1];
    }
    public float Process(float input)
    {
        if (impulse is null) return input;
        history[position] = input;
        double sum = 0;
        for (var i = 0; i < impulse.Length; i++)
        {
            var index = position - i;
            if (index < 0) index += history.Length;
            sum += history[index] * impulse[i];
        }
        if (++position == history.Length) position = 0;
        return (float)Math.Clamp(input * (1 - mix) + sum * mix, -1, 1);
    }
}
