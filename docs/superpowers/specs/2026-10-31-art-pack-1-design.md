# Neo Meridian — Art Pack 1 (City, Buildings, Props, Vehicles)

**Date:** 2026-10-31
**Status:** Approved design
**Branch:** `feat/art-pack-1`

## 1. Summary

A professional pixel-art asset pack for Neo Meridian in the style of DS-era top-down
adventure and monster-collecting games: a top-down 3/4 view, bold coloured outlines, chunky
readable shapes, and 2–3 tone shading. The setting is a cyberpunk city at night. AI concept art
locks the look first. The final assets are then hand-authored as palette-indexed pixel data
in TypeScript and exported to PNG atlases. A gallery page lets you review them. This pack does
**not** integrate the assets into the game; integration is a separate follow-up.

All designs are original. No sprites, characters, logos or locations from existing games are
copied or traced. The reference games guide the *style* only.

## 2. Art direction

### 2.1 Camera and perspective (target for the later integration)
- A 2.5D hybrid: the camera is aligned to the grid (north up) and tilted about **55°** down, with an
  orthographic projection.
- 3D buildings show the **south facade plus the roof**. Props are textured cards or simple
  boxes; vehicles are low-poly 3D with pixel skins.
- This replaces the M1 isometric camera when the assets are integrated.

### 2.2 Grid and scale
- **16×16 px per tile = 1 world unit.** Facade and roof modules are 16×16, and one module is one floor.
- The internal render height stays at about 270 px, which shows about 17 tiles vertically.

### 2.3 Style rules
- Outlines in a dark coloured ramp (deep navy and purple), never pure black, on props and vehicles. Tiles and
  facades use outline colours only where an edge needs definition.
- 2–3 tone shading per material with a **top-left light**. Hard pixel clusters and no anti-aliasing.
  Dithering only on large surfaces (asphalt, water, roofs).
- No orphan pixels or banding. Silhouettes must stay readable at 1× scale.

### 2.4 Palette
- One **48-colour master palette** (plus index 0 = transparent, so 49 entries) in named ramps:
  - outline (3), neutral and asphalt (6), concrete (5), metal (4), wood and rust (4), water (4),
    glass and dark window (3), skin and warm (3)
  - district accents: **Meridian Core** cyan/ice (4), **Lumen Row** magenta/pink (4),
    **Ironwharf** sodium orange (4), **The Undergrid** toxic green/hazard yellow (3)
  - light and emissive white or warm (1)
- District and vehicle colour variants are **index remap tables**, never new colours.

### 2.5 Lighting compatibility
- Every asset exports an **albedo** frame and a same-size **emissive mask** frame. The mask is
  opaque where the pixel glows (windows, neon, lamps, headlights) and transparent elsewhere.
- Albedo is authored for neutral light; the renderer applies day/night lighting and bloom.

## 3. Asset list

### 3.0 Concept art (reference only)
Four images, one night street scene per district in the target style, generated with the
Higgsfield image tool after the user approves the credit cost. They're saved to
`docs/art/concept/` with a `README.md` of style notes drawn from them. They are not shipped in the game.

### 3.1 City tileset (`tiles` atlas, 16×16 frames)
| Group | Frames |
|---|---|
| Asphalt | `asphalt_0..3` (clean, cracked, oil-stained, wet reflection) |
| Markings | `lane_dash_h/v`, `center_double_h/v`, `stop_line_h/v`, `crosswalk_h/v`, `arrow_n/e/s/w` |
| Sidewalk | `sidewalk_0..1` (paver patterns), `curb_0..15` (4-bit autotile: bit 1=N, 2=E, 4=S, 8=W edge) |
| Ground | `plaza_0..1`, `grate`, `manhole`, `dirt_0..1`, `rubble` |
| Water | `water` animation, 4 frames; `quay_edge_n`, `dock_planks_h/v` |

