'use client';

import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  Bold,
  Copy,
  Download,
  Eye,
  FileJson,
  FolderOpen,
  ImagePlus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BLOCK_NAMES,
  createBlock,
  getSlideTitle,
} from '@/lib/deck-logic';
import type {
  Block,
  Deck,
  Slide,
  TextAlign,
} from '@/lib/deck-types';
import { MarkupText } from './MarkupText';

interface SlideEditorProps {
  deck: Deck;
  slideIndex: number;
  onSelectSlide: (idx: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onMoveSlide: (delta: -1 | 1) => void;
  onDeckTitleChange: (title: string) => void;
  onSlideNameChange: (name: string) => void;
  onUpdateBlock: (blockId: string, updater: (b: Block) => Block) => void;
  onAddBlock: (block: Block, targetOwnerId?: string) => void;
  onDeleteBlock: (blockId: string, hasChildren: boolean) => void;
  onExportHtml: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetDeck: () => void;
  onToast: (message: string) => void;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const result = reader.result as string;
      if (/svg|gif/i.test(file.type)) {
        if (file.size > 1_500_000) {
          reject(new Error('File SVG/GIF terlalu besar (maks 1,5 MB).'));
          return;
        }
        resolve(result);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung browser ini.'));
      img.onload = () => {
        const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        const keepAlpha = /png|webp/i.test(file.type);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        if (!keepAlpha) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(
          keepAlpha
            ? canvas.toDataURL('image/webp', 0.9)
            : canvas.toDataURL('image/jpeg', 0.85)
        );
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

function RichMarkupTextarea({
  blockId,
  value,
  placeholder,
  align,
  isBold,
  sizeClass,
  onChange,
  onToggleBold,
  onChangeAlign,
  onChangeSize,
  allowWholeBlockStyle,
}: {
  blockId: string;
  value: string;
  placeholder: string;
  align?: TextAlign;
  isBold?: boolean;
  sizeClass?: string;
  onChange: (val: string) => void;
  onToggleBold?: () => void;
  onChangeAlign?: (a: TextAlign) => void;
  onChangeSize?: (s: 's' | 'm' | 'l' | 'xl') => void;
  allowWholeBlockStyle: boolean;
}) {
  const [showTools, setShowTools] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string, fallbackText: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + before + fallbackText + after);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || fallbackText;
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    window.requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(start + before.length, cursor);
    });
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={`pbtn sm ${showTools ? 'on' : ''}`}
            onClick={() => setShowTools((v) => !v)}
          >
            Format teks
          </button>
          <button
            type="button"
            className="pbtn sm"
            onClick={() => wrapSelection('[[', ']]', 'istilah')}
            title="Tandai istilah agar bisa dijelaskan Asisten AI"
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>[[Istilah AI]]</span>
          </button>
          <button
            type="button"
            className="pbtn sm"
            onClick={() => wrapSelection('[[[', ']]]', 'Judul Modal')}
            title="Tandai teks untuk membuka popup modal"
          >
            <span>[[[Modal]]]</span>
          </button>
        </div>

        <button
          type="button"
          className={`pbtn sm ${showPreview ? 'on' : ''}`}
          onClick={() => setShowPreview((v) => !v)}
          aria-pressed={showPreview}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Pratinjau</span>
        </button>
      </div>

      {showTools && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-current/20 bg-black/5">
          <button
            type="button"
            className={`pbtn sm ${allowWholeBlockStyle && isBold ? 'on' : ''}`}
            onClick={() => {
              const el = textareaRef.current;
              const hasSel = el && el.selectionStart !== el.selectionEnd;
              if (hasSel) wrapSelection('**', '**', 'teks');
              else if (allowWholeBlockStyle && onToggleBold) onToggleBold();
              else wrapSelection('**', '**', 'teks tebal');
            }}
            aria-label="Tebal"
          >
            <Bold className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {(['s', 'm', 'l', 'xl'] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              className={`pbtn sm ${
                allowWholeBlockStyle && sizeClass === sz ? 'on' : ''
              }`}
              onClick={() => {
                const el = textareaRef.current;
                const hasSel = el && el.selectionStart !== el.selectionEnd;
                if (hasSel) wrapSelection(`{${sz}}`, `{/${sz}}`, 'teks');
                else if (allowWholeBlockStyle && onChangeSize) onChangeSize(sz);
                else wrapSelection(`{${sz}}`, `{/${sz}}`, 'teks');
              }}
            >
              {sz.toUpperCase()}
            </button>
          ))}

          {onChangeAlign && (
            <>
              <button
                type="button"
                className={`pbtn sm ${align === 'l' ? 'on' : ''}`}
                onClick={() => onChangeAlign('l')}
                aria-label="Rata kiri"
              >
                <AlignLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`pbtn sm ${align === 'c' ? 'on' : ''}`}
                onClick={() => onChangeAlign('c')}
                aria-label="Rata tengah"
              >
                <AlignCenter className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`pbtn sm ${align === 'r' ? 'on' : ''}`}
                onClick={() => onChangeAlign('r')}
                aria-label="Rata kanan"
              >
                <AlignRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}

