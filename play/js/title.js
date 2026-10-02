/* Ink Crossing: Title screen, ship selection and starting a voyage. */
"use strict";
/* ---------- title ---------- */
const WAVE=`<svg class="waves" viewBox="0 0 400 36" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18 Q25 4 50 18 T100 18 T150 18 T200 18 T250 18 T300 18 T350 18 T400 18" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round"/></svg>`;
/* each ship drawn in ink, 120 by 110, waterline at the bottom. The flag group flaps on the title screen. */
const SHIPDRAW={
  sloop:`<path d="M60 8v72" fill="none"/><path class="flag" d="M60 6l15 4-15 4z" fill="#000"/>
    <path d="M63 13c17 15 28 37 31 61H63z"/><path d="M57 17v55H24z"/><path d="M63 74h32" fill="none" stroke-width="2"/>
    <path d="M14 78h92l-9 18H26z"/><path d="M14 78l-9-5" fill="none"/><path d="M20 85h80" fill="none" stroke-width="1.4"/>
    <circle cx="48" cy="90" r="2.2" fill="#000" stroke="none"/><circle cx="68" cy="90" r="2.2" fill="#000" stroke="none"/>`,
  galleon:`<path d="M30 14v58M58 6v66M86 16v56" fill="none"/><path class="flag" d="M58 4l15 4-15 4z" fill="#000"/>
    <path d="M20 22q10-3 20 0v12q-10 3-20 0z"/><path d="M16 38q14-4 28 0v22q-14 4-28 0z"/>
    <path d="M46 14q12-3 24 0v14q-12 3-24 0z"/><path d="M42 32q16-4 32 0v26q-16 4-32 0z"/>
    <path d="M76 24q10-3 20 0v12q-10 3-20 0z"/><path d="M73 40q13-4 26 0v18q-13 4-26 0z"/>
    <path d="M6 72h86l4-12h16v14l-10 24H24z"/><path d="M96 66h12M14 82h82" fill="none" stroke-width="1.4"/>
    <rect x="22" y="86" width="7" height="5" fill="#000" stroke="none"/><rect x="38" y="86" width="7" height="5" fill="#000" stroke="none"/><rect x="54" y="86" width="7" height="5" fill="#000" stroke="none"/><rect x="70" y="86" width="7" height="5" fill="#000" stroke="none"/><rect x="86" y="86" width="7" height="5" fill="#000" stroke="none"/>`,
  privateer:`<path d="M44 10v66M78 6v70" fill="none"/><path class="flag" d="M78 4c6 0 9 3 15 2-3 3-3 5 0 8-6 1-9-2-15-2z" fill="#000"/>
    <path d="M30 20q14-4 28 0v14q-14 4-28 0z" fill="#000"/><path d="M26 38q18-5 36 0v24q-18 5-36 0z" fill="#000"/><path d="M30 49q14-3 28 0" fill="none" stroke="#fff" stroke-width="1.6"/>
    <path d="M80 12l26 10v48H80z"/><path d="M80 40h26" fill="none" stroke-width="1.4"/>
    <path d="M10 76h100l-10 20H22z"/><path d="M16 84h88" fill="none" stroke-width="1.4"/>
    <rect x="24" y="86" width="10" height="5" fill="#000" stroke="none"/><rect x="50" y="86" width="10" height="5" fill="#000" stroke="none"/><rect x="76" y="86" width="10" height="5" fill="#000" stroke="none"/>
    <path d="M10 76l-6-6" fill="none"/>`,
  junk:`<path d="M46 8v66M84 20v54" fill="none"/><path class="flag" d="M46 6c4-3 10-3 14 0-4 3-10 3-14 0z" fill="#000"/>
    <path d="M48 12l30 6 4 54H48z"/><path d="M48 21l31 4M48 30l32 4M48 39l32 4M48 48l33 3M48 57l33 3M48 66l33 2" fill="none" stroke-width="1.3"/>
    <path d="M86 24l18 6 2 42H86z"/><path d="M86 33l19 4M86 42l19 4M86 51l20 3M86 60l20 3" fill="none" stroke-width="1.3"/>
    <path d="M22 44l22-6v32H18z"/><path d="M20 52l24-4M19 61l25-3" fill="none" stroke-width="1.3"/>
    <path d="M4 66c6 0 10 8 14 12h78c6-4 12-14 22-18l-4 20c-4 8-10 14-16 16H24C14 94 6 82 4 66z"/><path d="M18 84h82" fill="none" stroke-width="1.4"/>
    <circle cx="96" cy="78" r="4" fill="#fff"/><path d="M96 74v8M92 78h8" fill="none" stroke-width="1.2"/>`
};
const shipArt=(k,cls)=>`<svg class="${cls||'shipart'}" viewBox="0 0 120 110" aria-hidden="true"><g stroke="#000" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#fff">${SHIPDRAW[k]||SHIPDRAW.sloop}</g></svg>`;
/* fish under the title's waves: three swim past at their own depth and speed, and one leaps now and then */
const SEAFISH=()=>`<div class="seafish">${[['mackerel','sf1'],['sardine','sf2'],['snapper','sf3']].map(([k,c])=>`<span class="sfish ${c}">${fishSVG(k)}</span>`).join('')}<span class="sfish leap"><span>${fishSVG('sardine')}</span></span></div>`;
const BOAT=`<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#fff"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z"/></g></svg>`;
const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const codeOf=seed=>seed.startsWith('D')?`Daily ${seed.slice(1)}`:seed;
function title(){
  cancelAnimationFrame(raf);B=null;app.style.paddingBottom='';hullSeen=null;
  const saved=load(),dayKey='D'+today(),db=A.daily[dayKey];
  app.innerHTML=`<section class="title"><div class="sea" aria-hidden="true">${WAVE.replace('class="waves"','class="waves back"')}${shipArt(saved?saved.ship:'sloop','ship')}${WAVE}${SEAFISH()}</div><div class="brand">
    <h1>Ink Crossing</h1>
    <p class="tag">Chart the sea. Reach the far shore.</p></div>
    <div class="way"><div class="buttons">
      ${saved?`<button class="primary" id="cont">Continue voyage</button>`:''}
      ${!A.tutDone&&!saved?`<button class="primary" id="tut">The maiden voyage</button>`:''}
      <button class="${saved||!A.tutDone?'ghost':'primary'}" id="daily">Today's voyage</button>
      <button class="ghost" id="new">New voyage</button>
      <button class="ghost" id="code">Sail a voyage code</button>
      <button class="ghost" id="atlas">Atlas</button>
      ${A.tutDone||saved?`<button class="linkbtn tutlink" id="tut">${A.tutDone?'Sail the maiden voyage again':'The maiden voyage'}</button>`:''}
    </div>
    <p class="seed">Today's voyage is the same sea for every captain.${db?` Your best today: ${db}.`:''}</p>
    <p class="ver">Version ${VERSION}.${feedbackLink('fbBtn')}</p></div>
    <div class="rules">
      <p><b>Chart.</b> You're a cartographer mapping three seas no one has come back from. Pick your route. Fog hides everything more than two rows ahead.</p>
      <p><b>Fight.</b> Your cargo fires on its own. Every enemy has its own tricks, so read them before you sail.</p>
      <p><b>Grow.</b> Buy at ports, take loot from wins, and draw landmarks that last the whole voyage. Order in your hold matters.</p>
    </div></section>`;
  const warn=fn=>()=>{if(!saved)return fn();const ov=overlay(`<h2>Start over?</h2><p>Your current voyage will be lost.</p><div class="sh-actions"><button class="ghost" data-a="no">Keep it</button><button class="primary" data-a="yes">Start over</button></div>`,true);
    ov.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='yes'){clearSave();fn()}})};
  document.getElementById('daily').onclick=warn(()=>shipPick(dayKey));
  document.getElementById('new').onclick=warn(()=>shipPick(newCode()));
  document.getElementById('code').onclick=()=>codeSheet(seed=>warn(()=>shipPick(seed))());
  document.getElementById('atlas').onclick=atlas;
  document.getElementById('tut').onclick=startTutorial;
  const fb=document.getElementById('fbBtn');if(fb)fb.onclick=showFeedback;
  const cb=document.getElementById('cont');if(cb)cb.onclick=()=>{G=saved;resume()};
}
/* a fresh random code. Never starting with D, which marks a daily voyage. */
function newCode(){let c;do c=Math.random().toString(36).slice(2,7).toUpperCase();while(c.length<5||c[0]==='D');return c}
/* a voyage code is the voyage's seed: the same code always charts the same sea. "Daily 2026-09-30" is that day's voyage. */
function seedOf(code){code=String(code||'').trim();const d=code.match(/^daily\s*(\d{4}-\d{2}-\d{2})$/i);if(d)return'D'+d[1];
  const c=code.toUpperCase().replace(/[^A-Z0-9]/g,'');return c.length>=3&&c.length<=12?c:null}
