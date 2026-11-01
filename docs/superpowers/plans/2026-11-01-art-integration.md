# Art Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Neo Meridian with Art Pack 1 through a pixel-perfect oblique camera, on a hand-authored 64×64 showcase map with four district quadrants, parked cars, and the restyled voxel player.

**Architecture:** Pure modules (`core/dir`, `render/oblique` maths, `assets/atlas` UV maths, `world/showcase/*`) are unit-tested in Node. Browser modules (`render/quads`, `render/worldMeshes`, `render/vehicleModel`, atlas loading) turn the parsed world into merged textured quad meshes using the albedo and emissive atlases. The sim, collision, input, low-res renderer and bloom carry over.

**Tech Stack:** three 0.187, Vite 8, TypeScript 5.9, Vitest 5, Playwright 1.63.

## Global Constraints

- 16 px per world unit on screen for ground and vertical faces (oblique: screen Y = world Y − world Z).
- Camera target snapped to 1/16 unit; frustum edges on whole pixels.
- Ground floor = 2 modules; each upper storey = 1 module. Player 1.5 units tall. Vehicles at 16 texels per unit.
- W/↑ = −Z (north), D/→ = +X.
- Only south faces and tops are built for buildings (side walls are edge-on, north walls hidden).
- Atlas UVs are inset by 0.01 texel to prevent bleeding into neighbouring frames.
- `src/world/showcase/*`, `src/core/dir.ts` and the pure parts of `src/render/oblique.ts` and `src/assets/atlas.ts` must not touch the DOM.
- No new dependencies.

## Note on content

Map data, module layouts and mesh code are authored during execution, with a mandatory screenshot
review before commit. The tests below are the contract.

---

### Task 1: Grid-aligned movement (`core/dir.ts`)

**Files:** Create `src/core/dir.ts`; modify `src/entities/player.ts`, `tests/core.test.ts`, `tests/player.test.ts`; delete `src/core/iso.ts`.

**Produces:** `inputToWorldDir(moveX: number, moveY: number): { x: number; z: number }`.

- [ ] Replace the `screenToWorldDir` tests with:

```ts
describe('inputToWorldDir', () => {
  it('maps up to north (-z) and right to east (+x)', () => {
    expect(inputToWorldDir(0, 1)).toEqual({ x: 0, z: -1 });
    expect(inputToWorldDir(1, 0)).toEqual({ x: 1, z: 0 });
    expect(inputToWorldDir(0, 0)).toEqual({ x: 0, z: 0 });
  });
});
```

- [ ] Update the player tests: walking up for 1 s gives `z ≈ -WALK_SPEED, x = 0`; moving right gives `heading ≈ π/2`; a wall `{minX:-20,minZ:-20,maxX:20,maxZ:-1}` keeps `z ≥ -1 + PLAYER_RADIUS`.
- [ ] Implement `inputToWorldDir(moveX, moveY) = { x: moveX + 0, z: -moveY + 0 }`, switch `player.ts` to it, and delete `core/iso.ts`.
- [ ] `npx vitest run` passes. Commit.

### Task 2: Oblique camera (`render/oblique.ts`)

**Files:** Create `src/render/oblique.ts`, `tests/oblique.test.ts`; delete `src/render/camera.ts`, `tests/render.test.ts` camera parts (keep `computeLowRes` tests).

**Produces:**
- `PX = 16`
- `snapTexel(v: number): number`, which rounds to 1/16
- `class ObliqueCamera { camera: OrthographicCamera; target: Vector3; resize(pxW: number, pxH: number): void; jumpTo(x, z): void; follow(x, z, dt, stiffness?): void; apply(): void }`
  - The camera sits at (tx, H=100, tz), looks down with up = −Z, and uses `projectionMatrix = ortho × shear`, where the view-space shear is `y' = y + z + H`.
  - The frustum spans `pxW/16 × pxH/16` units with edges on whole pixels.

- [ ] Tests:

```ts
it('projects 1 unit north and 1 unit up to the same screen point', () => {
  const cam = new ObliqueCamera();
  cam.resize(480, 270);
  cam.jumpTo(0, 0);
  cam.apply();
  const north = new Vector3(0, 0, -1).project(cam.camera);
  const up = new Vector3(0, 1, 0).project(cam.camera);
  expect(north.x).toBeCloseTo(up.x, 6);
  expect(north.y).toBeCloseTo(up.y, 6);
  // 1 unit = 16 px; NDC spans 2 over 270 px
  expect(up.y - new Vector3(0, 0, 0).project(cam.camera).y).toBeCloseTo((16 / 270) * 2, 6);
  // the raised point (facade) is in front of the ground behind it
  expect(up.z).toBeLessThan(north.z);
});
it('snaps the target to whole texels', () => {
  const cam = new ObliqueCamera();
  cam.resize(480, 270);
  cam.jumpTo(3.03, -7.77);
  cam.apply();
  expect((cam.camera.position.x * 16) % 1).toBeCloseTo(0, 6);
  expect((cam.camera.position.z * 16) % 1).toBeCloseTo(0, 6);
});
```

