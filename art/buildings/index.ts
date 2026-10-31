// Modular building kit: 16×16 facade (south wall) and roof (top-down) modules.
// Authored once in Meridian Core ramps — walls m0..m3, accents k0..k3 — then remapped per district.
import { PixelCanvas } from '../lib/pixels.ts';
import { makeAsset, remapAsset, type AssetDef } from '../lib/asset.ts';
import { C, DISTRICT_REMAP, type District } from '../palette.ts';
import { createRng, type Rng } from '../../src/core/rng.ts';

const T = 16;
const GLOW = [C.k2, C.k3, C.l0, C.i3, C.i2];

// ── Facade ─────────────────────────────────────────────────────────────────

/** Plain panelled wall with a floor line at the bottom so stacked modules read as storeys. */
function wallPanels(): PixelCanvas {
  const c = new PixelCanvas(T, T).rect(0, 0, T, T, C.m1);
  c.rect(0, 0, T, 1, C.m2); // top-left light catches the panel tops
  for (const x of [0, 8]) c.rect(x, 1, 1, 14, C.m2);
  for (const x of [7, 15]) c.rect(x, 0, 1, T, C.m0);
  c.rect(0, 15, T, 1, C.o2); // floor line
  c.set(3, 4, C.m0); // rivets
  c.set(11, 4, C.m0);
  return c;
}

function wallRibbed(): PixelCanvas {
  const c = new PixelCanvas(T, T).rect(0, 0, T, T, C.m1);
  for (let y = 0; y < 15; y += 3) {
    c.rect(0, y, T, 1, C.m2);
    c.rect(0, y + 2, T, 1, C.m0);
  }
  c.rect(0, 15, T, 1, C.o2);
  return c;
}

/** Window frame + sill on a panelled wall; `fill` paints the 10×8 pane (x 3..12, y 3..10). */
function windowModule(fill: (c: PixelCanvas) => void): PixelCanvas {
  const c = wallPanels();
  c.rect(2, 2, 12, 10, C.m3); // frame
  c.rect(3, 3, 10, 8, C.g0);
  fill(c);
  c.rect(2, 12, 12, 1, C.m0); // sill shadow
  c.rect(3, 11, 11, 1, C.m2); // sill top
  return c;
}

const windowLit = [
  // Cool office light behind blinds.
  () => windowModule((c) => {
    c.rect(3, 3, 10, 8, C.k3);
    for (const y of [4, 6, 8]) c.rect(3, y, 10, 1, C.k2);
    c.rect(3, 3, 3, 1, C.l0);
  }),
  // Warm apartment interior with a silhouetted shelf and plant.
  () => windowModule((c) => {
    c.rect(3, 3, 10, 8, C.i3);
    c.rect(3, 3, 10, 1, C.l0);
    c.rect(3, 8, 10, 1, C.o2); // shelf
    c.rect(9, 5, 3, 3, C.o2); // plant
    c.set(10, 4, C.o2);
    c.rect(4, 9, 2, 2, C.i2); // lamp glow
  }),
  // Split pane with a glowing holo-screen.
  () => windowModule((c) => {
    c.rect(3, 3, 10, 8, C.k2);
    c.rect(7, 3, 2, 8, C.m3); // mullion
    c.rect(4, 4, 2, 3, C.l0);
    c.rect(10, 5, 2, 4, C.k3);
  }),
];

const windowDark = [
  () => windowModule((c) => {
    c.rect(3, 7, 10, 4, C.g1);
    c.line(4, 9, 9, 4, C.g2); // reflection diagonal
    c.line(5, 10, 10, 5, C.g2);
  }),
  () => windowModule((c) => {
    c.rect(3, 3, 10, 8, C.g1);
    for (const y of [4, 6, 8, 10]) c.rect(3, y, 10, 1, C.g0); // closed blinds
  }),
  () => windowModule((c) => {
    c.rect(7, 3, 2, 8, C.m3);
    c.rect(3, 6, 10, 1, C.m3);
    c.line(3, 5, 5, 3, C.g2);
    c.line(9, 10, 12, 7, C.g2);
  }),
];

function storeShutter(rng: Rng): PixelCanvas {
  const c = new PixelCanvas(T, T).rect(0, 0, T, T, C.m1);
  c.rect(0, 0, T, 1, C.k2); // neon trim
  c.rect(0, 1, T, 2, C.m0); // shutter housing
  c.rect(0, 1, T, 1, C.m2);
  for (let y = 3; y < T; y++) c.rect(1, y, 14, 1, y % 2 === 0 ? C.m1 : C.m0);
  c.rect(0, 3, 1, 13, C.o2);
  c.rect(15, 3, 1, 13, C.o2);
  // spray tag
  let x = rng.int(3, 5), y = 9;
  for (let k = 0; k < 7; k++) { c.set(x + k, y, C.k1); y += rng.chance(0.5) ? 1 : -1; y = Math.max(7, Math.min(12, y)); }
  return c;
}

