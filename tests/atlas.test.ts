import { describe, it, expect } from 'vitest';
import atlasJson from '../public/assets/atlas.json';
import { frameUV, partRect, type AtlasFile } from '../src/assets/atlas';

const file = atlasJson as AtlasFile;

describe('frameUV', () => {
  it('maps a rect to V-flipped UVs', () => {
    const uv = frameUV({ width: 256, height: 128 }, { x: 16, y: 32, w: 16, h: 16 }, 0);
    expect(uv).toEqual({ u0: 16 / 256, u1: 32 / 256, v1: 1 - 32 / 128, v0: 1 - 48 / 128 });
  });
  it('insets UVs to avoid bleeding', () => {
    const raw = frameUV({ width: 256, height: 128 }, { x: 16, y: 32, w: 16, h: 16 }, 0);
    const inset = frameUV({ width: 256, height: 128 }, { x: 16, y: 32, w: 16, h: 16 });
    expect(inset.u0).toBeGreaterThan(raw.u0);
    expect(inset.u1).toBeLessThan(raw.u1);
    expect(inset.v0).toBeGreaterThan(raw.v0);
    expect(inset.v1).toBeLessThan(raw.v1);
  });
});

describe('partRect', () => {
  it('resolves vehicle part rects into atlas space', () => {
    const meta = file.atlases.vehicles!;
    const r = partRect(meta, 'compact_a', 'roof');
    const f = meta.frames.compact_a![0]!;
    const p = meta.parts.compact_a!.roof!;
    expect(r).toEqual({ x: f.x + p.x, y: f.y + p.y, w: p.w, h: p.h });
  });
  it('throws for unknown parts', () => {
    expect(() => partRect(file.atlases.vehicles!, 'compact_a', 'nope')).toThrow();
  });
});
