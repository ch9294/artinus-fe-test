# PR 01 — 양 플랫폼 개발 빌드 환경 구성 기록

- 기록일: 2026-09-25~26 KST
- 작업 위치: `chore/pr01-development-build` 워크트리
- 범위: 기본 앱의 Expo development build와 로컬 iOS·Android 빌드 준비
- 상태: Expo 개발 빌드를 iPhone 16 Pro Max 실기기와 Pixel 9 Android 에뮬레이터에서 각각 실행 확인. PR 01의 기본 앱 실행 조건 충족.

## 선택 근거와 프로젝트 변경

Expo SDK 57의 [development build 안내](https://docs.expo.dev/develop/development-builds/introduction/)와 [로컬 빌드 안내](https://docs.expo.dev/guides/local-app-development/)를 확인했다. 기존 pnpm 프로젝트에 Expo가 선택한 SDK 호환 버전 `expo-dev-client@57.0.19`를 설치했다. EAS 계정이 필요 없는 `expo run:ios`·`expo run:android` 로컬 빌드 경로를 사용한다. `ios/`와 `android/`는 Expo prebuild로 생성하고 Git에서 제외하는 기존 방식을 유지한다.

- `package.json`, `pnpm-lock.yaml`: `expo-dev-client`와 `expo-build-properties` 추가. `pnpm android`는 `expo run:android`, `pnpm ios`는 실기기 선택을 위한 `expo run:ios --device`, `pnpm start`는 `expo start --dev-client` 실행.
- `app.json`: iOS bundle identifier와 Android package를 `com.ch9294.artinusfetest`로 설정하고 iOS Scene Lifecycle을 활성화했다. iPhone에서 이 식별자로 서명·설치됐다.
- `README.md`: 개발 빌드 실행 방법과 현재 상태를 반영.

## 초기 로컬 환경과 설치 결과 (2026-09-25)

| 항목 | 확인 결과 |
| --- | --- |
| 호스트 | Apple Silicon Mac, macOS 27.0 (26A428) |
| Node.js / pnpm | 24.21.0 / 12.4.2 |
| Expo / React Native / dev client | 57.0.24 / 0.86.3 / 57.0.19 |
| Xcode | `/Applications/Xcode.app`, 27.0 (27A266a) 설치. 활성 경로는 `/Library/Developer/CommandLineTools` |
| Xcode 사용 가능 여부 | `xcrun simctl list devices available`에서 라이선스 미동의로 종료 코드 69. 필수 컴포넌트·시뮬레이터 목록 미확인 |
| iPhone | 이 작업 환경에서 USB 연결 기기 감지 안 됨. 기종·iOS 버전·신뢰·개발자 모드·서명 상태 미확인 |
| Android | Android Studio, 기본 경로 `~/Library/Android/sdk`, `adb`, Java 런타임 미설치·미감지. 에뮬레이터와 Android OS 버전 미확인 |
| CocoaPods | `pod` 명령 미감지. 사용자 계정 설치 시도는 응답이 없어 중단했으며 설치 완료 안 됨 |

수행한 설치는 `pnpm expo install expo-dev-client`뿐이다. `brew install --cask zulu@17 android-studio`는 `formulae.brew.sh` DNS 조회 실패로 완료되지 않았다. `pnpm ios --no-bundler`가 시도한 CocoaPods Gem/Homebrew 자동 설치도 실패했다. 공식 Android Studio 다운로드 페이지는 접근되지만 Studio·SDK는 설치하지 않았다.

## 실행 명령과 확인 결과

| 명령 | 결과 |
| --- | --- |
| `pnpm expo install expo-dev-client` | 성공, SDK 57 호환 `~57.0.19` 설치 및 잠금 파일 갱신 |
| `pnpm install --frozen-lockfile --offline` | 실패: 로컬 pnpm 저장소에 `metro-core@0.84.6` tarball snapshot이 없어 `ERR_PNPM_NO_OFFLINE_TARBALL` 발생 |
| `pnpm install --frozen-lockfile` | 성공, 잠금 파일 기준 465개 패키지 설치 |
| `pnpm typecheck` | 성공 |
| `pnpm expo config --json` | 성공, 양 플랫폼 식별자와 SDK 57 설정 확인 |
| `pnpm expo install --check` | 로컬 호환 버전 맵 기준 성공. 네트워크 조회가 비활성화되어 온라인 확인은 미수행 |
| `pnpm expo prebuild --platform all --no-install` | 성공, 무시되는 `ios/`, `android/` 생성. Android의 `userInterfaceStyle` 적용에는 `expo-system-ui`가 필요하다는 경고 확인 |
| `pnpm expo export --platform ios --platform android` | 성공, 양 플랫폼 JavaScript 번들 생성. 네이티브 앱 빌드·실행 검증과는 별개 |
| `pnpm start --offline` | 개발 서버 시작 메시지를 확인했으나 준비 완료 신호가 나오지 않아 약 30초 뒤 중단. 개발 빌드 연결 미확인 |
| `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer pnpm ios --no-bundler` | 실패: CocoaPods CLI 부재와 자동 설치 실패. Xcode 라이선스 미동의, 기기·서명 검증 전 |
| `pnpm android --no-bundler` | 실패: Android SDK 기본 경로 없음, `adb ENOENT` |
| `git diff --check` | 성공, 변경 파일의 공백 오류 없음 |

위 표는 2026-09-25의 초기 결과이며 아래 9/26 결과가 현재 상태다. Android 에뮬레이터 결과를 실기기 결과로 간주하지 않는다.

## 2026-09-26 iPhone 진행 및 iOS 27 크래시 수정

사용자가 Xcode 27.0 라이선스 동의·개발 도구 선택·Apple 계정 로그인·iPhone 연결과 신뢰·개발자 모드를 직접 완료했다. CocoaPods 1.17.0 설치도 확인했다. 개발 인증서는 생성됐지만 WWDR G3 중간 인증서가 없어 처음에는 유효한 서명 항목이 0개였다. 사용자가 [Apple PKI의 WWDR G3](https://www.apple.com/certificateauthority/)를 로그인 키체인에 추가한 뒤 실제 Mac에서 유효한 서명 항목 1개를 확인했다. 이 과정에서 개인 계정 정보·개인 키는 기록하지 않았다.

현재 `xcode-select -p`는 `/Applications/Xcode.app/Contents/Developer`를 가리킨다.

첫 `pnpm ios` 빌드로 앱이 설치됐으나 사용자가 iPhone에서 개발자를 직접 신뢰한 뒤에도 앱이 즉시 종료됐다. 연결된 iPhone은 iPhone 16 Pro Max로 계획한 기기이며, 크래시 보고서에서 iPhone OS 27.0 (24A437), 개발자 모드 활성 상태를 확인했다. `xcrun devicectl device process launch --device iPhone --console --timeout 30 com.ch9294.artinusfetest`로 종료 신호 5를 재현했다. 앱 크래시 기록의 `EXC_BREAKPOINT/SIGTRAP` 발생 지점은 UIKit의 `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`였다. 이 기록은 기기 진단 자료이므로 저장소에 넣지 않았다.

[Apple의 iOS 27 Scene Lifecycle 요구사항](https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle) 및 [Expo SDK 57의 Xcode 27 대응 안내](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md)에 따라 `expo-build-properties@57.0.22`를 설치하고 `ios.enableSceneSupport: true`를 `app.json`에 설정했다. `pnpm expo prebuild --clean --platform ios --no-install` 후 생성된 `Info.plist`의 `UIApplicationSceneManifest`와 `AppDelegate`의 `ExpoReactNativeFactoryProvider`를 직접 확인했다. `pnpm typecheck`와 `git diff --check`는 통과했다.

`pnpm expo run:ios --device iPhone --no-bundler`에서 Xcode **Build Succeeded**, 오류 0개·빌드 단계 경고 1개를 확인했다. 기기 설치가 진행된 뒤 자동 실행은 **기기가 잠겨 있어 실패**해 당시에는 화면 실행이 미확인 상태였다.

사용자가 iPhone 잠금 해제 후 수정된 기본 앱을 직접 열어 화면이 유지되고 정상 실행된다고 보고했다. 따라서 iPhone 16 Pro Max / iPhone OS 27.0에서 **기본 앱 실행은 사용자 직접 확인**으로 기록한다. 이 대화에서는 앱 내부의 카메라·OCR 기능이나 반복 실행 안정성을 검증하지 않았다. 이후 사용자가 Azul Zulu JDK 17을 설치했고, `java -version`에서 `17.0.20.1`과 `/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`을 확인했다.

사용자가 Android Studio 기본 설정을 완료했다. 실제 앱 경로는 `/Users/ch9294/Applications/Android Studio.app`, 버전은 2026.1 (build `AI-261.26222.65.2614.16379836`)이다. SDK는 `~/Library/Android/sdk`에 있으며 Platform Tools 37.0.1, Build-Tools 36.0.0, Emulator 37.1.11, Android SDK Platform 37.0이 감지됐다. 이 시점에는 API 36 플랫폼·시스템 이미지·AVD가 없었고 `ANDROID_HOME`·`JAVA_HOME` 환경 변수도 에이전트 쉘에 없었다. `adb devices`는 샌드박스의 5037 포트 권한 문제로 실패했으므로 도구 설치 오류로 해석하지 않았다.

추가 설치 뒤 `~/Library/Android/sdk/platforms/android-36.1`과 `sources/android-36.1`을 확인했다. 이는 Android 16.1(API 36.1) 패키지이며, Expo SDK 57의 `compileSdkVersion`인 API 36 플랫폼 디렉터리 `platforms/android-36`은 여전히 없다. SDK Platform 36 설치가 필요하다.

이후 사용자가 Android SDK Platform 36과 Sources for Android 36을 설치했다. `~/Library/Android/sdk/platforms/android-36/source.properties`에서 `AndroidVersion.ApiLevel=36`, `AndroidVersion.IsBaseSdk=true`, `Pkg.Revision=2`를 직접 확인했다. `system-images` 디렉터리는 아직 없어 Android 16(API 36) 에뮬레이터 이미지는 미설치이며, AVD 실행과 Android 앱 빌드도 미검증이다.

사용자가 Pixel 9 가상 기기를 생성했다. `emulator -list-avds`에서 `Pixel_9`을 확인했고, AVD 설정은 `target=android-36`, Google Play 이미지 `system-images/android-36/google_apis_playstore/arm64-v8a/`를 가리킨다. 이미지 메타데이터의 API 수준은 36, ABI는 `arm64-v8a`, 이미지 리비전은 7이다. 가상 기기의 실제 부팅과 앱 빌드·실행은 아직 미확인이다.

## 2026-09-26 Android 빌드·실행 검증

[Expo의 Android 에뮬레이터 안내](https://docs.expo.dev/workflow/android-studio-emulator/)에 맞춰 SDK Platform 36과 AVD를 사용했다. 사용자가 직접 부팅한 `Pixel_9`은 Apple Silicon용 Google Play `arm64-v8a` 이미지이며, ADB에서 `emulator-5554 device`, Android 16/API 36, 빌드 `BE2A.250530.026.D1`을 확인했다. 이는 **에뮬레이터 검증**이며 Android 실기기 검증이 아니다.

`ANDROID_HOME=/Users/ch9294/Library/Android/sdk`, `JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`을 명령별로 지정했다. Android SDK에는 빌드 중 NDK 27.1.12297006과 Build-Tools 35.0.0이 추가로 설치됐으며, 설치된 Build-Tools 36.0.0도 확인했다. Gradle 9.3.1의 프로젝트 설정에서 `compileSdk=36`, `targetSdk=36`, `buildTools=36.0.0`을 확인했다. 라이선스 동의는 사용자가 Android Studio 설정 과정에서 직접 수행했고, Gradle은 해당 SDK 라이선스가 이미 승인됐다고 출력했다.

첫 `pnpm expo run:android --device emulator-5554 --no-bundler`는 Expo가 시리얼을 기기 이름으로 찾지 못해 실패했다. `--device Pixel_9`을 사용하니 빌드가 시작됐다. 초기 실행은 `react-android-0.86.3-debug.aar`의 큰 Maven Central 다운로드 중 오래 대기하여 중단했다. 진단용 `./gradlew app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a --info --max-workers=2`로 다운로드가 진행되는 것을 확인했고, **BUILD SUCCESSFUL**(11분 47초, 304개 작업)을 얻었다. `pnpm expo run:android --device Pixel_9` 재실행도 **BUILD SUCCESSFUL**(3초)로 끝나고 APK를 에뮬레이터에 설치했으며 Metro가 `localhost:8081`에서 시작됐다.

ADB에서 `com.ch9294.artinusfetest` 프로세스와 전면 `MainActivity`를 확인했다. 화면 캡처에서는 개발 메뉴를 닫은 뒤 흰 배경에 `Open up App.tsx to start working on your app!`가 표시됐다. 따라서 **기본 앱의 빌드·설치·JavaScript 화면 실행을 직접 확인**했다. 캡처는 `/private/tmp/pr01-android-emulator-final.png`에만 두었고 저장소에는 넣지 않았다.

검증 후 이 세션의 Metro 프로세스는 종료했다. 다시 실행할 때는 저장소 루트에서 `pnpm start`를 실행하고 설치된 개발 빌드를 연다.

## 남은 전제와 미검증 범위

- iOS 재빌드는 이 Mac의 Xcode 27, CocoaPods 1.17.0, 사용자 Apple Development 인증서·기기 신뢰·개발자 모드가 필요하다. 개인 승인과 계정 조작은 사용자가 직접 완료했다.
- Android 빌드 명령에는 위 SDK/JDK 경로를 명령별로 지정해 성공했다. 사용자 쉘 설정 파일에 `ANDROID_HOME`·`JAVA_HOME`을 영구 저장했는지는 확인하지 않았다. [Expo 안내](https://docs.expo.dev/workflow/android-studio-emulator/)에 따라 다른 쉘에서 실행할 때는 경로를 설정해야 한다.
- 카메라·OCR는 아직 구현되지 않아 양 플랫폼 기능 동작, Android 실기기, 반복 실행 안정성·성능은 PR 01에서 검증하지 않았다. 계획상 Android 실기기 검증은 9/28부터 진행한다.

## AI 활용 기록

- 문제: 커스텀 네이티브 모듈을 넣을 수 있는 개발 빌드와 재현 가능한 로컬 명령이 필요했다.
- 요청: PR 01의 개발 빌드 환경 구성, 공식 문서 확인, 양 플랫폼 실행 검증과 차단점 기록.
- 제안: Expo CLI 로컬 개발 빌드 경로, `expo-dev-client` 설치, 앱 식별자와 실행 스크립트 추가.
- 채택·수정·기각: 공식 Expo 문서와 SDK 호환 설치 명령으로 확인한 설정을 채택했다. 사용자 승인인 Apple 약관·계정·기기 설정은 자동화하지 않았다. Android 도구의 Homebrew 설치는 DNS 실패 후 완료로 기록하지 않았다.
- 직접 검증: TypeScript·Expo 설정·prebuild를 확인했다. iOS 크래시 진단과 Scene Lifecycle 수정 후 iPhone 빌드·서명을 확인했고, 사용자가 기본 화면 실행을 직접 확인했다. Android에서는 Gradle 빌드·APK 설치·ADB 프로세스·기본 화면 캡처를 직접 확인했다. 초기 실패와 다운로드 지연도 위에 기록했다.
