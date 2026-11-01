export type Vec2 = { x: number; z: number };

/**
 * Grid-aligned movement for the oblique camera: screen-up is north (−Z), screen-right is east (+X).
 * `+ 0` normalises −0 to 0.
 */
export function inputToWorldDir(moveX: number, moveY: number): Vec2 {
  return { x: moveX + 0, z: -moveY + 0 };
}
