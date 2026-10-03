// Builds play/js/peep-color.js: the areas inside each portrait part that are skin, hair, a hat or clothes.
// Open Peeps fills every part with one white shape (a body's white covers the clothes, neck and hands; a head's covers the
// face and any light hair), so colour can't be set by layer. This renders each part, finds every area enclosed by its black
// lines, decides what each one is, and saves them as flat shapes that sit under the black line art.
//   node tools/peepcolor.mjs            write play/js/peep-color.js
//   node tools/peepcolor.mjs --sheet    also write tools/peepcolor-sheet.html, every part with its areas marked, for checking
// Run it after npm run peeps. ROLE_FIX below corrects any area the rules get wrong: [layer, part, area number, role].
import fs from 'node:fs';
import path from 'node:path';
import { gameUrl, launch } from './browser.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const SHEET = process.argv.includes('--sheet');
// roles: s skin, h hair, t hat, c clothes, l lens, p a cream prop (a cup, paper, a blade)
const ROLE_FIX = [];
// bodies: what each white area is, read off the numbered sheet. d is the role for any area not listed.
// On a dark garment the white areas are mostly arms and neck (skin); on a light one they're the clothes.
const BODY = {
  'Blazer Black Tee': { d: 'c', s: [0] }, 'Button Shirt 1': { d: 'c', s: [0] }, 'Button Shirt 2': { d: 'c', s: [0] },
  'Coffee': { d: 'c', s: [0, 3], p: [2] }, 'Dress': { d: 's', c: [3, 4] }, 'Explaining': { d: 'c', s: [0, 6, 9] },
  'Fur Jacket': { d: 'c', s: [0] }, 'Gym Shirt': { d: 's' }, 'Hoodie': { d: 'c' }, 'Killer': { d: 's', p: [3] },
  'Paper': { d: 'c', s: [0, 10], p: [15] }, 'Pointing Up': { d: 'c', s: [0, 1, 2, 3] }, 'Polka Dot Jacket': { d: 'c', s: [0, 2, 3] },
  'Polo and Sweater': { d: 'c', s: [0] }, 'Shirt and Coat': { d: 'c', s: [0] }, 'Sporty Tee': { d: 's', c: [1, 2, 3] },
  'Striped Pocket Tee': { d: 'c', s: [0, 4, 7] }, 'Striped Tee': { d: 'c', s: [0, 7] }, 'Sweater': { d: 'c', s: [0, 11] },
  'Sweater Dots': { d: 'c', s: [0] }, 'Tee 1': { d: 'c', s: [0, 2] }, 'Tee 2': { d: 's' }, 'Tee Arms Crossed': { d: 's' },
  'Thunder T-Shirt': { d: 's' }, 'Turtleneck': { d: 's' }
};

