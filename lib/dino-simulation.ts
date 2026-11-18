export type DinoRole = 'flyer' | 'runner';

export type DinoState =
  | 'ground-run'
  | 'ground-jump'
  | 'ground-trip'
  | 'fly-launch'
  | 'fly-soar'
  | 'fly-bonk'
  | 'fly-fall'
  | 'fallen'
  | 'recover';

export interface DinoActor {
  id: number;
  role: DinoRole;
  state: DinoState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  stateTimer: number;
  runCooldown: number;
  tripCooldown: number;
  hitCloudId: number | null;
  shade: string;
  bellyShade: string;
  stridePhase: number;
  rotTurns: number;
}

export interface DinoCloud {
  id: number;
  x: number;
  y: number;
  vx: number;
  scale: number;
  shakeTimer: number;
}

export interface DinoCactus {
  id: number;
  x: number;
  variant: 'small' | 'tall' | 'cluster';
  shakeTimer: number;
  vx: number;
}

export interface DinoDustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  shade: string;
}

export interface DinoWorld {
  width: number;
  height: number;
  unit: number;
  groundY: number;
  scrollOffset: number;
  swapTimer: number;
  dinos: DinoActor[];
  clouds: DinoCloud[];
  cacti: DinoCactus[];
  dust: DinoDustParticle[];
}

const DINO_PALETTES = [
  { shade: '#3f3f46', bellyShade: '#d4d4d8' },
  { shade: '#52525b', bellyShade: '#e4e4e7' },
  { shade: '#27272a', bellyShade: '#d4d4d8' },
  { shade: '#6b7280', bellyShade: '#f4f4f5' },
];

export function getDinoMetrics(width: number, height: number) {
  const narrow = width < 640;
  const unit = narrow ? 3 : 4;
  const groundY = Math.round((height * (narrow ? 0.87 : 0.86)) / unit) * unit;
  return { narrow, unit, groundY };
}

function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function pickCloudTargetY(height: number, groundY: number, rng: () => number): number {
  const minY = Math.max(48, height * 0.14);
  const maxY = Math.max(minY + 24, Math.min(groundY - 96, height * 0.44));
  return randRange(rng, minY, maxY);
}

