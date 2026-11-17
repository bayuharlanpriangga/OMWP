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
  byokKeys: Array<{ provider: AiProviderId; key: string }>,
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
  const openAiModels: Record<string, string> = {
    openai: 'gpt-4o-mini',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openai/gpt-4o-mini',
    deepseek: 'deepseek-chat',
    xai: 'grok-2-latest',
    mistral: 'mistral-small-latest',
  };

  for (const entry of byokKeys) {
    try {
      if (entry.provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            entry.key
          )}`,
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
            model: 'claude-sonnet-4-20250514',
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
              model: openAiModels[entry.provider] || 'gpt-4o-mini',
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

