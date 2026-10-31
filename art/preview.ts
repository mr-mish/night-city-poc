// Compose sample scenes from built assets for visual review: node art/preview.ts <out-dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PixelCanvas } from './lib/pixels.ts';
import { canvasToPng } from './lib/atlas.ts';
import { atlasSources } from './build.ts';
import type { AssetDef } from './lib/asset.ts';

const out = process.argv[2] ?? 'e2e/screenshots';
const SCALE = 4;

function upscale(c: PixelCanvas, s: number): PixelCanvas {
  const o = new PixelCanvas(c.w * s, c.h * s);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.set(x, y, c.get(Math.floor(x / s), Math.floor(y / s)));
  return o;
}

const all = new Map<string, AssetDef>();
for (const defs of Object.values(atlasSources())) for (const d of defs) all.set(d.name, d);
const frame = (name: string, i = 0) => {
  const d = all.get(name);
  if (!d) throw new Error(`preview: missing asset ${name}`);
  return d.frames[i % d.frames.length] as PixelCanvas;
};

/** Street scene from a char map: one char per 16×16 tile. */
const LEGEND: Record<string, string> = {
  '.': 'asphalt_0', ',': 'asphalt_1', 'o': 'asphalt_2', '~': 'asphalt_3', '-': 'lane_dash_h', '=': 'center_double_h',
  '|': 'lane_dash_v', 'Z': 'crosswalk_v', 'z': 'crosswalk_h', 's': 'sidewalk_0', 'b': 'sidewalk_1', 'P': 'plaza_0', 'p': 'plaza_1',
  'g': 'grate', 'm': 'manhole', 'd': 'dirt_0', 'D': 'dirt_1', 'r': 'rubble', 'w': 'water', 'q': 'quay_edge_n', 'k': 'dock_planks_h',
  'K': 'dock_planks_v', '^': 'arrow_n', 'S': 'stop_line_h',
};
const MAP = [
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwKKwwwwwwwKKwwww',
  'qqqqqkkqqqqqqqkkqqqq',
  'ssssssssssssssssssss',
  '.,...o....zz-.....~..'.slice(0, 20),
  '--..--..--zz--..--..',
  '==========zz========',
  '..~...,...zzo...^...',
  'SSSSSSSSSSzzSSSSSSSS',
  'ssPPPPssgsssbbbbbsss',
  'ssPppPssssmsbbbbbsss',
  'ddDdrdddDdddrrdDdddd',
];

export function streetScene(t = 0): PixelCanvas {
  const c = new PixelCanvas(MAP[0]!.length * 16, MAP.length * 16);
  MAP.forEach((row, ty) => [...row].forEach((ch, tx) => c.blit(frame(LEGEND[ch]!, t), tx * 16, ty * 16)));
  // Curb autotile row: sidewalk row 3 borders road on its south side → curb_4.
  for (let tx = 0; tx < 20; tx++) c.blit(frame('curb_4'), tx * 16, 3 * 16);
  for (let tx = 0; tx < 20; tx++) if (MAP[9]![tx] === 's') c.blit(frame('curb_1'), tx * 16, 9 * 16);
  return c;
}

/** Every tile repeated 3×3 to expose seams. */
export function seamSheet(names: string[]): PixelCanvas {
  const cols = 6;
  const c = new PixelCanvas(cols * 52, Math.ceil(names.length / cols) * 52);
  names.forEach((n, i) => {
    const ox = (i % cols) * 52, oy = Math.floor(i / cols) * 52;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) c.blit(frame(n), ox + x * 16, oy + y * 16);
  });
  return c;
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'street.png'), canvasToPng(upscale(streetScene(), SCALE)));
const tileNames = (atlasSources().tiles ?? []).map((d) => d.name).filter((n) => !n.startsWith('curb_') && !n.includes('arrow') && n !== 'manhole' && n !== 'grate');
writeFileSync(join(out, 'seams.png'), canvasToPng(upscale(seamSheet(tileNames), 3)));
console.log(`preview: wrote ${out}/street.png, seams.png`);
