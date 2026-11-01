// Screenshot the asset gallery for visual review: node e2e/gallery.mjs [zoom] [night|day] [out.png]
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [zoom = '3', mode = 'night', out = 'e2e/screenshots/gallery.png'] = process.argv.slice(2);
const server = await preview({ preview: { port: 4174, strictPort: true }, logLevel: 'warn' });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto('http://localhost:4174/assets.html');
  await page.waitForLoadState('networkidle');
  await page.evaluate(([z, m]) => {
    const zoomEl = document.getElementById('zoom');
    zoomEl.value = z;
    document.getElementById('night').checked = m === 'night';
  }, [zoom, mode]);
  await page.waitForTimeout(400);
  mkdirSync('e2e/screenshots', { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log(`gallery: ${out}${errors.length ? `\nerrors:\n${errors.join('\n')}` : ' (no errors)'}`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
process.exit(errors.length ? 1 : 0);
