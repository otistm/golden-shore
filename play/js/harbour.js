/* Golden Shore: the harbour, a side-on ink panorama of the port you scroll along, like a 2D platformer.
   Docks, market, tavern and shipwright stand along one quay. What each place has for you is drawn into the scene:
   goods on the market counter, faces in the tavern windows, a chalk notice at the shipwright, someone waiting on the pier. */
"use strict";
const HW=1280,HH=320;
const HCALM=matchMedia('(prefers-reduced-motion: reduce)').matches;   // no wingbeats for players who asked for less motion
const HSTOPS=[['docks','Docks',130],['market','Market',400],['tavern','Tavern',715],['wright','Shipwright',1110]];
/* The drawing itself is generated with the ware-style-assets skill (tools/ware/harbour.py -> harbourart.js, HARBOURART).
   This file lays it out and adds what changes: drifting clouds, gulls, signs, chalk, and the port's state
   (goods on the counter, hands at the windows, fittings crates, your catch). */
/* a cloud drifting right across the whole sky and round again; dur in seconds, starting where it's drawn */
const hCloud=(x,y,d,dur)=>{dur=dur||150;const lap=HW+260,dl=-((x+130)/lap)*dur;
  return`<g class="hcloud" style="animation-duration:${dur}s;animation-delay:${dl.toFixed(1)}s"><path class="hk-cloud" transform="translate(0 ${y})" d="${d}"/></g>`};
/* a gull flying across the sky: x where it starts, y its height, dur the crossing in seconds, flap the wingbeat */
const hGull=(x,y,dur,flap,s)=>{const lap=HW+120,d=-((x+60)/lap)*dur;
  return`<g transform="translate(0 ${y}) scale(${s||1})"><g class="hgull" style="animation-duration:${dur}s;animation-delay:${d.toFixed(1)}s"><g class="hglide" style="animation-delay:${(d/3).toFixed(1)}s">
    <path d="M-6 0q3-4 6 0q3-4 6 0" stroke-width=".9">${HCALM?'':`<animate attributeName="d" dur="${flap}s" repeatCount="indefinite" values="M-6 0q3-4 6 0q3-4 6 0;M-6 2q3-1.5 6-2q3 .5 6 2;M-6 0q3-4 6 0q3-4 6 0;M-6 -3q3 .5 6 3q3-2.5 6-3;M-6 0q3-4 6 0q3-4 6 0"/>`}</path></g></g></g>`};
/* a painted sign hanging from a bracket in the drawing */
const hSign=(x,y,t,w)=>{w=w||t.length*7+16;return`<g class="hsign"><path d="M${x} ${y}v7" stroke-width="1"/><rect x="${x-w/2}" y="${y+7}" width="${w}" height="18" rx="3" stroke-width="1.1"/><text x="${x}" y="${y+20}" text-anchor="middle">${t}</text></g>`};
/* chalk on a slate drawn into the scene */
const hBoard=(x,y,lines)=>`<g class="hboard">${lines.map((l,i)=>`<text x="${x}" y="${y+(lines.length>1?i*11-5:0)}" text-anchor="middle">${l}</text>`).join('')}</g>`;

