# Neo Meridian: Art Integration (Art Pack 1 → game)

**Date:** 2026-11-01
**Status:** Approved design
**Branch:** `feat/art-integration`

## 1. Summary

Replace the M1 isometric test block and its procedural canvas textures with Art Pack 1
(`public/assets/*.png` + `atlas.json`), rendered through a **pixel-perfect oblique camera**. The
playable world becomes a hand-authored **64×64-tile showcase map** with a slice of each of the
four districts around a central crossroads. The voxel player stays (restyled) until Art Pack 2
brings character sprites. Vehicle skins appear as **parked cars** (static colliders); driving
remains Milestone 3.

## 2. Camera and scale

- **Oblique "cabinet" projection.** An orthographic camera looks straight down, with a shear
  so that screen X = world X and screen Y = world Y − world Z (north is up). Ground tiles and
  vertical faces both render at **16 px per world unit**, so every asset appears exactly as
  authored.
- **Depth stays real.** View-space depth is world Y, so for any screen pixel the higher (and therefore
  further south) surface wins. Facades occlude whatever is north of them; roofs sit on top.
- **Only south faces and tops are visible.** East and west walls are edge-on and north walls
  face away, so meshes only build south faces and tops.
- **Pixel snap.** The camera target is rounded to 1/16 unit. The internal render height stays at
  about 270 px (`computeLowRes`), about 17 tiles visible vertically.
- **Scale:**
  - 1 tile = 1 unit = 16 px.
  - Player is 1.5 units (24 px) tall.
  - Building ground floor is **2 modules** tall: a shopfront or door module plus a wall/sign band. Each upper
    storey is 1 module.
  - Vehicles use their skins at **16 texels per unit**, a chibi scale: compact 2.1 × 1.2 × 0.9,
    muscle 2.6 × 1.4 × 0.8, van 2.9 × 1.4 × 1.4, hoverbike 1.6 × 0.6 × 0.7 (L × W × H). This matches the
    handheld style, where cars are small next to buildings.
- **Movement** is grid-aligned: W/↑ = −Z (north), S = +Z, D = +X, A = −X. This replaces the
  isometric `screenToWorldDir`.

## 3. Showcase map

- **64×64 tiles**, authored as text layers in `src/world/showcase/map.ts`:
  - a **ground layer** (one char per tile → tile asset name)
  - a **building list**: `{ x, z, w, d, storeys, district }` rectangles
  - a **prop list**: `{ name, x, z }` anchored at the tile's south edge
  - a **parked-car list**: `{ model, variant, x, z, dir: 'h' | 'v' }`
- **Layout:**
  - A central crossroads: 4-lane avenues along x = 30..33 and z = 30..33, with centre lines, lane
    dashes and crosswalks.
  - Quadrants: **NW Meridian Core** (tall towers, plaza with floor lights), **NE Lumen Row**
    (dense low shops, narrow lane, neon), **SW The Undergrid** (dirt, rubble, short shacks),
    **SE Ironwharf** (warehouses, containers, quay and dock planks, water along the south edge).
  - Each quadrant has at least one side street. The map edge is bounded by water or buildings.
- **Curbs are computed, not authored.** A sidewalk tile adjacent to a road tile becomes
  `curb_<mask>` (bit 1=N, 2=E, 4=S, 8=W edge touching road).
- **Buildings** become module-tiled blocks:
  - The facade (south face) is `w` modules wide and `2 + storeys` tall. The bottom row is shopfronts
    and doors, the second row is wall, AC or pipes, and upper rows are a deterministic mix of lit and dark windows,
    balconies and pipes.
  - The roof is `w × d` modules with parapets on the edges and corners, and deterministic clutter (vent,
    tank, antenna, helipad on Core towers, billboard mount).
  - Each building uses its district's atlas.