const browser = await launch();
const page = await browser.newPage();
await page.goto(gameUrl); await page.waitForTimeout(300);
const found = await page.evaluate(() => {
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '2000'); svg.setAttribute('height', '2000'); document.body.appendChild(svg);
  const out = {};
  // the face's middle, in the head's own coordinates, from where the face parts sit
  const fb = Object.values(PEEP_PARTS.face).map(html => { const g = document.createElementNS(NS, 'g'); g.innerHTML = html; svg.appendChild(g); const b = g.getBBox(); g.remove(); return b });
  const fx = fb.reduce((a, b) => a + b.x + b.width / 2, 0) / fb.length, fy = fb.reduce((a, b) => a + b.y + b.height / 2, 0) / fb.length;
  const faceIn = { x: PEEP_AT.face[0] - PEEP_AT.head[0] + fx, y: PEEP_AT.face[1] - PEEP_AT.head[1] + fy };
  for (const layer of ['body', 'head', 'beard', 'acc']) {
    out[layer] = {};
    for (const [name, html] of Object.entries(PEEP_PARTS[layer])) {
      if (!html.includes('fill="#fff"')) continue;
      const g = document.createElementNS(NS, 'g'); g.innerHTML = html; svg.appendChild(g);
      const bb = g.getBBox(), pad = 6, W = Math.ceil(bb.width) + pad * 2, H = Math.ceil(bb.height) + pad * 2;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
      for (const el of g.querySelectorAll('path')) {
        const fill = el.getAttribute('fill'); if (fill !== '#fff' && fill !== '#000') continue;
        const m = el.transform.baseVal.consolidate(), M = m ? m.matrix : new DOMMatrix();
        ctx.setTransform(new DOMMatrix().translate(pad - bb.x, pad - bb.y).multiply(M));
        ctx.fillStyle = fill; ctx.fill(new Path2D(el.getAttribute('d')), el.getAttribute('fill-rule') || 'evenodd');
      }
      g.remove();
      const px = ctx.getImageData(0, 0, W, H).data, white = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) white[i] = px[i * 4 + 3] > 250 && px[i * 4] > 235 && px[i * 4 + 1] > 235 && px[i * 4 + 2] > 235 ? 1 : 0;
      // label the white areas (4-connected)
      const lab = new Int32Array(W * H).fill(-1), comps = [];
      for (let i = 0; i < W * H; i++) {
        if (!white[i] || lab[i] >= 0) continue;
        const id = comps.length, st = [i]; lab[i] = id; let n = 0, sx = 0, sy = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
        while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          for (const k of [j - 1, j + 1, j - W, j + W]) if (k >= 0 && k < W * H && white[k] && lab[k] < 0 && Math.abs((k % W) - x) <= 1) { lab[k] = id; st.push(k) } }
        comps.push({ id, n, cx: sx / n, cy: sy / n, x0, y0, x1, y1 });
      }
      // trace each area's outline (Moore neighbour) and simplify it
      const trace = c => { let s = -1; for (let y = c.y0; y <= c.y1 && s < 0; y++) for (let x = c.x0; x <= c.x1; x++) if (lab[y * W + x] === c.id) { s = y * W + x; break }
        const D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], pts = []; let p = s, dir = 7, guard = 0;
        const inC = (x, y) => x >= 0 && y >= 0 && x < W && y < H && lab[y * W + x] === c.id;
        do { const x = p % W, y = (p / W) | 0; pts.push([x, y]); let k = (dir + 6) % 8, moved = false;
          for (let t = 0; t < 8; t++) { const nx = x + D[k][0], ny = y + D[k][1]; if (inC(nx, ny)) { p = ny * W + nx; dir = k; moved = true; break } k = (k + 1) % 8 }
          if (!moved) break } while (p !== s && guard++ < 200000);
        const rdp = (a, e) => { if (a.length < 3) return a; let d = 0, i0 = 0; const [x1, y1] = a[0], [x2, y2] = a[a.length - 1], L = Math.hypot(x2 - x1, y2 - y1) || 1;
          for (let i = 1; i < a.length - 1; i++) { const dd = Math.abs((y2 - y1) * a[i][0] - (x2 - x1) * a[i][1] + x2 * y1 - y2 * x1) / L; if (dd > d) { d = dd; i0 = i } }
          return d > e ? rdp(a.slice(0, i0 + 1), e).slice(0, -1).concat(rdp(a.slice(i0), e)) : [a[0], a[a.length - 1]] };
        const half = Math.floor(pts.length / 2), sp = rdp(pts.slice(0, half + 1), 1.3).slice(0, -1).concat(rdp(pts.slice(half), 1.3));
        return 'M' + sp.map(([x, y]) => `${Math.round(x - pad + bb.x)} ${Math.round(y - pad + bb.y)}`).join('L') + 'Z' };
      const total = comps.reduce((a, c) => a + c.n, 0);
      out[layer][name] = { box: { x: bb.x, y: bb.y, w: bb.width, h: bb.height }, areas: comps.filter(c => c.n > 40).map(c => ({ n: c.n, share: c.n / total, cx: c.cx - pad + bb.x, cy: c.cy - pad + bb.y, x0: c.x0 - pad + bb.x, y0: c.y0 - pad + bb.y, x1: c.x1 - pad + bb.x, y1: c.y1 - pad + bb.y, d: trace(c) })) };
    }
  }
  return { out, faceIn };
});
await browser.close();

