const $ = (id) => document.getElementById(id);
const NAM_MODULE_URL = 'https://cdn.jsdelivr.net/npm/neural-amp-modeler-wasm@2.0.1/dist/engine/index.js';
const NAM_SOURCE = 'https://github.com/tone-3000/neural-amp-modeler-wasm';
const NAM_MODELS = {
  nam_ac10: { name: 'AC10 Capture', file: 'ac10.nam', ir: 'vox_ac30', note: '맑고 가벼운 브리티시 계열' },
  nam_deluxe: { name: 'Deluxe Capture', file: 'deluxe.nam', ir: 'fender_deluxe', note: '따뜻한 아메리칸 클린 계열' },
  nam_jcm: { name: 'JCM Capture', file: 'jcm.nam', ir: 'marshall_1960', note: '강한 미드레인지의 브리티시 드라이브 계열' }
};
const NAM_MODEL_BASE = 'https://raw.githubusercontent.com/tone-3000/neural-amp-modeler-wasm/a6c895049771bacc40c74dfa19369c2ebf75cdb1/ui/public/models/';
const CAB_IR_BASE = 'https://raw.githubusercontent.com/tone-3000/neural-amp-modeler-wasm/a6c895049771bacc40c74dfa19369c2ebf75cdb1/ui/public/irs/';
const CAB_IRS = {
  vox_ac30: { name: 'Vox AC30 2×12 · SM57', url: './irs/vox-ac30-2x12-sm57-mid.wav' },
  fender_deluxe: { name: 'Fender Deluxe 1×12 · SM57', url: './irs/fender-deluxe-1x12-sm57-mid.wav' },
  marshall_1960: { name: 'Marshall 1960 4×12 · SM57', url: './irs/marshall-1960-4x12-sm57-mid.wav' },
  celestion: { name: 'Celestion 예제', url: CAB_IR_BASE + 'celestion.wav' },
  mesa: { name: 'Mesa 예제', url: CAB_IR_BASE + 'mesa.wav' }
};
const EFFECTS = {
  compressor: { name: 'Compressor', category: 'DYNAMICS', symbol: '◫', description: '연주의 큰 소리와 작은 소리 차이를 줄입니다.', params: { threshold: ['Threshold', -40, 0, -22, 'dB'], ratio: ['Ratio', 1, 12, 4, ':1'] } },
  cp10: { name: 'CP10 Circuit', category: 'VCA COMPRESSOR', symbol: '▤', description: '첨부된 Ibanez CP10 회로 기반 근사: BA6110 가변 이득 증폭기와 정류·타이밍 회로를 모델링했습니다. Sustain은 압축 감도, Attack은 시작 속도, Level은 출력량을 조절합니다.', params: { sustain: ['Sustain', 0, 100, 55, '%'], attack: ['Attack', 0, 100, 40, '%'], level: ['Level', 0, 100, 65, '%'] } },
  drive: { name: 'Overdrive', category: 'GAIN', symbol: 'ϟ', description: '신호를 포화시켜 거친 배음을 만듭니다.', params: { gain: ['Drive', 0, 100, 35, '%'], tone: ['Tone', 0, 100, 55, '%'] } },
  janray: { name: 'Jan Ray Circuit', category: 'CIRCUIT DRIVE', symbol: '◇', description: '첨부된 Jan Ray V1.0 회로 기반 근사: 1N4148 피드백 클리핑 → Treble 필터 → 2단 증폭. Trim은 내부 트리머입니다. 실제 페달과 입력 전압은 보정되지 않았습니다.', params: { gain: ['Gain', 0, 100, 35, '%'], bass: ['Bass', 0, 100, 50, '%'], treble: ['Treble', 0, 100, 65, '%'], trim: ['Trim', 0, 100, 50, '%'], volume: ['Volume', 0, 100, 70, '%'] } },
  ocd: { name: 'OCD Circuit', category: 'MOSFET DRIVE', symbol: '⟐', description: '첨부된 Fulltone OCD 회로 기반 근사: 주파수 의존 증폭 → 2N7000 MOSFET 클리핑 → 2단 증폭 → Tone·HP/LP 출력망. HP/LP는 High Peak/Low Peak입니다.', params: { drive: ['Drive', 0, 100, 42, '%'], tone: ['Tone', 0, 100, 55, '%'], peak: ['Peak mode', 0, 1, 0, ''], volume: ['Volume', 0, 100, 60, '%'] } },
  eq: { name: 'Tone EQ', category: 'FILTER', symbol: '≋', description: '저음과 고음의 균형을 조절합니다.', params: { bass: ['Bass', -12, 12, 0, ' dB'], treble: ['Treble', -12, 12, 0, ' dB'] } },
  chorus: { name: 'Chorus', category: 'MODULATION', symbol: '≈', description: '짧게 흔들리는 복제 신호로 폭을 더합니다.', params: { rate: ['Rate', 1, 100, 35, '%'], mix: ['Mix', 0, 100, 40, '%'] } },
  delay: { name: 'Delay', category: 'TIME', symbol: '↝', description: '소리를 일정 시간 뒤에 반복합니다.', params: { time: ['Time', 60, 800, 320, ' ms'], feedback: ['Feedback', 0, 85, 35, '%'], mix: ['Mix', 0, 80, 25, '%'] } },
  reverb: { name: 'Reverb', category: 'SPACE', symbol: '⌁', description: '실내의 울림을 합성합니다.', params: { decay: ['Decay', 1, 6, 3, ' s'], mix: ['Mix', 0, 80, 27, '%'] } },
  tremolo: { name: 'Tremolo', category: 'MODULATION', symbol: '∿', description: '음량을 주기적으로 떨리게 합니다.', params: { rate: ['Rate', 1, 12, 5, ' Hz'], depth: ['Depth', 0, 100, 50, '%'] } },
  saw: { name: 'SAW Synth', category: 'WAVE CONVERT', symbol: '⋈', description: '기타 DI의 단음 피치와 세기를 따라 SAW 파형을 새로 만듭니다. Attack으로 소리가 시작되는 속도를 정하세요.', params: { attack: ['Attack', 20, 500, 145, ' ms'], release: ['Release', 80, 1800, 680, ' ms'], vibrato: ['Vibrato', 0, 30, 7, ' cent'], brightness: ['Brightness', 0, 100, 44, '%'] } },
  synth: { name: 'Mono Synth', category: 'PITCH SYNTH', symbol: '◈', description: '기타의 단음 피치와 세기를 추적해 Sine, Triangle, Square 파형으로 합성합니다. 화음 연주에는 적합하지 않습니다.', params: { waveform: ['Waveform', 0, 2, 0, ''], attack: ['Attack', 20, 500, 100, ' ms'], release: ['Release', 80, 1800, 450, ' ms'], brightness: ['Brightness', 0, 100, 60, '%'] } },
  amp: { name: 'Amp', category: 'PREAMP', symbol: '▥', description: '프리앰프의 저역 정리, 소프트 클리핑, 고역 롤오프를 간단히 모사합니다. 스피커 응답은 필요하면 뒤에 IR 블록을 추가하세요.', params: { gain: ['Gain', 0, 100, 35, '%'], tone: ['Tone', 0, 100, 55, '%'], level: ['Level', 0, 100, 60, '%'] } },
  ir: { name: 'IR', category: 'CONVOLUTION', symbol: '⌁', description: '불러온 임펄스 응답(IR)을 입력 신호에 적용합니다. 바이올린 바디 IR뿐 아니라 다른 악기·공간 IR도 사용할 수 있습니다.', params: { mix: ['IR mix', 0, 100, 100, '%'] } }
};
for (const [key, model] of Object.entries(NAM_MODELS)) EFFECTS[key] = {
  name: model.name, category: 'NEURAL AMP', symbol: '▦',
  description: `${model.note}. TONE3000의 공개 NAM 예제 캡처를 실시간으로 처리합니다. Input trim은 캡처에 들어가는 레벨이며 실제 앰프의 Gain 노브가 아닙니다. 캐비닛 소리는 뒤에 IR 블록을 연결하세요.`,
  params: { input: ['Input trim', -18, 18, 0, ' dB'], bass: ['Bass', -12, 12, 0, ' dB'], mid: ['Mid', -12, 12, 0, ' dB'], treble: ['Treble', -12, 12, 0, ' dB'], output: ['Output', -18, 18, -6, ' dB'] }
};
const CATEGORIES = [
  { id: 'compressor', label: 'Compressor', effects: ['compressor', 'cp10'] },
  { id: 'drive', label: 'Drive', effects: ['drive', 'janray', 'ocd'] },
  { id: 'delay', label: 'Delay', effects: ['delay'] },
  { id: 'reverb', label: 'Reverb', effects: ['reverb'] },
  { id: 'mod', label: 'Mod', effects: ['chorus', 'tremolo'] },
  { id: 'saw', label: 'SAW', effects: ['saw'] },
  { id: 'synth', label: 'Synth', effects: ['synth'] },
  { id: 'amp', label: 'Amp', effects: ['amp', 'nam_ac10', 'nam_deluxe', 'nam_jcm'] },
  { id: 'ir', label: 'IR', effects: ['ir'] },
  { id: 'eq', label: 'EQ', effects: ['eq'] }
];
const presets = {
  nam_ac10: ['nam_ac10', 'ir', null, null, null, null, null, null],
  nam_deluxe: ['nam_deluxe', 'ir', null, null, null, null, null, null],
  nam_jcm: ['nam_jcm', 'ir', null, null, null, null, null, null]
};
const newSlot = (type = null) => ({ type, bypass: false, values: type ? Object.fromEntries(Object.entries(EFFECTS[type].params).map(([k, v]) => [k, v[3]])) : {} });
let slots = Array.from({ length: 8 }, () => newSlot());
let selected = 0, pickerOpen = true, activeCategory = 'compressor', mode = 'device';
let ctx, sourceBus, inputAnalyser, outputAnalyser, master, muteGain, outputBus, mediaDest, stream, liveSource, fileBuffer, fileSource;
let units = [], chainGain = null, irBuffer = null, irSelection = 'body', activeOutput = 'default', animationId;
let isMuted = false, outputRoute = 'context';
let namEnginePromise; const namModelPromises = new Map(), namMessages = new WeakMap();
const sinkAudio = $('sink-audio');

