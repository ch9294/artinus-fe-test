# ARTINUS Frontend Engineer 사전과제

Expo SDK 57, React Native, TypeScript 기반 앱입니다. 개발 빌드 설정과 카메라 권한 요청, 프리뷰, 정지 이미지 촬영·확인 화면을 구현했습니다. OCR은 아직 구현하지 않았습니다.

## 개발 빌드 실행

Node.js와 pnpm을 준비한 뒤 저장소 루트에서 실행합니다.

```sh
pnpm install --frozen-lockfile
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
pnpm android              # 실행 중인 Android 에뮬레이터에 빌드·설치
```

iPhone 실기기에서는 Xcode, CocoaPods, Apple 계정 서명, 기기 신뢰 및 개발자 모드가 준비되어야 합니다. 이 Mac은 Xcode 앱이 활성 개발 도구로 선택되어 있습니다.

```sh
pnpm ios
```

최초 설치 후 TypeScript/JavaScript만 수정했다면 `pnpm start`로 Metro를 켜고 설치된 개발 빌드에서 프로젝트를 엽니다. 카메라 패키지와 `app.json` 플러그인을 반영하려면 `pnpm expo prebuild --clean` 후 해당 플랫폼을 다시 빌드합니다. 촬영 기능은 카메라가 있는 기기에서 확인해야 합니다. `pnpm typecheck`와 `pnpm lint`로 정적 검사를 실행합니다.

기본 앱의 iPhone 실기기·Android 에뮬레이터 실행 결과는 [PR 01 개발 빌드 기록](docs/pr-01-development-build.md)에 있습니다. 카메라 권한·프리뷰·촬영·이미지 방향은 아직 기기에서 검증하지 않았으며, 절차는 [PR 03 카메라 촬영 기록](docs/pr03-camera-capture.md)에 있습니다. 자동 검사 결과는 [PR 02 검사 기록](docs/quality-gates.md), 과제 목표는 [과제 계획](docs/assignment-plan.md)을 참고하세요.
