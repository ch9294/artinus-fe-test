import type { OcrSummary } from './ocrResult';

export type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export type CaptureFlow =
  | { screen: 'camera' }
  | {
      screen: 'photo';
      photo: CapturedPhoto;
      imageError: boolean;
      ocr: { status: 'idle' | 'processing' } | Extract<OcrSummary, { status: 'empty' | 'error' }>;
    }
  | { screen: 'result'; photo: CapturedPhoto; ocr: Extract<OcrSummary, { status: 'success' }> };

export type CaptureFlowAction =
  | { type: 'captured'; photo: CapturedPhoto }
  | { type: 'imageFailed' }
  | { type: 'ocrStarted' }
  | { type: 'ocrFinished'; result: OcrSummary }
  | { type: 'retake' };

export const initialCaptureFlow: CaptureFlow = { screen: 'camera' };

export function captureFlowReducer(state: CaptureFlow, action: CaptureFlowAction): CaptureFlow {
  switch (action.type) {
    case 'captured':
      return { screen: 'photo', photo: action.photo, imageError: false, ocr: { status: 'idle' } };
    case 'imageFailed':
      return state.screen === 'photo' ? { ...state, imageError: true } : state;
    case 'ocrStarted':
      return state.screen === 'photo' && !state.imageError
        ? { ...state, ocr: { status: 'processing' } }
        : state;
    case 'ocrFinished':
      if (state.screen !== 'photo' || state.ocr.status !== 'processing') return state;
      return action.result.status === 'success'
        ? { screen: 'result', photo: state.photo, ocr: action.result }
        : { ...state, ocr: action.result };
    case 'retake':
      return initialCaptureFlow;
  }
}
