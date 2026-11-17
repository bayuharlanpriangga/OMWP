'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Loader2,
  Maximize2,
  Send,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { ChatMessage, ThemeId } from '@/lib/deck-types';
import { AiMessageText } from './MarkupText';

interface AiAssistantProps {
  open: boolean;
  miniOpen: boolean;
  busy: boolean;
  activeTerm: string | null;
  messages: ChatMessage[];
  theme: ThemeId;
  onToggleOpen: () => void;
  onExpandFromMini: () => void;
  onCloseMini: () => void;
  onClose: () => void;
  onClear: () => void;
  onOpenPrefs: () => void;
  onSendQuestion: (question: string, cacheTerm?: string) => void;
}

export function AiAssistant({
  open,
  miniOpen,
  busy,
  activeTerm,
  messages,
  theme,
  onToggleOpen,
  onExpandFromMini,
  onCloseMini,
  onClose,
  onClear,
  onOpenPrefs,
  onSendQuestion,
}: AiAssistantProps) {
  const [input, setInput] = React.useState('');
  const [typedCounts, setTypedCounts] = React.useState<Record<string, number>>(
    {}
  );
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const miniScrollRef = React.useRef<HTMLDivElement>(null);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const latestAnimating = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.animate && !m.done);
  const animatingId = latestAnimating?.id;
  const animatingText = latestAnimating?.text ?? '';

  // Shared typewriter effect across mini-bubble and full chat bubble
  React.useEffect(() => {
    if (prefersReduced || !animatingId || !animatingText) return;

    const intervalMs = theme === 'auditor' ? 16 : 24;
    const total = animatingText.length;
    const stepSize = Math.max(
      theme === 'auditor' ? 3 : 4,
      Math.ceil(total / 110)
    );

    const timer = window.setInterval(() => {
      setTypedCounts((prev) => {
        const cur = prev[animatingId] ?? 0;
        if (cur >= total) {
          window.clearInterval(timer);
          return prev;
        }
        const next = Math.min(total, cur + stepSize);
        if (next >= total) {
          window.clearInterval(timer);
        }
        return { ...prev, [animatingId]: next };
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [animatingId, animatingText, theme, prefersReduced]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && open) {
      el.scrollTop = el.scrollHeight;
    }
    const miniEl = miniScrollRef.current;
    if (miniEl && !open && miniOpen) {
      miniEl.scrollTop = miniEl.scrollHeight;
    }
  }, [messages, typedCounts, busy, open, miniOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setInput('');
    onSendQuestion(trimmed);
  };

  const lastMessage = messages[messages.length - 1];
  const miniMessage =
    lastMessage &&
    (lastMessage.role === 'assistant' || lastMessage.role === 'error')
      ? lastMessage
      : null;

  const renderAssistantReply = (m: ChatMessage) => {
    const count = typedCounts[m.id];
    const isTyping =
      !prefersReduced &&
      m.animate &&
      !m.done &&
      (count === undefined || count < m.text.length);
    const shownText = isTyping ? m.text.slice(0, count ?? 0) : m.text;
    return (
      <>
        <AiMessageText text={shownText} />
        {isTyping && <span className="ai-cur" aria-hidden="true" />}
      </>
    );
  };

  return (
    <>
      <button
        type="button"
        className={`pres-fab ${!open && miniOpen && busy ? 'animate-pulse' : ''}`}
        onClick={() => {
          if (!open && miniOpen) {
            onExpandFromMini();
          } else {
            onToggleOpen();
          }
        }}
        aria-label={open ? 'Tutup Asisten AI' : 'Buka Asisten AI'}
        aria-expanded={open}
      >
        <Sparkles className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Compact speech bubble anchored to Floating AI Button when chat drawer is closed */}
      <AnimatePresence>
        {!open && miniOpen && (
          <motion.aside
            role="status"
            aria-label="Penjelasan singkat Asisten AI"
            className="ai-mini-bubble"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            onClick={onExpandFromMini}
            title="Klik untuk membuka percakapan lengkap"
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--ln)] bg-[var(--acc3)] rounded-t-[11px] text-[#111111]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold truncate">
                  {activeTerm || 'Asisten AI'}
                </span>
              </div>
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="pbtn sm w-6 h-6 !p-0"
                  onClick={onExpandFromMini}
                  aria-label="Buka di jendela chat"
                  title="Buka di chat"
                >
                  <Maximize2 className="w-3 h-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pbtn sm w-6 h-6 !p-0"
                  onClick={onCloseMini}
                  aria-label="Tutup penjelasan singkat"
                  title="Tutup"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              ref={miniScrollRef}
              className="p-3 text-sm overflow-y-auto leading-relaxed"
            >
              {busy && !miniMessage ? (
                <div className="flex items-center gap-2 opacity-80">
                  <Loader2
                    className="w-4 h-4 animate-spin shrink-0"
                    aria-hidden="true"
                  />
                  <span>Menjelaskan istilah…</span>
                </div>
              ) : miniMessage ? (
                miniMessage.role === 'assistant' ? (
                  <div>{renderAssistantReply(miniMessage)}</div>
                ) : (
                  <div className="text-rose-700 font-medium">
                    {miniMessage.text}
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 opacity-80">
                  <Loader2
                    className="w-4 h-4 animate-spin shrink-0"
                    aria-hidden="true"
                  />
                  <span>Menyiapkan penjelasan…</span>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Asisten AI Presentasi"
            className="ai-bubble"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ai-bh">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-sm">Asisten AI</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className="pbtn sm w-7 h-7 !p-0"
                  onClick={onOpenPrefs}
                  aria-label="Pengaturan Asisten AI"
                  title="Pengaturan AI"
                >
                  <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pbtn sm w-7 h-7 !p-0"
                  onClick={onClear}
                  aria-label="Bersihkan percakapan"
                  title="Bersihkan percakapan"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pbtn sm w-7 h-7 !p-0"
                  onClick={onClose}
                  aria-label="Tutup asisten AI"
                  title="Tutup"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-auto p-3 flex flex-col gap-2.5"
            >
              {messages.length === 0 ? (
                <div className="ai-msg ai">
                  Klik istilah bertanda kuning{' '}
                  <code className="font-mono text-xs">[[istilah]]</code> di
                  slide untuk penjelasan instan. Kamu juga bisa bertanya
                  langsung di bawah.
                </div>
              ) : (
                messages.map((m) => {
                  if (m.role === 'assistant') {
                    return (
                      <div key={m.id} className="ai-msg ai">
                        {renderAssistantReply(m)}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={m.id}
                      className={`ai-msg ${m.role === 'user' ? 'user' : 'err'}`}
                    >
                      {m.text}
                    </div>
                  );
                })
              )}

              {busy && (
                <div className="ai-msg ai opacity-80">Sedang berpikir…</div>
              )}
            </div>

            {activeTerm && !busy && (
              <div className="px-3 pb-2">
                <button
                  type="button"
                  className="pbtn sm max-w-full truncate"
                  onClick={() =>
                    onSendQuestion(
                      `Jelaskan istilah atau poin ini: "${activeTerm}"`,
                      activeTerm
                    )
                  }
                >
                  <Sparkles
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    Jelaskan &ldquo;
                    {activeTerm.length > 30
                      ? `${activeTerm.slice(0, 30)}…`
                      : activeTerm}
                    &rdquo;
                  </span>
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 p-2.5 border-t border-[var(--ln)]"
            >
              <input
                type="text"
                className="pinput flex-1 text-sm"
                placeholder="Tanya lanjutan…"
                aria-label="Pertanyaan lanjutan untuk Asisten AI"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="pbtn sm on"
                disabled={busy || !input.trim()}
                aria-label="Kirim pertanyaan"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kirim</span>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
