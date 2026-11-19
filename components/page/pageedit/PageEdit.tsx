'use client';

import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  Bold,
  BookOpen,
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
  CONTAINER_ADD_BLOCK_TYPES,
  MODAL_ADD_BLOCK_TYPES,
  PAGE_CONTENT_EDITOR_LABELS,
  SLIDE_ADD_BLOCK_TYPES,
  TEXT_ALIGN_OPTIONS,
  TEXT_SIZE_OPTIONS,
} from '@/lib/data/data-page-content-editor';
import {
  clamp,
  computeTableColumnWidths,
  createBlock,
  getSlideTitle,
} from '@/lib/page/page-edit/page-edit';
import type {
  Block,
  Deck,
  Slide,
  TableBlock,
  TextAlign,
} from '@/lib/deck-types';
import { PageContentEditorGuide } from './PageEditGuides';
import { MarkupText } from './PageEditMarkupTextAi';
import { TableView } from '@/components/presentation/PresentationTableView';

interface PageContentEditorProps {
  deck: Deck;
  slideIndex: number;
  onSelectSlide: (idx: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onMoveSlide: (delta: -1 | 1) => void;
  onSlideHeaderTitleChange: (title: string) => void;
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
            {PAGE_CONTENT_EDITOR_LABELS.rte.formatTextButton}
          </button>
          <button
            type="button"
            className="pbtn sm"
            onClick={() =>
              wrapSelection('[[', ']]', PAGE_CONTENT_EDITOR_LABELS.rte.aiTermFallback)
            }
            title={PAGE_CONTENT_EDITOR_LABELS.rte.aiTermTitle}
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.rte.aiTermButton}</span>
          </button>
          <button
            type="button"
            className="pbtn sm"
            onClick={() =>
              wrapSelection('[[[', ']]]', PAGE_CONTENT_EDITOR_LABELS.rte.modalFallback)
            }
            title={PAGE_CONTENT_EDITOR_LABELS.rte.modalTitle}
          >
            <span>{PAGE_CONTENT_EDITOR_LABELS.rte.modalButton}</span>
          </button>
        </div>

