import * as THREE from 'three';
import type { PlayerState } from './player';

/** Voxel-style player model. Reads PlayerState; never writes to it. */
export class PlayerMesh {
  readonly group = new THREE.Group();
  private readonly legL: THREE.Mesh;
  private readonly legR: THREE.Mesh;

  constructor() {
    const jacket = new THREE.MeshLambertMaterial({ color: 0x1b1b2b });
    const pants = new THREE.MeshLambertMaterial({ color: 0x2d2a40 });
    const skin = new THREE.MeshLambertMaterial({ color: 0xd9a07a });
    const trim = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 2, 2.2) });
    const hair = new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 0.3, 1.6) });

    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      this.group.add(m);
      return m;
    };
    const legGeo = new THREE.BoxGeometry(0.22, 0.8, 0.25).translate(0, -0.4, 0); // pivot at hip
    this.legL = new THREE.Mesh(legGeo, pants);
    this.legR = new THREE.Mesh(legGeo, pants);
    this.legL.position.set(-0.13, 0.8, 0);
    this.legR.position.set(0.13, 0.8, 0);
    this.group.add(this.legL, this.legR);
    box(0.6, 0.7, 0.35, jacket, 0, 1.15, 0);
    box(0.62, 0.08, 0.37, trim, 0, 0.95, 0);
    box(0.34, 0.34, 0.34, skin, 0, 1.68, 0);
    box(0.36, 0.12, 0.36, hair, 0, 1.88, 0);
    box(0.3, 0.07, 0.05, trim, 0, 1.7, 0.18); // visor faces +Z
  }

  update(p: PlayerState): void {
    this.group.position.set(p.x, 0.06, p.z);
    this.group.rotation.y = p.heading;
    const swing = p.speed > 0 ? Math.sin(p.walkPhase) * 0.6 : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
  }
}
