# Milestone 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployable Neo Meridian build: a pixelated isometric three.js render pipeline showing a hand-built 3×3 test block at night, with a voxel player that walks and runs under keyboard control and collides with buildings. CI and Vercel are wired up.

**Architecture:** Simulation code (`core/`, `input/`, `physics/`, `entities/player.ts`) is pure TypeScript on plain data and is unit-tested with Vitest in Node. The render layer (`render/`, `world/testblock.ts`, `entities/playerMesh.ts`) reads simulation state and never writes to it. The canvas drawing buffer is low-res (about 270 px tall) and CSS scales it up by an integer factor with `image-rendering: pixelated`. The camera is snapped to the low-res pixel grid.

**Tech Stack:** Vite 8.3.5, TypeScript 5.9.3 (strict), three 0.187.0, Vitest 5.0.5, Playwright 1.63.0 (smoke test).

## Global Constraints

- Original setting only: city "Neo Meridian". No names or branding from existing games.
- Rendering: orthographic iso camera, 45° yaw and ≈35.264° pitch (camera direction (1,1,1)), low-res internal target of about 270 px height, nearest-neighbour upscale, camera snapped to the pixel grid.
- Simulation code in `core/`, `input/`, `physics/` and `entities/player.ts` must not import `three`.
- Fixed simulation step of 1/60 s, at most 5 sub-steps per frame.
- WebGL2 required; show a friendly overlay if it's missing or the context is lost.
- Target 60 fps on a mid-range laptop.
- Exact dependency versions (no `^`).
- Branch `feat/foundation`, merged to `main` through a PR that the user reviews.

## File Map

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `vercel.json` | Tooling and deploy config |
| `.github/workflows/ci.yml` | CI: typecheck, unit tests, build, e2e smoke |
| `src/style.css` | Full-screen, pixelated canvas, overlay, hint |
| `src/core/rng.ts` | Seeded PRNG (mulberry32) |
| `src/core/iso.ts` | Screen-relative input → world XZ direction |
| `src/core/loop.ts` | Fixed-timestep accumulator |
| `src/input/keyboard.ts` | Key set → `InputState` |
| `src/physics/collision.ts` | Circle vs AABB, spatial hash |
| `src/entities/player.ts` | On-foot player simulation |
| `src/render/lowres.ts` | Low-res buffer size + integer scale |
| `src/render/camera.ts` | `IsoCamera`, `snapToPixelGrid` |
| `src/render/renderer.ts` | `PixelRenderer`: WebGLRenderer + bloom composer at low res |
| `src/render/textures.ts` | Procedural facade and neon sign canvas textures |
| `src/render/lighting.ts` | Fixed night lighting (day/night comes in M5) |
| `src/world/testblock.ts` | Hand-built 3×3 test block + colliders (replaced by citygen in M2) |
| `src/entities/playerMesh.ts` | Voxel player model + walk animation |
| `src/main.ts` | Boot, WebGL check, game loop, debug hook |
| `tests/*.test.ts` | Unit tests |
| `e2e/smoke.mjs` | Headless smoke test + screenshot |

---

### Task 1: Project scaffold, CI, Vercel config

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `vercel.json`, `.github/workflows/ci.yml`, `src/style.css`, `src/main.ts` (placeholder)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `typecheck`, `test`, `e2e`.

- [ ] **Step 1: Create the branch and install exact deps**

```bash
git checkout -b feat/foundation
npm init -y >/dev/null
npm install --save-exact three@0.187.0
npm install --save-exact -D @types/three@0.187.0 typescript@5.9.3 vite@8.3.5 vitest@5.0.5 playwright@1.63.0
```

- [ ] **Step 2: Replace `package.json` with:**

```json
{
  "name": "neo-meridian",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "e2e": "vite build && node e2e/smoke.mjs"
  },
  "dependencies": {
    "three": "0.187.0"
  },
  "devDependencies": {
    "@types/three": "0.187.0",
    "playwright": "1.63.0",
    "typescript": "5.9.3",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

Then run `npm install` to sync the lockfile.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#07051a" />
    <title>Neo Meridian</title>
  </head>
  <body>
    <div id="app"></div>
    <div id="overlay" hidden></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/style.css`**

```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #07051a; color: #e8f6ff;
  font-family: ui-monospace, Menlo, Consolas, monospace; }
#app { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
#app canvas { display: block; flex: none; image-rendering: crisp-edges; image-rendering: pixelated; }
#overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 16px; background: rgba(7, 5, 26, 0.88); font-size: 16px; line-height: 1.5; }
#overlay[hidden] { display: none; }
#overlay button { font: inherit; margin-top: 12px; padding: 8px 16px; background: #ff2bd6; color: #07051a; border: 0; cursor: pointer; }
.hint { position: fixed; left: 12px; bottom: 12px; font-size: 12px; opacity: 0.75; pointer-events: none;
  text-shadow: 0 0 4px #ff2bd6; }
```

- [ ] **Step 7: Create placeholder `src/main.ts`**

```ts
import './style.css';
document.getElementById('app')!.textContent = 'Neo Meridian';
```

- [ ] **Step 8: Create `.gitignore`, `vercel.json`, and the CI workflow**

`.gitignore`:
```
node_modules
dist
e2e/screenshots
.vercel
```

`vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

(`npm run e2e` fails until Task 8 creates `e2e/smoke.mjs`; CI is only exercised once the PR opens in Task 9.)

- [ ] **Step 9: Verify the build**

Run: `npm run build && npm test`
Expected: the build writes `dist/index.html`; vitest prints "No test files found, exiting with code 0".

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + TS + three.js project with CI and Vercel config"
```

---

### Task 2: Core utilities — seeded RNG, iso directions, fixed-step loop

**Files:**
- Create: `src/core/rng.ts`, `src/core/iso.ts`, `src/core/loop.ts`
- Test: `tests/core.test.ts`

