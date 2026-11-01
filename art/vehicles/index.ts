// Vehicle skins for box-based low-poly models. One canvas per model with UV regions (`parts`).
// Skins use 12 px per world unit so each model fits its atlas size. Paint is authored in the
// magenta ramp (p0..p3) and remapped for colour variants.
import { PixelCanvas } from '../lib/pixels.ts';
import { makeAsset, remapAsset, type AssetDef } from '../lib/asset.ts';
import type { Rect } from '../lib/atlas.ts';
import { C, VEHICLE_REMAP, VEHICLE_VARIANTS } from '../palette.ts';

type Part = 'roof' | 'hood' | 'trunk' | 'side_l' | 'side_r' | 'front' | 'rear' | 'wheel';
type Style = 'compact' | 'muscle' | 'van' | 'hoverbike';
type Model = {
  name: Style;
  w: number;
  h: number;
  parts: Record<Part, Rect>;
  /** Cabin (window band) start/end as fractions of the side length, front = 0. */
  cabin: [number, number];
  /** Wheel centres as fractions of the side length. */
  wheels: number[];
};

const MODELS: Model[] = [
  {
    name: 'compact', w: 64, h: 64, cabin: [0.3, 0.8], wheels: [0.2, 0.8],
    parts: {
      side_l: { x: 0, y: 0, w: 34, h: 14 }, side_r: { x: 0, y: 14, w: 34, h: 14 },
      front: { x: 34, y: 0, w: 19, h: 14 }, rear: { x: 34, y: 14, w: 19, h: 14 },
      wheel: { x: 54, y: 0, w: 10, h: 10 }, roof: { x: 0, y: 28, w: 19, h: 17 },
      trunk: { x: 0, y: 45, w: 19, h: 7 }, hood: { x: 19, y: 28, w: 19, h: 10 },
    },
  },
  {
    name: 'muscle', w: 64, h: 64, cabin: [0.38, 0.72], wheels: [0.18, 0.8],
    parts: {
      side_l: { x: 0, y: 0, w: 41, h: 13 }, side_r: { x: 0, y: 13, w: 41, h: 13 },
      front: { x: 41, y: 0, w: 22, h: 13 }, rear: { x: 41, y: 13, w: 22, h: 13 },
      roof: { x: 0, y: 26, w: 22, h: 14 }, trunk: { x: 0, y: 40, w: 22, h: 8 },
      hood: { x: 22, y: 26, w: 22, h: 15 }, wheel: { x: 54, y: 54, w: 10, h: 10 },
    },
  },
  {
    name: 'van', w: 96, h: 64, cabin: [0.06, 0.3], wheels: [0.17, 0.82],
    parts: {
      side_l: { x: 0, y: 0, w: 46, h: 23 }, side_r: { x: 0, y: 23, w: 46, h: 23 },
      front: { x: 46, y: 0, w: 23, h: 23 }, rear: { x: 46, y: 23, w: 23, h: 23 },
      roof: { x: 69, y: 0, w: 23, h: 36 }, hood: { x: 69, y: 36, w: 23, h: 10 },
      trunk: { x: 69, y: 46, w: 23, h: 4 }, wheel: { x: 86, y: 54, w: 10, h: 10 },
    },
  },
  {
    name: 'hoverbike', w: 64, h: 32, cabin: [0.35, 0.6], wheels: [0.15, 0.85],
    parts: {
      side_l: { x: 0, y: 0, w: 26, h: 11 }, side_r: { x: 0, y: 11, w: 26, h: 11 },
      front: { x: 26, y: 0, w: 10, h: 11 }, rear: { x: 26, y: 11, w: 10, h: 11 },
      roof: { x: 36, y: 0, w: 10, h: 14 }, hood: { x: 46, y: 0, w: 10, h: 8 },
      trunk: { x: 46, y: 8, w: 10, h: 6 }, wheel: { x: 36, y: 14, w: 10, h: 10 },
    },
  },
];

const GLOW = [C.l0, C.k3, C.i2, C.k2];

/** Painted body panel with top highlight and bottom shadow. */
function panel(c: PixelCanvas, r: Rect): void {
  c.rect(r.x, r.y, r.w, r.h, C.p1);
  c.rect(r.x, r.y, r.w, 1, C.p2);
  c.rect(r.x, r.y, 1, r.h, C.p2);
  c.rect(r.x, r.y + r.h - 1, r.w, 1, C.p0);
  c.rect(r.x + r.w - 1, r.y, 1, r.h, C.p0);
}

