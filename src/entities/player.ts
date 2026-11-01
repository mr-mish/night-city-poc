import { inputToWorldDir } from '../core/dir';
import type { InputState } from '../input/keyboard';
import { resolveAgainstWorld, type SpatialHash } from '../physics/collision';

/** `heading` is rotation about Y; 0 faces +Z (matches three's rotation.y). */
export type PlayerState = { x: number; z: number; heading: number; speed: number; walkPhase: number };

export const WALK_SPEED = 4.5;
export const RUN_SPEED = 8;
export const PLAYER_RADIUS = 0.35;

export function createPlayer(x = 0, z = 0): PlayerState {
  return { x, z, heading: 0, speed: 0, walkPhase: 0 };
}

export function updatePlayer(p: PlayerState, input: InputState, dt: number, world: SpatialHash): void {
  const d = inputToWorldDir(input.moveX, input.moveY);
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