- [ ] Implement, run the tests, commit.

### Task 3: Atlas UVs and loader (`assets/atlas.ts`)

**Files:** Create `src/assets/atlas.ts`, `tests/atlas.test.ts`; add `"resolveJsonModule": true` to `tsconfig.json`.

**Produces:**
- types `Rect`, `AtlasMeta`, `AtlasFile`, `UV = { u0, v0, u1, v1 }`
- `frameUV(size: { width: number; height: number }, r: Rect, inset = 0.01): UV`, with the V-flip (atlas top → v1)
- `partRect(meta: AtlasMeta, asset: string, part: string): Rect`, which returns atlas-space coordinates (frame origin + part)
- `type LoadedAtlas = { meta; albedo: Texture; emissive: Texture; uv(name, frame?): UV }`
- `loadAtlases(base?: string): Promise<Record<string, LoadedAtlas>>`, with NearestFilter, no mipmaps, sRGB, flipY

- [ ] Tests:

```ts
it('maps a rect to flipped, inset UVs', () => {
  const uv = frameUV({ width: 256, height: 128 }, { x: 16, y: 32, w: 16, h: 16 }, 0);
  expect(uv).toEqual({ u0: 16 / 256, u1: 32 / 256, v1: 1 - 32 / 128, v0: 1 - 48 / 128 });
  const inset = frameUV({ width: 256, height: 128 }, { x: 16, y: 32, w: 16, h: 16 });
  expect(inset.u0).toBeGreaterThan(uv.u0);
  expect(inset.u1).toBeLessThan(uv.u1);
});
it('resolves vehicle part rects into atlas space', () => {
  const meta = atlasJson.atlases.vehicles;
  const r = partRect(meta, 'compact_a', 'roof');
  const f = meta.frames.compact_a[0];
  expect(r.x).toBe(f.x + meta.parts.compact_a.roof.x);
  expect(r.y).toBe(f.y + meta.parts.compact_a.roof.y);
});
```

- [ ] Implement, run the tests, commit.

### Task 4: Showcase map and parser (`world/showcase`)

**Files:** Create `src/world/showcase/map.ts`, `src/world/showcase/parse.ts`, `tests/showcase.test.ts`.

**Produces:**
- `map.ts`:
  - `GROUND: string[]` (64 rows × 64 chars)
  - `LEGEND: Record<string, string>` (char → tile name)
  - `BUILDINGS: { x; z; w; d; storeys; district: District }[]`
  - `PROPS: { name; x; z; y?: number }[]` (`y` > 0 = wall-mounted at that height on the facade plane `z`)
  - `CARS: { model; variant; x; z; dir: 'e' | 'w' | 'n' | 's' }[]`
  - `SPAWN: { x; z }`
- `parse.ts`:
  - `ROAD_TILES: Set<string>`
  - `type ShowcaseWorld = { w: 64; h: 64; tiles: string[][]; buildings: BuildingLayout[]; props: PlacedProp[]; cars: PlacedCar[]; colliders: AABB[]; spawn: { x; z } }`
  - `BuildingLayout = { x; z; w; d; district; facade: string[][] /* rows bottom→top, w columns */; roof: string[][] /* d rows north→south */ }`
  - `parseShowcase(): ShowcaseWorld` (deterministic)

- [ ] Tests:

