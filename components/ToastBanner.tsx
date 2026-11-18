'use client';

import React from 'react';

interface ToastBannerProps {
  message: string | null;
}

export function ToastBanner({ message }: ToastBannerProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-white/20"
    >
      {message}
    </div>
  );
}
