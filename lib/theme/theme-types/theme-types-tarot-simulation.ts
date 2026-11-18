export type TarotMotif =
  | 'sun'
  | 'moon'
  | 'star'
  | 'wheel'
  | 'eye'
  | 'chalice'
  | 'lantern'
  | 'crown';

export interface TarotArcanaSpec {
  numeral: string;
  title: string;
  motif: TarotMotif;
  accent: string;
}

export interface TarotFloatingCard {
  id: number;
  arcanaIndex: number;
  anchorXFrac: number;
  anchorYFrac: number;
  width: number;
  height: number;
  bobAmp: number;
  bobSpeed: number;
  bobPhase: number;
  driftAmpX: number;
  driftSpeed: number;
  baseTilt: number;
  tiltAmp: number;
  flipPhase: number;
  flipSpeed: number;
  depth: number;
}

export interface TarotEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
  twinkleSpeed: number;
  color: string;
}

export interface TarotWisp {
  xFrac: number;
  baseYFrac: number;
  widthFrac: number;
  heightFrac: number;
  speed: number;
  phase: number;
  alpha: number;
  color: string;
}

export interface TarotMoteStar {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  twinkleSpeed: number;
  color: string;
}

export interface TarotWorld {
  width: number;
  height: number;
  elapsed: number;
  centerX: number;
  centerY: number;
  mandalaRadius: number;
  outerRingAngle: number;
  innerRingAngle: number;
  sigilAngle: number;
  cards: TarotFloatingCard[];
  embers: TarotEmber[];
  wisps: TarotWisp[];
  stars: TarotMoteStar[];
}

export const TAROT_ARCANA: readonly TarotArcanaSpec[] = [
  { numeral: '0', title: 'THE FOOL', motif: 'eye', accent: '#f3d285' },
  { numeral: 'I', title: 'THE MAGICIAN', motif: 'chalice', accent: '#e3b96c' },
  { numeral: 'II', title: 'HIGH PRIESTESS', motif: 'moon', accent: '#d8b4fe' },
  { numeral: 'III', title: 'THE EMPRESS', motif: 'crown', accent: '#f4b4c4' },
  { numeral: 'IX', title: 'THE HERMIT', motif: 'lantern', accent: '#fde68a' },
  { numeral: 'X', title: 'WHEEL OF FORTUNE', motif: 'wheel', accent: '#e3b96c' },
  { numeral: 'XVII', title: 'THE STAR', motif: 'star', accent: '#e9d5ff' },
  { numeral: 'XVIII', title: 'THE MOON', motif: 'moon', accent: '#c4b5fd' },
  { numeral: 'XIX', title: 'THE SUN', motif: 'sun', accent: '#fcd34d' },
  { numeral: 'XXI', title: 'THE WORLD', motif: 'wheel', accent: '#f3d285' },
];

const CARD_SLOTS_DESKTOP: ReadonlyArray<{
  xFrac: number;
  yFrac: number;
  tilt: number;
  depth: number;
}> = [
  { xFrac: 0.12, yFrac: 0.28, tilt: -0.16, depth: 0.86 },
  { xFrac: 0.87, yFrac: 0.24, tilt: 0.14, depth: 0.96 },
  { xFrac: 0.16, yFrac: 0.72, tilt: 0.12, depth: 0.94 },
  { xFrac: 0.88, yFrac: 0.68, tilt: -0.14, depth: 0.88 },
  { xFrac: 0.56, yFrac: 0.2, tilt: 0.08, depth: 0.74 },
  { xFrac: 0.44, yFrac: 0.79, tilt: -0.09, depth: 0.78 },
  { xFrac: 0.72, yFrac: 0.48, tilt: 0.05, depth: 1.04 },
];

const CARD_SLOTS_MOBILE: ReadonlyArray<{
  xFrac: number;
  yFrac: number;
  tilt: number;
  depth: number;
}> = [
  { xFrac: 0.15, yFrac: 0.25, tilt: -0.14, depth: 0.84 },
  { xFrac: 0.85, yFrac: 0.27, tilt: 0.14, depth: 0.88 },
  { xFrac: 0.18, yFrac: 0.74, tilt: 0.11, depth: 0.86 },
  { xFrac: 0.84, yFrac: 0.72, tilt: -0.12, depth: 0.84 },
  { xFrac: 0.5, yFrac: 0.46, tilt: 0.04, depth: 0.96 },
];