/** Left side profile, front of the vehicle at the left edge. */
function side(m: Model): PixelCanvas {
  const { w: L, h: H } = m.parts.side_l;
  const c = new PixelCanvas(L, H);
  const bike = m.name === 'hoverbike';
  const beltY = Math.round(H * (m.name === 'van' ? 0.42 : 0.5)); // window line
  const c0 = Math.round(L * m.cabin[0]), c1 = Math.round(L * m.cabin[1]);
  // lower body
  c.rect(0, beltY, L, H - beltY - 2, C.p1);
  c.rect(0, beltY, L, 1, C.p2);
  c.rect(0, H - 3, L, 1, C.p0);
  // cabin / upper body
  if (m.name === 'van') {
    c.rect(0, 1, L, beltY - 1, C.p1);
    c.rect(0, 1, L, 1, C.p2);
    c.rect(c0, 3, c1 - c0, beltY - 4, C.g1); // cab window
    c.line(c0 + 1, beltY - 2, c0 + 4, 4, C.g2);
    c.rect(Math.round(L * 0.45), 2, 1, H - 5, C.p0); // sliding door seam
    c.rect(Math.round(L * 0.45) + 2, beltY + 2, 3, 1, C.m2); // handle
    c.rect(Math.round(L * 0.6), 4, 8, 4, C.g0); // small rear window
  } else if (bike) {
    c.rect(c0, beltY - 3, c1 - c0, 3, C.o2); // seat
    c.rect(c0, beltY - 3, c1 - c0, 1, C.n4);
    c.rect(2, beltY - 2, 4, 2, C.g1); // fairing screen
  } else {
    const slope = m.name === 'muscle' ? 3 : 2;
    for (let y = 1; y < beltY; y++) {
      const inset = Math.round(((beltY - y) / beltY) * slope * 2);
      c.rect(c0 + inset, y, c1 - c0 - inset * 2 + 2, 1, y === 1 ? C.p2 : C.g1);
    }
    c.rect(c0 + Math.round((c1 - c0) / 2), 2, 1, beltY - 2, C.p1); // B-pillar
    c.line(c0 + slope + 2, beltY - 1, c0 + slope + 5, 2, C.g2); // glass glint
    c.set(c0 + slope + 6, 3, C.k3);
    c.rect(Math.round(L * 0.5), beltY + 2, 1, H - beltY - 5, C.p0); // door seam
    c.rect(Math.round(L * 0.5) + 2, beltY + 2, 2, 1, C.m3); // handle
  }
  // wheel arches + wheels (thrusters for the bike)
  for (const f of m.wheels) {
    const cx = Math.round(L * f);
    const r = bike ? 2 : Math.max(3, Math.round(H * 0.28));
    for (let y = H - r * 2; y < H; y++) for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - (H - r));
      if (d <= r) c.set(x, y, bike ? (d < r - 1 ? C.k2 : C.m1) : d < r - 1.5 ? C.m2 : C.o0);
    }
  }
  // lights and underglow
  c.rect(0, beltY + 1, 2, 2, C.l0); // headlight
  c.rect(L - 2, beltY + 1, 2, 2, C.i2); // tail light
  c.rect(Math.round(L * 0.3), H - 1, Math.round(L * 0.4), 1, C.k2); // underglow
  c.set(3, beltY, C.p3); // paint specular
  return c;
}

function front(m: Model): PixelCanvas {
  const { w: W, h: H } = m.parts.front;
  const c = new PixelCanvas(W, H);
  const belt = Math.round(H * 0.5);
  panel(c, { x: 0, y: belt, w: W, h: H - belt });
  if (m.name !== 'hoverbike') {
    c.rect(2, 1, W - 4, belt - 1, C.g1); // windscreen
    c.line(3, belt - 1, 6, 2, C.g2);
    c.rect(1, 0, W - 2, 1, C.p2);
  } else {
    c.rect(3, belt - 3, W - 6, 3, C.g1);
  }
  c.rect(Math.round(W * 0.3), belt + 2, Math.round(W * 0.4), 2, C.o1); // grille
  c.rect(1, belt + 1, 3, 2, C.l0); // headlights
  c.rect(W - 4, belt + 1, 3, 2, C.l0);
  c.set(2, belt + 1, C.k3);
  c.rect(0, H - 2, W, 1, C.m2); // bumper
  return c;
}

