import assert from 'node:assert/strict';
import test from 'node:test';
import { captureFlowReducer, initialCaptureFlow } from '../src/captureFlow.ts';

const firstPhoto = { uri: 'file:///first.jpg', width: 1200, height: 1600 };
const secondPhoto = { uri: 'file:///second.jpg', width: 1200, height: 1600 };

function reduce(actions) {
  return actions.reduce(captureFlowReducer, initialCaptureFlow);
}

test('shows the complete OCR result and clears it before a second capture', () => {
  const longText = Array.from({ length: 100 }, (_, index) => `인식한 문장 ${index + 1}`).join('\n');
  const firstResult = reduce([
    { type: 'captured', photo: firstPhoto },
    { type: 'ocrStarted' },
    { type: 'ocrFinished', result: { status: 'success', text: longText, partialFailure: false } },
  ]);

  assert.deepEqual(firstResult, {
    screen: 'result', photo: firstPhoto,
    ocr: { status: 'success', text: longText, partialFailure: false },
  });
  assert.deepEqual(captureFlowReducer(firstResult, { type: 'retake' }), { screen: 'camera' });

  const secondCapture = captureFlowReducer(captureFlowReducer(firstResult, { type: 'retake' }), {
    type: 'captured', photo: secondPhoto,
  });
  assert.deepEqual(secondCapture, {
    screen: 'photo', photo: secondPhoto, imageError: false, ocr: { status: 'idle' },
  });
  const secondResult = [
    { type: 'ocrStarted' },
    { type: 'ocrFinished', result: { status: 'success', text: '두 번째 사진', partialFailure: false } },
  ].reduce(captureFlowReducer, secondCapture);
  assert.deepEqual(secondResult, {
    screen: 'result', photo: secondPhoto,
    ocr: { status: 'success', text: '두 번째 사진', partialFailure: false },
  });
});

test('retake clears image and OCR errors, and ignores a finished result after leaving the photo', () => {
  const imageFailure = reduce([{ type: 'captured', photo: firstPhoto }, { type: 'imageFailed', uri: firstPhoto.uri }]);
  assert.equal(imageFailure.screen, 'photo');
  assert.equal(imageFailure.imageError, true);
  assert.deepEqual(captureFlowReducer(imageFailure, { type: 'retake' }), { screen: 'camera' });

  const ocrFailure = reduce([
    { type: 'captured', photo: firstPhoto },
    { type: 'ocrStarted' },
    { type: 'ocrFinished', result: { status: 'error' } },
  ]);
  assert.equal(ocrFailure.ocr.status, 'error');
  assert.deepEqual(captureFlowReducer(ocrFailure, { type: 'retake' }), { screen: 'camera' });

  const processing = reduce([{ type: 'captured', photo: firstPhoto }, { type: 'ocrStarted' }]);
  const leftPhoto = captureFlowReducer(processing, { type: 'retake' });
  assert.deepEqual(captureFlowReducer(leftPhoto, {
    type: 'ocrFinished', result: { status: 'success', text: '이전 사진', partialFailure: false },
  }), { screen: 'camera' });
});

test('rejects duplicate transitions and stale image errors, then resets interrupted OCR', () => {
  const captured = reduce([{ type: 'captured', photo: firstPhoto }]);
  assert.equal(captureFlowReducer(captured, { type: 'captured', photo: secondPhoto }), captured);
  assert.equal(captureFlowReducer(captured, { type: 'imageFailed', uri: secondPhoto.uri }), captured);

  const processing = captureFlowReducer(captured, { type: 'ocrStarted' });
  assert.equal(captureFlowReducer(processing, { type: 'ocrStarted' }), processing);
  const interrupted = captureFlowReducer(processing, { type: 'interrupted' });
  assert.deepEqual(interrupted, { ...captured, ocr: { status: 'idle' } });
  assert.equal(captureFlowReducer(interrupted, {
    type: 'ocrFinished', result: { status: 'success', text: '늦은 결과', partialFailure: false },
  }), interrupted);
});