- **Props** stand on the sidewalk: streetlights along avenues, neon signs on facade bands
  (mounted on the building's south face), holo-ads on Core and Lumen walls, vending machines and
  terminals in Lumen, containers, barriers and cones in Ironwharf, trash, dumpsters and rubble props in the Undergrid.
- **Parked cars:** about 12, mixing all 4 models and 3 variants, parked along curbs.
- **Collision** uses the existing `SpatialHash`:
  - building footprints
  - solid props (vending, terminal, dumpster, containers, barrier, bench, hydrant)
  - parked-car footprints
  - water tiles
  - the map boundary
- **Spawn** is on the central crossroads sidewalk.

## 4. Architecture

| File | Responsibility |
|---|---|
| `src/core/dir.ts` | `inputToWorldDir(moveX, moveY)`: grid-aligned mapping (replaces `core/iso.ts`) |
| `src/render/oblique.ts` | `obliqueMatrix()`, `ObliqueCamera` (follow, 1/16 snap, resize) |
| `src/assets/atlas.ts` | Types for `atlas.json`; `frameUV(meta, rect)` (pure); `loadAtlases()` (browser: textures with NearestFilter, sRGB, no mipmaps) |
| `src/world/showcase/map.ts` | Map data (pure) |
| `src/world/showcase/parse.ts` | `parseShowcase()` → `ShowcaseWorld` (pure): tile names grid, curb masks, buildings with module layouts, props, cars, colliders, spawn |
| `src/render/quads.ts` | `QuadBatch`: builds merged `BufferGeometry` from textured quads; supports per-quad UV updates for animation |
| `src/render/worldMeshes.ts` | Turns `ShowcaseWorld` + atlases into meshes: ground batch, one batch per district, props batch, cars; returns an `animate(t)` that swaps animated frames |
| `src/render/vehicleModel.ts` | Box-model geometry for a vehicle skin (lower body + cabin, using UV parts) |
| `src/entities/playerMesh.ts` | Recoloured voxel player at 1.5 units tall with palette colours |
| `src/main.ts` | Async boot: load atlases → build world → loop |
| Removed | `src/world/testblock.ts`, `src/render/textures.ts`, `src/render/camera.ts` (IsoCamera), `src/core/iso.ts` |

- **Materials:** `MeshLambertMaterial` with `map` (albedo atlas), `emissiveMap` (emissive atlas),
  `emissive: white`, `alphaTest: 0.5`, `transparent: false`.
- **Lighting:** night lighting (hemisphere, ambient and moon) tuned so unlit albedo reads about as dark as the
  gallery's night mode. Bloom stays.
- **Animation:** water, neon flicker and holo-ads advance by atlas `fps` through `animate(t)`, which
  rewrites only those quads' UVs.
- **Error handling:**
  - If atlas loading fails, show the overlay message "Failed to load assets" with the cause.
  - The existing overlays for missing WebGL2 and a lost context stay.

## 5. Testing

- **`dir`:** W → (0, −1), D → (1, 0), and diagonals are normalised by the player.
- **`oblique`:** a world point 1 unit north and a point 1 unit up project to the same screen offset,
  exactly 16 px at the reference scale. Depth for a facade point exceeds depth for the ground behind it. The
  snapped target is a multiple of 1/16.
- **`frameUV`:** a rect maps to normalised UVs with a V-flip (atlas top → UV 1).
- **`parseShowcase`:**
  - the grid is 64×64
  - all 4 districts have buildings
  - curb masks are correct at known cells
  - no building overlaps a road tile
  - every building and solid prop has a collider
  - spawn is walkable and not inside a collider
  - every parked car is on a road tile
  - every referenced tile and prop name exists in `atlas.json`
- **`QuadBatch`:** vertex and index counts are correct; a UV update changes only the target quad.
- **Player sim:** existing tests adapted to grid-aligned movement.
- **e2e smoke:** canvas coverage, the player moves, no console errors, and a screenshot for visual review.
- CI is unchanged otherwise (art staleness check, typecheck, tests, e2e).

## 6. Out of scope

Driving (M3), traffic and pedestrians (M4), day/night cycle and HUD (M5), procedural city
generation and chunk streaming (M2), and character sprites (Art Pack 2).
