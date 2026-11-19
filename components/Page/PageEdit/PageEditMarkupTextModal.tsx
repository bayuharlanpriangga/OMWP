'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, X } from 'lucide-react';
import { stripMarkup } from '@/lib/page/page-edit/page-edit-markup-text-modal';
import type { Block, SlideModal } from '@/lib/deck-types';
import { MarkupText } from './PageEditMarkupText';
import { ChartView } from './PageEditChart/PageEditChart';
import { TableView } from './PageEditTable/PageEditTableView';

interface MarkupTextModalProps {
  modal: SlideModal | null;
  onClose: () => void;
  onTermClick: (term: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  onImageZoom: (src: string, alt: string) => void;
}

function ModalBlockList({
  blocks,
  onTermClick,
  onImageZoom,
}: {
  blocks: Block[];
  onTermClick: (term: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  onImageZoom: (src: string, alt: string) => void;
}) {
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set());
  const onToggleId = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  let ddIndex = 0;
  return (
    <div className="cv">
      {blocks.map((b) => {
        const currentNum = b.t === 'dd' ? ++ddIndex : 0;
        const isOpen = openIds.has(b.id);
        return (
          <div key={b.id} className="blk col-span-12">
            {b.t === 'text' && (
              <div
                className={`tx s-${b.size || 'm'} a-${b.align || 'l'} ${b.b ? 'bd' : ''} ${b.i ? 'it' : ''} ${b.u ? 'ul' : ''}`}
              >
                <MarkupText
                  text={b.text}
                  live={true}
                  insideModal={true}
                  onTermClick={onTermClick}
                />
              </div>
            )}
            {b.t === 'title' && b.text.trim() && (
              <div className={`bt bt-sub ${b.align ? `a-${b.align}` : ''}`}>
                <MarkupText
                  text={b.text}
                  live={true}
                  insideModal={true}
                  onTermClick={onTermClick}
                />
              </div>
            )}
            {b.t === 'img' &&
              (b.src ? (
                <button
                  type="button"
                  className="im-frame im-frame-btn"
                  onClick={() => onImageZoom(b.src, b.alt)}
                  aria-label={`Perbesar gambar ${b.alt || ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.src}
                    alt={b.alt || 'Gambar modal'}
                    className="im block w-full h-auto"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ) : (
                <p className="text-sm italic opacity-60">(gambar kosong)</p>
              ))}
            {b.t === 'dd' && (
              <div className={`card ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="ch"
                  aria-expanded={isOpen}
                  onClick={() => onToggleId(b.id)}
                >
                  <span className="n">{currentNum}</span>
                  <span>{stripMarkup(b.text)}</span>
                  <ChevronRight
                    className={`w-4 h-4 ml-auto transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="cb">
                    {b.detail ? (
                      <MarkupText
                        text={b.detail}
                        live={true}
                        insideModal={true}
                        onTermClick={onTermClick}
                      />
                    ) : (
                      <em>Belum ada penjelasan.</em>
                    )}
                  </div>
                )}
              </div>
            )}
            {b.t === 'concl' && (
              <div>
                <button
                  type="button"
                  className="pbtn"
                  onClick={() => onToggleId(b.id)}
                >
                  {isOpen ? 'Tutup kesimpulan' : b.label || '★ Kesimpulan'}
                </button>
                {isOpen && (
                  <div className="concl">
                    <MarkupText
                      text={b.text}
                      live={true}
                      insideModal={true}
                      onTermClick={onTermClick}
                    />
                  </div>
                )}
              </div>
            )}
            {b.t === 'table' && (
              <TableView
                block={b}
                live={true}
                insideModal={true}
                onTermClick={onTermClick}
              />
            )}
            {b.t === 'chart' && (
              <ChartView
                block={b}
                live={true}
                insideModal={true}
                onTermClick={onTermClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MarkupTextModal({
  modal,
  onClose,
  onTermClick,
  onImageZoom,
}: MarkupTextModalProps) {
  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          className="modal-backdrop z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={modal.title || 'Detail Modal'}
            className="modal-card w-full max-w-[640px]"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <div className="flex items-start gap-3 mb-3">
              {modal.title && (
                <h2 className="text-xl font-bold m-0 flex-1 break-words">
                  {modal.title}
                </h2>
              )}
              <button
                type="button"
                className="pbtn sm ml-auto"
                onClick={onClose}
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            {modal.children.length > 0 ? (
              <ModalBlockList
                key={modal.id}
                blocks={modal.children}
                onTermClick={onTermClick}
                onImageZoom={onImageZoom}
              />
            ) : (
              <p className="text-sm italic opacity-60">Belum ada isi.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
