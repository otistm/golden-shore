/* Ink Crossing: Events, spoils and landmark picks. */
"use strict";
/* ---------- events, loot, landmarks ---------- */
function eventAt(n){
  chart();const ev=EVENTS[n.ev];
  const ov=overlay(`<h2>${ev.t}</h2><p class="log">${ev.x}</p><div class="picks">${ev.o.map((o,i)=>{const ok=!o.need||o.need();return`<button class="opt" data-o="${i}" ${ok?'':'disabled'}><b>${o.l}</b><span>${o.d}</span></button>`}).join('')}</div>`,true);
  ov.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{if(b.disabled)return;ov.remove();
    const res=ev.o[+b.dataset.o].f(RNG(G.seed,'ev',n.id,b.dataset.o));
    if(res&&res.chart){logL(res.msg);chartPick(RNG(G.seed,'cache',n.id),res.msg,after);return}
    if(res&&res.fish){logL(res.msg);save();fishing(n.id+'e',res.fish,after);return}
    logL(res);toast(res);after()});
  function after(){if(G.hull<=0)return sink();save();chart()}
  (ov.querySelector('[data-o]:not([disabled])')||ov.querySelector('button')).focus();
}
function chartPick(r,lead,done){
  const taken=G.charts.map(c=>c.k),pool=Object.keys(CHARTS).filter(k=>!taken.includes(k)),opts=[];
  while(opts.length<2&&pool.length)opts.push(pool.splice(ri(r,pool.length),1)[0]);
  if(!opts.length){toast('Every landmark is already on your chart.');return done()}
  const ov=overlay(`<h2>Draw a landmark</h2><p class="soft">${lead} Pick one to add to your chart. It lasts the whole voyage.</p><div class="picks">${opts.map(k=>`<button class="pick" data-k="${k}"><span class="pi plain">${glyph(k)}</span><div><b>${CHARTS[k].n}</b><span class="d">${CHARTS[k].d}</span></div></button>`).join('')}</div>`,true);
  ov.querySelectorAll('.pick').forEach(b=>b.onclick=()=>{const k=b.dataset.k;ov.remove();
    G.charts.push({k,sea:G.sea,at:G.at});A.charts[k]=1;saveA();
    if(k==='harbour')G.hull+=5;if(k==='pearl')G.gold+=10;if(k==='buoy')updateReveal();
    let msg=`Charted ${CHARTS[k].n}.`;
    if(k==='wreck')msg+=' '+addOrGold(randItem(r,depthOf(node(G.at))+4),'Salvaged');
    logL(msg);toast(msg);save();coach('landmark');done()});
  ov.querySelector('.pick').focus();coach('landmarkOpen');
}
/* why a spoil doesn't fit yet, and how many slots selling would need to free */
function roomNote(o){const sz=DEFS[o.k].s,need=Math.min(sz-(10-used(G.board)),G.locker?sz-(LOCK-used(G.locker)):99);
  return`Size ${sz}. Free ${need} more slot${need===1?'':'s'}${G.locker?' in your hold or locker':''} to take it.`}
/* Spoils: a screen like the market, with your hold docked below. Drag a spoil into the hold (or tap Take), drag it back onto its card
   to change your mind, and drag your own cargo onto Sail on to sell it and make room. One pick, or gold if you take nothing. */
