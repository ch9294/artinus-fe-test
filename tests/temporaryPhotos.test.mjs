import assert from 'node:assert/strict';
import test from 'node:test';
import { TemporaryPhotos } from '../src/temporaryPhotos.ts';

test('deletes each discarded photo only after all OCR readers release it', () => {
  const removed = [];
  const photos = new TemporaryPhotos((uri) => removed.push(uri));
  photos.retain('first.jpg');
  photos.retain('first.jpg');
  photos.discard('first.jpg');
  assert.deepEqual(removed, []);
  photos.release('first.jpg');
  assert.deepEqual(removed, []);
  photos.release('first.jpg');
  assert.deepEqual(removed, ['first.jpg']);
  photos.discard('second.jpg');
  assert.deepEqual(removed, ['first.jpg', 'second.jpg']);
});
