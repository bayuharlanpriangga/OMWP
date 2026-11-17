import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupDetectedKeys,
  inferCandidateProviders,
  maskApiKey,
  orderByokKeysForRequest,
  type ByokKeyEntry,
} from './ai-providers';

test('inferCandidateProviders identifies known API key prefixes accurately', () => {
  assert.deepEqual(inferCandidateProviders('AIzaSyDemo123456'), ['gemini']);
  assert.deepEqual(inferCandidateProviders('sk-ant-api03-xyz'), ['claude']);
  assert.deepEqual(inferCandidateProviders('gsk_abc123def'), ['groq']);
  assert.deepEqual(inferCandidateProviders('sk-or-v1-abc123'), ['openrouter']);
  assert.deepEqual(inferCandidateProviders('xai-123456'), ['xai']);
  assert.deepEqual(inferCandidateProviders('sk-proj-abc123'), ['openai']);
  assert.deepEqual(inferCandidateProviders('sk-abcdef123456'), [
    'openai',
    'deepseek',
    'mistral',
  ]);
  assert.deepEqual(inferCandidateProviders(''), []);
});

test('groupDetectedKeys counts valid keys per AI provider and ignores idle/invalid entries', () => {
  const entries: ByokKeyEntry[] = [
    { id: '1', key: 'AIzaKey1', status: 'valid', provider: 'gemini' },
    { id: '2', key: 'AIzaKey2', status: 'valid', provider: 'gemini' },
    { id: '3', key: 'gsk_Key1', status: 'valid', provider: 'groq' },
    { id: '4', key: 'bad-key', status: 'invalid', error: 'Invalid' },
    { id: '5', key: '', status: 'idle' },
  ];

  const grouped = groupDetectedKeys(entries);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].provider, 'gemini');
  assert.equal(grouped[0].count, 2);
  assert.equal(grouped[1].provider, 'groq');
  assert.equal(grouped[1].count, 1);
});

test('orderByokKeysForRequest prioritizes preferred provider and deduplicates keys', () => {
  const entries: ByokKeyEntry[] = [
    { id: '1', key: 'AIzaKey1', status: 'valid', provider: 'gemini' },
    { id: '2', key: 'AIzaKey1', status: 'valid', provider: 'gemini' },
    { id: '3', key: 'gsk_Key1', status: 'valid', provider: 'groq' },
    { id: '4', key: 'sk-ant-Key1', status: 'valid', provider: 'claude' },
  ];

  const ordered = orderByokKeysForRequest(entries, 'groq');
  assert.deepEqual(ordered, [
    { provider: 'groq', key: 'gsk_Key1' },
    { provider: 'gemini', key: 'AIzaKey1' },
    { provider: 'claude', key: 'sk-ant-Key1' },
  ]);
});

test('maskApiKey redacts middle characters safely', () => {
  assert.equal(maskApiKey('AIzaSyD1234567890wxyz'), 'AIzaSy••••wxyz');
  assert.equal(maskApiKey('short'), '••••••••');
});