```ts
const world = parseShowcase();
it('is 64x64 and deterministic', () => {
  expect(world.tiles).toHaveLength(64);
  expect(world.tiles.every((r) => r.length === 64)).toBe(true);
  expect(parseShowcase()).toEqual(world);
});
it('has buildings in all four districts', () => {
  for (const d of ['core', 'lumen', 'iron', 'under']) expect(world.buildings.some((b) => b.district === d)).toBe(true);
});
it('computes curb masks for sidewalks next to roads', () => {
  for (let z = 0; z < 64; z++) for (let x = 0; x < 64; x++) {
    const t = world.tiles[z]![x]!;
    if (!t.startsWith('curb_')) continue;
    const mask = Number(t.slice(5));
    const road = (xx: number, zz: number) => ROAD_TILES.has(world.tiles[zz]?.[xx] ?? '');
    expect(mask).toBe((road(x, z - 1) ? 1 : 0) | (road(x + 1, z) ? 2 : 0) | (road(x, z + 1) ? 4 : 0) | (road(x - 1, z) ? 8 : 0));
  }
});
it('keeps buildings off roads, with full facades and roofs', () => {
  for (const b of world.buildings) {
    for (let z = b.z; z < b.z + b.d; z++) for (let x = b.x; x < b.x + b.w; x++) expect(ROAD_TILES.has(world.tiles[z]![x]!)).toBe(false);
    expect(b.facade.length).toBeGreaterThanOrEqual(2);
    expect(b.facade.every((r) => r.length === b.w)).toBe(true);
    expect(b.roof).toHaveLength(b.d);
  }
});
it('gives every building a collider and puts spawn somewhere walkable', () => {
  for (const b of world.buildings) expect(world.colliders).toContainEqual({ minX: b.x, minZ: b.z, maxX: b.x + b.w, maxZ: b.z + b.d });
  const inside = world.colliders.some((c) => world.spawn.x > c.minX && world.spawn.x < c.maxX && world.spawn.z > c.minZ && world.spawn.z < c.maxZ);
  expect(inside).toBe(false);
});
it('parks every car on a road', () => {
  for (const c of world.cars) expect(ROAD_TILES.has(world.tiles[Math.floor(c.z)]![Math.floor(c.x)]!)).toBe(true);
});
it('only references assets that exist', () => {
  const a = atlasJson.atlases;
  for (const row of world.tiles) for (const t of row) expect(a.tiles.frames[t], t).toBeDefined();
  for (const b of world.buildings) for (const n of [...b.facade.flat(), ...b.roof.flat()]) expect(a[`buildings_${b.district}`].frames[n], n).toBeDefined();
  for (const p of world.props) expect(a.props.frames[p.name], p.name).toBeDefined();
  for (const c of world.cars) expect(a.vehicles.frames[`${c.model}_${c.variant}`]).toBeDefined();
});
```

- [ ] Author the map, implement the parser, run the tests, commit.

### Task 5: Quad batches and world meshes

**Files:** Create `src/render/quads.ts`, `src/render/worldMeshes.ts`, `src/render/vehicleModel.ts`, `tests/quads.test.ts`.

**Produces:**
- `class QuadBatch { add(corners: [V3, V3, V3, V3] /* BL, BR, TR, TL */, uv: UV, normal: V3): number; build(): BufferGeometry; setUV(i: number, uv: UV): void }`
- `buildWorld(world: ShowcaseWorld, atlases: Record<string, LoadedAtlas>): { group: Group; animate(t: number): void }`
- `vehicleGeometry(meta: AtlasMeta, skin: string, model: string): BufferGeometry` (local frame: faces −X, origin at ground centre)

- [ ] Tests:

```ts
it('builds 4 vertices and 6 indices per quad', () => {
  const b = new QuadBatch();
  const uv = { u0: 0, v0: 0, u1: 1, v1: 1 };
  b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1]);
  b.add([[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], uv, [0, 1, 0]);
  const g = b.build();
  expect(g.getAttribute('position').count).toBe(8);
  expect(g.getIndex()!.count).toBe(12);
});
it('setUV only changes the target quad', () => {
  const b = new QuadBatch();
  const uv = { u0: 0, v0: 0, u1: 1, v1: 1 };
  b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1]);
  b.add([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], uv, [0, 0, 1]);
  const g = b.build();
  b.setUV(1, { u0: 0.5, v0: 0.5, u1: 0.75, v1: 0.75 });
  const a = g.getAttribute('uv');
  expect(a.getX(0)).toBe(0);
  expect(a.getX(4)).toBe(0.5);
});
```

- [ ] Implement, run the tests, commit.

### Task 6: Boot, player restyle, cleanup, visual review

**Files:** Modify `src/main.ts`, `src/entities/playerMesh.ts`, `src/render/renderer.ts` (takes an `ObliqueCamera`), `src/render/lighting.ts`, `e2e/smoke.mjs`; delete `src/world/testblock.ts`, `src/render/textures.ts`, `tests/testblock.test.ts`.

- [ ] Async boot: `loadAtlases()` → `parseShowcase()` → `buildWorld()`, colliders into the `SpatialHash`, player at the spawn point. On failure, show the overlay "Failed to load assets: …".
- [ ] Player: scale to 1.5 units tall with palette colours (`#1c1838` outline-dark jacket, `#3fe0f0` trim, `#ff3fc0` hair). Keep the x-ray silhouette.
- [ ] Call `animate(t)` each frame. The camera follows the player.
- [ ] e2e: the existing checks; the movement check holds `KeyW` and expects the player's z to decrease.
- [ ] `npm test && npm run typecheck && npm run e2e`. Review the screenshot (pixel-crisp, readable, glow), iterate, commit.

### Task 7: Publish

- [ ] Run the full verification, push, and open a PR to `main` with screenshots. Report the preview to the user.
