// A bot plays full voyages in headless Chromium. Fails on any page error.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const url = pathToFileURL(new URL('../play/index.html', import.meta.url).pathname).href;
const runs = +(process.argv[2] || 3);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
const q = s => page.$(s);
const click = async s => { const el = await q(s); if (el) { await el.click({ force: true }); return true; } return false; };
for (let run = 0; run < runs; run++) {
  await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url);
  await click(run ? '#new' : '#daily'); await page.waitForTimeout(150);
  await click('.shipcard:not([disabled])'); await page.waitForTimeout(150);
  let result = 'timeout', steps = 0;
  for (; steps < 900; steps++) {
    if (await q('#coach .cx')) await click('#coach .cx');
    if (await q('.overlay')) {
      if (await q('[data-a=home]')) { result = await page.innerText('.overlay h2'); break; }
      for (const s of ['#next', '.pick:not([disabled])', '[data-l=gold]', '.opt:not([disabled])', '[data-a=go]', '.overlay .primary', '.overlay button']) if (await click(s)) break;
    } else if (await q('#fstop')) await click('#fstop');
    else if (await q('#skip')) await click('#skip');
    else if (await q('#leave')) {
      for (const b of await page.$$('.buy:not([aria-disabled])')) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(20); if (await q('.overlay')) break; }
      if (!(await q('.overlay'))) await click('#leave');
    } else {
      const nodes = await page.$$('.node.reach');
      if (nodes.length) await nodes[Math.floor(Math.random() * nodes.length)].click({ force: true });
    }
    await page.waitForTimeout(40);
  }
  console.log(`voyage ${run + 1}: ${result} (${steps} steps)`);
}
await browser.close();
if (errors.length) { console.error('Page errors:\n' + errors.slice(0, 5).join('\n')); process.exit(1); }
console.log('ok: no page errors');
