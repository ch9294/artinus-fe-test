# ARTINUS Frontend Engineer 사전과제

Expo SDK 57, React Native, TypeScript 기반 앱입니다. 현재 기본 화면과 Expo development build 설정만 있으며 카메라·OCR 기능은 아직 구현되지 않았습니다.

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

최초 설치 후 TypeScript/JavaScript만 수정했다면 `pnpm start`로 Metro를 켜고 설치된 개발 빌드에서 프로젝트를 엽니다. 네이티브 의존성이나 `app.json`을 변경했다면 `pnpm expo prebuild --clean` 후 해당 플랫폼을 다시 빌드합니다. `pnpm typecheck`로 타입을 검사합니다.

필요한 도구, 기기별 준비 절차, 현재 실행 검증 결과와 차단점은 [PR 01 개발 빌드 기록](docs/pr-01-development-build.md)에 있습니다. 과제 목표와 후속 작업은 [과제 계획](docs/assignment-plan.md)을 참고하세요.
