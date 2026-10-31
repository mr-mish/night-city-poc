import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { computeLowRes } from '../src/render/lowres';
import { snapToPixelGrid, IsoCamera, VIEW_HEIGHT } from '../src/render/camera';

describe('computeLowRes', () => {
  it('uses 4x scale at 1080p', () => {
    expect(computeLowRes(1920, 1080)).toEqual({ width: 480, height: 270, scale: 4 });
  });
  it('rounds to the nearest integer scale', () => {
    expect(computeLowRes(1280, 720)).toEqual({ width: 427, height: 240, scale: 3 });
  });
  it('never goes below scale 1', () => {
    expect(computeLowRes(300, 120)).toEqual({ width: 300, height: 120, scale: 1 });
  });
});

describe('snapToPixelGrid', () => {
  it('rounds along right and up axes only', () => {
    const out = snapToPixelGrid(new Vector3(0.7, 0.2, 3), new Vector3(1, 0, 0), new Vector3(0, 1, 0), 0.5);
    expect(out.x).toBeCloseTo(0.5);
    expect(out.y).toBeCloseTo(0);
    expect(out.z).toBeCloseTo(3);
  });
});

describe('IsoCamera', () => {
  it('places the camera on a pixel-grid multiple along its screen axes', () => {
    const iso = new IsoCamera();
    iso.resize(16 / 9, 270);
    expect(iso.unitsPerPixel).toBeCloseTo(VIEW_HEIGHT / 270);
    iso.jumpTo(3.1234, -7.777);
    iso.apply();
    const right = new Vector3().setFromMatrixColumn(iso.camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(iso.camera.matrixWorld, 1);
    const p = iso.camera.position;
    const a = p.dot(right) / iso.unitsPerPixel;
    const b = p.dot(up) / iso.unitsPerPixel;
    expect(Math.abs(a - Math.round(a))).toBeLessThan(1e-6);
    expect(Math.abs(b - Math.round(b))).toBeLessThan(1e-6);
  });
  it('looks down at the iso pitch', () => {
    const iso = new IsoCamera();
    const dir = new Vector3();
    iso.camera.getWorldDirection(dir);
    expect(Math.asin(-dir.y)).toBeCloseTo(Math.atan(1 / Math.SQRT2));
  });
});
