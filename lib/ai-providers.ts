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
}

export const PROVIDER_META: Record<AiProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    shortTag: 'G',
    bgHex: '#dbeafe',
    fgHex: '#1d4ed8',
    borderHex: '#1d4ed8',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    shortTag: 'O',
    bgHex: '#d1fae5',
    fgHex: '#047857',
    borderHex: '#047857',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    shortTag: 'C',
    bgHex: '#fef3c7',
    fgHex: '#b45309',
    borderHex: '#b45309',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    shortTag: 'Gq',
    bgHex: '#ffedd5',
    fgHex: '#c2410c',
    borderHex: '#c2410c',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    shortTag: 'OR',
    bgHex: '#ede9fe',
    fgHex: '#6d28d9',
    borderHex: '#6d28d9',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    shortTag: 'DS',
    bgHex: '#e0f2fe',
    fgHex: '#0369a1',
    borderHex: '#0369a1',
  },
  xai: {
    id: 'xai',
    name: 'xAI Grok',
    shortTag: 'X',
    bgHex: '#e5e7eb',
    fgHex: '#111827',
    borderHex: '#111827',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    shortTag: 'M',
    bgHex: '#ffe4e6',
    fgHex: '#be123c',
    borderHex: '#be123c',
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

export function orderByokKeysForRequest(
  entries: ByokKeyEntry[],
  preferredProvider?: AiProviderId | null
): Array<{ provider: AiProviderId; key: string }> {
  const seen = new Set<string>();
  const valid: Array<{ provider: AiProviderId; key: string }> = [];

  for (const entry of entries) {
    const trimmed = entry.key.trim();
    if (entry.status !== 'valid' || !entry.provider || !trimmed) continue;
    const dedupeKey = `${entry.provider}:${trimmed}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    valid.push({ provider: entry.provider, key: trimmed });
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
