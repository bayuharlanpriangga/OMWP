'use client';

import React from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { parseInlineMarkup } from '@/lib/page/page-edit/page-edit-markup-text';
import type { InlineToken } from '@/lib/deck-types';
import { MarkupTextAiTerm } from './PageEditMarkupTextAi';

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
      case 'italic':
        return (
          <em key={key}>
            {renderTokens(
              tok.children,
              live,
              insideModal,
              onTermClick,
              onModalClick,
              key
            )}
          </em>
        );
      case 'underline':
        return (
          <u key={key} className="ul">
            {renderTokens(
              tok.children,
              live,
              insideModal,
              onTermClick,
              onModalClick,
              key
            )}
          </u>
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
        return (
          <MarkupTextAiTerm
            key={key}
            term={tok.term}
            live={live}
            onTermClick={onTermClick}
          />
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
