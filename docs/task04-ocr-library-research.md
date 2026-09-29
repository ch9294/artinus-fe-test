# TASK 04 — Expo 온디바이스 OCR 후보 조사

조사일: 2026-09-27. 범위는 현재 프로젝트의 Expo SDK 57, React Native 0.86.3, 촬영한 정지 이미지의 한국어·영어 인쇄체다. 이 문서는 공식 엔진 문서와 라이브러리 관리자의 README·네이티브 소스를 확인한 **사전 조사**다. 라이브러리 설치, SDK 57 빌드, 기기 인식률 검증은 수행하지 않았다.

## 엔진과 빌드의 공통 조건

- Google ML Kit Text Recognition v2는 한국어와 영어를 지원 언어로 열거한다. Android에서는 라틴과 한국어가 **별도 인식기/모델**이다. Android 가이드는 번들형(`com.google.mlkit:*`)과 Google Play Services 다운로드형(`com.google.android.gms:*`)을 구별하며, 다운로드 완료 전 요청은 결과가 없을 수 있다고 명시한다. Android 요구 수준은 가이드 본문의 API 23 이상이다. [지원 언어](https://developers.google.com/ml-kit/vision/text-recognition/v2/languages), [Android 통합·모델 설치](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- iOS ML Kit는 `TextRecognition`과 `TextRecognitionKorean` Pod를 따로 사용하며, 각 스크립트 자산을 앱에 정적으로 포함한다. Google 문서의 앱 크기 추정은 **스크립트 SDK당 약 38 MB**다. [iOS 통합](https://developers.google.com/ml-kit/vision/text-recognition/v2/ios)
- Apple Vision의 `VNRecognizeTextRequest`는 우선 언어 목록을 지정하고 기기가 실제 지원하는 언어를 조회할 수 있다. 따라서 Vision 기반 후보의 `ko-KR` 지원은 대상 OS/기기에서 조회·인식해 확인해야 한다. [Apple Vision API](https://developer.apple.com/documentation/vision/vnrecognizetextrequest)
- 이 후보들은 네이티브 코드를 포함하므로 Expo Go가 아닌 **새 development build**가 필요하다. 패키지 설치 후 development client를 재빌드해야 한다. [Expo development build 설명](https://docs.expo.dev/develop/development-builds/faq/), [네이티브 라이브러리 추가 후 재빌드](https://docs.expo.dev/develop/development-builds/use-development-builds/)

## 후보 비교

| 후보 | 한국어·영어 구현 근거 | Expo 통합·오프라인 특성 | 현재 판단 |
| --- | --- | --- | --- |
| [`rn-mlkit-ocr`](https://github.com/ahmeterenodaci/rn-mlkit-ocr) | [Android 소스](https://github.com/ahmeterenodaci/rn-mlkit-ocr/blob/main/android/src/main/java/com/rnmlkitocr/RnMlkitOcrModule.kt)가 `korean`·`latin` 인식기를 선택하고, [iOS Podspec](https://github.com/ahmeterenodaci/rn-mlkit-ocr/blob/main/RnMlkitOcr.podspec)이 두 ML Kit Pod를 선택적으로 포함한다. | [Expo config plugin 옵션](https://github.com/ahmeterenodaci/rn-mlkit-ocr#for-expo-projects)으로 `ocrModels: ["latin", "korean"]`, Android `ocrUseBundled: true`를 지정할 수 있다. iOS 15.5+, Android API 23+를 표방한다. Android 번들 옵션을 켜야 첫 사용부터 오프라인 모델이 있다. | **잠정 1순위.** 필요한 두 모델만 포함하고 촬영 이미지 URI를 받는 API가 있다. 다만 SDK 57 빌드와 사진 방향은 미검증이다. |
| [`@zhanziyang/expo-text-extractor`](https://github.com/zhanziyang/expo-text-extractor) | [Android 소스](https://github.com/zhanziyang/expo-text-extractor/blob/main/android/src/main/java/expo/modules/textextractor/ExpoTextExtractorModule.kt)는 Korean/Latin ML Kit 인식기를 구현한다. [iOS 소스](https://github.com/zhanziyang/expo-text-extractor/blob/main/ios/ExpoTextExtractorModule.swift)는 Vision의 `recognitionLanguages`에 `ko-KR`/`en-US`를 전달한다. | Expo Module, README는 SDK 52+를 표방한다. 그러나 [Android Gradle](https://github.com/zhanziyang/expo-text-extractor/blob/main/android/build.gradle)은 Play Services 다운로드형 모델을 사용한다. 첫 실행 오프라인은 보장되지 않는다. | 대안 후보. Android 코드가 `File(uriString)`으로 파일 존재를 검사하므로 Expo Camera의 `file://` URI가 그대로 통과하는지 우려된다. URI 변환 또는 수정 없이 채택하기 어렵다. |
| [`react-native-nitro-ocr`](https://github.com/jonathanpalma/react-native-nitro-ocr) | [README](https://github.com/jonathanpalma/react-native-nitro-ocr#requirements)는 iOS Vision과 Android ML Kit, Android 한국어 모델 옵션 및 `scriptHints`를 설명한다. | Expo config plugin과 번들형 Android 한국어 모델 옵션이 있다. RN New Architecture, `react-native-nitro-modules` 의존성, iOS 16+, Android API 24+를 요구한다. | 기능상 유력한 대안이나 Nitro 의존성과 SDK 57 조합을 별도 검증해야 한다. 현재 TASK의 정지 이미지 OCR에는 추가 통합 복잡도가 있다. |
| [`@infinitered/react-native-mlkit-text-recognition`](https://github.com/infinitered/react-native-mlkit/tree/main/modules/react-native-mlkit-text-recognition) | [Android Gradle](https://github.com/infinitered/react-native-mlkit/blob/main/modules/react-native-mlkit-text-recognition/android/build.gradle)은 라틴 `com.google.mlkit:text-recognition`만 포함한다. | 상위 [호환성 표](https://github.com/infinitered/react-native-mlkit#compatibility)는 Expo SDK 56까지 표시한다. | 한국어 모델을 그대로 제공하는 후보로 보기 어렵고 SDK 57도 표에서 확인되지 않는다. |
| [`expo-mlkit-ocr`](https://github.com/rbayuokt/expo-mlkit-ocr), [`expo-ocr-kit`](https://github.com/ManojKanth/expo-ocr-kit) | 두 저장소의 [Android Gradle 1](https://github.com/rbayuokt/expo-mlkit-ocr/blob/main/android/build.gradle), [Android Gradle 2](https://github.com/ManojKanth/expo-ocr-kit/blob/main/android/build.gradle) 모두 라틴 `com.google.mlkit:text-recognition`만 선언한다. | 둘 다 Expo Module 기반 네이티브 OCR을 제공하지만 한국어 인식기 설정은 확인되지 않는다. | 한국어 필수 조건에서는 현 상태로 채택하지 않는다. |

## Tesseract 검토

**엔진 자체는 요구 언어에 맞는다.** Tesseract의 공식 `tessdata_fast`에는 [`eng.traineddata`](https://github.com/tesseract-ocr/tessdata_fast/blob/main/eng.traineddata)와 [`kor.traineddata`](https://github.com/tesseract-ocr/tessdata_fast/blob/main/kor.traineddata)가 있다. 두 파일을 앱에 포함하면 모델 다운로드 없이 오프라인에서 사용할 수 있다. Tesseract는 `eng+kor`처럼 여러 언어를 한 번의 인식에 지정할 수 있지만, 언어 순서에 따라 결과와 처리 시간이 달라질 수 있다. 이는 한영 혼합 사진에 유용한 기능이지 실제 인식 품질의 보장은 아니다. [공식 다국어 사용법](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html#using-multiple-languages)

**현재 Expo 프로젝트에 바로 넣을 양 플랫폼 래퍼는 확인되지 않았다.** 대표적인 [`react-native-tesseract-ocr`](https://github.com/jonathanpalma/react-native-tesseract-ocr)은 README에서 Android의 `tess-two`를 사용하고 **iOS는 미구현**이라고 명시한다. [패키지 설정](https://github.com/jonathanpalma/react-native-tesseract-ocr/blob/master/package.json)도 React Native 0.61.5 개발 의존성을 사용하므로 현재 RN 0.86.3/Expo SDK 57 빌드 호환성을 추정할 수 없다. [`tesseract.js` FAQ](https://github.com/naptha/tesseract.js/blob/master/docs/faq.md#what-javascript-frameworks-are-supported)는 React Native의 WebAssembly 부재를 이유로 직접 사용을 지원하지 않는다고 명시한다. 네이티브 Tesseract를 양 플랫폼에서 쓰려면 iOS·Android용 바인딩과 Expo Module 또는 React Native 네이티브 모듈을 직접 통합하고 development build를 다시 만들어야 한다. [Expo 네이티브 모듈 안내](https://docs.expo.dev/modules/get-started/)

공식 모델 안내에 따르면 `tessdata_fast`는 속도를 우선하고 `tessdata_best`는 더 느리지만 공식 평가 데이터에서 더 높은 인식 결과를 낸다. 촬영 사진의 기울기·해상도·전처리와 페이지 분할 설정도 결과에 영향을 준다. 따라서 현재 과제 일정에서는 Tesseract를 **후순위 비교 후보**로 두고, 두 플랫폼의 빌드·처리 시간·한글/영문/혼합 샘플 정확도를 실제 기기에서 비교하기 전에는 ML Kit보다 낫거나 느리다고 단정하지 않는다. [공식 모델 비교](https://tesseract-ocr.github.io/tessdoc/Data-Files.html), [이미지 품질 가이드](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)

## 잠정 추천과 TASK 04 검증 게이트

`rn-mlkit-ocr`를 **시험할 1순위**로 둔다. Expo plugin에 라틴·한국어만 선택하고 Android 번들형을 켜면, 모델 구성 관점에서 두 언어와 첫 사용 오프라인이라는 요구에 가장 직접적이다. 이는 **라이브러리 확정 또는 인식 정확도 보증이 아니다**. 해당 저장소는 SDK 57 호환성 표가 없으며, 현재 앱에서 양 플랫폼 네이티브 빌드를 통과한 기록도 없다. [라이브러리 설정·API](https://github.com/ahmeterenodaci/rn-mlkit-ocr#configuration)

특히 [Android 이미지 로딩 소스](https://github.com/ahmeterenodaci/rn-mlkit-ocr/blob/main/android/src/main/java/com/rnmlkitocr/RnMlkitOcrModule.kt)는 로컬 파일에 `BitmapFactory.decodeFile`을 사용한 뒤 `InputImage.fromBitmap(bitmap, 0)`을 호출한다. 이 경로에서는 EXIF 회전을 명시적으로 전달하지 않으므로, 카메라 사진이 EXIF 방향에 의존할 경우 인식 방향이 틀어질 **가능성**이 있다. iOS도 촬영 이미지의 방향 처리 결과를 확인해야 한다. [ML Kit의 iOS 방향 지정 안내](https://developers.google.com/ml-kit/vision/text-recognition/v2/ios)

1. SDK 57 development build를 iPhone 실기기와 Android 에뮬레이터에서 생성·실행한다. 최소 OS와 Pod/Gradle 충돌을 기록한다.
2. 양 플랫폼에서 동일한 한국어 인쇄체, 영어 인쇄체, 한영 혼합 이미지, 빈 이미지, 회전 이미지로 `photo.uri` 인식 결과를 확인한다. Android는 `korean`과 `latin`을 따로 지정하는 API라서 혼합 이미지에 한 번의 호출만으로 완전한 인식이 가능한지는 보장되지 않는다. 필요하면 두 번 실행한 결과의 중복·읽기 순서 처리를 평가한다. [라이브러리 API](https://github.com/ahmeterenodaci/rn-mlkit-ocr#api-reference), [ML Kit 스크립트별 인식기](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
3. 설치 직후 비행기 모드에서도 두 언어를 인식하는지 확인한다. 처리 중 화면 터치·뒤로가기 응답과 성공/미검출/실패를 구분해 기록한다.

빌드나 방향 처리에 결함이 있으면 `react-native-nitro-ocr`의 Expo SDK 57 빌드 및 동일 샘플을 비교한다. 모든 결과에는 기기·OS·입력 사진·오프라인 여부를 기록하고, 정확도 평가 전에는 “한국어·영어가 잘 된다”라고 단정하지 않는다.