function notify(message, error = false) { $('notice').textContent = message; $('notice').classList.toggle('error', error); }
function refreshLatencyInfo() {
  if (!ctx) return;
  const inputLatency = stream?.getAudioTracks()[0]?.getSettings().latency;
  const parts = [];
  if (Number.isFinite(inputLatency)) parts.push(`입력 ${Math.round(inputLatency * 1000)}ms`);
  if (Number.isFinite(ctx.baseLatency)) parts.push(`엔진 ${Math.round(ctx.baseLatency * 1000)}ms`);
  if (Number.isFinite(ctx.outputLatency)) parts.push(`출력 ${Math.round(ctx.outputLatency * 1000)}ms`);
  $('latency-status').textContent = `브라우저 지연 추정 · ${parts.length ? parts.join(' · ') : '측정값 없음'} · 실제 연주 지연은 장치에 따라 다릅니다.`;
}
function markCustom() { $('preset').value = 'custom'; }
function renderChain() {
  $('chain').replaceChildren(...slots.map((slot, i) => {
    const meta = slot.type && EFFECTS[slot.type];
    const wrap = document.createElement('div'); wrap.className = 'slot';
    const button = document.createElement('button'); button.type = 'button';
    button.className = `node ${meta ? '' : 'empty'} ${selected === i ? 'selected' : ''} ${slot.bypass ? 'off' : ''}`;
    button.setAttribute('aria-label', `${i + 1}번 슬롯, ${meta ? meta.name : '비어 있음'}${slot.bypass ? ', 바이패스' : ''}`);
    button.innerHTML = `<span class="node-number">${String(i + 1).padStart(2, '0')}</span><span class="node-symbol" aria-hidden="true">${meta ? meta.symbol : '+'}</span><span class="node-name">${meta ? meta.name : '이펙트 추가'}</span><span class="node-category">${meta ? meta.category : 'EMPTY SLOT'}</span>${slot.bypass ? '<span class="off-label">OFF</span>' : ''}`;
    button.onclick = () => { selected = i; pickerOpen = !slots[i].type; render(); };
    wrap.append(button); return wrap;
  }));
}
function renderEditor() {
  const slot = slots[selected], meta = slot.type && EFFECTS[slot.type];
  $('editor-index').textContent = `SLOT ${String(selected + 1).padStart(2, '0')}`;
  $('editor-title').textContent = meta && !pickerOpen ? meta.name : '이펙트 선택';
  $('effect-picker').hidden = !!meta && !pickerOpen;
  $('effect-controls').hidden = !meta || pickerOpen;
  $('bypass').hidden = !meta || pickerOpen;
  $('bypass').classList.toggle('active', !!slot.bypass);
  $('bypass').textContent = slot.bypass ? 'BYPASS ON' : 'BYPASS OFF';
  if (!meta || pickerOpen) renderPicker();
  if (!meta || pickerOpen) return;
  $('effect-description').textContent = meta.description;
  $('parameter-list').replaceChildren(...Object.entries(meta.params).map(([key, [label, min, max, initial, suffix]]) => {
    const group = document.createElement('div'); group.className = 'parameter';
    const id = `param-${selected}-${key}`;
    const value = slot.values[key] ?? initial;
    if (key === 'peak' && slot.type === 'ocd') {
      group.innerHTML = `<label id="${id}-label" for="${id}">${label}<output>${value ? 'HP' : 'LP'}</output></label><button id="${id}" class="peak-switch ${value ? 'hp' : ''}" type="button" role="switch" aria-checked="${!!value}" aria-labelledby="${id}-label"><span>LP</span><span>HP</span></button>`;
      const control = group.querySelector('button');
      control.onclick = () => {
        slot.values[key] = slot.values[key] ? 0 : 1;
        control.classList.toggle('hp', !!slot.values[key]);
        control.setAttribute('aria-checked', String(!!slot.values[key]));
        group.querySelector('output').textContent = slot.values[key] ? 'HP' : 'LP';
        markCustom(); const unit = units.find(u => u.slotIndex === selected); if (unit?.update) unit.update(); else rebuild();
      };
    } else if (key === 'waveform' && slot.type === 'synth') {
      group.innerHTML = `<label for="${id}">${label}</label><select id="${id}"><option value="0">Sine</option><option value="1">Triangle</option><option value="2">Square</option></select>`;
      const control = group.querySelector('select'); control.value = String(value);
      control.onchange = () => { slot.values[key] = +control.value; markCustom(); const unit = units.find(u => u.slotIndex === selected); if (unit?.update) unit.update(); else rebuild(); };
    } else {
      group.innerHTML = `<label for="${id}">${label}<output>${value}${suffix}</output></label><input id="${id}" type="range" min="${min}" max="${max}" value="${value}">`;
      const range = group.querySelector('input');
      range.oninput = () => { slot.values[key] = +range.value; group.querySelector('output').textContent = `${range.value}${suffix}`; markCustom(); const unit = units.find(u => u.slotIndex === selected); if (unit?.update) unit.update(); else rebuild(); };
    }
    return group;
  }));
  $('ir-panel').hidden = slot.type !== 'ir';
  if (slot.type === 'ir') $('ir-library').value = irSelection;
  $('ir-source').hidden = slot.type !== 'ir' || !['vox_ac30', 'fender_deluxe', 'marshall_1960'].includes(irSelection);
  $('nam-panel').hidden = !NAM_MODELS[slot.type];
  if (NAM_MODELS[slot.type]) { $('nam-source').href = NAM_SOURCE; $('nam-status').textContent = namMessages.get(slot) || (ctx ? '모델을 불러오는 중…' : '오디오 시작을 누르면 모델을 불러옵니다.'); }
}
function renderLiveSwitch() {
  const saw = slots.find(s => s.type === 'saw'), ir = slots.find(s => s.type === 'ir');
  const button = $('violin-switch'); button.hidden = !saw || !ir;
  const active = !!saw && !!ir && !saw.bypass && !ir.bypass;
  button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  button.firstChild.textContent = active ? 'VIOLIN ON ' : 'VIOLIN OFF ';
}
function render() { renderChain(); renderEditor(); renderLiveSwitch(); }
function setEffect(type) { slots[selected] = newSlot(type); pickerOpen = false; markCustom(); render(); rebuild(); }
function renderPicker() {
  if (!$('category-list').children.length) $('category-list').replaceChildren(...CATEGORIES.map(category => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'category-option';
    button.textContent = category.label;
    button.onclick = () => { activeCategory = category.id; renderPicker(); };
    return button;
  }));
  CATEGORIES.forEach((category, index) => {
    const button = $('category-list').children[index];
    button.classList.toggle('active', activeCategory === category.id);
    button.setAttribute('aria-pressed', String(activeCategory === category.id));
  });
  const category = CATEGORIES.find(item => item.id === activeCategory);
  $('category-heading').textContent = `${category.label} · ${category.effects.length}개 선택지`;
  $('effect-grid').replaceChildren(...category.effects.map(key => {
    const effect = EFFECTS[key], button = document.createElement('button'); button.className = 'effect-option'; button.type = 'button';
    button.innerHTML = `<span aria-hidden="true">${effect.symbol}</span><strong>${effect.name}</strong><small>${effect.category}</small>`;
    button.onclick = () => setEffect(key); return button;
  }));
  $('clear-slot').hidden = !slots[selected].type;
}
$('clear-slot').onclick = () => setEffect(null);
$('change-effect').onclick = () => { activeCategory = CATEGORIES.find(c => c.effects.includes(slots[selected].type))?.id || 'compressor'; pickerOpen = true; renderEditor(); };
$('bypass').onclick = () => { slots[selected].bypass = !slots[selected].bypass; markCustom(); render(); rebuild(); };
$('violin-switch').onclick = () => {
  const pair = slots.filter(s => s.type === 'saw' || s.type === 'ir');
  if (pair.length !== 2) return;
  const activate = pair.some(s => s.bypass);
  pair.forEach(s => { s.bypass = !activate; });
  markCustom(); render(); rebuild(); notify(activate ? '바이올린 체인을 켰습니다.' : '바이올린 체인을 껐습니다.');
};
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'v' || event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
  if (!$('violin-switch').hidden) { event.preventDefault(); $('violin-switch').click(); }
});
$('preset').onchange = (event) => {
  const key = event.target.value, preset = presets[key], model = NAM_MODELS[key]; if (!preset || !model) return;
  slots = preset.map(newSlot); selected = 0; pickerOpen = false; irBuffer = null; irSelection = model.ir;
  $('ir-name').textContent = `${CAB_IRS[irSelection].name} IR을 ${ctx ? '불러오는 중…' : '오디오 시작 시 불러옵니다.'}`;
  render(); rebuild(); if (ctx) void loadLibraryIR(irSelection);
  notify(`${model.name} → ${CAB_IRS[irSelection].name} IR 프리셋을 선택했습니다.`);
};

