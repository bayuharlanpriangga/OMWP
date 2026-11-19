'use client';

import React from 'react';
import {
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  PROVIDER_META,
  verifyKeyDirectClient,
  type AiProviderId,
  type ByokKeyEntry,
} from '@/lib/ai/ai-providers';
import { uid } from '@/lib/presentation/presentation-utils';
import { ProviderIcon } from './ProviderBadge';

interface ApiKeysModalProps {
  open: boolean;
  entries: ByokKeyEntry[];
  includeInExport: boolean;
  onToggleIncludeInExport: (next: boolean) => void;
  onChangeEntries: React.Dispatch<React.SetStateAction<ByokKeyEntry[]>>;
  onClose: () => void;
}

export function ApiKeysModal({
  open,
  entries,
  includeInExport,
  onToggleIncludeInExport,
  onChangeEntries,
  onClose,
}: ApiKeysModalProps) {
  const [visibleIds, setVisibleIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [guideOpen, setGuideOpen] = React.useState(false);
  const timersRef = React.useRef<Record<string, number>>({});
  const abortsRef = React.useRef<Record<string, AbortController>>({});

  React.useEffect(() => {
    const timers = timersRef.current;
    const aborts = abortsRef.current;
    return () => {
      Object.values(timers).forEach((t) => window.clearTimeout(t));
      Object.values(aborts).forEach((c) => c.abort());
    };
  }, []);

  if (!open) return null;

  const scheduleVerify = (id: string, rawKey: string) => {
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    if (abortsRef.current[id]) {
      abortsRef.current[id].abort();
      delete abortsRef.current[id];
    }

    const trimmed = rawKey.trim();
    if (!trimmed) {
      onChangeEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: 'idle', provider: undefined, error: undefined }
            : e
        )
      );
      return;
    }

    if (trimmed.length < 12) {
      onChangeEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: 'checking', provider: undefined, error: undefined }
            : e
        )
      );
      timersRef.current[id] = window.setTimeout(() => {
        onChangeEntries((prev) =>
          prev.map((e) =>
            e.id === id && e.key.trim() === trimmed
              ? {
                  ...e,
                  status: 'invalid',
                  provider: undefined,
                  error: 'API key terlalu pendek.',
                }
              : e
          )
        );
      }, 450);
      return;
    }

    onChangeEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: 'checking', provider: undefined, error: undefined }
          : e
      )
    );

    timersRef.current[id] = window.setTimeout(async () => {
      const controller = new AbortController();
      abortsRef.current[id] = controller;
      try {
        const res = await fetch('/api/ai/verify-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: trimmed }),
          signal: controller.signal,
        });
        const contentType = res.headers.get('content-type') || '';
        const data =
          res.status === 404 ||
          res.status === 405 ||
          !contentType.includes('application/json')
            ? await verifyKeyDirectClient(trimmed, controller.signal)
            : ((await res.json()) as {
                valid?: boolean;
                provider?: AiProviderId;
                error?: string;
              });

        onChangeEntries((prev) =>
          prev.map((e) => {
            if (e.id !== id || e.key.trim() !== trimmed) return e;
            if (data.valid && data.provider) {
              return {
                ...e,
                status: 'valid',
                provider: data.provider,
                error: undefined,
              };
            }
            return {
              ...e,
              status: 'invalid',
              provider: undefined,
              error: data.error || 'API key tidak valid atau tidak dikenali.',
            };
          })
        );
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        onChangeEntries((prev) =>
          prev.map((e) =>
            e.id === id && e.key.trim() !== trimmed
              ? e
              : e.id === id
                ? {
                    ...e,
                    status: 'invalid',
                    provider: undefined,
                    error: 'Gagal memeriksa API key.',
                  }
                : e
          )
        );
      } finally {
        if (abortsRef.current[id] === controller) {
          delete abortsRef.current[id];
        }
      }
    }, 450);
  };

  const handleAddRow = () => {
    onChangeEntries((prev) => [
      ...prev,
      { id: uid(), key: '', status: 'idle' },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    if (abortsRef.current[id]) {
      abortsRef.current[id].abort();
      delete abortsRef.current[id];
    }
    onChangeEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleReveal = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCloseMain = () => {
    setGuideOpen(false);
    onClose();
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseMain();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kelola API Key Multi-Provider"
          className="modal-card max-w-[520px]"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 shrink-0" aria-hidden="true" />
              <h2 className="text-xl font-bold m-0">API Key AI</h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className="pbtn sm w-7 h-7 !p-0"
                onClick={() => setGuideOpen(true)}
                aria-label="Panduan API Key"
                title="Panduan API Key"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pbtn sm w-7 h-7 !p-0"
                onClick={handleCloseMain}
                aria-label="Tutup kelola API key"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
            {entries.length === 0 ? (
              <div className="ec text-center text-sm opacity-80 py-6">
                Belum ada form API key. Klik <strong>+ Tambah API Key</strong>{' '}
                di bawah untuk menambahkan.
              </div>
            ) : (
              entries.map((entry, idx) => {
                const revealed = visibleIds.has(entry.id);
                const meta = entry.provider
                  ? PROVIDER_META[entry.provider]
                  : null;
                return (
                  <div key={entry.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type={revealed ? 'text' : 'password'}
                          autoComplete="off"
                          spellCheck={false}
                          className="pinput pr-20 font-mono text-xs"
                          aria-label={`API key ${idx + 1}`}
                          placeholder="Tempel API key..."
                          value={entry.key}
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            onChangeEntries((prev) =>
                              prev.map((item) =>
                                item.id === entry.id
                                  ? { ...item, key: nextVal }
                                  : item
                              )
                            );
                            scheduleVerify(entry.id, nextVal);
                          }}
                        />

                        <div className="absolute right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleReveal(entry.id)}
                            className="w-6 h-6 inline-flex items-center justify-center rounded opacity-65 hover:opacity-100"
                            aria-label={
                              revealed ? 'Sembunyikan API key' : 'Lihat API key'
                            }
                            title={revealed ? 'Sembunyikan' : 'Lihat'}
                          >
                            {revealed ? (
                              <EyeOff
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <Eye
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            )}
                          </button>

                          <span
                            className="w-6 h-6 inline-flex items-center justify-center shrink-0"
                            aria-live="polite"
                          >
                            {entry.status === 'checking' ? (
                              <Loader2
                                className="w-4 h-4 animate-spin text-[var(--acc)]"
                                aria-label="Mengecek API key"
                              />
                            ) : entry.status === 'valid' && entry.provider ? (
                              <ProviderIcon
                                provider={entry.provider}
                                size="sm"
                              />
                            ) : entry.status === 'invalid' ? (
                              <span
                                className="text-rose-600 inline-flex items-center"
                                title={entry.error || 'API key tidak valid'}
                              >
                                <AlertCircle
                                  className="w-4 h-4"
                                  aria-label="API key tidak valid"
                                />
                              </span>
                            ) : (
                              <KeyRound
                                className="w-3.5 h-3.5 opacity-30"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="pbtn sm w-8 h-8 !p-0 shrink-0"
                        onClick={() => handleRemoveRow(entry.id)}
                        aria-label={`Hapus API key ${idx + 1}`}
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    {entry.status === 'valid' && meta && (
                      <div className="text-[11px] font-semibold text-emerald-700 pl-1">
                        Terdeteksi aktif: {meta.name}
                      </div>
                    )}
                    {entry.status === 'invalid' && entry.error && (
                      <div className="text-[11px] font-medium text-rose-600 pl-1">
                        {entry.error}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium mt-4 pt-3 border-t border-current/15">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-[var(--acc)]"
              checked={includeInExport}
              onChange={(e) => onToggleIncludeInExport(e.target.checked)}
            />
            <span>
              Sertakan API key saat Export HTML (agar AI bisa langsung diuji di
              file HTML hasil export)
            </span>
          </label>

          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-current/15">
            <button type="button" className="pbtn sm" onClick={handleAddRow}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tambah API Key</span>
            </button>

            <button
              type="button"
              className="pbtn sm on"
              onClick={handleCloseMain}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {guideOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuideOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Panduan Penggunaan API Key"
            className="modal-card max-w-[440px]"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <h3 className="text-lg font-bold m-0">Panduan API Key</h3>
              </div>
              <button
                type="button"
                className="pbtn sm w-7 h-7 !p-0"
                onClick={() => setGuideOpen(false)}
                aria-label="Tutup panduan"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2.5 text-sm leading-relaxed opacity-90">
              <p className="m-0">
                Tempel API key dari berbagai provider seperti{' '}
                <strong>Gemini</strong>, <strong>OpenAI</strong>,{' '}
                <strong>Claude</strong>, <strong>Groq</strong>,{' '}
                <strong>OpenRouter</strong>, <strong>DeepSeek</strong>,{' '}
                <strong>xAI</strong>, atau <strong>Mistral</strong>.
              </p>
              <p className="m-0">
                Setiap key yang dimasukkan akan diperiksa secara otomatis dan
                dikelompokkan berdasarkan jenis providernya di ringkasan{' '}
                <strong>Pengaturan AI</strong>. Anda dapat memasukkan lebih dari
                satu key per provider sebagai cadangan otomatis.
              </p>
              <p className="m-0 text-xs opacity-80">
                Secara bawaan, API key hanya disimpan lokal di browser Anda
                (<code className="font-mono">localStorage</code>). Aktifkan
                opsi <strong>Sertakan API key saat Export HTML</strong> hanya
                jika Anda ingin menguji fitur AI langsung pada file HTML hasil
                export.
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="pbtn sm on"
                onClick={() => setGuideOpen(false)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
