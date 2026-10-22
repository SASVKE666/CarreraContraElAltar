/**
 * Pure physics & logic calculations for 2D Auto-Runner.
 * Decoupled from DOM/React for deterministic unit testing.
 */

export interface CapsuleColliderConfig {
  originalSize: { x: number; y: number };
  originalOffset: { x: number; y: number };
}

export interface GroundCheckResult {
  isGrounded: boolean;
  distanceToGround: number;
}

/**
 * Calculates the resized capsule collider dimensions and offset during a slide.
 * When sliding, height is halved. To keep the bottom edge in place at the feet (assuming bottom-pivot or centered sprite),
 * the offset.y is adjusted downwards by (originalHeight * 0.25).
 */
export function calculateSlideCollider(
  config: CapsuleColliderConfig,
  isSliding: boolean
): { size: { x: number; y: number }; offset: { x: number; y: number } } {
  if (!isSliding) {
    return {
      size: { ...config.originalSize },
      offset: { ...config.originalOffset },
    };
  }

  const slideHeight = config.originalSize.y * 0.5;
  // Offset moves down so bottom stays aligned with ground
  const offsetDiff = (config.originalSize.y - slideHeight) / 2;
  const slideOffsetY = config.originalOffset.y - offsetDiff;

  return {
    size: {
      x: config.originalSize.x,
      y: slideHeight,
    },
    offset: {
      x: config.originalOffset.x,
      y: slideOffsetY,
    },
  };
}

/**
 * Checks if feet circle overlaps ground.
 * Sprite pivot is at bottom center (local origin (0, 0)).
 * If footPosition.y <= groundY + checkRadius, grounded is true.
 */
export function checkGroundOverlap(
  footPositionY: number,
  groundY: number,
  checkRadius: number
): GroundCheckResult {
  const distance = footPositionY - groundY;
  const isGrounded = distance <= checkRadius;
  return {
    isGrounded,
    distanceToGround: distance,
  };
}

/**
 * Calculates vertical jump impulse velocity.
 * In Unity: rb.linearVelocity = new Vector2(rb.linearVelocity.x, 0); rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
 * For mass m, deltaV = jumpForce / m.
 */
export function calculateJumpVelocity(jumpForce: number, mass: number = 1.0): number {
  if (mass <= 0) return 0;
  return jumpForce / mass;
}

/**
 * Calculates pursuit tension based on distance.
 * Distance range: 0 (caught) to maxDistance (safe).
 * Returns tension between 0 (safe) and 1 (extreme danger).
 */
export function calculatePursuitTension(currentDistance: number, maxDistance: number): number {
  if (maxDistance <= 0) return 1;
  const clamped = Math.max(0, Math.min(currentDistance, maxDistance));
  return 1 - clamped / maxDistance;
}

/**
 * Determines collision between player collider and obstacle.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Moves an environment entity towards the left along the X axis.
 * Represents transform.Translate(Vector3.left * (moveSpeed * Time.deltaTime), Space.World).
 */
export function updateMoverPosition(currentX: number, moveSpeed: number, dt: number): number {
  return currentX - moveSpeed * dt;
}

/**
 * Checks if an environment entity has passed the left destruction boundary.
 * In Unity: if (transform.position.x <= destructionX) { Deactivate/Destroy }
 */
export function shouldRecycleOrDestroy(currentX: number, destructionThresholdX: number): boolean {
  return currentX <= destructionThresholdX;
}

/**
 * Calculates next spawn interval with slight randomness.
 * Represents: baseSpawnRate + Random.Range(-randomVariation, randomVariation)
 * Clamped with a minimum safe interval to prevent overlapping obstacles.
 */
export function calculateNextSpawnInterval(
  baseRate: number,
  randomVariation: number,
  random01: number = Math.random(),
  minSafeInterval: number = 0.8
): number {
  const offset = (random01 * 2 - 1) * randomVariation;
  const rawInterval = baseRate + offset;
  return Math.max(minSafeInterval, rawInterval);
}

/**
 * Selects an index from an array of prefabs given a 0..1 random float.
 * Represents: Random.Range(0, obstaclePrefabs.Length)
 */
export function selectRandomPrefabIndex(totalPrefabs: number, random01: number = Math.random()): number {
  if (totalPrefabs <= 0) return -1;
  const index = Math.floor(random01 * totalPrefabs);
  return Math.min(totalPrefabs - 1, Math.max(0, index));
}

/**
 * Calculates effective gravity taking into account the fallMultiplier game feel mechanic.
 * When falling (verticalVelocity < 0), gravity is amplified by fallMultiplier for snappy descent.
 */
export function calculateEffectiveGravity(
  baseGravity: number,
  verticalVelocity: number,
  fallMultiplier: number = 2.5
): number {
  if (verticalVelocity < 0) {
    return baseGravity * fallMultiplier;
  }
  return baseGravity;
}