export function computeTarotMandalaMetrics(
  width: number,
  height: number
): { centerX: number; centerY: number; mandalaRadius: number; isMobile: boolean } {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const isMobile = safeW < 640;
  return {
    centerX: isMobile ? safeW * 0.5 : safeW * 0.71,
    centerY: isMobile ? safeH * 0.47 : safeH * 0.46,
    mandalaRadius: isMobile
      ? Math.max(118, Math.min(safeW * 0.36, safeH * 0.23))
      : Math.max(178, Math.min(safeW * 0.24, safeH * 0.36)),
    isMobile,
  };
}

/**
 * Computes normalized 3D-like flip scaleX in [-1, 1] and whether face side is shown.
 * Uses a smooth hold-and-turn wave so cards linger gracefully on both front & back.
 */
export function getTarotCardFlipState(
  flipPhase: number,
  elapsed: number,
  flipSpeed: number,
  reducedMotion = false
): { scaleX: number; isFaceUp: boolean; glint: number } {
  const angle = reducedMotion ? flipPhase : flipPhase + elapsed * flipSpeed;
  const rawCos = Math.cos(angle);
  // Ease cosine slightly so cards dwell longer on face/back and turn crisply through edge
  const sign = rawCos >= 0 ? 1 : -1;
  const mag = Math.pow(Math.abs(rawCos), 0.72);
  const signed = sign * mag;
  const isFaceUp = signed >= 0;
  const edgeProximity = Math.max(0, 1 - Math.abs(rawCos) * 2.4);
  return {
    scaleX: Math.max(0.06, Math.abs(signed)),
    isFaceUp,
    glint: isFaceUp ? 0.55 + 0.45 * Math.abs(rawCos) + edgeProximity * 0.3 : edgeProximity * 0.4,
  };
}

function buildCards(
  width: number,
  height: number,
  rng: () => number
): TarotFloatingCard[] {
  const isMobile = width < 640;
  const slots = isMobile ? CARD_SLOTS_MOBILE : CARD_SLOTS_DESKTOP;
  const baseCardW = isMobile
    ? Math.max(46, Math.min(62, width * 0.145))
    : Math.max(66, Math.min(92, Math.min(width * 0.068, height * 0.105)));

  return slots.map((slot, idx) => {
    const w = Math.round(baseCardW * slot.depth);
    const h = Math.round(w * 1.62);
    return {
      id: idx,
      arcanaIndex: (idx * 2 + Math.floor(rng() * 2)) % TAROT_ARCANA.length,
      anchorXFrac: slot.xFrac,
      anchorYFrac: slot.yFrac,
      width: w,
      height: h,
      bobAmp: isMobile ? 6 + rng() * 5 : 9 + rng() * 7,
      bobSpeed: 0.7 + rng() * 0.5,
      bobPhase: rng() * Math.PI * 2,
      driftAmpX: isMobile ? 4 + rng() * 4 : 7 + rng() * 6,
      driftSpeed: 0.42 + rng() * 0.35,
      baseTilt: slot.tilt,
      tiltAmp: 0.035 + rng() * 0.03,
      flipPhase: idx === slots.length - 1 ? 0.25 : idx * 1.15 + rng() * 0.5,
      flipSpeed: 0.28 + (idx % 3) * 0.07 + rng() * 0.06,
      depth: slot.depth,
    };
  });
}

function buildEmbers(width: number, height: number, rng: () => number): TarotEmber[] {
  const count = width < 640 ? 28 : 54;
  const palette = ['#f3d285', '#e3b96c', '#d8b4fe', '#fda4af', '#fef3c7'];
  return Array.from({ length: count }, (_, i) => ({
    x: rng() * width,
    y: rng() * height,
    vx: (rng() - 0.5) * 14,
    vy: -(16 + rng() * 28),
    r: i % 5 === 0 ? 2.4 : 1.1 + rng() * 1.2,
    alpha: 0.28 + rng() * 0.55,
    phase: rng() * Math.PI * 2,
    twinkleSpeed: 1.6 + rng() * 2.2,
    color: palette[i % palette.length],
  }));
}

