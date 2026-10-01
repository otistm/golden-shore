// A bot plays full voyages in headless Chromium. Fails on any page error.
import { gameUrl as url, launch } from './browser.mjs';
const runs = +(process.argv[2] || 3);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
const q = s => page.$(s);
// press elements directly rather than clicking a screen position: on desktop the port is taller than the window, and a click on a
// button scrolled behind the fixed hold bar would land on cargo instead, opening its card again and again
const press = el => el.evaluate(e => e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
const click = async s => { const el = await q(s); if (el) { await press(el).catch(() => {}); return true; } return false; };
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
    else if (await q('#sailon')) { await click('.spoil .buy:not([aria-disabled])'); await page.waitForTimeout(20); await click('#sailon'); }
    else if (await q('#leave')) {
      for (const b of await page.$$('.buy:not([aria-disabled])')) { await press(b).catch(() => {}); await page.waitForTimeout(20); if (await q('.overlay')) break; }
      if (!(await q('.overlay'))) await click('#leave');
    } else {
      const nodes = await page.$$('.node.reach');
      if (nodes.length) await press(nodes[Math.floor(Math.random() * nodes.length)]).catch(() => {});
    }
    await page.waitForTimeout(40);
  }
  console.log(`voyage ${run + 1}: ${result} (${steps} steps)`);
}
await browser.close();
if (errors.length) { console.error('Page errors:\n' + errors.slice(0, 5).join('\n')); process.exit(1); }
console.log('ok: no page errors');
