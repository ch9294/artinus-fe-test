import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { recognizeText } from 'rn-mlkit-ocr';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureFlowReducer, initialCaptureFlow } from './src/captureFlow';
import { cameraPermissionState } from './src/cameraPermission';
import { summarizeOcrResults } from './src/ocrResult';

export default function App() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const captureInProgress = useRef(false);
  const ocrInProgress = useRef(false);
  const ocrRequestId = useRef(0);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flow, dispatch] = useReducer(captureFlowReducer, initialCaptureFlow);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionRefreshing, setPermissionRefreshing] = useState(false);
  const [permissionCheckFailed, setPermissionCheckFailed] = useState(false);

  const refreshPermission = useCallback(async () => {
    setPermissionRefreshing(true);
    setPermissionCheckFailed(false);
    try {
      await getPermission();
      setPermissionError(null);
    } catch {
      setPermissionCheckFailed(true);
    } finally {
      setPermissionRefreshing(false);
    }
  }, [getPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  async function askForPermission() {
    setPermissionError(null);
    try {
      await requestPermission();
    } catch {
      setPermissionError('권한을 요청하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  async function openCameraSettings() {
    setPermissionError(null);
    try {
      await Linking.openSettings();
    } catch {
      setPermissionError('설정을 열지 못했습니다. 기기 설정에서 이 앱의 카메라 권한을 허용해 주세요.');
    }
  }

  async function takePhoto() {
    if (flow.screen !== 'camera' || !cameraReady || !camera.current || captureInProgress.current) return;

    captureInProgress.current = true;
    setCapturing(true);
    setCameraError(null);
    try {
      // Expo processes orientation before returning the temporary image URI.
      const result = await camera.current.takePictureAsync({ skipProcessing: false });
      if (!result?.uri) throw new Error('Camera returned no image');
      dispatch({ type: 'captured', photo: { uri: result.uri, width: result.width, height: result.height } });
    } catch {
      setCameraError('촬영하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      captureInProgress.current = false;
      setCapturing(false);
    }
  }

  async function recognizePhoto() {
    if (flow.screen !== 'photo' || flow.imageError || ocrInProgress.current) return;

    const requestId = ++ocrRequestId.current;
    ocrInProgress.current = true;
    dispatch({ type: 'ocrStarted' });

    try {
      const results = await Promise.allSettled([
        recognizeText(flow.photo.uri, 'korean'),
        recognizeText(flow.photo.uri, 'latin'),
      ]);
      if (ocrRequestId.current === requestId) {
        dispatch({ type: 'ocrFinished', result: summarizeOcrResults(results) });
      }
    } catch {
      if (ocrRequestId.current === requestId) dispatch({ type: 'ocrFinished', result: { status: 'error' } });
    } finally {
      if (ocrRequestId.current === requestId) ocrInProgress.current = false;
    }
  }

  function retakePhoto() {
    ocrRequestId.current += 1;
    ocrInProgress.current = false;
    dispatch({ type: 'retake' });
    setCameraError(null);
    setCameraReady(false);
    setCameraKey((key) => key + 1);
  }

  function retryCamera() {
    setCameraError(null);
    setCameraReady(false);
    setCameraKey((key) => key + 1);
  }

  let content;

  const permissionState = cameraPermissionState(permission);

  if (permissionState === 'checking' || permissionRefreshing) {
    content = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" accessibilityLabel="카메라 권한 확인 중" />
      </View>
    );
  } else if (permissionCheckFailed) {
    content = (
      <View style={styles.centered}>
        <Text style={styles.title}>카메라 권한을 확인하지 못했습니다</Text>
        <Text style={styles.description}>권한 상태를 다시 확인해 주세요.</Text>
        <Pressable accessibilityRole="button" onPress={refreshPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>권한 다시 확인</Text>
        </Pressable>
      </View>
    );
  } else if (permissionState !== 'allowed') {
    content = (
      <View style={styles.centered}>
        <Text style={styles.title}>
          {permissionState === 'initial' ? '카메라 접근이 필요합니다' : '카메라 권한이 거부되었습니다'}
        </Text>
        <Text style={styles.description}>
          {permissionState === 'blocked'
            ? '기기 설정에서 이 앱의 카메라 권한을 허용한 뒤 돌아오세요.'
            : '인식할 글자를 촬영하려면 카메라 권한을 허용해 주세요.'}
        </Text>
        {permissionError && <Text style={styles.error}>{permissionError}</Text>}
        {permissionState !== 'blocked' ? (
          <Pressable
            accessibilityRole="button"
            onPress={askForPermission}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {permissionState === 'initial' ? '카메라 권한 요청' : '카메라 권한 다시 요청'}
            </Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={openCameraSettings} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>기기 설정 열기</Text>
          </Pressable>
        )}
      </View>
    );
  } else if (flow.screen === 'result') {
    content = (
      <View style={styles.content}>
        <Text style={styles.title}>인식 결과</Text>
        {flow.ocr.partialFailure && (
          <Text style={styles.error}>한 언어의 인식에 실패해 일부 결과만 표시했습니다.</Text>
        )}
        <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultScrollContent}>
          <Text selectable style={styles.resultText}>{flow.ocr.text}</Text>
        </ScrollView>
        <Pressable accessibilityRole="button" onPress={retakePhoto} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>다시 촬영</Text>
        </Pressable>
      </View>
    );
  } else if (flow.screen === 'photo') {
    content = (
      <View style={styles.content}>
        <Text style={styles.title}>촬영 이미지 확인</Text>
        {flow.imageError ? (
          <View style={styles.imageFallback}>
            <Text style={styles.error}>이미지를 표시하지 못했습니다. 다시 촬영해 주세요.</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel="촬영한 이미지"
            onError={() => dispatch({ type: 'imageFailed' })}
            resizeMode="contain"
            source={{ uri: flow.photo.uri }}
            style={styles.photo}
          />
        )}
        {flow.ocr.status === 'processing' && (
          <View style={styles.ocrProgress}>
            <ActivityIndicator color="#ffffff" accessibilityLabel="텍스트 인식 중" />
            <Text style={styles.description}>텍스트 인식 중…</Text>
          </View>
        )}
        {flow.ocr.status === 'empty' && (
          <Text style={styles.description}>글자를 찾지 못했습니다. 다시 촬영하거나 인식을 재시도해 주세요.</Text>
        )}
        {flow.ocr.status === 'error' && (
          <Text style={styles.error}>텍스트를 인식하지 못했습니다. 다시 시도해 주세요.</Text>
        )}
        {!flow.imageError && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: flow.ocr.status === 'processing' }}
            disabled={flow.ocr.status === 'processing'}
            onPress={recognizePhoto}
            style={[styles.primaryButton, flow.ocr.status === 'processing' && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {flow.ocr.status === 'idle' ? '텍스트 인식' : '다시 인식'}
            </Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={retakePhoto} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>다시 촬영</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <View style={styles.content}>
        <Text style={styles.title}>글자 촬영</Text>
        <Text style={styles.description}>글자가 화면 안에 들어오도록 맞춘 뒤 촬영하세요.</Text>
        <View style={styles.previewContainer}>
          <CameraView
            key={cameraKey}
            ref={camera}
            autofocus="off"
            facing="back"
            mode="picture"
            onCameraReady={() => setCameraReady(true)}
            onMountError={() => {
              setCameraReady(false);
              setCameraError('카메라를 시작하지 못했습니다. 다시 시도해 주세요.');
            }}
            style={styles.preview}
          />
          {!cameraReady && !cameraError && (
            <View style={styles.previewOverlay}>
              <ActivityIndicator color="#ffffff" accessibilityLabel="카메라 준비 중" />
            </View>
          )}
        </View>
        {cameraError && <Text style={styles.error}>{cameraError}</Text>}
        {cameraError && !cameraReady ? (
          <Pressable accessibilityRole="button" onPress={retryCamera} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>카메라 다시 시작</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !cameraReady || capturing }}
            disabled={!cameraReady || capturing}
            onPress={takePhoto}
            style={[styles.primaryButton, (!cameraReady || capturing) && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{capturing ? '촬영 중…' : '촬영'}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {content}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101820' },
  content: { flex: 1, padding: 20, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  title: { color: '#ffffff', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  description: { color: '#e0e7ed', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  previewContainer: { flex: 1, overflow: 'hidden', borderRadius: 12, backgroundColor: '#25313b' },
  preview: { flex: 1 },
  previewOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  photo: { flex: 1, width: '100%', backgroundColor: '#25313b' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ocrProgress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  resultScroll: { flex: 1, minHeight: 0, borderRadius: 12, backgroundColor: '#25313b' },
  resultScrollContent: { padding: 16 },
  resultText: { color: '#ffffff', fontSize: 16, lineHeight: 24 },
  error: { color: '#ffb4a9', fontSize: 15, textAlign: 'center' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#2f79e3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
});
