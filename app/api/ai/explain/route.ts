import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { PROVIDER_META, type AiProviderId } from '@/lib/ai/ai-providers';
import type { SlideAiContext } from '@/lib/deck-types';

let cachedDefaultAi: GoogleGenAI | null = null;

function getDefaultAi(): GoogleGenAI {
  if (!cachedDefaultAi) {
    cachedDefaultAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedDefaultAi;
}

interface ExplainRequestBody {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  slideContext?: SlideAiContext;
  byokKeys?: Array<{ provider: AiProviderId; key: string; model?: string }>;
}

function buildSystemInstruction(ctx: SlideAiContext | undefined): string {
  const deckTitle = ctx?.deckTitle || 'Presentasi';
  const slidePos =
    ctx?.slideNumber && ctx?.totalSlides
      ? ` (Slide ${ctx.slideNumber} dari ${ctx.totalSlides})`
      : '';
  const slideTitle = ctx?.slideTitle || 'Slide';
  const outline = ctx?.slideContentOutline?.trim() || '';
  const slideText = ctx?.slideText?.trim() || '';
  const pointsText = ctx?.pointsText?.trim() || '';
  const deckOverview = ctx?.deckOverview?.trim() || '';
  const clickedTerm = ctx?.clickedTerm?.trim() || '';
  const surrounding = ctx?.surroundingContext?.trim() || '';

  return [
    `Kamu adalah Orias AI, asisten dalam presentasi interaktif berjudul "${deckTitle}"${slidePos}.`,
    `Topik/bagian slide aktif: "${slideTitle}".`,
    deckOverview ? `Ringkasan alur seluruh presentasi:\n${deckOverview}` : '',
    outline
      ? `Materi lengkap pada slide yang sedang dibuka:\n${outline}`
      : [
          slideText ? `Teks di slide: ${slideText}.` : '',
          pointsText ? `Poin di slide ini: ${pointsText}.` : '',
        ]
          .filter(Boolean)
          .join('\n'),
    clickedTerm && surrounding
      ? `Konteks spesifik tempat "${clickedTerm}" muncul:\n${surrounding}`
      : surrounding
        ? `Konteks lokal relevan:\n${surrounding}`
        : '',
    'Tugasmu: pahami apa yang sebenarnya sedang dibahas pada slide dan presentasi ini secara menyeluruh. Jika pertanyaan atau potongan teks/istilah bersifat singkat, implisit, atau ambigu (misalnya singkatan atau frasa tanpa keterangan lengkap), tafsirkan dan jelaskan maknanya sesuai konteks pembahasan materi di atas, bukan di luar topik presentasi.',
    'Jawab dalam bahasa Indonesia yang jelas, natural, dan ringkas (~100-150 kata), sertakan contoh singkat yang relevan dengan topik presentasi bila membantu.',
    'Boleh pakai **tebal** untuk istilah penting dan poin daftar (-) bila perlu.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function formatErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : 'Terjadi kesalahan saat menghubungi layanan AI.';
  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; message?: string; status?: string };
    };
    if (parsed?.error?.message) {
      if (
        parsed.error.code === 401 ||
        parsed.error.code === 403 ||
        parsed.error.status === 'UNAUTHENTICATED'
      ) {
        return 'Kunci API tidak valid atau belum aktif. Periksa API key Anda.';
      }
      if (parsed.error.code === 429) {
        return 'Kuota API sedang penuh. Coba lagi atau gunakan API key lain.';
      }
      return parsed.error.message;
    }
  } catch {
    // Keep raw message if not JSON
  }
  return raw;
}

async function callGeminiWithKey(
  apiKey: string,
  systemInstruction: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  isDefaultServerKey: boolean,
  customModel?: string
): Promise<string> {
  const client = isDefaultServerKey
    ? getDefaultAi()
    : new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

  const cleanCustom = customModel?.trim();
  const modelsToTry = isDefaultServerKey
    ? ['gemini-4-hydrogen']
    : cleanCustom
      ? [cleanCustom]
      : [PROVIDER_META.gemini.defaultModel, 'gemini-2.5-flash'];

  let lastErr: unknown = null;
  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction,
          thinkingConfig:
            model === 'gemini-4-hydrogen'
              ? { thinkingLevel: ThinkingLevel.LOW }
              : undefined,
        },
      });
      return (response.text || '').trim();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : '';
      if (!isDefaultServerKey && !cleanCustom && /404|NOT_FOUND/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}

