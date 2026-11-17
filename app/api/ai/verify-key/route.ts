import { NextRequest, NextResponse } from 'next/server';
import {
  inferCandidateProviders,
  PROVIDER_META,
  type AiProviderId,
} from '@/lib/ai-providers';

interface VerifyResult {
  valid: boolean;
  provider?: AiProviderId;
  error?: string;
}

async function probeProvider(
  provider: AiProviderId,
  apiKey: string
): Promise<'ok' | 'unauthorized' | 'error'> {
  const signal = AbortSignal.timeout(4500);
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

    if (res.ok) return 'ok';
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return 'unauthorized';
    }
    return 'error';
  } catch {
    return 'error';
  }
}

export async function POST(req: NextRequest) {
  let apiKey = '';
  try {
    const body = (await req.json()) as { apiKey?: unknown };
    apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  } catch {
    return NextResponse.json<VerifyResult>(
      { valid: false, error: 'Permintaan tidak valid.' },
      { status: 400 }
    );
  }

  if (apiKey.length < 12) {
    return NextResponse.json<VerifyResult>({
      valid: false,
      error: 'API key terlalu pendek.',
    });
  }

  const candidates = inferCandidateProviders(apiKey);
  if (candidates.length === 0) {
    return NextResponse.json<VerifyResult>({
      valid: false,
      error: 'Format API key tidak dikenali.',
    });
  }

  let sawNetworkError = false;
  for (const provider of candidates) {
    const status = await probeProvider(provider, apiKey);
    if (status === 'ok') {
      return NextResponse.json<VerifyResult>({
        valid: true,
        provider,
      });
    }
    if (status === 'error') {
      sawNetworkError = true;
    }
  }

  const hintName =
    candidates.length === 1 ? PROVIDER_META[candidates[0]].name : 'provider AI';
  return NextResponse.json<VerifyResult>({
    valid: false,
    error: sawNetworkError
      ? `Gagal memverifikasi ke ${hintName}. Periksa koneksi atau validitas key.`
      : `API key ditolak oleh ${hintName}.`,
  });
}
