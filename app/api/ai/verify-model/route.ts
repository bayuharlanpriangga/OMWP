import { NextRequest, NextResponse } from 'next/server';
import {
  PROVIDER_META,
  verifyProviderModelAvailability,
  type AiProviderId,
  type ProviderModelCheckResult,
} from '@/lib/ai/ai-providers';

export async function POST(req: NextRequest) {
  let provider: AiProviderId | '' = '';
  let apiKey = '';
  let model = '';

  try {
    const body = (await req.json()) as {
      provider?: unknown;
      apiKey?: unknown;
      model?: unknown;
    };
    if (typeof body.provider === 'string' && body.provider in PROVIDER_META) {
      provider = body.provider as AiProviderId;
    }
    apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    model = typeof body.model === 'string' ? body.model.trim() : '';
  } catch {
    return NextResponse.json<ProviderModelCheckResult>(
      { valid: false, error: 'Permintaan tidak valid.' },
      { status: 400 }
    );
  }

  if (!provider || !apiKey) {
    return NextResponse.json<ProviderModelCheckResult>(
      { valid: false, error: 'Provider atau API key tidak tersedia.' },
      { status: 400 }
    );
  }

  const result = await verifyProviderModelAvailability(
    provider,
    apiKey,
    model,
    AbortSignal.timeout(6500),
    false
  );

  return NextResponse.json<ProviderModelCheckResult>(result);
}
