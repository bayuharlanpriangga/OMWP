export type CyberpunkRoofStyle = 'flat' | 'spire' | 'stepped' | 'antenna' | 'dome';
export type CyberpunkBillboardPattern = 'bars' | 'grid' | 'pulse' | 'holo';

export interface CyberpunkBillboard {
  offsetXFrac: number;
  offsetYFrac: number;
  wFrac: number;
  hFrac: number;
  color: string;
  pattern: CyberpunkBillboardPattern;
  phase: number;
}

export interface CyberpunkBuilding {
  x: number;
  w: number;
  hFrac: number;
  layer: 0 | 1 | 2;
  accentColor: string;
  roofStyle: CyberpunkRoofStyle;
  beaconPhase: number;
  hasBeacon: boolean;
  windowCols: number;
  windowRows: number;
  windowSeed: number;
  billboard?: CyberpunkBillboard;
}

export interface CyberpunkSpinner {
  x: number;
  yFrac: number;
  vx: number;
  length: number;
  lane: 0 | 1 | 2;
  bodyColor: string;
  trailColor: string;
  headlightColor: string;
  phase: number;
}

export interface CyberpunkTrain {
  x: number;
  speed: number;
  carCount: number;
  carW: number;
  gap: number;
  accentColor: string;
  cooldown: number;
}

export interface CyberpunkRainDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  alpha: number;
  color: string;
}

export interface CyberpunkBeam {
  xFrac: number;
  angleBase: number;
  swingAmp: number;
  swingSpeed: number;
  phase: number;
  color: string;
  width: number;
}

export interface CyberpunkWorld {
  width: number;
  height: number;
  elapsed: number;
  layerOffsets: [number, number, number];
  layerWidths: [number, number, number];
  layerSpeeds: [number, number, number];
  buildings: [CyberpunkBuilding[], CyberpunkBuilding[], CyberpunkBuilding[]];
  spinners: CyberpunkSpinner[];
  train: CyberpunkTrain;
  rain: CyberpunkRainDrop[];
  beams: CyberpunkBeam[];
}

const NEON_ACCENTS = ['#a855f7', '#ff2a85', '#fcee0a', '#c084fc'];
const ROOF_STYLES: CyberpunkRoofStyle[] = ['flat', 'spire', 'stepped', 'antenna', 'dome'];
const BILLBOARD_PATTERNS: CyberpunkBillboardPattern[] = ['bars', 'grid', 'pulse', 'holo'];

export function getCyberpunkRailY(height: number): number {
  return Math.round(height * 0.77);
}

function buildSkylineLayer(
  layer: 0 | 1 | 2,
  targetSpan: number,
  rng: () => number
): { items: CyberpunkBuilding[]; totalWidth: number } {
  const items: CyberpunkBuilding[] = [];
  let cursor = 0;

  const minW = layer === 0 ? 54 : layer === 1 ? 66 : 84;
  const maxW = layer === 0 ? 112 : layer === 1 ? 132 : 164;
  const minH = layer === 0 ? 0.34 : layer === 1 ? 0.24 : 0.11;
  const maxH = layer === 0 ? 0.64 : layer === 1 ? 0.48 : 0.22;
  const gapMax = layer === 0 ? 14 : layer === 1 ? 18 : 26;

  let idx = 0;
  while (cursor < targetSpan) {
    const w = Math.round(minW + rng() * (maxW - minW));
    const hFrac = minH + rng() * (maxH - minH);
    const accentColor = NEON_ACCENTS[(idx + layer) % NEON_ACCENTS.length];
    const roofStyle = ROOF_STYLES[Math.floor(rng() * ROOF_STYLES.length)];
    const hasBeacon = layer !== 2 ? rng() > 0.38 : rng() > 0.55;
    const windowCols = Math.max(3, Math.floor(w / (layer === 0 ? 13 : 15)));
    const windowRows = Math.max(4, Math.floor((hFrac * 100) / (layer === 2 ? 9 : 5.5)));

    let billboard: CyberpunkBillboard | undefined;
    if (layer === 1 && w >= 78 && rng() > 0.45) {
      billboard = {
        offsetXFrac: 0.14 + rng() * 0.14,
        offsetYFrac: 0.16 + rng() * 0.26,
        wFrac: 0.58 + rng() * 0.16,
        hFrac: 0.14 + rng() * 0.08,
        color: NEON_ACCENTS[(idx + 1) % NEON_ACCENTS.length],
        pattern: BILLBOARD_PATTERNS[idx % BILLBOARD_PATTERNS.length],
        phase: rng() * Math.PI * 2,
      };
    }

    items.push({
      x: cursor,
      w,
      hFrac,
      layer,
      accentColor,
      roofStyle,
      beaconPhase: rng() * Math.PI * 2,
      hasBeacon,
      windowCols,
      windowRows,
      windowSeed: Math.floor(rng() * 10000),
      billboard,
    });

    const gap = Math.round(rng() * gapMax);
    cursor += w + gap;
    idx++;
  }

  return { items, totalWidth: Math.max(1, cursor) };
}

