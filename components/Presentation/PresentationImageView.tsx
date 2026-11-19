'use client';

import React from 'react';
import { X } from 'lucide-react';

export function ImageLightbox({
  image,
  onClose,
}: {
  image: { src: string; alt: string } | null;
  onClose: () => void;
}) {
  if (!image) return null;
  return (
    <div
      className="fixed inset-0 bg-black/88 z-50 grid place-items-center p-4 cursor-zoom-out"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Pratinjau gambar'}
      onClick={onClose}
    >
      <button
        type="button"
        className="pbtn sm fixed top-4 right-4"
        onClick={onClose}
        aria-label="Tutup pratinjau gambar"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt || 'Gambar presentasi'}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
