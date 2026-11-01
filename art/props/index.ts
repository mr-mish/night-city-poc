// Street props. Every sprite stands on its bottom row so it can be anchored at its base.
// Interiors are drawn first, then outlined with o1 (dark navy), light from the top-left.
import { PixelCanvas } from '../lib/pixels.ts';
import { makeAsset, type AssetDef } from '../lib/asset.ts';
import { C } from '../palette.ts';

type Pt = readonly [number, number];
const NEON = [C.p2, C.p3, C.k2, C.k3, C.u1, C.u2, C.i2, C.i3, C.l0];

function poly(c: PixelCanvas, pts: readonly Pt[], i: number): PixelCanvas {
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k] as Pt, b = pts[k + 1] as Pt;
    c.line(a[0], a[1], b[0], b[1], i);
  }
  return c;
}

function disc(c: PixelCanvas, cx: number, cy: number, r: number, i: number): PixelCanvas {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if (Math.hypot(x - cx, y - cy) <= r) c.set(x, y, i);
  }
  return c;
}

// ── Lighting fixtures ──────────────────────────────────────────────────────

function lampHead(c: PixelCanvas, x: number, y: number, flip: boolean): void {
  // housing 6×3, lamp face underneath, short downward spill
  c.rect(x, y, 6, 2, C.m1);
  c.rect(x, y, 6, 1, C.m2);
  c.rect(x + 1, y + 2, 4, 1, C.l0);
  c.rect(flip ? x + 1 : x + 2, y + 2, 2, 1, C.i3);
}

/** Light spill under a lamp head, drawn after outlining so light pixels stay un-outlined. */
function lampSpill(c: PixelCanvas, x: number, y: number): void {
  for (let k = 0; k < 4; k++) if (c.get(x + 1 + k, y + 3) === 0 || c.get(x + 1 + k, y + 3) === C.o1) c.set(x + 1 + k, y + 3, C.i3);
  for (let k = 0; k < 3; k++) c.set(x + 1 + k * 2, y + 5, C.i2);
}

function streetlight(): PixelCanvas {
  const c = new PixelCanvas(16, 48);
  c.rect(5, 44, 6, 3, C.m0); // base plinth
  c.rect(5, 44, 6, 1, C.m1);
  c.rect(7, 9, 2, 35, C.m1); // pole
  c.rect(7, 9, 1, 35, C.m2);
  c.rect(7, 7, 5, 2, C.m1); // arm
  c.rect(7, 7, 5, 1, C.m2);
  lampHead(c, 9, 5, false);
  c.rect(7, 30, 2, 3, C.k2); // neon ring on pole
  c.outline(C.o1);
  lampSpill(c, 9, 5);
  return c;
}

function streetlightDouble(): PixelCanvas {
  const c = new PixelCanvas(32, 48);
  c.rect(12, 44, 8, 3, C.m0);
  c.rect(12, 44, 8, 1, C.m1);
  c.rect(15, 9, 2, 35, C.m1);
  c.rect(15, 9, 1, 35, C.m2);
  c.rect(6, 7, 20, 2, C.m1);
  c.rect(6, 7, 20, 1, C.m2);
  lampHead(c, 2, 5, true);
  lampHead(c, 24, 5, false);
  c.rect(15, 30, 2, 3, C.k2);
  c.outline(C.o1);
  lampSpill(c, 2, 5);
  lampSpill(c, 24, 5);
  return c;
}

function trafficLight(): PixelCanvas {
  const c = new PixelCanvas(16, 48);
  c.rect(6, 44, 4, 3, C.m0);
  c.rect(7, 18, 2, 26, C.m1);
  c.rect(7, 18, 1, 26, C.m2);
  c.rect(4, 3, 8, 16, C.n2); // housing
  c.rect(4, 3, 8, 1, C.n4);
  c.rect(4, 3, 1, 16, C.n3);
  disc(c, 7.5, 6.5, 1.6, C.i0); // red (off)
  disc(c, 7.5, 10.5, 1.6, C.r1); // amber (off)
  disc(c, 7.5, 14.5, 1.6, C.u1); // green (on)
  c.set(7, 14, C.u2);
  c.rect(3, 5, 1, 2, C.n1); // visors
  c.rect(3, 9, 1, 2, C.n1);
  c.rect(3, 13, 1, 2, C.n1);
  return c.outline(C.o1);
}

// ── Machines ───────────────────────────────────────────────────────────────