function spawnDustBurst(
  world: DinoWorld,
  x: number,
  y: number,
  count: number,
  rng: () => number,
  spreadY = 1
) {
  const shades = ['#71717a', '#9ca3af', '#52525b', '#d4d4d8'];
  for (let i = 0; i < count; i++) {
    if (world.dust.length >= 64) world.dust.shift();
    const angle = randRange(rng, -Math.PI, 0);
    const speed = randRange(rng, 26, 76);
    const life = randRange(rng, 0.28, 0.58);
    world.dust.push({
      x: x + randRange(rng, -world.unit * 3, world.unit * 3),
      y: y + randRange(rng, -world.unit * 2, world.unit * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * spreadY,
      life,
      maxLife: life,
      size: rng() > 0.45 ? world.unit : world.unit * 1.5,
      shade: shades[Math.floor(rng() * shades.length)],
    });
  }
}

export function createDinoWorld(
  width: number,
  height: number,
  rng: () => number = Math.random
): DinoWorld {
  const safeW = Math.max(320, width);
  const safeH = Math.max(240, height);
  const { unit, groundY } = getDinoMetrics(safeW, safeH);

  const roleIndices = [0, 1, 2, 3];
  for (let i = roleIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [roleIndices[i], roleIndices[j]] = [roleIndices[j], roleIndices[i]];
  }
  const flyerSet = new Set([roleIndices[0], roleIndices[1]]);

  const clouds: DinoCloud[] = [0.16, 0.38, 0.62, 0.84].map((rx, idx) => ({
    id: idx + 1,
    x: safeW * rx + randRange(rng, -24, 24),
    y: pickCloudTargetY(safeH, groundY, rng),
    vx: (idx % 2 === 0 ? 1 : -1) * randRange(rng, 14, 26),
    scale: randRange(rng, 0.9, 1.25),
    shakeTimer: 0,
  }));

  const variants: Array<'small' | 'tall' | 'cluster'> = ['small', 'tall', 'cluster', 'small'];
  const cacti: DinoCactus[] = [0.22, 0.48, 0.74, 0.91].map((rx, idx) => ({
    id: idx + 1,
    x: safeW * rx + randRange(rng, -18, 18),
    variant: variants[Math.floor(rng() * variants.length)],
    shakeTimer: 0,
    vx: randRange(rng, -22, -12),
  }));

  const dinos: DinoActor[] = [0, 1, 2, 3].map((id) => {
    const isFlyer = flyerSet.has(id);
    const dir: 1 | -1 = rng() > 0.5 ? 1 : -1;
    const speed = randRange(rng, 92, 138);
    const palette = DINO_PALETTES[id % DINO_PALETTES.length];
    const startX = safeW * (0.14 + id * 0.23) + randRange(rng, -20, 20);
    const startFlyY = isFlyer
      ? pickCloudTargetY(safeH, groundY, rng)
      : groundY;

    return {
      id,
      role: isFlyer ? 'flyer' : 'runner',
      state: isFlyer ? 'fly-soar' : 'ground-run',
      x: Math.max(36, Math.min(safeW - 36, startX)),
      y: startFlyY,
      vx: dir * speed,
      vy: 0,
      dir,
      stateTimer: randRange(rng, 0.6, 1.6),
      runCooldown: randRange(rng, 0.35, 1.1),
      tripCooldown: randRange(rng, 1.4, 3.0),
      hitCloudId: null,
      shade: palette.shade,
      bellyShade: palette.bellyShade,
      stridePhase: randRange(rng, 0, Math.PI * 2),
      rotTurns: 0,
    };
  });

  return {
    width: safeW,
    height: safeH,
    unit,
    groundY,
    scrollOffset: 0,
    swapTimer: randRange(rng, 4.2, 6.8),
    dinos,
    clouds,
    cacti,
    dust: [],
  };
}

export function resizeDinoWorld(
  world: DinoWorld,
  width: number,
  height: number,
  rng: () => number = Math.random
) {
  const safeW = Math.max(320, width);
  const safeH = Math.max(240, height);
  const prevW = world.width || safeW;
  const prevGroundY = world.groundY || safeH * 0.86;
  const { unit, groundY } = getDinoMetrics(safeW, safeH);

  world.width = safeW;
  world.height = safeH;
  world.unit = unit;
  world.groundY = groundY;

  for (const cl of world.clouds) {
    cl.x = Math.max(20, Math.min(safeW - 20, (cl.x / prevW) * safeW));
    cl.y = pickCloudTargetY(safeH, groundY, rng);
  }
  for (const c of world.cacti) {
    c.x = Math.max(24, Math.min(safeW - 24, (c.x / prevW) * safeW));
  }
  for (const d of world.dinos) {
    d.x = Math.max(36, Math.min(safeW - 36, (d.x / prevW) * safeW));
    if (d.state === 'ground-run' || d.state === 'fallen' || d.state === 'recover') {
      d.y = groundY;
    } else {
      const offsetFromGround = prevGroundY - d.y;
      d.y = Math.max(40, Math.min(groundY, groundY - offsetFromGround));
    }
  }
}

export function rotateDinoRoles(
  world: DinoWorld,
  rng: () => number = Math.random
): boolean {
  const eligibleFlyers = world.dinos.filter(
    (d) =>
      d.role === 'flyer' &&
      (d.state === 'ground-run' || d.state === 'fly-soar' || d.state === 'recover')
  );
  const eligibleRunners = world.dinos.filter(
    (d) => d.role === 'runner' && d.state === 'ground-run'
  );
  if (eligibleFlyers.length === 0 || eligibleRunners.length === 0) {
    return false;
  }

  const flyerIdx = Math.floor(rng() * eligibleFlyers.length);
  const runnerIdx = Math.floor(rng() * eligibleRunners.length);
  const toRunner = eligibleFlyers[flyerIdx];
  const toFlyer = eligibleRunners[runnerIdx];

  toRunner.role = 'runner';
  if (toRunner.state === 'fly-soar' || toRunner.state === 'fly-launch') {
    toRunner.state = 'fly-fall';
    toRunner.vy = Math.max(40, toRunner.vy);
  }

  toFlyer.role = 'flyer';
  toFlyer.runCooldown = randRange(rng, 0.3, 0.8);
  toFlyer.state = 'fly-launch';
  toFlyer.vy = -randRange(rng, 220, 290);
  toFlyer.stateTimer = randRange(rng, 0.65, 1.05);
  spawnDustBurst(world, toFlyer.x, world.groundY, 5, rng);

  return true;
}

export function stepDinoWorld(
  world: DinoWorld,
  dt: number,
  rng: () => number = Math.random
) {
  if (dt <= 0) return;
  const clampedDt = Math.min(0.08, dt);
  const { width, height, unit, groundY } = world;
  const minX = Math.max(28, unit * 8);
  const maxX = Math.max(minX + 40, width - unit * 8);

  world.scrollOffset = (world.scrollOffset + 115 * clampedDt) % (unit * 48);

  // Move & wrap pixel clouds
  for (const cl of world.clouds) {
    cl.x += cl.vx * clampedDt;
    if (cl.shakeTimer > 0) cl.shakeTimer = Math.max(0, cl.shakeTimer - clampedDt);
    if (cl.x > width + 90) {
      cl.x = -90;
      cl.y = pickCloudTargetY(height, groundY, rng);
    } else if (cl.x < -90) {
      cl.x = width + 90;
      cl.y = pickCloudTargetY(height, groundY, rng);
    }
  }

  // Move & recycle pixel cacti along the ground track
  for (const c of world.cacti) {
    c.x += c.vx * clampedDt;
    if (c.shakeTimer > 0) c.shakeTimer = Math.max(0, c.shakeTimer - clampedDt);
    if (c.x < -48) {
      c.x = width + randRange(rng, 30, 110);
      const v: Array<'small' | 'tall' | 'cluster'> = ['small', 'tall', 'cluster'];
      c.variant = v[Math.floor(rng() * v.length)];
    }
  }

  // Periodic role swap ("bergantian") between flyer and runner dinos
  world.swapTimer -= clampedDt;
  if (world.swapTimer <= 0) {
    rotateDinoRoles(world, rng);
    world.swapTimer = randRange(rng, 4.5, 7.5);
  }

  // Update each of the 4 dinos
  for (const d of world.dinos) {
    d.stridePhase += clampedDt * 12;
    if (d.tripCooldown > 0) d.tripCooldown = Math.max(0, d.tripCooldown - clampedDt);

    const bounceHorizontal = () => {
      if (d.x >= maxX) {
        d.x = maxX;
        d.dir = -1;
        d.vx = -Math.abs(d.vx);
      } else if (d.x <= minX) {
        d.x = minX;
        d.dir = 1;
        d.vx = Math.abs(d.vx);
      }
    };

    switch (d.state) {
      case 'ground-run': {
        d.y = groundY;
        d.x += d.vx * clampedDt;
        bounceHorizontal();

        // Occasional random direction flip while running
        if (rng() < 0.08 * clampedDt) {
          d.dir = d.dir === 1 ? -1 : 1;
          d.vx = d.dir * randRange(rng, 92, 145);
        }

        if (d.role === 'flyer') {
          d.runCooldown -= clampedDt;
          if (d.runCooldown <= 0) {
            d.state = 'fly-launch';
            d.vy = -randRange(rng, 220, 300);
            d.stateTimer = randRange(rng, 0.55, 0.95);
            spawnDustBurst(world, d.x, groundY, 5, rng);
          }
          break;
        }

        // Runner: look ahead for a cactus to jump over or occasionally trip on
        let nearest: DinoCactus | null = null;
        let nearestDist = Infinity;
        for (const c of world.cacti) {
          const dx = (c.x - d.x) * d.dir;
          if (dx > unit * 2 && dx < unit * 24 && dx < nearestDist) {
            nearestDist = dx;
            nearest = c;
          }
        }

        if (nearest) {
          const cactusCollisionDist = unit * 9;
          const willTrip = d.tripCooldown <= 0 && rng() < 0.28;
          if (willTrip && nearestDist <= cactusCollisionDist) {
            // Trips / stumbles over the cactus ("kesandung")
            d.state = 'ground-trip';
            d.vy = -randRange(rng, 115, 165);
            d.vx = d.dir * randRange(rng, 85, 115);
            d.stateTimer = 0.35;
            d.tripCooldown = randRange(rng, 2.5, 4.5);
            nearest.shakeTimer = 0.45;
            spawnDustBurst(world, d.x, groundY - unit * 2, 7, rng);
          } else if (!willTrip && nearestDist <= unit * 18) {
            // Clean Chrome Dino jump over cactus
            d.state = 'ground-jump';
            d.vy = -randRange(rng, 290, 360);
            spawnDustBurst(world, d.x, groundY, 4, rng);
          }
        } else if (rng() < 0.14 * clampedDt) {
          // Random playful hop on flat ground
          d.state = 'ground-jump';
          d.vy = -randRange(rng, 240, 300);
        }
        break;
      }

      case 'ground-jump': {
        d.x += d.vx * clampedDt;
        bounceHorizontal();
        d.vy += 880 * clampedDt;
        d.y += d.vy * clampedDt;

        // Check mid-jump accidental clip if falling onto a tall cactus
        if (d.vy > 0 && d.tripCooldown <= 0) {
          for (const c of world.cacti) {
            const cactusTop = groundY - (c.variant === 'tall' ? unit * 11 : unit * 8);
            if (Math.abs(d.x - c.x) < unit * 5 && d.y >= cactusTop && rng() < 0.12) {
              d.state = 'ground-trip';
              d.vy = -120;
              d.tripCooldown = randRange(rng, 2.5, 4.5);
              c.shakeTimer = 0.45;
              spawnDustBurst(world, c.x, cactusTop, 6, rng);
              break;
            }
          }
        }

        if (d.y >= groundY) {
          d.y = groundY;
          d.vy = 0;
          d.state = 'ground-run';
          spawnDustBurst(world, d.x, groundY, 3, rng);
        }
        break;
      }

      case 'ground-trip': {
        d.x += d.vx * 0.72 * clampedDt;
        bounceHorizontal();
        d.vy += 840 * clampedDt;
        d.y += d.vy * clampedDt;
        d.rotTurns += clampedDt * 4.5;
        if (d.y >= groundY) {
          d.y = groundY;
          d.vy = 0;
          d.state = 'fallen';
          d.stateTimer = randRange(rng, 0.75, 1.15);
          spawnDustBurst(world, d.x, groundY, 8, rng);
        }
        break;
      }

      case 'fly-launch': {
        d.x += d.vx * clampedDt;
        bounceHorizontal();
        d.vy = Math.max(-180, d.vy * 0.96 - 18 * clampedDt);
        d.y += d.vy * clampedDt;
        d.stateTimer -= clampedDt;
        const minSky = Math.max(44, height * 0.14);
        if (d.y <= minSky || d.stateTimer <= 0) {
          d.y = Math.max(minSky, d.y);
          d.vy = randRange(rng, -28, 28);
          d.state = 'fly-soar';
          d.stateTimer = randRange(rng, 2.4, 4.8);
          d.hitCloudId = null;
        }
        break;
      }

      case 'fly-soar': {
        // Seek/fly playfully toward a cloud lane so cloud collisions happen frequently
        let targetCloud = world.clouds[0];
        let bestScore = Infinity;
        for (const cl of world.clouds) {
          const ahead = (cl.x - d.x) * d.dir;
          const dist = (ahead >= -20 ? ahead : ahead + width) + Math.abs(cl.y - d.y) * 0.5;
          if (dist < bestScore) {
            bestScore = dist;
            targetCloud = cl;
          }
        }

        if (targetCloud) {
          const dy = targetCloud.y - d.y;
          d.vy += Math.max(-180, Math.min(180, dy * 2.4)) * clampedDt;
          d.vy *= 0.96;
        }
        d.x += d.vx * 1.08 * clampedDt;
        d.y += d.vy * clampedDt;
        bounceHorizontal();

        const minSky = Math.max(42, height * 0.12);
        const maxSky = Math.max(minSky + 30, groundY - unit * 18);
        if (d.y < minSky) {
          d.y = minSky;
          d.vy = Math.abs(d.vy);
        } else if (d.y > maxSky) {
          d.y = maxSky;
          d.vy = -Math.abs(d.vy);
        }

        // Check collision with any pixel cloud ("menabrak awan")
        for (const cl of world.clouds) {
          const hitW = unit * 9 * cl.scale;
          const hitH = unit * 6 * cl.scale;
          if (Math.abs(d.x - cl.x) < hitW && Math.abs(d.y - cl.y) < hitH) {
            d.state = 'fly-bonk';
            d.hitCloudId = cl.id;
            d.stateTimer = 0.28;
            d.vx = -d.dir * randRange(rng, 32, 56);
            d.vy = -35;
            cl.shakeTimer = 0.45;
            spawnDustBurst(world, d.x, d.y, 9, rng, 1.4);
            break;
          }
        }

        d.stateTimer -= clampedDt;
        if (d.state === 'fly-soar' && d.stateTimer <= 0) {
          // Even if missed clouds briefly, veer down or bonk-tumble on random play
          d.state = 'fly-fall';
          d.vy = 40;
        }
        break;
      }

      case 'fly-bonk': {
        d.stateTimer -= clampedDt;
        d.x += d.vx * 0.6 * clampedDt;
        bounceHorizontal();
        if (d.stateTimer <= 0) {
          d.state = 'fly-fall';
          d.vy = 20;
          d.rotTurns = 0;
        }
        break;
      }

      case 'fly-fall': {
        d.x += d.vx * 0.75 * clampedDt;
        bounceHorizontal();
        d.vy += 860 * clampedDt;
        d.y += d.vy * clampedDt;
        d.rotTurns += clampedDt * 5.2;
        if (d.y >= groundY) {
          d.y = groundY;
          d.vy = 0;
          d.state = 'fallen';
          d.stateTimer = randRange(rng, 0.75, 1.2);
          spawnDustBurst(world, d.x, groundY, 9, rng);
        }
        break;
      }

      case 'fallen': {
        d.y = groundY;
        d.stateTimer -= clampedDt;
        if (d.stateTimer <= 0) {
          d.state = 'recover';
          d.stateTimer = randRange(rng, 0.36, 0.52);
          d.rotTurns = 0;
        }
        break;
      }

      case 'recover': {
        d.y = groundY;
        d.stateTimer -= clampedDt;
        if (d.stateTimer <= 0) {
          const speed = randRange(rng, 92, 140);
          d.dir = rng() > 0.5 ? 1 : -1;
          d.vx = d.dir * speed;
          d.state = 'ground-run';
          d.runCooldown = randRange(rng, 0.4, 1.0);
          spawnDustBurst(world, d.x, groundY, 4, rng);
        }
        break;
      }
    }
  }

  // Update pixel dust puffs
  for (let i = world.dust.length - 1; i >= 0; i--) {
    const p = world.dust[i];
    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.vy += 120 * clampedDt;
    p.life -= clampedDt;
    if (p.life <= 0) {
      world.dust.splice(i, 1);
    }
  }
}
