import test from 'node:test';
import assert from 'node:assert/strict';
import { computeReflowPositions } from '../../page/page-present/page-present';

test('computeReflowPositions pushes down horizontally overlapping blocks below an expanded block', () => {
  const offsets = computeReflowPositions([
    { id: 'leftTop', x: 0, y: 100, w: 6, collapsedHeight: 60, extraExpandedHeight: 90 },
    { id: 'leftBottom', x: 0, y: 180, w: 6, collapsedHeight: 60, extraExpandedHeight: 0 },
    { id: 'rightColumn', x: 50, y: 180, w: 6, collapsedHeight: 60, extraExpandedHeight: 0 },
  ]);

  assert.equal(offsets.leftTop, 100);
  assert.equal(offsets.leftBottom, 270);
  assert.equal(offsets.rightColumn, 180);
});
