import { describe, it, expect } from 'vitest';
import { createPlayer, updatePlayer, WALK_SPEED, RUN_SPEED, PLAYER_RADIUS } from '../src/entities/player';
import { emptyInput } from '../src/input/keyboard';
import { SpatialHash } from '../src/physics/collision';

const step = (n: number, fn: () => void) => { for (let i = 0; i < n; i++) fn(); };

describe('updatePlayer', () => {
  it('stays still with no input', () => {
    const p = createPlayer(1, 2);
    updatePlayer(p, emptyInput(), 1 / 60, new SpatialHash());
    expect(p.x).toBe(1);
    expect(p.z).toBe(2);
    expect(p.speed).toBe(0);
  });

  it('walks screen-up at WALK_SPEED', () => {
    const p = createPlayer();
    const world = new SpatialHash();
    step(60, () => updatePlayer(p, { ...emptyInput(), moveY: 1 }, 1 / 60, world));
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(WALK_SPEED, 5);
    expect(p.x).toBeLessThan(0);
    expect(p.z).toBeLessThan(0);
  });

  it('runs faster and normalises diagonals', () => {
    const p = createPlayer();
    const world = new SpatialHash();
    step(60, () => updatePlayer(p, { ...emptyInput(), moveX: 1, moveY: 1, run: true }, 1 / 60, world));
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(RUN_SPEED, 5);
  });

  it('faces its movement direction', () => {
    const p = createPlayer();
    updatePlayer(p, { ...emptyInput(), moveX: 1 }, 1 / 60, new SpatialHash());
    // screen-right = world (+x,-z): atan2(x, z) = atan2(1,-1) = 3π/4
    expect(p.heading).toBeCloseTo((3 * Math.PI) / 4);
  });

  it('is blocked by buildings', () => {
    const world = new SpatialHash();
    // Wall across the screen-up path: everything with x < -1 is solid.
    world.insert({ minX: -20, minZ: -20, maxX: -1, maxZ: 20 });
    const p = createPlayer();
    step(120, () => updatePlayer(p, { ...emptyInput(), moveY: 1 }, 1 / 60, world));
    expect(p.x).toBeGreaterThanOrEqual(-1 + PLAYER_RADIUS - 1e-6);
  });
});
