// Circuit-inspired and feature-inspired models. These are independent DSP approximations,
// never manufacturer firmware, captures, or exact component-level emulations.
const sliders = {
  drive: { gain: ['Drive', 0, 100, 42, '%'], tone: ['Tone', 0, 100, 55, '%'], level: ['Level', 0, 100, 65, '%'] },
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
  ['rat','Pro Co RAT','distortion','drive','rat','초기 RAT 공개 회로'],
  ['rat2','Pro Co RAT2','distortion','drive','rat','RAT 계열 근사'],
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
for (const id of ['dd200','dd500']) {
  CATALOG_MODELS[id].params.mode = ['Mode', 0, 5, 0, ''];
  CATALOG_MODELS[id].description += ' 공개 모드 중 Digital, Analog, Tape, Dual, Mod, Ambient의 여섯 가지를 단순화해 제공합니다.';
}
for (const id of ['holy_grail','hall_of_fame','bluesky','flux_echo','flint']) {
  CATALOG_MODELS[id].params.mode = ['Mode', 0, id === 'flux_echo' ? 2 : id === 'holy_grail' ? 2 : 3, 0, ''];
}
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
