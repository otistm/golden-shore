/* Ink Crossing: Ports: market, fish market, dock visitors. */
"use strict";
/* ---------- port ---------- */
/* which part of the port you're looking at: the drawn harbour, or one of its buildings. Kept while you stay in the same port. */
let PV={id:null,view:'harbour'};
const BLD={market:'Market',tavern:'Tavern',wright:'Shipwright',docks:'Docks'};
function port(id,view){
  cancelAnimationFrame(raf);B=null;G.inPort=true;
  const n=node(id);
  if(!G.shops[id]){const r=RNG(G.seed,'shop',id,G.shopVisit||0);G.shops[id]={offers:Array.from({length:4},()=>randItem(r,depthOf(n))),reroll:1};
    // the first port of a voyage stocks your ship's own gear and hands, so a bare ship can always be outfitted for its style
    if(!G.tut&&G.sea===0&&id===G.map.start&&G.path.length===1){const sh=SHIPS[G.ship];sh.start.forEach((x,i)=>G.shops[id].offers[i]={k:x.k,t:x.t});
      const pool=Object.keys(CREW).filter(k=>!(sh.crew||[]).includes(k));G.shops[id].tavern=(sh.crew||[]).concat(pool[ri(r,pool.length)])}
    fresh=true;G.freeRoll=true;logL(`Docked at ${n.name}.`);
    const pool=Object.keys(FISH).filter(k=>FISH[k].sea===G.sea);G.shops[id].demand=pool[ri(r,pool.length)];
    const msg=[];
    if(G.quest==='letter'){G.quest=null;G.gold+=15;bump='gold';logL(`Delivered Wet Jack's letter at ${n.name}. His girl cried, then paid me 15 gold.`);msg.push('Delivered the letter: +15 gold')}
    const wg=payWages();if(wg)msg.push(wg);
    if(msg.length)setTimeout(()=>toast(msg.join('. ')),250)}
  const S=G.shops[id];
  if(view==null)view=PV.id===id?PV.view:(G.tut?'market':'harbour');PV={id,view,hx:PV.id===id?PV.hx:null,scroll:PV.id===id?PV.scroll:null};
  if(G.sel==null)G.moving=false;
  const anim=fresh;fresh=false;
  const vis=!G.hock&&n.row===0&&G.sea<=1?'hock':n.visitor;
  if(G.tut&&id!==900)n.visitor=null;
  const ups=new Set();S.offers.forEach(o=>{if(!o)return;const j=matchIdx(o);if(j>=0)ups.add(j)});
  // the shipwright's two fittings for this visit, seeded like the first market offers
  if(!G.tut&&!S.fits){const r=RNG(G.seed,'wright',id,G.shopVisit||0),pool=Object.keys(FITTINGS).filter(k=>!hasF(k));S.fits=[];
    while(S.fits.length<(hasP('wright')?3:2)&&pool.length)S.fits.push(pool.splice(ri(r,pool.length),1)[0])}
  const rr=S.reroll+(hasF('lion')?1:0);
  // the tavern's hires for this visit, seeded like the market
  if(!G.tut&&!S.tavern){const r=RNG(G.seed,'tavern',id,G.shopVisit||0),pool=Object.keys(CREW).filter(k=>!(G.crew||[]).some(c=>c.k===k));S.tavern=[];
    while(S.tavern.length<(hasP('recruiter')?4:3)&&pool.length)S.tavern.push(pool.splice(ri(r,pool.length),1)[0])}
  const marketH=`  <section>
    <div class="m-head"><h2 style="font-size:20px">Port market</h2><button class="ghost" id="reroll">${hasC('route')&&G.freeRoll?'Free reroll':`Reroll for ${rr}`}</button></div>
    <div class="offers">${S.offers.map((o,i)=>{
      if(!o)return`<div class="offer sold">Sold</div>`;
      const d=DEFS[o.k],p=buyP(o),up=!!findMatch(o);
      return`<div class="offer${anim?' in':''}" style="animation-delay:${i*70}ms"><button class="o-top" data-v="${i}" style="background:none;border:0;padding:0;text-align:left"><span class="o-icon t${o.t}">${emb(o.k)}${icon(o.k)}${up?CHEV:''}</span><div><h3>${d.n}</h3><p class="o-meta"><span class="tierword">${TIER[o.t]}</span>, size ${d.s}${d.cd?`, ${d.cd}s`:''}</p></div></button><p class="o-desc">${describe([o],0).L.join(' ')}</p><button class="buy${up?' up':''}" data-b="${i}" ${G.gold<p?'aria-disabled="true"':''}>${up?'Upgrade':'Buy'} for ${p} gold</button></div>`}).join('')}</div>
  </section>
`;
  const docksH=`  ${vis&&!S.talked?`<button class="visitor" id="visitor">${portrait(NPCS[vis].look)}<div><span class="soft">On the dock: ${NPCS[vis].role.toLowerCase()}</span><b>${NPCS[vis].n}</b></div><span class="talk">Talk</span></button>`:''}
  ${G.hock==='active'?`<button class="visitor quest" id="hockin">${portrait(NPCS.hock.look)}<div><span class="soft">Quest: three fish for Hock</span><b>Hock is on the dock</b></div><span class="talk">Talk</span></button>`:''}
  ${G.creel.length?`<section class="market"><div class="m-head"><h2 style="font-size:20px">Fish market</h2><button class="ghost" id="sellall">Sell all for ${G.creel.reduce((a,f)=>a+fishVal(f,f===S.demand?2:1),0)}</button></div>
    ${S.demand?`<p class="soft" style="margin:-4px 0 8px">Paying double for ${FISH[S.demand].n} today.</p>`:''}
    <div class="fishlist">${G.creel.map((f,i)=>`<div class="fishrow">${fishSVG(f)}<div><b>${FISH[f].n}</b><span class="soft">${RAR[FISH[f].rar]}${f===S.demand?', in demand':''}</span></div><button class="buy" data-f="${i}">Sell ${fishVal(f,f===S.demand?2:1)}</button></div>`).join('')}</div></section>`:''}
`;
  const info=harbourInfo(S,vis);
  const page=view==='harbour'?`${harbourScene(info)}<p class="tapnote">Tap a place to go in. Swipe or use the arrows to walk along the quay.</p>`
    :`<nav class="bldnav" aria-label="Port">${Object.entries(BLD).map(([k,t])=>`<button class="bldtab${k===view?' on':''}" data-bld="${k}"${k===view?' aria-current="page"':''}>${t}${info[k].badge?`<span class="bdg">${info[k].badge}</span>`:''}</button>`).join('')}<button class="bldtab back" data-bld="harbour">Harbour</button></nav>
      ${view==='market'?marketH:view==='tavern'?(G.tut?'':tavernHTML(S)):view==='wright'?(G.tut?'':wrightHTML(S)):(docksH.trim()?docksH:'<p class="soft dockempty">Nobody is on the dock today, and you have no fish to sell.</p>')}`;
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>${n.name}</h2><span>${SEAS[G.sea]}</span></div>
  ${page}
  ${holdDock(`<button class="primary" id="leave">Set sail</button>`,ups,lockerUps(S.offers))}`;
  bindBar();bindHold('port',()=>port(id,view));fitDock();
  const rb=document.getElementById('reroll');if(rb)rb.onclick=()=>{
    if(hasC('route')&&G.freeRoll){G.freeRoll=false}
    else{if(G.gold<rr)return toast(`Need ${rr-G.gold} more gold`);G.gold-=rr;S.reroll++;bump='gold'}
    S.offers=Array.from({length:4},()=>randItem(Math.random,depthOf(n)));fresh=true;save();port(id,view)};
  app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>itemSheet([S.offers[+b.dataset.v]],0,'view',()=>{}));
  app.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const i=+b.dataset.b,o=S.offers[i],p=buyP(o);
    if(G.gold<p)return toast(`Need ${p-G.gold} more gold`);
    const m=findMatch(o),r=addItem(o);if(!r)return toast(`No room for size ${DEFS[o.k].s}${G.locker?' in your hold or locker':''}. Sell something first.`);
    if(r==='up')toast(`${DEFS[o.k].n} upgraded to ${TIER[m.list[m.i].t]}`);
    if(r==='locker')toast(`Hold full. Stowed the ${DEFS[o.k].n} in your locker.`);
    G.gold-=p;S.offers[i]=null;bump='gold';save();port(id,view);coach('bought')});
  document.getElementById('leave').onclick=()=>{G.moving=false;G.sel=null;if(G.tut&&G.tut.i>=TUT.length-1)return finishTutorial();
    const bare=!G.tut&&(!G.board.length||!(G.crew||[]).length);if(!bare)return chart();
    const ov=overlay(`<h2>Sail like this?</h2><p>${!G.board.length&&!(G.crew||[]).length?'Your hold is empty and nobody is aboard.':!G.board.length?'Your hold is empty. Nothing will fire in a fight.':'Nobody is aboard to work your cargo, so none of it will fire in a fight.'}</p>
      <div class="sh-actions"><button class="ghost" data-a="stay">Stay in port</button><button class="primary" data-a="go">Set sail</button></div>`,true);
    ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')chart()})};
  const vb=document.getElementById('visitor');if(vb)vb.onclick=()=>talk(vis,id+'v',()=>port(id,view),()=>{S.talked=true});
  const hb=document.getElementById('hockin');if(hb)hb.onclick=()=>talk('hock2',id+'h',()=>port(id,view));
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const i=+b.dataset.f,f=G.creel[i],g=fishVal(f,f===S.demand?2:1);G.creel.splice(i,1);G.gold+=g;bump='gold';logL(`Sold ${an(FISH[f].n)} for ${g} gold.`);save();toast(`Sold ${an(FISH[f].n)} for ${g} gold`);port(id,view)});
  const sa=document.getElementById('sellall');if(sa)sa.onclick=()=>{const g=G.creel.reduce((a,f)=>a+fishVal(f,f===S.demand?2:1),0);G.creel=[];G.gold+=g;bump='gold';logL(`Sold my catch at ${n.name} for ${g} gold.`);save();toast(`Sold your catch for ${g} gold`);port(id,view)};
  app.querySelectorAll('[data-fit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.fit,k=S.fits[i],f=FITTINGS[k];
    if(G.gold<f.p)return toast(`Need ${f.p-G.gold} more gold`);
    if(!canEquip(k))return toast('Double Planking boards up a slot. Sell something to make room first.');
    G.gold-=f.p;const back=equip(k);S.fits[i]=null;bump='gold';save();toast(`Fitted ${f.n}${back?`. Sold the old one for ${back} gold`:''}`);port(id,view)});
  app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const n=b.dataset.r==='all'?repairable():1;
    if(n<1||G.gold<n*repairCost())return toast(G.hull>=HULL_MAX?'The hull is already sound.':`Need ${n*repairCost()-G.gold} more gold`);
    G.gold-=n*repairCost();G.hull+=n;bump='hull';logL(`Paid the shipwright ${n*repairCost()} gold to repair ${n} hull.`);save();toast(`Repaired ${n} hull`);port(id,view)});
  const yb=document.getElementById('yourship');if(yb)yb.onclick=shipSheet;const yc=document.getElementById('yourcrew');if(yc)yc.onclick=shipSheet;
  app.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const i=+b.dataset.hire,k=S.tavern[i],C=CREW[k];
    if((G.crew||[]).length>=berths())return toast('Your deck is full. Dismiss someone on the ship card first.');
    if(G.gold<feeOf(k))return toast(`Need ${feeOf(k)-G.gold} more gold`);
    G.gold-=feeOf(k);hire(k);S.tavern[i]=null;bump='gold';save();toast(`${C.n} joins the crew`);port(id,view)});
  if(view==='harbour')bindHarbour();
  app.querySelectorAll('[data-bld]').forEach(b=>{const go=()=>port(id,b.dataset.bld);b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  if(view!=='harbour'&&PV.scroll!==view){PV.scroll=view;scrollTo(0,0)}
  save();coach('port');tip('port');tip('crew');tip('wright');
}
function tavernHTML(S){const full=(G.crew||[]).length>=berths();
  return`<section class="tavern"><div class="m-head"><h2 style="font-size:20px">Tavern <span class="soft">deck ${(G.crew||[]).length}/${berths()}</span></h2><button class="ghost" id="yourcrew">Your crew</button></div>
    <div class="offers hires">${S.tavern.map((k,i)=>{if(!k)return`<div class="offer sold">Hired</div>`;const C=CREW[k];
      return`<div class="offer hire"><div class="o-top"><span class="o-icon crewic">${icon(k)}</span><div><h3>${C.n}</h3><p class="o-meta">${crewCrafts1(k)}</p></div></div>
        <p class="o-desc">Lets your cargo use ${C.crafts.map(c=>`<b>${CRAFTS[c]}</b>: ${CRAFTD[c]}`).join('. ')}. Wage ${wageOf(k)} gold at each port.</p>
        <button class="buy" data-hire="${i}" ${full||G.gold<feeOf(k)?'aria-disabled="true"':''}>${full?'Deck full':`Hire for ${feeOf(k)} gold`}</button></div>`}).join('')}</div></section>`}
const buyP=o=>Math.max(1,price(o.k,o.t)-(hasP('haggler')?1:0));
/* what each building has for you right now: a badge and a few words for screen readers */
function harbourInfo(S,vis){const n=S.offers.filter(Boolean).length,h=(S.tavern||[]).filter(Boolean).length,f=(S.fits||[]).filter(Boolean).length,hurt=G.hull<HULL_MAX,
  who=(vis&&!S.talked)||G.hock==='active';
  return{market:{badge:n||'',say:`${n} for sale`,n},tavern:{badge:G.tut?'':h||'',say:G.tut?'closed':`${h} for hire`,h:G.tut?0:h},
    wright:{badge:G.tut?'':hurt?'!':f||'',say:G.tut?'closed':`${f} fittings${hurt?', hull needs repair':''}`,f:G.tut?0:f},
    docks:{badge:who?'!':G.creel.length||'',say:`${who?'someone is waiting':'nobody waiting'}${G.creel.length?`, ${G.creel.length} fish to sell`:''}`,who,fish:G.creel.length}}}
/* how much hull you can afford to repair, up to the most the shipwright will fix */
const repairable=()=>Math.max(0,Math.min(HULL_MAX-G.hull,Math.floor(G.gold/repairCost())));
function wrightHTML(S){
  const all=repairable();
  return`<section class="wright"><div class="m-head"><h2 style="font-size:20px">Shipwright</h2><button class="ghost" id="yourship">Your ship</button></div>
    <div class="repair"><div><b>Hull ${G.hull}/${HULL_MAX}</b><span class="soft">Repairs cost ${repairCost()} gold a point.</span></div>
      ${G.hull<HULL_MAX?`<button class="buy" data-r="1" ${G.gold<repairCost()?'aria-disabled="true"':''}>Repair 1 for ${repairCost()}</button>${all>1?`<button class="buy" data-r="all">Repair ${all} for ${all*repairCost()}</button>`:''}`:'<span class="soft">Fully repaired</span>'}</div>
    <div class="offers fits">${S.fits.map((k,i)=>{if(!k)return`<div class="offer sold">Fitted</div>`;
      const f=FITTINGS[k],old=fitIn(f.spot),ok=canEquip(k);
      return`<div class="offer fit"><div class="o-top"><span class="o-icon plain">${fitGlyph(k)}</span><div><h3>${f.n}</h3><p class="o-meta">${SPOTS[f.spot]} fitting</p></div></div>
        <p class="o-desc">${f.d}${old?` <span class="soft">Replaces your ${FITTINGS[old].n}, which sells for ${Math.floor(FITTINGS[old].p/2)}.</span>`:''}${ok?'':' <b>Needs a free hold slot first.</b>'}</p>
        <button class="buy" data-fit="${i}" ${G.gold<f.p||!ok?'aria-disabled="true"':''}>Fit for ${f.p} gold</button></div>`}).join('')}</div></section>`;
}
