import * as THREE from 'three';
import { createRng, type Rng } from '../core/rng';
import type { AABB } from '../physics/collision';
import { makeFacadeTexture, makeSignTexture } from '../render/textures';

/** Hand-built 3×3 test block for M1. Replaced by citygen + chunks in M2. */
export const BLOCK = 20;
export const ROAD = 8;
export const PERIOD = BLOCK + ROAD;
const GRID = 1; // blocks span -GRID..GRID on each axis
const SIDEWALK_H = 0.12;
const NEON = ['#ff2bd6', '#00f0ff', '#fff200', '#7cff4f', '#ff5a1f'];

export type BuildingLot = { x: number; z: number; w: number; d: number; h: number };
export type TestBlock = { group: THREE.Group; colliders: AABB[]; spawn: { x: number; z: number } };

export const lotToAABB = (l: BuildingLot): AABB => ({
  minX: l.x - l.w / 2,
  maxX: l.x + l.w / 2,
  minZ: l.z - l.d / 2,
  maxZ: l.z + l.d / 2,
});

export function planTestBlock(seed: number): BuildingLot[] {
  const rng = createRng(seed);
  const lots: BuildingLot[] = [];
  for (let bx = -GRID; bx <= GRID; bx++) {
    for (let bz = -GRID; bz <= GRID; bz++) {
      const tall = bx === 0 && bz === 0 ? 2 : 1;
      for (const [ox, oz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]] as const) {
        lots.push({
          x: bx * PERIOD + ox,
          z: bz * PERIOD + oz,
          w: rng.range(6, 8.5),
          d: rng.range(6, 8.5),
          h: rng.range(9.5, 18) * tall,
        });
      }
    }
  }
  return lots;
}

export function buildTestBlock(seed = 2091): TestBlock {
  const rng = createRng(seed ^ 0x9e3779b9);
  const group = new THREE.Group();
  const half = (GRID + 0.5) * PERIOD + ROAD / 2;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(half * 2, half * 2),
    new THREE.MeshLambertMaterial({ color: 0x1a1824 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x3a3646 });
  const sidewalkGeo = new THREE.BoxGeometry(BLOCK, SIDEWALK_H, BLOCK);
  for (let bx = -GRID; bx <= GRID; bx++) {
    for (let bz = -GRID; bz <= GRID; bz++) {
      const sw = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      sw.position.set(bx * PERIOD, SIDEWALK_H / 2, bz * PERIOD);
      group.add(sw);
    }
  }

  const roofMat = new THREE.MeshLambertMaterial({ color: 0x24202e });
  const lots = planTestBlock(seed);
  let lights = 0;
  for (const lot of lots) {
    group.add(makeBuilding(rng, lot, roofMat));
    if (rng.chance(0.6)) {
      const color = rng.pick(NEON);
      const sign = makeSign(rng, lot, color);
      group.add(sign);
      if (lights < 6) {
        const light = new THREE.PointLight(color, 18, 12, 2);
        const normal = sign.rotation.y === 0 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        light.position.copy(sign.position).addScaledVector(normal, 1.5);
        group.add(light);
        lights++;
      }
    }
  }

  group.add(makeLaneDashes(half));
  group.add(...makeStreetlights());

  return { group, colliders: lots.map(lotToAABB), spawn: { x: PERIOD / 2, z: PERIOD / 2 } };
}

function makeBuilding(rng: Rng, lot: BuildingLot, roofMat: THREE.Material): THREE.Mesh {
  const tex = makeFacadeTexture(rng);
  const side = (len: number): THREE.Material => {
    const map = tex.map.clone();
    const emissiveMap = tex.emissive.clone();
    map.repeat.set(len / 4, lot.h / 8);
    emissiveMap.repeat.set(len / 4, lot.h / 8);
    return new THREE.MeshLambertMaterial({ map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.0 });
  };
  const sideD = side(lot.d);
  const sideW = side(lot.w);
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(lot.w, lot.h, lot.d), [sideD, sideD, roofMat, roofMat, sideW, sideW]);
  mesh.position.set(lot.x, lot.h / 2 + SIDEWALK_H, lot.z);
  return mesh;
}

function makeSign(rng: Rng, lot: BuildingLot, color: string): THREE.Mesh {
  const vertical = rng.chance(0.5);
  const w = vertical ? 1.4 : 4.2;
  const h = vertical ? 4.2 : 1.4;
  const mat = new THREE.MeshBasicMaterial({
    map: makeSignTexture(rng, color, vertical),
    color: new THREE.Color(1.8, 1.8, 1.8),
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const y = rng.range(3, Math.max(3.5, lot.h - 2));
  if (rng.chance(0.5)) {
    sign.position.set(lot.x + rng.range(-lot.w / 4, lot.w / 4), y, lot.z + lot.d / 2 + 0.05);
  } else {
    sign.position.set(lot.x + lot.w / 2 + 0.05, y, lot.z + rng.range(-lot.d / 4, lot.d / 4));
    sign.rotation.y = Math.PI / 2;
  }
  return sign;
}

function makeLaneDashes(half: number): THREE.InstancedMesh {
  const lines: number[] = [];
  for (let k = -GRID - 1; k <= GRID; k++) lines.push((k + 0.5) * PERIOD);
  const matrices: THREE.Matrix4[] = [];
  const rotY = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  for (const line of lines) {
    for (let t = -half + 2; t < half - 2; t += 3) {
      if (lines.some((l) => Math.abs(t - l) < ROAD / 2 + 0.5)) continue;
      matrices.push(new THREE.Matrix4().makeTranslation(line, 0.02, t));
      matrices.push(new THREE.Matrix4().makeTranslation(t, 0.02, line).multiply(rotY));
    }
  }
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.25, 0.03, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x8a8670 }),
    matrices.length,
  );
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  return mesh;
}

function makeStreetlights(): THREE.InstancedMesh[] {
  const spots: [number, number][] = [];
  const inset = BLOCK / 2 - 0.6;
  for (let bx = -GRID; bx <= GRID; bx++) {
    for (let bz = -GRID; bz <= GRID; bz++) {
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        spots.push([bx * PERIOD + sx * inset, bz * PERIOD + sz * inset]);
      }
    }
  }
  const poles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.15, 4, 0.15),
    new THREE.MeshLambertMaterial({ color: 0x2b2a35 }),
    spots.length,
  );
  const heads = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.6, 0.15, 0.6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.5, 0.8) }),
    spots.length,
  );
  const m = new THREE.Matrix4();
  spots.forEach(([x, z], i) => {
    poles.setMatrixAt(i, m.makeTranslation(x, 2 + SIDEWALK_H, z));
    heads.setMatrixAt(i, m.makeTranslation(x, 4 + SIDEWALK_H, z));
  });
  return [poles, heads];
}
