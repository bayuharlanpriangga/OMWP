'use client';

import React from 'react';
import {
  buildSlideAiContext,
  stripMarkup,
  uid,
} from '@/lib/logic/logic-presentation-app';
import type {
  ChatMessage,
  Deck,
  PresenterPrefs,
  Slide,
} from '@/lib/deck-types';
import {
  explainWithByokClient,
  orderByokKeysForRequest,
  type ByokKeyEntry,
} from '@/lib/ai-providers';

export function useOriasAi({
  deck,
  currentSlide,
  prefs,
  byokKeys,
}: {
  deck: Deck;
  currentSlide: Slide;
  prefs: PresenterPrefs;
  byokKeys: ByokKeyEntry[];
}) {
  const [aiOpen, setAiOpen] = React.useState(false);
  const [miniAiOpen, setMiniAiOpen] = React.useState(false);
  const [prefsModalOpen, setPrefsModalOpen] = React.useState(false);
  const [apiKeysModalOpen, setApiKeysModalOpen] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [activeTerm, setActiveTerm] = React.useState<string | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const aiCacheRef = React.useRef<Map<string, string>>(new Map());

  const sendAiQuestion = React.useCallback(
    async (question: string, cacheTerm?: string) => {
      const slideContext = buildSlideAiContext(deck, currentSlide, cacheTerm);
      const cacheKey = `${currentSlide.id}|${slideContext.slideText.slice(0, 140)}|${cacheTerm || ''}`;
      const userMsg: ChatMessage = { id: uid(), role: 'user', text: question };

      if (cacheTerm && aiCacheRef.current.has(cacheKey)) {
        const cachedReply = aiCacheRef.current.get(cacheKey)!;
        setChatMessages((prev) => [
          ...prev,
          userMsg,
          { id: uid(), role: 'assistant', text: cachedReply, animate: true },
        ]);
        return;
      }

      const historySnapshot = [
        ...chatMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.text,
          })),
        { role: 'user' as const, content: question },
      ];

      setChatMessages((prev) => [...prev, userMsg]);
      setAiBusy(true);

      const activeByokKeys = orderByokKeysForRequest(
        byokKeys,
        prefs.preferredProvider,
        prefs.preferredModels
      );

      try {
        const res = await fetch('/api/ai/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historySnapshot,
            slideContext,
            byokKeys: activeByokKeys,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        let replyText = '';
        if (
          res.status === 404 ||
          res.status === 405 ||
          !contentType.includes('application/json')
        ) {
          if (activeByokKeys.length === 0) {
            throw new Error(
              'Pada mode statis (GitHub Pages), tambahkan API key di Provider AI (ikon kunci) untuk memakai Orias AI.'
            );
          }
          const sys = [
            `Kamu adalah Orias AI, asisten cerdas dalam presentasi "${slideContext.deckTitle}" (Slide ${slideContext.slideNumber || 1} dari ${slideContext.totalSlides || 1}).`,
            slideContext.deckOverview
              ? `Alur presentasi:\n${slideContext.deckOverview}`
              : '',
            slideContext.slideContentOutline
              ? `Materi lengkap slide aktif:\n${slideContext.slideContentOutline}`
              : slideContext.slideText,
            slideContext.surroundingContext
              ? `Konteks spesifik:\n${slideContext.surroundingContext}`
              : '',
            'Pahami topik yang sedang dibahas secara menyeluruh. Jika istilah singkat atau implisit, tafsirkan sesuai konteks di atas. Jawab dalam bahasa Indonesia yang jelas (~100-150 kata).',
          ]
            .filter(Boolean)
            .join('\n\n');
          replyText = await explainWithByokClient(
            activeByokKeys,
            sys,
            historySnapshot
          );
        } else {
          const data = (await res.json()) as { reply?: string; error?: string };
          if (!res.ok || !data.reply) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }
          replyText = data.reply;
        }
        if (cacheTerm) {
          aiCacheRef.current.set(cacheKey, replyText);
        }
        setChatMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant', text: replyText, animate: true },
        ]);
      } catch (err) {
        const errText =
          err instanceof Error ? err.message : 'Gagal menghubungi Orias AI.';
        setChatMessages((prev) => [
          ...prev,
          { id: uid(), role: 'error', text: errText },
        ]);
      } finally {
        setAiBusy(false);
      }
    },
    [
      deck,
      currentSlide,
      prefs.preferredProvider,
      prefs.preferredModels,
      byokKeys,
      chatMessages,
    ]
  );

  const askTerm = React.useCallback(
    (rawTerm: string) => {
      const clean = stripMarkup(rawTerm).trim();
      if (!clean) return;
      setActiveTerm(clean);
      if (aiBusy) return;

      if (!aiOpen) {
        setMiniAiOpen(true);
      }
      void sendAiQuestion(`Jelaskan istilah atau poin ini: "${clean}"`, clean);
    },
    [aiBusy, aiOpen, sendAiQuestion]
  );

  const closeTopOverlay = React.useCallback((): boolean => {
    if (apiKeysModalOpen) {
      setApiKeysModalOpen(false);
      return true;
    }
    if (prefsModalOpen) {
      setPrefsModalOpen(false);
      return true;
    }
    if (aiOpen) {
      setAiOpen(false);
      return true;
    }
    if (miniAiOpen) {
      setMiniAiOpen(false);
      return true;
    }
    return false;
  }, [apiKeysModalOpen, prefsModalOpen, aiOpen, miniAiOpen]);

  return {
    aiOpen,
    setAiOpen,
    miniAiOpen,
    setMiniAiOpen,
    prefsModalOpen,
    setPrefsModalOpen,
    apiKeysModalOpen,
    setApiKeysModalOpen,
    aiBusy,
    activeTerm,
    chatMessages,
    clearMessages: () => setChatMessages([]),
    sendAiQuestion,
    askTerm,
    closeTopOverlay,
    hasBlockingModal: prefsModalOpen || apiKeysModalOpen,
  };
}
