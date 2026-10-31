# Neo Meridian — Isometric Cyberpunk Open-World POC

**Date:** 2026-10-31
**Status:** Approved design
**Repo:** `mr-mish/night-city-poc`

## 1. Summary

A browser-playable, original cyberpunk open-world city, **Neo Meridian**, rendered as isometric
pixel art with three.js. The POC is about the open-world *feel*: walking, taking and driving
cars, a living city with traffic and crowds, and a neon night atmosphere. All art is generated
procedurally in code. The game is built with Vite + TypeScript, versioned on GitHub, and
deployed through the Vercel Git integration.

The setting is original. It does not use names, characters, factions, locations or branding
from any existing game.

## 2. Game design

### 2.1 Setting

Neo Meridian is a coastal megacity in 2091. It is surrounded by water and connected by a
highway ring. It has four districts:

| District | Role | Look and feel |
|---|---|---|
| **Meridian Core** | Downtown (centre) | Very tall glass towers, wide avenues, holo-ads, cyan/white neon |
| **Lumen Row** | Nightlife | Dense low buildings, a lot of pink/magenta signage, narrow streets, heavy foot traffic |
| **Ironwharf** | Industrial docks | Warehouses, container stacks, cranes, sodium-orange light, sparse traffic |
| **The Undergrid** | Slums | Stacked shanty blocks, flickering green/yellow neon, broken streetlights |

### 2.2 POC features (in scope)

- **On foot:** walk (WASD/arrows), run (Shift), collision against buildings and props.
- **Vehicles:** press `E` near a parked car or a traffic car to take it, and `E` again to exit.
  Arcade physics: acceleration, braking or reverse, steering that scales with speed, drift, and
  a handbrake (Space). Cars collide with buildings and other cars. Three types: compact,
  muscle car, van, each with different top speed, acceleration and grip.
- **AI traffic:** cars follow lanes on a road lane graph built from the city's roads,
  keep their distance from the car ahead, and stop at intersections in turn.
- **Pedestrians:** instanced crowds walk along sidewalk waypoints, with density set per
  district. They step aside when a car comes at them. No damage or deaths.
- **Atmosphere:** a day/night cycle (one in-game day is about 12 real minutes). At night
  windows, neon and streetlights come on. Random rain with darker, wet-looking streets.
  A bloom pass on emissive neon.
- **HUD:** a minimap (districts, roads, player arrow), a district name banner when you enter a
  district, the in-game clock, and a speedometer while driving.
- **Controls:** keyboard on desktop. On touch devices, a virtual joystick plus buttons
  (enter/exit, handbrake, run).

### 2.3 Non-goals (later phases)

Combat, police or a wanted system, missions, money or economy, save games, building
interiors, multiplayer, and audio beyond a simple ambient loop.

## 3. Rendering approach: pixelated 3D

- The world is low-poly 3D: buildings are merged box geometry; cars and people are small
  voxel-style models.
- An **orthographic camera** at the classic isometric angle (45° yaw, about 35.264° pitch) follows
  the player.
- The scene renders to a **low-resolution render target** (internal height 270 px, width from
  the aspect ratio), which is upscaled to the screen with **nearest-neighbour** filtering for a
  crisp pixel-art look. CSS `image-rendering: pixelated` is set on the canvas.
- The camera position is **snapped to the low-res pixel grid** so pixels don't shimmer while
  it moves.
- **Procedural pixel textures** (canvas, `NearestFilter`, no mipmaps) for facades and windows,
  road markings and neon signs. Each district has its own palette.
- **Bloom** (three.js `UnrealBloomPass`) runs at low resolution on emissive materials.
- The depth buffer handles draw order, so no manual isometric sorting is needed.

## 4. Architecture

### 4.1 Stack

Vite, TypeScript (strict), three.js, Vitest, and Playwright for a smoke test. No game
framework.

### 4.2 Module layout

