import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCyberpunkWorld,
  getCyberpunkRailY,
  resizeCyberpunkWorld,
  stepCyberpunkWorld,
} from '../theme-types/theme-types-cyberpunk-simulation';

test('createCyberpunkWorld builds 3 parallax skyline layers, traffic spinners, train, beams, and rain', () => {
  const world = createCyberpunkWorld(1440, 900, () => 0.45);
  assert.equal(world.width, 1440);
  assert.equal(world.height, 900);
  assert.equal(world.buildings.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.ok(world.buildings[i].length > 5, `Layer ${i} should have buildings`);
    assert.ok(world.layerWidths[i] >= 1600, `Layer ${i} should span past viewport`);
  }
  assert.equal(world.spinners.length, 16);
  assert.equal(world.rain.length, 64);
  assert.equal(world.beams.length, 3);
  assert.ok(getCyberpunkRailY(900) > 600);
});

test('stepCyberpunkWorld scrolls all 3 skyline layers, moves traffic, advances monorail, and wraps cleanly', () => {
  const world = createCyberpunkWorld(1280, 720, () => 0.35);
  const initialOffsets = [...world.layerOffsets];
  const initialSpinnerXs = world.spinners.map((s) => s.x);
  const initialTrainX = world.train.x;

  for (let i = 0; i < 40; i++) {
    stepCyberpunkWorld(world, 0.05, false, () => 0.35);
  }

  assert.ok(world.elapsed > 1.9);
  for (let i = 0; i < 3; i++) {
    assert.notEqual(world.layerOffsets[i], initialOffsets[i]);
    assert.ok(world.layerOffsets[i] >= 0 && world.layerOffsets[i] < world.layerWidths[i]);
  }
  assert.ok(world.layerOffsets[2] !== world.layerOffsets[0]);

  const movedCount = world.spinners.filter((s, idx) => s.x !== initialSpinnerXs[idx]).length;
  assert.equal(movedCount, world.spinners.length);
  assert.notEqual(world.train.x, initialTrainX);
});

test('stepCyberpunkWorld does not advance positions when reducedMotion is enabled', () => {
  const world = createCyberpunkWorld(1280, 720, () => 0.5);
  const beforeOffsets = [...world.layerOffsets];
  const beforeSpinnerX = world.spinners[0].x;
  const beforeTrainX = world.train.x;

  stepCyberpunkWorld(world, 0.05, true);

  assert.deepEqual(world.layerOffsets, beforeOffsets);
  assert.equal(world.spinners[0].x, beforeSpinnerX);
  assert.equal(world.train.x, beforeTrainX);
  assert.equal(world.elapsed, 0);
});

test('resizeCyberpunkWorld adapts density and dimensions for mobile viewports', () => {
  const world = createCyberpunkWorld(1440, 900, () => 0.4);
  stepCyberpunkWorld(world, 0.1, false, () => 0.4);

  resizeCyberpunkWorld(world, 390, 844, () => 0.4);

  assert.equal(world.width, 390);
  assert.equal(world.height, 844);
  assert.equal(world.spinners.length, 9);
  assert.equal(world.rain.length, 34);
  for (let i = 0; i < 3; i++) {
    assert.ok(world.layerOffsets[i] >= 0 && world.layerOffsets[i] < world.layerWidths[i]);
  }
});
