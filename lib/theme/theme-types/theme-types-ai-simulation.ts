export type AiModelSignatureId = 'gemini' | 'claude' | 'chatgpt' | 'deepseek';

export interface AiModelCoreSpec {
  id: AiModelSignatureId;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  orbitAngleOffset: number;
  orbitSpeed: number;
}

export interface AiNeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  pulseSpeed: number;
  color: string;
  alpha: number;
}

export interface AiSparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  twinkleSpeed: number;
  alpha: number;
  color: string;
}

export interface AiDataPacket {
  modelIndex: number;
  progress: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  trail: number;
}

export interface AiTensorWave {
  yFrac: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  color: string;
  alpha: number;
}

export interface AiWorld {
  width: number;
  height: number;
  elapsed: number;
  centerX: number;
  centerY: number;
  nexusRadius: number;
  outerRingAngle: number;
  innerRingAngle: number;
  orbitPhase: number;
  nodes: AiNeuralNode[];
  sparkles: AiSparkParticle[];
  packets: AiDataPacket[];
  waves: AiTensorWave[];
}

export const AI_MODEL_CORES: readonly AiModelCoreSpec[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    primaryColor: '#4285f4',
    secondaryColor: '#8b5cf6',
    glowColor: 'rgba(66, 133, 244, 0.24)',
    orbitAngleOffset: -Math.PI * 0.75,
    orbitSpeed: 0.19,
  },
  {
    id: 'claude',
    label: 'Claude',
    primaryColor: '#d97757',
    secondaryColor: '#f59e0b',
    glowColor: 'rgba(217, 119, 87, 0.24)',
    orbitAngleOffset: -Math.PI * 0.25,
    orbitSpeed: 0.19,
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    primaryColor: '#10a37f',
    secondaryColor: '#059669',
    glowColor: 'rgba(16, 163, 127, 0.24)',
    orbitAngleOffset: Math.PI * 0.25,
    orbitSpeed: 0.19,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    primaryColor: '#4d6bfe',
    secondaryColor: '#2563eb',
    glowColor: 'rgba(77, 107, 254, 0.24)',
    orbitAngleOffset: Math.PI * 0.75,
    orbitSpeed: 0.19,
  },
];

export function computeAiNexusMetrics(
  width: number,
  height: number
): { centerX: number; centerY: number; nexusRadius: number; isMobile: boolean } {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const isMobile = safeW < 640;
  return {
    centerX: isMobile ? safeW * 0.5 : safeW * 0.72,
    centerY: isMobile ? safeH * 0.45 : safeH * 0.48,
    nexusRadius: isMobile
      ? Math.max(106, Math.min(safeW * 0.34, safeH * 0.22))
      : Math.max(166, Math.min(safeW * 0.22, safeH * 0.34)),
    isMobile,
  };
}

export function getAiModelOrbitalPosition(
  world: Pick<AiWorld, 'centerX' | 'centerY' | 'nexusRadius' | 'orbitPhase'>,
  spec: AiModelCoreSpec
): { x: number; y: number; angle: number } {
  const angle = world.orbitPhase + spec.orbitAngleOffset;
  const rx = world.nexusRadius * 1.18;
  const ry = world.nexusRadius * 0.88;
  return {
    x: world.centerX + Math.cos(angle) * rx,
    y: world.centerY + Math.sin(angle) * ry,
    angle,
  };
}

function buildNeuralNodes(
  width: number,
  height: number,
  rng: () => number
): AiNeuralNode[] {
  const count = width < 640 ? 28 : 54;
  const palette = AI_MODEL_CORES.map((m) => m.primaryColor);
  return Array.from({ length: count }, (_, i) => {
    const angle = rng() * Math.PI * 2;
    const speed = 6 + rng() * 14;
    return {
      x: rng() * width,
      y: rng() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: i % 5 === 0 ? 2.6 : 1.3 + rng() * 1.1,
      phase: rng() * Math.PI * 2,
      pulseSpeed: 1.4 + rng() * 1.8,
      color: palette[i % palette.length],
      alpha: 0.34 + rng() * 0.4,
    };
  });
}

function buildSparkles(
  width: number,
  height: number,
  rng: () => number
): AiSparkParticle[] {
  const count = width < 640 ? 26 : 52;
  const palette = ['#4285f4', '#8b5cf6', '#d97757', '#10a37f', '#4d6bfe'];
  return Array.from({ length: count }, (_, i) => ({
    x: rng() * width,
    y: rng() * height,
    vx: (rng() - 0.5) * 10,
    vy: -(10 + rng() * 20),
    size: i % 6 === 0 ? 3.8 : 1.4 + rng() * 1.4,
    phase: rng() * Math.PI * 2,
    twinkleSpeed: 1.5 + rng() * 2.4,
    alpha: 0.28 + rng() * 0.48,
    color: palette[i % palette.length],
  }));
}

