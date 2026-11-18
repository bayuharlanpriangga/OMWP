import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProviderCatalog,
  isLikelyChatModel,
  normalizeModelIdForProvider,
  PROVIDER_META,
  type AiProviderId,
} from '@/lib/ai/ai-providers';

export async function POST(req: NextRequest) {
  let provider: AiProviderId | '' = '';
  let apiKey = '';

  try {
    const body = (await req.json()) as {
      provider?: unknown;
      apiKey?: unknown;
    };
    if (typeof body.provider === 'string' && body.provider in PROVIDER_META) {
      provider = body.provider as AiProviderId;
    }
    apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  } catch {
    return NextResponse.json(
      { models: [], error: 'Permintaan tidak valid.' },
      { status: 400 }
    );
  }

  if (!provider || !apiKey) {
    return NextResponse.json(
      { models: [], error: 'Provider atau API key tidak lengkap.' },
      { status: 400 }
    );
  }

  try {
    const res = await fetchProviderCatalog(
      provider,
      apiKey,
      AbortSignal.timeout(6000),
      false
    );
    if (!res.ok) {
      return NextResponse.json({ models: [] });
    }
    const models = Array.from(
      new Set(
        res.entries
          .filter((entry) => isLikelyChatModel(provider, entry))
          .map((entry) => normalizeModelIdForProvider(provider, entry.id))
      )
    );
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
