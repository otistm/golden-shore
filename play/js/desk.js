/* Ink Crossing: the captain's desk, a side panel shown only on big screens during a voyage (ship, landmarks, catch, log). */
"use strict";
/* Keep in step with the desk rules at the end of styles.css. */
const DESK=matchMedia('(min-width:1180px) and (min-height:640px)');
const deskEl=document.getElementById('desk');
function renderDesk(){
  const on=DESK.matches&&!!G&&!!app.querySelector(':scope>.bar');
  document.body.classList.toggle('desk',on);deskEl.hidden=!on;
  if(!on){deskEl.innerHTML='';return}
  const sh=SHIPS[G.ship],tr=TRAITS[sh.trait];
  const marks=G.charts.length?`<div class="marks">${G.charts.map(c=>`<div class="mark">${glyph(c.k)}<p><b>${CHARTS[c.k].n}.</b> ${CHARTS[c.k].d}</p></div>`).join('')}</div>`
    :`<p class="soft">None yet. Uncharted isles and elites give you landmarks that help for the whole voyage.</p>`;
  const fish={};G.creel.forEach(f=>fish[f]=(fish[f]||0)+1);
  const catchH=G.creel.length?`<section><h3>Catch <span class="soft">${G.creel.length} fish</span></h3><div class="catchlist">${Object.entries(fish).map(([f,k])=>`<div class="fishline">${fishSVG(f)}<span>${FISH[f].n}${k>1?` ×${k}`:''}</span></div>`).join('')}</div></section>`:'';
  const log=G.log.slice().reverse().map(e=>e.lore?`<p class="log entry">${e.t}</p>`:`<p class="entry"><b>Day ${e.d}.</b> ${e.t}</p>`).join('');
  deskEl.innerHTML=`<section class="desk-ship">${shipIcon(G.ship)}<div><b>${sh.n}</b><span class="soft">${sh.type}. ${G.tut?'Tutorial voyage':`Voyage ${codeOf(G.seed)}`}</span></div></section>
    <p class="desk-trait"><b>${tr.n}.</b> ${tr.d()}</p>
    <section><h3>Landmarks</h3>${marks}</section>
    ${catchH}
    <section class="desk-log"><h3>Cartographer's log</h3><div class="entries">${log||'<p class="soft">Nothing written yet.</p>'}</div></section>`;
}
new MutationObserver(()=>requestAnimationFrame(renderDesk)).observe(app,{childList:true});
DESK.addEventListener('change',()=>{renderDesk();fitDock()});
