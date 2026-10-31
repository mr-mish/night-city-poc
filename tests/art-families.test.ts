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