### 3.2 Building kits (`buildings_<district>` atlases, 16×16 modules)
One shared module set, remapped per district (`core`, `lumen`, `iron`, `under`):
- **Facade:** `wall_0..1`, `window_lit_0..2`, `window_dark_0..2`, `store_shutter`, `store_open`,
  `door`, `ac_unit`, `pipes`, `balcony`, `base_trim`
- **Roof:** `roof_0..1`, `parapet_n/e/s/w`, `parapet_corner_ne/nw/se/sw`, `vent`, `water_tank`,
  `antenna`, `helipad`, `billboard_mount`

### 3.3 Props (`props` atlas, varied sizes)
`streetlight` (16×48), `streetlight_double` (32×48), `traffic_light` (16×48),
`neon_sign_0..5` (2-frame flicker), `holo_ad_0..2` (32×32, 4-frame loop), `vending_machine`
(16×32), `data_terminal` (16×32), `bench` (32×16), `hydrant`, `dumpster` (32×24), `trash_bags`,
`traffic_cone`, `barrier` (32×16), `bollard`, `container_0..2` (48×24, three colours).

### 3.4 Vehicles (`vehicles` atlas)
Four skins mapped to simple box-based models, with UV regions for the roof, left and right sides, hood,
trunk, front, rear and wheel: `compact`, `muscle`, `van`, `hoverbike`. Each has three colour
variants by remap (`_a`, `_b`, `_c`). The emissive mask covers headlights, tail lights and
underglow. `atlas.json` records the UV rect of every part.

## 4. Pipeline and structure

```
art/
  palette.ts            master palette, ramps, district + vehicle remap tables
  lib/pixels.ts         PixelCanvas: indexed buffer (set, rect, line, dither, outline, blit, flip, remap)
  lib/grid.ts           text-grid sprite parser (legend char → palette index)
  lib/png.ts            minimal PNG encoder (node:zlib, RGBA8)
  lib/atlas.ts          shelf packer → { png, emissivePng, json }
  tiles/ buildings/ props/ vehicles/   asset modules exporting AssetDef[]
  build.ts              `npm run art`: writes public/assets/*.png + public/assets/atlas.json
public/assets/          generated output, committed
assets.html             gallery entry (second Vite input)
src/gallery/            gallery code: atlas viewer, zoom 1–8×, day/night toggle, animation playback
docs/art/concept/       concept images + style notes
```

- **AssetDef:** `{ name: string; frames: PixelCanvas[]; emissive: PixelCanvas[]; fps?: number; parts?: Record<string, Rect> }`.
- **atlas.json:** `{ atlases: { [atlas]: { image, emissive, width, height, frames: { [name]: { x, y, w, h }[] }, fps?: {...}, parts?: {...} } } }`.
- The art scripts run with Node's built-in type stripping (`node art/build.ts`); imports use
  explicit `.ts` extensions (`allowImportingTsExtensions`).
- **Hybrid authoring:** detailed props, signs and vehicle parts are text grids. Repeating tiles,
  facades and roofs are drawing functions using seeded RNG for variation.

## 5. Testing
- PNG encoder output has a valid signature, IHDR and CRCs, and its pixels survive an inflate round-trip.
- The grid parser throws on unknown legend characters and ragged rows.
- The atlas packer keeps every rect in bounds and non-overlapping.
- Every exported pixel maps to a palette colour or is transparent.
- Every asset's emissive frames match its albedo frame count and sizes.
- `curb_0..15` all exist; animated assets have the specified frame counts.
- The build is deterministic: two runs produce byte-identical files.
- CI runs `npm run art` and then `git diff --exit-code public/assets`.

## 6. Delivery
- A PR from `feat/art-pack-1`, with a Vercel preview that includes `/assets.html`.
- Screenshots of the gallery are sent to the user for review.
- Follow-up (not in this pack): switch the renderer to the 2.5D camera and use the kits in the
  world, then add character sprites in a later art pack.
