/* Ink Crossing: Ports: market, fish market, dock visitors. */
"use strict";
/* ---------- port ---------- */
function port(id){
  cancelAnimationFrame(raf);B=null;G.inPort=true;
  const n=node(id);
  if(!G.shops[id]){const r=RNG(G.seed,'shop',id,G.shopVisit||0);G.shops[id]={offers:Array.from({length:4},()=>randItem(r,depthOf(n))),reroll:1};
    const inc=4+G.sea*2;G.gold+=inc;bump='gold';fresh=true;G.freeRoll=true;logL(`Docked at ${n.name}.`);
    const pool=Object.keys(FISH).filter(k=>FISH[k].sea===G.sea);G.shops[id].demand=pool[ri(r,pool.length)];
    let msg=`+${inc} gold for trading at ${n.name}`;
    if(G.quest==='letter'){G.quest=null;G.gold+=15;logL(`Delivered Wet Jack's letter at ${n.name}. His girl cried, then paid me 15 gold.`);msg+='. Delivered the letter: +15 gold'}
    setTimeout(()=>toast(msg),250)}
  const S=G.shops[id];
  if(G.sel==null)G.moving=false;
  const anim=fresh;fresh=false;
  const vis=!G.hock&&n.row===0&&G.sea<=1?'hock':n.visitor;
  if(G.tut&&id!==900)n.visitor=null;
  const ups=new Set();S.offers.forEach(o=>{if(!o)return;const j=matchIdx(o);if(j>=0)ups.add(j)});
  // the shipwright's two fittings for this visit, seeded like the first market offers
  if(!G.tut&&!S.fits){const r=RNG(G.seed,'wright',id,G.shopVisit||0),pool=Object.keys(FITTINGS).filter(k=>!hasF(k));S.fits=[];
    while(S.fits.length<2&&pool.length)S.fits.push(pool.splice(ri(r,pool.length),1)[0])}
  const rr=S.reroll+(hasF('lion')?1:0);
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>${n.name}</h2><span>${SEAS[G.sea]}</span></div>
  <section>
    <div class="m-head"><h2 style="font-size:20px">Port market</h2><button class="ghost" id="reroll">${hasC('route')&&G.freeRoll?'Free reroll':`Reroll for ${rr}`}</button></div>
    <div class="offers">${S.offers.map((o,i)=>{
      if(!o)return`<div class="offer sold">Sold</div>`;
      const d=DEFS[o.k],p=price(o.k,o.t),up=!!findMatch(o);
      return`<div class="offer${anim?' in':''}" style="animation-delay:${i*70}ms"><button class="o-top" data-v="${i}" style="background:none;border:0;padding:0;text-align:left"><span class="o-icon t${o.t}">${emb(o.k)}${icon(o.k)}${up?CHEV:''}</span><div><h3>${d.n}</h3><p class="o-meta"><span class="tierword">${TIER[o.t]}</span>, size ${d.s}${d.cd?`, ${d.cd}s`:''}</p></div></button><p class="o-desc">${describe([o],0).L.join(' ')}</p><button class="buy${up?' up':''}" data-b="${i}" ${G.gold<p?'aria-disabled="true"':''}>${up?'Upgrade':'Buy'} for ${p} gold</button></div>`}).join('')}</div>
  </section>
  ${G.tut?'':wrightHTML(S)}
  ${vis&&!S.talked?`<button class="visitor" id="visitor">${portrait(NPCS[vis].look)}<div><span class="soft">On the dock: ${NPCS[vis].role.toLowerCase()}</span><b>${NPCS[vis].n}</b></div><span class="talk">Talk</span></button>`:''}
  ${G.hock==='active'?`<button class="visitor quest" id="hockin">${portrait(NPCS.hock.look)}<div><span class="soft">Quest: three fish for Hock</span><b>Hock is on the dock</b></div><span class="talk">Talk</span></button>`:''}
  ${G.creel.length?`<section class="market"><div class="m-head"><h2 style="font-size:20px">Fish market</h2><button class="ghost" id="sellall">Sell all for ${G.creel.reduce((a,f)=>a+fishVal(f,f===S.demand?2:1),0)}</button></div>
    ${S.demand?`<p class="soft" style="margin:-4px 0 8px">Paying double for ${FISH[S.demand].n} today.</p>`:''}
    <div class="fishlist">${G.creel.map((f,i)=>`<div class="fishrow">${fishSVG(f)}<div><b>${FISH[f].n}</b><span class="soft">${RAR[FISH[f].rar]}${f===S.demand?', in demand':''}</span></div><button class="buy" data-f="${i}">Sell ${fishVal(f,f===S.demand?2:1)}</button></div>`).join('')}</div></section>`:''}
  ${holdDock(`<button class="primary" id="leave">Set sail</button>`,ups,lockerUps(S.offers))}`;
  bindBar();bindHold('port',()=>port(id));fitDock();
  document.getElementById('reroll').onclick=()=>{
    if(hasC('route')&&G.freeRoll){G.freeRoll=false}
    else{if(G.gold<rr)return toast(`Need ${rr-G.gold} more gold`);G.gold-=rr;S.reroll++;bump='gold'}
    S.offers=Array.from({length:4},()=>randItem(Math.random,depthOf(n)));fresh=true;save();port(id)};
  app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>itemSheet([S.offers[+b.dataset.v]],0,'view',()=>{}));
  app.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const i=+b.dataset.b,o=S.offers[i],p=price(o.k,o.t);
    if(G.gold<p)return toast(`Need ${p-G.gold} more gold`);
    const m=findMatch(o),r=addItem(o);if(!r)return toast(`No room for size ${DEFS[o.k].s}${G.locker?' in your hold or locker':''}. Sell something first.`);
    if(r==='up')toast(`${DEFS[o.k].n} upgraded to ${TIER[m.list[m.i].t]}`);
    if(r==='locker')toast(`Hold full. Stowed the ${DEFS[o.k].n} in your locker.`);
    G.gold-=p;S.offers[i]=null;bump='gold';save();port(id);coach('bought')});
  document.getElementById('leave').onclick=()=>{G.moving=false;G.sel=null;if(G.tut&&G.tut.i>=TUT.length-1)return finishTutorial();chart()};
  const vb=document.getElementById('visitor');if(vb)vb.onclick=()=>talk(vis,id+'v',()=>port(id),()=>{S.talked=true});
  const hb=document.getElementById('hockin');if(hb)hb.onclick=()=>talk('hock2',id+'h',()=>port(id));
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const i=+b.dataset.f,f=G.creel[i],g=fishVal(f,f===S.demand?2:1);G.creel.splice(i,1);G.gold+=g;bump='gold';logL(`Sold ${an(FISH[f].n)} for ${g} gold.`);save();toast(`Sold ${an(FISH[f].n)} for ${g} gold`);port(id)});
  const sa=document.getElementById('sellall');if(sa)sa.onclick=()=>{const g=G.creel.reduce((a,f)=>a+fishVal(f,f===S.demand?2:1),0);G.creel=[];G.gold+=g;bump='gold';logL(`Sold my catch at ${n.name} for ${g} gold.`);save();toast(`Sold your catch for ${g} gold`);port(id)};
  app.querySelectorAll('[data-fit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.fit,k=S.fits[i],f=FITTINGS[k];
    if(G.gold<f.p)return toast(`Need ${f.p-G.gold} more gold`);
    if(!canEquip(k))return toast('Double Planking boards up a slot. Sell something to make room first.');
    G.gold-=f.p;const back=equip(k);S.fits[i]=null;bump='gold';save();toast(`Fitted ${f.n}${back?`. Sold the old one for ${back} gold`:''}`);port(id)});
  app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const n=b.dataset.r==='all'?repairable():1;
    if(n<1||G.gold<n*REPAIR)return toast(G.hull>=HULL_MAX?'The hull is already sound.':`Need ${n*REPAIR-G.gold} more gold`);
    G.gold-=n*REPAIR;G.hull+=n;bump='hull';logL(`Paid the shipwright ${n*REPAIR} gold to repair ${n} hull.`);save();toast(`Repaired ${n} hull`);port(id)});
  const yb=document.getElementById('yourship');if(yb)yb.onclick=shipSheet;
  save();coach('port');tip('port');tip('wright');
}
/* how much hull you can afford to repair, up to the most the shipwright will fix */
const repairable=()=>Math.max(0,Math.min(HULL_MAX-G.hull,Math.floor(G.gold/REPAIR)));
function wrightHTML(S){
  const all=repairable();
  return`<section class="wright"><div class="m-head"><h2 style="font-size:20px">Shipwright</h2><button class="ghost" id="yourship">Your ship</button></div>
    <div class="repair"><div><b>Hull ${G.hull}/${HULL_MAX}</b><span class="soft">Repairs cost ${REPAIR} gold a point.</span></div>
      ${G.hull<HULL_MAX?`<button class="buy" data-r="1" ${G.gold<REPAIR?'aria-disabled="true"':''}>Repair 1 for ${REPAIR}</button>${all>1?`<button class="buy" data-r="all">Repair ${all} for ${all*REPAIR}</button>`:''}`:'<span class="soft">Fully repaired</span>'}</div>
    <div class="offers fits">${S.fits.map((k,i)=>{if(!k)return`<div class="offer sold">Fitted</div>`;
      const f=FITTINGS[k],old=fitIn(f.spot),ok=canEquip(k);
      return`<div class="offer fit"><div class="o-top"><span class="o-icon plain">${fitGlyph(k)}</span><div><h3>${f.n}</h3><p class="o-meta">${SPOTS[f.spot]} fitting</p></div></div>
        <p class="o-desc">${f.d}${old?` <span class="soft">Replaces your ${FITTINGS[old].n}, which sells for ${Math.floor(FITTINGS[old].p/2)}.</span>`:''}${ok?'':' <b>Needs a free hold slot first.</b>'}</p>
        <button class="buy" data-fit="${i}" ${G.gold<f.p||!ok?'aria-disabled="true"':''}>Fit for ${f.p} gold</button></div>`}).join('')}</div></section>`;
}