function codeSheet(done){
  const ov=overlay(`<h2>Sail a voyage code</h2><p>Every voyage has a code. Sail the same code as a friend and you'll meet the same sea, the same enemies and the same first markets.</p>
    <input id="codein" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" placeholder="e.g. K4QZ7" aria-label="Voyage code">
    <p class="fbmsg" id="codemsg"></p>
    <div class="sh-actions"><button class="ghost" data-a="no">Back</button><button class="primary" data-a="go">Sail it</button></div>`,true);
  const inp=ov.querySelector('#codein'),go=()=>{const s=seedOf(inp.value);if(!s){ov.querySelector('#codemsg').textContent='Codes are 3 to 12 letters and numbers.';return}ov.remove();done(s)};
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
  ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='go')go();else ov.remove()});
  setTimeout(()=>inp.focus(),60);
}
function shipPick(seed){
  const ov=overlay(`<h2>Choose your ship</h2><div class="ships">${Object.entries(SHIPS).map(([k,s])=>{const ok=!s.ok||s.ok(A);
    return`<button class="shipcard art" data-s="${k}" ${ok?'':'disabled'}>${shipArt(k)}<div><b>${s.n}</b><span class="d">${ok?`${s.type}. ${s.theme} ${TRAITS[s.trait].d()} ${s.berths||3} crew berths.`:s.lock}</span></div></button>`}).join('')}</div>
    <p class="seed">Voyage: ${codeOf(seed)}</p><button class="ghost" data-a="close">Back</button>`,false,'journal');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]')){ov.remove();return}
    const b=e.target.closest('[data-s]');if(!b||b.disabled)return;ov.remove();startVoyage(seed,b.dataset.s)});
}
function shipIcon(k){return`<span class="shipemb"><svg viewBox="0 0 12 12" aria-hidden="true">${EMB[k]}</svg></span>`}
function startVoyage(seed,ship){
  const map=genMap(seed,0);
  G={seed,ship,sea:0,map,at:map.start,path:[map.start],day:1,gold:30,hull:20,board:[],charts:[],log:[],creel:[],rod:0,tip:0,far:0,quest:null,hock:null,locker:null,shops:{},freeRoll:true,full:false,extra:0,reveal:2,crew:[]};
  updateReveal();
  A.voyages++;saveA();lore(LORE.start);logL(`Set out from Gullhaven aboard ${SHIPS[ship].n}.`);save();
  port(map.start);
  const ov=overlay(`<h2>Gullhaven</h2><p class="log">${LORE.start}</p><button class="primary" data-a="c">Find a crew and cargo</button>`,true);
  ov.querySelector('button').onclick=()=>ov.remove();ov.querySelector('button').focus();
}
function resume(){unrollNext=true;if(G.fightAt!=null&&node(G.fightAt))return fight(node(G.fightAt));
  if(G.boarded!=null&&node(G.boarded))return bandits(node(G.boarded),()=>{if(G.hull<=0)return sink();save();chart()});const n=node(G.at);if(n.type==='port'&&G.inPort)port(n.id);else chart()}
