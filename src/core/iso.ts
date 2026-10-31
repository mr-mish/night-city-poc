/**
 * The isometric camera looks from direction (1,1,1) toward its target.
 * On the ground plane, screen-right is (1,0,-1)/√2 and screen-up is (-1,0,-1)/√2.
 */
export type Vec2 = { x: number; z: number };

export function screenToWorldDir(right: number, up: number): Vec2 {
  const k = Math.SQRT1_2;
  // `+ 0` normalises -0 to 0.
  return { x: (right - up) * k + 0, z: (-right - up) * k + 0 };
}
