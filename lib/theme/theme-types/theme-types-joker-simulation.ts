export type JokerCardRank = 'JOKER' | 'A' | 'K' | 'Q' | 'J';
export type JokerCardSuit = 'jester' | 'spade' | 'heart' | 'club' | 'diamond';
export type JokerStagePhase = 'idle' | 'vortex' | 'explode' | 'decelerate';

export interface JokerCardSpec {
  rank: JokerCardRank;
  suit: JokerCardSuit;
  label: string;
  accent: string;
  isWild: boolean;
}

export interface JokerBouncingCard {
  id: number;
  specIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  angularVel: number;
  targetSpeed: number;
  flipPhase: number;
  flipSpeed: number;
  depth: number;
  orbitOffset: number;
}

export interface JokerLaughEcho {
  id: number;
  text: string;
  xFrac: number;
  yFrac: number;
  baseAngle: number;
  fontSize: number;
  vy: number;
  driftAmp: number;
  phase: number;
  speed: number;
  alpha: number;
  color: string;
}

export interface JokerConfetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  spinSpeed: number;
  phase: number;
  alpha: number;
  kind: 'diamond' | 'spark';
  color: string;
}

export interface JokerSpotlight {
  originXFrac: number;
  baseAngle: number;
  sweepAmp: number;
  sweepSpeed: number;
  phase: number;
  widthRad: number;
  alpha: number;
  color: string;
}

export interface JokerWorld {
  width: number;
  height: number;
  elapsed: number;
  centerX: number;
  centerY: number;
  vortexRadius: number;
  phase: JokerStagePhase;
  phaseTimer: number;
  idleDuration: number;
  vortexDuration: number;
  explodeDuration: number;
  decelDuration: number;
  vortexSpinAngle: number;
  spotlightIntensity: number;
  blackoutOpacity: number;
  jokerFaceAlpha: number;
  jokerFaceScale: number;
  explosionFlash: number;
  cycleCount: number;
  cards: JokerBouncingCard[];
  laughs: JokerLaughEcho[];
  confetti: JokerConfetti[];
  spotlights: JokerSpotlight[];
}

export const JOKER_CARD_SPECS: readonly JokerCardSpec[] = [
  { rank: 'JOKER', suit: 'jester', label: 'WILD', accent: '#ff1f8e', isWild: true },
  { rank: 'A', suit: 'heart', label: 'ACE', accent: '#ff4da6', isWild: false },
  { rank: 'K', suit: 'spade', label: 'KING', accent: '#ff85c0', isWild: false },
  { rank: 'Q', suit: 'diamond', label: 'QUEEN', accent: '#ff1f8e', isWild: false },
  { rank: 'J', suit: 'club', label: 'JACK', accent: '#f472b6', isWild: false },
  { rank: 'JOKER', suit: 'jester', label: 'HA!', accent: '#ff66b2', isWild: true },
];

const LAUGH_TEXTS = ['HA!', 'HAHA!', 'HA HA', 'HEHE!', 'JOKER'] as const;

export const JOKER_TIMINGS = {
  idleMin: 5.5,
  idleMax: 7.2,
  vortexDuration: 4.3,
  explodeDuration: 0.22,
  decelDuration: 4.2,
} as const;

export function computeJokerStageMetrics(
  width: number,
  height: number
): { centerX: number; centerY: number; vortexRadius: number; isMobile: boolean } {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const isMobile = safeW < 640;
  return {
    centerX: safeW * 0.5,
    centerY: safeH * 0.48,
    vortexRadius: isMobile
      ? Math.max(102, Math.min(safeW * 0.34, safeH * 0.22))
      : Math.max(165, Math.min(safeW * 0.22, safeH * 0.33)),
    isMobile,
  };
}

/**
 * Computes smooth 3D-like card flip scaleX and side state.
 */
export function getJokerCardFlipState(
  flipPhase: number,
  elapsed: number,
  flipSpeed: number,
  reducedMotion = false
): { scaleX: number; isFaceUp: boolean; glint: number } {
  const angle = reducedMotion ? flipPhase : flipPhase + elapsed * flipSpeed;
  const rawCos = Math.cos(angle);
  const sign = rawCos >= 0 ? 1 : -1;
  const mag = Math.pow(Math.abs(rawCos), 0.72);
  const isFaceUp = sign * mag >= 0;
  const edgeProximity = Math.max(0, 1 - Math.abs(rawCos) * 2.4);
  return {
    scaleX: Math.max(0.08, Math.abs(mag)),
    isFaceUp,
    glint: isFaceUp
      ? 0.58 + 0.42 * Math.abs(rawCos) + edgeProximity * 0.3
      : edgeProximity * 0.42,
  };
}

