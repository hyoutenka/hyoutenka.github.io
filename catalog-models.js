// Circuit-inspired and feature-inspired models. These are independent DSP approximations,
// never manufacturer firmware, captures, or exact component-level emulations.
const sliders = {
  drive: { gain: ['Drive', 0, 100, 42, '%'], tone: ['Tone', 0, 100, 55, '%'], level: ['Level', 0, 100, 65, '%'] },
  angel: { volume: ['Volume', 0, 100, 58, '%'], gain: ['Gain', 0, 100, 38, '%'], bass: ['Bass', 0, 100, 50, '%'], treble: ['Treble', 0, 100, 50, '%'] },
  awesome: { volume: ['Volume', 0, 100, 65, '%'], gain: ['Gain', 0, 100, 30, '%'], tone: ['Tone', 0, 100, 50, '%'] },
  groovim: { volume: ['Volume', 0, 100, 55, '%'], gain: ['Gain', 0, 100, 35, '%'], filter: ['Filter', 0, 100, 35, '%'] },
  comp: { sustain: ['Sustain', 0, 100, 45, '%'], attack: ['Attack', 1, 100, 35, ' ms'], level: ['Level', 0, 100, 65, '%'], blend: ['Blend', 0, 100, 100, '%'] },
  modulation: { rate: ['Rate', 1, 100, 37, '%'], depth: ['Depth', 0, 100, 55, '%'], mix: ['Mix', 0, 100, 45, '%'], feedback: ['Feedback', 0, 80, 20, '%'] },
  tremolo: { rate: ['Rate', 1, 120, 34, '%'], depth: ['Depth', 0, 100, 58, '%'], shape: ['Wave shape', 0, 100, 20, '%'] },
  delay: { time: ['Time', 50, 1200, 380, ' ms'], feedback: ['Feedback', 0, 85, 38, '%'], tone: ['Tone', 0, 100, 55, '%'], mix: ['Mix', 0, 80, 28, '%'] },
  reverb: { decay: ['Decay', 1, 10, 4, ' s'], tone: ['Tone', 0, 100, 55, '%'], predelay: ['Pre-delay', 0, 150, 20, ' ms'], mix: ['Mix', 0, 80, 30, '%'] },
  pitch: { semitones: ['Shift', -12, 12, 7, ' st'], mix: ['Mix', 0, 100, 70, '%'], window: ['Window', 30, 85, 52, ' ms'] },
  filter: { sweep: ['Sweep', 0, 100, 50, '%'], resonance: ['Resonance', 1, 18, 7, ' Q'], mix: ['Mix', 0, 100, 100, '%'] }
};
const MODEL_ROWS = [
  // id, name, category, engine, character, reference
  ['tsmini','TS Mini','drive','drive','ts','TS808 참고·Mini 근사'],
  ['ts808','TS808','drive','drive','ts','TS808 회로'],
  ['ts9','TS9','drive','drive','ts9','TS9 계열 회로'],
  ['boss_od1','BOSS OD-1','drive','drive','od1','OD-1 파생 회로'],
  ['boss_sd1','BOSS SD-1','drive','drive','od1','SD-1 파생 회로'],
  ['boss_od3','BOSS OD-3','drive','drive','od3','OD-3 파생 회로'],
  ['boss_bd2','BOSS BD-2','drive','drive','bd2','BD-2 파생 회로'],
  ['klon','Klon Centaur','drive','drive','klon','Centaur 복각 회로'],
  ['ktr','Klon KTR','drive','drive','klon','KTR 복각 회로'],
  ['odr1','Nobels ODR-1','drive','drive','odr','ODR-1 파생 회로'],
  ['bluesbreaker','Marshall Bluesbreaker','drive','drive','blues','Bluesbreaker 파생 회로'],
  ['kot','Analogman King of Tone','drive','drive','kot','Bluesbreaker 파생 회로'],
  ['lightspeed','Greer Lightspeed','drive','drive','transparent','파생 회로'],
  ['timmy','Paul Cochrane Timmy','drive','drive','transparent','공개 파생 회로'],
  ['zendrive','Hermida Zendrive','drive','drive','zendrive','Zendrive 파생 회로'],
  ['a3_awesome','A3 Stompbox Awesome','drive','awesome','awesome','A3 제품 설명과 조작부·부스트 성격'],
  ['a3_angel','A3 Stompbox Angel','drive','angel','angel','A3 공식 제품 설명과 조작부'],
  ['rat','Pro Co RAT','distortion','drive','rat','초기 RAT 공개 회로'],
  ['rat2','Pro Co RAT2','distortion','drive','rat','RAT 계열 근사'],
  ['a3_groovim','A3 Stompbox Groovim','distortion','groovim','groovim','RAT 계열 재해석과 Gain·Volume·Filter 조작'],
  ['turbo_rat','Pro Co Turbo RAT','distortion','drive','turbo','RAT 계열 근사'],
  ['ds1','BOSS DS-1','distortion','drive','ds1','DS-1 회로'],
  ['distortion_plus','MXR Distortion+','distortion','drive','mxr','Distortion+ 회로'],
  ['hm2','BOSS HM-2','distortion','drive','hm2','HM-2 파생 회로'],
  ['guvnor','Marshall Guv’nor','distortion','drive','guvnor','Guv’nor 공개 회로'],
  ['shredmaster','Marshall Shredmaster','distortion','drive','shred','파생 회로'],
  ['riot','Suhr Riot','distortion','drive','riot','파생 회로'],
  ['bigmuff','EHX Big Muff Pi','fuzz','drive','muff','Big Muff 복각 회로'],
  ['opamp_muff','EHX Op-Amp Big Muff','fuzz','drive','opmuff','Op-Amp Muff 파생 회로'],
  ['fuzzface','Dallas-Arbiter Fuzz Face','fuzz','drive','fuzz','Fuzz Face 파생 회로'],
  ['tonebender','Tone Bender Mk II','fuzz','drive','bender','Tone Bender 파생 회로'],
  ['fuzzfactory','ZVEX Fuzz Factory','fuzz','drive','gated','Fuzz Factory 파생 회로'],
  ['superfuzz','Univox Super-Fuzz','fuzz','drive','octave','Super-Fuzz 파생 회로'],
  ['dyna_comp','MXR Dyna Comp','compressor','comp','ota','Dyna Comp 복각 회로'],
  ['ross_comp','Ross Compressor','compressor','comp','ota','Ross Compressor 복각 회로'],
  ['keeley_comp','Keeley Compressor Plus','compressor','comp','blend','Keeley 파생 회로'],
  ['crybaby','Dunlop Cry Baby GCB-95','mod','filter','wah','GCB-95 공개 회로'],
  ['mutron','Mu-Tron III','mod','filter','envelope','Mu-Tron 파생 회로'],
  ['ce2','BOSS CE-2','mod','modulation','chorus','CE-2 파생 회로'],
  ['smallclone','EHX Small Clone','mod','modulation','chorus2','Small Clone 파생 회로'],
  ['phase90','MXR Phase 90','mod','modulation','phaser','Phase 90 파생 회로'],
  ['smallstone','EHX Small Stone','mod','modulation','phaser2','Small Stone 파생 회로'],
  ['univibe','Univox Uni-Vibe','mod','modulation','vibe','Uni-Vibe 파생 회로'],
  ['bf2','BOSS BF-2','mod','modulation','flanger','BF-2 파생 회로'],
  ['dc2','BOSS DC-2','mod','modulation','dimension','DC-2 파생 회로'],
  ['tr2','BOSS TR-2','mod','tremolo','triangle','공식 조작 자료'],
  ['tremulus','4ms Tremulus Lune','mod','tremolo','optical','공개 제작 회로'],
  ['whammy','DigiTech Whammy','mod','pitch','whammy','공식 기능 자료'],
  ['pitchfork','EHX Pitch Fork','mod','pitch','pitch','공식 기능 자료'],
  ['ps6','BOSS PS-6 Harmonist','mod','pitch','harmony','공식 기능 자료'],
  ['dd200','BOSS DD-200','delay','delay','digital','공식 12모드 참고'],
  ['dd500','BOSS DD-500','delay','delay','digital','공식 12모드 참고'],
  ['dm2','BOSS DM-2','delay','delay','analog','DM-2 파생 회로'],
  ['em5','Ibanez EM5 Echomachine','delay','delay','tape','EM5 파생 회로'],
  ['deepblue','Mad Professor Deep Blue Delay','delay','delay','analog','파생 회로'],
  ['pt2399','PT2399 Echo','delay','delay','analog','공개 PT2399 회로'],
  ['holy_grail','EHX Holy Grail Nano','reverb','reverb','spring','공식 모드 자료'],
  ['hall_of_fame','TC Hall of Fame 2','reverb','reverb','hall','공식 모드 자료'],
  ['bluesky','Strymon blueSky','reverb','reverb','plate','공식 모드 자료'],
  ['flux_echo','Horizon Flux Echo','reverb','echoverb','ambient','공식 3모드 자료'],
  ['flint','Strymon Flint','reverb','echoverb','flint','공식 기능 자료']
];
const DRIVE_VOICES = {
  ts:{hp:720,mid:1.5,clip:'soft',gain:1.7,lp:5100,level:.8},
  ts9:{hp:760,mid:1.7,clip:'soft',gain:1.9,lp:6000,level:.8},
  od1:{hp:650,mid:1.3,clip:'asym',gain:1.8,lp:5600,level:.75},
  od3:{hp:370,mid:.7,clip:'asym',gain:1.9,lp:6500,level:.7},
  bd2:{hp:250,mid:.3,clip:'asym',gain:2.4,lp:7200,level:.6},
  klon:{hp:400,mid:.7,clip:'blend',gain:2.1,lp:6500,level:.8},
  odr:{hp:180,mid:0,clip:'soft',gain:2,lp:6500,level:.7},
  blues:{hp:240,mid:.25,clip:'soft',gain:1.6,lp:6800,level:.8},
  kot:{hp:250,mid:.35,clip:'soft',gain:1.9,lp:6500,level:.8},
  transparent:{hp:170,mid:0,clip:'soft',gain:1.4,lp:8500,level:.85},
  zendrive:{hp:260,mid:.9,clip:'asym',gain:2.3,lp:5600,level:.7},
  rat:{hp:430,mid:.55,clip:'hard',gain:3.2,lp:6500,level:.45},
  turbo:{hp:420,mid:.6,clip:'hard',gain:3.8,lp:7300,level:.5},
  ds1:{hp:530,mid:-.6,clip:'hard',gain:3.4,lp:6200,level:.38},
  mxr:{hp:410,mid:.1,clip:'hard',gain:2.2,lp:7600,level:.42},
  hm2:{hp:250,mid:2,clip:'hard',gain:4,lp:6800,level:.34},
  guvnor:{hp:160,mid:1.2,clip:'hard',gain:3,lp:7600,level:.5},
  shred:{hp:220,mid:-.6,clip:'hard',gain:3.4,lp:8500,level:.42},
  riot:{hp:190,mid:.9,clip:'hard',gain:4,lp:7200,level:.4},
  muff:{hp:110,mid:-1.3,clip:'muff',gain:3.6,lp:5700,level:.4},
  opmuff:{hp:140,mid:-1.5,clip:'muff',gain:4.1,lp:6200,level:.37},
  fuzz:{hp:95,mid:.3,clip:'fuzz',gain:3,lp:6200,level:.42},
  bender:{hp:120,mid:.8,clip:'fuzz',gain:3.7,lp:5800,level:.4},
  gated:{hp:140,mid:.4,clip:'gated',gain:4,lp:6900,level:.42},
  octave:{hp:180,mid:.5,clip:'octave',gain:4,lp:6200,level:.36}
};
const CATALOG_MODELS = Object.fromEntries(MODEL_ROWS.map(([id,name,group,engine,voice,reference]) => [
  id, { name, category: group.toUpperCase(), symbol: {drive:'ϟ',distortion:'ϟ',fuzz:'✺',compressor:'▤',mod:'∿',delay:'↝',reverb:'⌁'}[group],
    engine, voice, reference,
    description: `${name} · ${reference}를 참고한 독립 DSP 근사 모델입니다. 실제 페달의 내부 알고리즘이나 부품 전체를 복제한 것은 아닙니다.`,
    params: Object.fromEntries(Object.entries(sliders[engine] || sliders.reverb).map(([key, value]) => [key, [...value]])) }
]));
// The original OD-1 has Level and Overdrive only; SD-1 added a Tone control.
delete CATALOG_MODELS.boss_od1.params.tone;
CATALOG_MODELS.boss_od1.description = 'OD-1의 Level·Overdrive 2노브와 비대칭 클리핑을 참고한 근사 모델입니다. 톤 조절은 페달 자체에 없으며 고정 보이싱입니다.';
CATALOG_MODELS.boss_sd1.description = 'OD-1에서 발전한 비대칭 클리핑에 Tone 조절과 약간 더 두터운 저역을 더한 SD-1 근사 모델입니다.';
for (const id of ['rat','rat2','turbo_rat']) CATALOG_MODELS[id].params.tone[0] = 'Filter (dark →)';
CATALOG_MODELS.a3_angel.description = 'A3 Stompbox Angel의 단독 시연과 JCM800에 영감을 받은 선명한 드라이브 설명을 참고했습니다. 피킹 강약을 남기도록 두 단계의 증폭량을 낮추고 Bass·Treble을 따로 조절합니다. 실제 회로나 실측 캡처는 아닙니다.';
CATALOG_MODELS.a3_awesome.description = 'A3 Stompbox Awesome의 단독 데모에서 설명한 Klon 성향의 낮은 게인 부스트와 밝고 정돈된 고음역을 참고했습니다. 클린·드라이브 병렬 경로와 게인에 따라 달라지는 저역 차단을 사용합니다. 실제 회로나 실측 캡처는 아닙니다.';
CATALOG_MODELS.a3_groovim.description = '임선호 시그니처 A3 Groovim의 RAT 비교 시연과 Gain·Volume·Filter 조작을 참고했습니다. 단독 연주에서 어택이 너무 빨리 눌리지 않도록 하드 클리핑 진입을 늦추고 역방향 Filter와 저중역을 조절했습니다. Groovim 808과는 다른 모델이며 실측 캡처는 아닙니다.';
for (const [id, label] of [['a3_angel', 'Angel'], ['a3_awesome', 'Awesome'], ['a3_groovim', 'Groovim']]) CATALOG_MODELS[id].shortName = label;
for (const id of ['dd200','dd500']) {
  CATALOG_MODELS[id].params.mode = ['Mode', 0, 5, 0, ''];
  CATALOG_MODELS[id].description += ' 공개 모드 중 Standard, Analog, Tape, Dual, Mod, Ambient의 여섯 가지를 단순화해 제공합니다. Mod와 Ambient는 실기기의 독립 모드명 대신 변조·잔향 계열을 묶은 표현입니다.';
}
CATALOG_MODELS.pitchfork.params.mode = ['Direction', 0, 2, 0, ''];
CATALOG_MODELS.pitchfork.description = 'Pitch Fork의 Up·Down·Dual 전환을 두 독립 피치 경로로 근사합니다. Dual의 반대 방향 두 음정만 제공하며 실제 폴리포닉 추적·프리셋은 재현하지 않습니다.';
CATALOG_MODELS.ps6.params.harmony = ['Harmony voice', 0, 12, 7, ' st'];
CATALOG_MODELS.ps6.description = 'PS-6의 원음+두 화음 성격을 고정 음정의 병렬 피치 경로로 근사합니다. 키를 따라 음정을 바꾸는 지능형 하모니는 구현되지 않았습니다.';
CATALOG_MODELS.whammy.description = 'Whammy의 연속 피치 변화를 Shift 노브와 원음 혼합으로 근사합니다. 발 페달·MIDI 및 원래의 폴리포닉 알고리즘은 포함되지 않습니다.';
CATALOG_MODELS.rat.description = '초기 RAT의 하드 클리핑과 시계 방향으로 돌릴수록 어두워지는 Filter를 참고한 근사 모델입니다.';
CATALOG_MODELS.rat2.description = 'RAT2의 하드 클리핑·역방향 Filter를 참고하며 초기 RAT과 증폭량을 소폭 다르게 둔 근사 모델입니다. 개체별 차이는 재현하지 않습니다.';
CATALOG_MODELS.turbo_rat.description = 'Turbo RAT의 LED 클리핑에 따른 높은 출력과 덜 압축된 피킹을 참고한 근사 모델입니다. LED의 전압 특성을 회로별로 실측한 것은 아닙니다.';
CATALOG_MODELS.ross_comp.description = 'Ross 계열의 OTA 압축과 상대적으로 느린 릴리스·부드러운 어택을 참고한 근사 모델입니다.';
CATALOG_MODELS.keeley_comp.description = 'Keeley Compressor Plus의 병렬 원음 Blend와 컴프레서 경로를 근사합니다. Single Coil/Humbucker 스위치는 구현되지 않았습니다.';
CATALOG_MODELS.dc2.description = 'Dimension C의 은은한 변조 감각을 두 개의 반대 방향 지연 탭으로 근사합니다. 원형의 프리셋 버튼 및 스테레오 회로는 재현하지 않습니다.';
CATALOG_MODELS.holy_grail.description = 'Holy Grail Nano의 Spring·Hall·Flerb를 근사합니다. Flerb에는 리버브 뒤에 짧은 변조 지연을 연결했습니다.';
for (const id of ['holy_grail','hall_of_fame','bluesky','flux_echo','flint']) {
  CATALOG_MODELS[id].params.mode = ['Mode', 0, id === 'flux_echo' ? 2 : id === 'holy_grail' ? 2 : 3, 0, ''];
}
CATALOG_MODELS.flint.params.rate = ['Tremolo rate', 1, 120, 38, '%'];
CATALOG_MODELS.flint.params.depth = ['Tremolo depth', 0, 100, 46, '%'];
CATALOG_MODELS.whammy.params.semitones[3] = 12;
CATALOG_MODELS.pitchfork.params.semitones[3] = 7;
CATALOG_MODELS.ps6.params.semitones[3] = 4;
const CATALOG_GROUPS = {
  compressor: MODEL_ROWS.filter(row => row[2] === 'compressor').map(row => row[0]),
  drive: MODEL_ROWS.filter(row => row[2] === 'drive' || row[2] === 'distortion' || row[2] === 'fuzz').map(row => row[0]),
  delay: MODEL_ROWS.filter(row => row[2] === 'delay').map(row => row[0]),
  reverb: MODEL_ROWS.filter(row => row[2] === 'reverb').map(row => row[0]),
  mod: MODEL_ROWS.filter(row => row[2] === 'mod').map(row => row[0])
};
const PLANNED_MODELS = {
  memory_man: {name:'EHX Deluxe Memory Man',category:'DELAY',symbol:'↝'},
  re202: {name:'BOSS RE-202',category:'DELAY',symbol:'↝'},
  rv6: {name:'BOSS RV-6',category:'REVERB',symbol:'⌁'},
  flashback: {name:'TC Flashback',category:'DELAY',symbol:'↝'},
  timeline: {name:'Strymon Timeline',category:'DELAY',symbol:'↝'},
  bigsky: {name:'Strymon BigSky',category:'REVERB',symbol:'⌁'},
  dispatch_master: {name:'EQD Dispatch Master',category:'REVERB',symbol:'⌁'}
};
export { CATALOG_MODELS, CATALOG_GROUPS, DRIVE_VOICES, PLANNED_MODELS };
