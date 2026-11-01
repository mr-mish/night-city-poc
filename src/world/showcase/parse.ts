// Pure: turns the authored showcase map into tile names, building module layouts, placements and colliders.
import { createRng, type Rng } from '../../core/rng';
import type { AABB } from '../../physics/collision';
import { BUILDINGS, CARS, GROUND, LEGEND, PROPS, SPAWN, type CarModel } from './map';
import type { District } from './types';

export const MAP_SIZE = 64;

export const ROAD_TILES = new Set([
  'asphalt_0', 'asphalt_1', 'asphalt_2', 'asphalt_3', 'lane_dash_h', 'lane_dash_v',
  'center_double_h', 'center_double_v', 'crosswalk_h', 'crosswalk_v', 'manhole',
]);
const CURBABLE = new Set(['sidewalk_0', 'sidewalk_1']);

/** Vehicle box sizes in world units at 16 texels/unit: [length, width, height]. */
export const CAR_DIMS: Record<CarModel, [number, number, number]> = {
  compact: [34 / 16, 19 / 16, 14 / 16],
  muscle: [41 / 16, 22 / 16, 13 / 16],
  van: [46 / 16, 23 / 16, 23 / 16],
  hoverbike: [26 / 16, 10 / 16, 11 / 16],
};

/** Solid prop footprints [width, depth] in world units, centred on the prop's tile. */
const SOLID: Record<string, [number, number]> = {
  vending_machine: [0.9, 0.6], data_terminal: [0.6, 0.5], dumpster: [1.8, 0.8], barrier: [1.9, 0.6],
  bench: [1.8, 0.5], hydrant: [0.5, 0.5], bollard: [0.4, 0.4], streetlight: [0.3, 0.3],
  streetlight_double: [0.3, 0.3], traffic_light: [0.3, 0.3],
  container_0: [2.9, 1.2], container_1: [2.9, 1.2], container_2: [2.9, 1.2],
};

export type BuildingLayout = {
  x: number; z: number; w: number; d: number; district: District;
  /** Facade module names, rows bottom → top, `w` columns west → east. */
  facade: string[][];
  /** Roof module names, `d` rows north → south, `w` columns. */
  roof: string[][];
};
export type PlacedProp = { name: string; x: number; z: number; y: number };
export type PlacedCar = { model: CarModel; skin: string; x: number; z: number; rotationY: number; dims: [number, number, number] };
export type ShowcaseWorld = {
  w: number; h: number;
  tiles: string[][];
  buildings: BuildingLayout[];
  props: PlacedProp[];
  cars: PlacedCar[];
  colliders: AABB[];
  spawn: { x: number; z: number };
};

function groundTiles(): string[][] {
  if (GROUND.length !== MAP_SIZE) throw new Error(`map: expected ${MAP_SIZE} rows, got ${GROUND.length}`);
  const tiles = GROUND.map((row, z) => {
    if (row.length !== MAP_SIZE) throw new Error(`map: row ${z} has ${row.length} chars`);
    return [...row].map((ch, x) => {
      const name = LEGEND[ch];
      if (!name) throw new Error(`map: unknown char '${ch}' at ${x},${z}`);
      return name;
    });
  });
  const isRoad = (x: number, z: number) => ROAD_TILES.has(tiles[z]?.[x] ?? '');
  // Curbs: sidewalk next to road (bit 1=N, 2=E, 4=S, 8=W).
  return tiles.map((row, z) =>
    row.map((t, x) => {
      if (!CURBABLE.has(t)) return t;
      const mask = (isRoad(x, z - 1) ? 1 : 0) | (isRoad(x + 1, z) ? 2 : 0) | (isRoad(x, z + 1) ? 4 : 0) | (isRoad(x - 1, z) ? 8 : 0);
      return mask ? `curb_${mask}` : t;
    }),
  );
}

const GROUND_FLOOR: Record<District, string[]> = {
  core: ['store_open', 'base_trim', 'store_open', 'store_open'],
  lumen: ['store_open', 'store_shutter', 'store_open'],
  iron: ['store_shutter', 'store_shutter', 'base_trim'],
  under: ['store_shutter', 'base_trim', 'store_open', 'store_shutter'],
};
const BAND: Record<District, string[]> = {
  core: ['wall_0', 'wall_1', 'wall_0'],
  lumen: ['wall_0', 'ac_unit', 'wall_1'],
  iron: ['wall_1', 'pipes', 'wall_1'],
  under: ['wall_0', 'pipes', 'ac_unit'],
};
const LIT = ['window_lit_0', 'window_lit_1', 'window_lit_2'];
const DARK = ['window_dark_0', 'window_dark_1', 'window_dark_2'];

