// City tileset: 16×16 ground tiles. Top-down, light from the top-left.
import { PixelCanvas } from '../lib/pixels.ts';
import { makeAsset, type AssetDef } from '../lib/asset.ts';
import { C } from '../palette.ts';
import { createRng, type Rng } from '../../src/core/rng.ts';

const T = 16;
const tile = () => new PixelCanvas(T, T);

/** Transpose (x,y) → (y,x): turns horizontal markings into vertical ones. */
function transpose(c: PixelCanvas): PixelCanvas {
  const out = new PixelCanvas(c.h, c.w);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) out.set(y, x, c.get(x, y));
  return out;
}

/** Rotate 90° clockwise. */
function rotateCW(c: PixelCanvas): PixelCanvas {
  const out = new PixelCanvas(c.h, c.w);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) out.set(c.h - 1 - y, x, c.get(x, y));
  return out;
}

// ── Asphalt ────────────────────────────────────────────────────────────────

function asphaltBase(rng: Rng, density = 1): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.n1);
  // Clean DS-style asphalt: sparse 2-px aggregate clusters instead of per-pixel noise.
  for (let k = 0; k < Math.round(7 * density); k++) {
    const x = rng.int(0, T - 2), y = rng.int(0, T - 1);
    c.set(x, y, C.n2);
    c.set(x + 1, y, rng.chance(0.5) ? C.n2 : C.n3);
  }
  for (let k = 0; k < Math.round(5 * density); k++) c.set(rng.int(0, T - 1), rng.int(0, T - 1), C.n0);
  return c;
}

function asphaltCracked(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  let x = 1, y = rng.int(4, 11);
  while (x < 14) {
    c.set(x, y, C.n0);
    if (rng.chance(0.35)) y += rng.chance(0.5) ? 1 : -1;
    x++;
    if (x === 8) {
      // branch
      let by = y, bx = x;
      for (let k = 0; k < 4; k++) { by += 1; bx += rng.chance(0.5) ? 1 : 0; c.set(bx, by, C.n0); }
    }
  }
  return c;
}

function asphaltOil(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  const cx = 8, cy = 9;
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const d = ((x - cx) / 4.6) ** 2 + ((y - cy) / 3.4) ** 2;
      if (d < 0.55) c.set(x, y, C.o1);
      else if (d < 1) c.set(x, y, C.n0);
    }
  }
  c.set(6, 8, C.w1); // faint sheen
  c.set(7, 8, C.g2);
  return c;
}

function asphaltWet(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng, 0.5);
  // Rain puddle reflecting neon from above: dark water body, lighter rim, vertical light smear.
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const d = ((x - 8) / 6.5) ** 2 + ((y - 8.5) / 4.8) ** 2;
      if (d < 1) c.set(x, y, d > 0.72 ? C.g1 : C.w0);
    }
  }
  for (let y = 5; y <= 12; y++) {
    if (y === 9) continue;
    c.set(6, y, y < 8 || y > 10 ? C.w2 : C.k1);
    c.set(7, y, y % 2 === 0 ? C.w1 : C.w2);
  }
  c.rect(10, 7, 2, 1, C.p1); // second, warmer reflection
  c.rect(10, 10, 2, 1, C.p1);
  c.set(4, 6, C.w3); // rim glint, top-left
  c.set(5, 5, C.w3);
  return c;
}

// ── Road markings (drawn horizontally, transposed for _v) ──────────────────

function laneDash(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  c.rect(0, 7, 8, 2, C.c3);
  c.set(2, 8, C.c2);
  c.set(5, 7, C.c2);
  return c;
}

function centerDouble(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  c.rect(0, 5, T, 2, C.i2);
  c.rect(0, 9, T, 2, C.i2);
  for (const x of [3, 12]) { c.set(x, 6, C.i1); c.set(x + 4 > 15 ? 1 : x + 4, 10, C.i1); }
  return c;
}

function stopLine(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  c.rect(0, 6, T, 4, C.c3);
  c.rect(0, 6, T, 1, C.c4);
  for (const x of [2, 9, 13]) c.set(x, 8, C.c2);
  return c;
}

function crosswalk(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  for (const x0 of [2, 10]) {
    c.rect(x0, 0, 4, T, C.c4);
    c.rect(x0 + 3, 0, 1, T, C.c3); // shade right edge
    for (let k = 0; k < 3; k++) c.set(x0 + rng.int(0, 2), rng.int(0, 15), C.c2); // wear
  }
  return c;
}

function arrowNorth(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  c.rect(7, 7, 2, 7, C.c3); // shaft
  for (let row = 0; row < 5; row++) c.rect(7 - row, 2 + row, 2 + row * 2, 1, C.c3); // head
  c.rect(8, 7, 1, 7, C.c2); // shaded half of shaft
  return c;
}

// ── Sidewalks, curbs, plazas ───────────────────────────────────────────────

