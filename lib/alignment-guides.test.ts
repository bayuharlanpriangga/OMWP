import assert from 'node:assert/strict';
import test from 'node:test';
import { computeAlignmentGuides, type RectPx } from './alignment-guides';

test('computeAlignmentGuides snaps horizontally and produces top+bottom row guides for side-by-side equal-height blocks', () => {
  const neighbor: RectPx = {
    id: 'a',
    left: 20,
    top: 100,
    width: 280,
    height: 120,
  };
  const dragged: RectPx = {
    id: 'b',
    left: 340,
    top: 104,
    width: 280,
    height: 120,
  };

  const res = computeAlignmentGuides(dragged, [neighbor], {
    snapThreshold: 6,
    canvasWidth: 960,
  });

  assert.equal(res.snappedTop, 100);
  const hEdges = res.guides.filter(
    (g) => g.orientation === 'horizontal' && g.kind === 'edge'
  );
  assert.equal(hEdges.length, 2);
  assert.deepEqual(
    hEdges.map((g) => g.position),
    [100, 220]
  );
  assert.equal(hEdges[0].start, 14);
  assert.equal(hEdges[0].end, 626);
});

test('computeAlignmentGuides snaps vertically and highlights left+center+right symmetry against block below', () => {
  const below: RectPx = {
    id: 'c',
    left: 200,
    top: 260,
    width: 300,
    height: 100,
  };
  const dragged: RectPx = {
    id: 'b',
    left: 203,
    top: 80,
    width: 300,
    height: 120,
  };

  const res = computeAlignmentGuides(dragged, [below], {
    snapThreshold: 6,
    canvasWidth: 960,
  });

  assert.equal(res.snappedLeft, 200);
  const vEdges = res.guides.filter(
    (g) => g.orientation === 'vertical' && g.kind === 'edge'
  );
  assert.deepEqual(
    vEdges.map((g) => g.position),
    [200, 500]
  );
  assert.equal(vEdges[0].start, 74);
  assert.equal(vEdges[0].end, 366);
});

test('computeAlignmentGuides detects canvas center alignment', () => {
  const dragged: RectPx = {
    id: 'b',
    left: 332,
    top: 60,
    width: 300,
    height: 100,
  };

  const res = computeAlignmentGuides(dragged, [], {
    snapThreshold: 6,
    canvasWidth: 960,
  });

  // Canvas center is 480; centered left for width 300 is 330
  assert.equal(res.snappedLeft, 330);
  assert.ok(res.guides.some((g) => g.kind === 'canvas-center' && g.position === 480));
});

test('computeAlignmentGuides shows dashed center guide when stacked blocks of unequal width align by center', () => {
  const below: RectPx = {
    id: 'wide',
    left: 100,
    top: 260,
    width: 400,
    height: 100,
  };
  const dragged: RectPx = {
    id: 'narrow',
    left: 204,
    top: 80,
    width: 200,
    height: 80,
  };

  // wide center is 300; narrow centered left is 200
  const res = computeAlignmentGuides(dragged, [below], {
    snapThreshold: 6,
    canvasWidth: 960,
  });

  assert.equal(res.snappedLeft, 200);
  const centerGuide = res.guides.find(
    (g) => g.orientation === 'vertical' && g.kind === 'center'
  );
  assert.ok(centerGuide);
  assert.equal(centerGuide.position, 300);
  assert.equal(centerGuide.start, 74);
  assert.equal(centerGuide.end, 366);
});

