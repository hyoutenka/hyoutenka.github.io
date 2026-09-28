class GuitarSawProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ring = new Float32Array(2048);
    this.samples = new Float32Array(1024);
    this.pos = 0;
    this.counter = 0;
    this.phase = 0;
    this.freq = 220;
    this.env = 0;
    this.smooth = 0;
    this.time = 0;
    this.level = 0;
  }
  detect() {
    // Downsample the last ~93 ms; normalized autocorrelation rejects weak/noisy notes.
    const stride = Math.max(1, Math.round(sampleRate / 11025));
    const count = Math.min(1024, Math.floor(this.ring.length / stride));
    let energy = 0;
    for (let i = 0; i < count; i++) {
      const x = this.ring[(this.pos - (count - i) * stride + this.ring.length * 4) % this.ring.length];
      this.samples[i] = x;
      energy += x * x;
    }
    const rms = Math.sqrt(energy / count);
    this.level = rms;
    if (rms < 0.008) return;
    const rate = sampleRate / stride;
    const minLag = Math.floor(rate / 1100);
    const maxLag = Math.min(Math.floor(rate / 72), Math.floor(count / 2));
    let best = 0, bestLag = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let dot = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < count - lag; i += 2) {
        const a = this.samples[i], b = this.samples[i + lag];
        dot += a * b; e1 += a * a; e2 += b * b;
      }
      const score = dot / (Math.sqrt(e1 * e2) + 1e-10);
      // Prefer the first strong peak to reduce octave errors.
      if (score > 0.86 && score > best - 0.025) { best = score; bestLag = lag; break; }
      if (score > best) { best = score; bestLag = lag; }
    }
    if (best > 0.69 && bestLag) {
      const next = rate / bestLag;
      if (next >= 72 && next <= 1100) {
        this.freq = next;
        this.port.postMessage({ frequency: Math.round(next), confidence: +best.toFixed(2) });
      }
    }
  }
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    const mono = input && input[0];
    if (!output || !output[0]) return true;
    for (let i = 0; i < output[0].length; i++) {
      const sample = mono ? mono[i] || 0 : 0;
      this.ring[this.pos] = sample;
      this.pos = (this.pos + 1) % this.ring.length;
      if (++this.counter >= 1024) { this.counter = 0; this.detect(); }
      const target = Math.min(0.65, Math.max(0, this.level * 4.5));
      this.env += (target - this.env) * (target > this.env ? 0.0017 : 0.00022);
      this.smooth += (this.freq - this.smooth) * 0.0008;
      this.time += 1 / sampleRate;
      const rate = Math.max(72, this.smooth || this.freq) * (1 + 0.003 * Math.sin(2 * Math.PI * 5.1 * this.time));
      this.phase += rate / sampleRate;
      if (this.phase >= 1) this.phase -= 1;
      // PolyBLEP softens the saw discontinuity and reduces high frequency aliasing.
      const dt = rate / sampleRate;
      let saw = 2 * this.phase - 1;
      if (this.phase < dt) { const t = this.phase / dt; saw -= t + t - t * t - 1; }
      else if (this.phase > 1 - dt) { const t = (this.phase - 1) / dt; saw -= t * t + t + t + 1; }
      const value = saw * this.env * 0.95;
      for (const channel of output) channel[i] = value;
    }
    return true;
  }
}
registerProcessor('guitar-saw', GuitarSawProcessor);
