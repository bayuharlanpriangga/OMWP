export interface ZodiacStarPoint {
  x: number; // Normalized [-1, 1] local constellation coordinate
  y: number;
  mag: number; // Brightness weight [0.4, 1]
}

export interface ZodiacConstellationDef {
  id: string;
  name: string;
  element: 'IGNIS' | 'TERRA' | 'AER' | 'AQUA';
  symbol: string;
  stars: ZodiacStarPoint[];
  edges: Array<[number, number]>;
}

export interface SkyStar {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  tint: string;
}

export interface PlanetBody {
  id: string;
  name: string;
  orbitRatio: number; // Fraction of wheelRadius
  angle: number;
  angularSpeed: number; // rad/s
  radius: number;
  color: string;
  hasRing?: boolean;
}

export interface CelestialAspect {
  planetA: string;
  planetB: string;
  kind: 'conjunction' | 'sextile' | 'trine';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strength: number; // 0..1
}

export interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface ZodiacWorld {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  wheelRadius: number;
  elapsed: number;
  wheelAngle: number;
  innerRingAngle: number;
  activeHouseIndex: number;
  houseTimer: number;
  houseDuration: number;
  stars: SkyStar[];
  planets: PlanetBody[];
  aspects: CelestialAspect[];
  meteors: ShootingStar[];
}

