import * as THREE from 'three';

export type Rect = { x: number; y: number; w: number; h: number };
export type AtlasMeta = {
  image: string;
  emissive: string;
  width: number;
  height: number;
  frames: Record<string, Rect[]>;
  fps: Record<string, number>;
  parts: Record<string, Record<string, Rect>>;
};
export type AtlasFile = { tileSize: number; atlases: Record<string, AtlasMeta> };
export type UV = { u0: number; v0: number; u1: number; v1: number };

/**
 * Normalised UVs for an atlas rect. V is flipped (atlas row 0 → v = 1) to match textures loaded
 * with flipY. `inset` (in texels) keeps sampling inside the frame so neighbours never bleed in.
 */
export function frameUV(size: { width: number; height: number }, r: Rect, inset = 0.01): UV {
  return {
    u0: (r.x + inset) / size.width,
    u1: (r.x + r.w - inset) / size.width,
    v1: 1 - (r.y + inset) / size.height,
    v0: 1 - (r.y + r.h - inset) / size.height,
  };
}

/** A vehicle-skin part rect in atlas space (frame origin + part offset). */
export function partRect(meta: AtlasMeta, asset: string, part: string): Rect {
  const frame = meta.frames[asset]?.[0];
  const p = meta.parts[asset]?.[part];
  if (!frame || !p) throw new Error(`atlas: no part '${part}' on '${asset}'`);
  return { x: frame.x + p.x, y: frame.y + p.y, w: p.w, h: p.h };
}

export type LoadedAtlas = {
  meta: AtlasMeta;
  albedo: THREE.Texture;
  emissive: THREE.Texture;
  /** UVs for an asset frame. Throws for unknown names so map typos fail loudly. */
  uv(name: string, frame?: number): UV;
  rect(name: string, frame?: number): Rect;
};

function pixelTexture(tex: THREE.Texture): THREE.Texture {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  return tex;
}

export async function loadAtlases(base = '/assets/'): Promise<Record<string, LoadedAtlas>> {
  const res = await fetch(`${base}atlas.json`);
  if (!res.ok) throw new Error(`atlas.json: HTTP ${res.status}`);
  const file = (await res.json()) as AtlasFile;
  const loader = new THREE.TextureLoader();
  const entries = await Promise.all(
    Object.entries(file.atlases).map(async ([name, meta]) => {
      const [albedo, emissive] = await Promise.all([
        loader.loadAsync(base + meta.image),
        loader.loadAsync(base + meta.emissive),
      ]);
      const rect = (asset: string, frame = 0): Rect => {
        const frames = meta.frames[asset];
        if (!frames) throw new Error(`atlas '${name}': unknown asset '${asset}'`);
        return frames[frame % frames.length] as Rect;
      };
      const atlas: LoadedAtlas = {
        meta,
        albedo: pixelTexture(albedo),
        emissive: pixelTexture(emissive),
        rect,
        uv: (asset, frame = 0) => frameUV(meta, rect(asset, frame)),
      };
      return [name, atlas] as const;
    }),
  );
  return Object.fromEntries(entries);
}