function namStatus(slot, message, error = false) {
  namMessages.set(slot, message);
  if (slots[selected] !== slot) return;
  $('nam-status').textContent = message;
  notify(message, error);
}
async function getNamEngine() {
  if (!namEnginePromise) namEnginePromise = import(NAM_MODULE_URL).then(({ NamEngine }) => NamEngine.attach(ctx)).catch(error => { namEnginePromise = null; throw error; });
  return namEnginePromise;
}
function getNamModel(type) {
  if (!namModelPromises.has(type)) namModelPromises.set(type, fetch(NAM_MODEL_BASE + NAM_MODELS[type].file).then(response => {
    if (!response.ok) throw new Error(`모델 요청 실패 (${response.status})`);
    return response.text();
  }).catch(error => { namModelPromises.delete(type); throw error; }));
  return namModelPromises.get(type);
}

function impulse(seconds, decay, resonances = []) {
  const length = Math.floor(ctx.sampleRate * seconds), buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
  // Deterministic impulse: no external samples or network requests.
  let seed = 1234567; const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296 * 2 - 1; };
  for (let i = 0; i < length; i++) {
    const t = i / ctx.sampleRate;
    let sample = rand() * Math.exp(-t * decay) * (1 - Math.exp(-t * 900));
    for (const [hz, strength, damping] of resonances) sample += Math.sin(2 * Math.PI * hz * t) * strength * Math.exp(-t * damping);
    data[i] = sample * 0.33;
  }
  data[0] = 0.6;
  return buffer;
}
function connectWet(input, wetNode, mix, output) {
  const dry = ctx.createGain(), wet = ctx.createGain(); dry.gain.value = 1 - mix; wet.gain.value = mix;
  input.connect(dry).connect(output); input.connect(wetNode); wetNode.connect(wet).connect(output);
  return { dry, wet };
}
function makeUnit(slot) {
  const input = ctx.createGain(), output = ctx.createGain(), p = slot.values, nodes = [input, output], oscillators = [];
  if (slot.bypass) { input.connect(output); return { input, output, nodes, oscillators }; }
  const add = (...items) => { nodes.push(...items); return items[0]; };
  if (NAM_MODELS[slot.type]) {
    const pre = add(ctx.createGain()), bass = add(ctx.createBiquadFilter()), mid = add(ctx.createBiquadFilter()), treble = add(ctx.createBiquadFilter()), post = add(ctx.createGain()), dry = add(ctx.createGain()), wet = add(ctx.createGain());
    bass.type = 'lowshelf'; bass.frequency.value = 180; mid.type = 'peaking'; mid.frequency.value = 800; mid.Q.value = .7; treble.type = 'highshelf'; treble.frequency.value = 2800;
    dry.gain.value = 1; wet.gain.value = 0; input.connect(dry).connect(output); input.connect(pre);
    const update = () => {
      pre.gain.setTargetAtTime(10 ** (p.input / 20), ctx.currentTime, .012);
      bass.gain.setTargetAtTime(p.bass, ctx.currentTime, .012); mid.gain.setTargetAtTime(p.mid, ctx.currentTime, .012); treble.gain.setTargetAtTime(p.treble, ctx.currentTime, .012);
      post.gain.setTargetAtTime(10 ** (p.output / 20), ctx.currentTime, .012);
    }; update();
    let disposed = false, namNode;
    Promise.all([getNamEngine(), getNamModel(slot.type)]).then(async ([engine, model]) => {
      if (disposed) return;
      namNode = await engine.createNode();
      if (disposed) { await namNode.dispose(); return; }
      const info = await namNode.loadModel(model);
      if (disposed) { await namNode.dispose(); return; }
      pre.connect(namNode).connect(bass).connect(mid).connect(treble).connect(post).connect(wet).connect(output);
      wet.gain.setTargetAtTime(1, ctx.currentTime, .015); dry.gain.setTargetAtTime(0, ctx.currentTime, .015);
      const mismatch = info?.expectedSampleRate > 0 && Math.abs(info.expectedSampleRate - ctx.sampleRate) > 1;
      namStatus(slot, mismatch ? `모델의 샘플레이트 ${info.expectedSampleRate} Hz와 오디오 엔진 ${ctx.sampleRate} Hz가 다릅니다.` : `${NAM_MODELS[slot.type].name} 로드 완료 · 캐비닛 IR은 별도 블록에서 선택하세요.`, mismatch);
    }).catch(error => { if (namNode && !disposed) void namNode.dispose(); if (!disposed) namStatus(slot, `NAM 모델 로드 실패: ${error.message}`, true); });
    const dispose = () => { disposed = true; if (namNode) void namNode.dispose(); };
    namStatus(slot, `${NAM_MODELS[slot.type].name} 불러오는 중…`);
    return { input, output, nodes, oscillators, update, dispose };
  }
  switch (slot.type) {
    case 'compressor': { const c = add(ctx.createDynamicsCompressor()); c.threshold.value = p.threshold; c.ratio.value = p.ratio; c.knee.value = 20; c.attack.value = .004; c.release.value = .16; input.connect(c).connect(output); break; }
    case 'cp10': { const circuit = add(new AudioWorkletNode(ctx, 'cp10-compressor'));
      input.connect(circuit).connect(output);
      const update = () => circuit.port.postMessage({ sustain: p.sustain, attack: p.attack, level: p.level });
      update(); return { input, output, nodes, oscillators, update };
    }
    case 'drive': { const pre = add(ctx.createGain()), shaper = add(ctx.createWaveShaper()), tone = add(ctx.createBiquadFilter()), post = add(ctx.createGain());
      pre.gain.value = 1 + p.gain / 8; const curve = new Float32Array(2048); for (let i = 0; i < curve.length; i++) { const x = 2 * i / (curve.length - 1) - 1; curve[i] = Math.tanh(x * (1 + p.gain / 13)); }
      shaper.curve = curve; shaper.oversample = '4x'; tone.type = 'lowpass'; tone.frequency.value = 900 + p.tone * 85; post.gain.value = .52;
      input.connect(pre).connect(shaper).connect(tone).connect(post).connect(output); break; }
    case 'amp': { const highpass = add(ctx.createBiquadFilter()), pre = add(ctx.createGain()), shaper = add(ctx.createWaveShaper()), tone = add(ctx.createBiquadFilter()), post = add(ctx.createGain());
      highpass.type = 'highpass'; highpass.frequency.value = 75; pre.gain.value = 1.5 + p.gain * .14;
      const curve = new Float32Array(2048); for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = Math.tanh(2.5 * x) / Math.tanh(2.5); }
      shaper.curve = curve; shaper.oversample = '4x'; tone.type = 'lowpass'; tone.frequency.value = 1500 + p.tone * 85; post.gain.value = (p.level / 100) * .38;
      input.connect(highpass).connect(pre).connect(shaper).connect(tone).connect(post).connect(output); break; }
    case 'janray': { const circuit = add(new AudioWorkletNode(ctx, 'jan-ray-circuit'));
      input.connect(circuit).connect(output);
      const update = () => circuit.port.postMessage({ gain: p.gain, bass: p.bass, treble: p.treble, trim: p.trim, volume: p.volume });
      update(); return { input, output, nodes, oscillators, update };
    }
    case 'ocd': { const circuit = add(new AudioWorkletNode(ctx, 'ocd-circuit'));
      input.connect(circuit).connect(output);
      const update = () => circuit.port.postMessage({ drive: p.drive, tone: p.tone, peak: p.peak, volume: p.volume });
      update(); return { input, output, nodes, oscillators, update };
    }
    case 'eq': { const low = add(ctx.createBiquadFilter()), high = add(ctx.createBiquadFilter()); low.type = 'lowshelf'; low.frequency.value = 250; low.gain.value = p.bass; high.type = 'highshelf'; high.frequency.value = 3200; high.gain.value = p.treble; input.connect(low).connect(high).connect(output); break; }
    case 'chorus': { const delay = add(ctx.createDelay(.08)), lfo = add(ctx.createOscillator()), depth = add(ctx.createGain()); delay.delayTime.value = .023; lfo.frequency.value = .15 + p.rate / 65; depth.gain.value = .0035; lfo.connect(depth).connect(delay.delayTime); lfo.start(); oscillators.push(lfo); const path = connectWet(input, delay, p.mix / 100, output); nodes.push(path.dry, path.wet); break; }
    case 'delay': { const delay = add(ctx.createDelay(1)), feedback = add(ctx.createGain()); delay.delayTime.value = p.time / 1000; feedback.gain.value = p.feedback / 100; delay.connect(feedback).connect(delay); const path = connectWet(input, delay, p.mix / 100, output); nodes.push(path.dry, path.wet); break; }
    case 'reverb': { const convolver = add(ctx.createConvolver()); convolver.buffer = impulse(p.decay, 6 / p.decay); const path = connectWet(input, convolver, p.mix / 100, output); nodes.push(path.dry, path.wet); break; }
    case 'tremolo': { const amp = add(ctx.createGain()), lfo = add(ctx.createOscillator()), depth = add(ctx.createGain()); amp.gain.value = 1 - p.depth / 200; depth.gain.value = p.depth / 200; lfo.frequency.value = p.rate; lfo.connect(depth).connect(amp.gain); lfo.start(); oscillators.push(lfo); input.connect(amp).connect(output); break; }
    case 'saw':
    case 'synth': { const synth = add(new AudioWorkletNode(ctx, 'guitar-saw')), filter = add(ctx.createBiquadFilter());
      filter.type = 'lowpass'; filter.Q.value = .55;
      input.connect(synth).connect(filter).connect(output);
      synth.port.onmessage = (event) => { $('signal-status').textContent = `${slot.type === 'saw' ? 'SAW' : 'Synth'} · 피치 추적 ${event.data.frequency} Hz`; };
      const update = () => { synth.port.postMessage({ attack: p.attack, release: p.release, vibrato: p.vibrato || 0, waveform: slot.type === 'saw' ? 'saw' : ['sine', 'triangle', 'square'][p.waveform] }); filter.frequency.setTargetAtTime(1100 + p.brightness * 65, ctx.currentTime, .012); };
      update(); return { input, output, nodes, oscillators, update };
    }
    case 'ir': { const convolver = add(ctx.createConvolver()), wet = add(ctx.createGain()), dry = add(ctx.createGain());
      const demo = impulse(.65, 19, [[285, 1.3, 14], [465, .9, 22], [690, .7, 33], [1120, .35, 43], [1680, .2, 60]]);
      convolver.buffer = irBuffer || (irSelection === 'body' ? demo : null);
      const amount = () => convolver.buffer ? p.mix / 100 : 0;
      wet.gain.value = amount(); dry.gain.value = 1 - amount();
      input.connect(convolver).connect(wet).connect(output); input.connect(dry).connect(output);
      const update = () => { wet.gain.setTargetAtTime(amount(), ctx.currentTime, .012); dry.gain.setTargetAtTime(1 - amount(), ctx.currentTime, .012); };
      const updateIR = () => { convolver.buffer = irBuffer || (irSelection === 'body' ? demo : null); update(); };
      update(); return { input, output, nodes, oscillators, update, updateIR };
    }
  }
  return { input, output, nodes, oscillators };
}
function rebuild() {
  if (!ctx) return;
  const previousUnits = units, previousGain = chainGain;
  units = slots.map((slot, index) => slot.type ? { ...makeUnit(slot), slotIndex: index } : null).filter(Boolean);
  chainGain = ctx.createGain(); chainGain.gain.value = previousGain ? 0 : 1;
  let cursor = inputAnalyser;
  for (const unit of units) { cursor.connect(unit.input); cursor = unit.output; }
  cursor.connect(chainGain).connect(master);
  if (previousGain) {
    const now = ctx.currentTime;
    previousGain.gain.setTargetAtTime(0, now, .009);
    chainGain.gain.setTargetAtTime(1, now, .009);
    setTimeout(() => {
      inputAnalyser.disconnect(previousUnits.length ? previousUnits[0].input : previousGain);
      for (const u of previousUnits) { u.dispose?.(); for (const o of u.oscillators) { try { o.stop(); } catch {} } for (const node of u.nodes) node.disconnect(); }
      previousGain.disconnect();
    }, 100);
  }
  $('signal-status').textContent = units.length ? `${units.length}개 이펙트 연결` : '드라이 신호';
}
async function startEngine() {
  if (ctx) { if (ctx.state !== 'running') await ctx.resume(); return; }
  if (!window.AudioContext) throw new Error('이 브라우저는 Web Audio를 지원하지 않습니다.');
  ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
  try {
    await ctx.audioWorklet.addModule(new URL('./pitch-worklet.js?v=waveforms-1', import.meta.url));
    await ctx.audioWorklet.addModule(new URL('./jan-ray-worklet.js', import.meta.url));
    await ctx.audioWorklet.addModule(new URL('./ocd-worklet.js', import.meta.url));
    await ctx.audioWorklet.addModule(new URL('./cp10-worklet.js', import.meta.url));
    sourceBus = ctx.createGain(); inputAnalyser = ctx.createAnalyser(); outputAnalyser = ctx.createAnalyser(); master = ctx.createGain(); muteGain = ctx.createGain(); outputBus = ctx.createGain();
    inputAnalyser.fftSize = outputAnalyser.fftSize = 512; master.gain.value = +$('master-volume').value / 100; muteGain.gain.value = isMuted ? 0 : 1;
    sourceBus.connect(inputAnalyser); master.connect(muteGain).connect(outputAnalyser).connect(outputBus); outputBus.connect(ctx.destination);
    rebuild(); await ctx.resume(); $('engine-state').textContent = 'ENGINE ON'; $('engine-state').classList.add('on'); $('power').textContent = '⏻ 오디오 실행 중'; refreshLatencyInfo();
    if (CAB_IRS[irSelection]) void loadLibraryIR(irSelection);
    meterLoop(); notify('오디오 엔진이 켜졌습니다. 입력 장치를 연결하거나 녹음 파일을 선택하세요.');
  } catch (error) { await ctx.close(); ctx = null; throw error; }
}
async function ensureEngine() { try { await startEngine(); return true; } catch (e) { notify(`오디오를 시작할 수 없습니다: ${e.message}`, true); return false; } }
$('power').onclick = ensureEngine;

