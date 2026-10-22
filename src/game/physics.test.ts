import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSlideCollider,
  checkGroundOverlap,
  calculateJumpVelocity,
  calculatePursuitTension,
  checkAABBCollision,
  updateMoverPosition,
  shouldRecycleOrDestroy,
  calculateNextSpawnInterval,
  selectRandomPrefabIndex,
  calculateEffectiveGravity,
} from './physics.ts';




test('calculateSlideCollider cuts capsule height by half and adjusts offset correctly', () => {
  const normalConfig = {
    originalSize: { x: 1.0, y: 2.0 },
    originalOffset: { x: 0, y: 1.0 }, // Bottom at 0, top at 2.0
  };

  const sliding = calculateSlideCollider(normalConfig, true);
  assert.equal(sliding.size.y, 1.0, 'Sliding height must be half of original 2.0');
  assert.equal(sliding.size.x, 1.0, 'Width must remain intact');
  assert.equal(sliding.offset.y, 0.5, 'Offset y must shift down so bottom remains at 0');

  const standing = calculateSlideCollider(normalConfig, false);
  assert.equal(standing.size.y, 2.0, 'Standing height must restore to 2.0');
  assert.equal(standing.offset.y, 1.0, 'Standing offset must restore to 1.0');
});

test('checkGroundOverlap detects ground within radius correctly', () => {
  const groundY = 0;
  const radius = 0.2;

  // On the ground
  const atZero = checkGroundOverlap(0, groundY, radius);
  assert.equal(atZero.isGrounded, true);

  // In the air slightly above check radius
  const highAir = checkGroundOverlap(0.5, groundY, radius);
  assert.equal(highAir.isGrounded, false);

  // Touching ground within threshold
  const touching = checkGroundOverlap(0.15, groundY, radius);
  assert.equal(touching.isGrounded, true);
});

test('calculateJumpVelocity applies impulse to mass', () => {
  assert.equal(calculateJumpVelocity(12, 1.0), 12);
  assert.equal(calculateJumpVelocity(12, 2.0), 6);
});

test('calculatePursuitTension computes tension scale correctly', () => {
  // Max distance 100
  assert.equal(calculatePursuitTension(100, 100), 0, 'Safe at max distance');
  assert.equal(calculatePursuitTension(50, 100), 0.5, '50% tension at midpoint');
  assert.equal(calculatePursuitTension(0, 100), 1, 'Maximum tension when caught');
});

test('checkAABBCollision accurately detects overlapping boxes', () => {
  const player = { x: 10, y: 0, width: 20, height: 40 };
  const obstacleColliding = { x: 20, y: 10, width: 20, height: 20 };
  const obstacleClear = { x: 50, y: 0, width: 20, height: 20 };

  assert.equal(checkAABBCollision(player, obstacleColliding), true);
  assert.equal(checkAABBCollision(player, obstacleClear), false);
});

test('updateMoverPosition translates object smoothly to the left', () => {
  const startX = 10;
  const moveSpeed = 8; // units per second
  const dt = 0.5; // half a second
  const newX = updateMoverPosition(startX, moveSpeed, dt);
  assert.equal(newX, 6, '10 - (8 * 0.5) must equal 6');
});

test('shouldRecycleOrDestroy detects when threshold X is reached or passed', () => {
  const destructionX = -15;

  assert.equal(shouldRecycleOrDestroy(-10, destructionX), false, 'Still visible on screen');
  assert.equal(shouldRecycleOrDestroy(-15, destructionX), true, 'Exactly on threshold');
  assert.equal(shouldRecycleOrDestroy(-16.2, destructionX), true, 'Passed threshold, must recycle');
});

