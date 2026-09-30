/* Ink Crossing: UI helpers, boards, item sheets, the hold and locker dock, drag and drop. */
"use strict";
/* ---------- ui helpers ---------- */
const app=document.getElementById('app');
function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);const c=document.getElementById('coach');if(c){const r=c.getBoundingClientRect();if(r.top<innerHeight/2)t.style.top=(r.bottom+10)+'px'}setTimeout(()=>t.remove(),2200)}
function pop(el,txt,cls){if(!el||(B&&B.quiet))return;const r=el.getBoundingClientRect();const p=document.createElement('div');p.className='pop '+(cls||'');p.textContent=txt;p.style.left=(r.left+r.width/2+(Math.random()*18-9))+'px';p.style.top=(r.top+r.height*.45)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1000)}
function squish(el,cls){if(!el||(B&&B.quiet))return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)}
function overlay(html,center,cls){const ov=document.createElement('div');ov.className='overlay'+(center?' center':'');ov.innerHTML=`<div class="sheet ${cls||''}" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(ov);return ov}
function barHTML(){const b=k=>bump===k?' bump':'';const h=`<header class="bar"><span class="pill day">Day ${G.day}</span><span class="pill${b('gold')}">${G.gold} gold</span><span class="pill${b('hull')}">${G.hull} hull</span>${G.creel&&G.creel.length?`<button class="pill" id="creelbtn">${G.creel.length} fish</button>`:''}<button class="linkbtn" id="logbtn" style="margin-left:auto">Log</button><button class="pausebtn" id="pausebtn" type="button" aria-label="Pause"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="9" y="8" width="5" height="16" rx="1.5" fill="currentColor"/><rect x="18" y="8" width="5" height="16" rx="1.5" fill="currentColor"/></svg></button></header>`;bump=null;return h}
function bindBar(){const l=document.getElementById('logbtn');if(l)l.onclick=()=>journal();const pb=document.getElementById('pausebtn');if(pb)pb.onclick=showPause;const c=document.getElementById('creelbtn');if(c)c.onclick=creelSheet}
function boardHTML(list,side,ups,cap){cap=cap||10;
  let h=`<div class="board${side==='l'?' locker':''}" data-side="${side}">`;
  list.forEach((it,i)=>{const d=DEFS[it.k],s=statsOf(list,i),sel=side==='p'&&!B&&G.moving&&G.sel===i,up=ups&&ups.has(i);
    h+=`<button class="item t${it.t}${isPassive(it.k)?' passive':''}${sel?' sel':''}" style="grid-column:span ${d.s}" data-i="${i}" aria-label="${TIER[it.t]} ${d.n}${up?', can be upgraded here':''}"><span class="fill"></span>${emb(it.k)}<span class="ico">${icon(it.k)}</span><span class="nm">${d.n}</span>${up?CHEV:''}<span class="cdt">${isPassive(it.k)?'···':s.cd+'s'}</span></button>`});
  for(let k=used(list);k<cap;k++)h+=`<button class="slot" aria-label="Empty slot"></button>`;
  return h+'</div>';
}
function itemSheet(list,i,mode,after){
  const it=list[i],d=DEFS[it.k],{s,L,g,tags}=describe(list,i),inL=list===G.locker,other=inL?G.board:G.locker,ocap=inL?10:LOCK;
  const canSwap=G.locker&&mode!=='view'&&(G.locker===list||G.board===list),swapOk=canSwap&&used(other)+d.s<=ocap;
  const ov=overlay(`<div class="sh-top"><span class="big t${it.t}">${icon(it.k)}</span><div><h2>${d.n}</h2><p class="soft" style="margin-top:4px"><span class="tierword">${TIER[it.t]}</span>, size ${d.s}${s.cd?`, ${s.cd}s cooldown`:', passive'}${tags.length?`. ${tags.join(', ')}`:''}${d.ship!=='any'?`. ${SHIPS[d.ship].n}'s cargo`:''}</p></div></div>
    ${inL?'<p class="gloss">In your locker. Locker cargo stays out of fights.</p>':''}
    <ul>${L.map(l=>`<li>${l}</li>`).join('')}</ul>
    ${g.length?`<div class="gloss">${g.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
    ${mode!=='view'&&it.t<3?`<p class="gloss">Get another ${d.n}, ${TIER[it.t]} or better, to upgrade it to ${TIER[it.t+1]}.</p>`:''}
    <div class="sh-actions">${mode!=='view'&&!inL?`<button class="ghost" data-a="move">Move</button>`:''}${canSwap?`<button class="ghost" data-a="swap" ${swapOk?'':'disabled'}>${inL?'Move to hold':'Stow in locker'}</button>`:''}${mode==='port'||mode==='spoils'?`<button class="ghost" data-a="sell">Sell for ${sellP(it.k,it.t)} gold</button>`:''}<button class="primary" data-a="close">Close</button></div>`);
  ov.addEventListener('click',e=>{
    if(e.target===ov){ov.remove();return}
    const a=e.target.closest('[data-a]');if(!a||a.disabled)return;ov.remove();
    if(a.dataset.a==='sell'){G.gold+=sellP(it.k,it.t);list.splice(i,1);bump='gold';save();toast(`Sold ${d.n}`);after()}
    if(a.dataset.a==='move'){G.moving=true;G.sel=i;after()}
    if(a.dataset.a==='swap'){list.splice(i,1);other.push(it);save();toast(inL?`Moved the ${d.n} to your hold`:`Stowed the ${d.n} in your locker`);after()}
  });
  ov.querySelector('[data-a="close"]').focus();
}
function bindHold(mode,rerender,ext){
  dragHold(mode,rerender,ext);
  app.querySelectorAll('.dock .board[data-side="p"] .item').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;const i=+b.dataset.i;
    if(G.moving){if(i!==G.sel){const[it]=G.board.splice(G.sel,1);G.board.splice(i,0,it)}G.moving=false;G.sel=null;save();rerender();coach('moved')}
    else itemSheet(G.board,i,mode,rerender)});
  app.querySelectorAll('.dock .board[data-side="p"] .slot').forEach(b=>b.onclick=()=>{if(!G.moving)return;const[it]=G.board.splice(G.sel,1);G.board.push(it);G.moving=false;G.sel=null;save();rerender()});
  app.querySelectorAll('.dock .board[data-side="l"] .item').forEach(b=>b.onclick=()=>{if(dragJustEnded)return;if(G.moving){G.moving=false;G.sel=null;return rerender()}itemSheet(G.locker,+b.dataset.i,mode,rerender)});
}
/* ---------- drag and drop: hold and locker ---------- */
let dragJustEnded=false;
/* ext (the spoils screen): from, things outside the hold that can be dragged in, each {el,it,drop(tgt,dst)};
   back, {el,ok(it),put(it)}, a spot an item can be dragged back out to */
