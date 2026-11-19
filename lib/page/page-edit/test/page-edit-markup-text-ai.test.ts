import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAiTermToken } from '../page-edit-markup-text-ai';

test('parseAiTermToken parses double-bracket AI term tokens and ignores triple-bracket modal triggers', () => {
  assert.deepEqual(parseAiTermToken('[[istilah AI]]', 0), {
    token: { type: 'ai-term', term: 'istilah AI' },
    nextIdx: 14,
  });
  assert.equal(parseAiTermToken('[[[modal]]]', 0), null);
});
