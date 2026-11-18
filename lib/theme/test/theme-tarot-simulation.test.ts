import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAROT_ARCANA,
  computeTarotMandalaMetrics,
  createTarotWorld,
  getTarotCardFlipState,
  resizeTarotWorld,
  stepTarotWorld,
} from '../theme-types/theme-types-tarot-simulation';

test('TAROT_ARCANA provides distinct Major Arcana cards with numerals and motifs', () => {
  assert.ok(TAROT_ARCANA.length >= 8);
  for (const card of TAROT_ARCANA) {
    assert.ok(card.numeral.length > 0);
    assert.ok(card.title.length > 0);
    assert.ok(card.accent.startsWith('#'));
  }
});

test('createTarotWorld initializes floating cards, embers, wisps, stars, and responsive mandala', () => {
  const desktop = createTarotWorld(1440, 900);
  const mobile = createTarotWorld(390, 844);

  assert.equal(desktop.cards.length, 7);
  assert.equal(mobile.cards.length, 5);
  assert.ok(desktop.embers.length > mobile.embers.length);
  assert.equal(desktop.wisps.length, 3);
  assert.ok(desktop.mandalaRadius > mobile.mandalaRadius);

  const mobileMetrics = computeTarotMandalaMetrics(390, 844);
  assert.equal(mobileMetrics.isMobile, true);
  assert.equal(mobileMetrics.centerX, 195);
});

test('stepTarotWorld rotates sacred rings, rises embers, and freezes under reducedMotion', () => {
  const world = createTarotWorld(1280, 800, () => 0.42);
  const initialOuter = world.outerRingAngle;
  const initialInner = world.innerRingAngle;
  const initialEmberY = world.embers[0].y;

  stepTarotWorld(world, 0.05, true);
  assert.equal(world.elapsed, 0);
  assert.equal(world.outerRingAngle, initialOuter);
  assert.equal(world.embers[0].y, initialEmberY);

  stepTarotWorld(world, 0.05, false, () => 0.42);
  assert.ok(world.elapsed > 0);
  assert.notEqual(world.outerRingAngle, initialOuter);
  assert.notEqual(world.innerRingAngle, initialInner);
  assert.ok(world.embers[0].y < initialEmberY);
});

test('getTarotCardFlipState transitions smoothly between face-up and card-back', () => {
  const front = getTarotCardFlipState(0, 0, 0.3);
  assert.equal(front.isFaceUp, true);
  assert.ok(front.scaleX > 0.9);

  const back = getTarotCardFlipState(Math.PI, 0, 0.3);
  assert.equal(back.isFaceUp, false);
  assert.ok(back.scaleX > 0.9);

  const edge = getTarotCardFlipState(Math.PI / 2, 0, 0.3);
  assert.ok(edge.scaleX >= 0.06 && edge.scaleX < 0.3);
});

test('resizeTarotWorld updates dimensions and keeps entities finite and bounded', () => {
  const world = createTarotWorld(1440, 900);
  resizeTarotWorld(world, 390, 844);

  assert.equal(world.width, 390);
  assert.equal(world.height, 844);
  assert.equal(world.cards.length, 5);
  for (const c of world.cards) {
    assert.ok(Number.isFinite(c.width) && c.width > 0);
    assert.ok(Number.isFinite(c.height) && c.height > c.width);
  }
  for (const e of world.embers) {
    assert.ok(e.x >= 0 && e.x <= 390);
    assert.ok(e.y >= 0 && e.y <= 844);
  }
});
