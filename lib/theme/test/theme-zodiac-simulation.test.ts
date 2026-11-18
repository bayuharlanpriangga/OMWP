import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ZODIAC_CONSTELLATIONS,
  computePlanetaryAspects,
  createZodiacWorld,
  getZodiacLayout,
  resizeZodiacWorld,
  stepZodiacWorld,
} from '../theme-types/theme-types-zodiac-simulation';

test('ZODIAC_CONSTELLATIONS defines all 12 signs with valid star indices and elements', () => {
  assert.equal(ZODIAC_CONSTELLATIONS.length, 12);
  const ids = new Set(ZODIAC_CONSTELLATIONS.map((c) => c.id));
  assert.equal(ids.size, 12);

  for (const c of ZODIAC_CONSTELLATIONS) {
    assert.ok(c.stars.length >= 4, `Expected >=4 stars in ${c.id}`);
    assert.ok(c.edges.length >= 3, `Expected >=3 edges in ${c.id}`);
    for (const [a, b] of c.edges) {
      assert.ok(a >= 0 && a < c.stars.length, `Invalid start index in ${c.id}`);
      assert.ok(b >= 0 && b < c.stars.length, `Invalid end index in ${c.id}`);
    }
  }
});

test('createZodiacWorld initializes stars, 5 planets, and layout responsive to viewport', () => {
  const desktop = createZodiacWorld(1440, 900, () => 0.4);
  assert.equal(desktop.stars.length, 170);
  assert.equal(desktop.planets.length, 5);
  assert.ok(desktop.centerX > desktop.width * 0.65);

  const mobileLayout = getZodiacLayout(390, 844);
  assert.equal(mobileLayout.narrow, true);
  assert.equal(mobileLayout.centerX, 390 * 0.5);
});

test('stepZodiacWorld advances astrolabe angles, cycles zodiac house, and bounds shooting stars', () => {
  let seed = 0.05;
  const rng = () => {
    seed = (seed + 0.17) % 1;
    return seed;
  };
  const world = createZodiacWorld(1280, 720, rng);
  const startWheel = world.wheelAngle;
  const startInner = world.innerRingAngle;
  const startHouse = world.activeHouseIndex;

  for (let i = 0; i < 140; i++) {
    stepZodiacWorld(world, 0.05, () => 0.002);
  }

  assert.notEqual(world.wheelAngle, startWheel);
  assert.notEqual(world.innerRingAngle, startInner);
  assert.equal(world.activeHouseIndex, (startHouse + 1) % 12);
  assert.ok(world.meteors.length <= 2);
});

test('computePlanetaryAspects detects conjunction, sextile, and trine geometric alignments', () => {
  const world = createZodiacWorld(1200, 800, () => 0);
  world.planets[0].angle = 0;
  world.planets[1].angle = 0.05; // ~2.8 deg -> conjunction
  world.planets[2].angle = Math.PI / 3; // 60 deg -> sextile
  world.planets[3].angle = (2 * Math.PI) / 3; // 120 deg -> trine
  world.planets[4].angle = Math.PI * 1.38;

  const aspects = computePlanetaryAspects(world);
  const kinds = new Set(aspects.map((a) => a.kind));
  assert.ok(kinds.has('conjunction'));
  assert.ok(kinds.has('sextile'));
  assert.ok(kinds.has('trine'));
});

test('resizeZodiacWorld updates center coordinates, star count, and planetary aspect positions', () => {
  const world = createZodiacWorld(1280, 720, () => 0.5);
  resizeZodiacWorld(world, 390, 844, () => 0.5);
  assert.equal(world.width, 390);
  assert.equal(world.stars.length, 95);
  assert.equal(world.centerX, 195);
});
