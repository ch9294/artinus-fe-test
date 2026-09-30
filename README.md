# ARTINUS Frontend Engineer 사전과제

카메라로 촬영한 한국어·영어 인쇄체를 온디바이스 OCR로 인식하는 Expo SDK 57 / React Native / TypeScript 앱입니다. 권한 거부·미검출·인식 실패 안내와 재촬영을 제공합니다.

**사용 흐름:** 프리뷰 → 촬영 → 이미지 확인 → 텍스트 인식 → 결과 확인 → 재촬영

## 실행 방법

네이티브 OCR을 포함하므로 Expo Go 대신 개발 빌드를 사용합니다. 촬영·프리뷰·OCR은 실기기에서 확인하며 별도 API 키나 OCR 서버 설정은 필요하지 않습니다.

| 대상 | 준비 조건 |
| --- | --- |
| 공통 | Node.js 24, pnpm 12.4.2, 최초 설치·빌드 시 인터넷 연결 |
| iOS | macOS, Xcode, CocoaPods, Apple 개발 서명, iPhone 신뢰·개발자 모드. 빌드 확인 환경: Xcode 27.0 / CocoaPods 1.17.0. iOS deployment target: 16.4 |
| Android | Android Studio, SDK Platform 36, Build-Tools 36.0.0, Platform Tools, JDK 17, SDK 라이선스 동의, USB 디버깅 허용 |

저장소 루트에서 설치합니다. `ios/`·`android/`는 빌드 과정에서 생성되며 잠금 파일 설치 시 Expo Camera 패치도 적용됩니다.

```sh
pnpm install --frozen-lockfile
```

**iOS:** Xcode를 활성 개발 도구로 선택하고 Apple 계정·서명을 준비한 뒤, iPhone을 연결하고 잠금을 해제합니다.

```sh
pnpm ios
```

