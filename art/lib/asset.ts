import { PixelCanvas } from './pixels.ts';
import type { Rect } from './atlas.ts';

export type AssetDef = {
  name: string;
  frames: PixelCanvas[];
  emissive: PixelCanvas[];
  fps?: number;
  parts?: Record<string, Rect>;
};

/** Emissive mask: keep only pixels whose index is in `glow`. */
export function glowMask(frame: PixelCanvas, glow: readonly number[]): PixelCanvas {
  const set = new Set(glow);
  const out = new PixelCanvas(frame.w, frame.h);
  for (let k = 0; k < frame.data.length; k++) {
    const v = frame.data[k] as number;
    if (set.has(v)) out.data[k] = v;
  }
  return out;
}

export function makeAsset(
  name: string,
  frames: PixelCanvas[],
  glow: readonly number[],
  opts: { fps?: number; parts?: Record<string, Rect> } = {},
): AssetDef {
  return { name, frames, emissive: frames.map((f) => glowMask(f, glow)), ...opts };
}

export function remapAsset(def: AssetDef, table: Readonly<Record<number, number>>, name: string): AssetDef {
  return { ...def, name, frames: def.frames.map((f) => f.remap(table)), emissive: def.emissive.map((f) => f.remap(table)) };
}
