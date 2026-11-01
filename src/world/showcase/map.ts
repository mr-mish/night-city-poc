// Neo Meridian showcase map: 64×64 tiles, one district per quadrant around a central crossroads.
//   NW Meridian Core · NE Lumen Row · SW The Undergrid · SE Ironwharf (docks along the south edge)
// Ground is one char per tile (see LEGEND). Sidewalk tiles next to roads become curbs automatically.
import type { District } from './types';

export const LEGEND: Record<string, string> = {
  '.': 'asphalt_0', ',': 'asphalt_1', o: 'asphalt_2', '~': 'asphalt_3',
  '-': 'lane_dash_h', '|': 'lane_dash_v', '=': 'center_double_h', '!': 'center_double_v',
  z: 'crosswalk_h', Z: 'crosswalk_v', m: 'manhole',
  s: 'sidewalk_0', b: 'sidewalk_1', P: 'plaza_0', p: 'plaza_1', g: 'grate',
  d: 'dirt_0', D: 'dirt_1', r: 'rubble',
  w: 'water', q: 'quay_edge_n', K: 'dock_planks_v',
};

// prettier-ignore
export const GROUND: string[] = [
  'ssssssssssss.|.sssssssssssssso|.!.|.ssbbbbbbbbbbb.~bbbbbbbbbbbbb',
  'ssssssssssss~|.ssssssssssssss.|o!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!,|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!~|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss,|.ssssssssssssss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'sssssssssssso|.ssssssssssssss.|,!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.sssssssssssssso|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|,sssssssssssssso|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'sssssgssssss.|.ssssssssssssss.|o!.|.ssbbbbbbbbbbbo.bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss~|.!~|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  '.......~,.........~........ss.|.!.|~ssbbbbbbbbbbb.,bbbbbbbbbbbbb',
  '------------...------------ss.|.!.|,ss..............o...,.~.....',
  '.,.,..o.......o.........~..ss.|.!.|.ss..........,......~....,...',
  'ssssssssssss.|.ssssssssssssss.|.!o|.ssbbbbbbbbbbbo.bbbbbbbbbbbbb',
  'ssssssssssss.|.sssssgssssssss.|,!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss,|~ssssssssssssss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!.|ossbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!.|.ssbbbbbbbbbbb,.bbbbbbbbbbbbb',
  'ssssssssssss.|.ssssssssssssss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss,|.ssssssssssssss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'sssssssssssso|.sspPpppPpppPss,|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss,|.ssPpppPpppPpss,|o!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.sspppPpppPppss,|.!.|ossbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.ssppPpppPpppss.|.!.|.ssbbbbbbbbbbb..bbbbbbbbbbbbb',
  'ssssssssssss.|.sspPpppPpppPss.|.!.|.ssbbbbbbbbbbb~,bbbbbbbbbbbbb',
  'sssssssssssssssssssssssssssssZZZZZZZssssssssssssssssssssssssssss',
  'sssssssssssssssssssssssssssssZZZZZZZssssssssssssssssssssssssssss',
  '........o....,.........~...zz.~.,...zz..,....o.........,~.......',
  '---------------------------zz.o.....zz--------------------------',
  'o~o...........o......,.....zz.o....,zz....,o.~........,.........',
  '===========================zz...m.o.zz==========================',
  '..~..........,....~o....,..zz.o.....zz..~.......~.,.............',
  '---------------------------zz.......zz--------------------------',
  '..,.......o.,o.....,.,....,zz.......zz~o...~....,.o..........~..',
  'sssssssssssssssssssssssssssssZZZZZZZssssssssssssssssssssssssssss',
  'sssssssssssssssssssssssssssssZZZZZZZssssssssssssssssssssssssssss',
  'DDDdDDdddDDrdddddDdddrdddDdss.|.!,|.ssssssssssssssssssssssssssss',
  'DdrDDddddddddddddDdddDrddddss.|.!.|.ssssssssssssssssssssssssssss',
  'DddDrdDDDddddDddddddDddddddsso|o!.|,ssssssssssssssssssssssssssss',
  'ddddddrdddrdDddddddddddddddss.|.!.|ossssssssssssssssssssssssssss',
  'dddDDdDdDdDddDddDddDdDDdDddss.|.!.|ossssgsssssssssssssssssssssss',
  'dddrdddDrdrDdDddddddddDddDdss.|.!.|.ssssssssssssssssssssssssssss',
  'DdDddddddDDdDrdddDddDdddddDss.|,!.|.ss.........,............o.,.',
  'sssssssssssssssssssssssssssss.|~!,|.ss--------------------------',
  'oo~~o...oo,~,,o~,,..,,..,.,ss.|.!.|.ss...~,.~........,..,.......',
  '.....o,~o.,..,.,....,,o.o,.ss.|.!.|~ssssssssssssssssssssssssgsss',
  'o.~.,.,..,..,,~,,.,~.,..,~.ss.|.!.|.ssssssssssssssssssssssssssss',
  'sssssssssssssssssssssssssssss.|.!.|.ssssssssssssssssssssssssssss',
  'dddDdDdrdddddDdddDdDrddDddDss.|,!.|.ssssssssssssssssssssssssssss',
  'dddddddDdddddrddddDdddddDddss.|.!.|.ssssssssssssssssssssssssssss',
  'ddddddDDdddDdddddddddDDdrrDss.|.!o|.ssssssssssssssssssssssssssss',
  'dDrdrddddrddDDDdDrdDdddddddss.|.!.|.ssssssssssssssssssssssssssss',
  'ddDrdrrDDDdddDdddDDdDddDDddss.|~!.|.ssssssssssssssssssssssssssss',
  'dDrDDddrdDdDddDddDdddddDdDdss.|.!.|.ssssssssssssssssssssssssssss',
  'ddddDddDdDdddddDddDDddDddddsssssssssssssssssssssssssssssssssssss',
  'ddrdDddDdddDddrDDDDrDrDdddrqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
  'dddddrdrDddDddddDrDDdDdddddwwwwwwwwwwwwwwwwwKKwwwwwwwwwwKKwwwwww',
  'dDrdddddddDdDDddDddddDDddddwwwwwwwwwwwwwwwwwKKwwwwwwwwwwKKwwwwww',
  'dddddddddDdddddddddddddrDddwwwwwwwwwwwwwwwwwKKwwwwwwwwwwKKwwwwww',
  'ddDddDDrdDdddddddDdddDDddddwwwwwwwwwwwwwwwwwKKwwwwwwwwwwKKwwwwww',
  'ddddrdddddddDrDdddddddrdDddwwwwwwwwwwwwwwwwwKKwwwwwwwwwwKKwwwwww',
  'DddDdDddddddddddDdddDDDDdddwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
];