function vendingMachine(): PixelCanvas {
  const c = new PixelCanvas(16, 32);
  c.rect(1, 2, 14, 29, C.p1); // body
  c.rect(1, 2, 14, 1, C.p3);
  c.rect(1, 2, 1, 29, C.p2);
  c.rect(14, 2, 1, 29, C.p0);
  c.rect(2, 3, 12, 2, C.k2); // lit header
  c.rect(3, 6, 8, 15, C.k3); // display window
  const goods = [C.p2, C.u1, C.i2, C.k1, C.r2];
  for (let row = 0; row < 4; row++) {
    c.rect(3, 9 + row * 4, 8, 1, C.m2); // shelf
    for (let k = 0; k < 4; k++) c.rect(3 + k * 2, 7 + row * 4, 1, 2, goods[(row + k) % goods.length] as number);
  }
  c.rect(3, 6, 8, 1, C.l0);
  c.rect(12, 7, 1, 6, C.o2); // button column
  for (let k = 0; k < 3; k++) c.set(12, 8 + k * 2, C.k2);
  c.rect(4, 24, 8, 3, C.o0); // dispenser slot
  c.rect(4, 24, 8, 1, C.o2);
  c.rect(2, 30, 12, 1, C.p0);
  return c.outline(C.o1);
}

function dataTerminal(): PixelCanvas {
  const c = new PixelCanvas(16, 32);
  c.rect(5, 12, 6, 17, C.m1); // pillar
  c.rect(5, 12, 1, 17, C.m2);
  c.rect(4, 28, 8, 3, C.m0); // base
  c.rect(2, 2, 12, 10, C.m0); // head
  c.rect(2, 2, 12, 1, C.m2);
  c.rect(3, 3, 10, 7, C.k1); // screen
  for (const y of [4, 6, 8]) c.rect(4, y, 4 + (y % 3), 1, C.k3);
  c.set(11, 8, C.l0);
  c.rect(6, 15, 4, 3, C.m2); // keypad
  c.set(7, 16, C.k2);
  return c.outline(C.o1);
}

// ── Street furniture ───────────────────────────────────────────────────────

function bench(): PixelCanvas {
  const c = new PixelCanvas(32, 16);
  c.rect(3, 2, 26, 4, C.r1); // backrest
  c.rect(3, 2, 26, 1, C.r3);
  c.rect(3, 4, 26, 1, C.r0);
  c.rect(3, 7, 26, 4, C.r2); // seat
  c.rect(3, 7, 26, 1, C.r3);
  c.rect(3, 10, 26, 1, C.r1);
  for (const x of [5, 25]) c.rect(x, 11, 2, 4, C.m0); // legs
  c.rect(4, 6, 24, 1, C.m1); // frame
  return c.outline(C.o1);
}

function hydrant(): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  c.rect(5, 4, 6, 10, C.i1);
  c.rect(5, 4, 2, 10, C.i2);
  c.rect(4, 2, 8, 2, C.m2); // cap
  c.rect(6, 1, 4, 1, C.m3);
  c.rect(3, 7, 10, 2, C.i0); // side outlets
  c.set(3, 7, C.m2);
  c.set(12, 7, C.m2);
  c.rect(4, 14, 8, 1, C.m0);
  return c.outline(C.o1);
}

function dumpster(): PixelCanvas {
  const c = new PixelCanvas(32, 24);
  c.rect(2, 3, 28, 4, C.n3); // lid (top face)
  c.rect(2, 3, 28, 1, C.n4);
  c.rect(2, 7, 28, 13, C.u0); // body
  c.rect(2, 7, 28, 1, C.u1);
  for (let x = 6; x < 30; x += 6) c.rect(x, 8, 1, 12, C.o2); // ribs
  c.rect(2, 7, 1, 13, C.u1);
  c.rect(10, 11, 12, 3, C.u2); // hazard plate
  for (let x = 11; x < 21; x += 3) c.set(x, 12, C.o0);
  for (const x of [4, 25]) c.rect(x, 20, 3, 3, C.o0); // wheels
  c.rect(14, 1, 6, 2, C.n2); // trash poking out
  c.set(15, 1, C.c1);
  return c.outline(C.o1);
}

function trashBags(): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  disc(c, 5.5, 10.5, 4, C.n3);
  disc(c, 10.5, 11, 3.5, C.n2);
  disc(c, 8, 6.5, 3, C.n4);
  c.set(4, 8, C.c0); // highlights
  c.set(7, 4, C.c1);
  c.set(8, 3, C.o2); // tie knot
  c.set(8, 2, C.o2);
  c.rect(1, 14, 14, 1, C.o2);
  return c.outline(C.o1);
}

function trafficCone(): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  c.rect(3, 12, 10, 2, C.n2); // base
  c.rect(3, 12, 10, 1, C.n3);
  for (let y = 2; y < 12; y++) {
    const half = 1 + Math.floor((y - 2) / 2);
    c.rect(8 - half, y, half * 2, 1, C.i1);
    c.set(8 - half, y, C.i2);
  }
  c.rect(5, 6, 6, 1, C.c4); // reflective bands
  c.rect(4, 9, 8, 1, C.c4);
  return c.outline(C.o1);
}