function storeOpen(): PixelCanvas {
  const c = new PixelCanvas(T, T).rect(0, 0, T, T, C.i3);
  c.rect(0, 0, T, 1, C.k2); // neon trim
  c.rect(0, 1, T, 1, C.m0);
  c.rect(0, 2, 1, 14, C.m3);
  c.rect(15, 2, 1, 14, C.m3);
  for (const y of [7, 12]) c.rect(1, y, 14, 1, C.i1); // shelves
  const goods = [C.r2, C.k1, C.u1, C.p2, C.c3];
  for (let x = 2; x < 14; x += 2) { c.set(x, 6, goods[x % goods.length] as number); c.set(x + 1, 11, goods[(x + 2) % goods.length] as number); }
  c.rect(1, 2, 14, 1, C.l0); // ceiling light
  c.rect(1, 15, 14, 1, C.i1); // counter edge
  return c;
}

function door(): PixelCanvas {
  const c = wallPanels();
  c.rect(4, 2, 8, 14, C.m0); // frame
  c.rect(5, 3, 6, 13, C.m2);
  c.rect(6, 4, 4, 5, C.g1); // glass
  c.line(6, 7, 8, 5, C.g2);
  c.set(10, 11, C.m3); // handle
  c.rect(12, 9, 2, 3, C.o2); // keypad
  c.set(12, 10, C.k2);
  c.rect(4, 2, 8, 1, C.k2); // lit transom strip
  return c;
}

function acUnit(): PixelCanvas {
  const c = wallPanels();
  c.rect(4, 6, 10, 7, C.o1); // shadow / outline offset
  c.rect(3, 5, 10, 7, C.m2);
  c.rect(3, 5, 10, 1, C.m3);
  for (let y = 7; y < 11; y += 1) if (y % 2 === 1) c.rect(4, y, 4, 1, C.o2); // grille
  c.rect(9, 7, 3, 3, C.m0); // fan
  c.set(10, 8, C.m3);
  c.rect(6, 12, 1, 3, C.n3); // drip stain
  return c;
}

function pipes(): PixelCanvas {
  const c = wallPanels();
  for (const x of [3, 10]) {
    c.rect(x, 0, 3, T, C.m2);
    c.rect(x, 0, 1, T, C.m3);
    c.rect(x + 2, 0, 1, T, C.o2);
    c.rect(x - 1, 4, 5, 1, C.m0); // brackets
    c.rect(x - 1, 12, 5, 1, C.m0);
  }
  c.line(0, 9, 15, 7, C.o1); // sagging cable
  return c;
}

function balcony(): PixelCanvas {
  const c = wallPanels();
  c.rect(1, 9, 14, 2, C.m3); // slab
  c.rect(1, 11, 14, 1, C.m0);
  c.rect(1, 12, 14, 2, C.o2); // shadow under
  c.rect(1, 5, 14, 1, C.m3); // rail
  for (let x = 1; x < 15; x += 2) c.rect(x, 6, 1, 3, C.m3);
  c.rect(6, 7, 3, 2, C.k1); // potted light / sign
  return c;
}

function baseTrim(): PixelCanvas {
  const c = wallPanels();
  c.rect(0, 9, T, 1, C.m0);
  c.rect(0, 10, T, 6, C.c0);
  c.rect(0, 10, T, 1, C.c1);
  for (let x = 3; x < T; x += 5) c.rect(x, 11, 1, 5, C.n4);
  return c;
}

// ── Roof (top-down) ────────────────────────────────────────────────────────

function roofTar(): PixelCanvas {
  const c = new PixelCanvas(T, T).rect(0, 0, T, T, C.n2);
  for (let y = 0; y < T; y += 2) for (let x = (y / 2) % 2 === 0 ? 0 : 2; x < T; x += 4) c.set(x, y, C.n1);
  c.rect(0, 7, T, 1, C.n1); // membrane seam
  c.rect(0, 8, T, 1, C.n3);
  return c;
}

function roofGravel(rng: Rng): PixelCanvas {
  const c = new PixelCanvas(T, T).rect(0, 0, T, T, C.n3);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const r = rng.next();
    if (r < 0.14) c.set(x, y, C.c0);
    else if (r < 0.26) c.set(x, y, C.n2);
  }
  return c;
}

type Edge = 'n' | 'e' | 's' | 'w';
/** Parapet caps on the given edges. North/west caps cast an inner shadow (light from top-left). */
function parapet(edges: Edge[]): PixelCanvas {
  const c = roofTar();
  const has = (e: Edge) => edges.includes(e);
  if (has('n')) c.rect(0, 3, T, 1, C.o1);
  if (has('w')) c.rect(3, 0, 1, T, C.o1);
  if (has('n')) { c.rect(0, 0, T, 3, C.m2); c.rect(0, 0, T, 1, C.m3); }
  if (has('w')) { c.rect(0, 0, 3, T, C.m2); c.rect(0, 0, 1, T, C.m3); }
  if (has('s')) { c.rect(0, 13, T, 3, C.m1); c.rect(0, 13, T, 1, C.m2); }
  if (has('e')) { c.rect(13, 0, 3, T, C.m1); c.rect(13, 0, 1, T, C.m2); }
  return c;
}