        <button
          type="button"
          className={`pbtn sm ${showPreview ? 'on' : ''}`}
          onClick={() => setShowPreview((v) => !v)}
          aria-pressed={showPreview}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{PAGE_CONTENT_EDITOR_LABELS.rte.previewButton}</span>
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
              if (hasSel)
                wrapSelection('**', '**', PAGE_CONTENT_EDITOR_LABELS.rte.selectionFallback);
              else if (allowWholeBlockStyle && onToggleBold) onToggleBold();
              else wrapSelection('**', '**', PAGE_CONTENT_EDITOR_LABELS.rte.boldFallback);
            }}
            aria-label={PAGE_CONTENT_EDITOR_LABELS.rte.boldAriaLabel}
          >
            <Bold className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {TEXT_SIZE_OPTIONS.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`pbtn sm ${
                allowWholeBlockStyle && sizeClass === sz ? 'on' : ''
              }`}
              onClick={() => {
                const el = textareaRef.current;
                const hasSel = el && el.selectionStart !== el.selectionEnd;
                if (hasSel)
                  wrapSelection(
                    `{${sz}}`,
                    `{/${sz}}`,
                    PAGE_CONTENT_EDITOR_LABELS.rte.selectionFallback
                  );
                else if (allowWholeBlockStyle && onChangeSize) onChangeSize(sz);
                else
                  wrapSelection(
                    `{${sz}}`,
                    `{/${sz}}`,
                    PAGE_CONTENT_EDITOR_LABELS.rte.selectionFallback
                  );
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
                aria-label={TEXT_ALIGN_OPTIONS[0].label}
              >
                <AlignLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`pbtn sm ${align === 'c' ? 'on' : ''}`}
                onClick={() => onChangeAlign('c')}
                aria-label={TEXT_ALIGN_OPTIONS[1].label}
              >
                <AlignCenter className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`pbtn sm ${align === 'r' ? 'on' : ''}`}
                onClick={() => onChangeAlign('r')}
                aria-label={TEXT_ALIGN_OPTIONS[2].label}
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
          <div className="text-xs font-mono opacity-60 mb-1">
            {PAGE_CONTENT_EDITOR_LABELS.rte.previewHeading}
          </div>
          {value ? (
            <MarkupText text={value} live={false} />
          ) : (
            <span className="italic opacity-55">
              {PAGE_CONTENT_EDITOR_LABELS.rte.emptyPreview}
            </span>
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
  const headers =
    block.headers.length > 0
      ? block.headers
      : [PAGE_CONTENT_EDITOR_LABELS.table.defaultFirstCol];
  const rows = block.rows.length > 0 ? block.rows : [headers.map(() => '')];
  const layout = computeTableColumnWidths(headers, rows, block.w);

  const setColumnCount = (targetCount: number) => {
    const nextCols = clamp(Math.round(targetCount) || 1, 1, 12);
    onUpdate((prev) => {
      const curCols = prev.headers.length;
      if (nextCols === curCols) return prev;
      const nextHeaders = Array.from({ length: nextCols }, (_, i) =>
        i < curCols
          ? prev.headers[i]
          : `${PAGE_CONTENT_EDITOR_LABELS.table.headerPrefix} ${i + 1}`
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
            <span className="text-xs font-semibold opacity-80">
              {PAGE_CONTENT_EDITOR_LABELS.table.headerLabel}
            </span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={headers.length <= 1}
              onClick={() => setColumnCount(headers.length - 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.decreaseColsAria}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={12}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.colsCountAria}
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
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.increaseColsAria}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{PAGE_CONTENT_EDITOR_LABELS.table.addColButton}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">
              {PAGE_CONTENT_EDITOR_LABELS.table.rowLabel}
            </span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={rows.length <= 1}
              onClick={() => setRowCount(rows.length - 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.decreaseRowsAria}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={50}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.rowsCountAria}
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
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.increaseRowsAria}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{PAGE_CONTENT_EDITOR_LABELS.table.addRowButton}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-mono opacity-75"
            data-testid="table-sizing-status"
          >
            {layout.mode === 'symmetric'
              ? `${PAGE_CONTENT_EDITOR_LABELS.table.symmetricPrefix} (${layout.widths.map((w) => `${Math.round(w)}%`).join(' : ')})`
              : `${PAGE_CONTENT_EDITOR_LABELS.table.adaptivePrefix} (${layout.widths.map((w) => `${Math.round(w)}%`).join(' : ')})`}
          </span>
          <button
            type="button"
            className={`pbtn sm ${showPreview ? 'on' : ''}`}
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.table.previewButton}</span>
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
                      {PAGE_CONTENT_EDITOR_LABELS.table.headerPrefix} {colIdx + 1} · {Math.round(layout.widths[colIdx] ?? 0)}%
                    </span>
                    {headers.length > 1 && (
                      <button
                        type="button"
                        className="pbtn sm !p-0 !w-6 !h-6"
                        onClick={() => removeColumn(colIdx)}
                        aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteColPrefix} ${colIdx + 1}`}
                        title={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteColPrefix} ${colIdx + 1}`}
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="pinput !py-1.5 !px-2 text-sm font-semibold min-w-[96px]"
                    placeholder={`${PAGE_CONTENT_EDITOR_LABELS.table.headerPrefix} ${colIdx + 1}`}
                    aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.headerAriaPrefix} ${colIdx + 1}`}
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
              {rows.length > 1 && (
                <th
                  className="w-9 p-1"
                  aria-label={PAGE_CONTENT_EDITOR_LABELS.table.rowActionsAria}
                />
              )}
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
                      placeholder={`${PAGE_CONTENT_EDITOR_LABELS.table.rowPlaceholderPrefix} ${rowIdx + 1}`}
                      aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.rowAriaPrefix} ${rowIdx + 1} ${PAGE_CONTENT_EDITOR_LABELS.table.colAriaPrefix} ${colIdx + 1}`}
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
                      aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteRowPrefix} ${rowIdx + 1}`}
                      title={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteRowPrefix} ${rowIdx + 1}`}
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

      {showPreview && (
        <div className="p-3 rounded-lg border border-current/20 bg-[var(--bg)]">
          <div className="text-xs font-mono opacity-60 mb-2">
            {PAGE_CONTENT_EDITOR_LABELS.table.previewHeading}
          </div>
          <TableView
            block={block}
            live={false}
            onTermClick={() => {}}
          />
        </div>
      )}
    </div>
  );
}

