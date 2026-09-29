import assert from 'node:assert/strict';
import test from 'node:test';
import { cameraPermissionState } from '../src/cameraPermission.ts';

test('distinguishes first request, repeatable denial, and settings-only denial', () => {
  assert.equal(cameraPermissionState(null), 'checking');
  assert.equal(cameraPermissionState({ status: 'undetermined', granted: false, canAskAgain: true }), 'initial');
  assert.equal(cameraPermissionState({ status: 'denied', granted: false, canAskAgain: true }), 'denied');
  assert.equal(cameraPermissionState({ status: 'denied', granted: false, canAskAgain: false }), 'blocked');
});

test('maps a refreshed Settings permission to camera access', () => {
  assert.equal(cameraPermissionState({ status: 'denied', granted: false, canAskAgain: false }), 'blocked');
  assert.equal(cameraPermissionState({ status: 'granted', granted: true, canAskAgain: true }), 'allowed');
  assert.equal(cameraPermissionState({ status: 'denied', granted: false, canAskAgain: false }), 'blocked');
});