function sidewalkPavers(rng: Rng): PixelCanvas {
  const c = tile();
  // Per-paver tone variation reads more natural than per-pixel noise.
  const tones = [C.c1, C.c1, C.c1, C.c0];
  for (let py = 0; py < 2; py++) for (let px = 0; px < 2; px++) {
    const tone = rng.pick(tones);
    const hi = tone === C.c0 ? C.c1 : C.c2;
    c.rect(px * 8, py * 8, 8, 8, tone);
    c.rect(px * 8, py * 8, 7, 1, hi);
    c.rect(px * 8, py * 8, 1, 7, hi);
    c.rect(px * 8 + 7, py * 8, 1, 8, C.n4);
    c.rect(px * 8, py * 8 + 7, 8, 1, C.n4);
    if (rng.chance(0.5)) c.set(px * 8 + rng.int(2, 5), py * 8 + rng.int(2, 5), C.c0);
  }
  return c;
}

function sidewalkBond(rng: Rng): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.c1);
  for (let y = 0; y < T; y++) {
    const row = Math.floor(y / 4);
    const off = row % 2 === 0 ? 0 : 4;
    for (let x = 0; x < T; x++) {
      if (y % 4 === 3 || (x + off) % 8 === 7) c.set(x, y, C.c0);
      else if (y % 4 === 0) c.set(x, y, C.c2);
      else if (rng.chance(0.04)) c.set(x, y, C.c0);
    }
  }
  return c;
}

/** Curb autotile: bit 1=N, 2=E, 4=S, 8=W marks an edge that borders the road. */
function curb(mask: number, rng: Rng): PixelCanvas {
  const c = sidewalkPavers(rng);
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  // Inner highlight (curb top) first, then the outer face/shadow so corners resolve to the outer colour.
  if (N) c.rect(0, 1, T, 1, C.c3);
  if (S) c.rect(0, T - 2, T, 1, C.c3);
  if (W) c.rect(1, 0, 1, T, C.c3);
  if (E) c.rect(T - 2, 0, 1, T, C.c3);
  if (N) c.rect(0, 0, T, 1, C.c0);
  if (W) c.rect(0, 0, 1, T, C.c0);
  if (E) c.rect(T - 1, 0, 1, T, C.n3);
  if (S) c.rect(0, T - 1, T, 1, C.n3); // visible curb face toward the viewer
  return c;
}

function plazaLights(): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.m1);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (x % 8 === 7 || y % 8 === 7) c.set(x, y, C.m0);
    else if (x % 8 === 0 || y % 8 === 0) c.set(x, y, C.m2);
  }
  c.rect(10, 11, 3, 1, C.k1); // inset floor light
  c.rect(2, 3, 3, 1, C.k1);
  return c;
}

function plazaChecker(): PixelCanvas {
  const c = tile();
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const light = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
    c.set(x, y, light ? C.m2 : C.m1);
    if (x % 4 === 3 || y % 4 === 3) c.set(x, y, C.m0);
  }
  return c;
}

// ── Utility ground ─────────────────────────────────────────────────────────

function grate(): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.m1);
  c.rect(0, 0, T, 1, C.m2).rect(0, 0, 1, T, C.m2);
  c.rect(0, T - 1, T, 1, C.m0).rect(T - 1, 0, 1, T, C.m0);
  for (let x = 3; x <= 12; x += 2) c.rect(x, 3, 1, 10, C.o1);
  c.rect(2, 2, 12, 1, C.m0);
  return c;
}

function manhole(rng: Rng): PixelCanvas {
  const c = asphaltBase(rng);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 6.2) c.set(x, y, d > 5.2 ? C.m0 : C.m1);
  }
  for (let k = -3; k <= 3; k += 3) { c.rect(4, 7 + k, 8, 1, C.m0); }
  // top-left highlight arc
  for (const [x, y] of [[4, 3], [5, 2], [6, 2], [3, 4], [2, 5]] as const) c.set(x, y, C.m2);
  return c;
}

function dirt(rng: Rng, pebbles: boolean): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.r0);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const r = rng.next();
    if (r < 0.12) c.set(x, y, C.n3);
    else if (r < 0.2) c.set(x, y, C.r1);
  }
  if (pebbles) {
    for (let k = 0; k < 6; k++) {
      const x = rng.int(0, T - 2), y = rng.int(0, T - 2);
      c.set(x, y, C.c1);
      c.set(x + 1, y + 1, C.n2);
    }
  }
  return c;
}

function rubble(rng: Rng): PixelCanvas {
  const c = dirt(rng, false);
  const chunks: [number, number, number, number][] = [[2, 3, 4, 3], [9, 2, 3, 3], [5, 9, 5, 3], [11, 10, 3, 4]];
  for (const [x, y, w, h] of chunks) {
    c.rect(x + 1, y + 1, w, h, C.o1); // shadow, bottom-right
    c.rect(x, y, w, h, C.c1);
    c.rect(x, y, w, 1, C.c2);
    c.set(x + w - 1, y + h - 1, C.c0);
  }
  return c;
}

