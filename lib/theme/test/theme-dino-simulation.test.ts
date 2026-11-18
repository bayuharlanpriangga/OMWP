import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDinoWorld,
  getDinoMetrics,
  resizeDinoWorld,
  rotateDinoRoles,
  stepDinoWorld,
  type DinoState,
} from '../theme-types/theme-types-dino-simulation';

function makeSeededRng(seed = 1337): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

test('createDinoWorld spawns 4 gray pixel dinos with >1 flyer, runners, clouds, and cacti', () => {
  const rng = makeSeededRng(42);
  const world = createDinoWorld(1280, 720, rng);

  assert.equal(world.dinos.length, 4);
  const flyers = world.dinos.filter((d) => d.role === 'flyer');
  const runners = world.dinos.filter((d) => d.role === 'runner');
  assert.ok(flyers.length >= 2, `Expected >1 flyer dino, got ${flyers.length}`);
  assert.ok(runners.length >= 1, `Expected >=1 runner dino, got ${runners.length}`);

  const shades = new Set(world.dinos.map((d) => d.shade));
  assert.equal(shades.size, 4);
  assert.equal(world.clouds.length, 4);
  assert.equal(world.cacti.length, 4);
});

test('flying dinos crash into clouds (fly-bonk), fall (fly-fall -> fallen), and get back up (recover -> ground-run)', () => {
  const rng = makeSeededRng(7);
  const world = createDinoWorld(1000, 600, rng);

  // Position dino 0 as a flyer heading straight into cloud 0
  const flyer = world.dinos[0];
  const cloud = world.clouds[0];
  flyer.role = 'flyer';
  flyer.state = 'fly-soar';
  flyer.dir = 1;
  flyer.vx = 120;
  flyer.vy = 0;
  flyer.x = cloud.x - 10;
  flyer.y = cloud.y;
  flyer.stateTimer = 3.0;
  cloud.vx = 0;

  const seenStates: DinoState[] = [flyer.state];
  for (let i = 0; i < 160; i++) {
    stepDinoWorld(world, 0.03, rng);
    if (!seenStates.includes(flyer.state)) {
      seenStates.push(flyer.state);
    }
    if (flyer.state === 'ground-run' && seenStates.includes('recover')) {
      break;
    }
  }

  assert.ok(seenStates.includes('fly-bonk'), `Missing fly-bonk in ${seenStates.join(' -> ')}`);
  assert.ok(seenStates.includes('fly-fall'), `Missing fly-fall in ${seenStates.join(' -> ')}`);
  assert.ok(seenStates.includes('fallen'), `Missing fallen in ${seenStates.join(' -> ')}`);
  assert.ok(seenStates.includes('recover'), `Missing recover in ${seenStates.join(' -> ')}`);
  assert.ok(seenStates.includes('ground-run'), `Missing ground-run in ${seenStates.join(' -> ')}`);
  assert.ok(cloud.shakeTimer >= 0);
});

test('ground runner dinos jump over cacti and occasionally trip, fall, and recover across randomized runs', () => {
  const rng = makeSeededRng(2026);
  const world = createDinoWorld(1200, 680, rng);

  const seenGlobalStates = new Set<DinoState>();
  const seenRolesByDino = new Map<number, Set<string>>();
  for (const d of world.dinos) {
    seenRolesByDino.set(d.id, new Set([d.role]));
  }

  for (let i = 0; i < 900; i++) {
    stepDinoWorld(world, 0.03, rng);
    for (const d of world.dinos) {
      seenGlobalStates.add(d.state);
      seenRolesByDino.get(d.id)?.add(d.role);
    }
  }

  assert.ok(seenGlobalStates.has('ground-run'));
  assert.ok(seenGlobalStates.has('ground-jump'), 'Expected ground-jump over cacti');
  assert.ok(seenGlobalStates.has('ground-trip'), 'Expected occasional ground-trip on cacti');
  assert.ok(seenGlobalStates.has('fly-launch'), 'Expected fly-launch takeoff');
  assert.ok(seenGlobalStates.has('fly-soar'), 'Expected fly-soar state');
  assert.ok(seenGlobalStates.has('fly-bonk'), 'Expected cloud crash fly-bonk');
  assert.ok(seenGlobalStates.has('fly-fall'), 'Expected fly-fall state');
  assert.ok(seenGlobalStates.has('fallen'), 'Expected fallen state');
  assert.ok(seenGlobalStates.has('recover'), 'Expected recover state');

  // Verify dinos take turns rotating roles ("bergantian")
  const rotatedDinos = [...seenRolesByDino.values()].filter((s) => s.size > 1).length;
  assert.ok(rotatedDinos >= 2, `Expected dinos to swap flyer/runner roles, got ${rotatedDinos}`);
});

test('rotateDinoRoles swaps flyer and runner roles while preserving total count of 4 dinos', () => {
  const rng = makeSeededRng(99);
  const world = createDinoWorld(1200, 700, rng);

  // Force all dinos into eligible states
  world.dinos[0].role = 'flyer';
  world.dinos[0].state = 'fly-soar';
  world.dinos[1].role = 'flyer';
  world.dinos[1].state = 'fly-soar';
  world.dinos[2].role = 'runner';
  world.dinos[2].state = 'ground-run';
  world.dinos[3].role = 'runner';
  world.dinos[3].state = 'ground-run';

  const swapped = rotateDinoRoles(world, rng);
  assert.equal(swapped, true);
  assert.equal(world.dinos.length, 4);
  assert.equal(world.dinos.filter((d) => d.role === 'flyer').length, 2);
  assert.equal(world.dinos.filter((d) => d.role === 'runner').length, 2);
});

test('resizeDinoWorld and getDinoMetrics keep all entities bounded and finite', () => {
  const rng = makeSeededRng(55);
  const world = createDinoWorld(1440, 900, rng);

  const mobileMetrics = getDinoMetrics(390, 844);
  assert.equal(mobileMetrics.narrow, true);
  assert.equal(mobileMetrics.unit, 3);

  resizeDinoWorld(world, 390, 844, rng);
  assert.equal(world.width, 390);
  assert.equal(world.height, 844);
  for (const d of world.dinos) {
    assert.ok(Number.isFinite(d.x) && Number.isFinite(d.y));
    assert.ok(d.x >= 36 && d.x <= 390 - 36);
    assert.ok(d.y >= 40 && d.y <= world.groundY);
  }
});