/** Building footprints in tiles. The south facade sits on z + d; height = 2 + storeys modules. */
export const BUILDINGS: { x: number; z: number; w: number; d: number; storeys: number; district: District }[] = [
  // Meridian Core: towers
  { x: 1, z: 2, w: 8, d: 8, storeys: 7, district: 'core' },
  { x: 17, z: 1, w: 4, d: 9, storeys: 9, district: 'core' },
  { x: 22, z: 4, w: 5, d: 6, storeys: 5, district: 'core' },
  { x: 0, z: 19, w: 5, d: 8, storeys: 6, district: 'core' },
  { x: 6, z: 21, w: 4, d: 6, storeys: 4, district: 'core' },
  { x: 18, z: 17, w: 7, d: 5, storeys: 11, district: 'core' },
  // Lumen Row: dense low shops
  { x: 38, z: 7, w: 3, d: 5, storeys: 2, district: 'lumen' },
  { x: 41, z: 6, w: 3, d: 6, storeys: 3, district: 'lumen' },
  { x: 44, z: 8, w: 4, d: 4, storeys: 1, district: 'lumen' },
  { x: 52, z: 7, w: 4, d: 5, storeys: 2, district: 'lumen' },
  { x: 56, z: 6, w: 3, d: 6, storeys: 3, district: 'lumen' },
  { x: 59, z: 7, w: 5, d: 5, storeys: 2, district: 'lumen' },
  { x: 38, z: 23, w: 4, d: 4, storeys: 2, district: 'lumen' },
  { x: 42, z: 24, w: 3, d: 3, storeys: 1, district: 'lumen' },
  { x: 45, z: 22, w: 3, d: 5, storeys: 3, district: 'lumen' },
  { x: 52, z: 24, w: 3, d: 3, storeys: 1, district: 'lumen' },
  { x: 55, z: 21, w: 4, d: 6, storeys: 3, district: 'lumen' },
  { x: 60, z: 23, w: 4, d: 4, storeys: 2, district: 'lumen' },
  // The Undergrid: shacks
  { x: 1, z: 41, w: 4, d: 4, storeys: 1, district: 'under' },
  { x: 6, z: 42, w: 3, d: 3, storeys: 0, district: 'under' },
  { x: 10, z: 40, w: 5, d: 5, storeys: 1, district: 'under' },
  { x: 17, z: 42, w: 3, d: 3, storeys: 0, district: 'under' },
  { x: 21, z: 41, w: 5, d: 4, storeys: 1, district: 'under' },
  { x: 2, z: 52, w: 5, d: 4, storeys: 1, district: 'under' },
  { x: 9, z: 53, w: 4, d: 3, storeys: 0, district: 'under' },
  { x: 15, z: 52, w: 5, d: 4, storeys: 1, district: 'under' },
  { x: 21, z: 53, w: 5, d: 3, storeys: 0, district: 'under' },
  // Ironwharf: warehouses
  { x: 38, z: 38, w: 10, d: 4, storeys: 1, district: 'iron' },
  { x: 50, z: 38, w: 12, d: 4, storeys: 2, district: 'iron' },
  { x: 39, z: 50, w: 8, d: 4, storeys: 1, district: 'iron' },
];

