import { DRIVE_VOICES } from './catalog-models.js';

// Readable Web Audio approximations of pedal families. Model-specific voicing
// changes the signal path; no manufacturer DSP or schematic artwork is used.
export function makeCatalogUnit(ctx, slot, input, output, nodes, oscillators, impulse) {
  const p = slot.values, model = slot.catalog, voice = model.voice;
  const add = node => { nodes.push(node); return node; };
  const gain = value => { const node = add(ctx.createGain()); node.gain.value = value; return node; };
  const filter = (type, frequency, q = .7) => {
    const node = add(ctx.createBiquadFilter()); node.type = type; node.frequency.value = frequency; node.Q.value = q; return node;
  };
  const wetDry = (source, amount) => {
    const dry = gain(1 - amount), wet = gain(amount);
    input.connect(dry).connect(output); source.connect(wet).connect(output);
    return { dry, wet };
  };
  const parameter = (audioParam, value) => audioParam.setTargetAtTime(value, ctx.currentTime, .012);
  if (model.engine === 'drive') {
    const v = DRIVE_VOICES[voice], hp = filter('highpass', v.hp), mid = filter('peaking', 900, .8);
    mid.gain.value = v.mid * 4;
    const pre = gain(1), shaper = add(ctx.createWaveShaper()), postFilter = filter('lowpass', v.lp);
    const post = gain(1), clean = v.clip === 'blend' ? gain(0) : null;
    const shape = new Float32Array(4096);
    for (let i = 0; i < shape.length; i++) {
      const x = i * 2 / (shape.length - 1) - 1;
      let y;
      switch (v.clip) {
        case 'hard': y = Math.max(-.78, Math.min(.78, x * 3)) / .78; break;
        case 'muff': y = Math.tanh(x * 7); break;
        case 'fuzz': y = Math.tanh(x * 9 + .13) - .13; break;
        case 'gated': y = Math.abs(x) < .12 ? 0 : Math.tanh(x * 10); break;
        case 'octave': y = Math.tanh(x * 8) * .72 + (Math.abs(Math.tanh(x * 5)) - .6) * .45; break;
        case 'asym': y = x > 0 ? Math.tanh(x * 2.7) : Math.tanh(x * 1.8); break;
        default: y = Math.tanh(x * 2.6); break;
      }
      shape[i] = Math.max(-1, Math.min(1, y));
    }
    shaper.curve = shape; shaper.oversample = '4x';
    input.connect(hp).connect(mid).connect(pre).connect(shaper);
    if (v.clip === 'muff') {
      const interstage = filter('highpass', 150), second = add(ctx.createWaveShaper());
      second.curve = new Float32Array(shape); second.oversample = '4x';
      shaper.connect(interstage).connect(second).connect(postFilter);
    } else shaper.connect(postFilter);
    postFilter.connect(post).connect(output);
    if (clean) input.connect(clean).connect(output);
    const update = () => {
      const amount = p.gain / 100;
      parameter(pre.gain, v.gain * (.9 + amount * 12));
      parameter(postFilter.frequency, Math.min(12000, Math.max(900, v.lp * (.32 + p.tone / 100))));
      parameter(post.gain, v.level * (.2 + p.level / 100 * .9) / (1 + amount * 1.1));
      if (clean) parameter(clean.gain, .33 * (1 - amount * .5));
    };
    update(); return { update };
  }
  if (model.engine === 'comp') {
    const comp = add(ctx.createDynamicsCompressor()), makeUp = gain(1);
    const {dry,wet} = wetDry(makeUp, p.blend / 100);
    input.connect(comp).connect(makeUp);
    const update = () => {
      parameter(comp.threshold, -12 - p.sustain * .36);
      parameter(comp.ratio, voice === 'ota' ? 4.5 : 3.5);
      parameter(comp.attack, p.attack / 1000);
      parameter(comp.release, .11 + p.sustain * .002);
      parameter(comp.knee, 12);
      parameter(makeUp.gain, (.65 + p.level / 100 * 1.6));
      parameter(dry.gain, 1 - p.blend / 100);
      parameter(wet.gain, p.blend / 100);
    }; update(); return {update};
  }
  if (model.engine === 'modulation') {
    const lfo = add(ctx.createOscillator()), depth = gain(0);
    lfo.type = voice === 'vibe' ? 'triangle' : 'sine';
    lfo.connect(depth); lfo.start(); oscillators.push(lfo);
    let wetSource, feedbackNode;
    if (['phaser','phaser2','vibe'].includes(voice)) {
      const stages = voice === 'vibe' ? 4 : voice === 'phaser2' ? 6 : 4;
      let cursor = input;
      for (let i = 0; i < stages; i++) {
        const ap = filter('allpass', 350 * 1.5 ** i, .5);
        const scale = gain(110 + i * 50);
        depth.connect(scale).connect(ap.frequency);
        cursor.connect(ap); cursor = ap;
      }
      wetSource = cursor;
    } else {
      const delay = add(ctx.createDelay(.08));
      delay.delayTime.value = voice === 'flanger' ? .005 : voice === 'dimension' ? .019 : .025;
      depth.connect(delay.delayTime);
      input.connect(delay); wetSource = delay;
      if (voice === 'flanger') { feedbackNode = gain(.2); delay.connect(feedbackNode).connect(delay); }
    }
    const {dry,wet} = wetDry(wetSource, p.mix / 100);
    const update = () => {
      parameter(lfo.frequency, voice === 'vibe' ? .1 + p.rate * .065 : .08 + p.rate * .047);
      parameter(depth.gain, ['phaser','phaser2','vibe'].includes(voice) ? p.depth / 100 : (voice === 'flanger' ? .003 : .008) * p.depth / 100);
      parameter(dry.gain, 1 - p.mix / 100); parameter(wet.gain, p.mix / 100);
      if (feedbackNode) parameter(feedbackNode.gain, p.feedback / 100 * .7);
    }; update(); return {update};
  }
  if (model.engine === 'tremolo') {
    const amp = gain(.75), lfo = add(ctx.createOscillator()), depth = gain(.25);
    lfo.type = voice === 'triangle' ? 'triangle' : 'sine';
    lfo.connect(depth).connect(amp.gain); lfo.start(); oscillators.push(lfo);
    input.connect(amp).connect(output);
    const update = () => { parameter(lfo.frequency, .3 + p.rate * .11); parameter(amp.gain, 1 - p.depth / 200); parameter(depth.gain, p.depth / 200); };
    update(); return {update};
  }
  if (model.engine === 'filter') {
    const wah = filter('bandpass', 900, 7), post = gain(1.5);
    input.connect(wah).connect(post);
    const {dry,wet} = wetDry(post, p.mix / 100);
    if (voice === 'envelope') {
      const rect = add(ctx.createWaveShaper()), smooth = filter('lowpass', 16), modulation = gain(1800);
      const curve = new Float32Array(256); for (let i=0;i<256;i++) curve[i] = Math.abs(2 * i / 255 - 1);
      rect.curve = curve; input.connect(rect).connect(smooth).connect(modulation).connect(wah.frequency);
    }
    const update = () => {
      parameter(wah.frequency, 280 + p.sweep * (voice === 'envelope' ? 6 : 22));
      parameter(wah.Q, p.resonance);
      parameter(dry.gain, 1 - p.mix / 100); parameter(wet.gain, p.mix / 100);
    }; update(); return {update};
  }
  if (model.engine === 'pitch') {
    const pitch = add(new AudioWorkletNode(ctx, 'catalog-pitch')), wet = gain(p.mix / 100), dry = gain(1 - p.mix / 100);
    input.connect(dry).connect(output); input.connect(pitch).connect(wet).connect(output);
    const update = () => { pitch.port.postMessage({semitones:p.semitones,window:p.window}); parameter(wet.gain,p.mix/100); parameter(dry.gain,1-p.mix/100); };
    update(); return {update};
  }
  if (model.engine === 'delay') {
    const delay = add(ctx.createDelay(1.4)), tone = filter('lowpass', 5500), feedback = gain(.35), wetTone = filter('lowpass', 8000);
    delay.connect(tone).connect(feedback).connect(delay);
    delay.connect(wetTone);
    const {dry,wet} = wetDry(wetTone, p.mix / 100);
    const lfo = ['tape','digital'].includes(voice) ? add(ctx.createOscillator()) : null;
    const wow = lfo ? gain(0) : null;
    if (lfo) { lfo.connect(wow).connect(delay.delayTime); lfo.frequency.value = 1.1; lfo.start(); oscillators.push(lfo); }
    const update = () => {
      const mode = p.mode || 0, color = voice === 'digital' ? ['digital','analog','tape','dual','mod','ambient'][mode] || 'digital' : voice;
      parameter(delay.delayTime, p.time / 1000);
      parameter(feedback.gain, Math.min(.85,p.feedback / 100));
      parameter(tone.frequency, Math.max(700, (color === 'analog' ? 2400 : color === 'tape' ? 3500 : 9500) * (.35 + p.tone / 100)));
      parameter(wetTone.frequency, color === 'analog' ? 3600 : 11500);
      if (wow) parameter(wow.gain, color === 'tape' ? .0023 : color === 'mod' ? .004 : 0);
      parameter(dry.gain, 1-p.mix/100); parameter(wet.gain,p.mix/100);
    }; update(); return {update};
  }
  if (model.engine === 'reverb' || model.engine === 'echoverb') {
    const isEcho = model.engine === 'echoverb';
    const pre = add(ctx.createDelay(.2)), convolver = add(ctx.createConvolver()), tone = filter('lowpass', 6400);
    const delay = isEcho ? add(ctx.createDelay(1.4)) : null;
    const feedback = isEcho ? gain(.34) : null;
    if (delay) { input.connect(delay); delay.connect(feedback).connect(delay); delay.connect(pre); }
    else input.connect(pre);
    pre.connect(convolver).connect(tone);
    const {dry,wet} = wetDry(tone, p.mix / 100);
    if (delay) { const echo = gain(.18); delay.connect(echo).connect(output); }
    let previous = '';
    const update = () => {
      const mode = p.mode || 0;
      const kind = voice === 'spring' ? ['spring','hall','flerb'][mode]
        : voice === 'hall' ? ['hall','room','plate','shimmer'][mode]
        : voice === 'plate' ? ['plate','room','spring','shimmer'][mode]
        : voice === 'flint' ? ['spring','plate','hall','room'][mode]
        : ['ambient','reverse','shimmer'][mode];
      const key = kind + ':' + p.decay;
      if (key !== previous) {
        const resonances = kind === 'spring' ? [[360,.8,15],[650,.6,17],[1150,.3,24]] : kind === 'shimmer' ? [[880,.3,7],[1320,.2,10]] : [];
        convolver.buffer = impulse(Math.min(5.5,p.decay), (kind === 'room' ? 7 : 4) / Math.max(1,p.decay), resonances);
        previous = key;
      }
      parameter(pre.delayTime, p.predelay / 1000);
      parameter(tone.frequency, 1000 + p.tone * 105);
      parameter(dry.gain, 1-p.mix/100); parameter(wet.gain,p.mix/100);
      if (delay) { parameter(delay.delayTime, voice === 'flint' ? .095 : mode === 1 ? .52 : .38); parameter(feedback.gain, voice === 'flint' ? .1 : .42); }
    }; update(); return {update};
  }
  input.connect(output);
  return {};
}
