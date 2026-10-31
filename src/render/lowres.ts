export type LowRes = { width: number; height: number; scale: number };

/** Pick an integer upscale so the internal height is close to `targetH`, then size the buffer to cover the window. */
export function computeLowRes(winW: number, winH: number, targetH = 270): LowRes {
  const scale = Math.max(1, Math.round(winH / targetH));
  return { width: Math.ceil(winW / scale), height: Math.ceil(winH / scale), scale };
}