export const ZODIAC_CONSTELLATIONS: ZodiacConstellationDef[] = [
  {
    id: 'aries',
    name: 'ARIES',
    element: 'IGNIS',
    symbol: '♈',
    stars: [
      { x: -0.62, y: -0.22, mag: 0.95 },
      { x: -0.1, y: -0.05, mag: 0.85 },
      { x: 0.38, y: 0.14, mag: 0.72 },
      { x: 0.62, y: 0.34, mag: 0.62 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    id: 'taurus',
    name: 'TAURUS',
    element: 'TERRA',
    symbol: '♉',
    stars: [
      { x: -0.68, y: -0.45, mag: 0.72 },
      { x: -0.15, y: -0.08, mag: 0.98 }, // Aldebaran
      { x: -0.24, y: 0.22, mag: 0.68 },
      { x: 0.08, y: 0.26, mag: 0.7 },
      { x: 0.56, y: -0.35, mag: 0.82 },
      { x: 0.68, y: 0.16, mag: 0.75 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 1],
      [1, 4],
      [3, 5],
    ],
  },
  {
    id: 'gemini',
    name: 'GEMINI',
    element: 'AER',
    symbol: '♊',
    stars: [
      { x: -0.36, y: -0.64, mag: 0.96 }, // Castor
      { x: 0.32, y: -0.58, mag: 0.98 }, // Pollux
      { x: -0.28, y: -0.1, mag: 0.75 },
      { x: 0.26, y: -0.04, mag: 0.78 },
      { x: -0.42, y: 0.52, mag: 0.74 },
      { x: 0.36, y: 0.58, mag: 0.76 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [2, 4],
      [1, 3],
      [3, 5],
      [2, 3],
    ],
  },
  {
    id: 'cancer',
    name: 'CANCER',
    element: 'AQUA',
    symbol: '♋',
    stars: [
      { x: -0.05, y: -0.62, mag: 0.72 },
      { x: 0.02, y: -0.04, mag: 0.88 },
      { x: -0.44, y: 0.48, mag: 0.74 },
      { x: 0.46, y: 0.44, mag: 0.76 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
    ],
  },
  {
    id: 'leo',
    name: 'LEO',
    element: 'IGNIS',
    symbol: '♌',
    stars: [
      { x: -0.45, y: -0.58, mag: 0.72 },
      { x: -0.64, y: -0.28, mag: 0.8 },
      { x: -0.42, y: -0.04, mag: 0.84 },
      { x: -0.38, y: 0.42, mag: 1.0 }, // Regulus
      { x: 0.28, y: 0.34, mag: 0.78 },
      { x: 0.34, y: -0.06, mag: 0.82 },
      { x: 0.7, y: 0.14, mag: 0.92 }, // Denebola
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 2],
      [5, 6],
      [4, 6],
    ],
  },
  {
    id: 'virgo',
    name: 'VIRGO',
    element: 'TERRA',
    symbol: '♍',
    stars: [
      { x: -0.6, y: -0.24, mag: 0.74 },
      { x: -0.18, y: -0.14, mag: 0.82 },
      { x: 0.18, y: -0.46, mag: 0.76 },
      { x: 0.18, y: 0.14, mag: 0.85 },
      { x: -0.24, y: 0.56, mag: 1.0 }, // Spica
      { x: 0.62, y: 0.28, mag: 0.72 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
    ],
  },
  {
    id: 'libra',
    name: 'LIBRA',
    element: 'AER',
    symbol: '♎',
    stars: [
      { x: 0.0, y: -0.58, mag: 0.92 },
      { x: -0.52, y: -0.04, mag: 0.88 },
      { x: 0.52, y: -0.04, mag: 0.84 },
      { x: -0.36, y: 0.54, mag: 0.72 },
      { x: 0.38, y: 0.52, mag: 0.74 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
    ],
  },
  {
    id: 'scorpius',
    name: 'SCORPIUS',
    element: 'AQUA',
    symbol: '♏',
    stars: [
      { x: -0.58, y: -0.46, mag: 0.82 },
      { x: -0.44, y: -0.16, mag: 0.78 },
      { x: -0.2, y: -0.22, mag: 1.0 }, // Antares
      { x: -0.02, y: 0.12, mag: 0.76 },
      { x: 0.14, y: 0.52, mag: 0.74 },
      { x: 0.48, y: 0.54, mag: 0.82 },
      { x: 0.58, y: 0.24, mag: 0.86 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    id: 'sagittarius',
    name: 'SAGITTARIUS',
    element: 'IGNIS',
    symbol: '♐',
    stars: [
      { x: -0.46, y: -0.14, mag: 0.84 },
      { x: -0.04, y: -0.54, mag: 0.88 },
      { x: 0.04, y: -0.06, mag: 0.92 },
      { x: 0.48, y: -0.22, mag: 0.8 },
      { x: 0.42, y: 0.34, mag: 0.82 },
      { x: -0.22, y: 0.42, mag: 0.76 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 2],
    ],
  },
  {
    id: 'capricornus',
    name: 'CAPRICORNUS',
    element: 'TERRA',
    symbol: '♑',
    stars: [
      { x: -0.62, y: -0.32, mag: 0.88 },
      { x: -0.04, y: -0.18, mag: 0.76 },
      { x: 0.6, y: -0.36, mag: 0.9 },
      { x: 0.28, y: 0.22, mag: 0.8 },
      { x: -0.16, y: 0.44, mag: 0.78 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
  {
    id: 'aquarius',
    name: 'AQUARIUS',
    element: 'AER',
    symbol: '♒',
    stars: [
      { x: -0.54, y: -0.34, mag: 0.85 },
      { x: -0.18, y: -0.46, mag: 0.88 },
      { x: 0.14, y: -0.1, mag: 0.8 },
      { x: 0.56, y: -0.18, mag: 0.76 },
      { x: -0.12, y: 0.36, mag: 0.74 },
      { x: 0.42, y: 0.48, mag: 0.82 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
      [4, 5],
    ],
  },
  {
    id: 'pisces',
    name: 'PISCES',
    element: 'AQUA',
    symbol: '♓',
    stars: [
      { x: -0.56, y: -0.42, mag: 0.78 },
      { x: -0.32, y: -0.02, mag: 0.74 },
      { x: -0.06, y: 0.48, mag: 0.9 }, // Alrescha vertex
      { x: 0.34, y: 0.16, mag: 0.76 },
      { x: 0.58, y: -0.24, mag: 0.84 },
      { x: 0.42, y: -0.44, mag: 0.76 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 3],
    ],
  },
];

export function getZodiacLayout(width: number, height: number) {
  const narrow = width < 640;
  const centerX = narrow ? width * 0.5 : width * 0.72;
  const centerY = narrow ? height * 0.46 : height * 0.44;
  const wheelRadius = narrow
    ? Math.max(124, Math.min(width * 0.38, height * 0.24))
    : Math.max(190, Math.min(width * 0.26, height * 0.38));
  return { narrow, centerX, centerY, wheelRadius };
}

function createStarfield(
  width: number,
  height: number,
  rng: () => number
): SkyStar[] {
  const count = width < 640 ? 95 : 170;
  const tints = ['#faf6eb', '#e5c158', '#cbd5e1', '#fef3c7', '#93c5fd'];
  return Array.from({ length: count }, (_, i) => ({
    x: rng() * width,
    y: rng() * height,
    r: i % 11 === 0 ? 1.85 : i % 3 === 0 ? 1.25 : 0.75,
    baseAlpha: 0.35 + rng() * 0.55,
    phase: rng() * Math.PI * 2,
    speed: 0.8 + rng() * 1.9,
    tint: tints[i % tints.length],
  }));
}

function createPlanets(rng: () => number): PlanetBody[] {
  return [
    {
      id: 'sol',
      name: 'Sol',
      orbitRatio: 0.28,
      angle: rng() * Math.PI * 2,
      angularSpeed: 0.18,
      radius: 6.5,
      color: '#fde047',
    },
    {
      id: 'luna',
      name: 'Luna',
      orbitRatio: 0.4,
      angle: rng() * Math.PI * 2,
      angularSpeed: -0.27,
      radius: 4.5,
      color: '#f8fafc',
    },
    {
      id: 'venus',
      name: 'Venus',
      orbitRatio: 0.52,
      angle: rng() * Math.PI * 2,
      angularSpeed: 0.13,
      radius: 4.4,
      color: '#e5c158',
    },
    {
      id: 'mars',
      name: 'Mars',
      orbitRatio: 0.64,
      angle: rng() * Math.PI * 2,
      angularSpeed: 0.095,
      radius: 4.2,
      color: '#e07a5f',
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      orbitRatio: 0.74,
      angle: rng() * Math.PI * 2,
      angularSpeed: 0.058,
      radius: 5.8,
      color: '#d4a373',
      hasRing: true,
    },
  ];
}

export function computePlanetaryAspects(world: ZodiacWorld): CelestialAspect[] {
  const out: CelestialAspect[] = [];
  const { centerX, centerY, wheelRadius, planets } = world;
  const targets: Array<{ deg: number; kind: CelestialAspect['kind']; orb: number }> = [
    { deg: 0, kind: 'conjunction', orb: 14 },
    { deg: 60, kind: 'sextile', orb: 10 },
    { deg: 120, kind: 'trine', orb: 12 },
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      const rawDeg = (Math.abs(a.angle - b.angle) * 180) / Math.PI;
      const wrapped = rawDeg % 360;
      const diffDeg = wrapped > 180 ? 360 - wrapped : wrapped;

      for (const target of targets) {
        const delta = Math.abs(diffDeg - target.deg);
        if (delta <= target.orb) {
          const ra = a.orbitRatio * wheelRadius;
          const rb = b.orbitRatio * wheelRadius;
          out.push({
            planetA: a.id,
            planetB: b.id,
            kind: target.kind,
            x1: centerX + Math.cos(a.angle) * ra,
            y1: centerY + Math.sin(a.angle) * ra,
            x2: centerX + Math.cos(b.angle) * rb,
            y2: centerY + Math.sin(b.angle) * rb,
            strength: Math.max(0.15, 1 - delta / target.orb),
          });
          break;
        }
      }
    }
  }
  return out;
}

export function createZodiacWorld(
  width: number,
  height: number,
  rng: () => number = Math.random
): ZodiacWorld {
  const safeW = Math.max(320, width);
  const safeH = Math.max(240, height);
  const { centerX, centerY, wheelRadius } = getZodiacLayout(safeW, safeH);

  const world: ZodiacWorld = {
    width: safeW,
    height: safeH,
    centerX,
    centerY,
    wheelRadius,
    elapsed: 0,
    wheelAngle: rng() * Math.PI * 2,
    innerRingAngle: rng() * Math.PI * 2,
    activeHouseIndex: Math.floor(rng() * ZODIAC_CONSTELLATIONS.length),
    houseTimer: 0,
    houseDuration: 6.5,
    stars: createStarfield(safeW, safeH, rng),
    planets: createPlanets(rng),
    aspects: [],
    meteors: [],
  };
  world.aspects = computePlanetaryAspects(world);
  return world;
}

export function resizeZodiacWorld(
  world: ZodiacWorld,
  width: number,
  height: number,
  rng: () => number = Math.random
) {
  const safeW = Math.max(320, width);
  const safeH = Math.max(240, height);
  const { centerX, centerY, wheelRadius } = getZodiacLayout(safeW, safeH);
  world.width = safeW;
  world.height = safeH;
  world.centerX = centerX;
  world.centerY = centerY;
  world.wheelRadius = wheelRadius;
  world.stars = createStarfield(safeW, safeH, rng);
  world.aspects = computePlanetaryAspects(world);
}

export function stepZodiacWorld(
  world: ZodiacWorld,
  dt: number,
  rng: () => number = Math.random
) {
  if (dt <= 0) return;
  const clampedDt = Math.min(0.08, dt);
  world.elapsed += clampedDt;
  world.wheelAngle = (world.wheelAngle + 0.036 * clampedDt) % (Math.PI * 2);
  world.innerRingAngle = (world.innerRingAngle - 0.052 * clampedDt) % (Math.PI * 2);

  world.houseTimer += clampedDt;
  if (world.houseTimer >= world.houseDuration) {
    world.houseTimer -= world.houseDuration;
    world.activeHouseIndex =
      (world.activeHouseIndex + 1) % ZODIAC_CONSTELLATIONS.length;
  }

  for (const s of world.stars) {
    s.x -= 4.5 * clampedDt;
    if (s.x < -4) s.x = world.width + 4;
  }

  for (const p of world.planets) {
    p.angle = (p.angle + p.angularSpeed * clampedDt) % (Math.PI * 2);
  }
  world.aspects = computePlanetaryAspects(world);

  // Occasional subtle golden shooting star
  if (world.meteors.length < 2 && rng() < 0.22 * clampedDt) {
    world.meteors.push({
      x: rng() * world.width * 0.72,
      y: rng() * world.height * 0.36,
      vx: 220 + rng() * 140,
      vy: 85 + rng() * 65,
      life: 0.75,
      maxLife: 0.75,
    });
  }

  for (let i = world.meteors.length - 1; i >= 0; i--) {
    const m = world.meteors[i];
    m.x += m.vx * clampedDt;
    m.y += m.vy * clampedDt;
    m.life -= clampedDt;
    if (m.life <= 0) {
      world.meteors.splice(i, 1);
    }
  }
}
