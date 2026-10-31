import { PixelCanvas } from './pixels.ts';
import { encodePng } from './png.ts';
import { rgbaOf } from '../palette.ts';
import type { AssetDef } from './asset.ts';

export type Rect = { x: number; y: number; w: number; h: number };
export type AtlasMeta = {
  width: number;
  height: number;
  frames: Record<string, Rect[]>;
  fps: Record<string, number>;
  parts: Record<string, Record<string, Rect>>;
};
export type Packed = { albedo: PixelCanvas; emissive: PixelCanvas; entry: AtlasMeta };

const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Deterministic shelf packer: tallest first, then by name, then frame index. */
export function packAtlas(defs: AssetDef[], width = 256, padding = 1): Packed {
  const seen = new Set<string>();
  for (const d of defs) {
    if (seen.has(d.name)) throw new Error(`packAtlas: duplicate asset '${d.name}'`);
    seen.add(d.name);
    if (d.frames.length === 0) throw new Error(`packAtlas: '${d.name}' has no frames`);
    if (d.emissive.length !== d.frames.length) throw new Error(`packAtlas: '${d.name}' emissive frame count mismatch`);
    d.frames.forEach((f, i) => {
      const e = d.emissive[i] as PixelCanvas;
      if (e.w !== f.w || e.h !== f.h) throw new Error(`packAtlas: '${d.name}' emissive size mismatch`);
      if (f.w !== (d.frames[0] as PixelCanvas).w || f.h !== (d.frames[0] as PixelCanvas).h) throw new Error(`packAtlas: '${d.name}' frame sizes differ`);
      if (f.w + 2 * padding > width) throw new Error(`packAtlas: '${d.name}' is too wide for ${width}px atlas`);
    });
  }
  const items = defs.flatMap((d) => d.frames.map((f, i) => ({ d, i, f })));
  const order = [...items].sort((a, b) => b.f.h - a.f.h || cmp(a.d.name, b.d.name) || a.i - b.i);
  const placed = new Map<string, Rect>();
  let x = padding, y = padding, shelf = 0;
  for (const it of order) {
    if (x + it.f.w + padding > width) { x = padding; y += shelf + padding; shelf = 0; }
    placed.set(`${it.d.name}#${it.i}`, { x, y, w: it.f.w, h: it.f.h });
    x += it.f.w + padding;
    shelf = Math.max(shelf, it.f.h);
  }
  const height = nextPow2(y + shelf + padding);
  const albedo = new PixelCanvas(width, height);
  const emissive = new PixelCanvas(width, height);
  const entry: AtlasMeta = { width, height, frames: {}, fps: {}, parts: {} };
  for (const d of defs) {
    entry.frames[d.name] = d.frames.map((f, i) => {
      const r = placed.get(`${d.name}#${i}`) as Rect;
      albedo.blit(f, r.x, r.y);
      emissive.blit(d.emissive[i] as PixelCanvas, r.x, r.y);
      return r;
    });
    if (d.fps) entry.fps[d.name] = d.fps;
    if (d.parts) entry.parts[d.name] = d.parts;
  }
  return { albedo, emissive, entry };
}

export function canvasToPng(c: PixelCanvas): Buffer {
  const rgba = new Uint8Array(c.w * c.h * 4);
  for (let k = 0; k < c.data.length; k++) rgba.set(rgbaOf(c.data[k] as number), k * 4);
  return encodePng(c.w, c.h, rgba);
}
