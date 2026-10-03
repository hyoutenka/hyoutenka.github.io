import assert from 'node:assert/strict';
import { CATALOG_MODELS } from '../catalog-models.js';
import { makeCatalogUnit } from '../catalog-dsp.js';

const all = [];
class Param {
  value = 0;
  setTargetAtTime(value) { assert(Number.isFinite(value)); this.value = value; }
}
class Node {
  constructor(type) {
    this.type = type; this.connections = []; this.gain = new Param(); this.frequency = new Param();
    this.Q = new Param(); this.delayTime = new Param(); this.threshold = new Param();
    this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); this.knee = new Param();
    this.port = { messages: [], postMessage: value => this.port.messages.push(value) };
    all.push(this);
  }
  connect(node) { this.connections.push(node); return node; }
  start() {}
}
globalThis.AudioWorkletNode = class extends Node {
  constructor(_ctx, name) { super(name); }
};
const ctx = {
  currentTime: 0, sampleRate: 48000,
  createGain: () => new Node('gain'),
  createBiquadFilter: () => new Node('biquad'),
  createWaveShaper: () => new Node('waveshaper'),
  createDynamicsCompressor: () => new Node('compressor'),
  createOscillator: () => new Node('oscillator'),
  createDelay: () => new Node('delay'),
  createConvolver: () => new Node('convolver')
};
const impulse = () => ({ sampleRate: 48000 });
function unit(id, overrides = {}) {
  all.length = 0;
  const catalog = CATALOG_MODELS[id];
  const values = Object.fromEntries(Object.entries(catalog.params).map(([key, spec]) => [key, spec[3]]));
  Object.assign(values, overrides);
  const input = ctx.createGain(), output = ctx.createGain(), nodes = [], oscillators = [];
  const result = makeCatalogUnit(ctx, { type:id, catalog, values }, input, output, nodes, oscillators, impulse);
  return { result, values, input, output, nodes: [...all] };
}
for (const id of Object.keys(CATALOG_MODELS)) {
  const graph = unit(id);
  assert(graph.result.update, `${id}: update missing`);
  assert(graph.input.connections.length, `${id}: no input path`);
  graph.values.mix = 0;
  graph.result.update();
  graph.values.mix = 80;
  graph.result.update();
}

assert(!('tone' in CATALOG_MODELS.boss_od1.params));
const rat = unit('rat');
const ratCutoff = rat.nodes.find(n => n.type === 'lowpass');
rat.values.tone = 0; rat.result.update(); const bright = ratCutoff.frequency.value;
rat.values.tone = 100; rat.result.update(); assert(ratCutoff.frequency.value < bright);

const fork = unit('pitchfork', { mode: 2 });
const forkVoices = fork.nodes.filter(n => n.type === 'catalog-pitch');
assert.equal(forkVoices.length, 2);
assert.equal(forkVoices[0].port.messages.at(-1).semitones, 7);
assert.equal(forkVoices[1].port.messages.at(-1).semitones, -7);

const dd = unit('dd200', { mode: 3 });
assert.equal(dd.nodes.filter(n => n.type === 'delay').length, 2);
assert(dd.nodes.some(n => n.type === 'gain' && n.gain.value === .7));
dd.values.mode = 0; dd.result.update();
assert(dd.nodes.some(n => n.type === 'gain' && n.gain.value === 0));

const flux = unit('flux_echo', { mix: 0 });
assert(flux.nodes.filter(n => n.connections.includes(flux.output)).every(n => n.gain.value === 0 || n.gain.value === 1));

console.log(`Catalog graph checks passed: ${Object.keys(CATALOG_MODELS).length} models + control regressions.`);