function upperModule(rng: Rng, district: District, column: 'window' | 'wall'): string {
  if (column === 'wall') return rng.pick(district === 'iron' ? ['wall_1', 'pipes'] : ['wall_0', 'pipes', 'ac_unit']);
  const r = rng.next();
  switch (district) {
    case 'core': return r < 0.62 ? rng.pick([LIT[0], LIT[2], LIT[0]] as string[]) : rng.pick(DARK);
    case 'lumen': return r < 0.5 ? rng.pick(LIT) : r < 0.68 ? 'balcony' : r < 0.78 ? 'ac_unit' : rng.pick(DARK);
    case 'iron': return r < 0.25 ? rng.pick(LIT) : r < 0.75 ? rng.pick(DARK) : 'wall_1';
    case 'under': return r < 0.3 ? 'window_lit_1' : r < 0.6 ? rng.pick(DARK) : r < 0.8 ? rng.pick(['pipes', 'ac_unit']) : 'balcony';
  }
}

function facadeLayout(rng: Rng, district: District, w: number, storeys: number): string[][] {
  const door = rng.int(0, w - 1);
  const ground = Array.from({ length: w }, (_, c) => (c === door ? 'door' : rng.pick(GROUND_FLOOR[district])));
  const band = Array.from({ length: w }, () => rng.pick(BAND[district]));
  const columns = Array.from({ length: w }, (): 'window' | 'wall' => (district !== 'core' && rng.chance(0.2) ? 'wall' : 'window'));
  const upper = Array.from({ length: storeys }, () => columns.map((col) => upperModule(rng, district, col)));
  return [ground, band, ...upper];
}

function roofLayout(rng: Rng, district: District, w: number, d: number, storeys: number): string[][] {
  const base = district === 'core' || district === 'lumen' ? 'roof_0' : 'roof_1';
  const roof = Array.from({ length: d }, (_, r) =>
    Array.from({ length: w }, (_, c) => {
      const n = r === 0, s = r === d - 1, west = c === 0, east = c === w - 1;
      if (n && west) return 'parapet_corner_nw';
      if (n && east) return 'parapet_corner_ne';
      if (s && west) return 'parapet_corner_sw';
      if (s && east) return 'parapet_corner_se';
      if (n) return 'parapet_n';
      if (s) return 'parapet_s';
      if (west) return 'parapet_w';
      if (east) return 'parapet_e';
      return rng.chance(0.22) ? rng.pick(['vent', 'water_tank', 'antenna', 'billboard_mount']) : base;
    }),
  );
  if (district === 'core' && storeys >= 9 && w >= 3 && d >= 3) roof[Math.floor(d / 2)]![Math.floor(w / 2)] = 'helipad';
  return roof;
}

const ROTATION: Record<'e' | 'w' | 'n' | 's', number> = { w: 0, s: Math.PI / 2, e: Math.PI, n: -Math.PI / 2 };

export function parseShowcase(): ShowcaseWorld {
  const tiles = groundTiles();
  const rng = createRng(0x5e0c);
  const colliders: AABB[] = [];

  const buildings: BuildingLayout[] = BUILDINGS.map((b) => {
    colliders.push({ minX: b.x, minZ: b.z, maxX: b.x + b.w, maxZ: b.z + b.d });
    return {
      x: b.x, z: b.z, w: b.w, d: b.d, district: b.district,
      facade: facadeLayout(rng, b.district, b.w, b.storeys),
      roof: roofLayout(rng, b.district, b.w, b.d, b.storeys),
    };
  });

  const props: PlacedProp[] = PROPS.map((p) => {
    const y = p.y ?? 0;
    const solid = SOLID[p.name];
    if (solid && y === 0) {
      const cx = p.x + 0.5, cz = p.z + 0.5;
      colliders.push({ minX: cx - solid[0] / 2, maxX: cx + solid[0] / 2, minZ: cz - solid[1] / 2, maxZ: cz + solid[1] / 2 });
    }
    return { name: p.name, x: p.x, z: p.z, y };
  });

  const cars: PlacedCar[] = CARS.map((c) => {
    const dims = CAR_DIMS[c.model];
    const alongX = c.dir === 'e' || c.dir === 'w';
    const hx = (alongX ? dims[0] : dims[1]) / 2, hz = (alongX ? dims[1] : dims[0]) / 2;
    colliders.push({ minX: c.x - hx, maxX: c.x + hx, minZ: c.z - hz, maxZ: c.z + hz });
    return { model: c.model, skin: `${c.model}_${c.variant}`, x: c.x, z: c.z, rotationY: ROTATION[c.dir], dims };
  });

  // Water: one collider per horizontal run.
  for (let z = 0; z < MAP_SIZE; z++) {
    let start = -1;
    for (let x = 0; x <= MAP_SIZE; x++) {
      const wet = x < MAP_SIZE && tiles[z]![x] === 'water';
      if (wet && start < 0) start = x;
      if (!wet && start >= 0) { colliders.push({ minX: start, maxX: x, minZ: z, maxZ: z + 1 }); start = -1; }
    }
  }
  // Map boundary.
  const S = MAP_SIZE;
  colliders.push({ minX: -2, maxX: 0, minZ: -2, maxZ: S + 2 }, { minX: S, maxX: S + 2, minZ: -2, maxZ: S + 2 });
  colliders.push({ minX: -2, maxX: S + 2, minZ: -2, maxZ: 0 }, { minX: -2, maxX: S + 2, minZ: S, maxZ: S + 2 });

  return { w: S, h: S, tiles, buildings, props, cars, colliders, spawn: { ...SPAWN } };
}
