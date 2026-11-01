import { describe, it, expect } from 'vitest';
import { computeLowRes } from '../src/render/lowres';

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
