import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { packAtlas, canvasToPng, type AtlasMeta } from './lib/atlas.ts';
import type { AssetDef } from './lib/asset.ts';
import { tileAssets } from './tiles/index.ts';
import { buildingAssets } from './buildings/index.ts';
import { DISTRICTS } from './palette.ts';

export const OUT_DIR = 'public/assets';

/** Every atlas and its assets. Families register here. */
export function atlasSources(): Record<string, AssetDef[]> {
  const out: Record<string, AssetDef[]> = {};
  out.tiles = tileAssets();
  for (const d of DISTRICTS) out[`buildings_${d}`] = buildingAssets(d);
  return out;
}

export function buildAll(): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const atlases: Record<string, AtlasMeta & { image: string; emissive: string }> = {};
  for (const [name, defs] of Object.entries(atlasSources())) {
    const packed = packAtlas(defs, 256, 1);
    const image = `${name}.png`;
    const emissive = `${name}_emissive.png`;
    files.set(image, canvasToPng(packed.albedo));
    files.set(emissive, canvasToPng(packed.emissive));
    atlases[name] = { image, emissive, ...packed.entry };
  }
  files.set('atlas.json', Buffer.from(`${JSON.stringify({ tileSize: 16, atlases }, null, 1)}\n`));
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync(OUT_DIR, { recursive: true });
  const files = buildAll();
  for (const [name, buf] of files) writeFileSync(join(OUT_DIR, name), buf);
  console.log(`art: wrote ${files.size} files to ${OUT_DIR}`);
}
