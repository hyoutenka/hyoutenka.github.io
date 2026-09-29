// BA6110 VCA compressor approximation informed by the supplied Ibanez CP10
// schematic. The rectifier/control circuit is reduced to an envelope follower;
// browser audio sample values are not calibrated to the circuit's voltages.
class Cp10Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.params = { sustain: 55, attack: 40, level: 65 };
    this.states = [];
    this.port.onmessage = ({ data }) => {
      for (const key of Object.keys(this.params)) {
        if (Number.isFinite(data[key])) this.params[key] = Math.max(0, Math.min(100, data[key]));
      }
    };
  }

  process(inputs, outputs) {
    const source = inputs[0] || [], destination = outputs[0];
    if (!destination) return true;
    const p = this.params, sustain = p.sustain / 100;
    const coefficient = hz => 1 - Math.exp(-2 * Math.PI * hz / sampleRate);
    const inputA = coefficient(1 / (2 * Math.PI * 47000 * 2.2e-6));
    const detectorHighA = coefficient(45), detectorLowA = coefficient(4500);
    const attackSeconds = .003 + .077 * (p.attack / 100) ** 2;
    const attackA = 1 - Math.exp(-1 / (attackSeconds * sampleRate));
    const releaseA = 1 - Math.exp(-1 / (.38 * sampleRate));
    const vcaA = 1 - Math.exp(-1 / (.002 * sampleRate));
    const threshold = -9 - 27 * sustain;
    const ratio = 1.6 + 4.9 * sustain;
    const makeup = Math.pow(10, (1.5 + 9.5 * sustain) / 20);
    for (let channel = 0; channel < destination.length; channel++) {
      const src = source[channel] || source[0], dst = destination[channel];
      const state = this.states[channel] || (this.states[channel] = {
        inputLP: 0, detectorHighLP: 0, detectorLowLP: 0,
        envelope: 0, gain: 1, targetGain: 1, counter: 0
      });
      for (let i = 0; i < dst.length; i++) {
        const raw = src?.[i] || 0;
        state.inputLP += inputA * (raw - state.inputLP);
        const coupled = raw - state.inputLP;
        // The transistor/diode sidechain senses a frequency-limited, rectified
        // copy of the signal and charges/discharges its timing capacitor.
        state.detectorHighLP += detectorHighA * (coupled - state.detectorHighLP);
        const sensed = coupled - state.detectorHighLP;
        state.detectorLowLP += detectorLowA * (sensed - state.detectorLowLP);
        const rectified = Math.abs(state.detectorLowLP);
        state.envelope += (rectified - state.envelope) * (rectified > state.envelope ? attackA : releaseA);
        if ((state.counter++ & 15) === 0) {
          const db = 20 * Math.log10(state.envelope + 1e-8);
          const over = db - threshold;
          const knee = 6;
          let reduction = 0;
          if (over > knee / 2) reduction = (over - knee / 2) * (1 - 1 / ratio) + knee / 2 * (1 - 1 / ratio);
          else if (over > -knee / 2) reduction = (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee);
          state.targetGain = Math.pow(10, -reduction / 20);
        }
        state.gain += (state.targetGain - state.gain) * vcaA;
        const out = coupled * state.gain * makeup * p.level / 100;
        dst[i] = Math.max(-.98, Math.min(.98, out));
      }
    }
    return true;
  }
}

registerProcessor('cp10-compressor', Cp10Processor);
