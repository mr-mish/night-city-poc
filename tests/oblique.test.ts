import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { ObliqueCamera, snapTexel } from '../src/render/oblique';

describe('ObliqueCamera', () => {
  it('projects 1 unit north and 1 unit up to the same screen point, 16 px per unit', () => {
    const cam = new ObliqueCamera();
    cam.resize(480, 270);
    cam.jumpTo(0, 0);
    cam.apply();
    const origin = new Vector3(0, 0, 0).project(cam.camera);
    const north = new Vector3(0, 0, -1).project(cam.camera);
    const up = new Vector3(0, 1, 0).project(cam.camera);
    expect(north.x).toBeCloseTo(up.x, 6);
    expect(north.y).toBeCloseTo(up.y, 6);
    expect(up.y - origin.y).toBeCloseTo((16 / 270) * 2, 6);
    expect(new Vector3(1, 0, 0).project(cam.camera).x - origin.x).toBeCloseTo((16 / 480) * 2, 6);
    // the raised point (a facade) is in front of the ground behind it
    expect(up.z).toBeLessThan(north.z);
  });
  it('snaps the camera to whole texels', () => {
    const cam = new ObliqueCamera();
    cam.resize(480, 270);
    cam.jumpTo(3.03, -7.77);
    cam.apply();
    expect(Math.abs(cam.camera.position.x * 16 - Math.round(cam.camera.position.x * 16))).toBeLessThan(1e-9);
    expect(Math.abs(cam.camera.position.z * 16 - Math.round(cam.camera.position.z * 16))).toBeLessThan(1e-9);
    expect(snapTexel(0.03)).toBe(0);
    expect(snapTexel(0.05)).toBe(1 / 16);
  });
  it('puts frustum edges on whole pixels for odd sizes', () => {
    const cam = new ObliqueCamera();
    cam.resize(427, 241);
    const c = cam.camera;
    expect((c.right - c.left) * 16).toBeCloseTo(427, 6);
    expect((c.left * 16) % 1).toBeCloseTo(0, 6);
    expect((c.top * 16) % 1).toBeCloseTo(0, 6);
  });
});
