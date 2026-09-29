# TASK 11 — Android 시스템 영역과 하단 버튼 겹침 수정

기록일: 2026-09-29. 관련 흐름: TASK 04 촬영·OCR 화면.

## 문제와 원인

사용자가 Android 실기기에서 하단 앱 버튼이 시스템 버튼 영역과 겹친다고 보고했다. `SM_A245N` / Android 16(API 36), 1080 × 2340 화면에서 UI Automator 좌표를 읽었을 때 촬영 버튼은 y=2138~2284, 시스템 내비게이션 영역은 y=2205~2340이었다. 79px이 겹쳤다.

앱은 React Native의 `SafeAreaView`를 사용하고 있었다. [React Native 문서](https://reactnative.dev/docs/SafeAreaView)에 따르면 이 컴포넌트는 iOS 전용이고 더 이상 권장되지 않는다. Android 16의 edge-to-edge 화면에서 하단 시스템 영역을 위한 여백이 적용되지 않은 것이 원인이다.

## 수정

Expo SDK 57의 권장 버전에 맞춰 `react-native-safe-area-context@5.7.0`을 추가했다. 앱 루트에 `SafeAreaProvider`를 두고 카메라·촬영 이미지·권한 화면을 `SafeAreaView`로 감싸 상단과 하단 시스템 영역의 inset을 반영한다. 네이티브 의존성이므로 기존 개발 빌드를 다시 빌드해야 한다.

## 검증

| 환경 | 절차 | 결과 |
| --- | --- | --- |
| macOS 개발 환경, Expo SDK 57 | `pnpm typecheck`, `pnpm lint`, `pnpm android`, `git diff --check` | TypeScript·ESLint 통과, Android Debug 빌드·설치 성공, diff 공백 검사 통과 |
| `SM_A245N` / Android 16(API 36), 1080 × 2340 | UI Automator로 촬영 화면의 버튼과 시스템 내비게이션 영역 좌표 재측정 | 촬영 버튼 y=2003~2149, 내비게이션 영역 y=2205~2340. 겹침 0px, 두 영역 사이 56px |
| 같은 기기 | 촬영 버튼을 누르고 촬영 이미지 화면의 버튼 좌표 측정 | 텍스트 인식 버튼 y=1811~1958, 다시 촬영 버튼 y=2003~2149. 모두 시스템 영역 밖에 표시됨 |
| 같은 기기 | 다시 촬영 버튼을 누른 뒤 UI 구조 확인 | 카메라 화면과 촬영 버튼으로 돌아옴 |

OCR 버튼은 위치를 확인했으며, 이번 수정 뒤 OCR 인식 자체는 다시 실행하지 않았다. iOS의 새 안전 영역 의존성 빌드와 화면 배치는 아직 직접 검증하지 않았다. 사용자는 수정 전 Android OCR 동작을 확인했다고 보고했으며 샘플 조건은 기록되지 않았다.

## AI 활용 기록

문제: Android 하단 버튼과 시스템 내비게이션 영역이 겹침. 요청: 사용자의 결함 보고. 제안: UI 좌표로 재현하고 React Native의 iOS 전용 `SafeAreaView`를 `react-native-safe-area-context`로 교체. 채택·수정: 앱 루트에 provider와 안전 영역 뷰를 적용하고 Expo 권장 버전을 설치. 직접 검증: Android 실기기에서 겹침 79px → 0px을 재측정하고 촬영·재촬영 화면 전환, 정적 검사, 네이티브 빌드를 확인했다.
