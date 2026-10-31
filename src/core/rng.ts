export type Rng = {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
};

/** mulberry32: a fast, deterministic 32-bit PRNG. */
export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, maxInclusive) => min + Math.floor(next() * (maxInclusive - min + 1)),
    pick: <T>(arr: readonly T[]): T => {
      if (arr.length === 0) throw new Error('pick() from empty array');
      return arr[Math.floor(next() * arr.length)] as T;
    },
    chance: (p) => next() < p,
  };
}
