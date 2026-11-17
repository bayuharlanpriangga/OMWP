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
  FileCode2,
  FileJson,
  FolderOpen,
  ImagePlus,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  BLOCK_NAMES,
  clamp,
  computeTableColumnWidths,
  createBlock,
  getSlideTitle,
} from '@/lib/deck-logic';
import type {
  Block,
  Deck,
  Slide,
  TableBlock,
  TextAlign,
} from '@/lib/deck-types';
import { MarkupText } from './MarkupText';
import { TableBlockView } from './TableBlockView';

interface SlideEditorProps {
  deck: Deck;
  slideIndex: number;
  onSelectSlide: (idx: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onMoveSlide: (delta: -1 | 1) => void;
  onDeckTitleChange: (title: string) => void;
  onUpdateBlock: (blockId: string, updater: (b: Block) => Block) => void;
  onAddBlock: (block: Block, targetOwnerId?: string) => void;
  onDeleteBlock: (blockId: string, hasChildren: boolean) => void;
  onExportHtml: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onImportHtml: (htmlText: string) => boolean;
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

function TableBlockEditor({
  block,
  onUpdate,
}: {
  block: TableBlock;
  onUpdate: (updater: (prev: TableBlock) => TableBlock) => void;
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const headers = block.headers.length > 0 ? block.headers : ['Kolom 1'];
  const rows = block.rows.length > 0 ? block.rows : [headers.map(() => '')];
  const layout = computeTableColumnWidths(headers, rows, block.w);

  const setColumnCount = (targetCount: number) => {
    const nextCols = clamp(Math.round(targetCount) || 1, 1, 12);
    onUpdate((prev) => {
      const curCols = prev.headers.length;
      if (nextCols === curCols) return prev;
      const nextHeaders = Array.from({ length: nextCols }, (_, i) =>
        i < curCols ? prev.headers[i] : `Header ${i + 1}`
      );
      const nextRows = prev.rows.map((r) =>
        Array.from({ length: nextCols }, (_, i) => r[i] ?? '')
      );
      return { ...prev, headers: nextHeaders, rows: nextRows };
    });
  };

  const setRowCount = (targetCount: number) => {
    const nextCount = clamp(Math.round(targetCount) || 1, 1, 50);
    onUpdate((prev) => {
      const colCount = Math.max(1, prev.headers.length);
      if (nextCount === prev.rows.length) return prev;
      const nextRows = Array.from({ length: nextCount }, (_, rIdx) => {
        const existing = prev.rows[rIdx];
        return existing
          ? Array.from({ length: colCount }, (_, cIdx) => existing[cIdx] ?? '')
          : Array.from({ length: colCount }, () => '');
      });
      return { ...prev, rows: nextRows };
    });
  };

  const removeColumn = (colIdx: number) => {
    onUpdate((prev) => {
      if (prev.headers.length <= 1) return prev;
      return {
        ...prev,
        headers: prev.headers.filter((_, i) => i !== colIdx),
        rows: prev.rows.map((r) => r.filter((_, i) => i !== colIdx)),
      };
    });
  };

  const removeRow = (rowIdx: number) => {
    onUpdate((prev) => {
      if (prev.rows.length <= 1) return prev;
      return {
        ...prev,
        rows: prev.rows.filter((_, i) => i !== rowIdx),
      };
    });
  };

  return (
    <div className="mt-2 space-y-3">
      {/* Dimension controls & adaptive sizing readout */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">Header:</span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={headers.length <= 1}
              onClick={() => setColumnCount(headers.length - 1)}
              aria-label="Kurangi jumlah header tabel"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={12}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label="Jumlah header tabel"
              value={headers.length}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) setColumnCount(parsed);
              }}
            />
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={headers.length >= 12}
              onClick={() => setColumnCount(headers.length + 1)}
              aria-label="Tambah header tabel"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kolom</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">Baris:</span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={rows.length <= 1}
              onClick={() => setRowCount(rows.length - 1)}
              aria-label="Kurangi jumlah baris tabel"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={50}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label="Jumlah baris tabel"
              value={rows.length}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) setRowCount(parsed);
              }}
            />
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={rows.length >= 50}
              onClick={() => setRowCount(rows.length + 1)}
              aria-label="Tambah baris tabel"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Baris</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-mono opacity-75"
            data-testid="table-sizing-status"
          >
            {layout.mode === 'symmetric'
              ? `Simetris (${layout.widths.map((w) => `${Math.round(w)}%`).join(' : ')})`
              : `Fit teks (${layout.widths.map((w) => `${Math.round(w)}%`).join(' : ')})`}
          </span>
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
      </div>

      {/* Editable Grid */}
      <div className="overflow-x-auto pb-1">
        <table className="w-full border-collapse min-w-[420px]">
          <colgroup>
            {headers.map((_, colIdx) => {
              const rawPct = layout.widths[colIdx] ?? 100 / headers.length;
              // Keep editor inputs usable while giving long columns clearly wider space
              const edPct =
                headers.length <= 4 ? Math.max(16, rawPct) : rawPct;
              return <col key={colIdx} style={{ width: `${edPct}%` }} />;
            })}
            {rows.length > 1 && <col style={{ width: '38px' }} />}
          </colgroup>
          <thead>
            <tr>
              {headers.map((headerText, colIdx) => (
                <th key={colIdx} className="p-1 align-bottom text-left font-normal">
                  <div className="flex items-center justify-between gap-1 mb-1 px-0.5">
                    <span className="text-[11px] font-mono opacity-70">
                      Header {colIdx + 1} · {Math.round(layout.widths[colIdx] ?? 0)}%
                    </span>
                    {headers.length > 1 && (
                      <button
                        type="button"
                        className="pbtn sm !p-0 !w-6 !h-6"
                        onClick={() => removeColumn(colIdx)}
                        aria-label={`Hapus kolom ${colIdx + 1}`}
                        title={`Hapus kolom ${colIdx + 1}`}
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="pinput !py-1.5 !px-2 text-sm font-semibold min-w-[96px]"
                    placeholder={`Header ${colIdx + 1}`}
                    aria-label={`Header kolom ${colIdx + 1}`}
                    value={headerText}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdate((prev) => ({
                        ...prev,
                        headers: prev.headers.map((h, i) =>
                          i === colIdx ? val : h
                        ),
                      }));
                    }}
                  />
                </th>
              ))}
              {rows.length > 1 && <th className="w-9 p-1" aria-label="Aksi baris" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((_, colIdx) => (
                  <td key={colIdx} className="p-1 align-top">
                    <textarea
                      rows={3}
                      className="ptarea !py-1.5 !px-2 text-sm leading-snug min-w-[96px]"
                      placeholder={`Isi baris ${rowIdx + 1}`}
                      aria-label={`Baris ${rowIdx + 1} Kolom ${colIdx + 1}`}
                      value={row[colIdx] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdate((prev) => ({
                          ...prev,
                          rows: prev.rows.map((r, rI) =>
                            rI === rowIdx
                              ? prev.headers.map((__, cI) =>
                                  cI === colIdx ? val : r[cI] ?? ''
                                )
                              : r
                          ),
                        }));
                      }}
                    />
                  </td>
                ))}
                {rows.length > 1 && (
                  <td className="p-1 align-middle text-center">
                    <button
                      type="button"
                      className="pbtn sm !p-0 !w-7 !h-7"
                      onClick={() => removeRow(rowIdx)}
                      aria-label={`Hapus baris ${rowIdx + 1}`}
                      title={`Hapus baris ${rowIdx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] opacity-70 m-0">
        Lebar kolom seimbang otomatis bila semua isi ringkas, dan menyesuaikan
        teks terpanjang jika ada kolom yang berisi keterangan panjang. Mendukung{' '}
        <code className="font-mono">**tebal**</code>,{' '}
        <code className="font-mono">[[istilah]]</code>, dan{' '}
        <code className="font-mono">[[[modal]]]</code>.
      </p>

      {showPreview && (
        <div className="p-3 rounded-lg border border-current/20 bg-[var(--bg)]">
          <div className="text-xs font-mono opacity-60 mb-2">Pratinjau tabel:</div>
          <TableBlockView
            block={block}
            live={false}
            onTermClick={() => {}}
          />
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
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onExportHtml,
  onExportJson,
  onImportJson,
  onImportHtml,
  onResetDeck,
  onToast,
}: SlideEditorProps) {
  const slide: Slide = deck.slides[slideIndex];
  const jsonInputRef = React.useRef<HTMLInputElement>(null);
  const htmlInputRef = React.useRef<HTMLInputElement>(null);
  const imgInputRef = React.useRef<HTMLInputElement>(null);
  const [showHtmlImport, setShowHtmlImport] = React.useState(false);
  const [pastedHtml, setPastedHtml] = React.useState('');
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
            {renderAddButtons(b.id, ['text', 'img', 'dd', 'table', 'concl'])}
          </div>
        )}

        {b.t === 'table' && (
          <TableBlockEditor
            block={b}
            onUpdate={(updater) =>
              onUpdateBlock(b.id, (prev) =>
                prev.t === 'table' ? updater(prev) : prev
              )
            }
          />
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
      <input
        ref={htmlInputRef}
        type="file"
        accept=".html,.htm,text/html"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const text = await f.text();
            if (onImportHtml(text)) {
              setShowHtmlImport(false);
              setPastedHtml('');
            }
          }
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

      {/* Deck title */}
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

      {/* Add component buttons directly below presentation title */}
      {renderAddButtons(undefined, ['text', 'img', 'dd', 'box', 'table', 'concl'], 'mt-0')}

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
                {renderAddButtons(m.id, ['text', 'img', 'dd', 'table', 'concl'])}
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
          <button
            type="button"
            className={`pbtn ${showHtmlImport ? 'on' : ''}`}
            aria-expanded={showHtmlImport}
            onClick={() => setShowHtmlImport((v) => !v)}
          >
            <FileCode2 className="w-4 h-4" aria-hidden="true" />
            <span>Import HTML</span>
          </button>
          <button type="button" className="pbtn" onClick={onResetDeck}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Kosongkan</span>
          </button>
        </div>

        {showHtmlImport && (
          <div className="ec space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">Impor Presentasi dari HTML</strong>
              <button
                type="button"
                className="pbtn sm"
                onClick={() => htmlInputRef.current?.click()}
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pilih file .html</span>
              </button>
            </div>
            <p className="text-xs opacity-75 m-0">
              Mendukung file HTML hasil ekspor aplikasi ini maupun file HTML presentasi umum (elemen{' '}
              <code className="font-mono">&lt;section&gt;</code>,{' '}
              <code className="font-mono">.slide</code>, heading, kartu, daftar, dan{' '}
              <code className="font-mono">&lt;details&gt;</code>) agar langsung bisa diedit per blok.
            </p>
            <textarea
              rows={5}
              className="ptarea font-mono text-xs leading-relaxed"
              placeholder="Atau tempel kode HTML slide presentasi di sini…"
              aria-label="Tempel kode HTML presentasi"
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="pbtn sm"
                onClick={() => {
                  setShowHtmlImport(false);
                  setPastedHtml('');
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="pbtn sm on"
                disabled={!pastedHtml.trim()}
                onClick={() => {
                  if (onImportHtml(pastedHtml)) {
                    setShowHtmlImport(false);
                    setPastedHtml('');
                  }
                }}
              >
                Impor HTML ke editor
              </button>
            </div>
          </div>
        )}

        <p className="text-xs opacity-70 m-0">
          Export HTML menghasilkan satu file presentasi mandiri tanpa editor,
          siap dibuka offline atau dipublish ke GitHub Pages.
        </p>
      </div>
    </section>
  );
}