function createSpinners(width: number, rng: () => number): CyberpunkSpinner[] {
  const narrow = width < 640;
  const count = narrow ? 9 : 16;
  const laneFracs: Record<0 | 1 | 2, [number, number]> = {
    0: [0.34, 0.46],
    1: [0.5, 0.64],
    2: [0.68, 0.84],
  };

  return Array.from({ length: count }, (_, i) => {
    const lane = (i % 3) as 0 | 1 | 2;
    const dir = i % 2 === 0 ? 1 : -1;
    const [minY, maxY] = laneFracs[lane];
    const baseSpeed = lane === 0 ? 68 : lane === 1 ? 128 : 196;
    const speedJitter = rng() * (lane === 0 ? 36 : lane === 1 ? 58 : 74);
    const trailPalette =
      dir > 0
        ? i % 3 === 0
          ? '#fcee0a'
          : '#ff2a85'
        : i % 3 === 0
          ? '#c084fc'
          : '#a855f7';

    return {
      x: rng() * width,
      yFrac: minY + rng() * (maxY - minY),
      vx: dir * (baseSpeed + speedJitter),
      length: lane === 0 ? 14 : lane === 1 ? 22 : 30,
      lane,
      bodyColor: dir > 0 ? '#271242' : '#1b0d33',
      trailColor: trailPalette,
      headlightColor: dir > 0 ? '#fef08a' : '#f5d0fe',
      phase: rng() * Math.PI * 2,
    };
  });
}

function createRain(width: number, height: number, rng: () => number): CyberpunkRainDrop[] {
  const count = width < 640 ? 34 : 64;
  return Array.from({ length: count }, (_, i) => ({
    x: rng() * width,
    y: rng() * height,
    vx: -28 - rng() * 18,
    vy: 280 + rng() * 210,
    len: 10 + rng() * 14,
    alpha: 0.12 + rng() * 0.24,
    color: i % 3 === 0 ? '#ff2a85' : '#c084fc',
  }));
}

export function createCyberpunkWorld(
  width: number,
  height: number,
  rng: () => number = Math.random
): CyberpunkWorld {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const span = Math.max(1600, safeW * 1.45);

  const l0 = buildSkylineLayer(0, span, rng);
  const l1 = buildSkylineLayer(1, span, rng);
  const l2 = buildSkylineLayer(2, span, rng);

  return {
    width: safeW,
    height: safeH,
    elapsed: 0,
    layerOffsets: [0, 0, 0],
    layerWidths: [l0.totalWidth, l1.totalWidth, l2.totalWidth],
    layerSpeeds: [14, 28, 48],
    buildings: [l0.items, l1.items, l2.items],
    spinners: createSpinners(safeW, rng),
    train: {
      x: -240,
      speed: safeW < 640 ? 220 : 310,
      carCount: safeW < 640 ? 4 : 6,
      carW: safeW < 640 ? 36 : 48,
      gap: 6,
      accentColor: '#ff2a85',
      cooldown: 0,
    },
    rain: createRain(safeW, safeH, rng),
    beams: [
      {
        xFrac: 0.18,
        angleBase: -0.26,
        swingAmp: 0.22,
        swingSpeed: 0.42,
        phase: 0.3,
        color: '#a855f7',
        width: 58,
      },
      {
        xFrac: 0.54,
        angleBase: 0.18,
        swingAmp: 0.2,
        swingSpeed: 0.34,
        phase: 2.1,
        color: '#ff2a85',
        width: 52,
      },
      {
        xFrac: 0.84,
        angleBase: -0.14,
        swingAmp: 0.24,
        swingSpeed: 0.48,
        phase: 4.0,
        color: '#a855f7',
        width: 64,
      },
    ],
  };
}

export function resizeCyberpunkWorld(
  world: CyberpunkWorld,
  width: number,
  height: number,
  rng: () => number = Math.random
): void {
  const next = createCyberpunkWorld(width, height, rng);
  world.width = next.width;
  world.height = next.height;
  world.layerWidths = next.layerWidths;
  world.layerOffsets = [
    world.layerOffsets[0] % next.layerWidths[0],
    world.layerOffsets[1] % next.layerWidths[1],
    world.layerOffsets[2] % next.layerWidths[2],
  ];
  world.buildings = next.buildings;
  world.spinners = next.spinners;
  world.train.speed = next.train.speed;
  world.train.carCount = next.train.carCount;
  world.train.carW = next.train.carW;
  world.rain = next.rain;
}

export function stepCyberpunkWorld(
  world: CyberpunkWorld,
  dt: number,
  reducedMotion = false,
  rng: () => number = Math.random
): void {
  if (reducedMotion || dt <= 0) return;

  const clampedDt = Math.min(0.1, dt);
  world.elapsed += clampedDt;

  // 1. Scroll 3 parallax skyline layers smoothly
  for (let i = 0; i < 3; i++) {
    const span = Math.max(1, world.layerWidths[i]);
    world.layerOffsets[i] = (world.layerOffsets[i] + world.layerSpeeds[i] * clampedDt) % span;
  }

  // 2. Move flying cyber vehicles across horizontal sky lanes
  for (const s of world.spinners) {
    s.x += s.vx * clampedDt;
    const pad = s.length * 4 + 40;
    if (s.vx > 0 && s.x > world.width + pad) {
      s.x = -pad;
    } else if (s.vx < 0 && s.x < -pad) {
      s.x = world.width + pad;
    }
  }

  // 3. Advance elevated monorail cyber-train
  const trainLen = world.train.carCount * (world.train.carW + world.train.gap);
  if (world.train.cooldown > 0) {
    world.train.cooldown = Math.max(0, world.train.cooldown - clampedDt);
  } else {
    world.train.x += world.train.speed * clampedDt;
    if (world.train.x - trainLen > world.width + 80) {
      world.train.x = -120;
      world.train.cooldown = 1.4 + rng() * 1.8;
      world.train.accentColor = rng() > 0.5 ? '#ff2a85' : '#a855f7';
    }
  }

  // 4. Advance neon cyber rain droplets
  for (const r of world.rain) {
    r.x += r.vx * clampedDt;
    r.y += r.vy * clampedDt;
    if (r.y > world.height + 24) {
      r.y = -20;
      r.x = rng() * (world.width + 80);
    }
    if (r.x < -30) {
      r.x = world.width + 20;
    }
  }
}
