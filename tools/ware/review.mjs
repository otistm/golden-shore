// Review sheet for the ware-style assets (the skill's review_sheet.py needs cairo, which Windows lacks):
// renders every SVG in tools/ware/out into one PNG, in pairs (as found, and with every spot used).
// node tools/ware/review.mjs [glob-prefix]   -> tools/ware/out/review.png
import { launch } from '../browser.mjs';
import { readdirSync, readFileSync } from 'node:fs';
const dir = new URL('./out/', import.meta.url), only = process.argv[2] || '';
const files = readdirSync(dir).filter(f => f.endsWith('.svg') && f.startsWith(only)).sort();
const cells = files.map(f => `<figure><div>${readFileSync(new URL(f, dir), 'utf8')}</div><figcaption>${f.replace('.svg', '')}</figcaption></figure>`).join('');
const html = `<html><body style="margin:0;background:#e9e1cf;font:600 13px system-ui"><div style="display:grid;grid-template-columns:repeat(2,560px);gap:14px;padding:14px">${cells}</div>
  <style>figure{margin:0}figure svg{width:560px;height:auto;display:block;border:2px solid #1f1c1d;border-radius:10px}figcaption{padding:4px 2px}</style></body></html>`;
const browser = await launch(), page = await browser.newPage({ viewport: { width: 1176, height: 800 }, deviceScaleFactor: 1.5 });
await page.setContent(html); await page.waitForTimeout(200);
const out = new URL('./out/review.png', import.meta.url);
await page.screenshot({ path: out.pathname.replace(/^\/([A-Z]:)/, '$1'), fullPage: true });
await browser.close(); console.log('wrote tools/ware/out/review.png (' + files.length + ' assets)');
