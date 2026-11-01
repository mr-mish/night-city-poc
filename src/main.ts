import './style.css';
import * as THREE from 'three';
import { createFixedStepper } from './core/loop';
import { Keyboard } from './input/keyboard';
import { SpatialHash } from './physics/collision';
import { createPlayer, updatePlayer, type PlayerState } from './entities/player';
import { PlayerMesh } from './entities/playerMesh';
import { IsoCamera } from './render/camera';
import { PixelRenderer } from './render/renderer';
import { setupNightLighting } from './render/lighting';
import { buildTestBlock } from './world/testblock';

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

function start(): void {
  const app = document.getElementById('app')!;
  const scene = new THREE.Scene();
  setupNightLighting(scene);

  const block = buildTestBlock();
  scene.add(block.group);
  const world = new SpatialHash(8);
  for (const c of block.colliders) world.insert(c);

  const player = createPlayer(block.spawn.x, block.spawn.z);
  const playerMesh = new PlayerMesh();
  scene.add(playerMesh.group);

  const iso = new IsoCamera();
  iso.jumpTo(player.x, player.z);
  const pixels = new PixelRenderer(app, scene, iso);

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
    stepper.advance(dt, (step) => updatePlayer(player, input, step, world));
    playerMesh.update(player);
    iso.follow(player.x, player.z, dt);
    iso.apply();
    pixels.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  window.__NEO__ = { player, sampleNonBlank: () => pixels.sampleNonBlank() };
}

if (hasWebGL2()) {
  start();
} else {
  showOverlay('<div>Neo Meridian needs WebGL2.<br />Try a recent Chrome, Edge, Firefox or Safari.</div>');
}
