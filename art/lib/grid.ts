import { PixelCanvas } from './pixels.ts';

/**
 * Parse a text-grid sprite. Common indentation is removed; blank leading/trailing lines ignored.
 * '.' is always transparent; every other character must be in `legend`.
 */
export function parseGrid(src: string, legend: Readonly<Record<string, number>>): PixelCanvas {
  const lines = src.split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && lines[0] === '') lines.shift();
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  if (lines.length === 0) throw new Error('parseGrid: empty grid');
  const indent = Math.min(...lines.map((l) => (l.match(/^ */) as RegExpMatchArray)[0].length));
  const rows = lines.map((l) => l.slice(indent));
  const w = (rows[0] as string).length;
  const c = new PixelCanvas(w, rows.length);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`parseGrid: ragged row ${y} (${row.length} != ${w})`);
    for (let x = 0; x < w; x++) {
      const ch = row[x] as string;
      if (ch === '.') continue;
      const v = legend[ch];
      if (v === undefined) throw new Error(`parseGrid: unknown character '${ch}' at ${x},${y}`);
      c.set(x, y, v);
    }
  });
  return c;
}
