'use client';

import React from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { parseInlineMarkup } from '@/lib/logic/logic-page/logic-page-content/logic-markup-text-ai';
import type { InlineToken } from '@/lib/deck-types';

interface MarkupTextProps {
  text: string;
  live: boolean;
  insideModal?: boolean;
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

function renderTokens(
  tokens: InlineToken[],
  live: boolean,
  insideModal: boolean,
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void,
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void,
  keyPrefix = 't'
): React.ReactNode[] {
  return tokens.map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (tok.type) {
      case 'text':
        return <React.Fragment key={key}>{tok.value}</React.Fragment>;
      case 'br':
        return <br key={key} />;
      case 'bold':
        return (
          <strong key={key}>
            {renderTokens(
              tok.children,
              live,
              insideModal,
              onTermClick,
              onModalClick,
              key
            )}
          </strong>
        );
      case 'size':
        return (
          <span key={key} className={`z-${tok.size}`}>
            {renderTokens(
              tok.children,
              live,
              insideModal,
              onTermClick,
              onModalClick,
              key
            )}
          </span>
        );
      case 'ai-term':
        if (live) {
          return (
            <button
              key={key}
              type="button"
              className="term"
              onClick={(e) => {
                e.stopPropagation();
                onTermClick?.(tok.term, e);
              }}
              aria-label={`Jelaskan istilah ${tok.term} dengan AI`}
            >
              {tok.term}
            </button>
          );
        }
        return (
          <span key={key} className="term">
            {tok.term}
          </span>
        );
      case 'modal-trigger': {
        const label = tok.title || 'Info';
        if (live && !insideModal) {
          return (
            <button
              key={key}
              type="button"
              className="term mt inline-flex items-center gap-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onModalClick?.(tok.title, e);
              }}
              aria-label={`Buka detail ${label}`}
            >
              {tok.title ? (
                <>
                  <span>{tok.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 inline shrink-0" aria-hidden="true" />
                </>
              ) : (
                <Info className="w-3.5 h-3.5 inline shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        }
        return (
          <span key={key} className="term mt inline-flex items-center gap-0.5">
            {tok.title || 'Info'}
          </span>
        );
      }
    }
  });
}

export function MarkupText({
  text,
  live,
  insideModal = false,
  onTermClick,
  onModalClick,
}: MarkupTextProps) {
  const tokens = React.useMemo(() => parseInlineMarkup(text), [text]);
  return (
    <>
      {renderTokens(tokens, live, insideModal, onTermClick, onModalClick)}
    </>
  );
}

export function AiMessageText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((rawLine, idx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        const isBullet = /^[-*]\s+/.test(trimmed);
        const content = isBullet ? trimmed.replace(/^[-*]\s+/, '• ') : rawLine;
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={idx} className="m-0">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
              }
              return <React.Fragment key={pIdx}>{part}</React.Fragment>;
            })}
          </p>
        );
      })}
    </div>
  );
}
