import type * as THREE from 'three';
import { frameUV, partRect, type AtlasMeta, type UV } from '../assets/atlas';
import { QuadBatch } from './quads';

/** Sub-rect of a UV rect: top fraction `[from, to]` measured from the image top (v1). */
function vSlice(uv: UV, from: number, to: number): UV {
  const h = uv.v1 - uv.v0;
  return { u0: uv.u0, u1: uv.u1, v1: uv.v1 - h * from, v0: uv.v1 - h * to };
}

/**
 * Low-poly vehicle from a skin with UV parts. Local frame: faces −X, origin at ground centre,
 * length along X, width along Z. Side planes carry the full silhouette (alpha-tested); the top is
 * split into hood and trunk at belt height and the roof at full height, joined by windscreen quads.
 */
export function vehicleGeometry(meta: AtlasMeta, skin: string, dims: readonly [number, number, number]): THREE.BufferGeometry {
  const [L, W, H] = dims;
  const uv = (part: string) => frameUV(meta, partRect(meta, skin, part));
  const len = (part: string) => partRect(meta, skin, part).h / 16;
  const x0 = -L / 2, x1 = L / 2, zS = W / 2, zN = -W / 2;
  const belt = H * 0.5;
  const b = new QuadBatch();

  b.add([[x0, 0, zS], [x1, 0, zS], [x1, H, zS], [x0, H, zS]], uv('side_l'), [0, 0, 1]); // south side, front at left
  b.add([[x1, 0, zN], [x0, 0, zN], [x0, H, zN], [x1, H, zN]], uv('side_r'), [0, 0, -1]);
  b.add([[x0, 0, zN], [x0, 0, zS], [x0, H, zS], [x0, H, zN]], uv('front'), [-1, 0, 0]);
  b.add([[x1, 0, zS], [x1, 0, zN], [x1, H, zN], [x1, H, zS]], uv('rear'), [1, 0, 0]);

  // Top: image top = front (−X), image left = south (+Z).
  const top = (xf: number, xr: number, y: number, part: string) =>
    b.add([[xr, y, zS], [xr, y, zN], [xf, y, zN], [xf, y, zS]], uv(part), [0, 1, 0]);
  const hoodEnd = x0 + len('hood');
  const roofEnd = Math.min(x1 - 1 / 16, hoodEnd + len('roof'));
  top(x0, hoodEnd, belt, 'hood');
  top(hoodEnd, roofEnd, H, 'roof');
  top(roofEnd, x1, belt, 'trunk');
  // Windscreens join belt-height panels to the raised roof.
  b.add([[hoodEnd, belt, zN], [hoodEnd, belt, zS], [hoodEnd, H, zS], [hoodEnd, H, zN]], vSlice(uv('front'), 0, 0.5), [-1, 0, 0]);
  b.add([[roofEnd, belt, zS], [roofEnd, belt, zN], [roofEnd, H, zN], [roofEnd, H, zS]], vSlice(uv('rear'), 0, 0.5), [1, 0, 0]);
  return b.build();
}
