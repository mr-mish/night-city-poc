import { describe, it, expect } from 'vitest';
import { QuadBatch } from '../src/render/quads';

const uv = { u0: 0, v0: 0, u1: 1, v1: 1 };

describe('QuadBatch', () => {
  it('builds 4 vertices and 6 indices per quad', () => {
    const b = new QuadBatch();
    expect(b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1])).toBe(0);
    expect(b.add([[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], uv, [0, 1, 0])).toBe(1);
    const g = b.build();
    expect(g.getAttribute('position').count).toBe(8);
    expect(g.getAttribute('normal').count).toBe(8);
    expect(g.getIndex()!.count).toBe(12);
  });
  it('maps UV corners BL, BR, TR, TL', () => {
    const b = new QuadBatch();
    b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], { u0: 0.1, v0: 0.2, u1: 0.3, v1: 0.4 }, [0, 0, 1]);
    const a = b.build().getAttribute('uv');
    const got = [a.getX(0), a.getY(0), a.getX(2), a.getY(2), a.getX(3), a.getY(3)];
    [0.1, 0.2, 0.3, 0.4, 0.1, 0.4].forEach((v, i) => expect(got[i]).toBeCloseTo(v, 6)); // Float32 storage
  });
  it('setUV only changes the target quad', () => {
    const b = new QuadBatch();
    b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1]);
    b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1]);
    const g = b.build();
    b.setUV(1, { u0: 0.5, v0: 0.5, u1: 0.75, v1: 0.75 });
    const a = g.getAttribute('uv');
    expect(a.getX(0)).toBe(0);
    expect(a.getX(4)).toBe(0.5);
    expect(a.getY(6)).toBe(0.75);
  });
  it('refuses setUV before build', () => {
    const b = new QuadBatch();
    b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1]);
    expect(() => b.setUV(0, uv)).toThrow();
  });
});