function lootPick(n,done){
  const r=RNG(G.seed,'loot',n.id),depth=depthOf(n)+2,opts=[randItem(r,depth),randItem(r,depth),randItem(r,depth)],gold=4+G.sea*2;
  cancelAnimationFrame(raf);B=null;G.inPort=false;G.moving=false;G.sel=null;
  let taken=null,ref=null,kind=null,first=true;   // which spoil, the item object it became, and 'add', 'locker' or 'up'
  const aboard=()=>ref&&(G.board.includes(ref)||(G.locker||[]).includes(ref));
  const canBack=()=>taken!=null&&kind!=='up'&&aboard();
  const take=(i,tgt,dst)=>{const o=opts[i];
    if(findMatch(o)){addItem(o);kind='up';ref=null}
    else if(tgt){ref={k:o.k,t:o.t};tgt.list.splice(dst,0,ref);seen(o.k);kind=tgt.side==='l'?'locker':'add'}
    else{kind=addItem(o);if(!kind)return toast(`No room for size ${DEFS[o.k].s}. Sell something first.`);ref=kind==='up'?null:(kind==='locker'?G.locker:G.board).slice(-1)[0]}
    taken=i;save();return tgt&&kind!=='up'?dst:null};
  const putBack=()=>{for(const l of [G.board,G.locker||[]]){const k=l.indexOf(ref);if(k>=0)l.splice(k,1)}taken=ref=kind=null;save()};
  const render=()=>{
    const ups=new Set();let lups=new Set();
    if(taken==null){opts.forEach(o=>{const j=matchIdx(o);if(j>=0)ups.add(j)});lups=lockerUps(opts)}
    app.innerHTML=`${barHTML()}<div class="seahead"><h2>Spoils</h2><span>${taken==null?'Take one piece of their cargo':'One piece taken'}</span></div>
      <div class="offers spoils">${opts.map((o,i)=>{const d=DEFS[o.k],up=!!findMatch(o),can=fits(o);
        const top=`<button class="o-top" data-v="${i}" style="background:none;border:0;padding:0;text-align:left"><span class="o-icon t${o.t}">${emb(o.k)}${icon(o.k)}${up&&taken==null?CHEV:''}</span><div><h3>${d.n}</h3><p class="o-meta"><span class="tierword">${TIER[o.t]}</span>, size ${d.s}${d.cd?`, ${d.cd}s`:''}</p></div></button>`;
        if(taken===i)return`<div class="offer spoil taken" data-sp="${i}">${top}<p class="o-desc">${kind==='up'?'Upgraded yours.':canBack()?'In your hold. Drag it back here to change your mind.':'Taken.'}</p>${canBack()?`<button class="buy up" data-back>Put back</button>`:''}</div>`;
        if(taken!=null)return`<div class="offer spoil left" data-sp="${i}">${top}<p class="o-desc">You can only take one.</p></div>`;
        return`<div class="offer spoil${first?' in':''}" data-sp="${i}" style="animation-delay:${i*70}ms">${top}<p class="o-desc">${can?describe([o],0).L.join(' '):roomNote(o)}</p><button class="buy${up?' up':''}" data-take="${i}" ${can?'':'aria-disabled="true"'}>${up?'Take and upgrade':'Take'}</button></div>`}).join('')}</div>
      ${holdDock(`<button class="primary" id="sailon">${taken==null?`Take ${gold} gold and sail on`:'Sail on'}</button>`,ups,lups,
        taken==null?'Drag a spoil into your hold. Drag your own cargo onto the button below to sell it.':'Drag your cargo to rearrange, or onto Sail on to sell.')}`;
    first=false;
    bindBar();fitDock();
    const cards=[...app.querySelectorAll('.spoil')];
    bindHold('spoils',render,{
      from:taken==null?cards.map((el,i)=>({el,it:opts[i],drop:(tgt,dst)=>take(i,tgt,dst)})):[],
      back:canBack()?{el:cards[taken],ok:it=>it===ref,put:putBack}:null});
    app.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{if(!dragJustEnded)itemSheet([opts[+b.dataset.v]],0,'view',()=>{})});
    app.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;const i=+b.dataset.take;
      if(!fits(opts[i]))return toast(roomNote(opts[i]));take(i);render()});
    const pb=app.querySelector('[data-back]');if(pb)pb.onclick=()=>{putBack();render()};
    document.getElementById('sailon').onclick=()=>{
      if(taken==null){G.gold+=gold;bump='gold';logL(`Took ${gold} gold as spoils.`)}
      else{const o=opts[taken];logL(`Took a ${TIER[o.t]} ${DEFS[o.k].n} as spoils.`)}
      save();coach('spoilsTaken');done()};
  };
  render();scrollTo(0,0);coach('spoils');
}