function buildBouncingCards(
  width: number,
  height: number,
  rng: () => number
): JokerBouncingCard[] {
  const isMobile = width < 640;
  const count = isMobile ? 6 : 8;
  const baseW = isMobile
    ? Math.max(46, Math.min(60, width * 0.135))
    : Math.max(66, Math.min(90, Math.min(width * 0.064, height * 0.105)));

  return Array.from({ length: count }, (_, idx) => {
    const depth = 0.8 + (idx % 4) * 0.08;
    const w = Math.round(baseW * depth);
    const h = Math.round(w * 1.46);
    const padX = w * 0.65;
    const padY = h * 0.65;
    const spanX = Math.max(20, width - padX * 2);
    const spanY = Math.max(20, height - padY * 2);

    // Distribute initial positions across viewport quadrants so cards start evenly spaced
    const gridX = ((idx % 4) + 0.25 + rng() * 0.5) / (isMobile ? 3 : 4);
    const gridY = (Math.floor(idx / (isMobile ? 3 : 4)) + 0.25 + rng() * 0.5) / 2;
    const x = padX + Math.min(1, gridX) * spanX;
    const y = padY + Math.min(1, gridY) * spanY;

    const dirAngle = rng() * Math.PI * 2;
    const baseSpeed = isMobile ? 38 + rng() * 26 : 48 + rng() * 34;

    return {
      id: idx,
      specIndex: idx % JOKER_CARD_SPECS.length,
      x,
      y,
      vx: Math.cos(dirAngle) * baseSpeed,
      vy: Math.sin(dirAngle) * baseSpeed,
      width: w,
      height: h,
      angle: (rng() - 0.5) * 0.7,
      angularVel: (rng() > 0.5 ? 1 : -1) * (0.25 + rng() * 0.45),
      targetSpeed: baseSpeed,
      flipPhase: idx * 0.85 + rng() * 0.5,
      flipSpeed: 0.38 + (idx % 3) * 0.1 + rng() * 0.08,
      depth,
      orbitOffset: (idx / count) * Math.PI * 2,
    };
  });
}

function buildLaughs(width: number, rng: () => number): JokerLaughEcho[] {
  const isMobile = width < 640;
  const count = isMobile ? 6 : 11;
  const palette = ['#ff1f8e', '#ff66b2', '#ff85c0', '#e879f9', '#ffc2e2'];

  return Array.from({ length: count }, (_, idx) => {
    const bandX = ((idx + 0.35 + rng() * 0.45) / count) % 1;
    return {
      id: idx,
      text: LAUGH_TEXTS[idx % LAUGH_TEXTS.length],
      xFrac: 0.06 + bandX * 0.88,
      yFrac: rng(),
      baseAngle: (idx % 2 === 0 ? -1 : 1) * (0.14 + rng() * 0.18),
      fontSize: isMobile
        ? Math.round(13 + (idx % 3) * 4)
        : Math.round(16 + (idx % 4) * 5),
      vy: -(0.022 + rng() * 0.018),
      driftAmp: isMobile ? 8 + rng() * 8 : 14 + rng() * 12,
      phase: rng() * Math.PI * 2,
      speed: 0.9 + rng() * 0.7,
      alpha: 0.14 + rng() * 0.14,
      color: palette[idx % palette.length],
    };
  });
}

function buildConfetti(
  width: number,
  height: number,
  rng: () => number
): JokerConfetti[] {
  const count = width < 640 ? 34 : 66;
  const palette = ['#ff1f8e', '#ff4da6', '#ff85c0', '#e879f9', '#fff1f7', '#d9f99d'];

  return Array.from({ length: count }, (_, i) => ({
    x: rng() * width,
    y: rng() * height,
    vx: (rng() - 0.5) * 18,
    vy: -(18 + rng() * 32),
    size: i % 4 === 0 ? 5.4 : 2.2 + rng() * 2.4,
    spin: rng() * Math.PI * 2,
    spinSpeed: (rng() > 0.5 ? 1 : -1) * (1.1 + rng() * 1.8),
    phase: rng() * Math.PI * 2,
    alpha: 0.32 + rng() * 0.54,
    kind: i % 3 === 0 ? 'diamond' : 'spark',
    color: palette[i % palette.length],
  }));
}

