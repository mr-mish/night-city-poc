import { describe, it, expect } from 'vitest';
import { C, NAMES, PALETTE_SIZE, RGB, rgbaOf, DISTRICTS, DISTRICT_REMAP, VEHICLE_REMAP } from '../art/palette.ts';
import { PixelCanvas } from '../art/lib/pixels.ts';
import { parseGrid } from '../art/lib/grid.ts';
import { encodePng, decodePng } from '../art/lib/png.ts';

describe('palette', () => {
  it('has 48 unique colours at indices 1..48', () => {
    expect(PALETTE_SIZE).toBe(48);
    expect(NAMES).toHaveLength(48);
    expect(RGB).toHaveLength(49);
    const keys = new Set(RGB.slice(1).map((c) => c.join(',')));
    expect(keys.size).toBe(48);
    expect(C.o0).toBe(1);
    expect(C.l0).toBe(48);
  });
  it('index 0 is transparent', () => {
    expect(rgbaOf(0)[3]).toBe(0);
    expect(rgbaOf(C.k2)[3]).toBe(255);
    expect(() => rgbaOf(99)).toThrow();
  });
  it('remap tables only target valid colours', () => {
    for (const d of DISTRICTS) for (const v of Object.values(DISTRICT_REMAP[d])) expect(v).toBeGreaterThanOrEqual(1);
    for (const t of Object.values(VEHICLE_REMAP)) for (const v of Object.values(t)) expect(v).toBeLessThanOrEqual(48);
  });
});

describe('PixelCanvas', () => {
  it('ignores out-of-bounds writes and reads 0', () => {
    const c = new PixelCanvas(4, 4);
    c.set(-1, 0, 5);
    c.set(4, 4, 5);
    expect(c.get(-1, 0)).toBe(0);
    expect([...c.data].every((v) => v === 0)).toBe(true);
  });
  it('rect, line and dither paint the expected pixels', () => {
    const c = new PixelCanvas(4, 4);
    c.rect(1, 1, 2, 2, 3);
    expect(c.get(1, 1)).toBe(3);
    expect(c.get(3, 3)).toBe(0);
    c.line(0, 0, 3, 3, 7);
    expect(c.get(2, 2)).toBe(7);
    const d = new PixelCanvas(2, 2);
    d.dither(0, 0, 2, 2, 1, 2);
    expect([...d.data]).toEqual([1, 2, 2, 1]);
  });
  it('outline surrounds opaque pixels without overwriting them', () => {
    const c = new PixelCanvas(3, 3);
    c.set(1, 1, 9);
    c.outline(1);
    expect(c.get(1, 1)).toBe(9);
    expect(c.get(1, 0)).toBe(1);
    expect(c.get(0, 0)).toBe(0); // diagonal not outlined
  });
  it('blit skips transparent pixels and supports flipX', () => {
    const src = parseGrid('ab\n.b', { a: 1, b: 2 });
    const dst = new PixelCanvas(2, 2);
    dst.rect(0, 0, 2, 2, 5);
    dst.blit(src, 0, 0, true);
    expect([...dst.data]).toEqual([2, 1, 2, 5]);
  });
  it('remap swaps indices and leaves others', () => {
    const c = parseGrid('ab', { a: 1, b: 2 });
    expect([...c.remap({ 1: 9 }).data]).toEqual([9, 2]);
  });
});

describe('parseGrid', () => {
  it('dedents and maps legend characters', () => {
    const c = parseGrid(`
      .a
      aa
    `, { a: 4 });
    expect(c.w).toBe(2);
    expect(c.h).toBe(2);
    expect([...c.data]).toEqual([0, 4, 4, 4]);
  });
  it('rejects unknown characters and ragged rows', () => {
    expect(() => parseGrid('ax', { a: 1 })).toThrow(/unknown/i);
    expect(() => parseGrid('aa\na', { a: 1 })).toThrow(/ragged/i);
  });
});

describe('png', () => {
  it('round-trips RGBA pixels with a valid signature', () => {
    const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 10, 20, 30, 255]);
    const buf = encodePng(2, 2, rgba);
    expect([...buf.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const out = decodePng(buf);
    expect(out.w).toBe(2);
    expect(out.h).toBe(2);
    expect([...out.rgba]).toEqual([...rgba]);
  });
  it('is deterministic', () => {
    const rgba = new Uint8Array(16 * 16 * 4).fill(77);
    expect(encodePng(16, 16, rgba).equals(encodePng(16, 16, rgba))).toBe(true);
  });
});
