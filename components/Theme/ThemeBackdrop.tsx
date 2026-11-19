'use client';

import React from 'react';
import type { ThemeId } from '@/lib/deck-types';
import { ThemeTypesAi } from './ThemeTypes/ThemeTypesAi';
import { ThemeTypesAquarium } from './ThemeTypes/ThemeTypesAquarium';
import { ThemeTypesCyberpunk } from './ThemeTypes/ThemeTypesCyberpunk';
import { ThemeTypesDetective } from './ThemeTypes/ThemeTypesDetective';
import { ThemeTypesDino } from './ThemeTypes/ThemeTypesDino';
import { ThemeTypesGhost } from './ThemeTypes/ThemeTypesGhost';
import { ThemeTypesHalloween } from './ThemeTypes/ThemeTypesHalloween';
import { ThemeTypesJoker } from './ThemeTypes/ThemeTypesJoker';
import { ThemeTypesMatrixRain } from './ThemeTypes/ThemeTypesMatrixRain';
import { ThemeTypesPixel } from './ThemeTypes/ThemeTypesPixel';
import { ThemeTypesSpace } from './ThemeTypes/ThemeTypesSpace';
import { ThemeTypesSummer } from './ThemeTypes/ThemeTypesSummer';
import { ThemeTypesTarot } from './ThemeTypes/ThemeTypesTarot';
import { ThemeTypesZodiac } from './ThemeTypes/ThemeTypesZodiac';

interface ThemeBackdropProps {
  theme: ThemeId;
}

export function ThemeBackdrop({ theme }: ThemeBackdropProps) {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const target = (e.target as HTMLElement | null)?.closest(
        '.pbtn, .term, .ch, .pres-fab'
      ) as HTMLElement | null;
      if (!target || (target as HTMLButtonElement).disabled) return;

      let x = e.clientX;
      let y = e.clientY;
      if (!e.detail) {
        const rect = target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      const activeTheme = document.documentElement.dataset.theme || 'default';
      const fx = document.createElement('span');
      fx.className = `fx fx-${activeTheme}`;
      fx.style.left = `${x}px`;
      fx.style.top = `${y}px`;

      if (activeTheme === 'brutal') {
        const colors = ['var(--acc)', 'var(--acc2)', 'var(--acc3)'];
        let html = '<b></b>';
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
          const dist = 30 + Math.random() * 16;
          const dx = (Math.cos(angle) * dist).toFixed(1);
          const dy = (Math.sin(angle) * dist).toFixed(1);
          html += `<i style="--dx:${dx}px;--dy:${dy}px;--c:${colors[i % 3]}"></i>`;
        }
        fx.innerHTML = html;
      }
      document.body.appendChild(fx);
      window.setTimeout(() => fx.remove(), 650);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="theme-backdrop" aria-hidden="true">
      {theme === 'cyberpunk' && <ThemeTypesCyberpunk />}
      {theme === 'hacker' && <ThemeTypesMatrixRain />}
      {theme === 'astronomi' && <ThemeTypesSpace />}
      {theme === 'ghost' && <ThemeTypesGhost />}
      {theme === 'halloween' && <ThemeTypesHalloween />}
      {theme === 'aquarium' && <ThemeTypesAquarium />}
      {theme === 'detective' && <ThemeTypesDetective />}
      {theme === 'summer' && <ThemeTypesSummer />}
      {theme === 'pixel' && <ThemeTypesPixel />}
      {theme === 'dino' && <ThemeTypesDino />}
      {theme === 'zodiac' && <ThemeTypesZodiac />}
      {theme === 'tarot' && <ThemeTypesTarot />}
      {theme === 'joker' && <ThemeTypesJoker />}
      {theme === 'ai' && <ThemeTypesAi />}
      <span className="tb-a" />
      <span className="tb-b" />
      <span className="tb-c" />
      <span className="tb-d" />
    </div>
  );
}
