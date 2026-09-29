# ARTINUS Frontend Engineer 사전과제

Expo SDK 57, React Native, TypeScript 기반 앱입니다. 카메라 권한 요청, 프리뷰, 정지 이미지 촬영·확인, 한국어·영어 온디바이스 OCR, 스크롤 가능한 결과 화면과 재촬영을 구현했습니다. iOS에서는 근접 촬영 시 광각·초광각 자동 전환이 가능한 카메라를 우선 사용합니다.

## 개발 빌드 실행

Node.js와 pnpm을 준비한 뒤 저장소 루트에서 실행합니다.

```sh
pnpm install --frozen-lockfile
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
pnpm android              # USB 연결 Android 실기기 또는 실행 중인 에뮬레이터에 빌드·설치
```

새 터미널에서는 위 `export` 명령을 다시 실행합니다. 현재 체크아웃처럼 `android/local.properties`에 `sdk.dir=/Users/ch9294/Library/Android/sdk`를 적어도 됩니다. 이 파일은 기기별 경로를 담으므로 Git에서 제외되며 `expo prebuild --clean` 후에는 다시 생성해야 합니다. USB 실기기는 USB 디버깅을 허용하고 `adb devices`에 `device`로 표시되는지 확인합니다. `pnpm android`는 USB 포트 전달에 맞춰 Metro 주소로 `127.0.0.1`을 사용합니다.

iPhone 실기기에서는 Xcode, CocoaPods, Apple 계정 서명, 기기 신뢰 및 개발자 모드가 준비되어야 합니다. 이 Mac은 Xcode 앱이 활성 개발 도구로 선택되어 있습니다.

```sh
pnpm ios
```

최초 설치 후 TypeScript/JavaScript만 수정했다면 `pnpm start`로 Metro를 켜고 설치된 개발 빌드에서 프로젝트를 엽니다. OCR 설정, 안전 영역 의존성이나 iOS 카메라 패치를 반영하려면 해당 플랫폼을 다시 빌드합니다. 촬영과 근접 초점은 카메라가 있는 실기기에서 확인해야 합니다. `pnpm typecheck`, `pnpm lint`, `pnpm test`로 자동 검사를 실행합니다.

Mac이 iPhone 핫스팟을 사용하는 등 기기에서 Metro의 LAN 주소에 접속할 수 없다면 `pnpm start:tunnel`로 HTTPS 터널을 시작하고 터미널의 새 QR 코드를 iPhone 카메라로 스캔합니다. 처음 실행할 때 Expo가 요구하는 `@expo/ngrok` 전역 설치가 필요합니다. 기존 LAN 주소를 가리키는 앱 화면의 `Reload`는 사용하지 않습니다.

기본 앱의 iPhone 실기기·Android 에뮬레이터 실행 결과와 Android 실기기 `SM_A245N`의 빌드·카메라 프리뷰 확인은 [TASK 01 개발 빌드 기록](docs/pr-01-development-build.md)에 있습니다. TASK 05의 Android 실기기에서는 서로 다른 인쇄체를 두 번 인식했고 결과 혼선 없이 재촬영했습니다. iPhone 실기기의 두 번 연속 인식·재촬영과 긴 결과 스크롤은 사용자가 확인해 보고했습니다. Android에서 화면 높이를 넘는 결과의 실제 스크롤은 아직 확인하지 않았습니다. TASK 04의 언어별 샘플 조건과 Android 실기기의 촬영 사진 방향·화질, 변경된 iOS 근접 초점도 재검증이 필요합니다. 자세한 범위는 [TASK 03 카메라 기록](docs/pr03-camera-capture.md), [TASK 04 OCR·초점 기록](docs/task04-implementation.md), [TASK 05 결과·재촬영 기록](docs/task05-result-retake.md), [TASK 07 이탈·중복 요청 기록](docs/task07-processing-lifecycle.md), [TASK 11 안전 영역 기록](docs/task11-android-safe-area.md), [TASK 02 검사 기록](docs/quality-gates.md), [과제 계획](docs/assignment-plan.md)을 참고하세요.
