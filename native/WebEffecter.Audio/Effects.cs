// The first native ports of the browser's Jan Ray and OCD circuit approximations.
// State and coefficients are created before ASIO starts; Process does not allocate.
internal interface IAudioEffect
{
    float Process(float input);
}

internal static class CircuitMath
{
    internal static double Coefficient(double hz, int rate) => 1 - Math.Exp(-2 * Math.PI * Math.Min(hz, rate * 0.45) / rate);

    internal static double Softplus(double z) => z > 18 ? z : z < -18 ? Math.Exp(z) : Math.Log(1 + Math.Exp(z));
    internal static double Sigmoid(double z) => z > 18 ? 1 : z < -18 ? Math.Exp(z) : 1 / (1 + Math.Exp(-z));
}

internal sealed class JanRayEffect : IAudioEffect
{
    // Browser defaults: gain 35, bass 50, treble 65, trim 50, volume 70.
    private readonly double inputA, bassA, feedbackA, trebleA, outputA, rf, rg;
    private double inputLP, bassLP, feedbackLP, trebleLP, outputLP;

    internal JanRayEffect(int rate, double gain = 35, double bass = 50, double treble = 65, double trim = 50, double volume = 70)
    {
        inputA = CircuitMath.Coefficient(1 / (2 * Math.PI * 500000 * 47e-9), rate);
        bassA = CircuitMath.Coefficient(35 + 400 * Math.Pow(1 - bass / 100, 2), rate);
        rf = 3300 + 500000 * Math.Pow(gain / 100, 2);
        rg = 9100 + 680 + 10000 * trim / 100;
        feedbackA = CircuitMath.Coefficient(1 / (2 * Math.PI * rf * 47e-12), rate);
        trebleA = CircuitMath.Coefficient(1 / (2 * Math.PI * (1200 + 10000 * (1 - treble / 100)) * 47e-9), rate);
        outputA = CircuitMath.Coefficient(1 / (2 * Math.PI * 10000 * 1e-6), rate);
        this.volume = volume / 100;
    }

    private readonly double volume;

    public float Process(float sample)
    {
        var raw = sample * 1.5;
        inputLP += inputA * (raw - inputLP);
        var coupled = raw - inputLP;
        bassLP += bassA * (coupled - bassLP);
        var driveInput = coupled - bassLP;
        var current = driveInput / rg;
        var feedback = Math.Clamp(current * rf, -3.7, 3.7);
        for (var step = 0; step < 4; step++)
        {
            var z = (Math.Abs(feedback) - 1.15) / .08;
            var diodeCurrent = Math.Sign(feedback) * .000016 * CircuitMath.Softplus(z);
            var diodeSlope = .0002 * CircuitMath.Sigmoid(z);
            feedback -= (feedback / rf + diodeCurrent - current) / (1 / rf + diodeSlope);
            feedback = Math.Clamp(feedback, -3.7, 3.7);
        }
        feedbackLP += feedbackA * (feedback - feedbackLP);
        var firstStage = 3.7 * Math.Tanh((driveInput + feedbackLP) / 3.7);
        trebleLP += trebleA * (firstStage - trebleLP);
        var amplified = trebleLP * 2;
        outputLP += outputA * (amplified - outputLP);
        return (float)Math.Tanh((amplified - outputLP) * .25 * volume);
    }
}

internal sealed class OcdEffect : IAudioEffect
{
    // Browser defaults: drive 42, tone 55, LP switch position, volume 60.
    private readonly double inputA, driveA, feedbackA, secondA, secondFeedbackA, toneA, outputA, rf, toneShelf;
    private double last, inputLP, driveLP, feedbackLP, secondLP, secondFeedbackLP, toneLP, outputLP;

    internal OcdEffect(int sampleRate, double drive = 42, double tone = 55, double peak = 0, double volume = 60)
    {
        var rate = sampleRate * 2;
        inputA = CircuitMath.Coefficient(1 / (2 * Math.PI * 470000 * 22e-9), rate);
        driveA = CircuitMath.Coefficient(1 / (2 * Math.PI * 2200 * 68e-9), rate);
        rf = 20000 + 1000000 * Math.Pow(drive / 100, 2);
        feedbackA = CircuitMath.Coefficient(1 / (2 * Math.PI * rf * 22e-12), rate);
        secondA = CircuitMath.Coefficient(1 / (2 * Math.PI * 39000 * 100e-9), rate);
        secondFeedbackA = CircuitMath.Coefficient(1 / (2 * Math.PI * 150000 * 220e-12), rate);
        var seriesR = peak >= .5 ? 1 / (1 / 33000.0 + 1 / 22000.0) : 33000.0;
        var toneR = Math.Max(1, 10000 * tone / 100);
        toneA = CircuitMath.Coefficient(1 / (2 * Math.PI * (seriesR + toneR) * 47e-9), rate);
        toneShelf = toneR / (seriesR + toneR);
        outputA = CircuitMath.Coefficient(1 / (2 * Math.PI * 500000 * 10e-6), rate);
        this.volume = volume / 100;
    }

    private readonly double volume;

    public float Process(float sample)
    {
        var raw = sample * 1.5;
        var combined = 0.0;
        for (var sub = 0; sub < 2; sub++)
        {
            var current = sub == 0 ? (last + raw) * .5 : raw;
            inputLP += inputA * (current - inputLP);
            var input = current - inputLP;
            driveLP += driveA * (input - driveLP);
            var boosted = input - driveLP;
            feedbackLP += feedbackA * (boosted - feedbackLP);
            var first = 3.8 * Math.Tanh((input + rf / 2200 * feedbackLP) / 3.8);
            var clipped = first;
            for (var step = 0; step < 4; step++)
            {
                var threshold = clipped >= 0 ? 1.45 : 1.7;
                var z = (Math.Abs(clipped) - threshold) / .1;
                var diodeCurrent = Math.Sign(clipped) * .000025 * CircuitMath.Softplus(z);
                var diodeSlope = .00025 * CircuitMath.Sigmoid(z);
                clipped -= (clipped + 10000 * diodeCurrent - first) / (1 + 10000 * diodeSlope);
                clipped = Math.Clamp(clipped, -3.8, 3.8);
            }
            secondLP += secondA * (clipped - secondLP);
            secondFeedbackLP += secondFeedbackA * ((clipped - secondLP) - secondFeedbackLP);
            var second = 3.8 * Math.Tanh((clipped + 150000.0 / 39000 * secondFeedbackLP) / 3.8);
            outputLP += outputA * (second - outputLP);
            var coupled = second - outputLP;
            toneLP += toneA * (coupled - toneLP);
            var toned = toneLP + toneShelf * (coupled - toneLP);
            combined += Math.Tanh(toned * .52 * volume);
        }
        last = raw;
        return (float)(combined * .5);
    }
}
