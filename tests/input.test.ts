import { describe, it, expect } from 'vitest';
import { mapKeys, emptyInput } from '../src/input/keyboard';

describe('mapKeys', () => {
  it('returns neutral input with no keys', () => {
    expect(mapKeys(new Set())).toEqual(emptyInput());
  });
  it('maps WASD and arrows', () => {
    expect(mapKeys(new Set(['KeyW'])).moveY).toBe(1);
    expect(mapKeys(new Set(['ArrowDown'])).moveY).toBe(-1);
    expect(mapKeys(new Set(['KeyD'])).moveX).toBe(1);
    expect(mapKeys(new Set(['ArrowLeft'])).moveX).toBe(-1);
  });
  it('cancels opposite keys', () => {
    expect(mapKeys(new Set(['KeyW', 'KeyS'])).moveY).toBe(0);
  });
  it('maps run, interact, handbrake', () => {
    const s = mapKeys(new Set(['ShiftLeft', 'KeyE', 'Space']));
    expect(s.run).toBe(true);
    expect(s.interact).toBe(true);
    expect(s.handbrake).toBe(true);
  });
});