function barrier(): PixelCanvas {
  const c = new PixelCanvas(32, 16);
  c.rect(2, 3, 28, 4, C.c2); // top face
  c.rect(2, 3, 28, 1, C.c3);
  c.rect(2, 7, 28, 7, C.c1); // front face
  c.rect(1, 12, 30, 2, C.c0); // wider foot
  for (let x = 2; x < 30; x += 4) poly(c, [[x, 10], [x + 2, 7]], C.i2); // hazard stripes
  for (let x = 4; x < 30; x += 4) poly(c, [[x, 10], [x + 2, 7]], C.o2);
  return c.outline(C.o1);
}

function bollard(): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  c.rect(6, 4, 4, 10, C.m1);
  c.rect(6, 4, 1, 10, C.m2);
  c.rect(6, 3, 4, 1, C.m3);
  c.rect(6, 6, 4, 2, C.k2); // light band
  c.rect(5, 14, 6, 1, C.m0);
  return c.outline(C.o1);
}

function container(body: [number, number, number]): PixelCanvas {
  const [dark, mid, light] = body;
  const c = new PixelCanvas(48, 24);
  c.rect(1, 1, 46, 5, light); // roof (top face)
  c.rect(1, 1, 46, 1, C.c3);
  c.rect(1, 6, 46, 17, mid); // side
  for (let x = 2; x < 38; x += 2) c.rect(x, 7, 1, 15, dark); // corrugation
  c.rect(38, 6, 9, 17, dark); // door end
  for (const x of [40, 44]) c.rect(x, 7, 1, 15, C.m3); // lock rods
  c.rect(39, 12, 7, 1, C.m2);
  c.rect(1, 6, 46, 1, C.o2); // roof edge shadow
  c.rect(4, 15, 8, 3, C.c4); // blank ID plate (no text)
  return c.outline(C.o1);
}

// ── Neon signs (2-frame flicker) ───────────────────────────────────────────

type Tube = { pts: Pt[]; color: number };
const DIM: Record<number, number> = { [C.p2]: C.p0, [C.k2]: C.k0, [C.k3]: C.k1, [C.u1]: C.u0, [C.u2]: C.u0, [C.i2]: C.i0 };

function neonSign(w: number, h: number, tubes: Tube[], flicker: number): PixelCanvas[] {
  return [0, 1].map((frame) => {
    const c = new PixelCanvas(w, h);
    c.rect(1, 1, w - 2, h - 2, C.o0); // backing panel
    c.rect(1, 1, w - 2, 1, C.o2);
    tubes.forEach((t, k) => poly(c, t.pts, frame === 1 && k === flicker ? (DIM[t.color] ?? t.color) : t.color));
    return c.outline(C.o1);
  });
}

const NEON_SIGNS: { w: number; h: number; tubes: Tube[]; flicker: number }[] = [
  { // noodle bowl with chopsticks and steam
    w: 16, h: 16, flicker: 2, tubes: [
      { pts: [[3, 8], [12, 8], [10, 12], [5, 12], [3, 8]], color: C.p2 },
      { pts: [[6, 2], [9, 7]], color: C.k2 },
      { pts: [[9, 2], [12, 7]], color: C.k2 },
      { pts: [[4, 5], [4, 6]], color: C.p2 },
    ] },
  { // cat face
    w: 16, h: 16, flicker: 1, tubes: [
      { pts: [[3, 12], [3, 5], [5, 3], [7, 6], [8, 6], [10, 3], [12, 5], [12, 12], [10, 13], [5, 13], [3, 12]], color: C.k2 },
      { pts: [[6, 9], [6, 9]], color: C.k3 },
      { pts: [[9, 9], [9, 9]], color: C.k3 },
    ] },
  { // capsule
    w: 24, h: 16, flicker: 1, tubes: [
      { pts: [[12, 4], [5, 4], [3, 6], [3, 9], [5, 11], [12, 11], [12, 4]], color: C.u1 },
      { pts: [[12, 4], [18, 4], [20, 6], [20, 9], [18, 11], [12, 11]], color: C.u2 },
    ] },
  { // lightning bolt
    w: 16, h: 24, flicker: 0, tubes: [
      { pts: [[9, 2], [4, 12], [8, 12], [5, 21], [12, 9], [8, 9], [11, 2], [9, 2]], color: C.i2 },
    ] },
  { // cocktail glass with olive
    w: 16, h: 24, flicker: 1, tubes: [
      { pts: [[2, 4], [13, 4], [8, 11], [7, 11], [2, 4]], color: C.p2 },
      { pts: [[7, 11], [7, 18]], color: C.p2 },
      { pts: [[4, 19], [11, 19]], color: C.p2 },
      { pts: [[10, 2], [9, 6]], color: C.u1 },
    ] },
  { // abstract eye
    w: 24, h: 16, flicker: 1, tubes: [
      { pts: [[2, 8], [7, 4], [16, 4], [21, 8], [16, 12], [7, 12], [2, 8]], color: C.k2 },
      { pts: [[11, 7], [12, 7], [12, 9], [11, 9], [11, 7]], color: C.p2 },
    ] },
];