function rear(m: Model): PixelCanvas {
  const { w: W, h: H } = m.parts.rear;
  const c = new PixelCanvas(W, H);
  const belt = Math.round(H * 0.5);
  panel(c, { x: 0, y: belt, w: W, h: H - belt });
  if (m.name === 'van') {
    c.rect(1, 1, W - 2, belt - 1, C.p1);
    c.rect(Math.round(W / 2), 1, 1, H - 3, C.p0); // barn doors
    c.rect(3, 3, 6, 4, C.g0);
    c.rect(W - 9, 3, 6, 4, C.g0);
  } else if (m.name !== 'hoverbike') {
    c.rect(3, 2, W - 6, belt - 2, C.g1);
  }
  c.rect(1, belt + 1, 4, 1, C.i2); // tail lights
  c.rect(W - 5, belt + 1, 4, 1, C.i2);
  c.rect(Math.round(W / 2) - 3, belt + 3, 6, 2, C.c4); // blank plate
  c.rect(0, H - 2, W, 1, C.m1);
  return c;
}

function roof(m: Model): PixelCanvas {
  const { w: W, h: Hh } = m.parts.roof;
  const c = new PixelCanvas(W, Hh);
  panel(c, { x: 0, y: 0, w: W, h: Hh });
  if (m.name === 'hoverbike') {
    c.rect(3, 3, W - 6, Hh - 6, C.o2); // seat from above
    c.rect(3, 3, W - 6, 1, C.n4);
    return c;
  }
  c.rect(1, 0, W - 2, 2, C.g1); // windscreen edge (front = top)
  c.rect(1, Hh - 2, W - 2, 2, C.g1); // rear window edge
  if (m.name === 'van') for (const x of [4, W - 5]) c.rect(x, 4, 1, Hh - 8, C.m2); // roof rack
  if (m.name === 'compact') c.rect(4, 5, W - 8, 4, C.g0); // sunroof
  c.set(2, 3, C.p3);
  return c;
}

function hood(m: Model): PixelCanvas {
  const { w: W, h: Hh } = m.parts.hood;
  const c = new PixelCanvas(W, Hh);
  panel(c, { x: 0, y: 0, w: W, h: Hh });
  c.rect(Math.round(W / 2), 1, 1, Hh - 2, C.p0); // crease
  if (m.name === 'muscle') {
    c.rect(Math.round(W / 2) - 3, 4, 7, 5, C.o1); // scoop
    c.rect(Math.round(W / 2) - 3, 4, 7, 1, C.p0);
    c.rect(2, 1, 2, Hh - 2, C.p3); // racing stripes
    c.rect(W - 4, 1, 2, Hh - 2, C.p3);
  }
  if (m.name === 'hoverbike') c.rect(2, 2, W - 4, 3, C.k2); // headlamp strip
  return c;
}

function trunk(m: Model): PixelCanvas {
  const { w: W, h: Hh } = m.parts.trunk;
  const c = new PixelCanvas(W, Hh);
  panel(c, { x: 0, y: 0, w: W, h: Hh });
  if (Hh > 4) c.rect(1, Hh - 2, W - 2, 1, C.p0);
  if (m.name === 'muscle') c.rect(1, 1, W - 2, 1, C.o1); // spoiler
  if (m.name === 'hoverbike') c.rect(3, 2, W - 6, 2, C.k2); // thruster vent
  return c;
}

function wheel(m: Model): PixelCanvas {
  const { w: W } = m.parts.wheel;
  const c = new PixelCanvas(W, W);
  const r = W / 2 - 0.5;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - r, y - r);
    if (m.name === 'hoverbike') {
      if (d <= r) c.set(x, y, d > r - 1.5 ? C.m1 : d > r - 3 ? C.k2 : C.k3);
    } else if (d <= r) {
      c.set(x, y, d > r - 2 ? C.o0 : d > r - 3 ? C.n1 : d > 1.5 ? C.m2 : C.m3);
    }
  }
  return c;
}

function skin(m: Model): PixelCanvas {
  const c = new PixelCanvas(m.w, m.h);
  const s = side(m);
  const p = m.parts;
  c.blit(s, p.side_l.x, p.side_l.y);
  c.blit(s.flipX(), p.side_r.x, p.side_r.y);
  c.blit(front(m), p.front.x, p.front.y);
  c.blit(rear(m), p.rear.x, p.rear.y);
  c.blit(roof(m), p.roof.x, p.roof.y);
  c.blit(hood(m), p.hood.x, p.hood.y);
  c.blit(trunk(m), p.trunk.x, p.trunk.y);
  c.blit(wheel(m), p.wheel.x, p.wheel.y);
  return c;
}

export function vehicleAssets(): AssetDef[] {
  return MODELS.flatMap((m) => {
    const base = makeAsset(m.name, [skin(m)], GLOW, { parts: { ...m.parts } });
    return VEHICLE_VARIANTS.map((v) => remapAsset(base, VEHICLE_REMAP[v], `${m.name}_${v}`));
  });
}
