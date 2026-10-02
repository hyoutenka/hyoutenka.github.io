import { CATALOG_MODELS, CATALOG_GROUPS, PLANNED_MODELS } from './catalog-models.js?v=catalog-4';
import { makeCatalogUnit } from './catalog-dsp.js?v=catalog-4';
const $ = (id) => document.getElementById(id);
const NAM_MODULE_URL = 'https://cdn.jsdelivr.net/npm/neural-amp-modeler-wasm@2.0.1/dist/engine/index.js';
const NAM_SOURCE = 'https://github.com/tone-3000/neural-amp-modeler-wasm';
const NAM_MODELS = {
  nam_ac10: { name: 'AC10 Capture', file: 'ac10.nam', ir: 'vox_ac30', note: '맑고 가벼운 브리티시 계열' },
  nam_deluxe: { name: 'Deluxe Reverb Capture', file: 'deluxe.nam', ir: 'fender_deluxe', note: '따뜻한 아메리칸 클린 계열' },
  nam_jcm: { name: 'JCM Capture', file: 'jcm.nam', ir: 'marshall_1960', note: '강한 미드레인지의 브리티시 드라이브 계열' }
};
const NAM_MODEL_BASE = 'https://raw.githubusercontent.com/tone-3000/neural-amp-modeler-wasm/a6c895049771bacc40c74dfa19369c2ebf75cdb1/ui/public/models/';
const CAB_IR_BASE = 'https://raw.githubusercontent.com/tone-3000/neural-amp-modeler-wasm/a6c895049771bacc40c74dfa19369c2ebf75cdb1/ui/public/irs/';
const CAB_IRS = {
  vox_ac30: { name: 'Vox AC30 2×12 · SM57', url: './irs/vox-ac30-2x12-sm57-mid.wav' },
  fender_deluxe: { name: 'Fender Tweed 1×12 · SM57', url: './irs/fender-deluxe-1x12-sm57-mid.wav' },
  marshall_1960: { name: 'Marshall 1960 4×12 · SM57', url: './irs/marshall-1960-4x12-sm57-mid.wav' },
  violin_treble: { name: 'Violin Octet · Treble (Gras 스테레오)', url: 'https://raw.githubusercontent.com/AlexHarker/OctetViolins/f4f4c062fe0374a71272ebab252f6ecb5e54b440/resources/IRs/Gras_Pair_01_Treble.wav' },
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
  params: { input: ['Input trim', -18, 18, 0, ' dB'], bass: ['Bass', -12, 12, 0, ' dB'], mid: ['Mid', -12, 12, 0, ' dB'], treble: ['Treble', -12, 12, 0, ' dB'], output: ['Output', -18, 18, 6, ' dB'] }
};
Object.assign(EFFECTS, CATALOG_MODELS);
const CATEGORIES = [
  { id: 'compressor', label: 'Compressor', effects: ['compressor', 'cp10', ...CATALOG_GROUPS.compressor] },
  { id: 'drive', label: 'Drive', effects: ['drive', 'janray', 'ocd', ...CATALOG_GROUPS.drive] },
  { id: 'delay', label: 'Delay', effects: ['delay', ...CATALOG_GROUPS.delay] },
  { id: 'reverb', label: 'Reverb', effects: ['reverb', ...CATALOG_GROUPS.reverb] },
  { id: 'mod', label: 'Mod', effects: ['chorus', 'tremolo', ...CATALOG_GROUPS.mod] },
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
const PLANNED_BY_CATEGORY = {
  delay: ['memory_man','re202','flashback','timeline'],
  reverb: ['rv6','bigsky','dispatch_master']
};
const newSlot = (type = null) => ({ type, bypass: false, values: type ? Object.fromEntries(Object.entries(EFFECTS[type].params).map(([k, v]) => [k, v[3]])) : {} });
let slots = Array.from({ length: 8 }, () => newSlot());
let selected = 0, pickerOpen = true, activeCategory = 'compressor', mode = 'device';
let ctx, sourceBus, inputGain, inputAnalyser, outputAnalyser, master, limiter, muteGain, outputBus, mediaDest, stream, liveSource, fileBuffer, fileSource;
let units = [], chainGain = null, irBuffer = null, irSelection = 'body', activeOutput = 'default', animationId;
let isMuted = false, outputRoute = 'context';
let namEnginePromise; const namModelPromises = new Map(), namMessages = new WeakMap();
const sinkAudio = $('sink-audio');

// Keep playback and the effect graph alive while switching workspace panels.
const viewTabs = [$('tab-practice'), $('tab-effects')];
function showView(view, focusTab = false) {
  const practice = view === 'practice';
  $('practice-view').hidden = !practice;
  $('effects-view').hidden = practice;
  viewTabs.forEach((tab, index) => {
    const active = practice ? index === 0 : index === 1;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  if (focusTab) viewTabs[practice ? 0 : 1].focus();
}
viewTabs.forEach((tab, index) => {
  tab.onclick = () => showView(index === 0 ? 'practice' : 'effects');
  tab.onkeydown = event => {
    const target = event.key === 'ArrowRight' ? (index + 1) % 2 : event.key === 'ArrowLeft' ? (index + 1) % 2 : event.key === 'Home' ? 0 : event.key === 'End' ? 1 : null;
    if (target === null) return;
    event.preventDefault(); showView(target === 0 ? 'practice' : 'effects', true);
  };
});

const drawer = $('io-drawer'), backdrop = $('io-backdrop'), drawerTrigger = $('io-drawer-toggle');
let drawerCloseTimer = null;
function openIODrawer() {
  clearTimeout(drawerCloseTimer);
  drawer.hidden = backdrop.hidden = false;
  drawer.inert = false;
  document.body.classList.add('drawer-open');
  drawerTrigger.setAttribute('aria-expanded', 'true');
  document.querySelector('main').inert = true;
  document.querySelector('.topbar').inert = true;
  requestAnimationFrame(() => { if (!drawer.inert && !drawer.hidden) { drawer.classList.add('open'); backdrop.classList.add('open'); } });
  $('io-drawer-close').focus();
}
function closeIODrawer() {
  if (drawer.hidden) return;
  drawer.classList.remove('open'); backdrop.classList.remove('open');
  drawer.inert = true;
  document.body.classList.remove('drawer-open');
  document.querySelector('main').inert = false;
  document.querySelector('.topbar').inert = false;
  drawerTrigger.setAttribute('aria-expanded', 'false');
  drawerTrigger.focus();
  drawerCloseTimer = setTimeout(() => { drawer.hidden = backdrop.hidden = true; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 230);
}
drawerTrigger.onclick = openIODrawer;
$('io-drawer-close').onclick = closeIODrawer;
backdrop.onclick = closeIODrawer;
document.addEventListener('keydown', event => {
  if (drawer.hidden || drawer.inert) return;
  if (event.key === 'Escape') { event.preventDefault(); closeIODrawer(); return; }
  if (event.key !== 'Tab') return;
  const items = [...drawer.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')].filter(el => el.getClientRects().length && !el.closest('[hidden]'));
  if (!items.length) return;
  if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
});

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
let nodeDrag = null, suppressNodeClick = false, chainAnimationTimer;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateChainSwap(from, to, oldBoxes) {
  if (reducedMotion()) return;
  const chain = $('chain'), newBoxes = [...chain.children].map(el => el.getBoundingClientRect());
  for (const [current, previous] of [[from, to], [to, from]]) {
    const node = chain.children[current]?.querySelector('.node');
    if (!node) continue;
    const x = oldBoxes[previous].left - newBoxes[current].left;
    const y = oldBoxes[previous].top - newBoxes[current].top;
    node.animate([
      { transform: `translate(${x}px, ${y}px) scale(.96)`, opacity: .7 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1 }
    ], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
  const panel = chain.closest('.signal-panel');
  panel.classList.remove('reconnecting');
  void panel.offsetWidth;
  panel.classList.add('reconnecting');
  clearTimeout(chainAnimationTimer);
  chainAnimationTimer = setTimeout(() => panel.classList.remove('reconnecting'), 380);
}
function swapSlots(from, to) {
  if (from === to || !slots[from]?.type || !slots[to]) return;
  const oldBoxes = [...$('chain').children].map(el => el.getBoundingClientRect());
  [slots[from], slots[to]] = [slots[to], slots[from]];
  if (selected === from) selected = to;
  else if (selected === to) selected = from;
  markCustom(); render(); rebuild();
  animateChainSwap(from, to, oldBoxes);
  notify(`${from + 1}번과 ${to + 1}번 슬롯의 위치를 바꿨습니다.`);
}
function liftNodeDrag(state) {
  const rect = state.source.getBoundingClientRect();
  const ghost = state.source.cloneNode(true);
  ghost.classList.remove('dragging');
  ghost.classList.add('node-drag-ghost');
  ghost.removeAttribute('title');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.tabIndex = -1;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  state.offsetX = state.x - rect.left;
  state.offsetY = state.y - rect.top;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  document.body.append(ghost);
  state.ghost = ghost;
}
function clearNodeDrag(settle = false) {
  if (!nodeDrag) return;
  const { source, ghost } = nodeDrag;
  source.classList.remove('dragging');
  $('chain').querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
  document.body.classList.remove('chain-dragging');
  if (ghost) {
    if (settle && !reducedMotion()) {
      ghost.style.animation = 'none';
      ghost.animate([{ opacity: .95, transform: 'rotate(-1deg) scale(1.06)' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 140, easing: 'ease-out' }).finished.then(() => ghost.remove(), () => ghost.remove());
    } else ghost.remove();
  }
  nodeDrag = null;
}
function dragTargetAt(x, y) {
  const slot = document.elementFromPoint(x, y)?.closest('.slot');
  return slot?.parentElement === $('chain') ? Number(slot.dataset.index) : null;
}
function renderChain() {
  $('chain').replaceChildren(...slots.map((slot, i) => {
    const meta = slot.type && EFFECTS[slot.type];
    const wrap = document.createElement('div'); wrap.className = 'slot'; wrap.dataset.index = i;
    const button = document.createElement('button'); button.type = 'button';
    button.className = `node ${meta ? 'released' : 'empty'} ${selected === i ? 'selected' : ''} ${slot.bypass ? 'off' : ''}`;
    button.setAttribute('aria-label', `${i + 1}번 슬롯, ${meta ? meta.name : '비어 있음'}${slot.bypass ? ', 바이패스' : ''}`);
    if (meta) button.title = '드래그하여 다른 슬롯과 위치 바꾸기';
    button.innerHTML = `<span class="node-number">${String(i + 1).padStart(2, '0')}</span><span class="node-symbol" aria-hidden="true">${meta ? meta.symbol : '+'}</span><span class="node-name">${meta ? meta.name : '이펙트 추가'}</span><span class="node-category">${meta ? meta.category : 'EMPTY SLOT'}</span>${slot.bypass ? '<span class="off-label">OFF</span>' : ''}`;
    button.onclick = () => { if (suppressNodeClick) return; selected = i; pickerOpen = !slots[i].type; render(); };
    if (meta) {
      button.onpointerdown = event => {
        if (!event.isPrimary || event.button !== 0) return;
        nodeDrag = { from: i, x: event.clientX, y: event.clientY, pointerId: event.pointerId, source: button, target: null, moving: false };
        button.setPointerCapture(event.pointerId);
      };
      button.onpointermove = event => {
        if (!nodeDrag || nodeDrag.pointerId !== event.pointerId) return;
        if (!nodeDrag.moving && Math.hypot(event.clientX - nodeDrag.x, event.clientY - nodeDrag.y) < 8) return;
        if (!nodeDrag.moving) {
          nodeDrag.moving = true;
          liftNodeDrag(nodeDrag);
          button.classList.add('dragging'); document.body.classList.add('chain-dragging');
        }
        nodeDrag.ghost.style.left = `${event.clientX - nodeDrag.offsetX}px`;
        nodeDrag.ghost.style.top = `${event.clientY - nodeDrag.offsetY}px`;
        const target = dragTargetAt(event.clientX, event.clientY);
        $('chain').querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        nodeDrag.target = target !== i ? target : null;
        if (nodeDrag.target !== null) $('chain').children[nodeDrag.target]?.classList.add('drop-target');
        event.preventDefault();
      };
      button.onpointerup = event => {
        if (!nodeDrag || nodeDrag.pointerId !== event.pointerId) return;
        const { from, target, moving } = nodeDrag;
        clearNodeDrag(moving);
        if (!moving) return;
        suppressNodeClick = true; setTimeout(() => { suppressNodeClick = false; }, 0);
        if (target !== null) swapSlots(from, target);
      };
      button.onpointercancel = () => clearNodeDrag();
    }
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
  for (const [id, available] of [['move-left', selected > 0], ['move-right', selected < slots.length - 1]]) {
    $(id).hidden = !meta;
    $(id).disabled = !available;
  }
  $('bypass').classList.toggle('active', !!slot.bypass);
  $('bypass').textContent = slot.bypass ? 'BYPASS ON' : 'BYPASS OFF';
  if (!meta || pickerOpen) renderPicker();
  if (!meta || pickerOpen) return;
  $('effect-description').textContent = meta.description;
  $('parameter-list').replaceChildren(...Object.entries(meta.params).map(([key, [label, min, max, initial, suffix]]) => {
    const group = document.createElement('div'); group.className = 'parameter';
    const id = `param-${selected}-${key}`;
    const value = slot.values[key] ?? initial;
    if (key === 'mode' && CATALOG_MODELS[slot.type]) {
      const modes = {
        dd200: ['Digital','Analog','Tape','Dual','Mod','Ambient'],
        dd500: ['Digital','Analog','Tape','Dual','Mod','Ambient'],
        holy_grail: ['Spring','Hall','Flerb'],
        hall_of_fame: ['Hall','Room','Plate','Shimmer'],
        bluesky: ['Plate','Room','Spring','Shimmer'],
        flux_echo: ['Ambient + Clean Echo','Mod Reverb + Reverse Echo','Shimmer + Tape'],
        flint: ['Spring','Plate','Hall','Room']
      }[slot.type] || [];
      group.innerHTML = `<label for="${id}">${label}</label><select id="${id}"></select>`;
      const control = group.querySelector('select');
      modes.forEach((mode, index) => control.add(new Option(mode, String(index))));
      control.value = String(value);
      control.onchange = () => { slot.values[key] = +control.value; markCustom(); const unit = units.find(u => u.slotIndex === selected); if (unit?.update) unit.update(); else rebuild(); };
    } else if (key === 'peak' && slot.type === 'ocd') {
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
  $('ir-source').hidden = slot.type !== 'ir' || !['vox_ac30', 'fender_deluxe', 'marshall_1960', 'violin_treble'].includes(irSelection);
  if (irSelection === 'violin_treble') {
    $('ir-source').href = 'https://github.com/AlexHarker/OctetViolins';
    $('ir-source').textContent = '바이올린 IR 출처 · OctetViolins (BSD 3-Clause)';
  } else {
    $('ir-source').href = 'https://github.com/DCisHurt/CabImpulse';
    $('ir-source').textContent = '캐비닛 IR 출처 · CabImpulse (MIT)';
  }
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
function setEffect(type) {
  if (type && !EFFECTS[type]) return;
  slots[selected] = newSlot(type);
  if ((type === 'ir' && slots.some(slot => slot.type === 'saw')) || (type === 'saw' && slots.some(slot => slot.type === 'ir') && irSelection === 'body')) {
    irSelection = 'violin_treble'; irBuffer = null;
    $('ir-name').textContent = `${CAB_IRS[irSelection].name} IR을 ${ctx ? '불러오는 중…' : '오디오 시작 시 불러옵니다.'}`;
    if (ctx) void loadLibraryIR(irSelection);
  }
  pickerOpen = false; markCustom(); render(); rebuild();
}
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
  const planned = PLANNED_BY_CATEGORY[category.id] || [];
  $('category-heading').textContent = `${category.label} · 사용 가능 ${category.effects.length}개 · 준비 중 ${planned.length}개`;
  const cards = [], labels = {DRIVE:'오버드라이브',DISTORTION:'디스토션',FUZZ:'퍼즈'};
  let previousGroup = null;
  for (const key of [...category.effects, ...planned]) {
    const coming = !!PLANNED_MODELS[key], effect = coming ? PLANNED_MODELS[key] : EFFECTS[key];
    const group = category.id === 'drive' ? (effect.category === 'DISTORTION' || effect.category === 'FUZZ' ? effect.category : 'DRIVE') : null;
    if (group && group !== previousGroup) {
      const heading = document.createElement('h3'); heading.className = 'effect-subheading'; heading.textContent = labels[group]; cards.push(heading);
      previousGroup = group;
    }
    const button = document.createElement('button'); button.className = `effect-option ${coming ? 'planned' : 'released'}`; button.type = 'button';
    button.disabled = coming;
    const icon = document.createElement('span'); icon.className = 'effect-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = effect.symbol;
    const name = document.createElement('strong'); name.textContent = effect.name;
    const detail = document.createElement('small'); detail.textContent = coming ? '추가 예정' : (CATALOG_MODELS[key] ? 'DSP 근사 · 사용 가능' : '사용 가능');
    button.append(icon,name,detail);
    if (!coming) button.onclick = () => setEffect(key);
    cards.push(button);
  }
  $('effect-grid').replaceChildren(...cards);
  $('clear-slot').hidden = !slots[selected].type;
}
$('clear-slot').onclick = () => setEffect(null);
$('change-effect').onclick = () => { activeCategory = CATEGORIES.find(c => c.effects.includes(slots[selected].type))?.id || 'compressor'; pickerOpen = true; renderEditor(); };
$('bypass').onclick = () => { slots[selected].bypass = !slots[selected].bypass; markCustom(); render(); rebuild(); };
$('move-left').onclick = () => swapSlots(selected, selected - 1);
$('move-right').onclick = () => swapSlots(selected, selected + 1);
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
  if (CATALOG_MODELS[slot.type]) {
    const catalog = makeCatalogUnit(ctx, {...slot,catalog:CATALOG_MODELS[slot.type]},input,output,nodes,oscillators,impulse);
    return {input,output,nodes,oscillators,...catalog};
  }
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
    await ctx.audioWorklet.addModule(new URL('./catalog-pitch-worklet.js?v=catalog-4', import.meta.url));
    sourceBus = ctx.createGain(); inputGain = ctx.createGain(); inputAnalyser = ctx.createAnalyser(); outputAnalyser = ctx.createAnalyser(); master = ctx.createGain(); limiter = ctx.createDynamicsCompressor(); muteGain = ctx.createGain(); outputBus = ctx.createGain();
    inputAnalyser.fftSize = outputAnalyser.fftSize = 1024;
    inputGain.gain.value = 10 ** (+$('input-trim').value / 20);
    master.gain.value = +$('master-volume').value / 100; muteGain.gain.value = isMuted ? 0 : 1;
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = .002; limiter.release.value = .08;
    sourceBus.connect(inputGain).connect(inputAnalyser);
    master.connect(limiter).connect(muteGain).connect(outputAnalyser).connect(outputBus); outputBus.connect(ctx.destination);
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
$('input-trim').oninput = (e) => { const value = +e.target.value; $('input-trim-value').textContent = `${value >= 0 ? '+' : ''}${value} dB`; if (inputGain) inputGain.gain.setTargetAtTime(10 ** (value / 20), ctx.currentTime, .012); };
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
    notify('IR을 적용했습니다.');
  } catch (error) { if (selection !== irSelection) return; irSelection = 'none'; $('ir-library').value = 'none'; $('ir-source').hidden = true; refreshIRUnits(); notify(`IR을 불러오지 못했습니다: ${error.message}`, true); }
}
$('ir-library').onchange = async (event) => {
  irSelection = event.target.value; irBuffer = null; refreshIRUnits(); markCustom();
  $('ir-source').hidden = !['vox_ac30', 'fender_deluxe', 'marshall_1960', 'violin_treble'].includes(irSelection);
  $('ir-source').href = irSelection === 'violin_treble' ? 'https://github.com/AlexHarker/OctetViolins' : 'https://github.com/DCisHurt/CabImpulse';
  $('ir-source').textContent = irSelection === 'violin_treble' ? '바이올린 IR 출처 · OctetViolins (BSD 3-Clause)' : '캐비닛 IR 출처 · CabImpulse (MIT)';
  if (CAB_IRS[irSelection]) { $('ir-name').textContent = 'IR을 불러오는 중…'; if (await ensureEngine()) void loadLibraryIR(irSelection); }
  else { $('ir-name').textContent = irSelection === 'none' ? 'IR을 사용하지 않습니다.' : '데모용 합성 바디 IR을 적용했습니다.'; notify($('ir-name').textContent); }
};
$('ir-file').onchange = async (e) => {
  const file = e.target.files?.[0]; if (!file || !await ensureEngine()) return;
  try { irBuffer = await ctx.decodeAudioData(await file.arrayBuffer()); irSelection = 'custom'; $('ir-library').value = 'custom'; $('ir-source').hidden = true; $('ir-name').textContent = `적용됨: ${file.name} (${irBuffer.duration.toFixed(2)}초)`; refreshIRUnits(); notify('사용자 IR을 적용했습니다.'); }
  catch { notify('IR 파일을 읽을 수 없습니다.', true); }
};
function meterLoop() {
  const data = new Float32Array(1024);
  const update = (analyser, bar, label) => {
    analyser.getFloatTimeDomainData(data);
    let energy = 0, peak = 0;
    for (const sample of data) { energy += sample * sample; peak = Math.max(peak, Math.abs(sample)); }
    const rms = Math.sqrt(energy / data.length), db = 20 * Math.log10(Math.max(rms, 1e-6));
    bar.style.width = `${Math.max(0, Math.min(100, (db + 72) / 72 * 100))}%`;
    bar.classList.toggle('clipping', peak >= .98);
    label.textContent = db <= -72 ? '−∞ dBFS' : `${Math.round(db)} dBFS`;
  };
  update(inputAnalyser, $('input-meter'), $('input-level'));
  update(outputAnalyser, $('output-meter'), $('output-level'));
  animationId = requestAnimationFrame(meterLoop);
}
// The practice player uses native media controls; its audio is independent of the guitar graph.
let practiceObjectUrl = null, practiceSourceName = '영상';
const practiceVideo = $('practice-video'), youtubePlayer = $('youtube-player');
function videoStatus(message, error = false) {
  $('video-status').textContent = message;
  $('video-status').classList.toggle('error', error);
}
function chooseVideoSource(source) {
  const isUrl = source === 'url';
  $('tab-video-url').classList.toggle('active', isUrl);
  $('tab-video-file').classList.toggle('active', !isUrl);
  $('tab-video-url').setAttribute('aria-pressed', String(isUrl));
  $('tab-video-file').setAttribute('aria-pressed', String(!isUrl));
  $('video-url-panel').hidden = !isUrl;
  $('video-file-panel').hidden = isUrl;
}
$('tab-video-url').onclick = () => chooseVideoSource('url');
$('tab-video-file').onclick = () => chooseVideoSource('file');
function clearPracticeMedia() {
  practiceVideo.pause();
  practiceVideo.removeAttribute('src');
  practiceVideo.load();
  youtubePlayer.removeAttribute('src');
  if (practiceObjectUrl) URL.revokeObjectURL(practiceObjectUrl);
  practiceObjectUrl = null;
}
function showPracticeMedia(kind) {
  $('video-placeholder').hidden = true;
  practiceVideo.hidden = kind !== 'video';
  youtubePlayer.hidden = kind !== 'youtube';
}
function youtubeId(url) {
  const host = url.hostname.toLowerCase();
  const pieces = url.pathname.split('/').filter(Boolean);
  let id;
  if (host === 'youtu.be' || host === 'www.youtu.be') id = pieces[0];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    id = pieces[0] === 'watch' ? url.searchParams.get('v') : ['shorts', 'embed', 'live'].includes(pieces[0]) ? pieces[1] : null;
  } else return null;
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) throw new Error('유튜브 영상 링크에서 영상 ID를 찾을 수 없습니다.');
  return id;
}
function youtubeStart(url) {
  const raw = url.searchParams.get('start') || url.searchParams.get('t') || url.hash.replace(/^#t=?/, '');
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Math.min(86400, +raw);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  return match ? Math.min(86400, (+match[1] || 0) * 3600 + (+match[2] || 0) * 60 + (+match[3] || 0)) : 0;
}
function loadPracticeUrl() {
  try {
    const url = new URL($('video-url').value.trim());
    if (url.protocol !== 'https:') throw new Error('https://로 시작하는 영상 주소를 입력하세요.');
    const id = youtubeId(url);
    clearPracticeMedia();
    if (id) {
      const embed = new URL(`https://www.youtube.com/embed/${id}`);
      const start = youtubeStart(url);
      if (start) embed.searchParams.set('start', String(start));
      youtubePlayer.src = embed.href;
      showPracticeMedia('youtube');
      videoStatus('유튜브 영상을 불러왔습니다. 플레이어에서 재생하세요.');
    } else {
      practiceSourceName = '영상';
      practiceVideo.src = url.href;
      showPracticeMedia('video');
      videoStatus('영상 파일을 확인하고 있습니다…');
    }
  } catch (error) { videoStatus(error.message || '주소를 확인하세요.', true); }
}
$('load-video-url').onclick = loadPracticeUrl;
$('video-url').addEventListener('keydown', event => { if (event.key === 'Enter') loadPracticeUrl(); });
$('video-file').onchange = event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('video/') && !/\.(mp4|webm|ogv|ogg|m4v|mov)$/i.test(file.name)) {
    videoStatus('영상 파일을 선택하세요.', true); return;
  }
  clearPracticeMedia();
  practiceSourceName = file.name;
  practiceObjectUrl = URL.createObjectURL(file);
  practiceVideo.src = practiceObjectUrl;
  showPracticeMedia('video');
  videoStatus(`${file.name} · 재생 버튼을 누르세요.`);
};
practiceVideo.addEventListener('loadedmetadata', () => {
  videoStatus(`${practiceSourceName} · 준비되었습니다. 재생 버튼을 누르세요.`);
});
practiceVideo.addEventListener('error', () => {
  if (practiceVideo.src) videoStatus('영상을 재생할 수 없습니다. 파일 형식·코덱 또는 외부 서버의 직접 재생 허용 여부를 확인하세요.', true);
});

// Schedule clicks against AudioContext time so UI timer jitter does not move the beat.
let metroTimer = null, nextMetroTime = 0, beatIndex = 0, metroGeneration = 0;
const metroOscillators = new Set(), metroVisualTimers = new Set();
const beats = $('beat-lights');
function renderBeats() {
  const count = +$('metro-beats').value;
  beats.replaceChildren(...Array.from({ length: count }, () => document.createElement('span')));
  beats.setAttribute('aria-label', `${count}박 표시`);
}
function clearBeatLights() { for (const light of beats.children) light.classList.remove('active'); }
function scheduleMetroClick(at, index, generation) {
  const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
  const volume = +$('metro-volume').value / 100;
  oscillator.type = 'sine';
  oscillator.frequency.value = index === 0 ? 1260 : 880;
  envelope.gain.setValueAtTime(.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * (index === 0 ? .19 : .13)), at + .004);
  envelope.gain.exponentialRampToValueAtTime(.0001, at + .055);
  oscillator.connect(envelope).connect(muteGain);
  oscillator.onended = () => { metroOscillators.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  metroOscillators.add(oscillator);
  oscillator.start(at); oscillator.stop(at + .06);
  const timer = setTimeout(() => {
    metroVisualTimers.delete(timer);
    if (generation !== metroGeneration) return;
    clearBeatLights();
    beats.children[index]?.classList.add('active');
  }, Math.max(0, (at - ctx.currentTime) * 1000));
  metroVisualTimers.add(timer);
}
function metroScheduler() {
  if (!ctx || ctx.state !== 'running') return;
  if (nextMetroTime < ctx.currentTime - .15) { nextMetroTime = ctx.currentTime + .035; beatIndex = 0; }
  while (nextMetroTime < ctx.currentTime + .11) {
    scheduleMetroClick(nextMetroTime, beatIndex, metroGeneration);
    nextMetroTime += 60 / +$('metro-bpm').value;
    beatIndex = (beatIndex + 1) % +$('metro-beats').value;
  }
}
function stopMetroSchedule() {
  clearInterval(metroTimer); metroTimer = null; metroGeneration++;
  for (const timer of metroVisualTimers) clearTimeout(timer);
  metroVisualTimers.clear();
  for (const oscillator of metroOscillators) { try { oscillator.stop(); } catch {} }
  clearBeatLights();
}
function beginMetroSchedule() {
  stopMetroSchedule();
  nextMetroTime = ctx.currentTime + .035;
  beatIndex = 0;
  metroScheduler();
  metroTimer = setInterval(metroScheduler, 25);
}
function setMetroUI(playing) {
  $('metro-toggle').textContent = playing ? '■ 정지' : '▶ 시작';
  $('metro-toggle').setAttribute('aria-pressed', String(playing));
  $('metro-state').textContent = playing ? 'PLAYING' : 'STOPPED';
  $('metro-state').classList.toggle('running', playing);
}
$('metro-toggle').onclick = async () => {
  if (metroTimer) { stopMetroSchedule(); setMetroUI(false); $('metro-message').textContent = '메트로놈을 정지했습니다.'; return; }
  if (!await ensureEngine()) { $('metro-message').textContent = '오디오 엔진을 시작할 수 없습니다.'; return; }
  beginMetroSchedule(); setMetroUI(true);
  $('metro-message').textContent = '메트로놈이 실행 중입니다. 기타 출력 장치에서 클릭이 들립니다.';
};
function updateTempo(value) {
  const bpm = Math.max(40, Math.min(240, Math.round(Number(value) || 100)));
  $('metro-bpm').value = $('metro-bpm-number').value = bpm;
  $('tempo-display').textContent = bpm;
  if (metroTimer) beginMetroSchedule();
}
$('metro-bpm').oninput = event => updateTempo(event.target.value);
$('metro-bpm-number').onchange = event => updateTempo(event.target.value);
$('metro-beats').onchange = () => { renderBeats(); if (metroTimer) beginMetroSchedule(); };
$('metro-volume').oninput = event => { $('metro-volume-value').textContent = `${event.target.value}%`; };
let tapTimes = [];
$('metro-tap').onclick = () => {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes.at(-1) > 1800) tapTimes = [];
  tapTimes.push(now);
  tapTimes = tapTimes.slice(-5);
  if (tapTimes.length < 2) { $('metro-message').textContent = '한 번 더 탭하면 템포를 계산합니다.'; return; }
  const intervals = tapTimes.slice(1).map((time, i) => time - tapTimes[i]);
  updateTempo(60000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length));
  $('metro-message').textContent = `${$('metro-bpm').value} BPM으로 설정했습니다.`;
};
renderBeats();
render();
