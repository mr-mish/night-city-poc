import * as THREE from 'three';

/** Screen pixels per world unit, for ground and vertical faces alike. */
export const PX = 16;
/** Camera height above the ground; also the shear offset. */
const H = 100;

export const snapTexel = (v: number): number => Math.round(v * PX) / PX;

/**
 * Pixel-perfect oblique ("cabinet") camera.
 *
 * The camera looks straight down with north (−Z) up. A view-space shear `y' = y + z + H`
 * makes screen Y = (world Y − world Z) relative to the target, so 1 unit north and 1 unit up
 * both move exactly 16 px up the screen. View depth stays world Y, so higher surfaces (which are
 * further south for the same screen pixel) correctly occlude what is behind them.
 *
 * Never call `camera.updateProjectionMatrix()`: it would discard the shear.
 */
export class ObliqueCamera {
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
  readonly target = new THREE.Vector3();
  private readonly shear = new THREE.Matrix4().set(
    1, 0, 0, 0,
    0, 1, 1, H,
    0, 0, 1, 0,
    0, 0, 0, 1,
  );

  constructor() {
    this.camera.up.set(0, 0, -1);
    this.resize(480, 270);
    this.apply();
  }

  /** Size of the low-res drawing buffer in pixels. Frustum edges land on whole pixels. */
  resize(pxW: number, pxH: number): void {
    const c = this.camera;
    c.left = -Math.floor(pxW / 2) / PX;
    c.right = c.left + pxW / PX;
    c.top = Math.floor(pxH / 2) / PX;
    c.bottom = c.top - pxH / PX;
    c.projectionMatrix.makeOrthographic(c.left, c.right, c.top, c.bottom, c.near, c.far).multiply(this.shear);
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  }

  jumpTo(x: number, z: number): void {
    this.target.set(x, 0, z);
  }

  follow(x: number, z: number, dt: number, stiffness = 10): void {
    const t = 1 - Math.exp(-stiffness * dt);
    this.target.x += (x - this.target.x) * t;
    this.target.z += (z - this.target.z) * t;
  }

  apply(): void {
    const x = snapTexel(this.target.x);
    const z = snapTexel(this.target.z);
    this.camera.position.set(x, H, z);
    this.camera.lookAt(x, 0, z);
    this.camera.updateMatrixWorld();
  }
}
