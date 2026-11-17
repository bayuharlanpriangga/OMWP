export type AiProviderId =
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'groq'
  | 'openrouter'
  | 'deepseek'
  | 'xai'
  | 'mistral';

export type ApiKeyStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export interface ByokKeyEntry {
  id: string;
  key: string;
  status: ApiKeyStatus;
  provider?: AiProviderId;
  error?: string;
}

export interface ProviderMeta {
  id: AiProviderId;
  name: string;
  shortTag: string;
  bgHex: string;
  fgHex: string;
  borderHex: string;
  defaultModel: string;
  presetModels: string[];
}

export const PROVIDER_META: Record<AiProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    shortTag: 'G',
    bgHex: '#dbeafe',
    fgHex: '#1d4ed8',
    borderHex: '#1d4ed8',
    defaultModel: 'gemini-4-hydrogen',
    presetModels: [
      'gemini-4-hydrogen',
      'gemini-3.1-flash-lite',
      'gemini-4-argon',
      'gemini-4-carbon',
      'gemini-2.5-flash',
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    shortTag: 'O',
    bgHex: '#d1fae5',
    fgHex: '#047857',
    borderHex: '#047857',
    defaultModel: 'gpt-6-luna',
    presetModels: [
      'gpt-6-luna',
      'gpt-6.1-sol',
      'gpt-6.2-astra',
      'gpt-5-mini',
      'gpt-4.1-mini',
    ],
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    shortTag: 'C',
    bgHex: '#fef3c7',
    fgHex: '#b45309',
    borderHex: '#b45309',
    defaultModel: 'claude-sonnet-5-5',
    presetModels: [
      'claude-sonnet-5-5',
      'claude-haiku-5-5',
      'claude-opus-5-5',
      'claude-fable-5-2',
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    shortTag: 'Gq',
    bgHex: '#ffedd5',
    fgHex: '#c2410c',
    borderHex: '#c2410c',
    defaultModel: 'openai/gpt-oss-120b',
    presetModels: [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.1-8b-instant',
      'qwen/qwen3-32b',
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    shortTag: 'OR',
    bgHex: '#ede9fe',
    fgHex: '#6d28d9',
    borderHex: '#6d28d9',
    defaultModel: 'openai/gpt-6-luna',
    presetModels: [
      'openai/gpt-6-luna',
      'openai/gpt-oss-120b',
      'anthropic/claude-sonnet-5-5',
      'google/gemini-2.5-flash',
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    shortTag: 'DS',
    bgHex: '#e0f2fe',
    fgHex: '#0369a1',
    borderHex: '#0369a1',
    defaultModel: 'deepseek-flash',
    presetModels: [
      'deepseek-flash',
      'v4-pro',
      'deepseek-chat',
      'deepseek-reasoner',
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI Grok',
    shortTag: 'X',
    bgHex: '#e5e7eb',
    fgHex: '#111827',
    borderHex: '#111827',
    defaultModel: 'grok-4.3',
    presetModels: ['grok-4.3', 'grok-4.7', 'grok-4.6', 'grok-4.5'],
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    shortTag: 'M',
    bgHex: '#ffe4e6',
    fgHex: '#be123c',
    borderHex: '#be123c',
    defaultModel: 'mistral-small-latest',
    presetModels: [
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest',
    ],
  },
};

export function inferCandidateProviders(rawKey: string): AiProviderId[] {
  const k = rawKey.trim();
  if (!k) return [];

  if (k.startsWith('AIza')) return ['gemini'];
  if (k.startsWith('sk-ant-')) return ['claude'];
  if (k.startsWith('gsk_')) return ['groq'];
  if (k.startsWith('sk-or-')) return ['openrouter'];
  if (k.startsWith('xai-')) return ['xai'];
  if (k.startsWith('sk-proj-') || k.startsWith('sk-svcacct-')) return ['openai'];
  if (k.startsWith('sk-')) return ['openai', 'deepseek', 'mistral'];

  // Generic keys (e.g. Mistral 32-char keys or other formats)
  return ['mistral', 'openai', 'groq', 'gemini'];
}

export interface GroupedProviderSummary {
  provider: AiProviderId;
  meta: ProviderMeta;
  count: number;
  entries: ByokKeyEntry[];
}

export function groupDetectedKeys(
  entries: ByokKeyEntry[]
): GroupedProviderSummary[] {
  const buckets = new Map<AiProviderId, ByokKeyEntry[]>();

  for (const entry of entries) {
    if (entry.status !== 'valid' || !entry.provider || !entry.key.trim()) {
      continue;
    }
    const list = buckets.get(entry.provider) || [];
    list.push(entry);
    buckets.set(entry.provider, list);
  }

  return Array.from(buckets.entries()).map(([provider, list]) => ({
    provider,
    meta: PROVIDER_META[provider],
    count: list.length,
    entries: list,
  }));
}

export function getSelectedModelForProvider(
  provider: AiProviderId,
  preferredModels?: Partial<Record<AiProviderId, string>> | null
): string {
  const custom = preferredModels?.[provider]?.trim();
  return custom || PROVIDER_META[provider].defaultModel;
}

export interface OrderedByokKey {
  provider: AiProviderId;
  key: string;
  model?: string;
}

export function orderByokKeysForRequest(
  entries: ByokKeyEntry[],
  preferredProvider?: AiProviderId | null,
  preferredModels?: Partial<Record<AiProviderId, string>> | null
): OrderedByokKey[] {
  const seen = new Set<string>();
  const valid: OrderedByokKey[] = [];

  for (const entry of entries) {
    const trimmed = entry.key.trim();
    if (entry.status !== 'valid' || !entry.provider || !trimmed) continue;
    const dedupeKey = `${entry.provider}:${trimmed}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const chosenModel = preferredModels?.[entry.provider]?.trim();
    valid.push(
      chosenModel
        ? { provider: entry.provider, key: trimmed, model: chosenModel }
        : { provider: entry.provider, key: trimmed }
    );
  }

  if (!preferredProvider) return valid;

  return [
    ...valid.filter((item) => item.provider === preferredProvider),
    ...valid.filter((item) => item.provider !== preferredProvider),
  ];
}

export function maskApiKey(rawKey: string): string {
  const k = rawKey.trim();
  if (k.length <= 10) return '••••••••';
  return `${k.slice(0, 6)}••••${k.slice(-4)}`;
}

export interface ProviderCatalogEntry {
  id: string;
  aliases?: string[];
  active?: boolean;
  supportedGenerationMethods?: string[];
}

export function normalizeModelIdForProvider(
  provider: AiProviderId,
  rawModel: string
): string {
  const trimmed = rawModel.trim();
  if (provider === 'gemini' && trimmed.startsWith('models/')) {
    return trimmed.slice('models/'.length);
  }
  return trimmed;
}

export function isLikelyChatModel(
  provider: AiProviderId,
  entry: ProviderCatalogEntry
): boolean {
  if (entry.active === false) return false;
  if (
    provider === 'gemini' &&
    Array.isArray(entry.supportedGenerationMethods) &&
    !entry.supportedGenerationMethods.includes('generateContent')
  ) {
    return false;
  }
  const lower = entry.id.toLowerCase();
  const excludedFragments = [
    'whisper',
    'tts',
    'transcribe',
    'embedding',
    'embed-',
    'moderation',
    'dall-e',
    'sora',
    'veo',
    'lyria',
    'imagen',
    'audio-',
    'realtime',
    'ocr',
    'guard',
  ];
  return !excludedFragments.some((frag) => lower.includes(frag));
}

export function matchModelInCatalog(
  provider: AiProviderId,
  rawModel: string,
  catalog: ProviderCatalogEntry[]
): { found: boolean; resolvedModel?: string; inactive?: boolean } {
  const clean = normalizeModelIdForProvider(provider, rawModel);
  if (!clean) return { found: false };
  const cleanLower = clean.toLowerCase();

  // 1. Exact ID match (case-sensitive, then case-insensitive)
  const exact =
    catalog.find((m) => normalizeModelIdForProvider(provider, m.id) === clean) ||
    catalog.find(
      (m) =>
        normalizeModelIdForProvider(provider, m.id).toLowerCase() === cleanLower
    );
  if (exact) {
    if (exact.active === false) {
      return { found: false, inactive: true };
    }
    if (
      provider === 'gemini' &&
      Array.isArray(exact.supportedGenerationMethods) &&
      !exact.supportedGenerationMethods.includes('generateContent')
    ) {
      return { found: false, inactive: true };
    }
    return {
      found: true,
      resolvedModel: normalizeModelIdForProvider(provider, exact.id),
    };
  }

  // 2. Alias match (e.g. Mistral aliases like mistral-small-latest)
  const aliasMatch = catalog.find((m) =>
    m.aliases?.some((a) => a.toLowerCase() === cleanLower)
  );
  if (aliasMatch) {
    if (aliasMatch.active === false) {
      return { found: false, inactive: true };
    }
    return { found: true, resolvedModel: clean };
  }

  // 3. Organization/model suffix match (e.g. user types "gpt-oss-120b" on Groq/OpenRouter -> "openai/gpt-oss-120b")
  if (!clean.includes('/')) {
    const suffixMatches = catalog.filter((m) => {
      if (m.active === false) return false;
      const norm = normalizeModelIdForProvider(provider, m.id).toLowerCase();
      return norm.endsWith(`/${cleanLower}`);
    });
    if (suffixMatches.length === 1) {
      return {
        found: true,
        resolvedModel: normalizeModelIdForProvider(
          provider,
          suffixMatches[0].id
        ),
      };
    }
  }

  return { found: false };
}

export function extractCatalogEntriesFromPayload(
  provider: AiProviderId,
  payload: unknown
): ProviderCatalogEntry[] {
  if (!payload || typeof payload !== 'object') return [];
  if (provider === 'gemini') {
    const models = (payload as { models?: unknown }).models;
    if (!Array.isArray(models)) return [];
    return models
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        id:
          typeof item.name === 'string'
            ? normalizeModelIdForProvider('gemini', item.name)
            : '',
        supportedGenerationMethods: Array.isArray(item.supportedGenerationMethods)
          ? item.supportedGenerationMethods.filter(
              (m): m is string => typeof m === 'string'
            )
          : undefined,
      }))
      .filter((item) => Boolean(item.id));
  }

  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id.trim() : '',
      aliases: Array.isArray(item.aliases)
        ? item.aliases.filter((a): a is string => typeof a === 'string')
        : undefined,
      active: typeof item.active === 'boolean' ? item.active : undefined,
    }))
    .filter((item) => Boolean(item.id));
}

export interface ProviderModelCheckResult {
  valid: boolean;
  resolvedModel?: string;
  error?: string;
}

export async function fetchProviderCatalog(
  provider: AiProviderId,
  apiKey: string,
  signal?: AbortSignal,
  directBrowser = false
): Promise<{ ok: boolean; entries: ProviderCatalogEntry[]; status?: number }> {
  let res: Response;
  switch (provider) {
    case 'gemini':
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${encodeURIComponent(
          apiKey
        )}`,
        { method: 'GET', signal }
      );
      break;
    case 'openai':
      res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      break;
    case 'claude':
      res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          ...(directBrowser
            ? { 'anthropic-dangerous-direct-browser-access': 'true' }
            : {}),
        },
        signal,
      });
      break;
    case 'groq':
      res = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      break;
    case 'openrouter':
      res = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      break;
    case 'deepseek':
      res = await fetch('https://api.deepseek.com/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      break;
    case 'xai':
      res = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      break;
    case 'mistral':
      res = await fetch('https://api.mistral.ai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      break;
  }

  if (!res.ok) {
    return { ok: false, entries: [], status: res.status };
  }

  try {
    const json = (await res.json()) as unknown;
    return {
      ok: true,
      entries: extractCatalogEntriesFromPayload(provider, json),
      status: res.status,
    };
  } catch {
    return { ok: false, entries: [], status: res.status };
  }
}

async function probeSingleProviderModel(
  provider: AiProviderId,
  apiKey: string,
  cleanModel: string,
  signal?: AbortSignal,
  directBrowser = false
): Promise<boolean> {
  const encoded = encodeURIComponent(cleanModel);
  try {
    let res: Response;
    switch (provider) {
      case 'gemini':
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encoded}?key=${encodeURIComponent(
            apiKey
          )}`,
          { method: 'GET', signal }
        );
        break;
      case 'openai':
        res = await fetch(`https://api.openai.com/v1/models/${encoded}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        });
        break;
      case 'claude':
        res = await fetch(`https://api.anthropic.com/v1/models/${encoded}`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            ...(directBrowser
              ? { 'anthropic-dangerous-direct-browser-access': 'true' }
              : {}),
          },
          signal,
        });
        break;
      case 'xai':
        res = await fetch(`https://api.x.ai/v1/models/${encoded}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        });
        break;
      case 'mistral':
        res = await fetch(`https://api.mistral.ai/v1/models/${encoded}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
          signal,
        });
        break;
      case 'groq':
        res = await fetch(
          `https://api.groq.com/openai/v1/models/${cleanModel}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          }
        );
        break;
      default:
        return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifyProviderModelAvailability(
  provider: AiProviderId,
  apiKey: string,
  rawModel: string,
  signal?: AbortSignal,
  directBrowser = false
): Promise<ProviderModelCheckResult> {
  const clean = normalizeModelIdForProvider(provider, rawModel);
  if (!clean) {
    return { valid: false, error: 'Masukkan nama model terlebih dahulu.' };
  }

  const meta = PROVIDER_META[provider];

  try {
    const catalogRes = await fetchProviderCatalog(
      provider,
      apiKey,
      signal,
      directBrowser
    );

    if (catalogRes.ok) {
      const matched = matchModelInCatalog(provider, clean, catalogRes.entries);
      if (matched.found && matched.resolvedModel) {
        return { valid: true, resolvedModel: matched.resolvedModel };
      }
      if (matched.inactive) {
        return {
          valid: false,
          error: `Model "${clean}" sudah tidak aktif atau tidak mendukung teks di ${meta.name}.`,
        };
      }
    }

    // Fallback direct model lookup for providers that support /models/{id}
    if (
      provider === 'gemini' ||
      provider === 'openai' ||
      provider === 'claude' ||
      provider === 'xai' ||
      provider === 'mistral' ||
      provider === 'groq'
    ) {
      const directOk = await probeSingleProviderModel(
        provider,
        apiKey,
        clean,
        signal,
        directBrowser
      );
      if (directOk) {
        return { valid: true, resolvedModel: clean };
      }
    }

    if (!catalogRes.ok && (catalogRes.status === 401 || catalogRes.status === 403)) {
      return {
        valid: false,
        error: `API key ${meta.name} ditolak saat memeriksa model.`,
      };
    }

    return {
      valid: false,
      error: `Model "${clean}" tidak tersedia di ${meta.name}.`,
    };
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') throw err;
    return {
      valid: false,
      error: `Gagal memeriksa model ke ${meta.name}. Periksa koneksi Anda.`,
    };
  }
}

export async function fetchProviderModelsDirectClient(
  provider: AiProviderId,
  apiKey: string,
  signal?: AbortSignal
): Promise<string[]> {
  const res = await fetchProviderCatalog(provider, apiKey, signal, true);
  if (!res.ok) return [];
  return res.entries
    .filter((entry) => isLikelyChatModel(provider, entry))
    .map((entry) => normalizeModelIdForProvider(provider, entry.id));
}

export async function verifyModelDirectClient(
  provider: AiProviderId,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<ProviderModelCheckResult> {
  return verifyProviderModelAvailability(provider, apiKey, model, signal, true);
}

export async function verifyKeyDirectClient(
  rawKey: string,
  signal?: AbortSignal
): Promise<{ valid: boolean; provider?: AiProviderId; error?: string }> {
  const apiKey = rawKey.trim();
  const candidates = inferCandidateProviders(apiKey);
  for (const provider of candidates) {
    try {
      let res: Response;
      switch (provider) {
        case 'gemini':
          res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(
              apiKey
            )}`,
            { method: 'GET', signal }
          );
          break;
        case 'openai':
          res = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          });
          break;
        case 'claude':
          res = await fetch('https://api.anthropic.com/v1/models', {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            signal,
          });
          break;
        case 'groq':
          res = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          });
          break;
        case 'openrouter':
          res = await fetch('https://openrouter.ai/api/v1/auth/key', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          });
          break;
        case 'deepseek':
          res = await fetch('https://api.deepseek.com/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          });
          break;
        case 'xai':
          res = await fetch('https://api.x.ai/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          });
          break;
        case 'mistral':
          res = await fetch('https://api.mistral.ai/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
          });
          break;
      }
      if (res.ok) return { valid: true, provider };
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') throw err;
    }
  }
  return {
    valid: false,
    error: 'API key tidak valid atau ditolak oleh provider.',
  };
}

