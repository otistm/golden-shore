// Balance check: each ship's randomly drafted holds against every enemy. Also puts every item into a fight once.
// node tools/sim.mjs [fights] fits: also compares win rates with each fitting on the ship against none.
import { gameUrl as url, launch } from './browser.mjs';
const N = +(process.argv[2] || 40), FITS = process.argv[3] === 'fits';
const browser = await launch();
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(url); await page.waitForTimeout(200);
const res = await page.evaluate(([N, FITS]) => {
  const realEnd = end; let res = null; end = w => { B.over = true; res = w; };
  const errs = [];
  const board = (budget, depth, ship) => { const list = []; let t = 0; while (t++ < 150 && used(list) < 10 && budget > 2) { const k = drawKey(Math.random, ship), d = DEFS[k]; if (k === 'chest') continue; const tier = rollTier(depth), p = price(k, tier); if (used(list) + d.s > 10 || p > budget) continue; list.push({ k, t: tier }); budget -= p; } return list; };
  const run = (pb, ek, sea, row, ship) => {
    G.sea = sea; G.ship = ship; const nd = { id: Math.floor(Math.random() * 1e6), row, enemy: ek }, f = enemyOf(nd);
    setupFight(nd, f, pb); B.wait = 0; B.quiet = true;   // the game's own fight setup, so fittings and landmarks count
    startFx(); res = null; let k = 0; while (!B.over && k++ < 4000) step(.05); return res;
  };
  G = { seed: 'SIM', ship: 'sloop', sea: 0, charts: [], board: [], map: { nodes: [] }, fit: null };
  try { for (const sh of SHIPKEYS) { const ks = KEYS.filter(k => DEFS[k].ship === sh || DEFS[k].ship === 'any'); for (let i = 0; i < ks.length; i += 5) { const pb = ks.slice(i, i + 5).map(k => ({ k, t: 2 })); while (used(pb) > 10) pb.pop(); run(pb, 'sharks', 0, 3, sh); } } } catch (e) { errs.push(String(e.stack || e)); }
  const out = {};
  for (const ship of SHIPKEYS) { out[ship] = {}; for (const [ek, e] of Object.entries(ENEMIES)) { let w = 0; for (let n = 0; n < N; n++) { const row = e.kind === 'b' ? 6 : e.kind === 'e' ? 3 : 2 + Math.floor(Math.random() * 3), depth = e.sea * 7 + row; try { if (run(board(14 + depth * 8, depth + 1, ship), ek, e.sea, row, ship)) w++; } catch (er) { errs.push(String(er.stack || er)); } } out[ship][ek] = Math.round(w / N * 100); } }
  // fittings: every ship against every enemy with one fitting on, compared with none (same enemies, same kind of holds)
  const fits = {};
  if (FITS) { const avg = () => { let w = 0, n = 0; for (const ship of SHIPKEYS) for (const [ek, e] of Object.entries(ENEMIES)) for (let i = 0; i < N; i++) { const row = e.kind === 'b' ? 6 : e.kind === 'e' ? 3 : 2 + Math.floor(Math.random() * 3), depth = e.sea * 7 + row; const pb = board(14 + depth * 8, depth + 1, ship); if (G.fit && G.fit.hull === 'planks') while (used(pb) > 9) pb.pop(); try { if (run(pb, ek, e.sea, row, ship)) w++; } catch (er) { errs.push(String(er.stack || er)); } n++; } return Math.round(w / n * 1000) / 10; };
    G.fit = null; fits.none = avg();
    for (const [k, F] of Object.entries(FITTINGS)) { G.fit = { hull: null, sails: null, guns: null, head: null }; G.fit[F.spot] = k; fits[k] = avg(); }
    G.fit = null; }
  end = realEnd; B = null; G = null; return { out, fits, errs: errs.slice(0, 3) };
}, [N, FITS]);
for (const [ship, v] of Object.entries(res.out)) { const vals = Object.values(v); console.log(`${ship.padEnd(10)} avg ${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}%  ` + Object.entries(v).map(([k, x]) => `${k}:${x}`).join(' ')); }
if (FITS) { const base = res.fits.none; console.log(`\nfittings (win % over every ship and enemy, none = ${base}%)`);
  for (const [k, v] of Object.entries(res.fits)) if (k !== 'none') { const d = Math.round((v - base) * 10) / 10; console.log(`${k.padEnd(10)} ${String(v).padStart(5)}%  ${d >= 0 ? '+' : ''}${d}`); } }
await browser.close();
const all = [...res.errs, ...errors];
if (all.length) { console.error('Errors:\n' + all.join('\n')); process.exit(1); }
