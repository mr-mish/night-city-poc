import './style.css';
import * as THREE from 'three';
import { createFixedStepper } from './core/loop';
import { Keyboard } from './input/keyboard';
import { SpatialHash } from './physics/collision';
import { createPlayer, updatePlayer, type PlayerState } from './entities/player';
import { PlayerMesh } from './entities/playerMesh';
import { ObliqueCamera } from './render/oblique';
import { PixelRenderer } from './render/renderer';
import { setupNightLighting } from './render/lighting';
import { buildWorld } from './render/worldMeshes';
import { loadAtlases } from './assets/atlas';
import { parseShowcase } from './world/showcase/parse';

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

async function start(): Promise<void> {
  const app = document.getElementById('app')!;
  const scene = new THREE.Scene();
  setupNightLighting(scene);

  const [atlases, world] = await Promise.all([loadAtlases(), Promise.resolve(parseShowcase())]);
  const built = buildWorld(world, atlases);
  scene.add(built.group);

  const collision = new SpatialHash(8);
  for (const c of world.colliders) collision.insert(c);

  const player = createPlayer(world.spawn.x, world.spawn.z);
  const playerMesh = new PlayerMesh();
  scene.add(playerMesh.group);

  const cam = new ObliqueCamera();
  cam.jumpTo(player.x, player.z);
  const pixels = new PixelRenderer(app, scene, cam);

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
    stepper.advance(dt, (step) => updatePlayer(player, input, step, collision));
    playerMesh.update(player);
    built.animate(now / 1000);
    cam.follow(player.x, player.z, dt);
    cam.apply();
    pixels.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  window.__NEO__ = { player, sampleNonBlank: () => pixels.sampleNonBlank() };
}

if (hasWebGL2()) {
  start().catch((e: unknown) => {
    console.error(e);
    showOverlay(`<div>Failed to load assets.<br /><small>${String(e instanceof Error ? e.message : e)}</small></div>`);
  });
} else {
  showOverlay('<div>Neo Meridian needs WebGL2.<br />Try a recent Chrome, Edge, Firefox or Safari.</div>');
}
