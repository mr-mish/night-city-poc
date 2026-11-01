import * as THREE from 'three';
import type { UV } from '../assets/atlas';

export type V3 = readonly [number, number, number];

/**
 * Accumulates textured quads into one merged BufferGeometry (one draw call per material).
 * Corners are given bottom-left, bottom-right, top-right, top-left as seen from the normal side.
 */
export class QuadBatch {
  private readonly pos: number[] = [];
  private readonly nrm: number[] = [];
  private readonly uvs: number[] = [];
  private count = 0;
  private geometry: THREE.BufferGeometry | null = null;

  add(corners: readonly [V3, V3, V3, V3], uv: UV, normal: V3): number {
    for (const c of corners) this.pos.push(c[0], c[1], c[2]);
    for (let k = 0; k < 4; k++) this.nrm.push(normal[0], normal[1], normal[2]);
    this.uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);
    return this.count++;
  }

  get size(): number {
    return this.count;
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    const idx: number[] = [];
    for (let q = 0; q < this.count; q++) {
      const b = q * 4;
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    g.setIndex(idx);
    g.computeBoundingSphere();
    this.geometry = g;
    return g;
  }

  /** Swap one quad's UVs (animation). Only valid after build(). */
  setUV(i: number, uv: UV): void {
    if (!this.geometry) throw new Error('QuadBatch.setUV before build()');
    const a = this.geometry.getAttribute('uv') as THREE.BufferAttribute;
    const b = i * 4;
    a.setXY(b, uv.u0, uv.v0);
    a.setXY(b + 1, uv.u1, uv.v0);
    a.setXY(b + 2, uv.u1, uv.v1);
    a.setXY(b + 3, uv.u0, uv.v1);
    a.needsUpdate = true;
  }
}
