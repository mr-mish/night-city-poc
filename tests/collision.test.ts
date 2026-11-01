import { describe, it, expect } from 'vitest';
import { resolveCircleAABB, SpatialHash, resolveAgainstWorld, type AABB } from '../src/physics/collision';

const box: AABB = { minX: 0, minZ: 0, maxX: 10, maxZ: 10 };

describe('resolveCircleAABB', () => {
  it('ignores non-overlapping circles', () => {
    const c = { x: -2, z: 5, r: 1 };
    expect(resolveCircleAABB(c, box)).toBe(false);
    expect(c).toEqual({ x: -2, z: 5, r: 1 });
  });
  it('pushes an overlapping circle out of the nearest edge', () => {
    const c = { x: -0.5, z: 5, r: 1 };
    expect(resolveCircleAABB(c, box)).toBe(true);
    expect(c.x).toBeCloseTo(-1);
    expect(c.z).toBeCloseTo(5);
  });
  it('pushes a circle whose centre is inside along the smallest axis', () => {
    const c = { x: 9.5, z: 5, r: 0.5 };
    resolveCircleAABB(c, box);
    expect(c.x).toBeCloseTo(10.5);
  });
  it('handles corners radially', () => {
    const c = { x: -0.5, z: -0.5, r: 1 };
    resolveCircleAABB(c, box);
    expect(Math.hypot(c.x, c.z)).toBeCloseTo(1);
  });
});

describe('SpatialHash', () => {
  it('returns nearby boxes and skips distant ones', () => {
    const h = new SpatialHash(8);
    const far: AABB = { minX: 100, minZ: 100, maxX: 104, maxZ: 104 };
    h.insert(box);
    h.insert(far);
    const hits = h.query(-1, -1, 1, 1);
    expect(hits).toContain(box);
    expect(hits).not.toContain(far);
  });
  it('dedupes boxes spanning several cells', () => {
    const h = new SpatialHash(4);
    h.insert(box);
    expect(h.query(-5, -5, 15, 15)).toHaveLength(1);
  });
  it('resolveAgainstWorld pushes out of inserted boxes', () => {
    const h = new SpatialHash(8);
    h.insert(box);
    const c = { x: 5, z: 10.2, r: 0.5 };
    expect(resolveAgainstWorld(c, h)).toBe(true);
    expect(c.z).toBeCloseTo(10.5);
  });
});
