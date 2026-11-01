import { describe, it, expect } from 'vitest';
import { PixelCanvas } from '../art/lib/pixels.ts';
import { makeAsset, remapAsset, glowMask } from '../art/lib/asset.ts';
import { packAtlas, type Rect } from '../art/lib/atlas.ts';
import { buildAll } from '../art/build.ts';
import { decodePng } from '../art/lib/png.ts';
import { RGB } from '../art/palette.ts';

const solid = (w: number, h: number, i: number) => new PixelCanvas(w, h).rect(0, 0, w, h, i);
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('asset helpers', () => {
  it('glowMask keeps only glow indices', () => {
    const f = new PixelCanvas(2, 1);
    f.set(0, 0, 5);
    f.set(1, 0, 9);
    expect([...glowMask(f, [9]).data]).toEqual([0, 9]);
  });
  it('remapAsset remaps frames and emissive', () => {
    const a = makeAsset('x', [solid(1, 1, 5)], [5]);
    const b = remapAsset(a, { 5: 6 }, 'y');
    expect(b.name).toBe('y');
    expect(b.frames[0]!.get(0, 0)).toBe(6);
    expect(b.emissive[0]!.get(0, 0)).toBe(6);
  });
});

describe('packAtlas', () => {
  it('packs frames in bounds without overlap, power-of-two height', () => {
    const defs = [
      makeAsset('a', [solid(16, 16, 1), solid(16, 16, 2)], []),
      makeAsset('b', [solid(48, 24, 3)], []),
      makeAsset('c', [solid(250, 8, 4)], []),
    ];
    const p = packAtlas(defs, 256, 1);
    const rects = Object.values(p.entry.frames).flat();
    expect(rects).toHaveLength(4);
    for (const r of rects) {
      expect(r.x + r.w).toBeLessThanOrEqual(p.entry.width);
      expect(r.y + r.h).toBeLessThanOrEqual(p.entry.height);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(overlap(rects[i]!, rects[j]!)).toBe(false);
    expect(Math.log2(p.entry.height) % 1).toBe(0);
    const r = p.entry.frames.b![0]!;
    expect(p.albedo.get(r.x, r.y)).toBe(3);
  });
  it('rejects duplicate names, mismatched emissive and oversize frames', () => {
    expect(() => packAtlas([makeAsset('a', [solid(1, 1, 1)], []), makeAsset('a', [solid(1, 1, 1)], [])])).toThrow(/duplicate/);
    expect(() => packAtlas([{ name: 'e', frames: [solid(2, 2, 1)], emissive: [solid(1, 1, 1)] }])).toThrow(/emissive/);
    expect(() => packAtlas([makeAsset('w', [solid(300, 1, 1)], [])], 256)).toThrow(/wide/);
  });
});

describe('buildAll', () => {
  const files = buildAll();
  it('is deterministic', () => {
    const again = buildAll();
    expect([...again.keys()]).toEqual([...files.keys()]);
    for (const [k, v] of files) expect(v.equals(again.get(k)!)).toBe(true);
  });
  it('only uses palette colours', () => {
    const allowed = new Set(RGB.slice(1).map((c) => c.join(',')));
    for (const [name, buf] of files) {
      if (!name.endsWith('.png')) continue;
      const { rgba } = decodePng(buf);
      for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] === 0) continue;
        expect(allowed.has(`${rgba[i]},${rgba[i + 1]},${rgba[i + 2]}`), `${name} pixel ${i / 4}`).toBe(true);
      }
    }
  });
  it('writes an atlas.json referencing every image', () => {
    const json = JSON.parse(files.get('atlas.json')!.toString());
    expect(json.tileSize).toBe(16);
    for (const a of Object.values(json.atlases) as { image: string; emissive: string }[]) {
      expect(files.has(a.image)).toBe(true);
      expect(files.has(a.emissive)).toBe(true);
    }
  });
});
