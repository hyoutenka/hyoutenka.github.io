// Circuit-informed approximation of the Vemuram Jan Ray v1 schematic supplied
// by the user. Browser sample amplitudes are not calibrated to pedal volts.
class JanRayProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.parameters = { gain: 35, bass: 50, treble: 65, trim: 50, volume: 70 };
    this.states = Array.from({ length: 2 }, () => ({ inputLP: 0, bassLP: 0, feedbackLP: 0, trebleLP: 0, outputLP: 0 }));
    this.port.onmessage = ({ data }) => {
      for (const key of Object.keys(this.parameters)) {
        if (Number.isFinite(data[key])) this.parameters[key] = Math.max(0, Math.min(100, data[key]));
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0] || [], output = outputs[0];
    if (!output) return true;
    const p = this.parameters;
    const coefficient = hz => 1 - Math.exp(-2 * Math.PI * hz / sampleRate);
    // The input 47 nF capacitor sees the two 1 MOhm bias resistors in parallel.
    const inputA = coefficient(1 / (2 * Math.PI * 500000 * 47e-9));
    // Bass and the internal trim influence the low-frequency feedback path.
    // This one-pole pre-clipping cut approximates its frequency response.
    const bassA = coefficient(35 + 400 * (1 - p.bass / 100) ** 2);
    const rf = 3300 + 500000 * (p.gain / 100) ** 2;
    const rg = 9100 + 680 + 10000 * p.trim / 100;
    const feedbackA = coefficient(Math.min(sampleRate * 0.45, 1 / (2 * Math.PI * rf * 47e-12)));
    // 10 kOhm treble pot + 1.2 kOhm / 47 nF low-pass, then gain-of-two stage.
    const trebleA = coefficient(1 / (2 * Math.PI * (1200 + 10000 * (1 - p.treble / 100)) * 47e-9));
    const outputA = coefficient(1 / (2 * Math.PI * 10000 * 1e-6));
    for (let ch = 0; ch < output.length; ch++) {
      const source = input[ch] || input[0], target = output[ch];
      const state = this.states[ch] || (this.states[ch] = { inputLP: 0, bassLP: 0, feedbackLP: 0, trebleLP: 0, outputLP: 0 });
      for (let i = 0; i < target.length; i++) {
        const raw = (source?.[i] || 0) * 1.5;
        state.inputLP += inputA * (raw - state.inputLP);
        const coupled = raw - state.inputLP;
        state.bassLP += bassA * (coupled - state.bassLP);
        const driveInput = coupled - state.bassLP;
        const current = driveInput / rg;
        // At the virtual ground, input current flows through Rf and the
        // antiparallel diode pairs. Solve that feedback voltage per sample.
        let feedback = Math.max(-3.7, Math.min(3.7, current * rf));
        for (let step = 0; step < 4; step++) {
          // Smooth current through two opposed 1N4148 pairs. The softened
          // threshold stabilizes the numerical solve without object allocations.
          const z = (Math.abs(feedback) - 1.15) / 0.08;
          const ez = z < -18 ? Math.exp(z) : 0;
          const softplus = z > 18 ? z : z < -18 ? ez : Math.log1p(Math.exp(z));
          const sigmoid = z > 18 ? 1 : z < -18 ? ez : 1 / (1 + Math.exp(-z));
          const diodeCurrent = Math.sign(feedback) * 0.000016 * softplus;
          const diodeSlope = 0.0002 * sigmoid;
          feedback -= (feedback / rf + diodeCurrent - current) / (1 / rf + diodeSlope);
          feedback = Math.max(-3.7, Math.min(3.7, feedback));
        }
        state.feedbackLP += feedbackA * (feedback - state.feedbackLP);
        const firstStage = 3.7 * Math.tanh((driveInput + state.feedbackLP) / 3.7);
        state.trebleLP += trebleA * (firstStage - state.trebleLP);
        const amplified = state.trebleLP * 2;
        state.outputLP += outputA * (amplified - state.outputLP);
        target[i] = Math.tanh((amplified - state.outputLP) * 0.25 * p.volume / 100);
      }
    }
    return true;
  }
}

registerProcessor('jan-ray-circuit', JanRayProcessor);
