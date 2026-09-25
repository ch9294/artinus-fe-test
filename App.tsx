import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const captureInProgress = useRef(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  async function askForPermission() {
    setPermissionError(false);
    try {
      await requestPermission();
    } catch {
      setPermissionError(true);
    }
  }

  async function takePhoto() {
    if (!cameraReady || !camera.current || captureInProgress.current) return;

    captureInProgress.current = true;
    setCapturing(true);
    setCameraError(null);
    try {
      // Expo processes orientation before returning the temporary image URI.
      const result = await camera.current.takePictureAsync({ skipProcessing: false });
      if (!result?.uri) throw new Error('Camera returned no image');
      setImageError(false);
      setPhoto({ uri: result.uri, width: result.width, height: result.height });
    } catch {
      setCameraError('촬영하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      captureInProgress.current = false;
      setCapturing(false);
    }
  }

  function retakePhoto() {
    setPhoto(null);
    setImageError(false);
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

  if (!permission) {
    content = <ActivityIndicator size="large" color="#ffffff" accessibilityLabel="카메라 권한 확인 중" />;
  } else if (!permission.granted) {
    content = (
      <View style={styles.centered}>
        <Text style={styles.title}>카메라 접근이 필요합니다</Text>
        <Text style={styles.description}>인식할 글자를 촬영하려면 카메라 권한을 허용해 주세요.</Text>
        {permissionError && <Text style={styles.error}>권한을 요청하지 못했습니다. 다시 시도해 주세요.</Text>}
        {(permission.status === 'undetermined' || permission.canAskAgain) ? (
          <Pressable
            accessibilityRole="button"
            onPress={askForPermission}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>카메라 권한 요청</Text>
          </Pressable>
        ) : (
          <Text style={styles.description}>기기 설정에서 이 앱의 카메라 권한을 허용해 주세요.</Text>
        )}
      </View>
    );
  } else if (photo) {
    content = (
      <View style={styles.content}>
        <Text style={styles.title}>촬영 이미지 확인</Text>
        {imageError ? (
          <View style={styles.imageFallback}>
            <Text style={styles.error}>이미지를 표시하지 못했습니다. 다시 촬영해 주세요.</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel="촬영한 이미지"
            onError={() => setImageError(true)}
            resizeMode="contain"
            source={{ uri: photo.uri }}
            style={styles.photo}
          />
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {content}
    </SafeAreaView>
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
