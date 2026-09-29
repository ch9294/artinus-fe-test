import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestGate } from '../src/requestGate.ts';

test('blocks rapid duplicate capture and OCR requests until each one finishes', () => {
  const gate = new RequestGate();
  const capture = gate.begin('capture');
  assert.notEqual(capture, null);
  assert.equal(gate.begin('capture'), null);
  gate.finish('capture', capture);
  assert.notEqual(gate.begin('capture'), null);

  const ocr = gate.begin('ocr');
  assert.notEqual(ocr, null);
  assert.equal(gate.begin('ocr'), null);
});

test('background and retake invalidate late results without unlocking newer work', () => {
  const gate = new RequestGate();
  const old = gate.begin('ocr');
  gate.setActive(false);
  assert.equal(gate.isCurrent('ocr', old), false);
  assert.equal(gate.begin('ocr'), null);
  gate.setActive(true);
  const resumed = gate.begin('ocr');
  gate.finish('ocr', old);
  assert.equal(gate.isCurrent('ocr', resumed), true);
  gate.invalidate();
  assert.equal(gate.isCurrent('ocr', resumed), false);
  assert.notEqual(gate.begin('ocr'), null);
});
