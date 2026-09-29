export type CameraPermission = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
};

export type CameraPermissionState = 'checking' | 'allowed' | 'initial' | 'denied' | 'blocked';

export function cameraPermissionState(permission: CameraPermission | null): CameraPermissionState {
  if (!permission) return 'checking';
  if (permission.granted) return 'allowed';
  if (permission.status === 'undetermined') return 'initial';
  return permission.canAskAgain ? 'denied' : 'blocked';
}
