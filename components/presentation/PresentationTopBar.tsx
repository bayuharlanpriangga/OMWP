'use client';

import React from 'react';
import {
  Check,
  LayoutGrid,
  Minimize2,
  Palette,
  Pencil,
  Play,
} from 'lucide-react';
import type { WorkspaceMode } from '@/lib/deck-types';

interface TopBarProps {
  title: string;
  mode: WorkspaceMode;
  isFullscreen: boolean;
  onModeChange: (mode: WorkspaceMode) => void;
  onToggleFullscreen: () => void;
  onOpenThemes: () => void;
}

export function TopBar({
  title,
  mode,
  isFullscreen,
  onModeChange,
  onToggleFullscreen,
  onOpenThemes,
}: TopBarProps) {
  const isEdit = mode === 'edit';
  const isLayout = mode === 'layout';

  return (
    <header className="pres-top">
      <div className="pres-brand" title={title || 'Presentasi'}>
        {title || 'Presentasi'}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Mode editor"
        >
          <button
            type="button"
            aria-label={isEdit ? 'Keluar mode edit isi' : 'Edit isi'}
            title={isEdit ? 'Keluar mode edit isi' : 'Edit isi'}
            aria-pressed={isEdit}
            className={`pbtn sm max-sm:w-[34px] max-sm:!px-0 ${isEdit ? 'on' : ''}`}
            onClick={() => onModeChange(isEdit ? 'present' : 'edit')}
          >
            {isEdit ? (
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Pencil className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Isi</span>
          </button>
          <button
            type="button"
            aria-label={isLayout ? 'Keluar mode edit layout' : 'Edit layout'}
            title={isLayout ? 'Keluar mode edit layout' : 'Edit layout'}
            aria-pressed={isLayout}
            className={`pbtn sm max-sm:w-[34px] max-sm:!px-0 ${isLayout ? 'on' : ''}`}
            onClick={() => onModeChange(isLayout ? 'present' : 'layout')}
          >
            {isLayout ? (
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Layout</span>
          </button>
        </div>

        {mode === 'present' && (
          <button
            type="button"
            className="pbtn sm w-[34px] !px-0"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
          </button>
        )}

        <button
          type="button"
          className="pbtn sm max-md:w-[34px] max-md:!px-0"
          onClick={onOpenThemes}
          aria-label="Pilih tema presentasi"
          title="Tema"
        >
          <Palette className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">Tema</span>
        </button>
      </div>
    </header>
  );
}
