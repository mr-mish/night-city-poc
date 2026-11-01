import * as THREE from 'three';
import type { LoadedAtlas } from '../assets/atlas';
import type { ShowcaseWorld } from '../world/showcase/parse';
import { QuadBatch } from './quads';
import { vehicleGeometry } from './vehicleModel';

const PX = 16;

type Anim = { batch: QuadBatch; quad: number; atlas: LoadedAtlas; name: string; frames: number; fps: number; current: number };

function material(atlas: LoadedAtlas): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: atlas.albedo,
    emissiveMap: atlas.emissive,
    emissive: 0xffffff,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
}

function need(atlases: Record<string, LoadedAtlas>, name: string): LoadedAtlas {
  const a = atlases[name];
  if (!a) throw new Error(`world: atlas '${name}' not loaded`);
  return a;
}

/** Build every mesh for the showcase world. `animate(t)` advances animated tiles and props. */
export function buildWorld(world: ShowcaseWorld, atlases: Record<string, LoadedAtlas>): { group: THREE.Group; animate(t: number): void } {
  const group = new THREE.Group();
  const anims: Anim[] = [];
  const track = (batch: QuadBatch, quad: number, atlas: LoadedAtlas, name: string) => {
    const frames = atlas.meta.frames[name]?.length ?? 1;
    const fps = atlas.meta.fps[name] ?? 0;
    if (frames > 1 && fps > 0) anims.push({ batch, quad, atlas, name, frames, fps, current: 0 });
  };

  // Ground: one quad per tile at y = 0.
  const tiles = need(atlases, 'tiles');
  const ground = new QuadBatch();
  world.tiles.forEach((row, z) =>
    row.forEach((name, x) => {
      const q = ground.add([[x, 0, z + 1], [x + 1, 0, z + 1], [x + 1, 0, z], [x, 0, z]], tiles.uv(name), [0, 1, 0]);
      track(ground, q, tiles, name);
    }),
  );
  group.add(new THREE.Mesh(ground.build(), material(tiles)));

  // Buildings: south facade + roof only (side walls are edge-on in the oblique view).
  const byDistrict = new Map<string, QuadBatch>();
  for (const b of world.buildings) {
    const atlasName = `buildings_${b.district}`;
    const atlas = need(atlases, atlasName);
    const batch = byDistrict.get(atlasName) ?? new QuadBatch();
    byDistrict.set(atlasName, batch);
    const fz = b.z + b.d;
    b.facade.forEach((row, r) =>
      row.forEach((name, c) => {
        const x = b.x + c;
        batch.add([[x, r, fz], [x + 1, r, fz], [x + 1, r + 1, fz], [x, r + 1, fz]], atlas.uv(name), [0, 0, 1]);
      }),
    );
    const H = b.facade.length;
    b.roof.forEach((row, r) =>
      row.forEach((name, c) => {
        const x = b.x + c, z = b.z + r;
        batch.add([[x, H, z + 1], [x + 1, H, z + 1], [x + 1, H, z], [x, H, z]], atlas.uv(name), [0, 1, 0]);
      }),
    );
  }
  for (const [name, batch] of byDistrict) group.add(new THREE.Mesh(batch.build(), material(need(atlases, name))));

  // Props: upright south-facing cards anchored at their base (standing) or on a facade (y > 0).
  const props = need(atlases, 'props');
  const propBatch = new QuadBatch();
  for (const p of world.props) {
    const r = props.rect(p.name);
    const w = r.w / PX, h = r.h / PX;
    const cx = p.x + 0.5;
    const z = p.y > 0 ? p.z + 0.03 : p.z + 0.5;
    const y0 = p.y;
    const q = propBatch.add([[cx - w / 2, y0, z], [cx + w / 2, y0, z], [cx + w / 2, y0 + h, z], [cx - w / 2, y0 + h, z]], props.uv(p.name), [0, 0, 1]);
    track(propBatch, q, props, p.name);
  }
  group.add(new THREE.Mesh(propBatch.build(), material(props)));

  // Parked cars.
  const vehicles = need(atlases, 'vehicles');
  const carMat = material(vehicles);
  const geoms = new Map<string, THREE.BufferGeometry>();
  for (const c of world.cars) {
    const geo = geoms.get(c.skin) ?? vehicleGeometry(vehicles.meta, c.skin, c.dims);
    geoms.set(c.skin, geo);
    const mesh = new THREE.Mesh(geo, carMat);
    mesh.position.set(c.x, c.model === 'hoverbike' ? 0.25 : 0, c.z);
    mesh.rotation.y = c.rotationY;
    group.add(mesh);
  }

  return {
    group,
    animate(t: number) {
      for (const a of anims) {
        const f = Math.floor(t * a.fps) % a.frames;
        if (f === a.current) continue;
        a.current = f;
        a.batch.setUV(a.quad, a.atlas.uv(a.name, f));
      }
    },
  };
}
