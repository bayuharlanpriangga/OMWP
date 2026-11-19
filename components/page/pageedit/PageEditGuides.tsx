'use client';

import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface PageContentEditorGuideProps {
  open: boolean;
  onClose: () => void;
}

export function PageContentEditorGuide({
  open,
  onClose,
}: PageContentEditorGuideProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Panduan editor"
        className="modal-card max-w-[560px]"
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold m-0">Panduan Editor</h2>
          </div>
          <button
            type="button"
            className="pbtn sm w-7 h-7 !p-0 shrink-0"
            onClick={onClose}
            aria-label="Tutup panduan editor"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 text-sm leading-relaxed">
          <section className="p-3 rounded-lg border border-current/15 bg-black/5 space-y-1">
            <h3 className="text-sm font-bold m-0">Judul Header Halaman</h3>
            <p className="text-xs opacity-85 m-0">
              Setiap halaman memiliki judul header sendiri sebagai konteks atau
              informasi tambahan di bagian atas slide.
            </p>
          </section>

          <section className="p-3 rounded-lg border border-current/15 bg-black/5 space-y-1">
            <h3 className="text-sm font-bold m-0">
              Tanda Interaktif &amp; Mode Layout
            </h3>
            <p className="text-xs opacity-85 m-0">
              Urutan, ukuran, dan perataan bebas diatur di mode{' '}
              <strong>Layout</strong>. Tanda{' '}
              <code className="font-mono">[[ ]]</code> (penjelasan AI) dan{' '}
              <code className="font-mono">[[[ ]]]</code> (popup modal) hanya
              terlihat saat mengedit; saat ditampilkan istilahnya menjadi tombol
              interaktif.
            </p>
          </section>

          <section className="p-3 rounded-lg border border-current/15 bg-black/5 space-y-1">
            <h3 className="text-sm font-bold m-0">Modal Otomatis</h3>
            <p className="text-xs opacity-85 m-0">
              Bagian Modal terdeteksi otomatis dari tanda{' '}
              <code className="font-mono">[[[ ]]]</code> di slide. Komponen yang
              ditambahkan di dalamnya akan tampil sebagai popup saat teksnya
              diklik.
            </p>
          </section>

          <section className="p-3 rounded-lg border border-current/15 bg-black/5 space-y-1">
            <h3 className="text-sm font-bold m-0">Tabel Adaptif</h3>
            <p className="text-xs opacity-85 m-0">
              Lebar kolom seimbang otomatis bila semua isi ringkas, dan
              menyesuaikan teks terpanjang jika ada kolom yang berisi keterangan
              panjang. Mendukung{' '}
              <code className="font-mono">**tebal**</code>,{' '}
              <code className="font-mono">[[istilah]]</code>, dan{' '}
              <code className="font-mono">[[[modal]]]</code>.
            </p>
          </section>

          <section className="p-3 rounded-lg border border-current/15 bg-black/5 space-y-1">
            <h3 className="text-sm font-bold m-0">Ekspor &amp; Impor HTML</h3>
            <p className="text-xs opacity-85 m-0">
              <strong>Export HTML</strong> menghasilkan satu file presentasi
              mandiri tanpa editor, siap dibuka offline atau dipublish ke GitHub
              Pages. <strong>Import HTML</strong> mendukung file HTML hasil
              ekspor aplikasi ini maupun file HTML presentasi umum (elemen{' '}
              <code className="font-mono">&lt;section&gt;</code>,{' '}
              <code className="font-mono">.slide</code>, heading, kartu, daftar,
              dan <code className="font-mono">&lt;details&gt;</code>) agar
              langsung bisa diedit per blok.
            </p>
          </section>
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" className="pbtn sm on" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
