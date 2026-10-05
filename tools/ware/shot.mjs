// Render one SVG to PNG, optionally a crop: node tools/ware/shot.mjs in.svg out.png [scale] [x,y,w,h]
import { launch } from '../browser.mjs';
import { readFileSync } from 'node:fs';
const [inp, out, sc = '1', crop] = process.argv.slice(2);
const svg = readFileSync(inp, 'utf8').replace(/<metadata>[\s\S]*?<\/metadata>/, '');
const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const s = +sc, W = Math.round(vb[2] * s), H = Math.round(vb[3] * s);
const browser = await launch(), page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<html><body style="margin:0">${svg.replace(/<svg /, `<svg style="width:${W}px;height:${H}px;display:block" `)}</body></html>`);
await page.waitForTimeout(200);
const clip = crop ? (([x, y, w, h]) => ({ x: x * s, y: y * s, width: w * s, height: h * s }))(crop.split(',').map(Number)) : undefined;
await page.screenshot({ path: out, clip });
await browser.close(); console.log('wrote', out);