async function callOpenAiCompatible(
  url: string,
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: systemInstruction,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
    signal: AbortSignal.timeout(25000),
  });

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  return (data.content?.find((c) => c.type === 'text')?.text || '').trim();
}

async function callByokProvider(
  provider: AiProviderId,
  apiKey: string,
  systemInstruction: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  customModel?: string
): Promise<string> {
  const model = customModel?.trim() || PROVIDER_META[provider].defaultModel;
  switch (provider) {
    case 'gemini':
      return callGeminiWithKey(
        apiKey,
        systemInstruction,
        messages,
        false,
        customModel
      );
    case 'openai':
      return callOpenAiCompatible(
        'https://api.openai.com/v1/chat/completions',
        apiKey,
        model,
        systemInstruction,
        messages
      );
    case 'groq':
      return callOpenAiCompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        apiKey,
        model,
        systemInstruction,
        messages
      );
    case 'openrouter':
      return callOpenAiCompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        apiKey,
        model,
        systemInstruction,
        messages
      );
    case 'deepseek':
      return callOpenAiCompatible(
        'https://api.deepseek.com/chat/completions',
        apiKey,
        model,
        systemInstruction,
        messages
      );
    case 'xai':
      return callOpenAiCompatible(
        'https://api.x.ai/v1/chat/completions',
        apiKey,
        model,
        systemInstruction,
        messages
      );
    case 'mistral':
      return callOpenAiCompatible(
        'https://api.mistral.ai/v1/chat/completions',
        apiKey,
        model,
        systemInstruction,
        messages
      );
    case 'claude':
      return callAnthropic(apiKey, model, systemInstruction, messages);
  }
}

export async function POST(req: NextRequest) {
  let body: ExplainRequestBody;
  try {
    body = (await req.json()) as ExplainRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Format permintaan JSON tidak valid.' },
      { status: 400 }
    );
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const cleanMessages = rawMessages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-10);

  if (cleanMessages.length === 0) {
    return NextResponse.json(
      { error: 'Pertanyaan tidak boleh kosong.' },
      { status: 400 }
    );
  }

  const systemInstruction = buildSystemInstruction(body.slideContext);

  const byokKeys = Array.isArray(body.byokKeys)
    ? body.byokKeys.filter(
        (item) =>
          item &&
          typeof item.provider === 'string' &&
          typeof item.key === 'string' &&
          item.key.trim().length > 0
      )
    : [];

  if (byokKeys.length > 0) {
    let lastError: unknown = null;
    for (const entry of byokKeys) {
      try {
        const reply = await callByokProvider(
          entry.provider,
          entry.key.trim(),
          systemInstruction,
          cleanMessages,
          entry.model
        );
        if (reply) {
          return NextResponse.json({ reply, usedProvider: entry.provider });
        }
      } catch (err) {
        lastError = err;
      }
    }
    return NextResponse.json(
      { error: formatErrorMessage(lastError) },
      { status: 502 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Belum ada API key aktif. Tambahkan API key di Pengaturan AI (ikon kunci) atau konfigurasikan GEMINI_API_KEY di server.',
      },
      { status: 400 }
    );
  }

  try {
    const reply = await callGeminiWithKey(
      process.env.GEMINI_API_KEY,
      systemInstruction,
      cleanMessages,
      true
    );
    if (!reply) {
      return NextResponse.json(
        { error: 'Orias AI tidak mengembalikan jawaban.' },
        { status: 502 }
      );
    }
    return NextResponse.json({ reply, usedProvider: 'gemini' });
  } catch (err) {
    return NextResponse.json(
      { error: formatErrorMessage(err) },
      { status: 502 }
    );
  }
}