function buildSpotlights(): JokerSpotlight[] {
  return [
    {
      originXFrac: 0.18,
      baseAngle: Math.PI * 0.39,
      sweepAmp: 0.16,
      sweepSpeed: 0.42,
      phase: 0.3,
      widthRad: 0.18,
      alpha: 0.15,
      color: '#ff1f8e',
    },
    {
      originXFrac: 0.53,
      baseAngle: Math.PI * 0.52,
      sweepAmp: 0.14,
      sweepSpeed: 0.34,
      phase: 2.2,
      widthRad: 0.21,
      alpha: 0.13,
      color: '#d946ef',
    },
    {
      originXFrac: 0.85,
      baseAngle: Math.PI * 0.62,
      sweepAmp: 0.15,
      sweepSpeed: 0.48,
      phase: 4.1,
      widthRad: 0.17,
      alpha: 0.15,
      color: '#ff5cad',
    },
  ];
}

function bounceCardAgainstWalls(
  card: JokerBouncingCard,
  width: number,
  height: number,
  rng: () => number
) {
  const halfDiag = Math.max(card.width, card.height) * 0.46;
  const minX = halfDiag;
  const maxX = Math.max(minX + 1, width - halfDiag);
  const minY = halfDiag;
  const maxY = Math.max(minY + 1, height - halfDiag);

  let bounced = false;
  if (card.x <= minX) {
    card.x = minX;
    card.vx = Math.abs(card.vx);
    bounced = true;
  } else if (card.x >= maxX) {
    card.x = maxX;
    card.vx = -Math.abs(card.vx);
    bounced = true;
  }

  if (card.y <= minY) {
    card.y = minY;
    card.vy = Math.abs(card.vy);
    bounced = true;
  } else if (card.y >= maxY) {
    card.y = maxY;
    card.vy = -Math.abs(card.vy);
    bounced = true;
  }

  if (bounced) {
    // Tiny organic angle deflection on bounce so trajectories keep changing unpredictably
    const speed = Math.hypot(card.vx, card.vy);
    if (speed > 0.001) {
      const nudge = (rng() - 0.5) * 0.28;
      const cos = Math.cos(nudge);
      const sin = Math.sin(nudge);
      const nvx = card.vx * cos - card.vy * sin;
      const nvy = card.vx * sin + card.vy * cos;
      card.vx = nvx;
      card.vy = nvy;
    }
    card.angularVel =
      (card.angularVel >= 0 ? -1 : 1) *
      Math.max(0.25, Math.min(6.5, Math.abs(card.angularVel) * (0.9 + rng() * 0.25)));
  }
}

function triggerCardExplosion(world: JokerWorld, rng: () => number) {
  const isMobile = world.width < 640;
  const minBurst = isMobile ? 540 : 760;
  const maxBurst = isMobile ? 840 : 1180;

  for (const card of world.cards) {
    const dx = card.x - world.centerX;
    const dy = card.y - world.centerY;
    const baseAngle =
      Math.hypot(dx, dy) > 1
        ? Math.atan2(dy, dx)
        : world.vortexSpinAngle + card.orbitOffset;
    const scatterAngle = baseAngle + (rng() - 0.5) * 0.42;
    const burstSpeed = minBurst + rng() * (maxBurst - minBurst);

    card.vx = Math.cos(scatterAngle) * burstSpeed;
    card.vy = Math.sin(scatterAngle) * burstSpeed;
    card.angularVel = (rng() > 0.5 ? 1 : -1) * (5.2 + rng() * 5.8);
  }
  world.explosionFlash = 1;
}

export function createJokerWorld(
  width: number,
  height: number,
  rng: () => number = Math.random
): JokerWorld {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const metrics = computeJokerStageMetrics(safeW, safeH);

  return {
    width: safeW,
    height: safeH,
    elapsed: 0,
    centerX: metrics.centerX,
    centerY: metrics.centerY,
    vortexRadius: metrics.vortexRadius,
    phase: 'idle',
    phaseTimer: 0,
    idleDuration:
      JOKER_TIMINGS.idleMin +
      rng() * (JOKER_TIMINGS.idleMax - JOKER_TIMINGS.idleMin),
    vortexDuration: JOKER_TIMINGS.vortexDuration,
    explodeDuration: JOKER_TIMINGS.explodeDuration,
    decelDuration: JOKER_TIMINGS.decelDuration,
    vortexSpinAngle: 0,
    spotlightIntensity: 1,
    blackoutOpacity: 0,
    jokerFaceAlpha: 0,
    jokerFaceScale: 0.72,
    explosionFlash: 0,
    cycleCount: 0,
    cards: buildBouncingCards(safeW, safeH, rng),
    laughs: buildLaughs(safeW, rng),
    confetti: buildConfetti(safeW, safeH, rng),
    spotlights: buildSpotlights(),
  };
}

