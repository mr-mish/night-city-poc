import './gallery.css';

type Rect = { x: number; y: number; w: number; h: number };
type Atlas = { image: string; emissive: string; width: number; height: number; frames: Record<string, Rect[]>; fps: Record<string, number> };
type AtlasFile = { tileSize: number; atlases: Record<string, Atlas> };
type Card = { canvas: HTMLCanvasElement; frames: Rect[]; fps: number; albedo: HTMLImageElement; glow: HTMLImageElement };

const BASE = '/assets/';
const zoomEl = document.getElementById('zoom') as HTMLInputElement;
const nightEl = document.getElementById('night') as HTMLInputElement;
const root = document.getElementById('root') as HTMLElement;
const cards: Card[] = [];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });

function draw(card: Card, t: number): void {
  const zoom = Number(zoomEl.value);
  const frame = card.frames[card.fps ? Math.floor(t * card.fps) % card.frames.length : 0] as Rect;
  const c = card.canvas;
  if (c.width !== frame.w * zoom) { c.width = frame.w * zoom; c.height = frame.h * zoom; }
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(card.albedo, frame.x, frame.y, frame.w, frame.h, 0, 0, c.width, c.height);
  if (nightEl.checked) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(12, 8, 40, 0.62)';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(card.glow, frame.x, frame.y, frame.w, frame.h, 0, 0, c.width, c.height);
  }
}

async function main(): Promise<void> {
  const data = (await (await fetch(`${BASE}atlas.json`)).json()) as AtlasFile;
  for (const [name, atlas] of Object.entries(data.atlases)) {
    const [albedo, glow] = await Promise.all([loadImage(BASE + atlas.image), loadImage(BASE + atlas.emissive)]);
    const h2 = document.createElement('h2');
    h2.textContent = `${name} — ${Object.keys(atlas.frames).length} assets (${atlas.width}×${atlas.height})`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    root.append(h2, grid);
    for (const [asset, frames] of Object.entries(atlas.frames)) {
      const el = document.createElement('div');
      el.className = 'card';
      const canvas = document.createElement('canvas');
      const label = document.createElement('span');
      label.textContent = frames.length > 1 ? `${asset} ×${frames.length}` : asset;
      el.append(canvas, label);
      grid.append(el);
      cards.push({ canvas, frames, fps: atlas.fps[asset] ?? 0, albedo, glow });
    }
  }
  const tick = (ms: number) => {
    for (const card of cards) draw(card, ms / 1000);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

main().catch((e: unknown) => {
  root.textContent = `Failed to load assets: ${String(e)}`;
});