function dragHold(mode,rerender,ext){
  const conts=[['p',G.board,10],['l',G.locker,LOCK]].map(([side,list,cap])=>({side,list,cap,el:app.querySelector(`.dock .board[data-side="${side}"]`)})).filter(c=>c.el&&c.list);
  const sellId=mode==='port'?'leave':mode==='spoils'?'sailon':null;
  conts.forEach(src=>src.el.querySelectorAll('.item').forEach(el=>{const si=+el.dataset.i;arm(el,src.list[si],src,si,null)}));
  if(ext&&ext.from)ext.from.forEach(f=>arm(f.el,f.it,null,-1,f));
  function arm(el,it,src,si,xin){
    el.addEventListener('pointerdown',e=>{
      if(e.button>0||G.moving)return;
      const sx=e.clientX,sy=e.clientY;let drag=null;
      const move=ev=>{if(!drag){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;drag=start(ev)}ev.preventDefault();follow(ev)};
      const up=ev=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(drag)finish(ev.type==='pointercancel')};
      window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
      function start(ev){
        const r=el.getBoundingClientRect();let ghost,w=r.width,h=r.height,ox=ev.clientX-r.left,oy=ev.clientY-r.top;
        if(xin){const t=tileSize(DEFS[it.k].s);w=t.w;h=t.h;ox=w/2;oy=h/2;ghost=document.createElement('div');ghost.className=`item t${it.t}${isPassive(it.k)?' passive':''}`;
          ghost.innerHTML=`<span class="fill"></span>${emb(it.k)}<span class="ico">${icon(it.k)}</span><span class="nm">${DEFS[it.k].n}</span><span class="cdt">${isPassive(it.k)?'···':DEFS[it.k].cd+'s'}</span>`}
        else ghost=el.cloneNode(true);
        ghost.classList.add('ghost');ghost.style.width=w+'px';ghost.style.height=h+'px';
        document.body.appendChild(ghost);el.classList.add('dragging');
        const marks=conts.map(c=>{const m=document.createElement('div');m.className='dropmark';c.el.appendChild(m);return m});
        conts.forEach(c=>c.el.classList.add('droppable'));
        let sell=null,back=null;
        if(!xin&&sellId){const b=document.getElementById(sellId);if(b){sell=b;sell.dataset.label=sell.textContent;sell.classList.add('sellzone');sell.textContent=`Drop here to sell for ${sellP(it.k,it.t)} gold`}}
        if(!xin&&ext&&ext.back&&ext.back.ok(it)){back=ext.back.el;back.classList.add('backzone')}
        return{ghost,marks,sell,back,it,ox,oy,lx:ev.clientX,tilt:0,tgt:null,dst:null,full:false,overSell:false,overBack:false};
      }
      function follow(ev){
        const d=drag,vx=ev.clientX-d.lx;d.lx=ev.clientX;
        d.tilt=Math.max(-14,Math.min(14,d.tilt*.7+vx*.9));
        d.ghost.style.transform=`translate(${ev.clientX-d.ox}px,${ev.clientY-d.oy}px) rotate(${d.tilt}deg) scale(1.14)`;
        const over=(b,m)=>{if(!b)return false;const r=b.getBoundingClientRect();return ev.clientY>=r.top-m&&ev.clientY<=r.bottom+m&&ev.clientX>=r.left&&ev.clientX<=r.right};
        d.overSell=over(d.sell,8);if(d.sell)d.sell.classList.toggle('hot',d.overSell);
        d.overBack=over(d.back,0);if(d.back)d.back.classList.toggle('hot',d.overBack);
        let tgt=null,best=1e9;
        if(!d.overSell&&!d.overBack)conts.forEach(c=>{const r=c.el.getBoundingClientRect();if(ev.clientY>=r.top-26&&ev.clientY<=r.bottom+26){const dd=Math.abs(ev.clientY-(r.top+r.bottom)/2);if(dd<best){best=dd;tgt=c}}});
        conts.forEach((c,k)=>{c.el.classList.toggle('over',c===tgt);if(c!==tgt)d.marks[k].style.display='none'});
        d.tgt=tgt;if(!tgt){d.dst=null;return}
        const mark=d.marks[conts.indexOf(tgt)],br=tgt.el.getBoundingClientRect();
        d.full=tgt!==src&&!(xin&&findMatch(it))&&used(tgt.list)+DEFS[d.it.k].s>tgt.cap;
        tgt.el.classList.toggle('full',d.full);
        const items=[...tgt.el.querySelectorAll('.item:not(.ghost)')].filter(x=>!(tgt===src&&+x.dataset.i===si));
        let dst=tgt.list.length,x=null;
        for(const it of items){const r=it.getBoundingClientRect();if(ev.clientX<r.left+r.width/2){dst=+it.dataset.i;x=r.left-br.left-3;break}}
        if(x==null){const last=items[items.length-1];x=last?last.getBoundingClientRect().right-br.left+1:6}
        d.dst=dst;mark.style.display='block';mark.classList.toggle('no',d.full);
        if(mark.dataset.x!==String(Math.round(x))){mark.dataset.x=Math.round(x);mark.style.left=x+'px';mark.classList.remove('pop');void mark.offsetWidth;mark.classList.add('pop')}
      }
      function finish(cancel){
        const d=drag;dragJustEnded=true;setTimeout(()=>dragJustEnded=false,60);
        d.ghost.remove();d.marks.forEach(m=>m.remove());el.classList.remove('dragging');conts.forEach(c=>c.el.classList.remove('droppable','over','full'));
        if(d.sell){d.sell.textContent=d.sell.dataset.label;d.sell.classList.remove('sellzone','hot')}
        if(d.back)d.back.classList.remove('backzone','hot');
        if(cancel)return;
        if(d.overSell){G.gold+=sellP(d.it.k,d.it.t);src.list.splice(si,1);bump='gold';save();toast(`Sold ${DEFS[d.it.k].n}`);rerender();return}
        if(d.overBack){ext.back.put(d.it);rerender();return}
        const tgt=d.tgt;if(!tgt||d.dst==null)return;
        if(d.full)return toast(tgt.side==='l'?'No room in the locker.':'No room in the hold.');
        let dst=d.dst;
        if(xin){const at=xin.drop(tgt,dst);rerender();if(at!=null){const m=app.querySelectorAll(`.dock .board[data-side="${tgt.side}"] .item`)[at];if(m)squish(m,'land')}return}
        if(tgt===src){if(dst===si)return;src.list.splice(si,1);if(dst>si)dst--;src.list.splice(dst,0,d.it)}
        else{src.list.splice(si,1);tgt.list.splice(dst,0,d.it)}
        save();rerender();
        const moved=app.querySelectorAll(`.dock .board[data-side="${tgt.side}"] .item`)[dst];if(moved)squish(moved,'land');coach('moved');
      }
    });
  }
}
/* the size of an item tile in the docked hold, for an item of size s */
function tileSize(s){const b=app.querySelector('.dock .board[data-side="p"]');if(!b)return{w:40*s,h:66};
  const cs=getComputedStyle(b),gap=parseFloat(cs.columnGap)||4,cell=(b.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-9*gap)/10,c=b.firstElementChild;
  return{w:cell*s+gap*(s-1),h:c?c.getBoundingClientRect().height:66}}
