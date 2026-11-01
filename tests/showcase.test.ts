import { describe, it, expect } from 'vitest';
import atlasJson from '../public/assets/atlas.json';
import type { AtlasFile } from '../src/assets/atlas';
import { parseShowcase, ROAD_TILES } from '../src/world/showcase/parse';

const atlases = (atlasJson as AtlasFile).atlases;
const world = parseShowcase();

describe('parseShowcase', () => {
  it('is 64x64 and deterministic', () => {
    expect(world.tiles).toHaveLength(64);
    expect(world.tiles.every((r) => r.length === 64)).toBe(true);
    expect(parseShowcase()).toEqual(world);
  });
  it('has buildings in all four districts', () => {
    for (const d of ['core', 'lumen', 'iron', 'under']) expect(world.buildings.some((b) => b.district === d), d).toBe(true);
  });
  it('computes curb masks for sidewalks next to roads', () => {
    let curbs = 0;
    for (let z = 0; z < 64; z++) for (let x = 0; x < 64; x++) {
      const t = world.tiles[z]![x]!;
      if (!t.startsWith('curb_')) continue;
      curbs++;
      const road = (xx: number, zz: number) => ROAD_TILES.has(world.tiles[zz]?.[xx] ?? '');
      const mask = (road(x, z - 1) ? 1 : 0) | (road(x + 1, z) ? 2 : 0) | (road(x, z + 1) ? 4 : 0) | (road(x - 1, z) ? 8 : 0);
      expect(Number(t.slice(5)), `${x},${z}`).toBe(mask);
    }
    expect(curbs).toBeGreaterThan(100);
  });
  it('keeps buildings off roads, with full facades and roofs', () => {
    for (const b of world.buildings) {
      for (let z = b.z; z < b.z + b.d; z++) for (let x = b.x; x < b.x + b.w; x++) {
        expect(ROAD_TILES.has(world.tiles[z]![x]!), `building at ${b.x},${b.z} covers road ${x},${z}`).toBe(false);
      }
      expect(b.facade.length).toBeGreaterThanOrEqual(2);
      expect(b.facade.every((r) => r.length === b.w)).toBe(true);
      expect(b.facade[0]).toContain('door');
      expect(b.roof).toHaveLength(b.d);
      expect(b.roof.every((r) => r.length === b.w)).toBe(true);
    }
  });
  it('gives every building a collider and puts spawn somewhere walkable', () => {
    for (const b of world.buildings) expect(world.colliders).toContainEqual({ minX: b.x, minZ: b.z, maxX: b.x + b.w, maxZ: b.z + b.d });
    const s = world.spawn;
    const inside = world.colliders.some((c) => s.x > c.minX - 0.35 && s.x < c.maxX + 0.35 && s.z > c.minZ - 0.35 && s.z < c.maxZ + 0.35);
    expect(inside).toBe(false);
  });
  it('parks every car on a road', () => {
    for (const c of world.cars) expect(ROAD_TILES.has(world.tiles[Math.floor(c.z)]![Math.floor(c.x)]!), c.skin).toBe(true);
  });
  it('only references assets that exist', () => {
    for (const row of world.tiles) for (const t of row) expect(atlases.tiles!.frames[t], t).toBeDefined();
    for (const b of world.buildings) {
      for (const n of [...b.facade.flat(), ...b.roof.flat()]) expect(atlases[`buildings_${b.district}`]!.frames[n], n).toBeDefined();
    }
    for (const p of world.props) expect(atlases.props!.frames[p.name], p.name).toBeDefined();
    for (const c of world.cars) expect(atlases.vehicles!.frames[c.skin], c.skin).toBeDefined();
  });
});
