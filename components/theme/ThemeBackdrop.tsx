'use client';

import React from 'react';
import Image from 'next/image';
import cyberpunkCityBg from '@/src/assets/images/cyberpunk_purple_city_1794952180578.jpg';
import type { ThemeId } from '@/lib/deck-types';
import { AquariumTheme } from './AquariumTheme';
import { DetectiveTheme } from './DetectiveTheme';
import { DinoTheme } from './DinoTheme';
import { GhostTheme } from './GhostTheme';
import { HalloweenTheme } from './HalloweenTheme';
import { MatrixRainTheme } from './MatrixRainTheme';
import { PixelTheme } from './PixelTheme';
import { SpaceTheme } from './SpaceTheme';
import { SummerTheme } from './SummerTheme';
import { ZodiacTheme } from './ZodiacTheme';

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
      {theme === 'cyberpunk' && (
        <Image
          src={cyberpunkCityBg}
          alt=""
          fill
          priority
          sizes="100vw"
          referrerPolicy="no-referrer"
          className="tb-city-img object-cover object-bottom"
        />
      )}
      {theme === 'hacker' && <MatrixRainTheme />}
      {theme === 'astronomi' && <SpaceTheme />}
      {theme === 'ghost' && <GhostTheme />}
      {theme === 'halloween' && <HalloweenTheme />}
      {theme === 'aquarium' && <AquariumTheme />}
      {theme === 'detective' && <DetectiveTheme />}
      {theme === 'summer' && <SummerTheme />}
      {theme === 'pixel' && <PixelTheme />}
      {theme === 'dino' && <DinoTheme />}
      {theme === 'zodiac' && <ZodiacTheme />}
      <span className="tb-a" />
      <span className="tb-b" />
      <span className="tb-c" />
      <span className="tb-d" />
    </div>
  );
}
