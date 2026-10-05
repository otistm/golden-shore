/* Golden Shore: The cartographer's log and the Atlas. */
"use strict";
/* ---------- log + atlas ---------- */
function journal(g){g=g||G;
  const h=g.log.map(e=>e.lore?`<p class="log entry">${e.t}</p>`:`<p class="entry"><b>Day ${e.d}.</b> ${e.t}</p>`).join('');
  const ch=g.charts.length?`<p class="label" style="margin-top:6px">Landmarks charted</p><div class="traitlist">${g.charts.map(c=>`<p><b>${CHARTS[c.k].n}.</b> ${CHARTS[c.k].d}</p>`).join('')}</div>`:'';
  const ov=overlay(`<h2>Cartographer's log</h2><p class="seed">${SHIPS[g.ship].n}. Voyage ${codeOf(g.seed)}.</p>${h}${ch}<p class="ver">Version ${VERSION}.${feedbackLink('fbLog')}</p><button class="primary" data-a="c">Close</button>`,false,'journal');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()});
  const fb=ov.querySelector('#fbLog');if(fb)fb.onclick=showFeedback;
}
function atlas(){
  app.style.paddingBottom='';
  const seas=[0,1,2].map(s=>`<p class="label" style="margin:12px 0 6px">${SEAS[s]}</p><div class="beasts">${Object.entries(ENEMIES).filter(([,e])=>e.sea===s).map(([k,e])=>A.met[k]
    ?`<div class="beast"><span class="tag">${A.beat[k]?'Beaten':'Met'}</span><b>${e.n}</b>${e.kind==='b'?' (boss)':e.kind==='e'?' (elite)':''}<br>${e.traits.map(t=>TRAITS[t].n).join(', ')}</div>`
    :`<div class="beast unknown"><b>???</b>${e.kind==='b'?' (boss)':e.kind==='e'?' (elite)':''}</div>`).join('')}</div>`).join('');
  // retired items count only as keepsakes: shown if you found one, never needed to complete a ship
  const inAtlas=k=>!RETIRED.has(k)||A.items[k],live=KEYS.filter(k=>!RETIRED.has(k)),found=live.filter(k=>A.items[k]).length,cf=Object.keys(CHARTS).filter(k=>A.charts[k]).length;
  app.innerHTML=`<section class="atlas"><button class="ghost back" id="back">Back</button><h1 style="font-size:44px;line-height:1">Atlas</h1>
    <p class="stat" style="margin-top:10px">${A.voyages} voyages set out. ${A.wins} reached the Far Shore. ${A.bosses} sea bosses and ${A.elites} elites beaten.</p>
    <h2>Ships</h2><div class="ships">${Object.entries(SHIPS).map(([k,s])=>`<div class="shipcard static art${!s.ok||s.ok(A)?'':' locked'}">${shipArt(k)}<div><b>${s.n}</b><span class="d">${!s.ok||s.ok(A)?`${s.theme} ${TRAITS[s.trait].d()}`:s.lock}</span></div></div>`).join('')}</div>
    <h2>Bestiary</h2>${seas}
    <h2>Cargo, ${found} of ${live.length}</h2>${['any',...SHIPKEYS].map(sh=>{const ks=KEYS.filter(k=>DEFS[k].ship===sh&&inAtlas(k)),kl=ks.filter(k=>!RETIRED.has(k));return`<p class="label" style="margin:12px 0 6px">${sh==='any'?'Any ship':SHIPS[sh].n}, ${kl.filter(k=>A.items[k]).length} of ${kl.length}</p><div class="cargo">${ks.map(k=>A.items[k]?`<button class="c" data-k="${k}" aria-label="${DEFS[k].n}">${icon(k)}</button>`:`<span class="c unknown" aria-hidden="true"></span>`).join('')}</div>`}).join('')}
    <h2>Fish, ${Object.keys(FISH).filter(k=>(A.fish||{})[k]).length} of ${Object.keys(FISH).length}</h2><div class="fishgrid">${Object.keys(FISH).map(k=>(A.fish||{})[k]?`<div class="fc">${fishSVG(k)}<span>${FISH[k].n}</span></div>`:`<div class="fc unknown"><span>???</span></div>`).join('')}</div>
    <h2>People, ${Object.keys(NPCS).filter(k=>!NPCS[k].hidden&&(A.people||{})[k]).length} of ${Object.keys(NPCS).filter(k=>!NPCS[k].hidden).length}</h2><div class="traitlist">${Object.entries(NPCS).filter(([k,N])=>!N.hidden).map(([k,N])=>(A.people||{})[k]?`<p><b>${N.n}.</b> ${N.role}</p>`:`<p class="soft">???</p>`).join('')}</div>
    <h2>Landmarks, ${cf} of ${Object.keys(CHARTS).length}</h2><div class="traitlist">${Object.keys(CHARTS).map(k=>A.charts[k]?`<p><b>${CHARTS[k].n}.</b> ${CHARTS[k].d}</p>`:`<p class="soft">???</p>`).join('')}</div></section>`;
  document.getElementById('back').onclick=title;
  app.querySelectorAll('.cargo [data-k]').forEach(b=>b.onclick=()=>itemSheet([{k:b.dataset.k,t:0}],0,'view',()=>{}));
  scrollTo(0,0);
}