function buildPackets(rng: () => number): AiDataPacket[] {
  const packets: AiDataPacket[] = [];
  for (let m = 0; m < AI_MODEL_CORES.length; m++) {
    const core = AI_MODEL_CORES[m];
    packets.push(
      {
        modelIndex: m,
        progress: rng(),
        speed: 0.32 + rng() * 0.18,
        direction: 1,
        color: core.primaryColor,
        trail: 0.14,
      },
      {
        modelIndex: m,
        progress: rng(),
        speed: 0.28 + rng() * 0.16,
        direction: -1,
        color: core.secondaryColor,
        trail: 0.12,
      }
    );
  }
  return packets;
}

function buildTensorWaves(): AiTensorWave[] {
  return [
    {
      yFrac: 0.78,
      amplitude: 20,
      frequency: 0.0055,
      speed: 0.72,
      phase: 0.3,
      color: '#4d6bfe',
      alpha: 0.2,
    },
    {
      yFrac: 0.83,
      amplitude: 16,
      frequency: 0.0072,
      speed: -0.58,
      phase: 2.1,
      color: '#10a37f',
      alpha: 0.18,
    },
    {
      yFrac: 0.88,
      amplitude: 14,
      frequency: 0.0046,
      speed: 0.45,
      phase: 4.0,
      color: '#d97757',
      alpha: 0.18,
    },
  ];
}

export function createAiWorld(
  width: number,
  height: number,
  rng: () => number = Math.random
): AiWorld {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const metrics = computeAiNexusMetrics(safeW, safeH);

  return {
    width: safeW,
    height: safeH,
    elapsed: 0,
    centerX: metrics.centerX,
    centerY: metrics.centerY,
    nexusRadius: metrics.nexusRadius,
    outerRingAngle: rng() * Math.PI * 2,
    innerRingAngle: rng() * Math.PI * 2,
    orbitPhase: rng() * Math.PI * 2,
    nodes: buildNeuralNodes(safeW, safeH, rng),
    sparkles: buildSparkles(safeW, safeH, rng),
    packets: buildPackets(rng),
    waves: buildTensorWaves(),
  };
}

export function resizeAiWorld(
  world: AiWorld,
  width: number,
  height: number,
  rng: () => number = Math.random
): void {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const metrics = computeAiNexusMetrics(safeW, safeH);

  world.width = safeW;
  world.height = safeH;
  world.centerX = metrics.centerX;
  world.centerY = metrics.centerY;
  world.nexusRadius = metrics.nexusRadius;
  world.nodes = buildNeuralNodes(safeW, safeH, rng);
  world.sparkles = buildSparkles(safeW, safeH, rng);
}

export function stepAiWorld(
  world: AiWorld,
  dt: number,
  reducedMotion = false,
  rng: () => number = Math.random
): void {
  if (reducedMotion || dt <= 0) return;

  const cdt = Math.min(0.1, dt);
  world.elapsed += cdt;

  world.outerRingAngle = (world.outerRingAngle + 0.11 * cdt) % (Math.PI * 2);
  world.innerRingAngle = (world.innerRingAngle - 0.16 * cdt) % (Math.PI * 2);
  world.orbitPhase = (world.orbitPhase + 0.15 * cdt) % (Math.PI * 2);

  for (const n of world.nodes) {
    n.x += n.vx * cdt;
    n.y += n.vy * cdt;
    if (n.x < 0) {
      n.x = 0;
      n.vx = Math.abs(n.vx);
    } else if (n.x > world.width) {
      n.x = world.width;
      n.vx = -Math.abs(n.vx);
    }
    if (n.y < 0) {
      n.y = 0;
      n.vy = Math.abs(n.vy);
    } else if (n.y > world.height) {
      n.y = world.height;
      n.vy = -Math.abs(n.vy);
    }
  }

  for (const sp of world.sparkles) {
    sp.x += (sp.vx + Math.sin(world.elapsed * 1.2 + sp.phase) * 5) * cdt;
    sp.y += sp.vy * cdt;
    if (sp.y < -12) {
      sp.y = world.height + 10;
      sp.x = rng() * world.width;
    }
    if (sp.x < -10) sp.x = world.width + 8;
    else if (sp.x > world.width + 10) sp.x = -8;
  }

  for (const pkt of world.packets) {
    pkt.progress += pkt.speed * pkt.direction * cdt;
    if (pkt.progress > 1) pkt.progress -= 1;
    else if (pkt.progress < 0) pkt.progress += 1;
  }
}
