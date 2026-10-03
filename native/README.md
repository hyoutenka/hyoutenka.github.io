# Windows ASIO 입출력 실험

실제 기타 입력에서 출력까지 **20ms 미만**을 목표로 하는 첫 번째 로컬 오디오 경로입니다. 기존 GitHub Pages 페이지는 그대로 열 수 있지만, 이 단계의 네이티브 엔진은 아직 페이지의 8개 이펙트와 연결되지 않았습니다. 먼저 같은 ASIO 콜백 안에서 원음을 모니터링하고 물리 루프백 지연을 검증합니다. 브라우저의 `outputLatency` 숫자는 이 프로그램의 지연을 나타내지 않습니다.

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

## 지연 실측

드라이버가 보고하는 입력·출력 지연의 합은 **왕복 실측이 아닙니다**. 실제 확인에는 기타와 스피커를 분리한 상태에서 4i4의 **후면 Line Output 3 → Line Input 3**을 케이블로 연결하고 아래 명령을 실행합니다. 테스트는 왼쪽 출력으로만 약 -30 dBFS의 짧은 신호를 한 번 내보냅니다. 입력 3의 ASIO 인덱스가 `2`인지 표시된 채널 이름으로 확인하세요.

```powershell
native/dist/WebEffecter.Audio.exe --driver "드라이버 이름" --input 2 --left 2 --right 3 --rate 48000 --buffer 64 --measure
```

`Physical loopback`은 그 케이블 경로의 출력 D/A → 입력 A/D를 포함한 측정값입니다. 같은 설정으로 몇 번 재시작해 **20ms 미만**, `resyncs 0`, 클릭/드롭아웃 없음이 모두 성립해야 통과로 봅니다. 그다음 8개 이펙트를 이 콜백 경로에 이식하고, 각 체인에서도 동일하게 다시 측정해야 합니다. 이 빌드가 실제 Scarlett에서 20ms를 달성했다는 주장은 아직 하지 않습니다.

## 다음 통합 단계

웹 체인 편집과 프리셋 형식은 유지하고, DSP를 이 네이티브 콜백에서 처리할 수 있는 공통 모듈로 옮깁니다. 제어 명령만 UI와 교환하고 오디오 샘플은 브라우저나 네트워크를 경유시키지 않습니다. 영상 소리와 ASIO 출력의 동시 사용·동기화도 별도로 검증해야 합니다.