function buildStars(width: number, height: number, rng: () => number): TarotMoteStar[] {
  const count = width < 640 ? 52 : 98;
  const palette = ['#f5ecda', '#e3b96c', '#c4b5fd', '#fde68a'];
  return Array.from({ length: count }, (_, i) => ({
    x: rng() * width,
    y: rng() * height,
    r: i % 9 === 0 ? 1.8 : 0.8 + rng() * 0.7,
    alpha: 0.2 + rng() * 0.48,
    phase: rng() * Math.PI * 2,
    twinkleSpeed: 0.9 + rng() * 1.8,
    color: palette[i % palette.length],
  }));
}

function buildWisps(): TarotWisp[] {
  return [
    {
      xFrac: 0.16,
      baseYFrac: 0.86,
      widthFrac: 0.34,
      heightFrac: 0.48,
      speed: 0.42,
      phase: 0.4,
      alpha: 0.16,
      color: '#a855f7',
    },
    {
      xFrac: 0.52,
      baseYFrac: 0.92,
      widthFrac: 0.4,
      heightFrac: 0.52,
      speed: 0.34,
      phase: 2.1,
      alpha: 0.14,
      color: '#9d2a4b',
    },
    {
      xFrac: 0.84,
      baseYFrac: 0.88,
      widthFrac: 0.32,
      heightFrac: 0.44,
      speed: 0.48,
      phase: 4.2,
      alpha: 0.15,
      color: '#c99846',
    },
  ];
}

export function createTarotWorld(
  width: number,
  height: number,
  rng: () => number = Math.random
): TarotWorld {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const metrics = computeTarotMandalaMetrics(safeW, safeH);

  return {
    width: safeW,
    height: safeH,
    elapsed: 0,
    centerX: metrics.centerX,
    centerY: metrics.centerY,
    mandalaRadius: metrics.mandalaRadius,
    outerRingAngle: rng() * Math.PI * 2,
    innerRingAngle: rng() * Math.PI * 2,
    sigilAngle: rng() * Math.PI * 2,
    cards: buildCards(safeW, safeH, rng),
    embers: buildEmbers(safeW, safeH, rng),
    wisps: buildWisps(),
    stars: buildStars(safeW, safeH, rng),
  };
}

export function resizeTarotWorld(
  world: TarotWorld,
  width: number,
  height: number,
  rng: () => number = Math.random
): void {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const metrics = computeTarotMandalaMetrics(safeW, safeH);

  world.width = safeW;
  world.height = safeH;
  world.centerX = metrics.centerX;
  world.centerY = metrics.centerY;
  world.mandalaRadius = metrics.mandalaRadius;
  world.cards = buildCards(safeW, safeH, rng);
  world.embers = buildEmbers(safeW, safeH, rng);
  world.stars = buildStars(safeW, safeH, rng);
}

export function stepTarotWorld(
  world: TarotWorld,
  dt: number,
  reducedMotion = false,
  rng: () => number = Math.random
): void {
  if (reducedMotion || dt <= 0) return;

  const clampedDt = Math.min(0.1, dt);
  world.elapsed += clampedDt;

  world.outerRingAngle = (world.outerRingAngle + 0.055 * clampedDt) % (Math.PI * 2);
  world.innerRingAngle = (world.innerRingAngle - 0.082 * clampedDt) % (Math.PI * 2);
  world.sigilAngle = (world.sigilAngle + 0.032 * clampedDt) % (Math.PI * 2);

  for (const e of world.embers) {
    e.x += (e.vx + Math.sin(world.elapsed * 1.4 + e.phase) * 7) * clampedDt;
    e.y += e.vy * clampedDt;
    if (e.y < -16) {
      e.y = world.height + 14;
      e.x = rng() * world.width;
    }
    if (e.x < -14) e.x = world.width + 12;
    else if (e.x > world.width + 14) e.x = -12;
  }

  for (const s of world.stars) {
    s.x -= 2.4 * clampedDt;
    if (s.x < -4) s.x = world.width + 4;
  }
}
