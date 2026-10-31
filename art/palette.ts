// Neo Meridian master palette. Index 0 = transparent; 1..48 = colours (ordered as below).
const HEX = {
  o0: '0d0b1e', o1: '1c1838', o2: '2e2852',
  n0: '15141f', n1: '1f1d2b', n2: '2a2838', n3: '383547', n4: '4a4659', n5: '5f5a70',
  c0: '6b6678', c1: '827c8f', c2: '9c96a6', c3: 'b8b2bf', c4: 'd6d1db',
  m0: '3d4a5c', m1: '566780', m2: '7890a8', m3: 'a6bccf',
  r0: '4a2a26', r1: '6e3b2c', r2: '9a5233', r3: 'c4733f',
  w0: '0b1a33', w1: '12305a', w2: '1d4f85', w3: '3a7fb8',
  g0: '101828', g1: '1a2a40', g2: '2c4560',
  s0: '8a5a44', s1: 'c48a66', s2: 'f0c49a',
  k0: '0a6e8a', k1: '11a8c9', k2: '3fe0f0', k3: 'b8fbff',
  p0: '7a1460', p1: 'c21f8f', p2: 'ff3fc0', p3: 'ffb0e8',
  i0: '8a3a0a', i1: 'd0640f', i2: 'ffa030', i3: 'ffd890',
  u0: '2f7a1a', u1: '6be03a', u2: 'f2f23a',
  l0: 'fff8e8',
} as const;

export type ColorName = keyof typeof HEX;
export const NAMES = Object.keys(HEX) as ColorName[];
export const PALETTE_SIZE = NAMES.length;
export const C = Object.fromEntries(NAMES.map((n, i) => [n, i + 1])) as Record<ColorName, number>;

const hexToRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(0, 2), 16),
  parseInt(h.slice(2, 4), 16),
  parseInt(h.slice(4, 6), 16),
];
export const RGB: ReadonlyArray<readonly [number, number, number]> = [[0, 0, 0], ...NAMES.map((n) => hexToRgb(HEX[n]))];

export function rgbaOf(index: number): [number, number, number, number] {
  if (index === 0) return [0, 0, 0, 0];
  const c = RGB[index];
  if (!c) throw new Error(`palette index out of range: ${index}`);
  return [c[0], c[1], c[2], 255];
}

const zipRemap = (from: ColorName[], to: ColorName[]): Record<number, number> =>
  Object.fromEntries(from.map((f, i) => [C[f], C[to[i] as ColorName]]));

export type District = 'core' | 'lumen' | 'iron' | 'under';
export const DISTRICTS: District[] = ['core', 'lumen', 'iron', 'under'];

/** Building kits are authored with walls in m0..m3 and accents in k0..k3 (Meridian Core). */
export const DISTRICT_REMAP: Record<District, Record<number, number>> = {
  core: {},
  lumen: { ...zipRemap(['m0', 'm1', 'm2', 'm3'], ['n2', 'n3', 'n4', 'n5']), ...zipRemap(['k0', 'k1', 'k2', 'k3'], ['p0', 'p1', 'p2', 'p3']) },
  iron: { ...zipRemap(['m0', 'm1', 'm2', 'm3'], ['r0', 'r1', 'r2', 'r3']), ...zipRemap(['k0', 'k1', 'k2', 'k3'], ['i0', 'i1', 'i2', 'i3']) },
  under: { ...zipRemap(['m0', 'm1', 'm2', 'm3'], ['n3', 'c0', 'c1', 'c2']), ...zipRemap(['k0', 'k1', 'k2', 'k3'], ['u0', 'u1', 'u1', 'u2']) },
};

export type VehicleVariant = 'a' | 'b' | 'c';
export const VEHICLE_VARIANTS: VehicleVariant[] = ['a', 'b', 'c'];
/** Vehicles are authored with paint in p0..p3 (magenta). */
export const VEHICLE_REMAP: Record<VehicleVariant, Record<number, number>> = {
  a: {},
  b: zipRemap(['p0', 'p1', 'p2', 'p3'], ['k0', 'k1', 'k2', 'k3']),
  c: zipRemap(['p0', 'p1', 'p2', 'p3'], ['i0', 'i1', 'i2', 'i3']),
};
