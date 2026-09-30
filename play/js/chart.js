/* Ink Crossing: The voyage chart (map), previews and sailing to a stop. */
"use strict";
/* ---------- the chart (map) ---------- */
const NG={
  port:'<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v13M8 9.5h8M5 15c1 3.5 3.5 5 7 5s6-1.5 7-5"/>',
  threat:'<path d="M5 4l13 13M19 4L6 17M4 15l5 5M20 15l-5 5"/>',
  elite:'<path class="gw" d="M5 11a7 7 0 0 1 14 0c0 3-1.5 4-2 5v3H7v-3c-.5-1-2-2-2-5z"/><circle class="gk" cx="9.5" cy="11" r="1.6"/><circle class="gk" cx="14.5" cy="11" r="1.6"/><path d="M10 19v-2M14 19v-2"/>',
  event:'<path d="M8.5 8.5c0-4.5 7-4.5 7 0 0 3-3.5 3-3.5 6"/><circle class="gk" cx="12" cy="18.5" r="1.4"/>',
  npc:'<circle class="gw" cx="12" cy="8" r="4"/><path class="gw" d="M4 21c1-6 4-8 8-8s7 2 8 8z"/>',
  fish:'<path class="gw" d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0z"/><path class="gw" d="M17 12l4-3v6z"/><circle class="gk" cx="7" cy="11.3" r="1"/>',
  isle:'<path d="M3 19c4-3 14-3 18 0"/><path d="M12 18c0-4 .5-8 2-10"/><path d="M14 8c-3-2-6-1-7 1M14 8c2-3 5-3 6-1M14 8c1 2 1 4 0 6"/>',
  boss:'<path d="M4 21c-1-7 2-12 6-12s5 5 2 6-3-3-1-3"/><path d="M20 21c1-6-1-11-5-12"/><path d="M12 9c0-3 1-5 3-6"/>'
};
/* The map is laid out 340 wide. fit (big screens only) redraws it at the size of the space it has: stops spread sideways, rows spread down. */
function mapSVG(fit){
  const W=fit?fit.W:340,RH=fit?fit.RH:84,X=n=>n.x*W/340;
  const m=G.map,H=6*RH+84,y=row=>H-40-row*RH,cur=node(G.at),reach=new Set(reachable()),rev=G.reveal;
  const trav=new Set();for(let i=1;i<G.path.length;i++)trav.add(G.path[i-1]+'>'+G.path[i]);
  const vis=n=>n.row<=rev||n.type==='boss'||G.path.includes(n.id);
  let g='';
  if(rev<5)g+=`<rect x="-6" y="0" width="${W+12}" height="${y(rev)-RH/2}" fill="url(#fog)"/><text class="fogtxt" x="${W-8}" y="${y(rev)-RH/2-8}" text-anchor="end">here be monsters</text>`;
  m.edges.forEach(([a,b])=>{const A2=node(a),B2=node(b);if(!(trav.has(a+'>'+b)||(A2.row<=rev&&(B2.row<=rev||B2.type==='boss'))))return;
    const ya=y(A2.row),yb=y(B2.row),mx=(X(A2)+X(B2))/2+((a*7+b*3)%9-4),my=(ya+yb)/2;
    const t=trav.has(a+'>'+b),r=a===G.at;
    g+=`<path d="M${X(A2)} ${ya-18}Q${mx} ${my} ${X(B2)} ${yb+(B2.type==='boss'?25:18)}" fill="none" stroke="#000" stroke-linecap="round" ${t?'stroke-width="2.8"':r?'stroke-width="2" stroke-dasharray="1 6"':'stroke-width="1.4" stroke-dasharray="1 6" opacity=".45"'}/>`});
  m.nodes.forEach(n=>{if(!vis(n))return;
    const big=n.type==='boss',rr=big?24:18,known=n.row<=rev||G.path.includes(n.id),isR=reach.has(n.id),v=G.path.includes(n.id)&&n.id!==G.at;
    const gl=known?NG[n.type]:NG.event;
    g+=`<g class="node${isR?' reach':''}${v?' visited':''}${!isR&&!v&&n.id!==G.at?' dim':''}" data-id="${n.id}" ${isR?`tabindex="0" role="button" aria-label="Sail to ${nodeTitle(n)}"`:''} transform="translate(${X(n)} ${y(n.row)})">
      ${isR?`<circle class="ring" r="${rr+4}" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="3 4"/>`:''}
      <g class="body"><circle r="${rr}" fill="#fff" stroke="#000" stroke-width="${big?3:2.2}"/><g class="glyph" transform="translate(${big?-13:-10} ${big?-13:-10}) scale(${big?1.08:.83})" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${gl}</g></g>
      ${big?`<text class="maplabel" y="-32" text-anchor="middle">${known?ENEMIES[n.enemy].n:'Something waits'}</text>`:''}</g>`});
  G.charts.forEach((c,i)=>{if(c.sea!==G.sea)return;const n=node(c.at);if(!n)return;const side=n.x>170?-1:1;
    g+=`<g transform="translate(${X(n)+side*30-11} ${y(n.row)-11}) scale(.733)" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${CHARTS[c.k].g}</g>`});
  g+=`<g transform="translate(${X(cur)-12} ${y(cur.row)-(cur.type==='boss'?54:46)})"><g class="boatbob" stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#fff"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z"/></g></g>`;
  return`<svg viewBox="-6 0 ${W+12} ${H}" aria-label="Chart of ${SEAS[G.sea]}"><defs><pattern id="fog" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="#000" opacity=".28"/><circle cx="6.5" cy="6.5" r=".9" fill="#000" opacity=".18"/></pattern></defs>${g}</svg>`;
}
function nodeTitle(n){if(n.type==='port')return n.name;if(n.type==='npc')return NPCS[n.npc].n;if(n.type==='fish')return'Fishing grounds';if(n.type==='event')return'Unknown waters';if(n.type==='isle')return'An uncharted isle';return'the '+ENEMIES[n.enemy].n}
function chart(){
  cancelAnimationFrame(raf);B=null;G.inPort=false;
  if(G.sel==null)G.moving=false;
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>${G.tut?'Gullhaven harbour':SEAS[G.sea]}</h2><span>${G.tut?'Tutorial':`Sea ${G.sea+1} of 3`}</span></div>
    <div class="chartwrap"><div class="map">${mapSVG()}</div><aside class="route" id="route" aria-live="polite"></aside></div><p class="tapnote">Tap a marked spot to see what's there.</p>
    ${holdDock('')}`;
  bindBar();bindHold('hold',chart);fitDock();
  bindNodes();fitMap();
  routeHome();
  const cur=app.querySelector('.boatbob');if(cur){const r=cur.getBoundingClientRect();window.scrollTo({top:Math.max(0,r.top+scrollY-innerHeight*.35),behavior:'instant'})}
  save();coach('chart');tip('chart');
}
function bindNodes(){app.querySelectorAll('.node.reach').forEach(el=>{const go=()=>preview(node(+el.dataset.id));el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}})}
/* big screens: redraw the chart to fill the space beside the route panel and above the hold */
function fitMap(){
  const m=app.querySelector('.chartwrap .map');if(!m||!G)return;
  const on=document.body.classList.contains('desk');if(!on&&!m.dataset.fit)return;
  const picked=m.querySelector('.node.picked');let fit=null;
  if(on){const cs=getComputedStyle(m),r=m.getBoundingClientRect(),d=app.querySelector('.dock');
    const w=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),h=innerHeight-r.top-(d?d.offsetHeight:0)-24-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    fit={W:Math.max(340,Math.min(960,Math.round(w-12))),RH:Math.max(62,Math.min(120,Math.round((h-84)/6)))}}
  m.dataset.fit=on?'1':'';m.innerHTML=mapSVG(fit);bindNodes();
  if(picked)pickNode(+picked.dataset.id);
}
addEventListener('resize',()=>{if(app.querySelector('.chartwrap'))fitMap()});
function traitsHTML(e,sea){return`<div class="traitlist">${e.traits.map(k=>`<p><b>${TRAITS[k].n}.</b> ${TRAITS[k].d(sea)}</p>`).join('')}</div>`}
function preview(n){
  let body='',head=nodeTitle(n);head=head[0].toUpperCase()+head.slice(1);
  if(n.type==='port')body=`<p>A port market. Buy and sell cargo, and earn ${4+G.sea*2} gold for trading when you arrive.</p>`;
  if(n.type==='event')body=`<p>Something is out there. It could help or hurt.</p>`;
  if(n.type==='isle')body=`<p>Land no map shows. Draw a new landmark on your chart.</p>`;
  if(n.type==='npc'){const N=NPCS[n.npc];body=`<div class="npc">${portrait(N.look)}<div><p><b>${N.role}.</b> Someone to talk to. They may trade, help, or ask for something.</p></div></div>`}
  if(n.type==='fish')body=`<p>The water boils with fish. ${3+G.tip} casts. Sell what you catch at port.</p>`;
  if(n.type==='port'&&n.visitor)body+=`<p class="soft">Someone is waiting on the dock.</p>`;
  if(n.enemy){const f=enemyOf(n),e=f.e,k=e.kind;A.met[n.enemy]=1;saveA();
    body=`<p class="soft">${k==='b'?'The guardian of this sea. Beat it to sail on.':k==='e'?'Elite. Tougher, with better spoils.':'A threat on the route.'} ${f.hp} health.</p>${traitsHTML(e,G.sea)}
      ${hasC('sound')?`<div class="mini-board"><p class="label" style="margin:6px 0">Their cargo</p>${boardHTML(f.list,'e')}</div>`:''}
      <p class="soft">Win: ${k==='b'?`${15+G.sea*10} gold and passage to the next sea`:k==='e'?`${10+f.depth} gold, a pick of cargo and a landmark`:`${5+Math.floor(f.depth/2)} gold and a pick of cargo`}. Lose: ${lossOf(k)} hull${k==='b'?' and fall back to port':''}.</p>`}
  if(n.enemy&&ENEMIES[n.enemy].kind==='b')tip('boss');else if(n.enemy&&ENEMIES[n.enemy].kind==='e')tip('elite');
  // on a big screen the route panel beside the chart shows the stop, no pop-up
  const r=document.getElementById('route');
  if(r&&r.offsetParent){
    r.onmouseover=r.onmouseleave=null;pickNode(n.id);
    r.innerHTML=`<h2>${head}</h2>${body}<div class="sh-actions"><button class="ghost" data-a="close">Back</button><button class="primary" data-a="go">Sail here</button></div>`;
    r.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='go')go(n.id);else routeHome()};
    r.querySelector('[data-a="go"]').focus({preventScroll:true});return}
  const ov=overlay(`<h2>${head}</h2>${body}<div class="sh-actions"><button class="ghost" data-a="close">Not yet</button><button class="primary" data-a="go">Sail here</button></div>`);
  ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')go(n.id)});
  ov.querySelector('[data-a="go"]').focus();
}
/* the route panel beside the chart (big screens only): every stop you can sail to next */
const KIND={port:'Port market',threat:'Threat',elite:'Elite',boss:'Guardian of this sea',event:'Unknown waters',npc:'Someone to meet',fish:'Fishing grounds',isle:'Uncharted isle'};
function pickNode(id){app.querySelectorAll('.node.picked').forEach(e=>e.classList.remove('picked'));if(id!=null){const el=app.querySelector(`.node[data-id="${id}"]`);if(el)el.classList.add('picked')}}
function routeHome(){
  const r=document.getElementById('route');if(!r)return;pickNode(null);
  r.innerHTML=`<h2>Where to next?</h2><p class="soft">Pick a stop here or on the chart to see what's there.</p>
    <div class="stops">${reachable().map(id=>{const n=node(id),t=nodeTitle(n);
      return`<button class="stop" data-id="${id}"><svg viewBox="0 0 24 24" aria-hidden="true">${NG[n.type]}</svg><span><b>${t[0].toUpperCase()+t.slice(1)}</b><span class="soft">${n.type==='npc'?NPCS[n.npc].role:KIND[n.type]}</span></span></button>`}).join('')}</div>`;
  r.onclick=e=>{const b=e.target.closest('[data-id]');if(b)preview(node(+b.dataset.id))};
  r.onmouseover=e=>{const b=e.target.closest('[data-id]');pickNode(b?+b.dataset.id:null)};
  r.onmouseleave=()=>pickNode(null);
}
const lossOf=k=>k==='b'?4+G.sea*2:k==='e'?3+G.sea:2+G.sea;
function go(id){
  coach('sail');
  G.at=id;G.path.push(id);G.day++;G.moving=false;G.sel=null;updateReveal();save();
  const n=node(id);
  if(n.type==='port')port(id);
  else if(n.enemy)fight(n);
  else if(n.type==='event')eventAt(n);
  else if(n.type==='isle'){chart();chartPick(RNG(G.seed,'isle',n.id),'Found an uncharted isle.',chart)}
  else if(n.type==='npc'){chart();talk(n.npc,n.id,chart)}
  else if(n.type==='fish'){const c=3+G.tip;G.tip=0;fishing(n.id,c,chart)}
}
