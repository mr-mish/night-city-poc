import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { inputToWorldDir } from '../src/core/dir';
import { createFixedStepper } from '../src/core/loop';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42), b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('differs for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('next() is in [0,1) and int() covers inclusive bounds', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      seen.add(r.int(1, 3));
    }
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
  it('pick() throws on empty arrays', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
});

describe('inputToWorldDir', () => {
  it('maps up to north (-z) and right to east (+x)', () => {
    expect(inputToWorldDir(0, 1)).toEqual({ x: 0, z: -1 });
    expect(inputToWorldDir(1, 0)).toEqual({ x: 1, z: 0 });
    expect(inputToWorldDir(0, 0)).toEqual({ x: 0, z: 0 });
  });
});

describe('createFixedStepper', () => {
  it('runs one step per 1/60 s', () => {
    const s = createFixedStepper(1 / 60, 5);
    let n = 0;
    s.advance(1 / 60, () => n++);
    expect(n).toBe(1);
  });
  it('accumulates partial frames', () => {
    const s = createFixedStepper(1 / 60, 5);
    let n = 0;
    s.advance(1 / 120, () => n++);
    expect(n).toBe(0);
    s.advance(1 / 120, () => n++);
    expect(n).toBe(1);
  });
  it('caps sub-steps and drops the backlog', () => {
    const s = createFixedStepper(1 / 60, 5);
    let n = 0;
    const alpha = s.advance(1, () => n++);
    expect(n).toBe(5);
    expect(alpha).toBe(0);
  });
  it('ignores negative dt', () => {
    const s = createFixedStepper();
    let n = 0;
    s.advance(-1, () => n++);
    expect(n).toBe(0);
  });
});