**Android:** 아래는 macOS의 경로 예시입니다. 실제 SDK·JDK 설치 경로로 바꾸고 `adb devices`에서 기기가 `device` 상태인지 확인합니다.

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
adb devices
pnpm android
```

설치 후 JS/TypeScript만 변경했다면 `pnpm start`로 Metro를 시작하고 설치된 앱에서 프로젝트를 엽니다. 네이티브 의존성·OCR 설정·카메라 패치를 변경하면 해당 플랫폼을 다시 빌드합니다.

<details>
<summary>서명·SDK 경로·Metro 연결에 문제가 있을 때</summary>

- iOS: `xcode-select -p`가 Xcode의 `Contents/Developer`를 가리키는지, `pod --version`이 실행되는지 확인합니다. 서명 오류는 생성된 `ios/`의 `.xcworkspace`를 Xcode에서 열어 Signing & Capabilities의 Team·Bundle Identifier를 확인합니다. 식별자를 바꾸면 `app.json`의 `ios.bundleIdentifier`에도 반영합니다.
- Android: 새 터미널에서도 위 환경 변수를 설정합니다. SDK 경로 오류는 `ANDROID_HOME`을 확인하거나 생성된 `android/local.properties`의 `sdk.dir=`에 실제 경로를 적습니다. 이 파일은 Git에서 제외되며 네이티브 폴더 재생성 후 다시 설정해야 합니다.
- Android USB 연결: Metro 실행 상태와 `adb reverse --list`를 확인하고 `tcp:8081` 전달이 없으면 `adb reverse tcp:8081 tcp:8081`을 실행합니다. `pnpm android`는 USB 전달에 맞춰 `127.0.0.1`을 사용합니다.
- iPhone LAN 연결 실패: `pnpm start:tunnel`을 실행하고 새 QR 코드를 스캔합니다. 최초 실행 시 Expo가 요구하는 `@expo/ngrok` 전역 설치가 필요합니다. 기존 LAN 주소 화면의 Reload로는 터널 주소가 적용되지 않습니다.

</details>

## 기술 선택과 설계

주로 React·Next.js로 개발해 왔기 때문에 기존 경험으로 빠르게 구현하려고 React Native를 선택했습니다. Expo와 `rn-mlkit-ocr@0.3.1`은 Codex의 제안을 채택했습니다. OCR 후보의 한영 지원, Expo 연동, 모델 번들링, 추가 구현 부담을 종합해 판단했으며 후보 간 인식률·속도를 실제로 비교하지는 않았습니다. `expo-camera`로 촬영하고 한국어·라틴 ML Kit 모델을 앱에 포함합니다.

단일 촬영 흐름에 맞춰 별도 전역 상태 라이브러리·내비게이션 없이 구성했습니다. 화면 상태 전환, 요청 게이트, OCR 결과 분류, 임시 사진 관리를 `src/`에 분리했습니다. 두 인식기를 비동기 호출하고 성공·미검출·실행 오류·부분 실패를 구분합니다. 재촬영·앱 비활성화 후 오래된 응답은 무시하고, 복귀 시 권한을 다시 확인합니다. 사진은 OCR 참조가 끝난 뒤 삭제합니다. 요청 무효화는 네이티브 OCR의 즉시 취소를 보장하지 않습니다.

## 검증과 한계

자동 검사 명령입니다. 새 체크아웃의 macOS / Node.js 24.21.0 / pnpm 12.4.2 환경에서 고정 설치, 단위 테스트 11개, 타입·린트와 iOS Release·Android Debug 네이티브 빌드·실기기 설치가 통과했습니다. 전역 의존성·빌드 캐시는 재사용했습니다.

```sh
pnpm typecheck
pnpm lint
pnpm test
```

단위 테스트는 상태 전환·권한 분류·OCR 오류 분기·중복 요청·늦은 결과·사진 지연 삭제를 검증합니다. 현재 CI는 고정 설치·타입·린트만 실행합니다.

| 환경 | 확인한 동작 |
| --- | --- |
| iPhone 16 Pro Max / iPhone OS 27.0 | Codex가 새 체크아웃 Release 빌드·설치·실행 확인. 사용자가 최신 빌드의 한글·영문·혼합 OCR·거리별 초점·재촬영·홈 복귀 후 시야·권한 및 미검출 복구 확인. 긴 결과·연속 조작은 기존 검증 |
| Samsung `SM_A245N` / Android 16(API 36) | Codex가 새 체크아웃 Debug 빌드·설치·프리뷰 확인. 사용자가 최신 빌드의 한글·영문·혼합 OCR·사진 방향·긴 결과 마지막 줄 스크롤·재촬영·홈 복귀·권한 및 미검출 복구 확인. 사진 삭제는 기존 검증 |
| Pixel 9 에뮬레이터 / Android 16(API 36) | 초기 기본 앱 빌드·설치·화면 실행만 확인. 카메라·OCR·실기기 성능 검증에 포함하지 않음 |

반복 테스트에서는 사용자가 양쪽 실기기 각각 10회 재촬영·홈 이탈·권한 복구를 확인했고 끊김·지연이 없었다고 보고했습니다. 최신 빌드 기능 테스트에서도 두 기기의 발열·OCR 중 화면 반응에 문제 없다고 보고했습니다. 체감 관찰이며 시간·온도 측정 결과는 아닙니다.

양쪽 실기기의 저조도·흐린 글자·글자 없는 장면에서 사용자가 안내 후 멈춤 없는 재촬영을 확인했습니다. 기울어진 글자는 결과가 부정확했습니다. 조건별 사진·출력·정확도는 수집하지 않았고 사용자 보고에서 미검출과 실행 오류를 구분하지 않았습니다.

- **트레이드오프:** 모델 포함으로 앱 크기가 늘고 두 인식기 호출로 자원 부담이 생깁니다. 줄 단위 병합은 원본 읽기 순서·동일한 반복 줄을 보존하지 못하거나 유사한 중복을 남길 수 있습니다. 자동 품질 보정·손글씨 인식·정확한 전사는 보장하지 않습니다.
- **추가 검증:** 인식 정확도·샘플별 출력 기록, Android 사진 화질·빠른 탭의 네이티브 호출 횟수, iOS 사진 삭제, 실제 OCR 실행 오류, 설치 직후 오프라인 인식·앱 크기는 미검증입니다. iOS 카메라 패치와 사전 컴파일 모듈 비활성화로 빌드·패치 유지 부담도 있습니다. 최신 iOS 빌드의 거리별 초점·재촬영·홈 복귀 후 자연스러운 시야는 사용자가 확인했으며 정확한 배율은 측정하지 않았습니다.
- **제출 후보 검증:** 위 결과는 작업별 기록의 요약입니다. 반복 테스트의 동일 입력 조건·메모리 추이·발열·OCR 시간 수치 측정은 남아 있습니다. 비동기 호출·단위 테스트·JS 번들 생성만으로 네이티브 UI 비차단이나 실기기 성능을 입증하지 않습니다.

## 평가 방법

1. **정상 인식:** 권한 허용 → 인쇄체 촬영 → 텍스트 인식 → 결과 확인 → 다른 문장으로 재촬영. 이전 결과가 남지 않는지 확인합니다.
2. **권한 복구:** 기기 설정에서 권한 해제 → 앱 복귀 → 설정 열기 → 허용 → 복귀. 앱 재시작 없이 촬영·OCR이 되는지 확인합니다.
3. **미검출 복구:** 글자 없는 장면 촬영 → 텍스트 인식 → 안내 확인 → 다시 촬영. 프리뷰로 복귀하는지 확인합니다.

## AI 활용

Codex만 사용했습니다. 코드·설정·기술 검토·테스트 코드 작성을 맡겼으며 후속 코드 보정도 Codex가 수행했습니다. 저는 요구사항을 제시하고 AI 판단을 검토·승인한 뒤 실기기에서 기능을 테스트했습니다. 생성 결과를 기반으로 사용한 부분과 수정·검증한 사례는 다음과 같습니다.

- **OCR 연동:** Codex가 생성한 통합 설정의 iOS Pod 모델 이름 불일치를 보정하고 네이티브 빌드를 확인했습니다. 저는 실기기 OCR 기능을 확인했습니다.
- **Android 버튼 겹침:** 제가 실기기에서 문제를 보고했고 Codex가 안전 영역 처리를 수정했습니다. Codex가 겹침을 79px → 0px으로 재측정하고 촬영·재촬영 조작을 확인했습니다.

개별 작업의 상세 기록은 로컬에서 관리하며 이 README에는 주요 선택·검증 결과를 요약했습니다.
