/* Ink Crossing: Fish species, drawings and creel helpers. */
"use strict";
/* ---------- fish ---------- */
const FISH={
  sardine:{n:'Sardine',sea:0,rar:0,diff:1,v:2,look:{l:13,h:5}},
  mackerel:{n:'Mackerel',sea:0,rar:0,diff:2,v:4,look:{l:17,h:6,stripes:3}},
  snapper:{n:'Red Snapper',sea:0,rar:1,diff:3,v:7,look:{l:16,h:9,fin:1}},
  moonfish:{n:'Moonfish',sea:0,rar:2,diff:4,v:14,look:{l:12,h:12,spots:1}},
  herring:{n:'Ghost Herring',sea:1,rar:0,diff:2,v:5,look:{l:16,h:5,ghost:1}},
  lanternf:{n:'Lanternfish',sea:1,rar:1,diff:3,v:9,look:{l:14,h:7,lure:1}},
  fogeel:{n:'Fog Eel',sea:1,rar:1,diff:4,v:12,look:{l:25,h:4}},
  marlin:{n:'Silver Marlin',sea:1,rar:2,diff:5,v:22,look:{l:21,h:7,bill:1,fin:1}},
  angler:{n:'Anglerfish',sea:2,rar:0,diff:3,v:10,look:{l:14,h:11,lure:1,teeth:1}},
  oarfish:{n:'Oarfish',sea:2,rar:1,diff:4,v:16,look:{l:27,h:4,fin:1,stripes:5}},
  squid:{n:'Giant Squid',sea:2,rar:2,diff:5,v:26,shape:'squid'},
  boot:{n:'Old Boot',sea:-1,rar:0,diff:1,v:1,shape:'boot'}
};
const RAR=['Common','Uncommon','Rare'];
function fishSVG(k,cls){const f=FISH[k],L=f.look||{};let g='';
  if(f.shape==='boot')g='<path class="w fb" d="M22 4h14v14c6 1 14 3 16 8v3H14v-7l4-3z"/><path class="fbel" d="M14 22l4-3h4c8 0 24 1 30 6v4H14z" stroke="none"/><path d="M22 4h14v14c6 1 14 3 16 8v3H14v-7l4-3z"/><path d="M14 26h38M24 8h10M24 13h10" stroke-width="1.4"/>';
  else if(f.shape==='squid')g='<path class="w fb" d="M4 16c0-7 10-11 22-9l8 9-8 9C14 27 4 23 4 16z"/><path d="M34 12c8-3 14 0 24 2M34 16c8 0 16 1 24 5M34 20c6 2 12 6 20 9M32 10c6-5 14-6 22-6" stroke-width="1.6"/><circle class="k" cx="27" cy="13" r="1.8"/>';
  else{const l=L.l,h=L.h,cx=30;
    g=`<path class="w fn" d="M${cx+l-3} 16l12 -${Math.max(5,h*.9)}v${Math.max(10,h*1.8)}z"/>`;
    if(L.fin)g+=`<path class="w fn" d="M${cx-5} ${16-h+1}q7 -8 13 0z"/>`;
    g+=`<ellipse class="w fb" cx="${cx}" cy="16" rx="${l}" ry="${h}" stroke="none"/><path class="fbel" d="M${cx-l} 16.5A${l} ${h} 0 0 0 ${cx+l} 16.5z" stroke="none"/><ellipse cx="${cx}" cy="16" rx="${l}" ry="${h}" ${L.ghost?'stroke-dasharray="3 2.5"':''}/>`;
    if(L.bill)g+=`<path d="M${cx-l} 15L${cx-l-9} 13"/>`;
    for(let i=0;i<(L.stripes||0);i++){const x=cx-l*.45+i*(l*1.1/Math.max(1,L.stripes));g+=`<path d="M${x} ${16-h*.7}v${h*1.4}" stroke-width="1.3"/>`}
    if(L.spots)g+=`<circle class="k" cx="${cx+2}" cy="12" r="1.6"/><circle class="k" cx="${cx+6}" cy="18" r="1.6"/><circle class="k" cx="${cx-2}" cy="20" r="1.3"/>`;
    g+=`<path d="M${cx-l+7} ${16-h*.6}q3 ${h*.6} 0 ${h*1.2}" stroke-width="1.4"/>`;
    g+=`<circle class="k" cx="${cx-l+4}" cy="${15-h*.2}" r="1.5"/>`;
    if(L.lure)g+=`<path d="M${cx-l+6} ${16-h}c-2-7-9-8-11-4" /><circle class="w fl" cx="${cx-l-5}" cy="${16-h+3}" r="2.4"/>`;
    if(L.teeth)g+=`<path d="M${cx-l+1} 18l2 2 1.5-2 1.5 2 1.5-2" stroke-width="1.3"/>`}
  return`<svg viewBox="0 0 64 32" class="${cls||'fishsvg'} fish-${k}" aria-hidden="true"><g stroke="#000" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none">${g}</g></svg>`}
function fishOf(r){const sea=G.sea;if(r()<.08)return'boot';
  const pool=Object.keys(FISH).filter(k=>FISH[k].sea===sea),w=pool.map(k=>[55,32,13][FISH[k].rar]),tot=w.reduce((a,b)=>a+b,0);
  let x=r()*tot;for(let i=0;i<pool.length;i++){x-=w[i];if(x<=0)return pool[i]}return pool[0]}
const fishVal=(k,mult)=>Math.round(FISH[k].v*(mult||1));
const hasFish=()=>G.creel.length>0;
function takeCheapFish(){let j=0;G.creel.forEach((f,i)=>{if(FISH[f].v<FISH[G.creel[j]].v)j=i});return G.creel.splice(j,1)[0]}
function takeBestFish(){let j=0;G.creel.forEach((f,i)=>{if(FISH[f].v>FISH[G.creel[j]].v)j=i});return G.creel.splice(j,1)[0]}
function sellAll(mult){const g=G.creel.reduce((a,f)=>a+fishVal(f,mult),0);G.creel=[];G.gold+=g;bump='gold';return g}
const CREEL=8;
const an=w=>(/^[AEIOU]/i.test(w)?'an ':'a ')+w;
