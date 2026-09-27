# PR 03 — 카메라 프리뷰와 정지 이미지 촬영

## 구현 범위

- Expo SDK 57 공식 권장 버전인 `expo-camera` 57.0.5를 추가했다. `CameraView` 후면 카메라 프리뷰, 첫 권한 요청 버튼, 카메라 준비 후 촬영, 촬영 이미지 확인과 다시 촬영을 연결했다.
- `onMountError`와 `takePictureAsync` 실패 시 메시지와 재시도 경로를 제공한다. 촬영 중에는 버튼을 비활성화하고 동기 가드로 연속 터치를 막는다. 이미지 표시 실패 시 다시 촬영을 안내한다.
- `skipProcessing: false`로 Expo의 방향 보정 경로를 사용한다. 실제 이미지 방향은 기기에서 확인해야 한다. 사진은 앱 캐시의 임시 URI이며 현재 화면 확인에만 사용한다.
- 카메라 설정 플러그인에 iOS 권한 설명을 넣고, 사용하지 않는 Android 오디오 녹음 권한과 바코드 스캔 기능을 껐다.

공식 근거: [Expo SDK 57 Camera API](https://docs.expo.dev/versions/v57.0.0/sdk/camera/), [Expo 권한 설정](https://docs.expo.dev/guides/permissions/). Expo 문서는 카메라 준비 콜백 뒤 촬영할 것, 기본 사진 처리에서 방향을 맞출 것, 네이티브 권한 설정 변경 시 새 빌드가 필요할 것을 안내한다.

## 검증 기록 — 2026-09-25

환경: macOS 작업 컨테이너, Node.js 24.21.0, pnpm 12.4.2. Xcode 선택 경로는 `/Library/Developer/CommandLineTools`이며 `simctl`과 `adb`는 사용할 수 없었다.

| 검사 | 결과 | 범위 |
| --- | --- | --- |
| `pnpm typecheck` | 통과 | TypeScript 타입 검사 |
| `pnpm expo config --type public` | 통과 | SDK 57 설정, iOS 카메라 설명 플러그인, Android CAMERA 권한 확인 |
| `pnpm expo config --type introspect --json` | 통과 | 생성될 iOS `NSCameraUsageDescription`과 Android CAMERA 권한 확인. Android 오디오 녹음 권한은 없음 |
| `pnpm expo export --platform all --output-dir /private/tmp/artinus-pr03-export` | 통과 | iOS·Android JS 번들 생성. 네이티브 빌드나 실행 검증은 아님 |
| `git diff --check` | 통과 | 공백·패치 형식 |
| `pnpm expo install --check` | 통과, 오프라인 확인 | 로컬 Expo 의존성 표 기준. 원격 버전 검증은 수행되지 않음 |

기기·OS 검증: 수행하지 못함. iPhone 16 Pro Max의 iOS 버전과 Android 에뮬레이터의 API 레벨·기종은 아직 확인되지 않았다. 권한 허용·거부, 프리뷰 품질, 촬영 성공·실패, 이미지 방향, 반복 촬영 모두 미검증이다. Android 에뮬레이터 검증을 Android 실기기 검증으로 간주하지 않는다.

## PR 01·02 통합 뒤 기기 확인

1. 카메라 설정 플러그인을 포함한 새 개발 빌드를 iPhone 16 Pro Max와 Android 에뮬레이터에 설치한다.
2. 새 설치에서 권한 요청 버튼을 누르고 운영체제 권한 알림을 허용한다. 프리뷰가 나타나고 준비 전 촬영 버튼이 비활성화되는지 확인한다.
3. 세로 글자와 가로 글자가 있는 종이를 각각 촬영하고 확인 화면에서 이미지 방향과 잘림 여부를 확인한다.
4. 다시 촬영을 눌러 프리뷰 복귀와 두 번째 촬영을 확인한다. 권한 거부 후 안내와 재요청도 확인한다.
5. 카메라 시작 실패·촬영 실패를 재현할 수 있으면 메시지와 재시도 동작을 확인하고, 재현 조건과 결과를 기록한다.

PR 04는 이 화면의 `photo.uri`를 OCR 입력으로 연결해야 한다. PR 06은 설정에서 권한을 바꾼 뒤 앱 재시작 없이 복구하는 흐름을 추가해야 한다. PR 07은 처리 중 이탈, 늦은 결과, 임시 파일 정리를 다룬다. PR 02의 린트 명령과 CI가 통합되면 이 변경에 대해 실행해야 한다.

## 2026-09-27 베이스 브랜치 통합

PR 01·02가 반영된 `main`을 이 브랜치에 병합했다. 개발 빌드의 `expo-dev-client`·`expo-build-properties`, PR 03의 `expo-camera`, PR 02의 ESLint 설정을 모두 유지했다. `app.json`의 두 플러그인 배열을 하나로 합쳤고, 전체 의존성에 맞춰 잠금 파일을 재생성했다. `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm expo config --type public`, `git diff --check`가 통과했다. Expo 설정 출력에서 iOS Scene 지원과 카메라 설정, Android CAMERA 권한을 확인했다. 카메라 기능의 기기 동작은 여전히 미검증이다.

## AI 활용 기록

- 문제: SDK 57에 맞는 카메라 API와 권한·촬영·오류 흐름이 필요했다.
- 요청 내용: PR 03 범위에서 최초 권한 요청, 프리뷰, 정지 이미지 촬영·확인, 최소 오류 복구를 구현하도록 요청받았다.
- 제안: Codex가 Expo 공식 문서를 확인하고 `expo-camera`, `CameraView`, `useCameraPermissions`, 카메라 준비 신호, 사진 확인 화면을 제안·작성했다.
- 채택·수정·기각 판단: 공식 문서의 SDK 권장 버전을 채택했다. 첫 타입 검사에서 `StyleSheet.absoluteFillObject`가 없다는 오류를 확인하고 `StyleSheet.absoluteFill`로 직접 수정했다. 미검증 상태의 방향 정상 동작은 완료로 기록하지 않았다.
- 검증 결과: 위 정적 검사와 양 플랫폼 JS 번들 생성까지 직접 확인했다. 네이티브 빌드와 기기 동작은 미검증이다.
