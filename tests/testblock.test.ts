import { describe, it, expect } from 'vitest';
import { planTestBlock, lotToAABB, PERIOD, BLOCK } from '../src/world/testblock';

describe('planTestBlock', () => {
  it('is deterministic and has 4 lots per block in a 3x3 grid', () => {
    const a = planTestBlock(2091);
    expect(a).toHaveLength(36);
    expect(planTestBlock(2091)).toEqual(a);
  });
  it('keeps every building inside its block (roads stay clear)', () => {
    for (const lot of planTestBlock(2091)) {
      const b = lotToAABB(lot);
      const bx = Math.round(lot.x / PERIOD) * PERIOD;
      const bz = Math.round(lot.z / PERIOD) * PERIOD;
      expect(b.minX).toBeGreaterThanOrEqual(bx - BLOCK / 2);
      expect(b.maxX).toBeLessThanOrEqual(bx + BLOCK / 2);
      expect(b.minZ).toBeGreaterThanOrEqual(bz - BLOCK / 2);
      expect(b.maxZ).toBeLessThanOrEqual(bz + BLOCK / 2);
    }
  });
  it('makes the central block taller', () => {
    const lots = planTestBlock(2091);
    const centre = lots.filter((l) => Math.abs(l.x) < BLOCK && Math.abs(l.z) < BLOCK);
    const maxCentre = Math.max(...centre.map((l) => l.h));
    expect(maxCentre).toBeGreaterThan(18);
  });
});
