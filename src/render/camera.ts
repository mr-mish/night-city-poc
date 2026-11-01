import * as THREE from 'three';

/** World units visible vertically on screen. */
export const VIEW_HEIGHT = 34;
const OFFSET_DIST = 100;

/** Snap `target` so its projection onto the camera's right/up axes lands on whole low-res pixels. */
export function snapToPixelGrid(
  target: THREE.Vector3,
  right: THREE.Vector3,
  up: THREE.Vector3,
  unitsPerPixel: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const a = target.dot(right);
  const b = target.dot(up);
  const da = Math.round(a / unitsPerPixel) * unitsPerPixel - a;
  const db = Math.round(b / unitsPerPixel) * unitsPerPixel - b;
  return out.copy(target).addScaledVector(right, da).addScaledVector(up, db);
}

/** Orthographic camera at the classic isometric angle (looking along -(1,1,1)). */
export class IsoCamera {
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
  readonly target = new THREE.Vector3();
  private readonly offset = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(OFFSET_DIST);
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly snapped = new THREE.Vector3();
  private pixelsHigh = 270;

  constructor() {
    this.camera.position.copy(this.offset);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.right.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.up.setFromMatrixColumn(this.camera.matrixWorld, 1);
    this.resize(16 / 9, 270);
  }

  get unitsPerPixel(): number {
    return VIEW_HEIGHT / this.pixelsHigh;
  }

  resize(aspect: number, pixelsHigh: number): void {
    const h = VIEW_HEIGHT / 2;
    const w = h * aspect;
    this.camera.left = -w;
    this.camera.right = w;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
    this.pixelsHigh = pixelsHigh;
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
    snapToPixelGrid(this.target, this.right, this.up, this.unitsPerPixel, this.snapped);
    this.camera.position.copy(this.snapped).add(this.offset);
    this.camera.updateMatrixWorld();
  }
}