function disconnectLive() { if (liveSource) { liveSource.disconnect(); liveSource = null; } if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } refreshLatencyInfo(); }
function stopFile() { if (fileSource) { fileSource.onended = null; try { fileSource.stop(); } catch {} fileSource.disconnect(); fileSource = null; } $('play-file').disabled = !fileBuffer; $('stop-file').disabled = true; }
async function refreshDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const currentInput = $('input-device').value, currentOutput = $('output-device').value;
  $('input-device').replaceChildren(...devices.filter(d => d.kind === 'audioinput').map((d, i) => new Option(d.label || `입력 ${i + 1}`, d.deviceId)));
  if (currentInput && [...$('input-device').options].some(o => o.value === currentInput)) $('input-device').value = currentInput;
  $('output-device').replaceChildren(new Option('시스템 기본 출력', 'default'), ...devices.filter(d => d.kind === 'audiooutput' && d.deviceId !== 'default').map((d, i) => new Option(d.label || `출력 ${i + 1}`, d.deviceId)));
  if ([...$('output-device').options].some(o => o.value === currentOutput)) $('output-device').value = currentOutput;
}
async function connectInput() {
  if (!await ensureEngine()) return;
  if (!navigator.mediaDevices?.getUserMedia) { notify('입력 장치 연결에는 HTTPS 또는 localhost가 필요합니다.', true); return; }
  const id = $('input-device').value;
  try {
    const nextStream = await navigator.mediaDevices.getUserMedia({ audio: { ...(id ? { deviceId: { exact: id } } : {}), echoCancellation: false, noiseSuppression: false, autoGainControl: false, latency: { ideal: 0.01 }, channelCount: { ideal: 1 }, sampleRate: { ideal: ctx.sampleRate } }, video: false });
    disconnectLive(); stopFile(); stream = nextStream; liveSource = ctx.createMediaStreamSource(stream);
    if (mode === 'device') liveSource.connect(sourceBus);
    await refreshDevices(); const settingsId = stream.getAudioTracks()[0].getSettings().deviceId;
    if (settingsId) $('input-device').value = settingsId;
    refreshLatencyInfo(); notify(`입력 연결: ${stream.getAudioTracks()[0].label || '오디오 인터페이스'}`);
  } catch (e) { notify(`입력 연결 실패: ${e.message}`, true); }
}
$('request-input').onclick = connectInput;
$('input-device').onchange = () => { if (stream) connectInput(); };
navigator.mediaDevices?.addEventListener?.('devicechange', () => refreshDevices().catch(() => {}));
async function routeOutput(id) {
  if (!await ensureEngine()) return;
  try {
    if (typeof ctx.setSinkId === 'function') {
      await ctx.setSinkId(id === 'default' ? '' : id);
      if (outputRoute === 'media') { sinkAudio.pause(); sinkAudio.srcObject = null; outputBus.disconnect(); outputBus.connect(ctx.destination); }
      outputRoute = 'context';
    } else if (id === 'default') {
      sinkAudio.pause(); sinkAudio.srcObject = null; outputBus.disconnect(); outputBus.connect(ctx.destination); outputRoute = 'context';
    } else {
      if (!sinkAudio.setSinkId) throw new Error('이 브라우저는 출력 장치 선택을 지원하지 않습니다.');
      if (!mediaDest) mediaDest = ctx.createMediaStreamDestination();
      await sinkAudio.setSinkId(id); sinkAudio.srcObject = mediaDest.stream; await sinkAudio.play();
      outputBus.disconnect(); outputBus.connect(mediaDest); outputRoute = 'media';
    }
    activeOutput = id; refreshLatencyInfo(); notify(id === 'default' ? '시스템 기본 출력으로 연결했습니다.' : '선택한 출력 장치로 연결했습니다.');
  } catch (e) { notify(`출력 변경 실패: ${e.message}`, true); $('output-device').value = activeOutput; }
}
$('output-device').onchange = (e) => routeOutput(e.target.value);
$('choose-output').onclick = async () => {
  if (!navigator.mediaDevices?.selectAudioOutput) { notify('이 브라우저는 출력 장치 선택 창을 지원하지 않습니다. 목록에서 장치를 선택하거나 시스템 기본 출력을 사용하세요.', true); return; }
  try { const device = await navigator.mediaDevices.selectAudioOutput(); await refreshDevices();
    if (![...$('output-device').options].some(o => o.value === device.deviceId)) $('output-device').add(new Option(device.label || '선택한 출력', device.deviceId));
    $('output-device').value = device.deviceId; await routeOutput(device.deviceId);
  } catch (e) { if (e.name !== 'NotAllowedError') notify(`장치를 선택할 수 없습니다: ${e.message}`, true); }
};
$('master-volume').oninput = (e) => { const value = +e.target.value; $('master-value').textContent = `${value}%`; if (master) master.gain.setTargetAtTime(value / 100, ctx.currentTime, .012); };
$('mute').onclick = () => {
  isMuted = !isMuted;
  $('mute').textContent = isMuted ? '뮤트 ON' : '뮤트 OFF';
  $('mute').classList.toggle('active', isMuted);
  $('mute').setAttribute('aria-pressed', String(isMuted));
  if (muteGain) muteGain.gain.setTargetAtTime(isMuted ? 0 : 1, ctx.currentTime, .005);
  notify(isMuted ? '출력을 음소거했습니다.' : '출력 음소거를 해제했습니다.');
};
function switchMode(next) {
  mode = next; $('tab-device').classList.toggle('active', next === 'device'); $('tab-file').classList.toggle('active', next === 'file');
  $('device-panel').hidden = next !== 'device'; $('file-panel').hidden = next !== 'file';
  if (next === 'file') { disconnectLive(); } else { stopFile(); }
  notify(next === 'file' ? '기타 DI 파일을 선택하세요.' : '입력 장치를 연결하세요.');
}
$('tab-device').onclick = () => switchMode('device'); $('tab-file').onclick = () => switchMode('file');
$('audio-file').onchange = async (e) => {
  const file = e.target.files?.[0]; stopFile(); fileBuffer = null;
  if (!file || !await ensureEngine()) return;
  try { fileBuffer = await ctx.decodeAudioData(await file.arrayBuffer()); $('file-name').textContent = `${file.name} · ${fileBuffer.duration.toFixed(1)}초`; $('play-file').disabled = false; notify('파일을 불러왔습니다. 재생을 누르면 체인을 통과합니다.'); }
  catch { notify('파일을 디코딩할 수 없습니다. 다른 오디오 형식으로 시도하세요.', true); }
};
$('play-file').onclick = async () => {
  if (!fileBuffer || !await ensureEngine()) return; stopFile(); fileSource = ctx.createBufferSource(); fileSource.buffer = fileBuffer; fileSource.loop = $('loop-file').checked;
  fileSource.connect(sourceBus); fileSource.onended = () => { if (fileSource) stopFile(); }; fileSource.start(); $('play-file').disabled = true; $('stop-file').disabled = false; notify('파일 재생 중');
};
$('stop-file').onclick = () => { stopFile(); notify('재생을 멈췄습니다.'); };
$('loop-file').onchange = (e) => { if (fileSource) fileSource.loop = e.target.checked; };
function refreshIRUnits() { for (const unit of units) unit.updateIR?.(); }
async function loadLibraryIR(selection) {
  try {
    const response = await fetch(new URL(CAB_IRS[selection].url, import.meta.url));
    if (!response.ok) throw new Error(`IR 요청 실패 (${response.status})`);
    const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
    if (selection !== irSelection) return;
    irBuffer = buffer; refreshIRUnits(); $('ir-name').textContent = `적용됨: ${CAB_IRS[selection].name} IR`;
    notify('캐비닛 IR을 적용했습니다.');
  } catch (error) { if (selection !== irSelection) return; irSelection = 'none'; $('ir-library').value = 'none'; $('ir-source').hidden = true; refreshIRUnits(); notify(`캐비닛 IR을 불러오지 못했습니다: ${error.message}`, true); }
}
$('ir-library').onchange = async (event) => {
  irSelection = event.target.value; irBuffer = null; refreshIRUnits(); markCustom();
  $('ir-source').hidden = !['vox_ac30', 'fender_deluxe', 'marshall_1960'].includes(irSelection);
  if (CAB_IRS[irSelection]) { $('ir-name').textContent = '캐비닛 IR을 불러오는 중…'; if (await ensureEngine()) void loadLibraryIR(irSelection); }
  else { $('ir-name').textContent = irSelection === 'none' ? 'IR을 사용하지 않습니다.' : '데모용 합성 바디 IR을 적용했습니다.'; notify($('ir-name').textContent); }
};
$('ir-file').onchange = async (e) => {
  const file = e.target.files?.[0]; if (!file || !await ensureEngine()) return;
  try { irBuffer = await ctx.decodeAudioData(await file.arrayBuffer()); irSelection = 'custom'; $('ir-library').value = 'custom'; $('ir-source').hidden = true; $('ir-name').textContent = `적용됨: ${file.name} (${irBuffer.duration.toFixed(2)}초)`; refreshIRUnits(); notify('사용자 IR을 적용했습니다.'); }
  catch { notify('IR 파일을 읽을 수 없습니다.', true); }
};
function meterLoop() {
  const data = new Uint8Array(512);
  const update = (analyser, element) => { analyser.getByteTimeDomainData(data); let energy = 0; for (const x of data) energy += ((x - 128) / 128) ** 2; const rms = Math.sqrt(energy / data.length); element.style.width = `${Math.min(100, rms * 270)}%`; };
  update(inputAnalyser, $('input-meter')); update(outputAnalyser, $('output-meter')); animationId = requestAnimationFrame(meterLoop);
}
render();