function vent(): PixelCanvas {
  const c = roofTar();
  c.rect(5, 6, 9, 7, C.o1); // shadow, bottom-right
  c.rect(4, 5, 8, 6, C.o1); // outline
  c.rect(5, 6, 6, 4, C.m2);
  c.rect(5, 6, 6, 1, C.m3);
  for (let x = 6; x < 11; x += 2) c.rect(x, 7, 1, 3, C.m0); // slats
  return c;
}

function waterTank(): PixelCanvas {
  const c = roofTar();
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dShadow = Math.hypot(x - 8.5, y - 8.5);
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (dShadow < 6.5 && d >= 6.5) c.set(x, y, C.o1);
    if (d < 6.5) c.set(x, y, d > 5.5 ? C.o1 : d > 4.5 ? C.m0 : C.m1);
  }
  for (const [x, y] of [[5, 4], [4, 5], [6, 3], [4, 6]] as const) c.set(x, y, C.m3);
  c.rect(7, 7, 2, 2, C.m0); // hatch
  return c;
}

function antenna(): PixelCanvas {
  const c = roofTar();
  c.rect(6, 12, 5, 2, C.o1);
  c.rect(6, 11, 4, 2, C.m0);
  c.rect(8, 2, 1, 10, C.m3);
  c.rect(9, 3, 1, 9, C.o1); // mast shadow
  for (const y of [4, 7]) c.rect(6, y, 5, 1, C.m2);
  c.set(8, 1, C.i2); // beacon
  return c;
}

function helipad(): PixelCanvas {
  const c = roofTar();
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 6.2 && d < 7.3 && (Math.floor(Math.atan2(y - 7.5, x - 7.5) * 4) % 2 === 0)) c.set(x, y, C.k2);
  }
  c.rect(5, 4, 1, 8, C.c4); // H
  c.rect(10, 4, 1, 8, C.c4);
  c.rect(5, 7, 6, 2, C.c4);
  return c;
}

function billboardMount(): PixelCanvas {
  const c = roofTar();
  c.rect(2, 4, 12, 1, C.m2); // top rail
  c.rect(2, 11, 12, 1, C.m0); // bottom rail
  for (const x of [2, 7, 13]) c.rect(x, 4, 1, 8, C.m1);
  c.line(2, 11, 7, 4, C.m1);
  c.line(7, 11, 13, 4, C.m1);
  c.rect(3, 12, 11, 1, C.o1); // shadow
  return c;
}

/** Full kit in core ramps. */
function coreKit(): AssetDef[] {
  const rng = createRng(0xb1d6);
  return [
    makeAsset('wall_0', [wallPanels()], GLOW),
    makeAsset('wall_1', [wallRibbed()], GLOW),
    ...windowLit.map((f, i) => makeAsset(`window_lit_${i}`, [f()], GLOW)),
    ...windowDark.map((f, i) => makeAsset(`window_dark_${i}`, [f()], GLOW)),
    makeAsset('store_shutter', [storeShutter(rng)], GLOW),
    makeAsset('store_open', [storeOpen()], GLOW),
    makeAsset('door', [door()], GLOW),
    makeAsset('ac_unit', [acUnit()], GLOW),
    makeAsset('pipes', [pipes()], GLOW),
    makeAsset('balcony', [balcony()], GLOW),
    makeAsset('base_trim', [baseTrim()], GLOW),
    makeAsset('roof_0', [roofTar()], GLOW),
    makeAsset('roof_1', [roofGravel(rng)], GLOW),
    makeAsset('parapet_n', [parapet(['n'])], GLOW),
    makeAsset('parapet_e', [parapet(['e'])], GLOW),
    makeAsset('parapet_s', [parapet(['s'])], GLOW),
    makeAsset('parapet_w', [parapet(['w'])], GLOW),
    makeAsset('parapet_corner_ne', [parapet(['n', 'e'])], GLOW),
    makeAsset('parapet_corner_nw', [parapet(['n', 'w'])], GLOW),
    makeAsset('parapet_corner_se', [parapet(['s', 'e'])], GLOW),
    makeAsset('parapet_corner_sw', [parapet(['s', 'w'])], GLOW),
    makeAsset('vent', [vent()], GLOW),
    makeAsset('water_tank', [waterTank()], GLOW),
    makeAsset('antenna', [antenna()], GLOW),
    makeAsset('helipad', [helipad()], GLOW),
    makeAsset('billboard_mount', [billboardMount()], GLOW),
  ];
}

export function buildingAssets(district: District): AssetDef[] {
  return coreKit().map((d) => remapAsset(d, DISTRICT_REMAP[district], d.name));
}
