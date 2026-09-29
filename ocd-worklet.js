// Approximation of the user-supplied CircuitLab Fulltone OCD redraw.
// The AC path is modeled around its 4.5 V bias, with 2x oversampling.
// Browser audio samples are not calibrated to the pedal's voltage levels.
class OcdProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.params = { drive: 42, tone: 55, peak: 0, volume: 60 };
    this.states = [];
    this.port.onmessage = ({ data }) => {
      for (const key of Object.keys(this.params)) {
        if (Number.isFinite(data[key])) this.params[key] = Math.max(0, Math.min(key === 'peak' ? 1 : 100, data[key]));
      }
    };
  }

  process(inputs, outputs) {
    const source = inputs[0] || [], destination = outputs[0];
    if (!destination) return true;
    const p = this.params, rate = sampleRate * 2;
    const coef = hz => 1 - Math.exp(-2 * Math.PI * Math.min(hz, rate * 0.45) / rate);
    const inputA = coef(1 / (2 * Math.PI * 470000 * 22e-9));
    const driveA = coef(1 / (2 * Math.PI * 2200 * 68e-9));
    const rf = 20000 + 1000000 * (p.drive / 100) ** 2;
    const feedbackA = coef(1 / (2 * Math.PI * rf * 22e-12));
    const secondA = coef(1 / (2 * Math.PI * 39000 * 100e-9));
    const secondFeedbackA = coef(1 / (2 * Math.PI * 150000 * 220e-12));
    // SW3 parallels 22 kOhm with R12 (33 kOhm) in the HP position.
    const seriesR = p.peak ? 1 / (1 / 33000 + 1 / 22000) : 33000;
    const toneR = Math.max(1, 10000 * p.tone / 100);
    const toneA = coef(1 / (2 * Math.PI * (seriesR + toneR) * 47e-9));
    const toneShelf = toneR / (seriesR + toneR);
    const outputA = coef(1 / (2 * Math.PI * 500000 * 10e-6));
    for (let channel = 0; channel < destination.length; channel++) {
      const src = source[channel] || source[0], dst = destination[channel];
      const s = this.states[channel] || (this.states[channel] = { last: 0, inputLP: 0, driveLP: 0, feedbackLP: 0, secondLP: 0, secondFeedbackLP: 0, toneLP: 0, outputLP: 0 });
      for (let i = 0; i < dst.length; i++) {
        const raw = (src?.[i] || 0) * 1.5;
        let combined = 0;
        for (let sub = 0; sub < 2; sub++) {
          const sample = sub ? raw : (s.last + raw) * 0.5;
          s.inputLP += inputA * (sample - s.inputLP);
          const input = sample - s.inputLP;
          s.driveLP += driveA * (input - s.driveLP);
          const boosted = input - s.driveLP;
          s.feedbackLP += feedbackA * (boosted - s.feedbackLP);
          // OA3: R5 + Drive potentiometer over R4/C3, limited by 9 V rails.
          const first = 3.8 * Math.tanh((input + rf / 2200 * s.feedbackLP) / 3.8);
          // R7 (10 kOhm) feeds the D1 / opposed 2N7000 shunt to Vb.
          // The thresholds are approximate and slightly asymmetric.
          let clipped = first;
          for (let step = 0; step < 4; step++) {
            const threshold = clipped >= 0 ? 1.45 : 1.7;
            const z = (Math.abs(clipped) - threshold) / 0.1;
            const ez = z < -18 ? Math.exp(z) : 0;
            const softplus = z > 18 ? z : z < -18 ? ez : Math.log1p(Math.exp(z));
            const sigmoid = z > 18 ? 1 : z < -18 ? ez : 1 / (1 + Math.exp(-z));
            const current = Math.sign(clipped) * 0.000025 * softplus;
            const slope = 0.00025 * sigmoid;
            clipped -= (clipped + 10000 * current - first) / (1 + 10000 * slope);
            clipped = Math.max(-3.8, Math.min(3.8, clipped));
          }
          // OA6: 150 kOhm / 39 kOhm boost with 100 nF and 220 pF shaping.
          s.secondLP += secondA * (clipped - s.secondLP);
          s.secondFeedbackLP += secondFeedbackA * ((clipped - s.secondLP) - s.secondFeedbackLP);
          const second = 3.8 * Math.tanh((clipped + 150000 / 39000 * s.secondFeedbackLP) / 3.8);
          // Output coupling, HP/LP series resistors and the 47 nF / Tone shunt.
          s.outputLP += outputA * (second - s.outputLP);
          const coupled = second - s.outputLP;
          s.toneLP += toneA * (coupled - s.toneLP);
          const toned = s.toneLP + toneShelf * (coupled - s.toneLP);
          combined += Math.tanh(toned * 0.52 * p.volume / 100);
        }
        s.last = raw;
        dst[i] = combined * 0.5;
      }
    }
    return true;
  }
}

registerProcessor('ocd-circuit', OcdProcessor);
