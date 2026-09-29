import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeOcrResults } from '../src/ocrResult.ts';

test('combines Korean and Latin results without duplicate lines', () => {
  const summary = summarizeOcrResults([
    { status: 'fulfilled', value: { text: '안녕하세요\nHello' } },
    { status: 'fulfilled', value: { text: 'Hello\nWorld' } },
  ]);

  assert.deepEqual(summary, {
    status: 'success',
    text: '안녕하세요\nHello\nWorld',
    partialFailure: false,
  });
});

test('distinguishes no detected text from a recognition error', () => {
  assert.deepEqual(summarizeOcrResults([
    { status: 'fulfilled', value: { text: '  \n ' } },
    { status: 'fulfilled', value: { text: '' } },
  ]), { status: 'empty' });

  assert.deepEqual(summarizeOcrResults([
    { status: 'rejected', reason: new Error('Korean model failed') },
    { status: 'fulfilled', value: { text: '' } },
  ]), { status: 'error' });
});

test('keeps available text when one model fails', () => {
  assert.deepEqual(summarizeOcrResults([
    { status: 'rejected', reason: new Error('Korean model failed') },
    { status: 'fulfilled', value: { text: 'English' } },
  ]), { status: 'success', text: 'English', partialFailure: true });
});
