import * as THREE from 'three';
import type { Rng } from '../core/rng';

type Palette = { wall: string; lit: string[]; litChance: number };

const FACADE_PALETTES: Palette[] = [
  { wall: '#3a4266', lit: ['#9ff6ff', '#e6fbff', '#7fd8ff'], litChance: 0.45 },
  { wall: '#523a5a', lit: ['#ff9ff0', '#ffd1f4', '#ff5ad6'], litChance: 0.4 },
  { wall: '#2c4b4c', lit: ['#b6ffd9', '#fff2a8', '#7dffb0'], litChance: 0.35 },
  { wall: '#4a453f', lit: ['#ffcf7a', '#ffe9b8', '#ffa94d'], litChance: 0.3 },
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
