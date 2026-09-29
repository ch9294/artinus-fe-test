# TASK 04 — OCR 연동 및 근접 초점 보정 기록

기록일: 2026-09-27. 검증 상태는 실제 확인한 범위만 적는다.

## 구현

- `rn-mlkit-ocr@0.3.1`의 한국어·라틴 모델을 설정했다. Android는 번들형 모델을 사용한다. 두 인식기를 촬영한 이미지 URI에 각각 실행하고, 같은 줄이 중복되면 한 번만 표시한다.
- 처리 중, 인식 성공, 글자 미검출, 인식 실패를 구분했다. 한 언어의 인식만 실패했으면 남은 결과와 안내를 표시한다. 재촬영 시 이전 OCR 응답은 요청 번호로 무시한다.
- 라이브러리의 Expo 플러그인이 iOS Pod의 모델 이름을 대문자로 쓰는 반면 Podspec은 소문자를 확인해, 로컬 config plugin에서 Podfile 모델 이름을 보정했다. Expo SDK 57에 맞춰 iOS 최소 버전을 16.4로 설정했다.
- iPhone 근접 촬영 흐림에 대응해 `expo-camera@57.0.5`의 iOS 네이티브 코드를 `pnpm` 패치로 수정했다. 후면에 트리플 또는 듀얼 와이드 가상 카메라가 있으면 이를 우선 쓰고, 기본 화면 배율을 광각 시야에 맞춘다. 렌즈를 선택할 때 연속 자동 초점을 다시 설정한다. 해당 가상 카메라가 없는 기기에는 기존 광각 선택을 유지한다. Android 카메라 코드는 변경하지 않았다. 패치가 앱에 포함되도록 iOS의 사전 컴파일 Expo 모듈 사용을 껐으며, 그만큼 iOS 최초 빌드 시간이 늘어난다.

## 근접 초점 판단 근거

Expo Camera의 `autofocus="off"`는 연속 자동 초점이며 기본값도 같다. `"on"`은 한 번 초점을 맞춘 후 고정하므로 근접 이동 문제의 해결책이 아니다. SDK 57의 iOS 기본 렌즈 선택 코드는 단일 광각을 우선한다. [Expo Camera API](https://docs.expo.dev/versions/latest/sdk/camera/)

Apple은 iPhone 기본 카메라의 근접 촬영에 초광각 렌즈를 사용한다고 설명한다. AVFoundation의 트리플 카메라는 거리·조명·배율 조건에 따라 구성 렌즈를 자동 전환할 수 있다. 가상 카메라가 초점 한계에 도달하면 짧은 초점 거리의 렌즈로 바꿀 수 있다는 근거가 있다. 다만 이 API 동작이 현재 앱의 프리뷰와 촬영 사진에서 원하는 거리 전체를 선명하게 만드는지는 실기기 테스트로 확인해야 한다. [iPhone 접사 안내](https://support.apple.com/en-bw/guide/iphone/iphfaacf2eb0/ios), [트리플 카메라](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/builtintriplecamera), [자동 렌즈 전환](https://developer.apple.com/documentation/avfoundation/avcapturedevice/primaryconstituentdeviceswitchingbehavior-swift.enum)

## 검증과 남은 범위

| 환경 | 확인한 내용 | 남은 확인 |
| --- | --- | --- |
| macOS 개발 환경, Expo SDK 57 | TypeScript, ESLint, OCR 결과 상태 자동 테스트 3개 통과. iOS Pod 설치에 한국어·라틴 ML Kit 모델 포함. Android `assembleDebug` 성공. 패치된 `ExpoCamera` 소스가 CocoaPods 컴파일 대상임을 확인했고 iOS Debug 기기 대상 빌드에 성공했다. | 양 플랫폼의 언어별 실제 인식 품질과 오류 분기. |
| iPhone 16 Pro Max / iPhone OS 27.0 | 수정 전 development build에서 사용자가 텍스트 OCR 동작을 확인했다고 보고. 근접 초점 패치 적용 후 서명 빌드 성공, 연결된 iPhone에 설치했고 `devicectl`에서 앱 설치 상태를 확인했다. | OCR 샘플의 언어·인쇄체·입력 조건 기록. 가까운/보통 거리의 프리뷰·사진·OCR 비교. |
| `SM_A245N` / Android 16(API 36) | 디버그 APK 빌드·설치 성공. USB 포트 전달로 Metro에 연결했고 카메라 프리뷰 화면을 확인했다. 사용자가 직접 촬영해 OCR 동작을 확인했다고 보고했다. | 촬영 사진의 방향·화질과 한글·영문·혼합 인식의 개별 결과, 미검출·실패, 오프라인 동작. |

`pnpm install --frozen-lockfile`은 Expo Camera 패치를 재적용한다. 네이티브 코드 변경이므로 새 iOS 개발 빌드를 설치해야 한다. 패치 적용 뒤 단순 Metro 새로고침으로는 근접 초점 동작이 바뀌지 않는다.

근접 초점 확인 절차: 새로 설치한 앱에서 같은 인쇄체를 약 20~30 cm와 5~10 cm 거리에서 각각 프리뷰에 맞추고 1~2초 기다린 뒤 촬영한다. 프리뷰 선명도, 저장 사진의 글자 선명도, OCR 결과를 기록하고 iPhone 기본 카메라에서도 같은 거리로 비교한다. 기기별 최소 초점 거리와 자동 전환 시점은 다를 수 있으므로 결과를 보기 전에는 개선을 완료로 표시하지 않는다.

## AI 활용 기록

문제: 한영 온디바이스 OCR 연동과 근접 촬영 시 iPhone 프리뷰 흐림. 요청: OCR 후보 조사 후 `rn-mlkit-ocr`로 구현, 기본 카메라처럼 거리별 자동 초점이 가능한지 확인. 제안: 두 ML Kit 모델을 번들하고 OCR 결과 상태를 분리하며, iOS에서는 가상 다중 렌즈 카메라를 우선 선택. 채택·수정: `rn-mlkit-ocr` 연동과 Expo Camera 패치를 채택했고, Pod 모델 이름 불일치에 맞춰 설정 플러그인을 수정했다. 직접 검증: 정적 검사·단위 테스트·양 플랫폼 네이티브 빌드를 수행했다. 사용자는 iOS와 Android 실기기에서 텍스트 OCR 동작을 보고했다. 패치 적용 후 실제 근접 초점과 언어별 인식 품질은 검증 전이다.