      <textarea
        ref={textareaRef}
        id={`rte-${blockId}`}
        rows={3}
        className="ptarea leading-relaxed"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {showPreview && (
        <div className="p-3 rounded-lg border border-current/20 bg-[var(--card)] text-sm">
          <div className="text-xs font-mono opacity-60 mb-1">Pratinjau:</div>
          {value ? (
            <MarkupText text={value} live={false} />
          ) : (
            <span className="italic opacity-55">(kosong)</span>
          )}
        </div>
      )}
    </div>
  );
}

export function SlideEditor({
  deck,
  slideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onDeckTitleChange,
  onSlideNameChange,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onExportHtml,
  onExportJson,
  onImportJson,
  onResetDeck,
  onToast,
}: SlideEditorProps) {
  const slide: Slide = deck.slides[slideIndex];
  const jsonInputRef = React.useRef<HTMLInputElement>(null);
  const imgInputRef = React.useRef<HTMLInputElement>(null);
  const pendingImgTargetRef = React.useRef<{
    kind: 'add' | 'replace';
    id?: string;
  } | null>(null);

  const pickImage = (target: { kind: 'add' | 'replace'; id?: string }) => {
    pendingImgTargetRef.current = target;
    if (imgInputRef.current) {
      imgInputRef.current.value = '';
      imgInputRef.current.click();
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pendingImgTargetRef.current;
    if (!file || !target) return;
    try {
      const dataUrl = await compressImageFile(file);
      if (target.kind === 'add') {
        const block = createBlock('img');
        if (block.t === 'img') block.src = dataUrl;
        onAddBlock(block, target.id);
      } else if (target.id) {
        onUpdateBlock(target.id, (b) =>
          b.t === 'img' ? { ...b, src: dataUrl } : b
        );
      }
    } catch (err) {
      onToast(
        err instanceof Error
          ? err.message
          : 'Gambar gagal dibaca oleh browser.'
      );
    }
  };

  const renderAddButtons = (
    ownerId: string | undefined,
    types: Array<Block['t']>,
    extraClass = 'mt-3'
  ) => (
    <div className={`flex flex-wrap gap-2 ${extraClass}`}>
      {types.map((t) => (
        <button
          key={t}
          type="button"
          className="pbtn sm"
          onClick={() => {
            if (t === 'img') {
              pickImage({ kind: 'add', id: ownerId });
            } else {
              onAddBlock(createBlock(t), ownerId);
            }
          }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{BLOCK_NAMES[t]}</span>
        </button>
      ))}
    </div>
  );

  const renderBlockList = (list: Block[]): React.ReactNode => {
    let ddCount = 0;
    return list.map((item) =>
      renderBlockEditor(item, item.t === 'dd' ? ++ddCount : 0)
    );
  };

  const renderBlockEditor = (b: Block, ddNumber = 1): React.ReactNode => {
    return (
      <div key={b.id} className="ec space-y-2">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-sm">{BLOCK_NAMES[b.t]}</strong>
          <button
            type="button"
            className="pbtn sm"
            onClick={() =>
              onDeleteBlock(
                b.id,
                b.t === 'box' && b.children.length > 0
              )
            }
            aria-label={`Hapus blok ${BLOCK_NAMES[b.t]}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hapus</span>
          </button>
        </div>

        {b.t === 'text' && (
          <RichMarkupTextarea
            blockId={b.id}
            value={b.text}
            placeholder="Tulis teks… [[istilah]] = jelaskan via AI, [[[istilah]]] = popup modal"
            align={b.align}
            isBold={b.b}
            sizeClass={b.size}
            allowWholeBlockStyle={true}
            onChange={(val) =>
              onUpdateBlock(b.id, (prev) =>
                prev.t === 'text' ? { ...prev, text: val } : prev
              )
            }
            onToggleBold={() =>
              onUpdateBlock(b.id, (prev) =>
                prev.t === 'text' ? { ...prev, b: !prev.b } : prev
              )
            }
            onChangeAlign={(al) =>
              onUpdateBlock(b.id, (prev) =>
                prev.t === 'text' ? { ...prev, align: al } : prev
              )
            }
            onChangeSize={(sz) =>
              onUpdateBlock(b.id, (prev) =>
                prev.t === 'text' ? { ...prev, size: sz } : prev
              )
            }
          />
        )}

        {b.t === 'dd' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="pinput !w-20 sm:!w-24 shrink-0 text-center font-bold"
                placeholder={String(ddNumber)}
                aria-label="Format poin dropdown"
                title="Format poin / huruf / simbol (kosong = nomor urut otomatis)"
                value={b.badge ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateBlock(b.id, (prev) =>
                    prev.t === 'dd' ? { ...prev, badge: val } : prev
                  );
                }}
              />
              <input
                type="text"
                className="pinput flex-1 min-w-0 font-semibold"
                placeholder="Judul poin"
                aria-label="Judul poin dropdown"
                value={b.text}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateBlock(b.id, (prev) =>
                    prev.t === 'dd' ? { ...prev, text: val } : prev
                  );
                }}
              />
            </div>
            <RichMarkupTextarea
              blockId={b.id}
              value={b.detail}
              placeholder="Penjelasan… [[istilah]] = jelaskan via AI, [[[istilah]]] = popup"
              align={b.align || 'l'}
              allowWholeBlockStyle={false}
              onChange={(val) =>
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'dd' ? { ...prev, detail: val } : prev
                )
              }
              onChangeAlign={(al) =>
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'dd' ? { ...prev, align: al } : prev
                )
              }
            />
          </div>
        )}

        {b.t === 'img' && (
          <div className="space-y-2">
            {b.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.src}
                alt={b.alt || 'Pratinjau'}
                className="max-h-44 w-auto max-w-full rounded-md border border-current/20"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="pbtn sm"
                onClick={() => pickImage({ kind: 'replace', id: b.id })}
              >
                <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{b.src ? 'Ganti gambar' : 'Pilih gambar'}</span>
              </button>
            </div>
            <input
              type="text"
              className="pinput text-sm"
              placeholder="Deskripsi gambar (opsional)"
              aria-label="Deskripsi alt gambar"
              value={b.alt}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'img' ? { ...prev, alt: val } : prev
                );
              }}
            />
          </div>
        )}

        {b.t === 'box' && (
          <div className="space-y-3">
            <input
              type="text"
              className="pinput font-semibold"
              placeholder="Judul container (opsional)"
              aria-label="Judul container"
              value={b.title}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'box' ? { ...prev, title: val } : prev
                );
              }}
            />
            <div className="space-y-3 pl-2">
              {renderBlockList(b.children)}
            </div>
            {renderAddButtons(b.id, ['text', 'img', 'dd', 'concl'])}
          </div>
        )}

        {b.t === 'concl' && (
          <div className="space-y-2">
            <input
              type="text"
              className="pinput font-semibold"
              placeholder="Teks tombol kesimpulan"
              aria-label="Teks tombol kesimpulan"
              value={b.label}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'concl' ? { ...prev, label: val } : prev
                );
              }}
            />
            <RichMarkupTextarea
              blockId={b.id}
              value={b.text}
              placeholder="Isi kesimpulan"
              align={b.align || 'l'}
              allowWholeBlockStyle={false}
              onChange={(val) =>
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'concl' ? { ...prev, text: val } : prev
                )
              }
              onChangeAlign={(al) =>
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'concl' ? { ...prev, align: al } : prev
                )
              }
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportJson(f);
          e.target.value = '';
        }}
      />

      {/* Slide switcher strip */}
      <div className="flex flex-wrap items-center gap-2">
        {deck.slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            className={`pbtn sm min-w-[40px] ${idx === slideIndex ? 'on' : ''}`}
            onClick={() => onSelectSlide(idx)}
            title={getSlideTitle(s)}
            aria-label={`Pilih slide ${idx + 1}: ${getSlideTitle(s)}`}
          >
            {idx + 1}
          </button>
        ))}
        <button type="button" className="pbtn sm" onClick={onAddSlide}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Slide</span>
        </button>
      </div>

      {/* Slide actions above presentation title & slide name */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="pbtn sm w-[34px] h-[34px] !p-0"
          disabled={slideIndex <= 0}
          onClick={() => onMoveSlide(-1)}
          aria-label="Geser slide sebelumnya"
          title="Geser slide sebelumnya"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pbtn sm w-[34px] h-[34px] !p-0"
          disabled={slideIndex >= deck.slides.length - 1}
          onClick={() => onMoveSlide(1)}
          aria-label="Geser slide berikutnya"
          title="Geser slide berikutnya"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pbtn sm h-[34px]"
          onClick={onDuplicateSlide}
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Duplikat</span>
        </button>
        <button
          type="button"
          className="pbtn sm h-[34px]"
          onClick={onDeleteSlide}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Hapus slide</span>
        </button>
      </div>

      {/* Metadata fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="deck-title-input"
            className="block text-sm font-bold mb-1"
          >
            Judul presentasi
          </label>
          <input
            id="deck-title-input"
            type="text"
            className="pinput"
            placeholder="Judul presentasi"
            value={deck.title}
            onChange={(e) => onDeckTitleChange(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="slide-name-input"
            className="block text-sm font-bold mb-1"
          >
            Nama slide (untuk daftar & konteks AI)
          </label>
          <input
            id="slide-name-input"
            type="text"
            className="pinput"
            placeholder="Nama slide"
            value={slide.name}
            onChange={(e) => onSlideNameChange(e.target.value)}
          />
        </div>
      </div>

      {/* Add component buttons directly below presentation title & slide name */}
      {renderAddButtons(undefined, ['text', 'img', 'dd', 'box', 'concl'], 'mt-0')}

      {/* Blocks */}
      <div className="pt-2">
        <h2 className="text-xl font-bold mb-3">Isi slide</h2>
        <div className="space-y-3">
          {renderBlockList(slide.blocks)}
        </div>
        {slide.blocks.length === 0 && (
          <p className="text-sm opacity-70 mt-2">
            Slide ini masih kosong. Tambahkan komponen di atas.
          </p>
        )}
      </div>

      {/* Auto-detected Modals section */}
      {(slide.modals || []).length > 0 && (
        <div className="pt-4 border-t border-current/15 space-y-3">
          <div>
            <h2 className="text-xl font-bold m-0">Modal</h2>
            <p className="text-xs opacity-75 mt-1">
              Terdeteksi otomatis dari tanda{' '}
              <code className="font-mono">[[[ ]]]</code> di slide. Isi di bawah
              tampil sebagai popup saat teksnya diklik.
            </p>
          </div>
          <div className="space-y-4">
            {(slide.modals || []).map((m) => (
              <div key={m.id} className="card box space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider opacity-65">
                  Modal
                </div>
                <div className="bt">
                  {m.title || (
                    <span className="italic opacity-55">(tanpa judul)</span>
                  )}
                </div>
                <div className="space-y-3">
                  {renderBlockList(m.children)}
                </div>
                {m.children.length === 0 && (
                  <p className="text-xs opacity-70 m-0">
                    Modal masih kosong. Tambahkan komponen di bawah.
                  </p>
                )}
                {renderAddButtons(m.id, ['text', 'img', 'dd', 'concl'])}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips & Export / Import */}
      <div className="pt-4 border-t border-current/15 space-y-3">
        <p className="text-xs opacity-75 m-0">
          Urutan, ukuran, dan perataan bebas diatur di mode{' '}
          <strong>Layout</strong>. Tanda <code className="font-mono">[[ ]]</code>{' '}
          (penjelasan AI) dan <code className="font-mono">[[[ ]]]</code> (popup
          modal) hanya terlihat di sini; saat ditampilkan istilahnya menjadi
          tombol interaktif.
        </p>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="pbtn" onClick={onExportHtml}>
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export HTML final</span>
          </button>
          <button type="button" className="pbtn" onClick={onExportJson}>
            <FileJson className="w-4 h-4" aria-hidden="true" />
            <span>Simpan JSON</span>
          </button>
          <button
            type="button"
            className="pbtn"
            onClick={() => jsonInputRef.current?.click()}
          >
            <FolderOpen className="w-4 h-4" aria-hidden="true" />
            <span>Buka JSON</span>
          </button>
          <button type="button" className="pbtn" onClick={onResetDeck}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Kosongkan</span>
          </button>
        </div>

        <p className="text-xs opacity-70 m-0">
          Export HTML menghasilkan satu file presentasi mandiri tanpa editor,
          siap dibuka offline atau dipublish ke GitHub Pages.
        </p>
      </div>
    </section>
  );
}
