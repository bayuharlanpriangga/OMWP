'use client';

import React from 'react';
import { Minimize2, Play } from 'lucide-react';

interface PageFullscreenProps {
  onToast: (message: string) => void;
}

function subscribeFullscreen(callback: () => void) {
  document.addEventListener('fullscreenchange', callback);
  return () => document.removeEventListener('fullscreenchange', callback);
}

function getFullscreenSnapshot() {
  return Boolean(document.fullscreenElement);
}

function getServerFullscreenSnapshot() {
  return false;
}

export function PageFullscreen({ onToast }: PageFullscreenProps) {
  const isFullscreen = React.useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getServerFullscreenSnapshot
  );

  React.useEffect(() => {
    const onFs = () => {
      if (document.fullscreenElement) {
        onToast('Tekan ESC untuk keluar dari layar penuh');
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [onToast]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen();
    }
  };

  return (
    <button
      type="button"
      className="pbtn sm w-[34px] !px-0"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
      title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
    >
      {isFullscreen ? (
        <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