// ── Holo-ads (4-frame loop) ────────────────────────────────────────────────

function holoPanel(): PixelCanvas {
  const c = new PixelCanvas(32, 32);
  c.rect(1, 1, 30, 30, C.g0);
  for (let y = 2; y < 30; y += 2) c.rect(2, y, 28, 1, C.w0); // scanlines
  c.rect(1, 1, 30, 1, C.g2);
  c.rect(1, 30, 30, 1, C.g1);
  for (const [x, y] of [[1, 1], [29, 1], [1, 29], [29, 29]] as const) c.rect(x, y, 2, 2, C.m2); // corner clamps
  return c;
}

function holoRings(f: number): PixelCanvas {
  const c = holoPanel();
  for (let y = 3; y < 29; y++) for (let x = 3; x < 29; x++) {
    const d = Math.hypot(x - 15.5, y - 15.5);
    const r = 3 + f * 3;
    if (Math.abs(d - r) < 0.6) c.set(x, y, C.k2);
    else if (r > 4 && Math.abs(d - (r - 4)) < 0.5) c.set(x, y, C.k0);
  }
  disc(c, 15.5, 15.5, 1.5, C.k3);
  return c.outline(C.o1);
}

function holoBars(f: number): PixelCanvas {
  const c = holoPanel();
  const heights = [[6, 12, 9, 15, 7, 11], [9, 8, 14, 10, 12, 6], [13, 10, 7, 12, 15, 9], [8, 15, 11, 7, 10, 13]][f] as number[];
  heights.forEach((h, k) => {
    const x = 5 + k * 4;
    c.rect(x, 27 - h, 3, h, C.p1);
    c.rect(x, 27 - h, 3, 1, C.p3);
  });
  c.rect(4, 27, 24, 1, C.p2);
  return c.outline(C.o1);
}

function holoCube(f: number): PixelCanvas {
  const c = holoPanel();
  const a = (f * Math.PI) / 8 + Math.PI / 16; // offset avoids a flat face-on frame; 4 frames span 90° so it loops
  const tilt = 0.5;
  const verts = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as const)));
  const proj = verts.map(([x, y, z]) => {
    const rx = x * Math.cos(a) - z * Math.sin(a);
    const rz = x * Math.sin(a) + z * Math.cos(a);
    const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
    return [Math.round(15.5 + rx * 7), Math.round(15.5 + ry * 7)] as const;
  });
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const vi = verts[i] as readonly number[], vj = verts[j] as readonly number[];
    const diff = vi.reduce((n, v, k) => n + (v !== vj[k] ? 1 : 0), 0);
    if (diff === 1) c.line((proj[i] as Pt)[0], (proj[i] as Pt)[1], (proj[j] as Pt)[0], (proj[j] as Pt)[1], j < 4 ? C.p2 : C.k2);
  }
  for (const p of proj) c.set(p[0], p[1], C.k3);
  return c.outline(C.o1);
}

export function propAssets(): AssetDef[] {
  const glow = NEON;
  return [
    makeAsset('streetlight', [streetlight()], glow),
    makeAsset('streetlight_double', [streetlightDouble()], glow),
    makeAsset('traffic_light', [trafficLight()], glow),
    ...NEON_SIGNS.map((s, i) => makeAsset(`neon_sign_${i}`, neonSign(s.w, s.h, s.tubes, s.flicker), glow, { fps: 3 })),
    ...[holoRings, holoBars, holoCube].map((fn, i) => makeAsset(`holo_ad_${i}`, [0, 1, 2, 3].map(fn), [C.k2, C.k3, C.p1, C.p2, C.p3], { fps: 6 })),
    makeAsset('vending_machine', [vendingMachine()], [C.k2, C.k3, C.l0]),
    makeAsset('data_terminal', [dataTerminal()], [C.k1, C.k2, C.k3, C.l0]),
    makeAsset('bench', [bench()], []),
    makeAsset('hydrant', [hydrant()], []),
    makeAsset('dumpster', [dumpster()], []),
    makeAsset('trash_bags', [trashBags()], []),
    makeAsset('traffic_cone', [trafficCone()], []),
    makeAsset('barrier', [barrier()], []),
    makeAsset('bollard', [bollard()], [C.k2]),
    makeAsset('container_0', [container([C.r0, C.r1, C.r2])], []),
    makeAsset('container_1', [container([C.i0, C.i1, C.i2])], []),
    makeAsset('container_2', [container([C.k0, C.k1, C.k2])], []),
  ];
}