// ── Water & docks ──────────────────────────────────────────────────────────

// Wave crests: [x, y, length]. Each frame shifts 4 px; 4 frames loop seamlessly over 16 px.
const WAVES: [number, number, number][] = [[1, 2, 5], [10, 5, 4], [4, 9, 6], [13, 12, 4], [7, 14, 3]];

function water(frame: number): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.w1);
  // Darker depth bands give the surface structure without noise.
  for (const y of [0, 7, 11]) c.rect(0, y, T, 1, C.w0);
  for (const [x0, y, len] of WAVES) {
    for (let k = 0; k < len; k++) {
      const x = (x0 + k + frame * 4) % T;
      c.set(x, y, k < len - 1 ? C.w2 : C.w3);
      if (k > 0 && k < len - 1) c.set(x, y + 1, C.w0); // crest shadow
    }
  }
  return c;
}

function quayEdgeN(rng: Rng): PixelCanvas {
  const c = tile().rect(0, 0, T, T, C.c1);
  c.rect(0, 0, T, 1, C.o1);
  c.rect(0, 1, T, 1, C.c3);
  c.rect(0, 2, T, 1, C.c2);
  for (let x = 0; x < T; x += 8) c.rect(x + 7, 3, 1, T - 3, C.c0);
  c.rect(0, 10, T, 1, C.c0);
  for (let k = 0; k < 5; k++) c.set(rng.int(0, 15), rng.int(4, 15), C.c0);
  // hazard edge paint
  for (let x = 0; x < T; x += 4) c.rect(x, 3, 2, 1, C.i2);
  return c;
}

function dockPlanksH(rng: Rng): PixelCanvas {
  const c = tile();
  for (let p = 0; p < 4; p++) {
    const y = p * 4;
    c.rect(0, y, T, 1, C.r3);
    c.rect(0, y + 1, T, 2, C.r2);
    c.rect(0, y + 3, T, 1, C.r0);
    const seam = (5 + p * 7) % T;
    c.rect(seam, y, 1, 3, C.r0);
    c.set((seam + 2) % T, y + 1, C.m2);
    if (rng.chance(0.6)) c.set(rng.int(0, 15), y + 2, C.r1);
  }
  return c;
}

export function tileAssets(): AssetDef[] {
  const rng = createRng(0x7173);
  const fresh = (salt: number) => createRng(0x7173 ^ salt);
  const lane = laneDash(fresh(1)), center = centerDouble(fresh(2)), stop = stopLine(fresh(3)), cross = crosswalk(fresh(4));
  const arrow = arrowNorth(fresh(5));
  const planks = dockPlanksH(fresh(6));
  return [
    makeAsset('asphalt_0', [asphaltBase(fresh(10))], []),
    makeAsset('asphalt_1', [asphaltCracked(fresh(11))], []),
    makeAsset('asphalt_2', [asphaltOil(fresh(12))], []),
    makeAsset('asphalt_3', [asphaltWet(fresh(13))], [C.k1]),
    makeAsset('lane_dash_h', [lane], []),
    makeAsset('lane_dash_v', [transpose(lane)], []),
    makeAsset('center_double_h', [center], []),
    makeAsset('center_double_v', [transpose(center)], []),
    makeAsset('stop_line_h', [stop], []),
    makeAsset('stop_line_v', [transpose(stop)], []),
    // Zebra bars run parallel to traffic: a horizontal road gets horizontal bars.
    makeAsset('crosswalk_h', [transpose(cross)], []),
    makeAsset('crosswalk_v', [cross], []),
    makeAsset('arrow_n', [arrow], []),
    makeAsset('arrow_e', [rotateCW(arrow)], []),
    makeAsset('arrow_s', [rotateCW(rotateCW(arrow))], []),
    makeAsset('arrow_w', [rotateCW(rotateCW(rotateCW(arrow)))], []),
    makeAsset('sidewalk_0', [sidewalkPavers(fresh(20))], []),
    makeAsset('sidewalk_1', [sidewalkBond(fresh(21))], []),
    ...Array.from({ length: 16 }, (_, m) => makeAsset(`curb_${m}`, [curb(m, fresh(20))], [])),
    makeAsset('plaza_0', [plazaLights()], [C.k1]),
    makeAsset('plaza_1', [plazaChecker()], []),
    makeAsset('grate', [grate()], []),
    makeAsset('manhole', [manhole(fresh(30))], []),
    makeAsset('dirt_0', [dirt(fresh(31), false)], []),
    makeAsset('dirt_1', [dirt(fresh(32), true)], []),
    makeAsset('rubble', [rubble(fresh(33))], []),
    makeAsset('water', [0, 1, 2, 3].map(water), [], { fps: 4 }),
    makeAsset('quay_edge_n', [quayEdgeN(rng)], []),
    makeAsset('dock_planks_h', [planks], []),
    makeAsset('dock_planks_v', [transpose(planks)], []),
  ];
}
