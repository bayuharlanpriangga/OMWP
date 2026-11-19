import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JOKER_CARD_SPECS,
  createJokerWorld,
  getJokerCardFlipState,
  resizeJokerWorld,
  stepJokerWorld,
} from '../theme-types/theme-types-joker-simulation';

function createDeterministicRng(seed = 42): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('createJokerWorld initializes bouncing cards, spotlights, laugh echoes, and confetti without static center traps', () => {
  const rng = createDeterministicRng(1337);
  const desktop = createJokerWorld(1280, 720, rng);
  assert.equal(desktop.cards.length, 8);
  assert.equal(desktop.laughs.length, 11);
  assert.equal(desktop.confetti.length, 66);
  assert.equal(desktop.spotlights.length, 3);
  assert.equal(desktop.phase, 'idle');
  assert.equal(desktop.spotlightIntensity, 1);
  assert.equal(desktop.jokerFaceAlpha, 0);
  assert.equal(desktop.centerX, desktop.width * 0.5);
  assert.ok(JOKER_CARD_SPECS.some((spec) => spec.isWild && spec.rank === 'JOKER'));

  for (const card of desktop.cards) {
    const speed = Math.hypot(card.vx, card.vy);
    assert.ok(speed > 20 && speed < 120);
  }

  const mobile = createJokerWorld(390, 844, rng);
  assert.equal(mobile.cards.length, 6);
  assert.equal(mobile.laughs.length, 6);
  assert.equal(mobile.confetti.length, 34);
  assert.equal(mobile.centerX, mobile.width * 0.5);
});

test('stepJokerWorld bounces cards inside viewport walls during calm idle phase', () => {
  const rng = createDeterministicRng(99);
  const world = createJokerWorld(1024, 768, rng);
  const initialPositions = world.cards.map((c) => [c.x, c.y]);

  for (let i = 0; i < 60; i++) {
    stepJokerWorld(world, 0.05, false, rng);
  }

  assert.equal(world.phase, 'idle');
  assert.ok(world.spotlightIntensity > 0.9);
  assert.equal(world.jokerFaceAlpha, 0);

  let movedCount = 0;
  world.cards.forEach((card, idx) => {
    if (card.x !== initialPositions[idx][0] || card.y !== initialPositions[idx][1]) {
      movedCount++;
    }
    assert.ok(card.x >= 0 && card.x <= world.width);
    assert.ok(card.y >= 0 && card.y <= world.height);
  });
  assert.equal(movedCount, world.cards.length);
});

test('stepJokerWorld runs full choreography: idle -> vortex (blackout + spinning ring + Joker face) -> explode -> decelerate -> idle loop', () => {
  const rng = createDeterministicRng(2026);
  const world = createJokerWorld(1280, 720, rng);
  const dt = 0.05;

  // Step until vortex begins
  let guard = 0;
  while (world.phase === 'idle' && guard < 300) {
    stepJokerWorld(world, dt, false, rng);
    guard++;
  }
  assert.equal(world.phase, 'vortex');

  // Advance midway into vortex: spotlights must turn off, Joker face appears, cards orbit center in a circle
  for (let i = 0; i < 45; i++) {
    stepJokerWorld(world, dt, false, rng);
  }
  assert.equal(world.phase, 'vortex');
  assert.ok(world.spotlightIntensity < 0.05, 'Spotlights must shut off during vortex');
  assert.ok(world.blackoutOpacity > 0.5, 'Darkness veil should deepen stage');
  assert.ok(world.jokerFaceAlpha > 0.9, 'Joker face must appear inside the spinning cards');

  for (const card of world.cards) {
    const dist = Math.hypot(card.x - world.centerX, card.y - world.centerY);
    assert.ok(
      Math.abs(dist - world.vortexRadius) < 40,
      `Card should orbit near vortexRadius (${world.vortexRadius}), got ${dist}`
    );
  }

  // Advance until cards explode outward
  guard = 0;
  while (world.phase === 'vortex' && guard < 200) {
    stepJokerWorld(world, dt, false, rng);
    guard++;
  }
  assert.ok(world.phase === 'explode' || world.phase === 'decelerate');
  assert.ok(world.spotlightIntensity > 0.95, 'Spotlights must come back on when exploding');
  assert.ok(world.explosionFlash > 0.2);

  const postBurstAvgSpeed =
    world.cards.reduce((sum, c) => sum + Math.hypot(c.vx, c.vy), 0) / world.cards.length;
  assert.ok(postBurstAvgSpeed > 450, `Expected fast explosion speed, got ${postBurstAvgSpeed}`);

  // Step through deceleration until it settles back to idle
  guard = 0;
  while (world.phase !== 'idle' && guard < 200) {
    stepJokerWorld(world, dt, false, rng);
    guard++;
  }
  assert.equal(world.phase, 'idle');
  assert.equal(world.cycleCount, 1);

  const settledAvgSpeed =
    world.cards.reduce((sum, c) => sum + Math.hypot(c.vx, c.vy), 0) / world.cards.length;
  assert.ok(
    settledAvgSpeed < postBurstAvgSpeed * 0.35,
    `Speed should decay smoothly toward idle (${settledAvgSpeed} vs ${postBurstAvgSpeed})`
  );
  assert.ok(world.jokerFaceAlpha < 0.05);
});