/** Props. `y` > 0 mounts the prop on a facade at that height (z = the facade line). */
export const PROPS: { name: string; x: number; z: number; y?: number }[] = [
  // streetlights along the avenues
  ...[3, 9, 19, 25, 41, 47, 55, 61].flatMap((x) => [{ name: 'streetlight_double', x, z: 28 }, { name: 'streetlight', x, z: 36 }]),
  ...[3, 9, 19, 41, 47, 53].flatMap((z) => [{ name: 'streetlight', x: 28, z }, { name: 'streetlight', x: 36, z }]),
  { name: 'traffic_light', x: 28, z: 28 }, { name: 'traffic_light', x: 36, z: 36 },
  // Meridian Core
  { name: 'holo_ad_0', x: 20, z: 22, y: 6 }, { name: 'holo_ad_2', x: 18, z: 10, y: 6 }, { name: 'holo_ad_1', x: 3, z: 10, y: 4 },
  { name: 'bench', x: 19, z: 25 }, { name: 'bench', x: 23, z: 25 }, { name: 'data_terminal', x: 25, z: 23 },
  { name: 'hydrant', x: 10, z: 11 }, { name: 'bollard', x: 17, z: 26 }, { name: 'bollard', x: 26, z: 26 },
  // Lumen Row: neon on every shop band, machines on the sidewalks
  { name: 'neon_sign_0', x: 39, z: 12, y: 1.1 }, { name: 'neon_sign_1', x: 42, z: 12, y: 1.1 },
  { name: 'neon_sign_4', x: 45, z: 12, y: 1.05 }, { name: 'neon_sign_2', x: 52, z: 12, y: 1.1 },
  { name: 'neon_sign_3', x: 57, z: 12, y: 1.05 }, { name: 'neon_sign_5', x: 60, z: 12, y: 1.1 },
  { name: 'neon_sign_1', x: 39, z: 27, y: 1.1 }, { name: 'neon_sign_0', x: 46, z: 27, y: 1.1 },
  { name: 'neon_sign_4', x: 56, z: 27, y: 1.05 }, { name: 'neon_sign_2', x: 61, z: 27, y: 1.1 },
  { name: 'holo_ad_1', x: 57, z: 27, y: 3 }, { name: 'holo_ad_0', x: 42, z: 12, y: 3.2 },
  { name: 'vending_machine', x: 43, z: 15 }, { name: 'vending_machine', x: 44, z: 15 }, { name: 'data_terminal', x: 47, z: 15 },
  { name: 'vending_machine', x: 53, z: 15 }, { name: 'trash_bags', x: 58, z: 15 }, { name: 'trash_bags', x: 40, z: 15 },
  // The Undergrid
  { name: 'dumpster', x: 7, z: 45 }, { name: 'trash_bags', x: 3, z: 45 }, { name: 'trash_bags', x: 19, z: 45 },
  { name: 'trash_bags', x: 12, z: 56 }, { name: 'barrier', x: 23, z: 49 }, { name: 'traffic_cone', x: 14, z: 49 },
  { name: 'neon_sign_3', x: 12, z: 45, y: 1.05 }, { name: 'neon_sign_5', x: 23, z: 45, y: 1.1 }, { name: 'dumpster', x: 17, z: 56 },
  // Ironwharf
  ...[51, 55, 59].flatMap((x) => [50, 53].map((z, i) => ({ name: `container_${(x + i) % 3}`, x, z }))),
  { name: 'barrier', x: 40, z: 55 }, { name: 'barrier', x: 46, z: 55 },
  { name: 'traffic_cone', x: 48, z: 47 }, { name: 'traffic_cone', x: 49, z: 47 },
  { name: 'bollard', x: 40, z: 57 }, { name: 'bollard', x: 50, z: 57 }, { name: 'bollard', x: 60, z: 57 },
];

export type CarModel = 'compact' | 'muscle' | 'van' | 'hoverbike';
/** Parked cars, centred on (x, z), facing `dir`. */
export const CARS: { model: CarModel; variant: 'a' | 'b' | 'c'; x: number; z: number; dir: 'e' | 'w' | 'n' | 's' }[] = [
  { model: 'compact', variant: 'a', x: 4.5, z: 12.5, dir: 'e' },
  { model: 'muscle', variant: 'b', x: 21, z: 12.5, dir: 'w' },
  { model: 'compact', variant: 'c', x: 12.5, z: 5, dir: 'n' },
  { model: 'van', variant: 'a', x: 14.5, z: 21, dir: 's' },
  { model: 'muscle', variant: 'c', x: 7, z: 29.6, dir: 'w' },
  { model: 'compact', variant: 'b', x: 46, z: 35.4, dir: 'e' },
  { model: 'van', variant: 'c', x: 58, z: 29.7, dir: 'w' },
  { model: 'compact', variant: 'a', x: 29.6, z: 9, dir: 'n' },
  { model: 'muscle', variant: 'a', x: 35.4, z: 47, dir: 's' },
  { model: 'hoverbike', variant: 'b', x: 44, z: 13.5, dir: 'e' },
  { model: 'hoverbike', variant: 'a', x: 55, z: 14.3, dir: 'w' },
  { model: 'van', variant: 'b', x: 42, z: 44.5, dir: 'e' },
  { model: 'compact', variant: 'c', x: 8, z: 47.5, dir: 'e' },
];

export const SPAWN = { x: 37, z: 37 };
