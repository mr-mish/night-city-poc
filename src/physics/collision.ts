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
