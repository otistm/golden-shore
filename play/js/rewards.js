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
function lootPick(n,done){
  const r=RNG(G.seed,'loot',n.id),depth=depthOf(n)+2,opts=[randItem(r,depth),randItem(r,depth),randItem(r,depth)],gold=4+G.sea*2;
  const ov=overlay(`<h2>Spoils</h2><p class="soft">Take one piece of their cargo.</p><div class="picks">${opts.map((o,i)=>{
    const d=DEFS[o.k],up=!!findMatch(o),can=fits(o);
    return`<button class="pick" data-l="${i}" ${can?'':'disabled'}><span class="pi t${o.t}">${icon(o.k)}${up?CHEV:''}</span><div><b>${TIER[o.t]} ${d.n}${up?', upgrades yours':''}</b><span class="d">${can?describe([o],0).L.join(' '):G.locker?'No room in your hold or locker.':'No room in your hold.'}</span></div></button>`}).join('')}</div>
    <button class="ghost" data-l="gold">Take ${gold} gold instead</button>`,true);
  ov.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{if(b.disabled)return;ov.remove();
    if(b.dataset.l==='gold'){G.gold+=gold;bump='gold';logL(`Took ${gold} gold as spoils.`)}
    else{const o=opts[+b.dataset.l];addItem(o);logL(`Took a ${TIER[o.t]} ${DEFS[o.k].n} as spoils.`)}
    save();coach('spoilsTaken');done()});
  (ov.querySelector('.pick:not([disabled])')||ov.querySelector('.ghost')).focus();coach('spoils');
}