test('stepJokerWorld freezes simulation when reducedMotion is true', () => {
  const rng = createDeterministicRng(7);
  const world = createJokerWorld(800, 600, rng);
  const snapshot = JSON.stringify({
    elapsed: world.elapsed,
    phase: world.phase,
    cards: world.cards.map((c) => [c.x, c.y, c.angle]),
    laughs: world.laughs.map((l) => l.yFrac),
    confetti: world.confetti.slice(0, 5).map((c) => [c.x, c.y, c.spin]),
  });

  stepJokerWorld(world, 0.05, true, rng);
  stepJokerWorld(world, 0.05, true, rng);

  const after = JSON.stringify({
    elapsed: world.elapsed,
    phase: world.phase,
    cards: world.cards.map((c) => [c.x, c.y, c.angle]),
    laughs: world.laughs.map((l) => l.yFrac),
    confetti: world.confetti.slice(0, 5).map((c) => [c.x, c.y, c.spin]),
  });
  assert.equal(after, snapshot);
});

test('getJokerCardFlipState alternates between front and back faces smoothly with safe scaleX', () => {
  const front = getJokerCardFlipState(0, 0, 0.4, false);
  assert.equal(front.isFaceUp, true);
  assert.ok(front.scaleX >= 0.99);

  const back = getJokerCardFlipState(0, Math.PI / 0.4, 0.4, false);
  assert.equal(back.isFaceUp, false);
  assert.ok(back.scaleX >= 0.99);

  const edge = getJokerCardFlipState(Math.PI / 2, 0, 0.4, false);
  assert.ok(edge.scaleX >= 0.08 && edge.scaleX <= 0.16);

  const reduced = getJokerCardFlipState(0.25, 12.5, 0.8, true);
  const reducedZero = getJokerCardFlipState(0.25, 0, 0.8, true);
  assert.equal(reduced.scaleX, reducedZero.scaleX);
  assert.equal(reduced.isFaceUp, reducedZero.isFaceUp);
});

test('resizeJokerWorld preserves simulation state and keeps cards bounded inside new viewport', () => {
  const rng = createDeterministicRng(2025);
  const world = createJokerWorld(1280, 720, rng);
  assert.equal(world.cards.length, 8);

  resizeJokerWorld(world, 420, 760, rng);
  assert.equal(world.width, 420);
  assert.equal(world.height, 760);
  assert.equal(world.centerX, 210);
  for (const card of world.cards) {
    assert.ok(card.x >= 0 && card.x <= 420);
    assert.ok(card.y >= 0 && card.y <= 760);
  }
});
