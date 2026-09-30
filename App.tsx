import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
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
import { RequestGate } from './src/requestGate';
import { TemporaryPhotos } from './src/temporaryPhotos';

export default function App() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [requests] = useState(() => new RequestGate());
  const [photos] = useState(() => new TemporaryPhotos((uri) => {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('Temporary camera photo could not be removed', error);
    }
  }));
  const currentPhoto = useRef<string | null>(null);
  const cameraSession = useRef(0);
  const [appActive, setAppActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
  );
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flow, dispatch] = useReducer(captureFlowReducer, initialCaptureFlow);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionRefreshing, setPermissionRefreshing] = useState(false);
  const [permissionCheckFailed, setPermissionCheckFailed] = useState(false);
  const permissionRefreshPending = useRef(false);
  const permissionRefreshId = useRef(0);

  const refreshPermission = useCallback(async () => {
    const refreshId = ++permissionRefreshId.current;
    permissionRefreshPending.current = true;
    setPermissionRefreshing(true);
    setPermissionCheckFailed(false);
    try {
      await getPermission();
      if (permissionRefreshId.current === refreshId) setPermissionError(null);
    } catch {
      if (permissionRefreshId.current === refreshId) setPermissionCheckFailed(true);
    } finally {
      if (permissionRefreshId.current === refreshId) {
        permissionRefreshPending.current = false;
        setPermissionRefreshing(false);
      }
    }
  }, [getPermission]);

  useEffect(() => {
    if (flow.screen === 'result' && currentPhoto.current) {
      photos.discard(currentPhoto.current);
      currentPhoto.current = null;
    }
  }, [flow.screen, photos]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      requests.setActive(active);
      setAppActive(active);
      setCameraReady(false);
      cameraSession.current += 1;
      setCameraKey(cameraSession.current);
      if (active) {
        setCameraError(null);
        void refreshPermission();
      } else {
        permissionRefreshId.current += 1;
        permissionRefreshPending.current = false;
        setPermissionRefreshing(false);
        dispatch({ type: 'interrupted' });
        setCapturing(false);
      }
    });
    return () => subscription.remove();
  }, [refreshPermission, requests]);

  useEffect(() => {
    return () => {
      requests.setActive(false);
      if (currentPhoto.current) photos.discard(currentPhoto.current);
    };
  }, [photos, requests]);

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
    if (flow.screen !== 'camera' || !cameraReady || !camera.current ||
      !appActive || permissionRefreshPending.current || cameraPermissionState(permission) !== 'allowed') return;

    const ticket = requests.begin('capture');
    if (ticket === null) return;

    setCapturing(true);
    setCameraError(null);
    try {
      // Expo processes orientation before returning the temporary image URI.
      const result = await camera.current.takePictureAsync({ skipProcessing: false });
      if (!result?.uri) throw new Error('Camera returned no image');
      if (requests.isCurrent('capture', ticket)) {
        currentPhoto.current = result.uri;
        dispatch({ type: 'captured', photo: { uri: result.uri, width: result.width, height: result.height } });
      } else {
        photos.discard(result.uri);
      }
    } catch {
      if (requests.isCurrent('capture', ticket)) {
        setCameraError('촬영하지 못했습니다. 다시 시도해 주세요.');
      }
    } finally {
      if (requests.isCurrent('capture', ticket)) setCapturing(false);
      requests.finish('capture', ticket);
    }
  }

  async function recognizePhoto() {
    if (flow.screen !== 'photo' || flow.imageError || !appActive ||
      permissionRefreshPending.current) return;

    const ticket = requests.begin('ocr');
    if (ticket === null) return;
    const uri = flow.photo.uri;
    photos.retain(uri);
    dispatch({ type: 'ocrStarted' });

    try {
      const results = await Promise.allSettled([
        recognizeText(uri, 'korean'),
        recognizeText(uri, 'latin'),
      ]);
      if (requests.isCurrent('ocr', ticket)) {
        const result = summarizeOcrResults(results);
        dispatch({ type: 'ocrFinished', result });
      }
    } catch {
      if (requests.isCurrent('ocr', ticket)) dispatch({ type: 'ocrFinished', result: { status: 'error' } });
    } finally {
      requests.finish('ocr', ticket);
      photos.release(uri);
    }
  }

  function retakePhoto() {
    requests.invalidate();
    if (currentPhoto.current) photos.discard(currentPhoto.current);
    currentPhoto.current = null;
    dispatch({ type: 'retake' });
    setCameraError(null);
    setCameraReady(false);
    cameraSession.current += 1;
    setCameraKey(cameraSession.current);
  }

  function retryCamera() {
    setCameraError(null);
    setCameraReady(false);
    cameraSession.current += 1;
    setCameraKey(cameraSession.current);
  }

  let content;

  const permissionState = cameraPermissionState(permission);

  if (!appActive || permissionState === 'checking' || permissionRefreshing) {
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
        <Text style={styles.description}>글자가 빠졌거나 다르게 인식되었다면 다시 촬영해 주세요.</Text>
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
            onError={() => dispatch({ type: 'imageFailed', uri: flow.photo.uri })}
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
          <Text style={styles.description}>
            글자를 찾지 못했습니다. 밝은 곳에서 거리를 조절하고, 글자가 기울지 않게 다시 촬영해 주세요.
          </Text>
        )}
        {flow.ocr.status === 'error' && (
          <Text style={styles.error}>인식 중 문제가 발생했습니다. 다시 인식하거나 새로 촬영해 주세요.</Text>
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
        <Text style={styles.description}>
          밝은 곳에서 글자가 선명해지도록 거리를 조절하세요. 글자가 기울지 않게 화면 안에 담아 촬영하세요.
        </Text>
        <View style={styles.previewContainer}>
          <CameraView
            key={cameraKey}
            ref={camera}
            autofocus="off"
            facing="back"
            mode="picture"
            onCameraReady={() => {
              if (cameraSession.current === cameraKey && appActive) {
                setCameraReady(true);
              }
            }}
            onMountError={() => {
              if (cameraSession.current === cameraKey && appActive) {
                setCameraReady(false);
                setCameraError('카메라를 시작하지 못했습니다. 다시 시도해 주세요.');
              }
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
