// Headless smoke test: builds are served with `vite preview`, then Chromium checks
// that the scene renders, the player moves, and no console errors occur.
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'warn' });
const url = server.resolvedUrls?.local[0] ?? 'http://localhost:4173/';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

let failed = false;
const fail = (msg) => { console.error('FAIL:', msg); failed = true; };

try {
  await page.goto(url);
  await page.waitForFunction(() => window.__NEO__ !== undefined, null, { timeout: 20000 });
  await page.waitForTimeout(1000);

  const filled = await page.evaluate(() => window.__NEO__.sampleNonBlank());
  console.log(`rendered coverage: ${(filled * 100).toFixed(1)}%`);
  if (filled < 0.2) fail(`canvas mostly blank (${filled})`);

  const before = await page.evaluate(() => ({ ...window.__NEO__.player }));
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyW');
  const after = await page.evaluate(() => ({ ...window.__NEO__.player }));
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  console.log(`player moved: ${moved.toFixed(2)} units`);
  if (moved < 0.5) fail(`player did not move (${moved})`);

  mkdirSync('e2e/screenshots', { recursive: true });
  await page.screenshot({ path: 'e2e/screenshots/m1-foundation.png' });
  if (errors.length) fail(`console errors:\n${errors.join('\n')}`);
} catch (e) {
  fail(e instanceof Error ? e.stack : String(e));
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}

console.log(failed ? 'SMOKE: FAILED' : 'SMOKE: OK');
process.exit(failed ? 1 : 0);
