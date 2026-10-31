/** Indexed-colour drawing surface. Values are palette indices; 0 = transparent. */
export class PixelCanvas {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8Array;

  constructor(w: number, h: number, data?: Uint8Array) {
    this.w = w;
    this.h = h;
    this.data = data ?? new Uint8Array(w * h);
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[y * this.w + x] as number;
  }

  set(x: number, y: number, i: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = i;
  }

  rect(x: number, y: number, w: number, h: number, i: number): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, i);
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, i: number): this {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, i);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  /** Checkerboard of a/b (a where (x+y) is even). */
  dither(x: number, y: number, w: number, h: number, a: number, b: number): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, (xx + yy) % 2 === 0 ? a : b);
    return this;
  }

  blit(src: PixelCanvas, dx: number, dy: number, flipX = false): this {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const v = src.get(flipX ? src.w - 1 - x : x, y);
        if (v !== 0) this.set(dx + x, dy + y, v);
      }
    }
    return this;
  }

  /** Paint `i` on every transparent pixel 4-adjacent to an opaque one. */
  outline(i: number): this {
    const src = this.clone();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src.get(x, y) !== 0) continue;
        if (src.get(x - 1, y) || src.get(x + 1, y) || src.get(x, y - 1) || src.get(x, y + 1)) this.set(x, y, i);
      }
    }
    return this;
  }

  remap(table: Readonly<Record<number, number>>): PixelCanvas {
    const out = this.clone();
    for (let k = 0; k < out.data.length; k++) {
      const v = out.data[k] as number;
      const r = table[v];
      if (r !== undefined) out.data[k] = r;
    }
    return out;
  }

  clone(): PixelCanvas {
    return new PixelCanvas(this.w, this.h, new Uint8Array(this.data));
  }

  flipX(): PixelCanvas {
    return new PixelCanvas(this.w, this.h).blit(this, 0, 0, true);
  }
}