export function resizeJokerWorld(
  world: JokerWorld,
  width: number,
  height: number,
  rng: () => number = Math.random
): void {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const metrics = computeJokerStageMetrics(safeW, safeH);
  const scaleX = safeW / Math.max(1, world.width);
  const scaleY = safeH / Math.max(1, world.height);

  world.width = safeW;
  world.height = safeH;
  world.centerX = metrics.centerX;
  world.centerY = metrics.centerY;
  world.vortexRadius = metrics.vortexRadius;

  for (const card of world.cards) {
    card.x *= scaleX;
    card.y *= scaleY;
    bounceCardAgainstWalls(card, safeW, safeH, rng);
  }

  world.laughs = buildLaughs(safeW, rng);
  world.confetti = buildConfetti(safeW, safeH, rng);
}

export function stepJokerWorld(
  world: JokerWorld,
  dt: number,
  reducedMotion = false,
  rng: () => number = Math.random
): void {
  if (reducedMotion || dt <= 0) return;

  const clampedDt = Math.min(0.1, dt);
  world.elapsed += clampedDt;
  world.phaseTimer += clampedDt;

  if (world.explosionFlash > 0) {
    world.explosionFlash = Math.max(0, world.explosionFlash - clampedDt * 2.2);
  }

  if (world.phase === 'idle') {
    world.spotlightIntensity += (1 - world.spotlightIntensity) * Math.min(1, clampedDt * 6);
    world.blackoutOpacity += (0 - world.blackoutOpacity) * Math.min(1, clampedDt * 6);
    world.jokerFaceAlpha = Math.max(0, world.jokerFaceAlpha - clampedDt * 4);
    world.jokerFaceScale = 0.72;

    for (const card of world.cards) {
      // Gently steer current speed toward calm idle bounce speed
      const speed = Math.hypot(card.vx, card.vy);
      if (speed > 0.001) {
        const nextSpeed = speed + (card.targetSpeed - speed) * Math.min(1, clampedDt * 2.5);
        const ratio = nextSpeed / speed;
        card.vx *= ratio;
        card.vy *= ratio;
      }
      card.x += card.vx * clampedDt;
      card.y += card.vy * clampedDt;
      card.angle += card.angularVel * clampedDt;
      bounceCardAgainstWalls(card, world.width, world.height, rng);
    }

    if (world.phaseTimer >= world.idleDuration) {
      world.phase = 'vortex';
      world.phaseTimer = 0;
      world.vortexSpinAngle = 0;
    }
  } else if (world.phase === 'vortex') {
    const progress = Math.min(1, world.phaseTimer / world.vortexDuration);

    // Spotlights snap dark quickly as the ring locks in
    const spotlightTarget = progress < 0.12 ? 1 - progress / 0.12 : 0;
    world.spotlightIntensity += (spotlightTarget - world.spotlightIntensity) * Math.min(1, clampedDt * 14);
    const blackoutTarget = Math.min(0.78, progress < 0.14 ? (progress / 0.14) * 0.78 : 0.78);
    world.blackoutOpacity += (blackoutTarget - world.blackoutOpacity) * Math.min(1, clampedDt * 12);

    // Joker face emerges immediately inside the spinning ring once spotlights go out
    if (progress < 0.04) {
      world.jokerFaceAlpha = 0;
      world.jokerFaceScale = 0.72;
    } else if (progress < 0.24) {
      const p = (progress - 0.04) / 0.2;
      world.jokerFaceAlpha = p;
      world.jokerFaceScale = 0.72 + 0.32 * Math.sin(p * Math.PI * 0.5);
    } else if (progress > 0.9) {
      const p = (progress - 0.9) / 0.1;
      world.jokerFaceAlpha = 1;
      world.jokerFaceScale = 1.04 + p * 0.14;
    } else {
      world.jokerFaceAlpha = 1;
      world.jokerFaceScale = 1.02 + Math.sin(world.phaseTimer * 5.6) * 0.035;
    }

    // Ring angular speed accelerates toward explosion climax
    const spinRate = 2.0 + Math.pow(progress, 1.5) * 4.5;
    world.vortexSpinAngle = (world.vortexSpinAngle + spinRate * clampedDt) % (Math.PI * 2);

    // Slight radius contraction right before explosion for visual anticipation
    const radiusScale =
      progress < 0.2
        ? 1.12 - (progress / 0.2) * 0.12
        : progress > 0.86
          ? 1 - ((progress - 0.86) / 0.14) * 0.14
          : 1;
    const orbitR = world.vortexRadius * radiusScale;
    const pullGain = Math.min(1, clampedDt * (6.2 + progress * 9.0));

    for (const card of world.cards) {
      const a = world.vortexSpinAngle + card.orbitOffset;
      const tx = world.centerX + Math.cos(a) * orbitR;
      const ty = world.centerY + Math.sin(a) * orbitR;
      card.x += (tx - card.x) * pullGain;
      card.y += (ty - card.y) * pullGain;
      // Tangent orientation along the circular spin
      const tangent = a + Math.PI * 0.5;
      const angleDiff = Math.atan2(Math.sin(tangent - card.angle), Math.cos(tangent - card.angle));
      card.angle += angleDiff * Math.min(1, clampedDt * 8);
    }

    if (world.phaseTimer >= world.vortexDuration) {
      world.phase = 'explode';
      world.phaseTimer = 0;
      world.spotlightIntensity = 1.35;
      world.blackoutOpacity = 0;
      triggerCardExplosion(world, rng);
    }
  } else if (world.phase === 'explode') {
    // Immediate explosive burst frame(s) + spotlights blaze back on
    world.spotlightIntensity += (1.15 - world.spotlightIntensity) * Math.min(1, clampedDt * 10);
    world.blackoutOpacity = 0;
    world.jokerFaceAlpha = Math.max(0, world.jokerFaceAlpha - clampedDt * 7);
    world.jokerFaceScale += clampedDt * 1.4;

    for (const card of world.cards) {
      card.x += card.vx * clampedDt;
      card.y += card.vy * clampedDt;
      card.angle += card.angularVel * clampedDt;
      bounceCardAgainstWalls(card, world.width, world.height, rng);
    }

    if (world.phaseTimer >= world.explodeDuration) {
      world.phase = 'decelerate';
      world.phaseTimer = 0;
    }
  } else {
    // Decelerate phase: fast ricocheting bounces gradually decay back to idle bounce speed
    world.spotlightIntensity += (1 - world.spotlightIntensity) * Math.min(1, clampedDt * 5);
    world.blackoutOpacity = 0;
    world.jokerFaceAlpha = Math.max(0, world.jokerFaceAlpha - clampedDt * 6);

    const decayRate = 1.12;
    let allSettled = true;

    for (const card of world.cards) {
      const speed = Math.hypot(card.vx, card.vy);
      if (speed > card.targetSpeed + 2) {
        const nextSpeed =
          card.targetSpeed + (speed - card.targetSpeed) * Math.exp(-decayRate * clampedDt);
        const ratio = nextSpeed / speed;
        card.vx *= ratio;
        card.vy *= ratio;
        if (nextSpeed > card.targetSpeed * 1.18) {
          allSettled = false;
        }
      }

      const idleSpin = (card.angularVel >= 0 ? 1 : -1) * 0.42;
      card.angularVel =
        idleSpin + (card.angularVel - idleSpin) * Math.exp(-1.25 * clampedDt);

      card.x += card.vx * clampedDt;
      card.y += card.vy * clampedDt;
      card.angle += card.angularVel * clampedDt;
      bounceCardAgainstWalls(card, world.width, world.height, rng);
    }

    if (world.phaseTimer >= world.decelDuration || (allSettled && world.phaseTimer > 1.2)) {
      world.phase = 'idle';
      world.phaseTimer = 0;
      world.cycleCount += 1;
      world.idleDuration =
        JOKER_TIMINGS.idleMin +
        rng() * (JOKER_TIMINGS.idleMax - JOKER_TIMINGS.idleMin);
    }
  }

  for (const laugh of world.laughs) {
    laugh.yFrac += laugh.vy * clampedDt;
    if (laugh.yFrac < -0.08) {
      laugh.yFrac = 1.08;
      laugh.xFrac = 0.08 + rng() * 0.84;
    }
  }

  const confettiBoost = world.phase === 'explode' ? 2.4 : world.phase === 'decelerate' ? 1.35 : 1;
  for (const c of world.confetti) {
    c.x += (c.vx * confettiBoost + Math.sin(world.elapsed * 1.7 + c.phase) * 9) * clampedDt;
    c.y += c.vy * confettiBoost * clampedDt;
    c.spin = (c.spin + c.spinSpeed * clampedDt) % (Math.PI * 2);
    if (c.y < -18) {
      c.y = world.height + 16;
      c.x = rng() * world.width;
    }
    if (c.x < -16) c.x = world.width + 14;
    else if (c.x > world.width + 16) c.x = -14;
  }
}
