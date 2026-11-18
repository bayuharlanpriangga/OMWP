'use client';

import React from 'react';

export interface ConfirmDialogState {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  state: ConfirmDialogState | null;
  onCancel: () => void;
}

export function ConfirmDialog({ state, onCancel }: ConfirmDialogProps) {
  if (!state) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={state.title}
        className="modal-card max-w-[400px]"
      >
        <h2 className="text-lg font-bold m-0 mb-2">{state.title}</h2>
        <p className="text-sm opacity-80 m-0 mb-5">{state.message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="pbtn sm" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="pbtn sm on" onClick={state.onConfirm}>
            Ya, lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
