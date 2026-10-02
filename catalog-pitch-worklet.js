// Independent two-grain overlap-add pitch shifter. Its window introduces
// ~30–85 ms of latency; it is deliberately not described as a Whammy clone.
class CatalogPitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = 16384;
    this.buffers = [new Float32Array(this.size), new Float32Array(this.size)];
    this.write = 0;
    this.phase = 0;
    this.ratio = 2;
    this.window = Math.round(sampleRate * .052);
    this.port.onmessage = ({data}) => {
      this.ratio = Math.pow(2, Math.max(-12, Math.min(12, +data.semitones || 0)) / 12);
      this.window = Math.max(1024, Math.min(4096, Math.round(sampleRate * Math.max(30, Math.min(85, +data.window || 52)) / 1000)));
    };
  }
  read(buffer, offset) {
    const position = (this.write - offset + this.size * 3) % this.size;
    const i = Math.floor(position), fraction = position - i;
    return buffer[i] * (1 - fraction) + buffer[(i + 1) % this.size] * fraction;
  }
  process(inputs, outputs) {
    const input = inputs[0] || [], output = outputs[0] || [];
    if (!output.length) return true;
    for (let i = 0; i < output[0].length; i++) {
      for (let ch = 0; ch < output.length; ch++) this.buffers[Math.min(ch,1)][this.write] = input[ch]?.[i] || input[0]?.[i] || 0;
      const phase = this.phase;
      for (let ch = 0; ch < output.length; ch++) {
        const buffer = this.buffers[Math.min(ch,1)];
        let sum = 0, weight = 0;
        for (let grain = 0; grain < 2; grain++) {
          const position = (phase + grain * .5) % 1;
          const envelope = Math.sin(Math.PI * position) ** 2;
          const offset = this.window * (1.5 + position * (1 - this.ratio));
          sum += envelope * this.read(buffer, offset);
          weight += envelope;
        }
        output[ch][i] = sum / Math.max(.01, weight);
      }
      this.phase = (phase + 1 / this.window) % 1;
      this.write = (this.write + 1) % this.size;
    }
    return true;
  }
}
registerProcessor('catalog-pitch', CatalogPitchProcessor);

// Plays the previous short chunk backwards. Used only in wet echo paths.
class CatalogReverseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.length = Math.round(sampleRate * .18);
    this.buffers = Array.from({length:2},()=>[new Float32Array(this.length),new Float32Array(this.length)]);
    this.index = 0;
    this.active = 0;
  }
  process(inputs,outputs) {
    const input=inputs[0] || [], output=outputs[0] || [];
    if (!output.length) return true;
    for (let i=0;i<output[0].length;i++) {
      for (let ch=0;ch<output.length;ch++) {
        const channel=this.buffers[Math.min(ch,1)];
        channel[this.active][this.index]=input[ch]?.[i] ?? input[0]?.[i] ?? 0;
        output[ch][i]=channel[1-this.active][this.length-1-this.index];
      }
      if (++this.index>=this.length) { this.index=0; this.active=1-this.active; }
    }
    return true;
  }
}
registerProcessor('catalog-reverse', CatalogReverseProcessor);
