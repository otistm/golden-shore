/* Ink Crossing: Fights: setup, effects engine (applyFx, emit), the step loop, HP bars and results, next sea and endings. */
"use strict";
/* ---------- battle ---------- */
function mkSide(name,max,list,traits,sea){const b=sideOf(list);
  return{name,max:max+b.hp,hp:max+b.hp,shield:0,burn:0,poison:0,list,regen:b.regen,gold:b.gold,sea,lowDone:false,risen:false,traits:traits.map(k=>({k,t:0})),
    items:list.map((it,i)=>({k:it.k,t:it.t,s:statsOf(list,i),c:0,h:0,sl:0,g:{},lt:{},el:null}))}}
const hasT=(S,k)=>S.traits.some(x=>x.k===k);
function fighterHTML(S,k){return`<div class="fighter ${k}" id="${k}f" ${k==='e'?'role="button" tabindex="0"':''}><div class="who"><span class="name">${S.name}</span><span class="num" id="${k}hp"></span></div><div class="hpwrap"><div class="hpbar"><div class="lag" id="${k}lag"></div><div class="hp" id="${k}hpf"></div><div class="inc burnseg" id="${k}bs"></div><div class="inc poiseg" id="${k}ps"></div><div class="sh" id="${k}shf"></div></div><div class="chips" id="${k}st" aria-live="off"></div></div><p class="traits">${S.traits.map(t=>TRAITS[t.k].n).join(', ')}${k==='e'?' <span>Tap to read.</span>':''}</p></div>`}
function fight(n){
  app.style.paddingBottom='';
  const f=enemyOf(n),depth=f.depth,sh=SHIPS[G.ship],spd=window._spd||1;
  const pMax=sh.hp+depth*10+(sh.trait==='bulwark'?40:0)+(hasC('coral')?25:0)+(G.tut?120:0);
  A.met[n.enemy]=1;saveA();
  B={t:0,wait:.9,speed:spd,over:false,quiet:false,bt:0,pt:0,st:0,storm:0,node:n,bell:BELL+(hasC('calm')?6:0),
     P:mkSide(sh.n,pMax,G.board.map(x=>({...x})),[sh.trait],G.sea),E:mkSide('The '+f.e.n,f.hp,f.list,f.e.traits,G.sea)};
  const P=B.P,E=B.E;
  for(const S of [P,E])S.items.forEach(it=>{if(it.s.cd)it.c=it.s.cd*it.s.pre});
  if(hasT(P,'bulwark'))P.shield+=15;if(hasC('light'))P.shield+=20;
  P.items.forEach(it=>{if(!it.s.cd)return;if(hasC('whale'))it.s.cd=Math.round(it.s.cd*9)/10;if(hasC('current'))it.c=Math.max(it.c,it.s.cd*.25)});
  if(hasT(E,'smoke'))P.items.forEach(it=>it.sl=3);
  if(hasT(E,'rush'))E.items.forEach(it=>it.h=Math.max(it.h,4));
  if(hasT(E,'fire'))P.burn+=TRAITS.fire.x(G.sea);
  if(hasT(E,'whirl'))B.bell-=8;
  app.innerHTML=`${barHTML()}<section class="battle">
    ${fighterHTML(E,'e')}${boardHTML(E.list,'e')}
    <div class="mid"><span class="clock" id="clock"></span><div class="speed">${[1,2,4].map(v=>`<button data-sp="${v}" aria-pressed="${B.speed===v}">${v}×</button>`).join('')}<button id="skip">Skip</button></div></div>
    ${boardHTML(P.list,'p')}${fighterHTML(P,'p')}
    <p class="tip">Tap any item to see what it does.</p></section>`;
  bindBar();
  for(const[S,k]of[[P,'p'],[E,'e']]){
    const els=app.querySelectorAll(`.board[data-side="${k}"] .item`);
    S.items.forEach((it,i)=>{it.el=els[i];els[i].onclick=()=>itemSheet(S.list,i,'view',()=>{})});
    S.fel=document.getElementById(k+'f');
    S.ui={lag:document.getElementById(k+'lag'),bs:document.getElementById(k+'bs'),ps:document.getElementById(k+'ps'),hp:document.getElementById(k+'hp'),hpf:document.getElementById(k+'hpf'),shf:document.getElementById(k+'shf'),st:document.getElementById(k+'st')};
  }
  B.wait=.9;startFx();
  E.fel.onclick=()=>{const ov=overlay(`<h2>${E.name}</h2>${traitsHTML(f.e,G.sea)}<button class="primary" data-a="c">Close</button>`);ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()})};
  app.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{B.speed=window._spd=+b.dataset.sp;app.querySelectorAll('[data-sp]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  document.getElementById('skip').onclick=()=>{if(B.over)return;B.quiet=true;let k=0;while(!B.over&&k++<30000)step(.05);draw()};
  draw();last=performance.now();raf=requestAnimationFrame(loop);scrollTo(0,0);coach('fight');
}
/* "when a fight starts" effects, both sides */
function startFx(){for(const[S,F]of[[B.P,B.E],[B.E,B.P]])S.items.forEach((it,i)=>{if(it.s.start)applyFx(S,F,it,i,it.s.start,1)})}
function loop(now){if(!B)return;let dt=Math.min(.1,(now-last)/1000)*B.speed;last=now;if(B.coachHold)dt=0;
  while(dt>1e-6&&!B.over){const s=Math.min(.05,dt);step(s);dt-=s}draw();if(!B.over)raf=requestAnimationFrame(loop)}
function hit(T,d,type,src,o){o=o||{};
  if(o.weapon&&hasT(T,'thick'))d*=.75;d=Math.round(d);if(d<=0)return;
  const pierce=o.pierce||(src&&hasT(src,'pierce'));const a=pierce?0:Math.min(T.shield,d);T.shield-=a;T.hp-=d-a;
  pop(T.fel,(type==='crit'?'Crit! ':'')+'−'+d,type==='burn'||type==='storm'?'soft':type);
  if(type==='dmg'||type==='crit'){squish(T.fel,'hit');if(o.weapon&&src)emit(T,src,'hurt',null,(o.depth||0))}
  if(!T.lowDone&&T.hp>0&&T.hp<T.max/2){T.lowDone=true;emit(T,src||(T===B.P?B.E:B.P),'lowhp',null,0)}
}
const rnd=(arr,n)=>{const p=arr.filter(x=>x.s.cd),o=[];for(let k=0;k<n&&p.length;k++)o.push(p.splice(R(p.length),1)[0]);return o};
function targets(S,i,tgt){const L=S.items;
  if(tgt==='adj')return[L[i-1],L[i+1]].filter(Boolean);
  if(tgt==='left')return L[i-1]?[L[i-1]]:[];if(tgt==='right')return L[i+1]?[L[i+1]]:[];
  if(tgt==='self')return[L[i]];if(tgt==='all')return L.slice();
  if(tgt==='rand1')return rnd(L.filter((x,j)=>j!==i),1);if(tgt==='rand2')return rnd(L.filter((x,j)=>j!==i),2);
  if(tgt.startsWith('tag:')){const t=tgt.slice(4);return L.filter((x,j)=>j!==i&&DEFS[x.k].tags.includes(t))}
  return[]}
function xVal(S,F,x){if(!x)return 0;const[from,r]=x;
  if(from==='shield')return S.shield*r;if(from==='enemyBurn')return F.burn*r;if(from==='enemyPoison')return F.poison*r;
  if(from==='missing')return(S.max-S.hp)*r;if(from==='empty')return(10-used(S.list))*r;
  if(from.startsWith('tag:'))return S.list.filter(o=>DEFS[o.k].tags.includes(from.slice(4))).length*r;return 0}
function applyFx(S,F,it,i,f,depth){
  const g=it.g,el=it.el;
  if(f.dmg!=null||f.dmgX){const base=(f.dmg||0)+(g.dmg||0)+xVal(S,F,f.dmgX),W=DEFS[it.k].tags.includes('W');
    for(let k=0;k<(f.multi||1);k++){let d=base;const c=f.crit&&Math.random()<f.crit;if(c)d*=2;
      hit(F,d,c?'crit':'dmg',S,{pierce:f.pierce,weapon:W,depth});
      if(f.burnPerHit)burnOn(S,F,f.burnPerHit,it,depth);if(f.poisonPerHit)poisonOn(S,F,f.poisonPerHit,it,depth);
      if(hasT(S,'coil')&&W)F.poison+=1;if(c)emit(S,F,'crit',it,depth)}}
  const sh=(f.shield||0)+(g.shield||0)+Math.round(xVal(S,F,f.shieldX));
  if((f.shield!=null||f.shieldX)&&sh>0){S.shield+=sh;pop(el||S.fel,'+'+sh+' shield','shield');emit(S,F,'shield',it,depth)}
  const hl=(f.heal||0)+(g.heal||0)+Math.round(xVal(S,F,f.healX));
  if((f.heal!=null||f.healX)&&hl>0){S.hp=Math.min(S.max,S.hp+hl);if(S.burn)S.burn--;if(hasT(S,'lotus'))S.shield+=Math.round(hl/3);pop(el||S.fel,'+'+hl,'heal');emit(S,F,'heal',it,depth)}
  if(f.cleanse)S.poison=0;
  if(f.douse){S.burn=Math.max(0,S.burn-f.douse);S.poison=Math.max(0,S.poison-Math.ceil(f.douse/2))}
  if(f.burn)burnOn(S,F,f.burn+(g.burn||0),it,depth);
  if(f.poison)poisonOn(S,F,f.poison+(g.poison||0),it,depth);
  if(f.slow){rnd(F.items,f.slow[0]).forEach(x=>{x.sl=Math.max(x.sl,f.slow[1]);if(x.el&&!B.quiet)squish(x.el,'hit')});pop(el||S.fel,'Slow','shield')}
  if(f.haste){const ts=targets(S,i,f.haste[0]).filter(x=>x.s.cd);ts.forEach(x=>x.h=Math.max(x.h,f.haste[1]));if(ts.length){pop(el||S.fel,'Haste','haste');emit(S,F,'haste',it,depth)}}
  if(f.charge){targets(S,i,f.charge[0]).filter(x=>x.s.cd).forEach(x=>{x.c=Math.min(x.s.cd,x.c+f.charge[1]);if(x.el&&!B.quiet)squish(x.el,'proc')})}
  if(f.selfDmg){S.hp-=f.selfDmg;pop(S.fel,'−'+f.selfDmg,'soft')}
  if(f.grow)for(const k in f.grow)g[k]=(g[k]||0)+f.grow[k];
}
function burnOn(S,F,n,it,depth){const b=n+(hasT(S,'kindle')?1:0);F.burn+=b;pop(it&&it.el||S.fel,'Burn '+b);emit(S,F,'burn',it,depth)}
function poisonOn(S,F,n,it,depth){F.poison+=n;pop(it&&it.el||S.fel,'Poison '+n);emit(S,F,'poison',it,depth)}
/* reactions: items listening for things that happen on their own side */
function emit(S,F,ev,src,depth){
  if(depth>3||!S.items)return;
  S.items.forEach((x,j)=>{if(!x.s.on.length)return;x.s.on.forEach(h=>{
    if(h.ev!==ev)return;
    if(ev==='use'&&(x===src||!src||(h.tag&&!DEFS[src.k].tags.includes(h.tag))))return;
    if(ev==='adjUse'&&(!src||Math.abs(S.items.indexOf(src)-j)!==1))return;
    const key=ev+(h.tag||''),icd=h.icd!=null?h.icd:.3;
    if(ev!=='lowhp'&&x.lt[key]!=null&&B.t-x.lt[key]<icd)return;x.lt[key]=B.t;
    if(x.el&&!B.quiet)squish(x.el,'proc');
    applyFx(S,F,x,j,h,depth+1)})})}
function act(k,S,F){const T=TRAITS[k],x=T.x?T.x(S.sea):0;
  if(k==='peck')hit(F,x,'dmg',S);
  if(k==='volley'){pop(S.fel,'Broadside!');hit(F,x,'dmg',S)}
  if(k==='haunt')S.hp=Math.min(S.max,S.hp+S.max*.01);
  if(k==='armor'){S.shield+=x;pop(S.fel,'+'+x+' shield','shield')}
  if(k==='song'){rnd(F.items,2).forEach(i=>i.sl=Math.max(i.sl,2));pop(S.fel,'Siren song','shield')}
  if(k==='flock')rnd(S.items,1).forEach(i=>i.h=Math.max(i.h,2));
  if(k==='captain'){rnd(S.items,2).forEach(i=>i.h=Math.max(i.h,2));pop(S.fel,"Captain's orders",'haste')}
  if(k==='constrict'){rnd(F.items,3).forEach(i=>i.sl=Math.max(i.sl,2));pop(S.fel,'Constrict','shield')}
  if(k==='tentacles'){pop(S.fel,'Tentacles!');hit(F,x,'dmg',S);rnd(F.items,2).forEach(i=>i.sl=Math.max(i.sl,2))}
}
function fire(S,F,it,i){
  squish(it.el,'fire');
  applyFx(S,F,it,i,it.s.fx,0);
  emit(S,F,'use',it,0);emit(S,F,'adjUse',it,0);
}
function step(dt){
  if(B.wait>0){B.wait-=dt;return}
  B.t+=dt;
  for(const[S,F]of[[B.P,B.E],[B.E,B.P]]){
    S.items.forEach((it,i)=>{if(!it.s.cd)return;let r=1;
      if(it.h>0){r*=2;it.h-=dt}if(it.sl>0){r*=.5;it.sl-=dt}
      if(hasT(S,'swift'))r*=1.15;if(hasT(S,'frenzy')&&S.hp<S.max/2)r*=1.5;
      it.c+=dt*r;if(it.c>=it.s.cd){it.c-=it.s.cd;fire(S,F,it,i)}});
    S.traits.forEach(tr=>{const T=TRAITS[tr.k];if(!T.every)return;tr.t+=dt;if(tr.t>=T.every){tr.t-=T.every;act(tr.k,S,F)}});
  }
  B.bt+=dt;if(B.bt>=.5){B.bt-=.5;for(const S of[B.P,B.E])if(S.burn>0){hit(S,S.burn,'burn');S.burn--;tick(S,'bu')}}
  B.pt+=dt;if(B.pt>=1){B.pt-=1;for(const S of[B.P,B.E]){if(S.poison>0){S.hp-=S.poison;pop(S.fel,'−'+S.poison,'soft');tick(S,'po')}if(S.regen&&S.hp>0){S.hp=Math.min(S.max,S.hp+S.regen)}}}
  if(B.t>=B.bell){B.st+=dt;if(B.st>=.5){B.st-=.5;B.storm++;hit(B.P,B.storm,'storm');hit(B.E,B.storm,'storm')}}
  for(const S of[B.P,B.E])if(S.hp<=0&&hasT(S,'undying')&&!S.risen){S.risen=true;S.hp=S.max*.3;S.burn=0;S.poison=0;pop(S.fel,'It rises!')}
  if(B.P.hp<=0||B.E.hp<=0)end(B.E.hp<=0&&B.P.hp>0);
}
function draw(){
  for(const S of[B.P,B.E]){const hp=Math.max(0,S.hp),pc=v=>Math.max(0,Math.min(100,v/S.max*100))+'%';
    S.ui.hpf.style.width=pc(hp);S.ui.shf.style.width=pc(S.shield);
    if(S.lagv==null||hp>=S.lagv){S.ui.lag.classList.add('snap');S.lagv=hp;S.ui.lag.style.width=pc(hp);void S.ui.lag.offsetWidth;S.ui.lag.classList.remove('snap')}
    else if(hp<S.lagv){S.lagv=hp;S.ui.lag.style.width=pc(hp)}
    const bw=Math.min(hp,S.burn*(S.burn+1)/2),pw=Math.min(hp-bw,S.poison*3);
    S.ui.bs.style.left=pc(hp-bw);S.ui.bs.style.width=pc(bw);S.ui.ps.style.left=pc(hp-bw-pw);S.ui.ps.style.width=pc(pw);
    S.ui.hp.textContent=`${Math.ceil(hp)} / ${S.max}`;
    chips(S);
    S.items.forEach(it=>{if(!it.el||!it.s.cd)return;it.el.querySelector('.fill').style.height=Math.min(100,it.c/it.s.cd*100)+'%';it.el.classList.toggle('hasted',it.h>0);it.el.classList.toggle('slowed',it.sl>0)})}
  const c=document.getElementById('clock');
  if(B.wait>0){c.textContent='Setting sail…';c.className='clock'}
  else if(B.t<B.bell){c.textContent=`Storm in ${Math.ceil(B.bell-B.t)}s`;c.className='clock'}
  else{c.textContent=`Storm: ${B.storm} damage`;c.className='clock bell';if(!B.quiet&&!B.over)tip('storm','bottom')}
}
const CHIPI={
  sh:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h10v5c0 4-3 6-5 7-2-1-5-3-5-7z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  bu:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15c-3 0-5-2-5-5 0-3 3-4 3-8 2 1 3 3 3 5 1-1 1-2 1-3 2 2 3 4 3 6 0 3-2 5-5 5z" fill="#000"/></svg>',
  po:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5c-3 4-5 6.5-5 9a5 5 0 0 0 10 0c0-2.5-2-5-5-9z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="10.5" r="1.8" fill="#000"/></svg>'};
const CHIPN={sh:'Shield',bu:'Burn',po:'Poison'};
function tick(S,c){if(B.quiet||!S.ui)return;const el=S.ui.st.querySelector(`[data-c="${c}"]`);if(el)squish(el,'tick')}
function chips(S){
  const want=[['sh',Math.round(S.shield)],['bu',S.burn],['po',S.poison]].filter(x=>x[1]>0),sig=want.map(x=>x[0]).join();
  if(sig!==S.chipSig){const had=S.chipSig||'';S.chipSig=sig;
    S.ui.st.innerHTML=want.map(([c,v])=>`<span class="chip ${had.includes(c)?'':'new'}" data-c="${c}" title="${CHIPN[c]}" aria-label="${CHIPN[c]} ${v}">${CHIPI[c]}<b>${v}</b></span>`).join('')}
  want.forEach(([c,v])=>{const el=S.ui.st.querySelector(`[data-c="${c}"]`),b=el.querySelector('b'),prev=+b.textContent;
    if(prev!==v){b.textContent=v;el.setAttribute('aria-label',CHIPN[c]+' '+v);if(v>prev)squish(el,'bump')}});
}
function end(win){
  B.over=true;cancelAnimationFrame(raf);
  const n=B.node,e=ENEMIES[n.enemy],k=e.kind,depth=depthOf(n),foe=e.n;
  B.quiet=false;squish((win?B.E:B.P).fel,'ko');
  let head,lines=[],btn,next;
  if(win){
    A.beat[n.enemy]=1;if(k==='e')A.elites++;if(k==='b')A.bosses++;saveA();
    const gold=(k==='b'?15+G.sea*10:k==='e'?10+depth:5+Math.floor(depth/2))+B.P.gold+(hasC('trade')?3:0);
    G.gold+=gold;bump='gold';logL(`Beat the ${foe}. +${gold} gold.`);
    head=`You beat the ${foe}.`;lines.push(`+${gold} gold.`);
    if(k==='t'){btn='Take the spoils';next=()=>lootPick(n,chart)}
    else if(k==='e'){btn='Take the spoils';next=()=>lootPick(n,()=>chartPick(RNG(G.seed,'elite',n.id),`The ${foe} was carrying a chart.`,chart))}
    else if(G.sea<2){lines.push(`The way into ${SEAS[G.sea+1]} is open.`);btn=`Sail into ${SEAS[G.sea+1]}`;next=nextSea}
    else{btn='Sight land';next=()=>ending(true)}
  }else{
    const loss=lossOf(k);G.hull-=loss;bump='hull';
    logL(`Driven back by the ${foe}. Lost ${loss} hull.`);
    head=`The ${foe} beat you.`;lines.push(`−${loss} hull, ${Math.max(0,G.hull)} left.`);
    if(G.hull<=0){btn='Abandon ship';next=sink}
    else if(k==='b'){G.path.pop();G.at=G.path[G.path.length-1];delete G.shops[G.at];G.shopVisit=(G.shopVisit||0)+1;updateReveal();
      lines.push(`You limp back to ${node(G.at).name} to refit.`);btn=`Return to ${node(G.at).name}`;next=()=>{port(G.at);hullLoss(G.hull+loss,G.hull)}}
    else{lines.push('You slip past and sail on, empty-handed.');btn='Back to the chart';next=()=>{chart();hullLoss(G.hull+loss,G.hull)}}
  }
  save();
  setTimeout(()=>{draw();const ov=overlay(`<h2>${head}</h2><div class="lines">${lines.map(l=>`<p>${l}</p>`).join('')}</div><button class="primary" id="next">${btn}</button>`,true,'result');
    const b=document.getElementById('next');b.focus();b.onclick=()=>{ov.remove();next()}},B.quiet?50:750);
}
/* Back on the chart (or in port, after a boss) after a lost fight: a card shows the hull you lost. Planks crack off one by one while the number counts down, then it fades. */
function hullLoss(before,after){
  document.querySelectorAll('.hullcard').forEach(c=>c.remove());
  const n=Math.min(before,40),lost=Math.min(n,before-Math.max(0,after));
  const c=document.createElement('div');c.className='hullcard';c.setAttribute('role','status');
  c.innerHTML=`<svg class="hc-ship" viewBox="-2 -2 28 28" aria-hidden="true"><g stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#fff"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z"/></g></svg>
    <div><p class="hc-head">Hull damaged</p><p class="hc-num"><b>${before}</b> hull left <span class="hc-loss">−${before-after}</span></p>
    <div class="planks" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i${i>=n-lost?` class="go" style="--d:${(n-1-i)*140}ms"`:''}></i>`).join('')}</div></div>`;
  c.setAttribute('aria-label',`Hull damaged. Lost ${before-after}, ${Math.max(0,after)} left.`);
  document.body.appendChild(c);
  const b=c.querySelector('.hc-num b');
  for(let k=1;k<=before-after;k++)setTimeout(()=>{b.textContent=before-k;squish(b,'bump')},700+(k-1)*140);
  setTimeout(()=>c.classList.add('out'),2900);setTimeout(()=>c.remove(),3300);
}
function nextSea(){
  G.sea++;G.map=genMap(G.seed,G.sea);G.at=G.map.start;G.path=[G.at];G.full=false;G.extra=0;updateReveal();
  lore(LORE[G.sea]);save();port(G.at);
  const ov=overlay(`<h2>${SEAS[G.sea]}</h2><p class="log">${LORE[G.sea]}</p><button class="primary">Open the market</button>`,true);
  const b=ov.querySelector('button');b.onclick=()=>ov.remove();b.focus();
}
function sink(){ending(false)}
function ending(win){
  cancelAnimationFrame(raf);
  lore(win?LORE.end:LORE.sink);
  const reached=win?3:G.sea+1,score=win?100+G.hull:G.sea*10+node(G.at).row;
  if(win)A.wins++;A.best=Math.max(A.best,reached);
  if(G.seed.startsWith('D')){const txt=win?`reached the Far Shore with ${G.hull} hull`:`sank in ${SEAS[G.sea]}`;const prev=A.daily[G.seed+'#s']||-1;if(score>prev){A.daily[G.seed+'#s']=score;A.daily[G.seed]=txt}}
  saveA();const done=G;clearSave();
  const ov=overlay(`<h2>${win?'You reached the Far Shore.':'Your ship went down.'}</h2><p class="log">${win?LORE.end:LORE.sink}</p>
    <div class="lines"><p>${win?`Three seas charted in ${G.day} days, with ${G.hull} hull to spare.`:`You made it into ${SEAS[G.sea]} on day ${G.day}.`}</p><p class="seed">Voyage: ${codeOf(G.seed)}</p></div>
    <div class="sh-actions"><button class="ghost" data-a="log">Read your log</button><button class="primary" data-a="home">Back to the harbour</button></div>`,true,'result');
  ov.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='log'){journal(done)}else{ov.remove();title()}});
}