export function PageContentEditor({
  deck,
  slideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onSlideHeaderTitleChange,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onExportHtml,
  onExportJson,
  onImportJson,
  onImportHtml,
  onResetDeck,
  onToast,
}: PageContentEditorProps) {
  const slide: Slide = deck.slides[slideIndex];
  const jsonInputRef = React.useRef<HTMLInputElement>(null);
  const htmlInputRef = React.useRef<HTMLInputElement>(null);
  const imgInputRef = React.useRef<HTMLInputElement>(null);
  const [showHtmlImport, setShowHtmlImport] = React.useState(false);
  const [pastedHtml, setPastedHtml] = React.useState('');
  const [guideOpen, setGuideOpen] = React.useState(false);
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
    let titleCount = 0;
    return list.map((item) =>
      renderBlockEditor(
        item,
        item.t === 'dd' ? ++ddCount : 0,
        item.t === 'title' ? ++titleCount : 0
      )
    );
  };

  const renderBlockEditor = (
    b: Block,
    ddNumber = 1,
    titleNumber = 1
  ): React.ReactNode => {
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
            aria-label={`${PAGE_CONTENT_EDITOR_LABELS.block.deleteAriaPrefix} ${BLOCK_NAMES[b.t]}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.block.deleteButton}</span>
          </button>
        </div>

        {b.t === 'text' && (
          <RichMarkupTextarea
            blockId={b.id}
            value={b.text}
            placeholder={PAGE_CONTENT_EDITOR_LABELS.block.textPlaceholder}
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

        {b.t === 'title' && (
          <div className="space-y-2">
            <input
              type="text"
              className={`pinput-bt ${b.align ? `a-${b.align}` : ''}`}
              placeholder={PAGE_CONTENT_EDITOR_LABELS.block.titlePlaceholder}
              aria-label={`${PAGE_CONTENT_EDITOR_LABELS.block.titleAriaPrefix} ${titleNumber}`}
              value={b.text}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateBlock(b.id, (prev) =>
                  prev.t === 'title' ? { ...prev, text: val } : prev
                );
              }}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {TEXT_ALIGN_OPTIONS.map(({ value, label }) => {
                const Icon =
                  value === 'l'
                    ? AlignLeft
                    : value === 'c'
                      ? AlignCenter
                      : AlignRight;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`pbtn sm ${(b.align || 'l') === value ? 'on' : ''}`}
                    onClick={() =>
                      onUpdateBlock(b.id, (prev) =>
                        prev.t === 'title' ? { ...prev, align: value } : prev
                      )
                    }
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {b.t === 'dd' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="pinput !w-20 sm:!w-24 shrink-0 text-center font-bold"
                placeholder={String(ddNumber)}
                aria-label={PAGE_CONTENT_EDITOR_LABELS.block.ddBadgeAria}
                title={PAGE_CONTENT_EDITOR_LABELS.block.ddBadgeTitle}
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
                placeholder={PAGE_CONTENT_EDITOR_LABELS.block.ddTitlePlaceholder}
                aria-label={PAGE_CONTENT_EDITOR_LABELS.block.ddTitleAria}
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
              placeholder={PAGE_CONTENT_EDITOR_LABELS.block.ddDetailPlaceholder}
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
              <div className="im-frame im-frame-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.src}
                  alt={b.alt || PAGE_CONTENT_EDITOR_LABELS.block.imgPreviewAlt}
                  className="im"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="pbtn sm"
                onClick={() => pickImage({ kind: 'replace', id: b.id })}
              >
                <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {b.src
                    ? PAGE_CONTENT_EDITOR_LABELS.block.imgReplaceButton
                    : PAGE_CONTENT_EDITOR_LABELS.block.imgPickButton}
                </span>
              </button>
            </div>
            <input
              type="text"
              className="pinput text-sm"
              placeholder={PAGE_CONTENT_EDITOR_LABELS.block.imgAltPlaceholder}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.block.imgAltAria}
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
              className="pinput-bt"
              placeholder={PAGE_CONTENT_EDITOR_LABELS.block.boxTitlePlaceholder}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.block.boxTitleAria}
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
            {renderAddButtons(b.id, CONTAINER_ADD_BLOCK_TYPES)}
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
              placeholder={PAGE_CONTENT_EDITOR_LABELS.block.conclLabelPlaceholder}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.block.conclLabelAria}
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
              placeholder={PAGE_CONTENT_EDITOR_LABELS.block.conclTextPlaceholder}
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
            aria-label={`${PAGE_CONTENT_EDITOR_LABELS.slide.selectSlideAriaPrefix} ${idx + 1}: ${getSlideTitle(s)}`}
          >
            {idx + 1}
          </button>
        ))}
        <button type="button" className="pbtn sm" onClick={onAddSlide}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{PAGE_CONTENT_EDITOR_LABELS.slide.addSlideButton}</span>
        </button>
      </div>

      {/* Slide actions above presentation title & slide name */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="pbtn sm w-[34px] h-[34px] !p-0"
          disabled={slideIndex <= 0}
          onClick={() => onMoveSlide(-1)}
          aria-label={PAGE_CONTENT_EDITOR_LABELS.slide.movePrevAria}
          title={PAGE_CONTENT_EDITOR_LABELS.slide.movePrevAria}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pbtn sm w-[34px] h-[34px] !p-0"
          disabled={slideIndex >= deck.slides.length - 1}
          onClick={() => onMoveSlide(1)}
          aria-label={PAGE_CONTENT_EDITOR_LABELS.slide.moveNextAria}
          title={PAGE_CONTENT_EDITOR_LABELS.slide.moveNextAria}
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pbtn sm h-[34px]"
          onClick={onDuplicateSlide}
        >
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{PAGE_CONTENT_EDITOR_LABELS.slide.duplicateButton}</span>
        </button>
        <button
          type="button"
          className="pbtn sm h-[34px]"
          onClick={onDeleteSlide}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{PAGE_CONTENT_EDITOR_LABELS.slide.deleteSlideButton}</span>
        </button>
        <button
          type="button"
          className="pbtn sm w-[34px] h-[34px] !p-0 ml-auto"
          onClick={() => setGuideOpen(true)}
          aria-label={PAGE_CONTENT_EDITOR_LABELS.slide.guideAria}
          title={PAGE_CONTENT_EDITOR_LABELS.slide.guideAria}
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Per-slide Header Title */}
      <div>
        <label
          htmlFor="slide-header-title-input"
          className="block text-sm font-bold mb-1"
        >
          {PAGE_CONTENT_EDITOR_LABELS.slide.headerTitlePrefix} (
          {PAGE_CONTENT_EDITOR_LABELS.slide.headerTitlePagePrefix}{' '}
          {slideIndex + 1})
        </label>
        <input
          id="slide-header-title-input"
          type="text"
          className="pinput"
          placeholder={PAGE_CONTENT_EDITOR_LABELS.slide.headerTitlePlaceholder}
          value={
            typeof slide.headerTitle === 'string'
              ? slide.headerTitle
              : deck.title
          }
          onChange={(e) => onSlideHeaderTitleChange(e.target.value)}
        />
      </div>

      {/* Add component buttons directly below presentation title */}
      {renderAddButtons(undefined, SLIDE_ADD_BLOCK_TYPES, 'mt-0')}

      {/* Blocks */}
      <div className="pt-2">
        <h2 className="text-xl font-bold mb-3">
          {PAGE_CONTENT_EDITOR_LABELS.slide.sectionTitle}
        </h2>
        <div className="space-y-3">
          {renderBlockList(slide.blocks)}
        </div>
        {slide.blocks.length === 0 && (
          <p className="text-sm opacity-70 mt-2">
            {PAGE_CONTENT_EDITOR_LABELS.slide.emptySlideMessage}
          </p>
        )}
      </div>

      {/* Auto-detected Modals section */}
      {(slide.modals || []).length > 0 && (
        <div className="pt-4 border-t border-current/15 space-y-3">
          <div>
            <h2 className="text-xl font-bold m-0">
              {PAGE_CONTENT_EDITOR_LABELS.modals.sectionTitle}
            </h2>
          </div>
          <div className="space-y-4">
            {(slide.modals || []).map((m) => (
              <div key={m.id} className="card box space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider opacity-65">
                  {PAGE_CONTENT_EDITOR_LABELS.modals.itemBadge}
                </div>
                <div className="bt">
                  {m.title || (
                    <span className="italic opacity-55">
                      {PAGE_CONTENT_EDITOR_LABELS.modals.untitledLabel}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {renderBlockList(m.children)}
                </div>
                {m.children.length === 0 && (
                  <p className="text-xs opacity-70 m-0">
                    {PAGE_CONTENT_EDITOR_LABELS.modals.emptyModalMessage}
                  </p>
                )}
                {renderAddButtons(m.id, MODAL_ADD_BLOCK_TYPES)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export / Import */}
      <div className="pt-4 border-t border-current/15 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="pbtn" onClick={onExportHtml}>
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.io.exportHtmlButton}</span>
          </button>
          <button type="button" className="pbtn" onClick={onExportJson}>
            <FileJson className="w-4 h-4" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.io.exportJsonButton}</span>
          </button>
          <button
            type="button"
            className="pbtn"
            onClick={() => jsonInputRef.current?.click()}
          >
            <FolderOpen className="w-4 h-4" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.io.importJsonButton}</span>
          </button>
          <button
            type="button"
            className={`pbtn ${showHtmlImport ? 'on' : ''}`}
            aria-expanded={showHtmlImport}
            onClick={() => setShowHtmlImport((v) => !v)}
          >
            <FileCode2 className="w-4 h-4" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.io.importHtmlButton}</span>
          </button>
          <button type="button" className="pbtn" onClick={onResetDeck}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.io.resetDeckButton}</span>
          </button>
        </div>

        {showHtmlImport && (
          <div className="ec space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">
                {PAGE_CONTENT_EDITOR_LABELS.io.htmlImportHeading}
              </strong>
              <button
                type="button"
                className="pbtn sm"
                onClick={() => htmlInputRef.current?.click()}
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{PAGE_CONTENT_EDITOR_LABELS.io.pickHtmlFileButton}</span>
              </button>
            </div>
            <textarea
              rows={5}
              className="ptarea font-mono text-xs leading-relaxed"
              placeholder={PAGE_CONTENT_EDITOR_LABELS.io.pasteHtmlPlaceholder}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.io.pasteHtmlAria}
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
                {PAGE_CONTENT_EDITOR_LABELS.io.cancelButton}
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
                {PAGE_CONTENT_EDITOR_LABELS.io.applyHtmlButton}
              </button>
            </div>
          </div>
        )}

      </div>

      <PageContentEditorGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </section>
  );
}
