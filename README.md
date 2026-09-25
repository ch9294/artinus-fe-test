# ARTINUS Frontend Engineer 사전과제

Expo SDK 57과 React Native, TypeScript로 시작한 iOS/Android 앱 프로젝트입니다. 카메라 권한 요청, 프리뷰, 정지 이미지 촬영·확인 화면을 구현했습니다. OCR은 아직 구현하지 않았습니다.

## 로컬 실행

Node.js와 pnpm을 설치한 뒤 다음 명령을 실행합니다.

```sh
pnpm install
pnpm start
```

Expo 개발 서버가 표시하는 QR 코드를 기기에서 열거나, iOS Simulator와 Android Emulator가 준비된 환경에서 각각 `pnpm ios`, `pnpm android`를 실행합니다. 촬영 기능은 카메라가 있는 기기에서 확인해야 합니다. 카메라 설정 플러그인 변경을 네이티브 앱에 반영하려면 새 개발 빌드가 필요합니다. 개발 빌드 절차는 병렬 작업 중인 PR 01과 통합한 뒤 확정합니다.

타입 검사는 `pnpm typecheck`로 실행합니다.

## 현재 검증 범위

- Node.js 24.21.0, pnpm 12.4.2에서 의존성 설치와 TypeScript 검사 완료
- Expo 설정 읽기 및 Metro 개발 서버 기동 완료
- 이 작업 환경에서 전체 Xcode가 선택되어 있지 않고 `adb`가 없어 iOS/Android 앱 실행은 아직 검증하지 않음
- PR 03 작업 환경에서 TypeScript 검사, Expo 설정 확인, iOS/Android JS 번들 생성 완료. 카메라 권한·프리뷰·촬영·이미지 방향은 기기에서 아직 검증하지 않음

구현 목표와 검증 계획은 [과제 계획](docs/assignment-plan.md)에 기록되어 있습니다.
PR 03의 구현·검증 범위와 기기 확인 절차는 [카메라 촬영 기록](docs/pr03-camera-capture.md)에 기록되어 있습니다.