test('calculateNextSpawnInterval adds slight randomness within boundaries', () => {
  const baseRate = 2.0;
  const variation = 0.5;

  // Midpoint (random01 = 0.5) -> exact baseRate
  const mid = calculateNextSpawnInterval(baseRate, variation, 0.5, 0.5);
  assert.equal(mid, 2.0);

  // Minimum variation (random01 = 0.0) -> baseRate - variation = 1.5
  const minInterval = calculateNextSpawnInterval(baseRate, variation, 0.0, 0.5);
  assert.equal(minInterval, 1.5);

  // Maximum variation (random01 = 1.0) -> baseRate + variation = 2.5
  const maxInterval = calculateNextSpawnInterval(baseRate, variation, 1.0, 0.5);
  assert.equal(maxInterval, 2.5);

  // Respects minSafeInterval clamp
  const clamped = calculateNextSpawnInterval(0.6, 0.4, 0.0, 0.8);
  assert.equal(clamped, 0.8, 'Must clamp to minSafeInterval to prevent impossible jumps');
});

test('selectRandomPrefabIndex returns valid indices without out-of-bounds', () => {
  const total = 4; // indices 0, 1, 2, 3
  assert.equal(selectRandomPrefabIndex(total, 0.0), 0);
  assert.equal(selectRandomPrefabIndex(total, 0.26), 1);
  assert.equal(selectRandomPrefabIndex(total, 0.74), 2);
  assert.equal(selectRandomPrefabIndex(total, 0.999), 3);
  assert.equal(selectRandomPrefabIndex(0, 0.5), -1, 'Empty array returns -1');
});

test('calculateEffectiveGravity multiplies gravity only when falling', () => {
  const baseGravity = 9.81;
  const fallMultiplier = 2.5;

  // Moving upward (jumping): normal gravity
  assert.equal(calculateEffectiveGravity(baseGravity, 10, fallMultiplier), 9.81);

  // Peak apex (verticalVelocity = 0): normal gravity
  assert.equal(calculateEffectiveGravity(baseGravity, 0, fallMultiplier), 9.81);

  // Falling downward (verticalVelocity < 0): multiplied gravity
  assert.equal(calculateEffectiveGravity(baseGravity, -0.1, fallMultiplier), 9.81 * 2.5);
  assert.equal(calculateEffectiveGravity(baseGravity, -8.0, fallMultiplier), 9.81 * 2.5);
});

import { RUNNER_FRAMES, BRIDE_FRAMES } from './spriteAtlas.ts';

test('RUNNER_FRAMES coordinates are within sheet bounds and match specs', () => {
  assert.equal(RUNNER_FRAMES.run.length, 10, 'Runner must have 10 run frames');
  assert.equal(RUNNER_FRAMES.jump.length, 3, 'Runner has jump frames');
  assert.equal(RUNNER_FRAMES.fall.length, 3, 'Runner has fall frames');
  assert.equal(RUNNER_FRAMES.slide.length, 6, 'Runner has 6 slide frames');

  // Verify all coordinates are positive and fit in 1536x768
  for (const frame of [...RUNNER_FRAMES.run, ...RUNNER_FRAMES.jump, ...RUNNER_FRAMES.fall, ...RUNNER_FRAMES.slide]) {
    assert.ok(frame.sx >= 0 && frame.sx + frame.sw <= 1536, `sx ${frame.sx} out of bounds`);
    assert.ok(frame.sy >= 0 && frame.sy + frame.sh <= 768, `sy ${frame.sy} out of bounds`);
    assert.ok(frame.sw > 0 && frame.sh > 0);
  }
});

test('BRIDE_FRAMES coordinates are within sheet bounds and match specs', () => {
  assert.equal(BRIDE_FRAMES.run.length, 10, 'Bride has 10 run frames');
  assert.equal(BRIDE_FRAMES.attack.length, 7, 'Bride has 7 attack frames');

  for (const frame of [...BRIDE_FRAMES.run, ...BRIDE_FRAMES.attack]) {
    assert.ok(frame.sx >= 0 && frame.sx + frame.sw <= 1536, `sx ${frame.sx} out of bounds`);
    assert.ok(frame.sy >= 0 && frame.sy + frame.sh <= 768, `sy ${frame.sy} out of bounds`);
    assert.ok(frame.sw > 0 && frame.sh > 0);
  }
});