function harbourWorld(I){
  const A=HARBOURART,ov=k=>A.over[k]||'',art=s=>`<g stroke="none">${s}</g>`;
  let g=`<defs>${A.defs}</defs>${art(A.frame)}`;
  g+=[[250,64,0,170],[470,34,1,140],[820,80,2,190],[1040,50,3,150],[1210,86,4,210]].map(([x,y,i,dur])=>hCloud(x,y,A.clouds[i],dur)).join('');
  g+=`<g class="gulls">${hGull(330,84,70,.9)}${hGull(356,96,74,.8,.85)}${hGull(960,64,58,1)}${hGull(1180,112,88,1.1,.8)}${hGull(700,40,64,.95,.9)}</g>`;
  g+=art(A.back);
  // DOCKS: a pier on piles, a net on the rail, barrels and a lobster pot, a rod over the water, the rowboat
  g+=`<g class="hstop" data-bld="docks" role="button" tabindex="0" aria-label="Docks: ${I.docks.say}"><rect class="hit" x="0" y="120" width="250" height="200"/>
    ${art(A.docks+(I.docks.fish?ov('fish'):''))}${hSign(132,171,'Docks')}
    ${I.docks.fish?`<text class="hchalk" x="163" y="250" text-anchor="middle">${I.docks.fish} fish</text>`:''}</g>`;
  // MARKET: a warehouse with a hoist over the loft, a striped stall, its counter laid with what's for sale
  const n=Math.min(4,I.market.n||0);
  g+=`<g class="hstop" data-bld="market" role="button" tabindex="0" aria-label="Market: ${I.market.say}"><rect class="hit" x="252" y="70" width="270" height="180"/>
    ${art(A.market+Array.from({length:n},(_,i)=>ov('good'+i)).join(''))}
    ${n?'':`<text class="hchalk" x="352" y="208" text-anchor="middle">sold out</text>`}
    ${hSign(352,76,'Market')}${hBoard(453,213,n?[`${n} for sale`]:['come back','later'])}</g>`;
  // TAVERN: an arched hall, a long wing with round windows, a hand at a window for each one looking for work
  const faces=Math.min(4,I.tavern.h||0);
  g+=`<g class="hstop" data-bld="tavern" role="button" tabindex="0" aria-label="Tavern: ${I.tavern.say}"><rect class="hit" x="520" y="30" width="370" height="220"/>
    ${art(A.tavern+Array.from({length:faces},(_,i)=>ov('face'+i)).join(''))}
    ${hSign(593,76,'Tavern')}
    ${faces?'':`<text class="hchalk" x="752" y="230" text-anchor="middle">no hands for hire</text>`}</g>`;
  // SHIPWRIGHT: a hull half-planked on the slipway, the workshop; a slate keeps your hull, crates for each fitting
  g+=`<g class="hstop" data-bld="wright" role="button" tabindex="0" aria-label="Shipwright: ${I.wright.say}"><rect class="hit" x="880" y="60" width="400" height="250"/>
    ${art(A.wright+Array.from({length:Math.min(3,I.wright.f||0)},(_,i)=>ov('crate'+i)).join(''))}
    ${hSign(1190,89,'Shipwright')}${hBoard(909,215,[`hull ${G.hull}/${HULL_MAX}`,I.wright.f?`${I.wright.f} fitting${I.wright.f>1?'s':''}`:'no fittings'])}</g>`;
  return g;
}
/* the scene: a window onto the world, arrows to walk along it */
function harbourScene(I){
  return`<div class="hscene"><div class="hscroll" id="hscroll"><svg class="hworld" viewBox="0 0 ${HW} ${HH}" aria-label="The harbour">${harbourWorld(I)}</svg></div>
    <button class="hnav prev" id="hprev" type="button"><span aria-hidden="true">‹</span> <b></b></button><button class="hnav next" id="hnext" type="button"><b></b> <span aria-hidden="true">›</span></button></div>`;
}
/* where along the quay you're looking: remembered while you stay in port */
function bindHarbour(){
  const sc=document.getElementById('hscroll');if(!sc)return;
  const svg=sc.querySelector('svg'),k=()=>svg.getBoundingClientRect().height/HH,center=()=>(sc.scrollLeft+sc.clientWidth/2)/k();
  const near=()=>{const c=center();let best=0;HSTOPS.forEach((s,i)=>{if(Math.abs(s[2]-c)<Math.abs(HSTOPS[best][2]-c))best=i});return best};
  const goTo=(i,smooth)=>{sc.scrollTo({left:Math.max(0,HSTOPS[i][2]*k()-sc.clientWidth/2),behavior:smooth?'smooth':'instant'})};
  const prev=document.getElementById('hprev'),next=document.getElementById('hnext');
  const label=()=>{const i=near(),atL=sc.scrollLeft<4,atR=sc.scrollLeft+sc.clientWidth>sc.scrollWidth-4;
    prev.hidden=atL||i===0;next.hidden=atR||i===HSTOPS.length-1;
    if(!prev.hidden){prev.dataset.i=i-1;prev.querySelector('b').textContent=HSTOPS[i-1][1]}
    if(!next.hidden){next.dataset.i=i+1;next.querySelector('b').textContent=HSTOPS[i+1][1]}
    PV.hx=sc.scrollLeft/k()};
  prev.onclick=()=>goTo(+prev.dataset.i,true);next.onclick=()=>goTo(+next.dataset.i,true);
  sc.addEventListener('scroll',()=>requestAnimationFrame(label),{passive:true});
  if(PV.hx!=null)sc.scrollLeft=PV.hx*k();else goTo(1,false);
  label();
}