**Interfaces:**
- Produces:
  - `type Rng = { next(): number; range(min: number, max: number): number; int(min: number, maxInclusive: number): number; pick<T>(arr: readonly T[]): T; chance(p: number): boolean }`
  - `createRng(seed: number): Rng`
  - `type Vec2 = { x: number; z: number }`; `screenToWorldDir(right: number, up: number): Vec2`
  - `createFixedStepper(stepDt?: number, maxSubSteps?: number): { advance(frameDt: number, step: (dt: number) => void): number }` returns the interpolation alpha in [0, 1).

- [ ] **Step 1: Write the failing tests** in `tests/core.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { screenToWorldDir } from '../src/core/iso';
import { createFixedStepper } from '../src/core/loop';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42), b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('differs for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('next() is in [0,1) and int() covers inclusive bounds', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      seen.add(r.int(1, 3));
    }
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
  it('pick() throws on empty arrays', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
});

describe('screenToWorldDir', () => {
  it('maps screen-up to world (-x,-z)', () => {
    const d = screenToWorldDir(0, 1);
    expect(d.x).toBeCloseTo(-Math.SQRT1_2);
    expect(d.z).toBeCloseTo(-Math.SQRT1_2);
  });
  it('maps screen-right to world (+x,-z)', () => {
    const d = screenToWorldDir(1, 0);
    expect(d.x).toBeCloseTo(Math.SQRT1_2);
    expect(d.z).toBeCloseTo(-Math.SQRT1_2);
  });
  it('returns zero for no input', () => {
    expect(screenToWorldDir(0, 0)).toEqual({ x: 0, z: 0 });
  });
});

describe('createFixedStepper', () => {
  it('runs one step per 1/60 s', () => {
    const s = createFixedStepper(1 / 60, 5);
    let n = 0;
    s.advance(1 / 60, () => n++);
    expect(n).toBe(1);
  });
  it('accumulates partial frames', () => {
    const s = createFixedStepper(1 / 60, 5);
    let n = 0;
    s.advance(1 / 120, () => n++);
    expect(n).toBe(0);
    s.advance(1 / 120, () => n++);
    expect(n).toBe(1);
  });
  it('caps sub-steps and drops the backlog', () => {
    const s = createFixedStepper(1 / 60, 5);
    let n = 0;
    const alpha = s.advance(1, () => n++);
    expect(n).toBe(5);
    expect(alpha).toBe(0);
  });
  it('ignores negative dt', () => {
    const s = createFixedStepper();
    let n = 0;
    s.advance(-1, () => n++);
    expect(n).toBe(0);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/core.test.ts`
Expected: FAIL, cannot resolve `../src/core/rng`.

- [ ] **Step 3: Implement `src/core/rng.ts`**

```ts
export type Rng = {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
};

/** mulberry32: a fast, deterministic 32-bit PRNG. */
export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, maxInclusive) => min + Math.floor(next() * (maxInclusive - min + 1)),
    pick: <T>(arr: readonly T[]): T => {
      if (arr.length === 0) throw new Error('pick() from empty array');
      return arr[Math.floor(next() * arr.length)] as T;
    },
    chance: (p) => next() < p,
  };
}
```

- [ ] **Step 4: Implement `src/core/iso.ts`**

```ts
/**
 * The isometric camera looks from direction (1,1,1) toward its target.
 * On the ground plane, screen-right is (1,0,-1)/√2 and screen-up is (-1,0,-1)/√2.
 */
export type Vec2 = { x: number; z: number };

export function screenToWorldDir(right: number, up: number): Vec2 {
  const k = Math.SQRT1_2;
  return { x: (right - up) * k + 0, z: (-right - up) * k + 0 };
}
```

(The `+ 0` turns `-0` into `0`, so `toEqual({x:0,z:0})` holds.)

- [ ] **Step 5: Implement `src/core/loop.ts`**

```ts
export type FixedStepper = {
  /** Advance by a frame's dt, calling `step` zero or more times. Returns the interpolation alpha in [0,1). */
  advance(frameDt: number, step: (dt: number) => void): number;
};

export function createFixedStepper(stepDt = 1 / 60, maxSubSteps = 5): FixedStepper {
  let acc = 0;
  return {
    advance(frameDt, step) {
      acc += Math.max(0, frameDt);
      let n = 0;
      while (acc >= stepDt && n < maxSubSteps) {
        step(stepDt);
        acc -= stepDt;
        n++;
      }
      if (acc >= stepDt) acc = 0; // spiral-of-death guard: drop the backlog
      return acc / stepDt;
    },
  };
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/core.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 7: Commit**

```bash
git add src/core tests/core.test.ts && git commit -m "feat(core): seeded rng, iso direction mapping, fixed-step loop"
```

---

### Task 3: Keyboard input mapping

**Files:**
- Create: `src/input/keyboard.ts`
- Test: `tests/input.test.ts`

**Interfaces:**
- Produces:
  - `type InputState = { moveX: number; moveY: number; run: boolean; interact: boolean; handbrake: boolean }`. `moveX` is screen-right (+1) or left (−1); `moveY` is screen-up (+1) or down (−1).
  - `emptyInput(): InputState`
  - `mapKeys(down: ReadonlySet<string>): InputState`, which takes `KeyboardEvent.code` values
  - `class Keyboard { constructor(target?: Window); read(): InputState }`

- [ ] **Step 1: Write the failing tests** in `tests/input.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { mapKeys, emptyInput } from '../src/input/keyboard';