```
src/
  main.ts              boot, game loop (fixed 60 Hz sim step, variable render)
  core/                rng.ts (seeded PRNG), iso/math helpers, event bus
  world/
    citygen.ts         seed → CityData: district map, road grid, blocks, lots (pure data)
    chunks.ts          64×64-tile chunks; streams meshes in and out around the camera
    buildings.ts       lot → building mesh (merged geometry, per-district style)
    props.ts           streetlights, signs, containers, cranes
  render/
    renderer.ts        low-res render target + nearest upscale + bloom composer
    camera.ts          ortho iso camera, follow, pixel-grid snap
    textures.ts        procedural pixel-art canvas textures
    lighting.ts        day/night cycle, sky colour, emissive ramp, rain
  entities/
    player.ts          on-foot movement, enter/exit vehicle
    vehicle.ts         arcade car physics (pure) + voxel mesh
    traffic.ts         AI cars on the lane graph
    pedestrians.ts     instanced crowd on sidewalk waypoints
  physics/collision.ts circle-vs-AABB with a spatial hash of building footprints
  input/               keyboard.ts, touch.ts → a single InputState
  ui/hud.ts            DOM overlay: minimap canvas, district banner, clock, speedometer
tests/                 Vitest unit tests
e2e/                   Playwright smoke test
```

### 4.3 Boundaries and data flow

1. `citygen(seed)` returns a plain `CityData` object: a tile grid with district IDs, road
   segments, blocks, lots with building parameters, and prop placements. It never imports
   three.js.
2. `lanes` and `sidewalks` graphs are built from `CityData` (also pure data).
3. The **simulation** (player, vehicles, traffic, pedestrians, collision) runs on plain
   state objects at a fixed timestep.
4. The **render** layer reads simulation state each frame and updates meshes and instance
   matrices. It never writes to the simulation.
5. `chunks.ts` builds and disposes chunk meshes as the camera moves. The simulation for
   traffic and pedestrians is active only within a radius around the player; agents
   that leave it are recycled and respawned near the player.

### 4.4 Error handling

- If WebGL2 isn't available, show a friendly fallback message instead of a blank page.
- The render target and composer resize when the window resizes or the device rotates.
- On `webglcontextlost`, pause and show a "reload" overlay.
- The simulation step is clamped to at most 5 sub-steps per frame, which avoids a spiral of
  death after the tab regains focus.

### 4.5 Performance targets

60 fps on a mid-range laptop and at least 30 fps on a recent phone. Instanced meshes for crowds,
traffic and repeated props. Merged geometry per chunk. A capped device pixel ratio (the
low-res target makes this mostly irrelevant).

## 5. Testing

- **Vitest unit tests:** city gen determinism (same seed gives identical `CityData`), every
  district present, roads connected (one connected component), lane graph validity,
  collision resolution, vehicle physics (acceleration, top speed, braking, grip), and input mapping.
- **Playwright smoke test** against `vite preview`: the canvas renders non-blank pixels, there are
  no console errors, and simulated key presses move the player. It captures screenshots at each
  milestone.
- **GitHub Actions CI:** `npm ci`, typecheck, unit tests and build on every push and PR.

## 6. Version control and deployment

- GitHub repo `mr-mish/night-city-poc`. `main` is the production branch.
- One feature branch and one PR per milestone. The user reviews and merges.
- Vercel project linked through the Git integration (Vite preset, `npm run build`, output
  `dist/`). `main` deploys to production and every PR or branch gets a preview URL.

## 7. Milestones

1. **Foundation:** scaffold, CI, low-res iso render pipeline, a test block, a walking player,
   keyboard input, and the Vercel project linked.
2. **City:** seeded city gen (districts, roads, buildings), chunk streaming, collision,
   procedural textures.
3. **Vehicles:** car physics, enter/exit, parked cars, follow camera tuned for driving.
4. **Life:** AI traffic on the lane graph, pedestrian crowds.
5. **Atmosphere and UI:** day/night, rain, bloom, HUD and minimap, touch controls, polish.

Each milestone is playable and deployed as a preview before it is merged.