export async function explainWithByokClient(
  byokKeys: OrderedByokKey[],
  systemInstruction: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const openAiUrls: Record<string, string> = {
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/chat/completions',
    xai: 'https://api.x.ai/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
  };

  for (const entry of byokKeys) {
    const model =
      entry.model?.trim() || PROVIDER_META[entry.provider].defaultModel;
    try {
      if (entry.provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model
          )}:generateContent?key=${encodeURIComponent(entry.key)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
            }),
          }
        );
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (res.ok && txt) return txt;
      } else if (entry.provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': entry.key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model,
            max_tokens: 800,
            system: systemInstruction,
            messages,
          }),
        });
        const data = (await res.json()) as {
          content?: Array<{ type?: string; text?: string }>;
        };
        const txt = data.content?.find((c) => c.type === 'text')?.text?.trim();
        if (res.ok && txt) return txt;
      } else {
        const res = await fetch(
          openAiUrls[entry.provider] || openAiUrls.openai,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${entry.key}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemInstruction },
                ...messages,
              ],
            }),
          }
        );
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const txt = data.choices?.[0]?.message?.content?.trim();
        if (res.ok && txt) return txt;
      }
    } catch {
      // Try next configured key
    }
  }
  throw new Error('Gagal menghubungi provider AI menggunakan API key Anda.');
}
