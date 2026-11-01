import * as THREE from 'three';
import type { PlayerState } from './player';

/** Player height in world units (24 px at 16 px/unit). */
const HEIGHT = 1.5;
const MODEL_HEIGHT = 1.94;

// Art Pack 1 palette.
const JACKET = 0x566780; // m1
const PANTS = 0x2e2852; // o2
const SKIN = 0xc48a66; // s1
const OUTLINE = 0x0d0b1e; // o0

/**
 * Voxel-style player restyled to the Art Pack 1 palette, with a dark outline hull and an x-ray
 * silhouette when hidden behind buildings. Placeholder until Art Pack 2 character sprites.
 * Reads PlayerState; never writes to it.
 */
export class PlayerMesh {
  readonly group = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly legL: THREE.Mesh;
  private readonly legR: THREE.Mesh;

  constructor() {
    const lambert = (color: number) => new THREE.MeshLambertMaterial({ color });
    const glow = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
    const jacket = lambert(JACKET), pants = lambert(PANTS), skin = lambert(SKIN);
    const trim = glow(0.25, 1.6, 1.75); // k2 cyan, boosted for bloom
    const hair = glow(1.7, 0.25, 1.25); // p2 magenta

    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      this.body.add(m);
      return m;
    };
    const legGeo = new THREE.BoxGeometry(0.22, 0.8, 0.25).translate(0, -0.4, 0); // pivot at hip
    this.legL = new THREE.Mesh(legGeo, pants);
    this.legR = new THREE.Mesh(legGeo, pants);
    this.legL.position.set(-0.13, 0.8, 0);
    this.legR.position.set(0.13, 0.8, 0);
    this.body.add(this.legL, this.legR);
    box(0.6, 0.7, 0.35, jacket, 0, 1.15, 0);
    box(0.62, 0.08, 0.37, trim, 0, 0.95, 0);
    box(0.34, 0.34, 0.34, skin, 0, 1.68, 0);
    box(0.36, 0.12, 0.36, hair, 0, 1.88, 0);
    box(0.3, 0.07, 0.05, trim, 0, 1.7, 0.18); // visor faces +Z
    this.addOutlineAndXray();
    this.body.scale.setScalar(HEIGHT / MODEL_HEIGHT);
    this.group.add(this.body);
  }

  /**
   * Back-face hull for a crisp dark outline, plus an x-ray ghost shown only where the *world* hides
   * the player. Render order matters: world (0) → ghost (1, GreaterDepth, no depth write) → body (2).
   * Drawing the ghost before the body keeps the body's own overlapping parts (heavy in the oblique
   * view) from triggering it; the body then paints over the ghost wherever it is visible.
   */
  private addOutlineAndXray(): void {
    const outline = new THREE.MeshBasicMaterial({ color: OUTLINE, side: THREE.BackSide });
    const xray = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.08, 0.75, 0.85), depthFunc: THREE.GreaterDepth, depthWrite: false });
    for (const part of [...this.body.children] as THREE.Mesh[]) {
      part.renderOrder = 2;
      const hull = new THREE.Mesh(part.geometry, outline);
      hull.scale.setScalar(1.18);
      hull.renderOrder = 2;
      part.add(hull);
      const ghost = new THREE.Mesh(part.geometry, xray);
      ghost.renderOrder = 1;
      part.add(ghost);
    }
  }

  update(p: PlayerState): void {
    this.group.position.set(p.x, 0, p.z);
    this.group.rotation.y = p.heading;
    const swing = p.speed > 0 ? Math.sin(p.walkPhase) * 0.6 : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
  }
}
