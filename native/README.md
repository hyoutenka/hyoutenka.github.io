# Windows ASIO 입출력 실험

실제 기타 입력에서 출력까지 **20ms 미만**을 목표로 하는 로컬 오디오 경로입니다. 기존 GitHub Pages 페이지는 그대로 열 수 있지만, 네이티브 엔진은 아직 페이지의 8개 노드 편집기와 연결되지 않았습니다. 원음 모니터링과 첫 번째 네이티브 이펙트 체인은 같은 ASIO 콜백에서 처리합니다. 브라우저의 `outputLatency` 숫자는 이 프로그램의 지연을 나타내지 않습니다.

Windows용 .NET 9과 [NAudio 3.1.0](https://www.nuget.org/packages/NAudio/3.1.0)을 사용합니다. NAudio는 MIT 라이선스입니다. 제조사 ASIO 드라이버를 설치한 오디오 인터페이스에서 사용하세요.

```powershell
dotnet publish native/WebEffecter.Audio/WebEffecter.Audio.csproj -c Release -o native/dist
native/dist/WebEffecter.Audio.exe --list
```

GitHub Actions의 **Windows ASIO audio prototype** 빌드 아티팩트에서도 실행 파일을 받을 수 있습니다. 파일을 실행하기 전에 Windows의 신뢰 확인 대화상자가 뜨면 출처와 빌드를 직접 확인하세요. 이 프로그램은 서명되지 않은 개발용 빌드입니다.

## Scarlett 4i4 3세대

1. `--list`에서 실제 ASIO 드라이버 이름을 확인하세요. 예시 문자열을 그대로 쓰지 말고 출력된 이름을 `--driver`에 넣으세요.
2. 처음에는 헤드폰 볼륨을 낮추고 Focusrite Control의 **Headphones 3-4**에서 해당 소프트웨어 재생 3-4를 듣도록 라우팅하세요. 하드웨어 기타 입력의 다이렉트 모니터를 같은 헤드폰 믹스에 더하면 원음이 중복되어 들립니다.
3. 입출력 채널 번호는 **0부터 시작**합니다. 아래의 `--left 2 --right 3`은 ASIO 출력 3/4를 뜻하며, 실행 시 표시되는 드라이버 채널 이름을 확인해야 합니다. 기타가 Scarlett의 **입력 2번**에 꽂혀 있다면 `--input 1`입니다.

```powershell
native/dist/WebEffecter.Audio.exe --driver "드라이버 이름" --input 1 --left 2 --right 3 --rate 48000 --buffer 64 --gain 0.5
```

`--buffer 64`가 드라이버에서 거부되거나 소리가 끊기면 `128`, 그다음 `256`을 시험하세요. `--buffer`를 생략하면 드라이버의 선호 크기를 사용합니다. 종료하려면 Enter를 누릅니다.

### 첫 번째 네이티브 이펙트 체인

기존 웹 구현의 Jan Ray와 OCD 회로 **근사 알고리즘**을 네이티브 오디오 콜백으로 옮겼습니다. `--chain`에는 쉼표로 구분한 `janray`, `ocd`를 최대 8개까지 적을 수 있으며 순서대로 적용됩니다. 기본 상태는 빈 체인(원음)입니다. 현 단계에서는 웹 편집기와 파라미터 연동이 없고, 두 이펙트는 웹의 기본 노브 값으로 고정됩니다. 이펙트를 켤 때 출력 음량이 갑자기 달라질 수 있으므로 헤드폰 볼륨을 낮추고 시작하세요.

```powershell
native/dist/WebEffecter.Audio.exe --driver "드라이버 이름" --input 1 --left 2 --right 3 --rate 48000 --buffer 64 --gain 0.5 --chain janray
native/dist/WebEffecter.Audio.exe --driver "드라이버 이름" --input 1 --left 2 --right 3 --rate 48000 --buffer 64 --gain 0.5 --chain janray,ocd
```

단일 이펙트와 스택에서 기타 소리, 클릭/끊김, `driver resyncs`를 확인하세요. 효과음의 체감 지연과 실제 물리 루프백 지연은 별개이므로, 체인의 20ms 목표는 별도로 측정해야 합니다.

### 실행되는데 소리가 들리지 않을 때

새 빌드는 매초 `IN ... dBFS · OUT ... dBFS` 피크를 출력합니다. 기타를 연주할 때 IN이 계속 `-inf dBFS`면 `--input` 인덱스(전면 입력 2는 ASIO 인덱스 `1`), INST 모드, 입력 게인과 드라이버의 입력 채널 이름을 확인하세요. IN이 움직이는데 OUT이 `-inf dBFS`면 명령의 `--gain`과 현재 모드를 확인하세요.

출력 경로만 따로 확인하려면 헤드폰 볼륨을 낮춘 뒤 아래의 작은 440 Hz 시험음을 실행합니다. `--tone`은 기타 입력과 무관하게 선택한 두 ASIO 출력으로 약 -30 dBFS를 보냅니다.

```powershell
native/dist/WebEffecter.Audio.exe --driver "드라이버 이름" --input 1 --left 2 --right 3 --rate 48000 --buffer 64 --tone
```

시험음의 OUT 미터가 움직이는데 헤드폰으로 들리지 않으면 Focusrite Control의 **Output Routing → Headphones 3-4**에 **Software Playback 3-4**가 전달되는지, 출력 페이더와 전면 헤드폰 볼륨을 확인하세요. `--left 0 --right 1`로 모니터 출력 1/2에도 시험할 수 있지만, 스피커 볼륨과 피드백을 먼저 낮추세요. 소프트웨어 처리음을 확인하는 동안 하드웨어 입력 다이렉트 모니터를 같은 믹스에서 올리면 원음이 중복되어 들릴 수 있습니다.

## 지연 실측

드라이버가 보고하는 입력·출력 지연의 합은 **왕복 실측이 아닙니다**. 실제 확인에는 기타와 스피커를 분리한 상태에서 4i4의 **후면 Line Output 3 → Line Input 3**을 케이블로 연결하고 아래 명령을 실행합니다. 테스트는 왼쪽 출력으로만 약 -30 dBFS의 짧은 신호를 한 번 내보냅니다. 입력 3의 ASIO 인덱스가 `2`인지 표시된 채널 이름으로 확인하세요.

```powershell
native/dist/WebEffecter.Audio.exe --driver "드라이버 이름" --input 2 --left 2 --right 3 --rate 48000 --buffer 64 --measure
```

`Physical loopback`은 그 케이블 경로의 출력 D/A → 입력 A/D를 포함한 측정값입니다. 같은 설정으로 몇 번 재시작해 **20ms 미만**, `resyncs 0`, 클릭/드롭아웃 없음이 모두 성립해야 통과로 봅니다. 현재 `--measure`는 빈 체인 경로만 측정하며, 이펙트를 켠 체인의 왕복 지연은 아직 측정하지 못합니다. 이 빌드가 실제 Scarlett에서 20ms를 달성했다는 주장은 아직 하지 않습니다.

## 다음 통합 단계

웹 체인 편집과 프리셋 형식은 유지하고, 나머지 DSP와 노브 제어를 네이티브 콜백으로 옮깁니다. 제어 명령만 UI와 교환하고 오디오 샘플은 브라우저나 네트워크를 경유시키지 않습니다. 영상 소리와 ASIO 출력의 동시 사용·동기화도 별도로 검증해야 합니다.
