# Web Effecter — 페달 회로 및 DSP 자료 카탈로그

조사일: 2026-10-02. `회로`는 부품값이 표시된 공개 회로도나 이를 포함한 제작 문서, `제품`은 공식 기능·조작 설명을 뜻합니다. Aion FX 문서는 **Aion이 그린 개조/복각 회로**이며 해당 제조사의 공식 원본 회로도가 아닙니다. 원형과 개정판 사이의 부품값과 기능은 다를 수 있습니다. 링크된 이미지·PDF·코드를 프로젝트에 복제할 때에는 각각의 라이선스를 확인합니다.

## 드라이브: 오버드라이브

| 페달 | 공개 자료 | Web Effecter 구현 관점 |
| --- | --- | --- |
| Ibanez TS Mini | [Ibanez 제품](https://www.ibanez.com/eu/products/detail/ts_mini_01.html), [TS808 회로 분석](https://electrosmash.com/tube-screamer-analysis), [TS9 파생 회로](https://aionfx.com/project-category/overdrive/) | Mini 자체의 정확한 부품별 공식 회로는 확인되지 않음. TS 계열의 피드백 다이오드 클리핑·저역 컷·미드 강조를 기본으로 하고 Mini와 같다고 단정하지 않기. |
| Ibanez TS808 / TS9 | [TS808 회로 분석](https://electrosmash.com/tube-screamer-analysis), [Aion Stratus](https://aionfx.com/project-category/overdrive/) | 회로 기반 첫 구현 후보. TS808과 TS9의 출력을 포함한 개정 차이 확인. |
| BOSS OD-1 / SD-1 / OD-3 | [Aion 오버드라이브 목록](https://aionfx.com/project-category/overdrive/), [OD-3 파생 회로](https://aionfx.com/project/heliodor-amp-overdrive/) | 비대칭 피드백 클리핑(OD-1/SD-1), OD-3은 별도 토폴로지. |
| BOSS BD-2 Blues Driver | [Aion Sapphire](https://aionfx.com/project/sapphire-amp-overdrive/) | 다단 증폭, 게인·톤 동작을 별도 모델로. |
| Klon Centaur / KTR | [Aion Refractor 회로·분석](https://aionfx.com/project/refractor-professional-overdrive/) | 클린/왜곡 경로 혼합과 게인에 따른 필터 변화를 모델링. |
| Nobels ODR-1 | [Aion Andromeda](https://aionfx.com/project-category/overdrive/) | 저역 보존과 Spectrum 성격을 별도 보이싱으로. |
| Marshall Bluesbreaker / Analogman King of Tone | [Aion 오버드라이브 목록](https://aionfx.com/project-category/overdrive/) | Bluesbreaker 토폴로지와 2단 직렬 KoT 파생형을 구분. |
| Fulltone OCD | [Aion Titan](https://aionfx.com/project-category/overdrive/), 프로젝트의 `ocd-schematic-analysis.png` | 현재 HP/LP 스위치 구현을 회로와 대조. 하드 클리핑과 후단 EQ. |
| Vemuram Jan Ray | 사용자가 제공한 참고 자료 및 기존 `jan-ray-worklet.js` | 공개 회로와 버전 확인 전에는 현재 모델을 근사형으로 표시. |
| A3 Stompbox Angel | [제조사 제품·조작 설명](https://a3stompbox.imweb.me/19) | JCM800에 영감을 받은 음색과 Volume·Gain·Bass·Treble 조작을 참고한 독립 DSP 근사. Angel의 부품별 회로는 확인되지 않아 회로 복제라고 표시하지 않음. |
| A3 Stompbox Awesome | [제조사 제품](https://a3stompbox.imweb.me/shop_view/?idx=2), [Aion Refractor 제작 문서](https://aionfx.com/app/files/docs/refractor_documentation.pdf) | 공개된 Awesome 부품별 회로는 확인되지 않음. 부스트부터 자연스러운 드라이브까지의 제품 설명과 클론 계열 클린/클립 블렌드를 **보이싱 참고**로 사용. Awesome의 회로와 동일하다는 뜻은 아님. |
| Greer Lightspeed / Paul Cochrane Timmy / Hermida Zendrive | [Aion 오버드라이브 목록](https://aionfx.com/project-category/overdrive/) | 저게인·톤 성격이 달라 TS의 파라미터 변형으로 묶지 않기. |

## 드라이브: 디스토션과 퍼즈

| 페달 | 공개 자료 | Web Effecter 구현 관점 |
| --- | --- | --- |
| Pro Co RAT (초기형) | [ElectroSmash 원작성 회로 분석](https://electrosmash.com/proco-rat), [Aion Helios 파생 회로](https://aionfx.com/project/helios-vintage-distortion/) | 고게인 연산증폭기, 접지 방향 다이오드 클리핑, 역방향 Filter. RAT2·Turbo RAT을 초기형과 혼동하지 않기. |
| A3 Stompbox Groovim (원형 Distortion) | [제조사 제품](https://a3stompbox.imweb.me/shop_view/?idx=3), [제품 조작 설명](https://reverb.com/item/39993317-a3-stompbox-groovim-distortion), [Aion Helios 제작 문서](https://aionfx.com/project/helios-vintage-distortion/) | RAT을 재해석했다는 설명과 Gain·Volume·Filter를 참고한 별도 DSP 근사. A3 부품값과 클리핑 소자는 공개 회로로 확인하지 못함. Groovim 808은 다른 제품이므로 혼동하지 않기. |

## A3 단독 시연 기준 및 현재 판정

세 모델은 스택 조정보다 **단독 모델 검증을 우선**합니다. 영상에는 각 연주자의 기타·앰프·마이크가 포함되어 있으며 동일 DI의 원음과 페달 출력이 제공되지 않습니다. 아래 자료는 음색 방향과 조작 반응을 확인하는 기준입니다. 음향 유사도 8/10을 실측했다고 주장하는 자료가 아닙니다.

| 페달 | 단독 시연 | 모델에서 확인할 기준 | 현재 상태 |
| --- | --- | --- | --- |
| Groovim 원형 | [Groovim과 RAT 심층 비교](https://www.youtube.com/watch?v=fkePcMQPigg), [Groovim 단독 연주](https://www.youtube.com/watch?v=I59dTgMQxUA) | 낮은 게인에서 어택을 남기고 강한 피킹에서 클리핑, Filter를 올리면 고역 감쇠, 저중역 두께 | 클리핑 진입점과 저중역·Filter 범위를 조정함. 오디오 A/B 미검증. |
| Angel | [제작사 Angel 단독 데모](https://www.youtube.com/watch?v=WlSPFTKvmTE), [Angel 조작 시연](https://www.youtube.com/watch?v=vlO3i3vBgxE) | 작은 피킹의 명료함, 높은 게인에서 어택·지속음, 독립 Bass·Treble | 두 증폭단을 덜 포화되도록 조정함. 오디오 A/B 미검증. |
| Awesome | [제작사 저게인 데모](https://www.youtube.com/watch?v=C7qMrp29UW8), [Molly Miller 제작사 리뷰](https://www.youtube.com/watch?v=tSwy3HS9UDk) | Klon 성향의 부스트→크런치, 높은 음역에서 정돈된 저역, Gain과 Tone 변화 | 클린/클립 혼합에 게인 연동 저역 차단을 추가함. 오디오 A/B 미검증. |

Awesome 리뷰의 제작사 제공 자막에는 게인 약 2시의 크런치와 낮은 게인의 부스트·명료함이 설명됩니다. 이는 시연자의 설명이지 부품별 회로나 같은 설정의 DI 측정값이 아닙니다. **각 모델이 8/10을 넘었다는 판정은 보류하며 세 페달의 스택 보정은 진행하지 않습니다.**
| BOSS DS-1 | [ElectroSmash 회로 분석](https://www.electrosmash.com/boss-ds1-analysis), [Aion Comet](https://aionfx.com/project-category/overdrive/) | 트랜지스터 증폭·하드 클리핑·톤 스택. 회로 개정별 차이 있음. |
| MXR Distortion+ | [ElectroSmash 회로 분석](https://electrosmash.com/mxr-distortion-plus-analysis) | 단순한 연산증폭기와 다이오드 하드 클리핑의 기준 모델. |
| BOSS HM-2 / Marshall Guv'nor / Shredmaster / Suhr Riot | [Aion 드라이브 목록](https://aionfx.com/project-category/overdrive/), [Guv'nor 회로 분석](https://electrosmash.com/marshall-guvnor-analysis) | 각각 다른 EQ가 음색의 핵심. |
| EHX Big Muff Pi / Op-Amp Big Muff | [Aion Halo](https://aionfx.com/project/halo-distortion-sustainer/), [Aion Fuzz 목록](https://aionfx.com/project-category/fuzz/) | 연쇄 트랜지스터 클리핑 및 톤 스택; 오퍼앰프형 별도. UI에는 Fuzz 하위 분류 권장. |
| Dallas-Arbiter Fuzz Face / Tone Bender Mk II | [Aion Fuzz 목록](https://aionfx.com/project-category/fuzz/) | 트랜지스터 비선형성과 기타 볼륨/입력 임피던스 상호작용 중요. |
| ZVEX Fuzz Factory / Univox Super-Fuzz | [Aion Fuzz 목록](https://aionfx.com/project-category/fuzz/) | 게이트·바이어스 및 옥타브 퍼즈를 별도 모델로. |

## 컴프레서, EQ, 필터

| 페달 | 공개 자료 | Web Effecter 구현 관점 |
| --- | --- | --- |
| Ibanez CP10 | 사용자가 제공한 회로도 `upload/스크린샷 2026-09-30 000345.png`; 기존 `cp10-worklet.js` | 회로 이미지 출처·개정 확인 후 어택/릴리스·게인 리덕션 검증. Drive가 아닌 Compressor. |
| MXR Dyna Comp / Ross Compressor | [Aion Aurora 회로 PDF](https://aionfx.com/app/files/docs/aurora_documentation.pdf), [분석](https://aionfx.com/project/aurora-compressor-sustainer/) | OTA 계열 압축, 엔벌로프와 메이크업 게인. |
| Keeley Compressor Plus | [Aion 압축/EQ 목록](https://aionfx.com/project-category/compression-eq/) | 컴프레서에 클린 블렌드 및 톤. |
| Dunlop Cry Baby GCB-95 / Mu-Tron III | [Cry Baby 회로 분석](https://electrosmash.com/crybaby-gcb-95), [Aion 모듈레이션 목록](https://aionfx.com/project-category/modulation-delay/) | 와우는 가변 공진 필터, 엔벌로프 필터는 연주 세기에 반응. |

## MOD: 코러스·페이저·플랜저·트레몰로·피치

| 페달 | 공개 자료 | Web Effecter 구현 관점 |
| --- | --- | --- |
| BOSS CE-2 / EHX Small Clone | [Aion 모듈레이션 목록과 제작 문서](https://aionfx.com/project-category/modulation-delay/) | BBD 지연을 LFO로 변조하고 원음과 혼합. |
| MXR Phase 90 / EHX Small Stone / Uni-Vibe | [Aion 모듈레이션 목록과 제작 문서](https://aionfx.com/project-category/modulation-delay/) | 다단 all-pass 또는 광학 변조. 각 페달의 단계 수와 피드백을 구분. |
| BOSS BF-2 Flanger / DC-2 Dimension C | [Aion 모듈레이션 목록과 제작 문서](https://aionfx.com/project-category/modulation-delay/) | 짧은 지연·피드백, DC-2는 별도 다중 변조. |
| BOSS TR-2 | [BOSS 제품·조작 자료](https://www.boss.info/global/products/tr-2/) | Rate, Depth, Wave의 LFO 진폭 변조. 공식 회로도는 이 조사에서 확보하지 못함. |
| 4ms Tremulus Lune | [Aion Luna 회로 PDF](https://aionfx.com/app/files/docs/luna_documentation.pdf) | 파형 대칭성까지 조절 가능한 아날로그 광학 트레몰로 참고. |
| DigiTech Whammy | [DigiTech 제품과 매뉴얼](https://digitech.com/dp/whammy/) | 실시간 피치 변화·하모니. 회로도만으로 원 DSP 알고리즘은 재현할 수 없음. |
| EHX Pitch Fork / BOSS PS-6 | [EHX 제품](https://www.ehx.com/products/pitch-fork/), [BOSS 제품](https://www.boss.info/us/products/ps-6/) | 폴리포닉 피치, 믹스, 음정 선택. 제품 자료 기준의 DSP 설계 대상. |

## 딜레이

| 페달 | 공개 자료 | Web Effecter 구현 관점 |
| --- | --- | --- |
| BOSS DD-200 / DD-500 | [DD-200 제품·12모드](https://www.boss.info/global/products/dd-200/), [DD-200 매뉴얼](https://www.boss.info/global/support/by_product/dd-200/), [DD-500 제품·12모드](https://www.boss.info/global/products/dd-500/), [DD-500 매뉴얼](https://www.boss.info/global/support/by_product/dd-500/owners_manuals/) | 두 모델의 기능 및 파라미터 참조. 정확한 내부 DSP 코드는 공개 자료에서 확인되지 않음. Digital, Analog, Tape, Reverse, Shimmer 등을 독립 모드로 설계. |
| BOSS DM-2 | [Aion Amethyst 회로](https://aionfx.com/project/amethyst-analog-delay/) | BBD 피드백의 대역 제한과 반복음 열화. |
| Ibanez EM5 Echomachine / Deep Blue Delay | [Aion 모듈레이션·딜레이 목록](https://aionfx.com/project-category/modulation-delay/) | 디지털 지연선에 아날로그식 필터·클리핑을 입히는 참고. |
| PT2399 기반 공개 딜레이 | [ElectroSmash PT2399 분석](https://www.electrosmash.com/pt2399-analysis), [Time Manipulator 공개 회로·BOM](https://www.electrosmash.com/time-manipulator) | 회로와 딜레이 동작을 동시에 연구하기 좋은 기준. |

## 리버브 및 딜레이+리버브

| 페달 | 공개 자료 | Web Effecter 구현 관점 |
| --- | --- | --- |
| Horizon Devices Flux Echo | [제조사 모드·조작 설명](https://horizondevices.com/products/flux-echo) | **딜레이+리버브 복합 페달**. 세 조합: clean analog repeat+ambient reverb, reverse delay+modulated reverb, tape echo+shimmer. 회로/내부 DSP 미확인. |
| EHX Holy Grail Nano | [제조사 제품](https://www.ehx.com/products/holy-grail/), [공식 매뉴얼 PDF](https://www.ehx.com/wp-content/uploads/2021/07/holy-grail-nano-manual.pdf) | Spring, Hall, Flerb. Flerb는 플랜저 성격의 리버브. 내부 알고리즘 미확인. |
| TC Electronic Hall of Fame 2 | [제조사 제품](https://www.tcelectronic.com/en/products/0709-afs) | 다중 리버브, TonePrint, Shimmer; 사용자 조작을 기준으로 근사 DSP 설계. 내부 TonePrint 알고리즘 미확인. |
| Strymon blueSky V2 | [제조사 제품](https://www.strymon.net/product/bluesky/), [Strymon 지원 자료](https://www.strymon.net/support/bluesky-v2/) | Plate, Room, Spring, Shimmer. V1/V2 차이를 확인하며 설계. 내부 DSP 미확인. |
| Strymon Flint | [제조사 제품](https://www.strymon.net/product/flint/) | 트레몰로+리버브 복합 모델 참고. |
| 공개 DSP 참고 자료 | [FAUST 표준 효과 라이브러리](https://faustlibraries.grame.fr/standardFunctions/), [FAUST pitch/granular 함수](https://faustlibraries.grame.fr/libs/misceffects/), [Spin FV-1 데이터시트](https://www.spinsemi.com/Products/datasheets/spn1001/FV-1.pdf) | 상용 페달의 내부 코드가 아니라 독립 구현을 위한 참고. 코드 재사용 시 라이선스 별도 확인. |

## 추가 후보와 순서

- **먼저 회로 모델 검증:** TS 계열, RAT, DS-1, Klon, Big Muff, Fuzz Face, Phase 90, CE-2, DM-2, Dyna Comp. 여러 공개 분석·제작 회로가 있어 부품값과 신호 경로 비교가 가능하다.
- **이어서 사용자 지정 페달:** OCD HP/LP, Jan Ray, CP10을 기존 코드와 회로에 대조한다. 사용자 제공 도면의 버전 및 출처를 기록한다.
- **DSP 독립 구현:** DD-200/500, Flux Echo, Holy Grail, Hall of Fame, blueSky, Whammy/Pitch Fork는 매뉴얼의 기능·조작 범위를 참조하고 자체 딜레이/리버브/피치 엔진으로 구현한다. 화면 표기에는 `영감 받은 모델` 또는 `근사 모델`을 사용한다.
- **추가 인기군:** EHX Memory Man, BOSS RE-202/RV-6, TC Flashback, Strymon Timeline/BigSky, EQD Dispatch Master, Dunlop Cry Baby, BOSS TU-3/NS-2 등을 같은 기준으로 다음 조사에 넣는다. 이 항목들은 **아직 회로 확인 완료 목록에 포함하지 않는다.**

공개된 회로도는 연구·분석에 쓸 수 있다는 뜻이지 해당 도면이나 제품 사진을 사이트에 재배포할 권리를 자동으로 주지는 않는다. 특히 디지털 페달의 아날로그 입출력 회로가 있어도 DSP 프로그램의 세부 동작은 거기서 알 수 없다.

## 2026-10-03: 나머지 출시 모델의 단독 근사 점검

현재 카탈로그의 61개 모델을 동일한 DI 입력으로 그래프 생성·노브 변경 회귀 검사 대상으로 묶었다 (`npm test`). 이 검사는 **신호 경로와 파라미터 동작**을 확인한다. 제작사 영상에는 기타·앰프·마이크·믹스가 들어 있고 원본 DI와 페달만 지난 출력 파일이 함께 공개된 경우가 드물어, 해당 영상의 소리를 자동으로 빼서 정량 A/B하거나 8점 이상이라고 판정하지 않았다. 공개 영상은 모드 선택·노브 방향·음색 경향을 정하는 참고 기준으로 사용한다.

| 대상 | 이전 구현값/동작 | 이번 수정값/동작 | 근거와 검증 상태 |
| --- | --- | --- | --- |
| OD-1 / SD-1 | 동일 `od1` 증폭·EQ, 둘 다 Tone 노브 | OD-1 Tone 제거·고정 보이싱, SD-1 저역 +1.7 dB·독립 Tone, 증폭량 0.75/0.88배 구분 | [BOSS SD-1 역사·제품](https://www.boss.info/global/products/sd-1/): OD-1은 2노브, SD-1은 Tone과 저역 보강. 음량 정규화한 실기 A/B 없음. |
| RAT / RAT2 / Turbo RAT | Filter를 올리면 **밝아짐**; Turbo도 같은 하드클리핑 곡선 | Filter 0→100에서 저역통과 9.5→1.7 kHz로 역전. RAT2 증폭 1.04배, Turbo는 클리핑 곡선 기울기 3→1.5·출력 계수 차이 | [ElectroSmash RAT 회로 분석](https://electrosmash.com/proco-rat)과 [Groovim/RAT 비교](https://www.youtube.com/watch?v=fkePcMQPigg). 정확한 RAT 연식별 부품과 LED 전압 실측은 하지 않음. |
| Dyna Comp / Ross / Keeley Plus | Dyna와 Ross의 압축 파라미터 동일 | Ross threshold 기본 -15 dB/ratio 5:1/release 220 ms, Dyna -12 dB/4.5:1/110 ms; Keeley 별도 knee·병렬 Blend | [Aion Aurora 회로 자료](https://aionfx.com/project/aurora-compressor-sustainer/). 이 값들은 실측 부품값이 아니라 구별 가능한 초기 근사값. 원음·압축 후 출력 쌍 미확보. |
| CE-2 / Small Clone / BF-2 / DC-2 | 대부분 한 변조 지연선; DC-2 역시 한 선 | Small Clone 기본 33 ms/더 깊은 sweep, CE-2 기본 22 ms, BF-2 기본 5 ms+feedback, DC-2는 19/24 ms 역위상 변조 2탭 | [BOSS Dimension 설명](https://www.boss.info/au/products/dc-2w/), [Aion 모듈레이션 자료](https://aionfx.com/project-category/modulation-delay/). DC-2 원형 프리셋·스테레오와 동일하지 않음. |
| TR-2 / Tremulus Lune | Wave shape 노브 무반응 | Shape <28 triangle, 28–75 sine, >75 square로 변경 | [BOSS TR-2 조작 자료](https://www.boss.info/global/products/tr-2/). 광학식 연속 파형 변형은 미구현. |
| Pitch Fork / PS-6 / Whammy | 셋 모두 같은 1개 고정 피치 시프터 | Pitch Fork Up/Down/Dual의 두 피치 경로, PS-6 원음+두 고정 화음, Whammy는 연속 Shift | [EHX Pitch Fork 제작사 데모](https://www.youtube.com/watch?v=s2O2xaRfje0), [BOSS PS-6 기능](https://www.boss.info/us/products/ps-6/), [DigiTech Whammy 매뉴얼](https://digitech.com/wp-content/uploads/2022/09/Whammy_OM_EN.pdf). PS-6 지능형 키 추적 및 발 페달은 미구현. |
| DD-200 / DD-500 | Dual도 단일 지연, DD-200/500 같은 Digital/Analog/Tape/Dual/Mod/Ambient 목록 | Dual일 때 두 번째 직렬 지연 0.67×시간·0.7 send; 다른 모드에서는 차단. Standard/Analog/Tape/Dual 및 단순화한 Mod/Ambient로 표기 | [BOSS DD-200 모드](https://www.boss.info/us/products/dd-200/), [DD-500 모드](https://www.boss.info/au/products/dd-500/). Mod/Ambient는 실제 기기의 독립 모드 이름이 아님. 두 제품의 전체 12모드·스테레오 차이는 여전히 미구현. |
| DM-2 / Deep Blue / PT2399 | 같은 Analog 반복 필터 | 기준 필터 2.3/4.8/3.3 kHz로 나눔. 기타 노브 설정에 따라 필터 이동 | [Aion DM-2 파생 자료](https://aionfx.com/project/amethyst-analog-delay/), [PT2399 분석](https://www.electrosmash.com/pt2399-analysis). 실기에서 컷오프를 추출한 값은 아님. |
| Holy Grail Nano | Flerb에서 all-pass 주파수 변조만 수행 | Spring/Hall/Flerb 선택을 유지하면서 Flerb에 리버브 뒤 8 ms 변조 지연 추가 | [EHX 공식 데모 0:48–1:45](https://www.youtube.com/watch?v=zdlnNNHEE5g), [EHX 제품 설명](https://www.ehx.com/products/holy-grail/). 원 알고리즘과 꼬리의 정량 비교는 미완. |
| Flux Echo | Mix=0에서도 고정 echo 0.18이 출력 | echo 출력은 Mix의 0.24배로 연동, Mix=0에서 dry만 | [Horizon 제품 설명](https://horizondevices.com/products/flux-echo). Mix 조작의 회귀 확인; 음향 A/B 미완. |

나머지 단독 모델 중 **TS Mini/TS808/TS9, OD-3, BD-2, Centaur/KTR, ODR-1, Bluesbreaker/KoT, Lightspeed/Timmy/Zendrive, DS-1/Distortion+/HM-2/Guv'nor/Shredmaster/Riot, 여섯 Fuzz, Cry Baby/Mu-Tron, Phase 90/Small Stone/Uni-Vibe, EM5, Hall of Fame 2/blueSky/Flint**는 기존 개별 보이싱·모드 경로를 유지하고 전체 그래프 검사를 통과했다. 공개 시연의 피킹·앰프 설정을 일치시킬 DI가 없어서 이번 점검에서 그 모델의 음색을 수치 보정했다고 주장하지 않는다. 기존의 **CP10·OCD·Jan Ray**는 별도 Worklet과 사용자 제공 회로 참고 모델이고, 이번 카탈로그 변경의 보정 대상에서 제외됐다. 이 모델들도 같은 DI의 실측 dry/wet 출력이 생기면 독립 오디오 검증이 가능하다.
