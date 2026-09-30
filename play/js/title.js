/* Ink Crossing: Title screen, ship selection and starting a voyage. */
"use strict";
/* ---------- title ---------- */
const WAVE=`<svg class="waves" viewBox="0 0 400 36" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18 Q25 4 50 18 T100 18 T150 18 T200 18 T250 18 T300 18 T350 18 T400 18" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const SHIPART=`<svg class="ship" viewBox="0 0 120 110" aria-hidden="true"><g stroke="#000" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#fff">
  <path d="M52 8v78M76 20v66" fill="none"/><path class="flag" d="M52 6l16 5-16 5z" fill="#000"/>
  <path d="M54 14c16 6 20 24 16 44H54z"/><path d="M54 62c14 3 18 12 16 20H54z"/><path d="M78 24c14 8 16 22 12 36H78z"/>
  <path d="M8 80h104l-12 20H24z"/><path d="M16 86h88" fill="none" stroke-width="1.4"/><circle cx="40" cy="92" r="2.4" fill="#000" stroke="none"/><circle cx="60" cy="92" r="2.4" fill="#000" stroke="none"/><circle cx="80" cy="92" r="2.4" fill="#000" stroke="none"/></g></svg>`;
const BOAT=`<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#fff"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z"/></g></svg>`;
const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const codeOf=seed=>seed.startsWith('D')?`Daily ${seed.slice(1)}`:seed;
function title(){
  cancelAnimationFrame(raf);B=null;app.style.paddingBottom='';
  const saved=load(),dayKey='D'+today(),db=A.daily[dayKey];
  app.innerHTML=`<section class="title">
    <div class="sea" aria-hidden="true">${WAVE.replace('class="waves"','class="waves back"')}${SHIPART}${WAVE}</div>
    <h1>Ink Crossing</h1>
    <p class="tag">Chart the sea. Reach the far shore.</p>
    <div class="buttons">
      ${saved?`<button class="primary" id="cont">Continue voyage</button>`:''}
      ${!A.tutDone&&!saved?`<button class="primary" id="tut">Learn to sail</button>`:''}
      <button class="${saved||!A.tutDone?'ghost':'primary'}" id="daily">Today's voyage</button>
      <button class="ghost" id="new">New voyage</button>
      <button class="ghost" id="atlas">Atlas</button>
      ${A.tutDone||saved?`<button class="linkbtn tutlink" id="tut">${A.tutDone?'Replay the tutorial':'Learn to sail'}</button>`:''}
    </div>
    <p class="seed">Today's voyage is the same sea for every captain.${db?` Your best today: ${db}.`:''}</p>
    <p class="ver">Version ${VERSION}.${feedbackLink('fbBtn')}</p>
    <div class="rules">
      <p><b>Chart.</b> You're a cartographer mapping three seas no one has come back from. Pick your route. Fog hides everything more than two rows ahead.</p>
      <p><b>Fight.</b> Your cargo fires on its own. Every enemy has its own tricks, so read them before you sail.</p>
      <p><b>Grow.</b> Buy at ports, take loot from wins, and draw landmarks that last the whole voyage. Order in your hold matters.</p>
    </div></section>`;
  const warn=fn=>()=>{if(!saved)return fn();const ov=overlay(`<h2>Start over?</h2><p>Your current voyage will be lost.</p><div class="sh-actions"><button class="ghost" data-a="no">Keep it</button><button class="primary" data-a="yes">Start over</button></div>`,true);
    ov.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='yes'){clearSave();fn()}})};
  document.getElementById('daily').onclick=warn(()=>shipPick(dayKey));
  document.getElementById('new').onclick=warn(()=>shipPick(Math.random().toString(36).slice(2,7).toUpperCase()));
  document.getElementById('atlas').onclick=atlas;
  document.getElementById('tut').onclick=startTutorial;
  const fb=document.getElementById('fbBtn');if(fb)fb.onclick=showFeedback;
  const cb=document.getElementById('cont');if(cb)cb.onclick=()=>{G=saved;resume()};
}
function shipPick(seed){
  const ov=overlay(`<h2>Choose your ship</h2><div class="ships">${Object.entries(SHIPS).map(([k,s])=>{const ok=!s.ok||s.ok(A);
    return`<button class="shipcard" data-s="${k}" ${ok?'':'disabled'}>${shipIcon(k)}<div><b>${s.n}</b><span class="d">${ok?`${s.type}. ${s.theme} ${TRAITS[s.trait].d()} Starts with ${s.start.map(x=>DEFS[x.k].n).join(' and ')}.`:s.lock}</span></div></button>`}).join('')}</div>
    <p class="seed">Voyage: ${codeOf(seed)}</p><button class="ghost" data-a="close">Back</button>`,false,'journal');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]')){ov.remove();return}
    const b=e.target.closest('[data-s]');if(!b||b.disabled)return;ov.remove();startVoyage(seed,b.dataset.s)});
}
function shipIcon(k){return`<span class="shipemb"><svg viewBox="0 0 12 12" aria-hidden="true">${EMB[k]}</svg></span>`}
function startVoyage(seed,ship){
  const map=genMap(seed,0);
  G={seed,ship,sea:0,map,at:map.start,path:[map.start],day:1,gold:10,hull:20,board:SHIPS[ship].start.map(x=>({...x})),charts:[],log:[],creel:[],rod:0,tip:0,far:0,quest:null,hock:null,locker:null,shops:{},freeRoll:true,full:false,extra:0,reveal:2};
  G.board.forEach(b=>seen(b.k));updateReveal();
  A.voyages++;saveA();lore(LORE.start);logL(`Set out from Gullhaven aboard ${SHIPS[ship].n}.`);save();
  port(map.start);
  const ov=overlay(`<h2>Gullhaven</h2><p class="log">${LORE.start}</p><button class="primary" data-a="c">Open the market</button>`,true);
  ov.querySelector('button').onclick=()=>ov.remove();ov.querySelector('button').focus();
}
function resume(){if(G.fightAt!=null&&node(G.fightAt))return fight(node(G.fightAt));const n=node(G.at);if(n.type==='port'&&G.inPort)port(n.id);else chart()}
