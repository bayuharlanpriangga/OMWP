import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_MODEL_CORES,
  computeAiNexusMetrics,
  createAiWorld,
  getAiModelOrbitalPosition,
  resizeAiWorld,
  stepAiWorld,
} from '../theme-types/theme-types-ai-simulation';

test('AI_MODEL_CORES defines Gemini, Claude, ChatGPT, and DeepSeek signatures', () => {
  const ids = AI_MODEL_CORES.map((m) => m.id);
  assert.deepEqual(ids, ['gemini', 'claude', 'chatgpt', 'deepseek']);
  for (const core of AI_MODEL_CORES) {
    assert.ok(core.label.length > 0);
    assert.ok(core.primaryColor.startsWith('#'));
    assert.ok(core.secondaryColor.startsWith('#'));
  }
});

test('createAiWorld initializes neural mesh, sparkles, bidirectional packets, and responsive nexus', () => {
  const desktop = createAiWorld(1440, 900);
  const mobile = createAiWorld(390, 844);

  assert.ok(desktop.nodes.length > mobile.nodes.length);
  assert.ok(desktop.sparkles.length > mobile.sparkles.length);
  assert.equal(desktop.packets.length, 8);
  assert.equal(desktop.waves.length, 3);
  assert.ok(desktop.nexusRadius > mobile.nexusRadius);

  const mobileMetrics = computeAiNexusMetrics(390, 844);
  assert.equal(mobileMetrics.isMobile, true);
  assert.equal(mobileMetrics.centerX, 195);
});

test('stepAiWorld advances orbital nexus, packets, and freezes cleanly under reducedMotion', () => {
  const world = createAiWorld(1280, 800, () => 0.42);
  const initialOrbit = world.orbitPhase;
  const initialOuter = world.outerRingAngle;
  const initialPacket = world.packets[0].progress;

  stepAiWorld(world, 0.05, true);
  assert.equal(world.elapsed, 0);
  assert.equal(world.orbitPhase, initialOrbit);
  assert.equal(world.outerRingAngle, initialOuter);
  assert.equal(world.packets[0].progress, initialPacket);

  stepAiWorld(world, 0.05, false, () => 0.42);
  assert.ok(world.elapsed > 0);
  assert.notEqual(world.orbitPhase, initialOrbit);
  assert.notEqual(world.outerRingAngle, initialOuter);
  assert.notEqual(world.packets[0].progress, initialPacket);
});

test('getAiModelOrbitalPosition places the 4 AI cores cleanly around the nexus', () => {
  const world = createAiWorld(1440, 900, () => 0.25);
  const positions = AI_MODEL_CORES.map((core) =>
    getAiModelOrbitalPosition(world, core)
  );
  for (const pos of positions) {
    assert.ok(Number.isFinite(pos.x));
    assert.ok(Number.isFinite(pos.y));
    const dx = pos.x - world.centerX;
    const dy = pos.y - world.centerY;
    assert.ok(Math.hypot(dx, dy) > world.nexusRadius * 0.8);
  }
});

test('resizeAiWorld updates dimensions and keeps nodes and sparkles within bounds', () => {
  const world = createAiWorld(1440, 900);
  resizeAiWorld(world, 390, 844);

  assert.equal(world.width, 390);
  assert.equal(world.height, 844);
  for (const n of world.nodes) {
    assert.ok(n.x >= 0 && n.x <= 390);
    assert.ok(n.y >= 0 && n.y <= 844);
  }
  for (const sp of world.sparkles) {
    assert.ok(sp.x >= 0 && sp.x <= 390);
    assert.ok(sp.y >= 0 && sp.y <= 844);
  }
});