// what each area is
const { out, faceIn } = found, result = {}, sheetInfo = {};
for (const [layer, parts] of Object.entries(out)) {
  result[layer] = {};
  for (const [name, part] of Object.entries(parts)) {
    const { box, areas } = part; let roles;
    if (layer === 'head') {
      const bald = /No Hair|Shaved/.test(name), hat = /^hat-|Turban/.test(name);
      const inside = a => faceIn.x >= a.x0 && faceIn.x <= a.x1 && faceIn.y >= a.y0 && faceIn.y <= a.y1;
      let face = areas.filter(inside).sort((a, b) => b.n - a.n)[0] || areas.slice().sort((a, b) => Math.hypot(a.cx - faceIn.x, a.cy - faceIn.y) - Math.hypot(b.cx - faceIn.x, b.cy - faceIn.y))[0];
      roles = areas.map(a => {
        if (bald || a === face) return 's';
        // ears: small areas level with the face and just beside it
        if (face && a.n < face.n * .14 && a.cy > face.y0 && a.cy < face.y1 + 20 && Math.abs(a.cx - face.cx) < (face.x1 - face.x0) * .9) return 's';
        return hat ? 't' : 'h';
      });
    } else if (layer === 'body') {
      const m = BODY[name] || { d: 'c' };
      roles = areas.map((a, i) => ['s', 'c', 'p'].find(r => (m[r] || []).includes(i)) || m.d);
    } else if (layer === 'beard') roles = areas.map(() => 'h');
    else roles = areas.map(() => 'l');
    ROLE_FIX.filter(f => f[0] === layer && f[1] === name).forEach(f => { if (roles[f[2]] != null) roles[f[2]] = f[3] });
    // biggest first, so smaller areas (hands on a sleeve) are drawn over larger ones
    const by = {}; areas.forEach((a, i) => by[roles[i]] = (by[roles[i]] || 0) + a.n);
    const base = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    result[layer][name] = { b: base ? base[0] : 'c', a: areas.map((a, i) => [roles[i], a.d, a.n]).sort((a, b) => b[2] - a[2]).map(([r, d]) => [r, d]) };
    if (SHEET) (sheetInfo[layer] = sheetInfo[layer] || {})[name] = areas.map((a, i) => ({ i, role: roles[i], share: +a.share.toFixed(3), cx: Math.round(a.cx), cy: Math.round(a.cy) }));
  }
}
const js = `/* Ink Crossing: the colour areas inside each portrait part (skin, hair, hat, clothes, lens), made by tools/peepcolor.mjs
   from peep-parts.js. Don't edit by hand: run npm run peeps:color after npm run peeps. */
"use strict";
const PEEP_AREAS=${JSON.stringify(result)};
`;
fs.writeFileSync(path.join(root, 'play/js/peep-color.js'), js);
console.log(`peep-color.js: ${(js.length / 1024).toFixed(0)} KB`);
if (SHEET) {
  const col = { s: '#f2a7c3', h: '#f2d14b', t: '#7fc3e8', c: '#9fd39b', l: '#cccccc' };
  let h = '<!doctype html><meta charset=utf-8><body style="font:12px sans-serif;background:#eee"><script src="../play/js/peep-parts.js"></script><div id=s style="display:flex;flex-wrap:wrap;gap:8px"></div><script>const A=' + JSON.stringify(Object.fromEntries(Object.entries(result).map(([l, p]) => [l, Object.fromEntries(Object.entries(p).map(([n, a]) => [n, { paths: a.a, areas: (sheetInfo[l] || {})[n] }]))]))) + ',C=' + JSON.stringify(col) + `;
  for(const l in A)for(const n in A[l]){const a=A[l][n],d=document.createElement('div');d.style.cssText='background:#fff;padding:4px;width:300px';
  d.innerHTML='<b>'+l+': '+n+'</b><svg viewBox="-260 -120 1300 1000" width="290" height="225"><g fill-rule="evenodd">'+a.paths.map(([r,p])=>'<path d="'+p+'" fill="'+C[r]+'"/>').join('')+PEEP_PARTS[l][n].replace(/fill="#fff"/g,'fill="none"')+(a.areas||[]).filter(x=>x.share>.004).map(x=>'<text x="'+x.cx+'" y="'+x.cy+'" font-size="44" font-weight="bold" fill="#c00" stroke="#fff" stroke-width="8" paint-order="stroke" text-anchor="middle">'+x.i+'</text>').join('')+'</g></svg><div>'+(a.areas||[]).map(x=>x.i+':'+x.role+' '+x.share).join(' | ')+'</div>';s.appendChild(d)}<\/script>`;
  fs.writeFileSync(path.join(root, 'tools/peepcolor-sheet.html'), h);
  console.log('wrote tools/peepcolor-sheet.html');
}
