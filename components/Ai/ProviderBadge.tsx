'use client';

import React from 'react';
import {
  Bot,
  Brain,
  Cpu,
  Flame,
  Orbit,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PROVIDER_META, type AiProviderId } from '@/lib/ai/ai-providers';

interface ProviderIconProps {
  provider: AiProviderId;
  size?: 'sm' | 'md';
  count?: number;
}

export function ProviderIcon({
  provider,
  size = 'md',
  count,
}: ProviderIconProps) {
  const meta = PROVIDER_META[provider];
  const dim = size === 'sm' ? 'w-6 h-6 rounded-[6px]' : 'w-9 h-9 rounded-[8px]';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const renderGlyph = () => {
    switch (provider) {
      case 'gemini':
        return <Sparkles className={iconSize} aria-hidden="true" />;
      case 'openai':
        return <Orbit className={iconSize} aria-hidden="true" />;
      case 'claude':
        return <Brain className={iconSize} aria-hidden="true" />;
      case 'groq':
        return <Zap className={iconSize} aria-hidden="true" />;
      case 'openrouter':
        return <Cpu className={iconSize} aria-hidden="true" />;
      case 'deepseek':
        return <Flame className={iconSize} aria-hidden="true" />;
      case 'xai':
        return <Bot className={iconSize} aria-hidden="true" />;
      case 'mistral':
        return <Flame className={iconSize} aria-hidden="true" />;
    }
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 border-2 ${dim}`}
      style={{
        backgroundColor: meta.bgHex,
        color: meta.fgHex,
        borderColor: meta.borderHex,
      }}
      title={meta.name}
    >
      {renderGlyph()}
      {typeof count === 'number' && count > 0 && (
        <span
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#111111] text-white text-[11px] font-bold leading-none inline-flex items-center justify-center border-2 border-white font-mono"
          aria-label={`${count} kunci ${meta.name}`}
        >
          {count}
        </span>
      )}
    </span>
  );
}
