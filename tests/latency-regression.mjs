import assert from 'node:assert/strict';

globalThis.sampleRate = 48000;
globalThis.AudioWorkletProcessor = class {
  constructor() { this.port = { onmessage: null, postMessage() {} }; }
};
const processors = new Map();
globalThis.registerProcessor = (name, processor) => processors.set(name, processor);
await import('../pitch-worklet.js');

const Saw = processors.get('guitar-saw');
const saw = new Saw();
saw.port.onmessage({ data: { attack: 25, release: 680, vibrato: 0, waveform: 'saw' } });
const input = new Float32Array(128), output = new Float32Array(128);
for (let block = 0; block < 29; block++) {
  for (let i = 0; i < 128; i++) input[i] = .4 * Math.sin(2 * Math.PI * 220 * (block * 128 + i) / sampleRate);
  saw.process([[input]], [[output]]);
}
assert(saw.hasPitch, 'SAW should detect a steady guitar note within 77 ms');
assert(saw.env > .2, `SAW onset is too slow at 77 ms: ${saw.env}`);
console.log(`SAW onset at 77 ms: envelope ${saw.env.toFixed(2)}; pitch ${saw.freq.toFixed(1)} Hz.`);
