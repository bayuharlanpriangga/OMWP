import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractCatalogEntriesFromPayload,
  getSelectedModelForProvider,
  groupDetectedKeys,
  inferCandidateProviders,
  isLikelyChatModel,
  maskApiKey,
  matchModelInCatalog,
  orderByokKeysForRequest,
  PROVIDER_META,
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

test('PROVIDER_META defaults point to current active provider models (including Groq openai/gpt-oss-120b)', () => {
  assert.equal(PROVIDER_META.groq.defaultModel, 'openai/gpt-oss-120b');
  assert.equal(PROVIDER_META.gemini.defaultModel, 'gemini-4-hydrogen');
  assert.equal(PROVIDER_META.openai.defaultModel, 'gpt-6-luna');
  assert.equal(PROVIDER_META.claude.defaultModel, 'claude-sonnet-5-5');
  assert.equal(PROVIDER_META.deepseek.defaultModel, 'deepseek-flash');
  assert.equal(PROVIDER_META.xai.defaultModel, 'grok-4.3');
  assert.equal(PROVIDER_META.mistral.defaultModel, 'mistral-small-latest');
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

test('orderByokKeysForRequest prioritizes preferred provider, attaches preferredModels, and deduplicates keys', () => {
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

  const orderedWithModels = orderByokKeysForRequest(entries, 'groq', {
    groq: 'openai/gpt-oss-120b',
    claude: 'claude-haiku-5-5',
  });
  assert.deepEqual(orderedWithModels, [
    { provider: 'groq', key: 'gsk_Key1', model: 'openai/gpt-oss-120b' },
    { provider: 'gemini', key: 'AIzaKey1' },
    { provider: 'claude', key: 'sk-ant-Key1', model: 'claude-haiku-5-5' },
  ]);
});

test('getSelectedModelForProvider returns custom model or falls back to provider default', () => {
  assert.equal(getSelectedModelForProvider('groq'), 'openai/gpt-oss-120b');
  assert.equal(
    getSelectedModelForProvider('groq', { groq: 'openai/gpt-oss-20b' }),
    'openai/gpt-oss-20b'
  );
  assert.equal(
    getSelectedModelForProvider('groq', { groq: '   ' }),
    'openai/gpt-oss-120b'
  );
});

test('matchModelInCatalog resolves exact IDs, aliases, org/model suffix (gpt-oss-120b -> openai/gpt-oss-120b), and rejects inactive models', () => {
  const groqCatalog = [
    { id: 'openai/gpt-oss-120b', active: true },
    { id: 'openai/gpt-oss-20b', active: true },
    { id: 'llama-3.3-70b-versatile', active: false },
  ];

  assert.deepEqual(
    matchModelInCatalog('groq', 'openai/gpt-oss-120b', groqCatalog),
    { found: true, resolvedModel: 'openai/gpt-oss-120b' }
  );
  assert.deepEqual(matchModelInCatalog('groq', 'gpt-oss-120b', groqCatalog), {
    found: true,
    resolvedModel: 'openai/gpt-oss-120b',
  });
  assert.deepEqual(
    matchModelInCatalog('groq', 'llama-3.3-70b-versatile', groqCatalog),
    { found: false, inactive: true }
  );
  assert.deepEqual(matchModelInCatalog('groq', 'non-existent', groqCatalog), {
    found: false,
  });

  const mistralCatalog = [
    {
      id: 'mistral-small-2603',
      aliases: ['mistral-small-latest'],
    },
  ];
  assert.deepEqual(
    matchModelInCatalog('mistral', 'mistral-small-latest', mistralCatalog),
    { found: true, resolvedModel: 'mistral-small-latest' }
  );
});

test('extractCatalogEntriesFromPayload & isLikelyChatModel parse provider payloads and exclude audio/embedding models', () => {
  const geminiEntries = extractCatalogEntriesFromPayload('gemini', {
    models: [
      {
        name: 'models/gemini-4-hydrogen',
        supportedGenerationMethods: ['generateContent'],
      },
      {
        name: 'models/gemini-embedding-2',
        supportedGenerationMethods: ['embedContent'],
      },
    ],
  });
  assert.equal(geminiEntries.length, 2);
  assert.equal(geminiEntries[0].id, 'gemini-4-hydrogen');
  assert.equal(isLikelyChatModel('gemini', geminiEntries[0]), true);
  assert.equal(isLikelyChatModel('gemini', geminiEntries[1]), false);

  const groqEntries = extractCatalogEntriesFromPayload('groq', {
    data: [
      { id: 'openai/gpt-oss-120b', active: true },
      { id: 'whisper-large-v3', active: true },
    ],
  });
  assert.equal(isLikelyChatModel('groq', groqEntries[0]), true);
  assert.equal(isLikelyChatModel('groq', groqEntries[1]), false);
});

test('maskApiKey redacts middle characters safely', () => {
  assert.equal(maskApiKey('AIzaSyD1234567890wxyz'), 'AIzaSy••••wxyz');
  assert.equal(maskApiKey('short'), '••••••••');
});
