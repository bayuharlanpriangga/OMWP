'use client';

import React from 'react';

interface MarkupTextAiTermProps {
  term: string;
  live: boolean;
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function MarkupTextAiTerm({
  term,
  live,
  onTermClick,
}: MarkupTextAiTermProps) {
  if (live) {
    return (
      <button
        type="button"
        className="term"
        onClick={(e) => {
          e.stopPropagation();
          onTermClick?.(term, e);
        }}
        aria-label={`Jelaskan istilah ${term} dengan AI`}
      >
        {term}
      </button>
    );
  }
  return <span className="term">{term}</span>;
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