describe('mapKeys', () => {
  it('returns neutral input with no keys', () => {
    expect(mapKeys(new Set())).toEqual(emptyInput());
  });
  it('maps WASD and arrows', () => {
    expect(mapKeys(new Set(['KeyW'])).moveY).toBe(1);
    expect(mapKeys(new Set(['ArrowDown'])).moveY).toBe(-1);
    expect(mapKeys(new Set(['KeyD'])).moveX).toBe(1);
    expect(mapKeys(new Set(['ArrowLeft'])).moveX).toBe(-1);
  });
  it('cancels opposite keys', () => {
    expect(mapKeys(new Set(['KeyW', 'KeyS'])).moveY).toBe(0);
  });
  it('maps run, interact, handbrake', () => {
    const s = mapKeys(new Set(['ShiftLeft', 'KeyE', 'Space']));
    expect(s.run).toBe(true);
    expect(s.interact).toBe(true);
    expect(s.handbrake).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/input.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/input/keyboard.ts`**

```ts
export type InputState = {
  moveX: number;
  moveY: number;
  run: boolean;
  interact: boolean;
  handbrake: boolean;
};

export const emptyInput = (): InputState => ({ moveX: 0, moveY: 0, run: false, interact: false, handbrake: false });

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE',
]);

export function mapKeys(down: ReadonlySet<string>): InputState {
  const has = (...codes: string[]) => codes.some((c) => down.has(c));
  return {
    moveX: (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0),
    moveY: (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0),
    run: has('ShiftLeft', 'ShiftRight'),
    interact: has('KeyE'),
    handbrake: has('Space'),
  };
}

export class Keyboard {
  private readonly down = new Set<string>();

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.down.add(e.code);
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  read(): InputState {
    return mapKeys(this.down);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/input.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/input tests/input.test.ts && git commit -m "feat(input): keyboard to InputState mapping"
```

---

### Task 4: Collision — circle vs AABB and spatial hash

**Files:**
- Create: `src/physics/collision.ts`
- Test: `tests/collision.test.ts`

**Interfaces:**
- Produces:
  - `type AABB = { minX: number; minZ: number; maxX: number; maxZ: number }`
  - `type Circle = { x: number; z: number; r: number }`
  - `resolveCircleAABB(c: Circle, b: AABB): boolean` mutates `c` and returns true on contact
  - `class SpatialHash { constructor(cellSize?: number); insert(b: AABB): void; query(minX: number, minZ: number, maxX: number, maxZ: number): AABB[] }`
  - `resolveAgainstWorld(c: Circle, world: SpatialHash): boolean`

- [ ] **Step 1: Write the failing tests** in `tests/collision.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { resolveCircleAABB, SpatialHash, resolveAgainstWorld, type AABB } from '../src/physics/collision';

const box: AABB = { minX: 0, minZ: 0, maxX: 10, maxZ: 10 };

describe('resolveCircleAABB', () => {
  it('ignores non-overlapping circles', () => {
    const c = { x: -2, z: 5, r: 1 };
    expect(resolveCircleAABB(c, box)).toBe(false);
    expect(c).toEqual({ x: -2, z: 5, r: 1 });
  });
  it('pushes an overlapping circle out of the nearest edge', () => {
    const c = { x: -0.5, z: 5, r: 1 };
    expect(resolveCircleAABB(c, box)).toBe(true);
    expect(c.x).toBeCloseTo(-1);
    expect(c.z).toBeCloseTo(5);
  });
  it('pushes a circle whose centre is inside along the smallest axis', () => {
    const c = { x: 9.5, z: 5, r: 0.5 };
    resolveCircleAABB(c, box);
    expect(c.x).toBeCloseTo(10.5);
  });
  it('handles corners radially', () => {
    const c = { x: -0.5, z: -0.5, r: 1 };
    resolveCircleAABB(c, box);
    expect(Math.hypot(c.x, c.z)).toBeCloseTo(1);
  });
});

describe('SpatialHash', () => {
  it('returns nearby boxes and skips distant ones', () => {
    const h = new SpatialHash(8);
    const far: AABB = { minX: 100, minZ: 100, maxX: 104, maxZ: 104 };
    h.insert(box);
    h.insert(far);
    const hits = h.query(-1, -1, 1, 1);
    expect(hits).toContain(box);
    expect(hits).not.toContain(far);
  });
  it('dedupes boxes spanning several cells', () => {
    const h = new SpatialHash(4);
    h.insert(box);
    expect(h.query(-5, -5, 15, 15)).toHaveLength(1);
  });
  it('resolveAgainstWorld pushes out of inserted boxes', () => {
    const h = new SpatialHash(8);
    h.insert(box);
    const c = { x: 5, z: 10.2, r: 0.5 };
    expect(resolveAgainstWorld(c, h)).toBe(true);
    expect(c.z).toBeCloseTo(10.5);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/collision.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/physics/collision.ts`**

```ts
export type AABB = { minX: number; minZ: number; maxX: number; maxZ: number };
export type Circle = { x: number; z: number; r: number };

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Push circle `c` out of box `b`. Mutates `c`; returns true if they overlapped. */
export function resolveCircleAABB(c: Circle, b: AABB): boolean {
  const px = clamp(c.x, b.minX, b.maxX);
  const pz = clamp(c.z, b.minZ, b.maxZ);
  const dx = c.x - px;
  const dz = c.z - pz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= c.r * c.r) return false;
  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    const push = c.r - d;
    c.x += (dx / d) * push;
    c.z += (dz / d) * push;
    return true;
  }
  // Centre is inside the box: exit through the closest face.
  const left = c.x - b.minX;
  const right = b.maxX - c.x;
  const top = c.z - b.minZ;
  const bottom = b.maxZ - c.z;
  const m = Math.min(left, right, top, bottom);
  if (m === left) c.x = b.minX - c.r;
  else if (m === right) c.x = b.maxX + c.r;
  else if (m === top) c.z = b.minZ - c.r;
  else c.z = b.maxZ + c.r;
  return true;
}

export class SpatialHash {
  private readonly cells = new Map<string, AABB[]>();

  constructor(private readonly cellSize = 8) {}

  insert(b: AABB): void {
    const cs = this.cellSize;
    for (let ix = Math.floor(b.minX / cs); ix <= Math.floor(b.maxX / cs); ix++) {
      for (let iz = Math.floor(b.minZ / cs); iz <= Math.floor(b.maxZ / cs); iz++) {
        const key = `${ix},${iz}`;
        const list = this.cells.get(key);
        if (list) list.push(b);
        else this.cells.set(key, [b]);
      }
    }
  }

  query(minX: number, minZ: number, maxX: number, maxZ: number): AABB[] {
    const cs = this.cellSize;
    const out = new Set<AABB>();
    for (let ix = Math.floor(minX / cs); ix <= Math.floor(maxX / cs); ix++) {
      for (let iz = Math.floor(minZ / cs); iz <= Math.floor(maxZ / cs); iz++) {
        const list = this.cells.get(`${ix},${iz}`);
        if (list) for (const b of list) out.add(b);
      }
    }
    return [...out];
  }
}

export function resolveAgainstWorld(c: Circle, world: SpatialHash): boolean {
  let hit = false;
  for (const b of world.query(c.x - c.r, c.z - c.r, c.x + c.r, c.z + c.r)) {
    hit = resolveCircleAABB(c, b) || hit;
  }
  return hit;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/collision.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/physics tests/collision.test.ts && git commit -m "feat(physics): circle-vs-AABB resolution and spatial hash"
```

---

### Task 5: Player simulation

**Files:**
- Create: `src/entities/player.ts`
- Test: `tests/player.test.ts`

**Interfaces:**
- Consumes: `screenToWorldDir` (Task 2), `InputState`/`emptyInput` (Task 3), `SpatialHash`/`resolveAgainstWorld` (Task 4)
- Produces:
  - `type PlayerState = { x: number; z: number; heading: number; speed: number; walkPhase: number }`. `heading` is a rotation around Y where 0 faces +Z (it matches three's `rotation.y`).
  - `WALK_SPEED = 4.5`, `RUN_SPEED = 8`, `PLAYER_RADIUS = 0.35`
  - `createPlayer(x?: number, z?: number): PlayerState`
  - `updatePlayer(p: PlayerState, input: InputState, dt: number, world: SpatialHash): void`

- [ ] **Step 1: Write the failing tests** in `tests/player.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { createPlayer, updatePlayer, WALK_SPEED, RUN_SPEED, PLAYER_RADIUS } from '../src/entities/player';
import { emptyInput } from '../src/input/keyboard';
import { SpatialHash } from '../src/physics/collision';

const step = (n: number, fn: () => void) => { for (let i = 0; i < n; i++) fn(); };

describe('updatePlayer', () => {
  it('stays still with no input', () => {
    const p = createPlayer(1, 2);
    updatePlayer(p, emptyInput(), 1 / 60, new SpatialHash());
    expect(p.x).toBe(1);
    expect(p.z).toBe(2);
    expect(p.speed).toBe(0);
  });

  it('walks screen-up at WALK_SPEED', () => {
    const p = createPlayer();
    const world = new SpatialHash();
    step(60, () => updatePlayer(p, { ...emptyInput(), moveY: 1 }, 1 / 60, world));
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(WALK_SPEED, 5);
    expect(p.x).toBeLessThan(0);
    expect(p.z).toBeLessThan(0);
  });

  it('runs faster and normalises diagonals', () => {
    const p = createPlayer();
    const world = new SpatialHash();
    step(60, () => updatePlayer(p, { ...emptyInput(), moveX: 1, moveY: 1, run: true }, 1 / 60, world));
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(RUN_SPEED, 5);
  });

  it('faces its movement direction', () => {
    const p = createPlayer();
    updatePlayer(p, { ...emptyInput(), moveX: 1 }, 1 / 60, new SpatialHash());
    // screen-right = world (+x,-z): atan2(x, z) = atan2(1,-1) = 3π/4
    expect(p.heading).toBeCloseTo((3 * Math.PI) / 4);
  });

  it('is blocked by buildings', () => {
    const world = new SpatialHash();
    // Wall across the screen-up path: everything with x < -1 is solid.
    world.insert({ minX: -20, minZ: -20, maxX: -1, maxZ: 20 });
    const p = createPlayer();
    step(120, () => updatePlayer(p, { ...emptyInput(), moveY: 1 }, 1 / 60, world));
    expect(p.x).toBeGreaterThanOrEqual(-1 + PLAYER_RADIUS - 1e-6);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/player.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/entities/player.ts`**

```ts
import { screenToWorldDir } from '../core/iso';
import type { InputState } from '../input/keyboard';
import { resolveAgainstWorld, type SpatialHash } from '../physics/collision';

export type PlayerState = { x: number; z: number; heading: number; speed: number; walkPhase: number };

export const WALK_SPEED = 4.5;
export const RUN_SPEED = 8;
export const PLAYER_RADIUS = 0.35;

export function createPlayer(x = 0, z = 0): PlayerState {
  return { x, z, heading: 0, speed: 0, walkPhase: 0 };
}

export function updatePlayer(p: PlayerState, input: InputState, dt: number, world: SpatialHash): void {
  const d = screenToWorldDir(input.moveX, input.moveY);
  const len = Math.hypot(d.x, d.z);
  if (len > 0) {
    const speed = input.run ? RUN_SPEED : WALK_SPEED;
    const vx = (d.x / len) * speed;
    const vz = (d.z / len) * speed;
    p.x += vx * dt;
    p.z += vz * dt;
    p.heading = Math.atan2(vx, vz);
    p.speed = speed;
    p.walkPhase += dt * speed * 2.2;
  } else {
    p.speed = 0;
  }
  const c = { x: p.x, z: p.z, r: PLAYER_RADIUS };
  resolveAgainstWorld(c, world);
  p.x = c.x;
  p.z = c.z;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/player.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/entities/player.ts tests/player.test.ts && git commit -m "feat(player): on-foot movement with run and collision"
```

---

### Task 6: Low-res sizing, iso camera with pixel snap, pixel renderer

**Files:**
- Create: `src/render/lowres.ts`, `src/render/camera.ts`, `src/render/renderer.ts`
- Test: `tests/render.test.ts` (covers `lowres` and `snapToPixelGrid`; three's math runs in Node)

**Interfaces:**
- Produces:
  - `type LowRes = { width: number; height: number; scale: number }`; `computeLowRes(winW: number, winH: number, targetH?: number): LowRes`
  - `VIEW_HEIGHT = 24` (world units visible vertically)
  - `snapToPixelGrid(target: Vector3, right: Vector3, up: Vector3, unitsPerPixel: number, out?: Vector3): Vector3`
  - `class IsoCamera { camera: OrthographicCamera; target: Vector3; unitsPerPixel: number; resize(aspect: number, pixelsHigh: number): void; jumpTo(x: number, z: number): void; follow(x: number, z: number, dt: number, stiffness?: number): void; apply(): void }`
  - `class PixelRenderer { renderer: WebGLRenderer; lowRes: LowRes; constructor(container: HTMLElement, scene: Scene, iso: IsoCamera); resize(): void; render(): void; sampleNonBlank(): number }`

- [ ] **Step 1: Write the failing tests** in `tests/render.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computeLowRes } from '../src/render/lowres';
import { snapToPixelGrid, IsoCamera, VIEW_HEIGHT } from '../src/render/camera';

describe('computeLowRes', () => {
  it('uses 4x scale at 1080p', () => {
    expect(computeLowRes(1920, 1080)).toEqual({ width: 480, height: 270, scale: 4 });
  });
  it('rounds to the nearest integer scale', () => {
    expect(computeLowRes(1280, 720)).toEqual({ width: 427, height: 240, scale: 3 });
  });
  it('never goes below scale 1', () => {
    expect(computeLowRes(300, 120)).toEqual({ width: 300, height: 120, scale: 1 });
  });
});

describe('snapToPixelGrid', () => {
  it('rounds along right and up axes only', () => {
    const out = snapToPixelGrid(new Vector3(0.7, 0.2, 3), new Vector3(1, 0, 0), new Vector3(0, 1, 0), 0.5);
    expect(out.x).toBeCloseTo(0.5);
    expect(out.y).toBeCloseTo(0);
    expect(out.z).toBeCloseTo(3);
  });
});

describe('IsoCamera', () => {
  it('places the camera on a pixel-grid multiple along its screen axes', () => {
    const iso = new IsoCamera();
    iso.resize(16 / 9, 270);
    expect(iso.unitsPerPixel).toBeCloseTo(VIEW_HEIGHT / 270);
    iso.jumpTo(3.1234, -7.777);
    iso.apply();
    const right = new Vector3().setFromMatrixColumn(iso.camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(iso.camera.matrixWorld, 1);
    const p = iso.camera.position;
    const a = p.dot(right) / iso.unitsPerPixel;
    const b = p.dot(up) / iso.unitsPerPixel;
    expect(Math.abs(a - Math.round(a))).toBeLessThan(1e-6);
    expect(Math.abs(b - Math.round(b))).toBeLessThan(1e-6);
  });
  it('looks down at the iso pitch', () => {
    const iso = new IsoCamera();
    const dir = new Vector3();
    iso.camera.getWorldDirection(dir);
    expect(Math.asin(-dir.y)).toBeCloseTo(Math.atan(1 / Math.SQRT2));
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/render.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/render/lowres.ts`**

```ts
export type LowRes = { width: number; height: number; scale: number };

/** Pick an integer upscale so the internal height is close to `targetH`, then size the buffer to cover the window. */
export function computeLowRes(winW: number, winH: number, targetH = 270): LowRes {
  const scale = Math.max(1, Math.round(winH / targetH));
  return { width: Math.ceil(winW / scale), height: Math.ceil(winH / scale), scale };
}
```

- [ ] **Step 4: Implement `src/render/camera.ts`**

```ts
import * as THREE from 'three';

/** World units visible vertically on screen. */
export const VIEW_HEIGHT = 24;
const OFFSET_DIST = 100;

/** Snap `target` so its projection onto the camera's right/up axes lands on whole low-res pixels. */
export function snapToPixelGrid(
  target: THREE.Vector3,
  right: THREE.Vector3,
  up: THREE.Vector3,
  unitsPerPixel: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const a = target.dot(right);
  const b = target.dot(up);
  const da = Math.round(a / unitsPerPixel) * unitsPerPixel - a;
  const db = Math.round(b / unitsPerPixel) * unitsPerPixel - b;
  return out.copy(target).addScaledVector(right, da).addScaledVector(up, db);
}

export class IsoCamera {
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
  readonly target = new THREE.Vector3();
  private readonly offset = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(OFFSET_DIST);
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly snapped = new THREE.Vector3();
  private pixelsHigh = 270;

  constructor() {
    this.camera.position.copy(this.offset);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.right.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.up.setFromMatrixColumn(this.camera.matrixWorld, 1);
    this.resize(16 / 9, 270);
  }

  get unitsPerPixel(): number {
    return VIEW_HEIGHT / this.pixelsHigh;
  }

  resize(aspect: number, pixelsHigh: number): void {
    const h = VIEW_HEIGHT / 2;
    const w = h * aspect;
    this.camera.left = -w;
    this.camera.right = w;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
    this.pixelsHigh = pixelsHigh;
  }

  jumpTo(x: number, z: number): void {
    this.target.set(x, 0, z);
  }

  follow(x: number, z: number, dt: number, stiffness = 10): void {
    const t = 1 - Math.exp(-stiffness * dt);
    this.target.x += (x - this.target.x) * t;
    this.target.z += (z - this.target.z) * t;
  }

  apply(): void {
    snapToPixelGrid(this.target, this.right, this.up, this.unitsPerPixel, this.snapped);
    this.camera.position.copy(this.snapped).add(this.offset);
    this.camera.updateMatrixWorld();
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/render.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Implement `src/render/renderer.ts`** (exercised by the e2e smoke test in Task 8)

```ts
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { IsoCamera } from './camera';
import { computeLowRes, type LowRes } from './lowres';

/** Background colour in sRGB bytes, used by sampleNonBlank(). */
export const CLEAR_RGB = [7, 5, 26] as const;

export class PixelRenderer {
  readonly renderer: THREE.WebGLRenderer;
  lowRes: LowRes = { width: 1, height: 1, scale: 1 };
  private readonly composer: EffectComposer;

  constructor(container: HTMLElement, scene: THREE.Scene, private readonly iso: IsoCamera) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, iso.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.35, 0.72));
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const lr = computeLowRes(window.innerWidth, window.innerHeight);
    this.lowRes = lr;
    this.renderer.setSize(lr.width, lr.height, false);
    const canvas = this.renderer.domElement;
    canvas.style.width = `${lr.width * lr.scale}px`;
    canvas.style.height = `${lr.height * lr.scale}px`;
    this.composer.setPixelRatio(1);
    this.composer.setSize(lr.width, lr.height);
    this.iso.resize(lr.width / lr.height, lr.height);
  }

  render(): void {
    this.composer.render();
  }

  /** Debug/test helper: render a frame and return the fraction of pixels that differ from the clear colour. */
  sampleNonBlank(): number {
    this.render();
    this.renderer.setRenderTarget(null);
    const gl = this.renderer.getContext();
    const { width, height } = this.lowRes;
    const px = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let filled = 0;
    for (let i = 0; i < px.length; i += 4) {
      const diff = Math.abs(px[i]! - CLEAR_RGB[0]) + Math.abs(px[i + 1]! - CLEAR_RGB[1]) + Math.abs(px[i + 2]! - CLEAR_RGB[2]);
      if (diff > 24) filled++;
    }
    return filled / (width * height);
  }
}
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/render tests/render.test.ts && git commit -m "feat(render): low-res pixel renderer, iso camera with pixel-grid snap, bloom"
```

---

### Task 7: Test block world, player model, lighting, game loop

**Files:**
- Create: `src/render/textures.ts`, `src/render/lighting.ts`, `src/world/testblock.ts`, `src/entities/playerMesh.ts`
- Modify: `src/main.ts` (replace the placeholder)
- Test: `tests/testblock.test.ts` (layout data only; mesh building needs a DOM canvas, so it's covered by e2e)

**Interfaces:**
- Consumes: everything from Tasks 2–6.
- Produces:
  - `makeFacadeTexture(rng: Rng): { map: CanvasTexture; emissive: CanvasTexture }`
  - `makeSignTexture(rng: Rng, color: string, vertical: boolean): CanvasTexture`
  - `setupNightLighting(scene: Scene): void`
  - `BLOCK = 20`, `ROAD = 8`, `PERIOD = 28`
  - `planTestBlock(seed: number): BuildingLot[]` (pure), where `type BuildingLot = { x: number; z: number; w: number; d: number; h: number }`
  - `lotToAABB(l: BuildingLot): AABB`
  - `buildTestBlock(seed?: number): { group: Group; colliders: AABB[]; spawn: { x: number; z: number } }`
  - `class PlayerMesh { group: Group; update(p: PlayerState): void }`
  - `window.__NEO__ = { player: PlayerState; sampleNonBlank(): number }`

- [ ] **Step 1: Write the failing test** in `tests/testblock.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { planTestBlock, lotToAABB, PERIOD, BLOCK } from '../src/world/testblock';

describe('planTestBlock', () => {
  it('is deterministic and has 4 lots per block in a 3x3 grid', () => {
    const a = planTestBlock(2091);
    expect(a).toHaveLength(36);
    expect(planTestBlock(2091)).toEqual(a);
  });
  it('keeps every building inside its block (roads stay clear)', () => {
    for (const lot of planTestBlock(2091)) {
      const b = lotToAABB(lot);
      const bx = Math.round(lot.x / PERIOD) * PERIOD;
      const bz = Math.round(lot.z / PERIOD) * PERIOD;
      expect(b.minX).toBeGreaterThanOrEqual(bx - BLOCK / 2);
      expect(b.maxX).toBeLessThanOrEqual(bx + BLOCK / 2);
      expect(b.minZ).toBeGreaterThanOrEqual(bz - BLOCK / 2);
      expect(b.maxZ).toBeLessThanOrEqual(bz + BLOCK / 2);
    }
  });
  it('makes the central block taller', () => {
    const lots = planTestBlock(2091);
    const centre = lots.filter((l) => Math.abs(l.x) < BLOCK && Math.abs(l.z) < BLOCK);
    const maxCentre = Math.max(...centre.map((l) => l.h));
    expect(maxCentre).toBeGreaterThan(18);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tests/testblock.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/render/textures.ts`**

```ts
import * as THREE from 'three';
import type { Rng } from '../core/rng';

type Palette = { wall: string; lit: string[]; litChance: number };

const FACADE_PALETTES: Palette[] = [
  { wall: '#2a2f4a', lit: ['#9ff6ff', '#e6fbff', '#7fd8ff'], litChance: 0.45 },
  { wall: '#3a2840', lit: ['#ff9ff0', '#ffd1f4', '#ff5ad6'], litChance: 0.4 },
  { wall: '#1f3536', lit: ['#b6ffd9', '#fff2a8', '#7dffb0'], litChance: 0.35 },
  { wall: '#33302c', lit: ['#ffcf7a', '#ffe9b8', '#ffa94d'], litChance: 0.3 },
];

function canvas2d(w: number, h: number): { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  const ctx = el.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { el, ctx };
}

function pixelTexture(el: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(el);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** One tile = 4 window columns × 8 floors; texture covers 4×8 world units. */
export function makeFacadeTexture(rng: Rng): { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const W = 16;
  const H = 32;
  const base = canvas2d(W, H);
  const glow = canvas2d(W, H);
  const pal = rng.pick(FACADE_PALETTES);
  base.ctx.fillStyle = pal.wall;
  base.ctx.fillRect(0, 0, W, H);
  glow.ctx.fillStyle = '#000';
  glow.ctx.fillRect(0, 0, W, H);
  base.ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let y = 0; y < H; y += 4) base.ctx.fillRect(0, y, W, 1);
  for (let cy = 0; cy < H / 4; cy++) {
    for (let cx = 0; cx < W / 4; cx++) {
      const x = cx * 4 + 1;
      const y = cy * 4 + 1;
      if (rng.chance(pal.litChance)) {
        const c = rng.pick(pal.lit);
        base.ctx.fillStyle = c;
        base.ctx.fillRect(x, y, 2, 2);
        glow.ctx.fillStyle = c;
        glow.ctx.fillRect(x, y, 2, 2);
      } else {
        base.ctx.fillStyle = '#0b0c14';
        base.ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  return { map: pixelTexture(base.el), emissive: pixelTexture(glow.el) };
}

/** Neon sign: black panel, coloured border, random glyph bars. */
export function makeSignTexture(rng: Rng, color: string, vertical: boolean): THREE.CanvasTexture {
  const W = vertical ? 8 : 24;
  const H = vertical ? 24 : 8;
  const { el, ctx } = canvas2d(W, H);
  ctx.fillStyle = '#05030a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, 1);
  ctx.fillRect(0, H - 1, W, 1);
  ctx.fillRect(0, 0, 1, H);
  ctx.fillRect(W - 1, 0, 1, H);
  if (vertical) {
    for (let y = 2; y < H - 2; y += 4) {
      for (let x = 2; x < W - 2; x++) if (rng.chance(0.6)) ctx.fillRect(x, y, 1, 3);
    }
  } else {
    for (let x = 2; x < W - 2; x += 2) {
      if (rng.chance(0.75)) ctx.fillRect(x, 2 + rng.int(0, 1), 1, rng.int(2, 4));
    }
  }
  const t = pixelTexture(el);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
```

- [ ] **Step 4: Implement `src/render/lighting.ts`**

```ts
import * as THREE from 'three';

/** Fixed night lighting for M1. Replaced by the day/night cycle in M5. */
export function setupNightLighting(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x07051a);
  scene.add(new THREE.HemisphereLight(0x6a5cff, 0x1a0c24, 1.4));
  scene.add(new THREE.AmbientLight(0x30284a, 0.8));
  const moon = new THREE.DirectionalLight(0x9fc4ff, 0.9);
  moon.position.set(-30, 60, 20);
  scene.add(moon);
}
```

- [ ] **Step 5: Implement `src/world/testblock.ts`**

```ts
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
  minX: l.x - l.w / 2, maxX: l.x + l.w / 2, minZ: l.z - l.d / 2, maxZ: l.z + l.d / 2,
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

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.MeshLambertMaterial({ color: 0x1a1824 }));
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
    return new THREE.MeshLambertMaterial({ map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.3 });
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
  const mat = new THREE.MeshBasicMaterial({ map: makeSignTexture(rng, color, vertical), color: new THREE.Color(1.8, 1.8, 1.8) });
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
  const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 4, 0.15), new THREE.MeshLambertMaterial({ color: 0x2b2a35 }), spots.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.5, 0.8) }), spots.length);
  const m = new THREE.Matrix4();
  spots.forEach(([x, z], i) => {
    poles.setMatrixAt(i, m.makeTranslation(x, 2 + SIDEWALK_H, z));
    heads.setMatrixAt(i, m.makeTranslation(x, 4 + SIDEWALK_H, z));
  });
  return [poles, heads];
}
```

- [ ] **Step 6: Run the test-block tests**

Run: `npx vitest run tests/testblock.test.ts`
Expected: PASS (3 tests). Only `planTestBlock`/`lotToAABB` run; `three` imports fine in Node, and no canvas is touched.

- [ ] **Step 7: Implement `src/entities/playerMesh.ts`**

```ts
import * as THREE from 'three';
import type { PlayerState } from './player';

export class PlayerMesh {
  readonly group = new THREE.Group();
  private readonly legL: THREE.Mesh;
  private readonly legR: THREE.Mesh;

  constructor() {
    const jacket = new THREE.MeshLambertMaterial({ color: 0x1b1b2b });
    const pants = new THREE.MeshLambertMaterial({ color: 0x2d2a40 });
    const skin = new THREE.MeshLambertMaterial({ color: 0xd9a07a });
    const trim = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 2, 2.2) });
    const hair = new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 0.3, 1.6) });

    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      this.group.add(m);
      return m;
    };
    const legGeo = new THREE.BoxGeometry(0.22, 0.8, 0.25).translate(0, -0.4, 0); // pivot at hip
    this.legL = new THREE.Mesh(legGeo, pants);
    this.legR = new THREE.Mesh(legGeo, pants);
    this.legL.position.set(-0.13, 0.8, 0);
    this.legR.position.set(0.13, 0.8, 0);
    this.group.add(this.legL, this.legR);
    box(0.6, 0.7, 0.35, jacket, 0, 1.15, 0);
    box(0.62, 0.08, 0.37, trim, 0, 0.95, 0);
    box(0.34, 0.34, 0.34, skin, 0, 1.68, 0);
    box(0.36, 0.12, 0.36, hair, 0, 1.88, 0);
    box(0.3, 0.07, 0.05, trim, 0, 1.7, 0.18); // visor faces +Z
  }

  update(p: PlayerState): void {
    this.group.position.set(p.x, 0.06, p.z);
    this.group.rotation.y = p.heading;
    const swing = p.speed > 0 ? Math.sin(p.walkPhase) * 0.6 : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
  }
}
```

- [ ] **Step 8: Replace `src/main.ts`**

```ts
import './style.css';
import * as THREE from 'three';
import { createFixedStepper } from './core/loop';
import { Keyboard } from './input/keyboard';
import { SpatialHash } from './physics/collision';
import { createPlayer, updatePlayer, type PlayerState } from './entities/player';
import { PlayerMesh } from './entities/playerMesh';
import { IsoCamera } from './render/camera';
import { PixelRenderer } from './render/renderer';
import { setupNightLighting } from './render/lighting';
import { buildTestBlock } from './world/testblock';

declare global {
  interface Window {
    __NEO__?: { player: PlayerState; sampleNonBlank(): number };
  }
}

function showOverlay(html: string): void {
  const el = document.getElementById('overlay')!;
  el.innerHTML = html;
  el.hidden = false;
}

function hasWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

function start(): void {
  const app = document.getElementById('app')!;
  const scene = new THREE.Scene();
  setupNightLighting(scene);

  const block = buildTestBlock();
  scene.add(block.group);
  const world = new SpatialHash(8);
  for (const c of block.colliders) world.insert(c);

  const player = createPlayer(block.spawn.x, block.spawn.z);
  const playerMesh = new PlayerMesh();
  scene.add(playerMesh.group);

  const iso = new IsoCamera();
  iso.jumpTo(player.x, player.z);
  const pixels = new PixelRenderer(app, scene, iso);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'NEO MERIDIAN · WASD / arrows move · Shift run';
  document.body.appendChild(hint);

  const keyboard = new Keyboard();
  const stepper = createFixedStepper(1 / 60, 5);
  let running = true;

  pixels.renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    showOverlay('<div>Graphics context lost.<br /><button onclick="location.reload()">Reload</button></div>');
  });

  let last = performance.now();
  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    const input = keyboard.read();
    stepper.advance(dt, (step) => updatePlayer(player, input, step, world));
    playerMesh.update(player);
    iso.follow(player.x, player.z, dt);
    iso.apply();
    pixels.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  window.__NEO__ = { player, sampleNonBlank: () => pixels.sampleNonBlank() };
}

if (hasWebGL2()) {
  start();
} else {
  showOverlay('<div>Neo Meridian needs WebGL2.<br />Try a recent Chrome, Edge, Firefox or Safari.</div>');
}
```

- [ ] **Step 9: Run all unit tests and the build**

Run: `npm test && npm run build`
Expected: all tests pass (36 total); build succeeds.

- [ ] **Step 10: Manual check**

Run: `npx vite --host 0.0.0.0` and open it, or rely on the Task 8 screenshot. Expected: a night city block with glowing windows and neon signs, chunky pixels, and the player moving with WASD and stopping at walls.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat(world): night test block, voxel player, game loop wiring"
```

---

### Task 8: Headless e2e smoke test

**Files:**
- Create: `e2e/smoke.mjs`

**Interfaces:**
- Consumes: `window.__NEO__` (Task 7), `npm run e2e` script (Task 1)

- [ ] **Step 1: Write `e2e/smoke.mjs`**

```js
// Headless smoke test: builds are served with `vite preview`, then Chromium checks
// that the scene renders, the player moves, and no console errors occur.
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'warn' });
const url = server.resolvedUrls?.local[0] ?? 'http://localhost:4173/';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

let failed = false;
const fail = (msg) => { console.error('FAIL:', msg); failed = true; };

try {
  await page.goto(url);
  await page.waitForFunction(() => window.__NEO__ !== undefined, null, { timeout: 20000 });
  await page.waitForTimeout(1000);

  const filled = await page.evaluate(() => window.__NEO__.sampleNonBlank());
  console.log(`rendered coverage: ${(filled * 100).toFixed(1)}%`);
  if (filled < 0.2) fail(`canvas mostly blank (${filled})`);

  const before = await page.evaluate(() => ({ ...window.__NEO__.player }));
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyW');
  const after = await page.evaluate(() => ({ ...window.__NEO__.player }));
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  console.log(`player moved: ${moved.toFixed(2)} units`);
  if (moved < 0.5) fail(`player did not move (${moved})`);

  mkdirSync('e2e/screenshots', { recursive: true });
  await page.screenshot({ path: 'e2e/screenshots/m1-foundation.png' });
  if (errors.length) fail(`console errors:\n${errors.join('\n')}`);
} catch (e) {
  fail(e instanceof Error ? e.stack : String(e));
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}

console.log(failed ? 'SMOKE: FAILED' : 'SMOKE: OK');
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it**

Run: `npm run e2e`
Expected: `rendered coverage` above 20%, `player moved` of at least 0.5 units, `SMOKE: OK`, and the screenshot written to `e2e/screenshots/m1-foundation.png`.

- [ ] **Step 3: Look at the screenshot**

Open `e2e/screenshots/m1-foundation.png`. It should show the iso block at night with crisp pixels, glowing windows, bloom on the signs, and the player near the centre. Tune colours or intensities if the frame is too dark or blown out, then rerun.

- [ ] **Step 4: Commit**

```bash
git add e2e/smoke.mjs && git commit -m "test(e2e): headless smoke test with render, movement and console checks"
```

---

### Task 9: Publish — push, PR, Vercel project

**Files:** none (remote operations)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/foundation
```

- [ ] **Step 2: Create the Vercel project linked to GitHub**

Use the Vercel MCP tools: find the team (`get_team` / `list_teams` as available), then `create_project` with name `neo-meridian`, framework `vite`, and git repository `mr-mish/night-city-poc` (production branch `main`). If the Vercel GitHub app lacks access to the repo, give the user the dashboard link to authorize it and wait.

- [ ] **Step 3: Open the PR**

Create a PR from `feat/foundation` to `main` titled "Milestone 1: foundation, pixel iso renderer, test block, walking player". The body covers the summary, test results (unit + smoke), the screenshot, and the Vercel preview URL once available.

- [ ] **Step 4: Verify**

Confirm GitHub Actions CI is green and the Vercel preview deployment is READY and loads. Send the user the screenshot and the preview link, and ask them to review and merge.