function holdDock(extra,ups,lups,hint){
  hint=G.moving?'Tap an item to put it there, or an empty slot to send it to the end.':hint||`Drag to ${G.locker?'move between hold and locker':'rearrange'}${G.inPort?', or onto Set sail to sell':''}. Tap to inspect.`;
  return`<footer class="cta dock"><div class="inner">
    <div class="stall-head"><h2>Your hold</h2><span class="soft">${used(G.board)}/10 slots</span></div>
    <p class="hint${G.moving?' on':''}">${hint}</p>
    ${boardHTML(G.board,'p',ups)}
    ${G.locker?`<div class="stall-head locker-head"><h3>Locker <span class="soft">stays out of fights</span></h3><span class="soft">${used(G.locker)}/${LOCK}</span></div>${boardHTML(G.locker,'l',lups,LOCK)}`:''}
    ${extra}</div></footer>`;
}
function fitDock(){const d=app.querySelector('.dock');if(d){app.style.paddingBottom=(d.offsetHeight+18)+'px';document.documentElement.style.setProperty('--dock',d.offsetHeight+'px')}}
addEventListener('resize',fitDock);
/* desktop keys: Esc closes the top pop-up (like tapping outside it) or a tip, and otherwise pauses. P pauses and resumes. 1, 2 and 4 set fight speed */
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||(e.target.closest&&e.target.closest('input,textarea')))return;
  const ovs=document.querySelectorAll('.overlay'),top=ovs[ovs.length-1];
  if(e.key==='p'||e.key==='P'){if(PAUSE.on)resumePause();else if(!top)showPause();return}
  if(e.key==='Escape'){if(top)top.dispatchEvent(new MouseEvent('click',{bubbles:true}));else{const x=document.querySelector('#coach .cx');if(x)x.click();else showPause()}return}
  if(B&&!B.over&&!top){const b=app.querySelector(`[data-sp="${e.key}"]`);if(b)b.click()}
});
/* ---------- pause (like Ink Nine and Ink Rally) ----------
   Freezes fights and fishing: both read the clock through pauseClock(), which stops while paused. */
