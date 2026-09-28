class GuitarSawProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ring = new Float32Array(2048);
    this.samples = new Float32Array(1024);
    this.correlations = new Float32Array(256);
    this.pos = 0;
    this.counter = 0;
    this.phase = 0;
    this.freq = 220;
    this.env = 0;
    this.smooth = 220;
    this.hasPitch = false;
    this.time = 0;
    this.level = 0;
    this.attack = 145;
    this.release = 680;
    this.vibrato = 7;
    this.port.onmessage = ({ data }) => {
      this.attack = Math.max(20, Math.min(500, +data.attack || 145));
      this.release = Math.max(80, Math.min(1800, +data.release || 680));
      this.vibrato = Math.max(0, Math.min(30, +data.vibrato || 0));
    };
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
    if (rms < 0.008) { if (this.env < 0.01) this.hasPitch = false; return; }
    const rate = sampleRate / stride;
    const minLag = Math.floor(rate / 1100);
    const maxLag = Math.min(Math.floor(rate / 72), Math.floor(count / 2));
    let best = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let dot = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < count - lag; i += 2) {
        const a = this.samples[i], b = this.samples[i + lag];
        dot += a * b; e1 += a * a; e2 += b * b;
      }
      const score = dot / (Math.sqrt(e1 * e2) + 1e-10);
      this.correlations[lag] = score;
      if (score > best) best = score;
    }
    // Choose a real peak, not the rising shoulder before it; prefer the
    // earliest strong peak to reduce octave-down errors from harmonics.
    let peak = 0;
    if (best > 0.72) for (let lag = minLag + 1; lag < maxLag; lag++) {
      const c = this.correlations[lag];
      if (c >= this.correlations[lag - 1] && c > this.correlations[lag + 1] && c >= best - 0.10 && c > 0.72) { peak = lag; break; }
    }
    if (peak) {
      const a = this.correlations[peak - 1], b = this.correlations[peak], c = this.correlations[peak + 1];
      const offset = Math.max(-0.5, Math.min(0.5, 0.5 * (a - c) / (a - 2 * b + c || 1)));
      const next = rate / (peak + offset);
      if (next >= 72 && next <= 1100) {
        this.freq = next;
        if (!this.hasPitch) { this.smooth = next; this.hasPitch = true; }
        this.port.postMessage({ frequency: Math.round(next), confidence: +best.toFixed(2) });
      }
    }
  }
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    const mono = input && input[0];
    if (!output || !output[0]) return true;
    const attackStep = 1 - Math.exp(-1 / (this.attack * .001 * sampleRate));
    const releaseStep = 1 - Math.exp(-1 / (this.release * .001 * sampleRate));
    for (let i = 0; i < output[0].length; i++) {
      const sample = mono ? mono[i] || 0 : 0;
      this.ring[this.pos] = sample;
      this.pos = (this.pos + 1) % this.ring.length;
      if (++this.counter >= 1024) { this.counter = 0; this.detect(); }
      const target = this.level > 0.008 ? Math.min(0.7, Math.sqrt(this.level * 2) * 0.65) : 0;
      this.env += (target - this.env) * (target > this.env ? attackStep : releaseStep);
      this.smooth += (this.freq - this.smooth) * 0.0013;
      this.time += 1 / sampleRate;
      const rate = Math.max(72, this.smooth) * Math.pow(2, this.vibrato * Math.sin(2 * Math.PI * 5.1 * this.time) / 1200);
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
