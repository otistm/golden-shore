/* Ink Crossing: Seeded randomness. Anything that must match for every captain on the same voyage code uses RNG(G.seed, ...). */
"use strict";
/* ---------- seeded randomness (same seed = same sea for every captain) ---------- */
function seedHash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function RNG(...p){let a=seedHash(p.join('|'));return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(r,n)=>Math.floor(r()*n),pick=(r,a)=>a[ri(r,a.length)];
const R=n=>Math.floor(Math.random()*n);
