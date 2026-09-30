// Balance check: each ship's randomly drafted holds against every enemy. Also puts every item into a fight once.
import { gameUrl as url, launch } from './browser.mjs';
const N = +(process.argv[2] || 40);
const browser = await launch();
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(url); await page.waitForTimeout(200);
const res = await page.evaluate((N) => {
  const realEnd = end; let res = null; end = w => { B.over = true; res = w; };
  const errs = [];
  const board = (budget, depth, ship) => { const list = []; let t = 0; while (t++ < 150 && used(list) < 10 && budget > 2) { const k = drawKey(Math.random, ship), d = DEFS[k]; if (k === 'chest') continue; const tier = rollTier(depth), p = price(k, tier); if (used(list) + d.s > 10 || p > budget) continue; list.push({ k, t: tier }); budget -= p; } return list; };
  const run = (pb, ek, sea, row, ship) => {
    G.sea = sea; G.ship = ship; const nd = { id: Math.floor(Math.random() * 1e6), row, enemy: ek }, depth = sea * 7 + row, f = enemyOf(nd), e = ENEMIES[ek], sh = SHIPS[ship];
    const pMax = sh.hp + depth * 10 + (sh.trait === 'bulwark' ? 40 : 0);
    B = { t: 0, wait: 0, speed: 1, over: false, quiet: true, bt: 0, pt: 0, st: 0, storm: 0, node: nd, bell: BELL, P: mkSide('P', pMax, pb, [sh.trait], sea), E: mkSide('E', f.hp, f.list, e.traits, sea) };
    const P = B.P, E = B.E; for (const S of [P, E]) S.items.forEach(it => { if (it.s.cd) it.c = it.s.cd * it.s.pre; });
    if (hasT(P, 'bulwark')) P.shield += 15; if (hasT(E, 'smoke')) P.items.forEach(it => it.sl = 3); if (hasT(E, 'rush')) E.items.forEach(it => it.h = Math.max(it.h, 4)); if (hasT(E, 'fire')) P.burn += TRAITS.fire.x(sea); if (hasT(E, 'whirl')) B.bell -= 8;
    startFx(); res = null; let k = 0; while (!B.over && k++ < 4000) step(.05); return res;
  };
  G = { seed: 'SIM', ship: 'sloop', sea: 0, charts: [], board: [], map: { nodes: [] } };
  try { for (const sh of SHIPKEYS) { const ks = KEYS.filter(k => DEFS[k].ship === sh || DEFS[k].ship === 'any'); for (let i = 0; i < ks.length; i += 5) { const pb = ks.slice(i, i + 5).map(k => ({ k, t: 2 })); while (used(pb) > 10) pb.pop(); run(pb, 'sharks', 0, 3, sh); } } } catch (e) { errs.push(String(e.stack || e)); }
  const out = {};
  for (const ship of SHIPKEYS) { out[ship] = {}; for (const [ek, e] of Object.entries(ENEMIES)) { let w = 0; for (let n = 0; n < N; n++) { const row = e.kind === 'b' ? 6 : e.kind === 'e' ? 3 : 2 + Math.floor(Math.random() * 3), depth = e.sea * 7 + row; try { if (run(board(14 + depth * 8, depth + 1, ship), ek, e.sea, row, ship)) w++; } catch (er) { errs.push(String(er.stack || er)); } } out[ship][ek] = Math.round(w / N * 100); } }
  end = realEnd; B = null; G = null; return { out, errs: errs.slice(0, 3) };
}, N);
for (const [ship, v] of Object.entries(res.out)) { const vals = Object.values(v); console.log(`${ship.padEnd(10)} avg ${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}%  ` + Object.entries(v).map(([k, x]) => `${k}:${x}`).join(' ')); }
await browser.close();
const all = [...res.errs, ...errors];
if (all.length) { console.error('Errors:\n' + all.join('\n')); process.exit(1); }