const PAUSE={on:false,since:0,total:0,ov:null};
const pauseClock=()=>(performance.now()-PAUSE.total-(PAUSE.on?performance.now()-PAUSE.since:0))/1000;
function showPause(){
  if(PAUSE.on||!G||!app.querySelector(':scope>.bar'))return;
  PAUSE.on=true;PAUSE.since=performance.now();
  const fighting=B&&!B.over,fishing=!!app.querySelector('#pond');
  const note=G.tut?'The tutorial is not saved, so leaving starts it over next time.'
    :`Your voyage is saved. Pick it up from the title screen whenever you like.${fighting?' If you leave now, this fight starts over when you come back.':fishing?' If you leave now, the casts you have left are lost.':''}`;
  const ov=PAUSE.ov=overlay(`<h2>Paused</h2><p class="soft">${G.tut?'Tutorial':`${SEAS[G.sea]}, day ${G.day}. Voyage ${codeOf(G.seed)}`}</p><p>${note}</p>
    <button class="primary" data-p="go">Keep sailing</button><button class="ghost" data-p="home">${G.tut?'Leave the tutorial':'Save and go to the title'}</button>
    <p class="ver">Version ${VERSION}.${feedbackLink('fbPause')}</p>`,true,'pausecard');
  ov.addEventListener('click',e=>{if(e.target===ov)return resumePause();const b=e.target.closest('[data-p]');if(!b)return;
    if(b.dataset.p==='go')resumePause();else leaveToTitle()});
  const fb=ov.querySelector('#fbPause');if(fb)fb.onclick=()=>{resumePause();showFeedback()};
  ov.querySelector('[data-p="go"]').focus();
}
function resumePause(){if(!PAUSE.on)return;PAUSE.total+=performance.now()-PAUSE.since;PAUSE.on=false;if(PAUSE.ov)PAUSE.ov.remove();PAUSE.ov=null}
function leaveToTitle(){
  resumePause();cancelAnimationFrame(raf);cancelAnimationFrame(FR);B=null;hideCoach();
  document.querySelectorAll('.overlay,.hullcard').forEach(o=>o.remove());
  if(G&&!G.tut)save();G=null;title();
}
/* switching away mid-fight or mid-cast pauses the game, like Ink Rally */
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&((B&&!B.over)||app.querySelector('#pond')))showPause()});
