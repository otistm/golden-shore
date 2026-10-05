// Dump each cargo item's type, size and name from the game into tools/ware/items_meta.json (for itemart.py's review sheet).
// node tools/ware/meta.mjs
import { launch } from '../browser.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const browser = await launch(), page = await browser.newPage();
await page.goto(pathToFileURL(root + 'play/index.html').href);
await page.waitForFunction(() => typeof DEFS !== 'undefined');
const meta = await page.evaluate(() => Object.fromEntries(Object.entries(DEFS).filter(([k, d]) => !d.tags.includes('K'))
  .map(([k, d]) => [k, { kind: kindOf(k), size: d.s, n: d.n, retired: RETIRED.has(k) ? 1 : 0, ship: d.ship }])));
writeFileSync(new URL('./items_meta.json', import.meta.url), JSON.stringify(meta, null, 1));
await browser.close(); console.log('wrote tools/ware/items_meta.json (' + Object.keys(meta).length + ' items)');
