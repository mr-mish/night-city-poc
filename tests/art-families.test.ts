import { describe, it, expect } from 'vitest';
import { atlasSources } from '../art/build.ts';
import type { AssetDef } from '../art/lib/asset.ts';

const byName = (defs: AssetDef[]) => new Map(defs.map((d) => [d.name, d]));
const expectAsset = (defs: Map<string, AssetDef>, name: string, w: number, h: number, frames = 1) => {
  const d = defs.get(name);
  expect(d, name).toBeDefined();
  expect(d!.frames).toHaveLength(frames);
  expect(d!.frames[0]!.w, `${name} width`).toBe(w);
  expect(d!.frames[0]!.h, `${name} height`).toBe(h);
};

describe('tiles atlas', () => {
  const t = byName(atlasSources().tiles ?? []);
  it('has all tiles at 16x16', () => {
    const names = [
      'asphalt_0', 'asphalt_1', 'asphalt_2', 'asphalt_3',
      'lane_dash_h', 'lane_dash_v', 'center_double_h', 'center_double_v', 'stop_line_h', 'stop_line_v',
      'crosswalk_h', 'crosswalk_v', 'arrow_n', 'arrow_e', 'arrow_s', 'arrow_w',
      'sidewalk_0', 'sidewalk_1', 'plaza_0', 'plaza_1', 'grate', 'manhole', 'dirt_0', 'dirt_1', 'rubble',
      'quay_edge_n', 'dock_planks_h', 'dock_planks_v',
      ...Array.from({ length: 16 }, (_, i) => `curb_${i}`),
    ];
    for (const n of names) expectAsset(t, n, 16, 16);
  });
  it('water is a 4-frame animation', () => {
    expectAsset(t, 'water', 16, 16, 4);
    expect(t.get('water')!.fps).toBeGreaterThan(0);
  });
});

describe('building atlases', () => {
  const names = [
    'wall_0', 'wall_1', 'window_lit_0', 'window_lit_1', 'window_lit_2', 'window_dark_0', 'window_dark_1', 'window_dark_2',
    'store_shutter', 'store_open', 'door', 'ac_unit', 'pipes', 'balcony', 'base_trim',
    'roof_0', 'roof_1', 'parapet_n', 'parapet_e', 'parapet_s', 'parapet_w',
    'parapet_corner_ne', 'parapet_corner_nw', 'parapet_corner_se', 'parapet_corner_sw',
    'vent', 'water_tank', 'antenna', 'helipad', 'billboard_mount',
  ];
  for (const d of ['core', 'lumen', 'iron', 'under']) {
    it(`${d} has the full 16x16 kit`, () => {
      const b = byName(atlasSources()[`buildings_${d}`] ?? []);
      for (const n of names) expectAsset(b, n, 16, 16);
    });
  }
  it('districts differ only by palette remap', () => {
    const core = byName(atlasSources().buildings_core!);
    const lumen = byName(atlasSources().buildings_lumen!);
    const a = core.get('window_lit_0')!.frames[0]!;
    const b = lumen.get('window_lit_0')!.frames[0]!;
    expect([...a.data].map((v) => v !== 0)).toEqual([...b.data].map((v) => v !== 0));
    expect([...a.data]).not.toEqual([...b.data]);
  });
  it('lit windows glow, dark windows do not', () => {
    const core = byName(atlasSources().buildings_core!);
    expect([...core.get('window_lit_0')!.emissive[0]!.data].some((v) => v !== 0)).toBe(true);
    expect([...core.get('window_dark_0')!.emissive[0]!.data].every((v) => v === 0)).toBe(true);
  });
});

describe('props atlas', () => {
  const p = byName(atlasSources().props ?? []);
  it('has every prop at spec size', () => {
    expectAsset(p, 'streetlight', 16, 48);
    expectAsset(p, 'streetlight_double', 32, 48);
    expectAsset(p, 'traffic_light', 16, 48);
    expectAsset(p, 'vending_machine', 16, 32);
    expectAsset(p, 'data_terminal', 16, 32);
    expectAsset(p, 'bench', 32, 16);
    expectAsset(p, 'hydrant', 16, 16);
    expectAsset(p, 'dumpster', 32, 24);
    expectAsset(p, 'trash_bags', 16, 16);
    expectAsset(p, 'traffic_cone', 16, 16);
    expectAsset(p, 'barrier', 32, 16);
    expectAsset(p, 'bollard', 16, 16);
    for (const i of [0, 1, 2]) expectAsset(p, `container_${i}`, 48, 24);
  });
  it('neon signs flicker (2 frames) and holo-ads loop (4 frames)', () => {
    for (let i = 0; i < 6; i++) expectAsset(p, `neon_sign_${i}`, p.get(`neon_sign_${i}`)!.frames[0]!.w, p.get(`neon_sign_${i}`)!.frames[0]!.h, 2);
    for (let i = 0; i < 3; i++) expectAsset(p, `holo_ad_${i}`, 32, 32, 4);
  });
  it('light sources have emissive pixels', () => {
    for (const n of ['streetlight', 'traffic_light', 'vending_machine', 'neon_sign_0', 'holo_ad_0']) {
      expect([...p.get(n)!.emissive[0]!.data].some((v) => v !== 0), n).toBe(true);
    }
  });
});

describe('vehicles atlas', () => {
  const v = byName(atlasSources().vehicles ?? []);
  const sizes: Record<string, [number, number]> = { compact: [64, 64], muscle: [64, 64], van: [96, 64], hoverbike: [64, 32] };
  const parts = ['roof', 'hood', 'trunk', 'side_l', 'side_r', 'front', 'rear', 'wheel'];
  for (const [model, [w, h]] of Object.entries(sizes)) {
    for (const variant of ['a', 'b', 'c']) {
      it(`${model}_${variant} has its skin and UV parts`, () => {
        expectAsset(v, `${model}_${variant}`, w, h);
        const d = v.get(`${model}_${variant}`)!;
        for (const part of parts) {
          const r = d.parts?.[part];
          expect(r, `${model} ${part}`).toBeDefined();
          expect(r!.x + r!.w).toBeLessThanOrEqual(w);
          expect(r!.y + r!.h).toBeLessThanOrEqual(h);
        }
        expect([...d.emissive[0]!.data].some((x) => x !== 0), 'lights glow').toBe(true);
      });
    }
  }
});
