import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { IsoCamera } from './camera';
import { computeLowRes, type LowRes } from './lowres';

/** Background colour in sRGB bytes, used by sampleNonBlank(). */
export const CLEAR_RGB = [7, 5, 26] as const;

/**
 * Renders at a low internal resolution; the canvas is CSS-upscaled by an integer
 * factor with `image-rendering: pixelated` for crisp pixel art.
 */
export class PixelRenderer {
  readonly renderer: THREE.WebGLRenderer;
  lowRes: LowRes = { width: 1, height: 1, scale: 1 };
  private readonly composer: EffectComposer;

  constructor(container: HTMLElement, scene: THREE.Scene, private readonly iso: IsoCamera) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, iso.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.2, 0.9));
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const lr = computeLowRes(window.innerWidth, window.innerHeight);
    this.lowRes = lr;
    this.renderer.setSize(lr.width, lr.height, false);
    const canvas = this.renderer.domElement;
    canvas.style.width = `${lr.width * lr.scale}px`;
    canvas.style.height = `${lr.height * lr.scale}px`;
    this.composer.setPixelRatio(1);
    this.composer.setSize(lr.width, lr.height);
    this.iso.resize(lr.width / lr.height, lr.height);
  }

  render(): void {
    this.composer.render();
  }

  /** Debug/test helper: render a frame and return the fraction of pixels that differ from the clear colour. */
  sampleNonBlank(): number {
    this.render();
    this.renderer.setRenderTarget(null);
    const gl = this.renderer.getContext();
    const { width, height } = this.lowRes;
    const px = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let filled = 0;
    for (let i = 0; i < px.length; i += 4) {
      const diff =
        Math.abs(px[i]! - CLEAR_RGB[0]) + Math.abs(px[i + 1]! - CLEAR_RGB[1]) + Math.abs(px[i + 2]! - CLEAR_RGB[2]);
      if (diff > 24) filled++;
    }
    return filled / (width * height);
  }
}
