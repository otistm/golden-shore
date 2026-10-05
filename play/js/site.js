/* Golden Shore: Places up close. Sailing into an isle or a wreck opens its own scene, built like the harbour from a shared kit
   of parts: a side-on view with spots to tap. Each place is one of several variants, picked from the voyage seed, so no two
   look or play quite the same: isles are palm isles, rock stacks, volcanic cones or lighthouse isles; wrecks are fresh, old,
   on a reef or keel-up. Spots you've used stay used until you leave (G.site), and leaving spends the place.
   Also here: the bottle moment, where a message is pulled out of a bottle and unrolled. */
"use strict";
/* ---------- variants ---------- */
const ISLEVARS=['palm','palm','rock','volcanic','lighthouse'];
const WRECKVARS=['fresh','old','reef','keel'];
const isleVariant=n=>ISLEVARS[ri(RNG(G.seed,'variant',n.id),ISLEVARS.length)];
const wreckVariant=n=>WRECKVARS[ri(RNG(G.seed,'variant',n.id),WRECKVARS.length)];
const SITEKIND=n=>n.type==='isle'?'isle':n.type==='event'&&n.ev==='wreck'?'wreck':null;
/* a few words for each variant, on the card and in the scene */
const VARSEEN={
  palm:["Palms lean all the same way, as if listening to something across the water.","A green hump of an island with one good beach, and a lookout's height at its peak."],
  rock:["A stack of bare rock, white with gulls, and not a tree on it.","Cliffs straight up out of the sea, and somewhere a way to the top."],
  volcanic:["Black sand, warm underfoot, and a thread of smoke from the summit.","The rock is still warm here. The sea hisses where it meets the shore."],
  lighthouse:["A lighthouse stands on the point, its lamp dark. Nobody answers the door.","The light hasn't been lit in years. The stairs inside still look sound."],
  fresh:["She went down recently: the sails are still white and the cargo still dry.","Her flag still flies. Whatever sank her, it was quick."],
  old:["Weed to the rails and barnacles thick as fists. She's been here a long time.","Her figurehead stares out to sea, worn smooth as a stone."],
  reef:["Broken on the reef, lying on her side, the sea working at her with every wave.","Rock through her belly. She creaks when the swell comes in."],
  keel:["Turned turtle, keel to the sky, and something knocking inside.","Upside down and wallowing. There's a hole you could climb through."]};
/* captains' last words, found in the cabins of wrecks */
const WRECKLOG=[
  "The last page of the log: 'Struck at the second bell. All hands to the boats. God keep the cargo, since no one else will.'",
  "The log stops mid-sentence. The ink has run, but you can read 'lights under the water'.",
  "'Day 62. The new mapmaker swears there is land to the north. The crew say she is mad. I am starting to believe her.'",
  "A neat hand, a steady list of cargo, and then, in a different hand: 'Don't trust the fog.'",
  "'We followed the gulls, as the old men say. The gulls led us here.'",
  "The captain kept accounts to the last copper. The final line: 'Owed to the sea: everything.'"];
/* ---------- the scene ---------- */
function siteScene(n){const kind=SITEKIND(n);if(!kind)return chart();
  cancelAnimationFrame(raf);B=null;G.inPort=false;
  if(!G.site||G.site.id!==n.id)G.site={id:n.id,done:[]};save();
  const v=kind==='isle'?isleVariant(n):wreckVariant(n),spots=siteSpots(n,kind,v),head=placeName(n)||'A wreck',r=RNG(G.seed,'seen',n.id,'site');
  const said=VARSEEN[v][ri(r,VARSEEN[v].length)];
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>${head}</h2><span class="pwx">${placeKind(n)||''}<br>${WEATHER[portWxKey()].n}</span></div>
    <div class="hscene site" id="sitescene"><svg class="hworld site" viewBox="0 0 400 250" role="img" aria-label="${head}">${siteArt(n,kind,v)}
      ${spots.map(s=>`<g class="spot${G.site.done.includes(s.k)?' done':''}" data-s="${s.k}" role="button" tabindex="0" aria-label="${s.l}" transform="translate(${s.x} ${s.y})"><circle class="hit" r="24"/><circle class="ring" r="13"/><g class="lbl" transform="translate(0 ${s.ly||-24})"><rect x="${-s.l.length*3.4-8}" y="-11" width="${s.l.length*6.8+16}" height="18" rx="7"/><text y="2.5" text-anchor="middle">${s.l}</text></g></g>`).join('')}</svg></div>
    <div class="sitepanel" id="siteout"><p class="log">${said}</p><p class="soft">Tap a spot to look closer.</p></div>
    ${holdDock(`<button class="primary" id="siteleave">Back to the sea</button>`)}`;
  bindBar();bindHold('hold',()=>siteScene(n));fitDock();portWeather();
  app.querySelectorAll('.spot').forEach(el=>{const go=()=>{const s=spots.find(x=>x.k===el.dataset.s);if(!s)return;if(G.site.done.includes(s.k)){el.classList.add('done');return}siteDo(n,kind,v,s,el)};
    el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  document.getElementById('siteleave').onclick=()=>{G.site=null;save();chart()};
  scrollTo(0,0)}
/* the spots to tap, by kind and variant */
function siteSpots(n,kind,v){const r=RNG(G.seed,'spots',n.id),S=[];
  if(kind==='isle'){
    if(v==='lighthouse')S.push({k:'light',l:'Relight the lamp',x:262,y:66});
    else S.push({k:'peak',l:'Climb to the peak',x:v==='rock'?192:v==='volcanic'?198:214,y:v==='rock'?50:v==='volcanic'?66:110});
    S.push({k:'survey',l:'Survey the isle',x:108,y:186,ly:-28});
    if(r()<.55)S.push({k:'dig',l:'Dig here',x:292,y:212,ly:-22})}
  else if(v==='keel'){S.push({k:'hatch0',l:'Hatch',x:170,y:164,ly:-22},{k:'hatch1',l:'Hatch',x:250,y:160,ly:-22},{k:'cabin',l:"Captain's cabin",x:304,y:186,ly:26})}
  else{const a=(v==='reef'?-8:-4)*Math.PI/180,rot=(x,y)=>{const dx=x-210,dy=y-SB;return[Math.round(210+dx*Math.cos(a)-dy*Math.sin(a)),Math.round(SB+dx*Math.sin(a)+dy*Math.cos(a))]};
    [170,215,260].forEach((x,i)=>{const[px,py]=rot(x,146);S.push({k:'hatch'+i,l:'Hatch',x:px,y:py,ly:-22})});
    const[cx,cy]=rot(316,138);S.push({k:'cabin',l:"Captain's cabin",x:cx,y:cy,ly:30})}
  return S}
/* what happens at a spot */
function siteDo(n,kind,v,s,el){const out=document.getElementById('siteout'),depth=depthOf(n),r=RNG(G.seed,'spot',n.id,s.k);
  const done=()=>{G.site.done.push(s.k);el.classList.add('done');save()};
  const say=(h,cls)=>{out.innerHTML=h;if(cls)out.className='sitepanel '+cls;else out.className='sitepanel';out.classList.add('pop')};
  const offer=(it,lead)=>{const d=DEFS[it.k];
    say(`<p>${lead}</p><div class="siteloot"><span class="o-icon t${it.t} c-${kindOf(it.k)}">${icon(it.k)}</span><div><b>${TIER[it.t]} ${d.n}</b><span class="soft">${d.tags.map(x=>TAGN[x]).join(', ')}</span></div><button class="ghost" id="lootview">Look</button><button class="primary" id="loottake">Take it</button></div>`);
    document.getElementById('lootview').onclick=()=>itemSheet([it],0,'view',()=>{});
    document.getElementById('loottake').onclick=()=>{const m=addOrGold(it,'Took');logL(`${m.replace(/^Took/,'From '+(placeName(n)||'the wreck')+', took')}`);save();siteScene(n);setTimeout(()=>{const o=document.getElementById('siteout');if(o)o.innerHTML=`<p>${m}</p>`},0)}};
  if(s.k==='survey'){done();return chartPick(RNG(G.seed,'isle',n.id),'You walk the isle with your instruments.',()=>siteScene(n))}
  if(s.k==='peak'){done();const w=seaFragment('peak'+n.id);if(w)logL(`From the peak of ${placeName(n)} I could see ${w}. I drew it on my chart.`);save();
    return say(w?`<p>From the top you can see for miles. You draw what you see: ${w}.</p>`:'<p>From the top you can see for miles, but nothing you haven\'t already charted.</p>','good')}
  if(s.k==='light'){done();const a=seaFragment('light'+n.id),b=seaFragment('light2'+n.id),w=[a,b].filter(Boolean);
    logL(`Relit the lamp on ${placeName(n)}. By its light I charted ${w.length?w.join(' and '):'nothing new'}.`);save();
    return say(`<p>You climb the stairs and get the old lamp burning. Its beam sweeps the sea${w.length?`, and you chart what it shows: ${w.join(', and ')}`:''}.</p>`,'good')}
  if(s.k==='dig'){done();const g=8+ri(r,13);G.gold+=g;bump='gold';
    if(r()<.4){const it=randItem(r,depth+3);logL(`Dug up ${g} gold on ${placeName(n)}.`);return offer(it,`The spade hits wood: a little chest with ${g} gold in it, and something wrapped in oilcloth.`)}
    logL(`Dug up ${g} gold on ${placeName(n)}.`);save();siteScene(n);return}
  if(s.k==='cabin'){done();const line=WRECKLOG[ri(r,WRECKLOG.length)];let extra='';
    if(r()<.4){const w=seaFragment('log'+n.id);if(w)extra=` Tucked in the back of the log is a chart: ${w}.`}
    logL(`Read the log of ${placeName(n)}.${extra?' It held a chart.':''}`);save();return say(`<p class="log">${line}</p>${extra?`<p>${extra.trim()}</p>`:''}`)}
  if(s.k.startsWith('hatch')){done();const roll=r(),wItem=v==='fresh'?.55:v==='old'?.3:.42,wGold=wItem+(v==='old'?.35:.2),wNone=wGold+(v==='reef'?.08:.15);
    if(roll<wItem)return offer(randItem(r,depth+(v==='fresh'?4:3)),'The hatch creaks open on dry cargo.');
    if(roll<wGold){const g=4+ri(r,8)+(v==='old'?6:0);G.gold+=g;bump='gold';logL(`Found ${g} gold in ${placeName(n)}.`);save();siteScene(n);
      setTimeout(()=>{const o=document.getElementById('siteout');if(o)o.innerHTML=`<p>A purse in the dark: ${g} gold.</p>`},0);return}
    if(roll<wNone)return say('<p>Water, rats, and a smell you won\'t forget. Nothing worth taking.</p>');
    const h=v==='reef'?3:2;G.hull=Math.max(1,G.hull-h);logL(`${placeName(n)} rolled while I was in her hold. Lost ${h} hull.`);save();siteScene(n);
    setTimeout(()=>{const o=document.getElementById('siteout');if(o)o.innerHTML=`<p>The wreck groans and rolls. You get out, but your ship takes a beating: ${h} hull lost.</p>`},0)}}
/* ---------- the art: places up close ----------
   Drawn to the house rules (CLAUDE.md, "Drawing places"): a flat side elevation on one baseline (the waterline), depth from
   stacked bands and overlap only; two line weights (2.2 outlines, 1.2 detail); one flat tone per plane with the side plane a
   step darker in the same hue and hard flat shadows; sparse ruled pattern near edges and focal points; one bright accent;
   one telling detail per place; and the scene changes as you use it, with the camera held still.
   Every scene shares the same frame: sky, a far shore, your ship at anchor offshore, the place, and the near water. */
const SB=206;   // the baseline: where the place meets the sea
const sDot=(x,y)=>`<circle cx="${x}" cy="${y}" r=".9" class="k"/>`;
/* the frame every place shares: sun, slow clouds, a far shore, the sea in bands with wave marks thinning toward the horizon,
   and your own ship riding at anchor offshore (she's how you got here) */
function sFrame(n){const r=RNG(G.seed,'frame',n.id),k=SHIPDRAW[G.ship]?G.ship:'sloop';
  const farL=60+r()*40,farR=300+r()*50;
  let g=`<g class="hrays st-rays"><path d="M58 26v-8M58 66v8M38 46h-8M78 46h8M44 32l-6-6M72 60l6 6M44 60l-6 6M72 32l6-6" stroke-width="1.8"/></g><circle class="h-sun" cx="58" cy="46" r="15" stroke-width="2.2"/>
    <g class="st-drift" style="animation-delay:-40s">${sCloudP(130,34,1.2)}</g><g class="st-drift slow" style="animation-delay:-130s">${sCloudP(250,58,.9)}</g>
    <path class="s-far" d="M${farL-60} 118q30-16 60-6q24-10 50 0q14 4 20 6z" stroke="none"/><path class="s-far" d="M${farR-40} 118q26-18 56-4q20-8 44 4z" stroke="none"/>
    <path class="h-sea" d="M0 118H400V250H0z" stroke="none"/><path d="M0 118H400" stroke-width="1.4"/>
    <path class="h-water" d="M0 222H400V250H0z" stroke="none"/>`;
  // wave marks: short ruled arcs in rows, smaller and closer near the horizon
  const rows=[[126,6,.6],[136,8,.7],[150,10,.8],[168,12,.9],[234,16,1]];
  rows.forEach(([y,w,o],i)=>{for(let x=(i*37)%60;x<400;x+=58+i*14){if(y>140&&y<214&&x>60&&x<350)continue;g+=`<path d="M${x} ${y}q${w/4} -${w/5} ${w/2} 0t${w/2} 0" stroke-width="1.2" opacity="${o*.6}"/>`}});
  // your ship at anchor, with her chain going down
  g+=`<g transform="translate(6 92) scale(.36)"><g class="shipdraw ship-${k} st-ride" stroke-width="2.6" fill="#fff">${SHIPDRAW[k]}</g></g><path d="M12 124l-4 10" stroke-width="1.2" stroke-dasharray="2 2"/>`;
  return g}
const sCloudP=(x,y,s)=>`<g class="hcloud"><path class="w" transform="translate(${x} ${y}) scale(${s})" d="M0 0c-2-8 8-12 13-7 3-9 17-10 21-1 6-4 14 0 13 7 6 1 6 9-1 9H1c-6 0-7-6-1-8z" stroke-width="1.6"/></g>`;
/* the near water in front of everything: a foam edge where sea meets shore, in stepped frames */
const sFoam=(x0,x1,y)=>`<g class="st-foam"><path class="w" d="M${x0} ${y}${Array.from({length:Math.ceil((x1-x0)/14)},()=>'q3.5 -4 7 0t7 0').join('')}" stroke-width="1.2"/></g>`;
/* a palm: a curved, ringed trunk and a crown of fronds with their ribs, the back fronds a shade darker; the crown sways */
function sPalm(x,y,h,lean,s){s=s||1;const tx=lean,ty=-h;
  let g=`<g transform="translate(${x} ${y}) scale(${s})"><path class="s-trunk" d="M-4 0Q${tx/2-3} ${ty/2} ${tx-2} ${ty}h5Q${tx/2+3} ${ty/2} 5 0z" stroke-width="1.8"/>`;
  for(let i=1;i<5;i++){const t=i/5,px=tx*t*t*.6+tx*t*.4;g+=`<path d="M${f1(px-3.5)} ${f1(ty*t)}h7" stroke-width="1.2"/>`}
  const fr=(a,len,cls)=>{const c=Math.cos(a),sn=Math.sin(a),ex=c*len,ey=sn*len*.7+Math.abs(c)*len*.25;
    return`<path class="${cls}" d="M0 0Q${f1(ex*.5-sn*8)} ${f1(ey*.5-12)} ${f1(ex)} ${f1(ey)}Q${f1(ex*.5+sn*4)} ${f1(ey*.5-2)} 0 0z" stroke-width="1.6"/><path d="M0 0Q${f1(ex*.5-sn*5)} ${f1(ey*.5-8)} ${f1(ex)} ${f1(ey)}" stroke-width="1" fill="none"/>`};
  g+=`<g transform="translate(${tx+.5} ${ty})"><g class="st-sway">${[-2.6,-.5].map(a=>fr(a,24,'s-leaf2')).join('')}${[-3.1,-1.9,-1.1,0].map(a=>fr(a,26,'s-leaf')).join('')}
    <circle class="h-wood2" cx="-3" cy="3" r="2.6" stroke-width="1.2"/><circle class="h-wood2" cx="2.5" cy="4" r="2.6" stroke-width="1.2"/></g></g></g>`;
  return g}
/* your rowboat, pulled up on the shore (or tied alongside a wreck) */
const sRowboat=(x,y,flip)=>`<g transform="translate(${x} ${y}) scale(${flip?-1:1} 1)"><path class="h-hull" d="M-22 -8h44l-6 10h-32z"/><path class="h-hull2" d="M-19 -3h38l-3 5h-32z" stroke="none"/><path d="M-22 -8h44l-6 10h-32z" fill="none"/><path d="M-10 -8v5M8 -8v5" stroke-width="1.2"/><path d="M14 -8l14 -10" stroke-width="1.6"/><path class="h-wood" d="M26 -19l6 -4 2 3-6 4z" stroke-width="1.2"/></g>`;
/* a crab on the sand, scuttling in little stepped hops */
const sCrab=(x,y)=>`<g transform="translate(${x} ${y})"><g class="st-crab"><path class="s-crab" d="M-6 0q6 -8 12 0z" stroke-width="1.4"/><path d="M-6 -1l-4 -4M6 -1l4 -4M-4 0l-3 3M4 0l3 3" stroke-width="1.2"/><circle class="k" cx="-2" cy="-5" r=".9"/><circle class="k" cx="2" cy="-5" r=".9"/></g></g>`;
/* the Guild's pennant: where you surveyed from, and on a peak you've climbed */
const sPennant=(x,y,h)=>`<g transform="translate(${x} ${y})"><path d="M0 0v-${h}" stroke-width="2"/><g class="st-flag"><path class="h-flag" d="M0 -${h}l14 4.5-14 4.5z" stroke-width="1.4"/></g></g>`;
/* a surveyor's tripod, left after a survey */
const sTripod=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M0 -16l-7 16M0 -16l7 16M0 -16v16" stroke-width="1.4"/><path class="h-wood" d="M-6 -22h12v6h-12z" stroke-width="1.2"/><path d="M6 -19h5" stroke-width="1.6"/></g>`;
/* sand: a few dots near the waterline, never a texture over the whole beach */
const sSandDots=(x0,x1,y,n,r)=>{let g='';for(let i=0;i<n;i++)g+=sDot(f1(x0+r()*(x1-x0)),f1(y+r()*6));return`<g opacity=".45">${g}</g>`};
/* a dug hole with its chest knocked open and the spade stuck in the sand */
const sDug=(x,y)=>`<g transform="translate(${x} ${y})"><ellipse class="s-hole" rx="16" ry="4"/><path class="h-wood" d="M-9 -2h18v-8h-18z" stroke-width="1.6"/><path class="h-wood2" d="M-9 -10l3 -9h18l-3 9z" stroke-width="1.6"/><path d="M-9 -6h18" stroke-width="1.2"/><circle class="s-coin" cx="-2" cy="-11" r="2.4" stroke-width="1"/><circle class="s-coin" cx="3" cy="-12" r="2.4" stroke-width="1"/>
  <path d="M18 2l6 -22" stroke-width="2"/><path class="s-iron" d="M14 0l4 -6 6 2-2 6z" stroke-width="1.2"/></g>`;
/* rocks at the water's edge: a lit face and a shaded one */
const sRock=(x,y,w,h)=>`<g transform="translate(${x} ${y})"><path class="s-rock" d="M${-w} 0L${-w*.6} ${-h}L${w*.3} ${-h*1.1}L${w} ${-h*.3}L${w} 0Z" stroke-width="1.8"/><path class="s-rock2" d="M${w*.3} ${-h*1.1}L${w} ${-h*.3}L${w} 0L${w*.1} 0Z" stroke="none"/><path d="M${-w} 0L${-w*.6} ${-h}L${w*.3} ${-h*1.1}L${w} ${-h*.3}L${w} 0" fill="none" stroke-width="1.8"/></g>`;
function siteArt(n,kind,v){const r=RNG(G.seed,'siteart',n.id),done=k=>!!(G.site&&G.site.done.includes(k)),spots=siteSpots(n,kind,v);
  let g=sFrame(n);
  if(kind==='isle'){const black=v==='volcanic';
    // the beach and the wet sand along the waterline
    const beach=`<path class="${black?'s-bsand':'s-sand'}" d="M40 ${SB}Q200 ${SB-12} 360 ${SB}L352 ${SB+14}Q200 ${SB+24} 48 ${SB+14}Z" stroke-width="2"/><path class="${black?'s-bsand2':'s-sand2'}" d="M50 ${SB+10}Q200 ${SB+20} 350 ${SB+10}L352 ${SB+14}Q200 ${SB+24} 48 ${SB+14}Z" stroke="none"/>${sSandDots(80,320,SB+2,14,r)}`;
    if(v==='rock'){
      // a stack of rock in faces, white with gulls, a seal hauled out on the ledge
      g+=beach+`<path class="s-rock" d="M104 ${SB}L126 138L150 126L166 86L192 58L214 64L232 96L254 92L274 138L300 ${SB}Z" stroke-width="2.2"/>
        <path class="s-rock2" d="M214 64L232 96L254 92L274 138L300 ${SB}H244L236 150L222 110Z" stroke="none"/><path class="s-rock3" d="M166 86L192 58L200 92L178 118Z" stroke="none"/>
        <path d="M104 ${SB}L126 138L150 126L166 86L192 58L214 64L232 96L254 92L274 138L300 ${SB}" fill="none" stroke-width="2.2"/>
        <path d="M136 160l14 6M146 182l20 4M240 160l16 -4M250 184l18 2M196 120l12 4" stroke-width="1.2"/>
        <path class="s-guano" d="M178 76l4 14M196 62l-2 18M226 92l-4 14M252 96l2 12" stroke-width="3"/>
        ${[[172,82],[198,56],[230,90],[256,88]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path class="w" d="M-4 0q4 -6 8 0z" stroke-width="1.2"/><circle class="w" cx="3" cy="-4" r="2" stroke-width="1.1"/></g>`).join('')}
        <g transform="translate(276 ${SB-2})"><path class="s-seal" d="M-16 0q2 -10 14 -10q8 0 10 -6q6 2 4 8q-2 6 -8 8z" stroke-width="1.6"/><circle class="k" cx="9" cy="-12" r=".9"/><path d="M-16 0l-6 -3M-16 0l-6 3" stroke-width="1.4"/></g>`;
    }else if(black){
      // a cone in two planes, lava running down to hiss in the sea, smoke from the crater
      // the lava is drawn as an ink channel with the hot colour inside it, pooling in the crater and steaming where it meets the sea
      const lava=`M200 78l-5 30 9 22-7 30 5 ${SB-164}`;
      g+=beach+`<path class="s-ash" d="M88 ${SB}L176 76Q198 66 222 76L316 ${SB}Z" stroke-width="2.2"/><path class="s-ash2" d="M208 70Q216 72 222 76L316 ${SB}H254Z" stroke="none"/>
        <path d="M88 ${SB}L176 76Q198 66 222 76L316 ${SB}" fill="none" stroke-width="2.2"/>
        <path d="M184 84l-30 70M170 110l-10 26M232 92l26 60M244 130l12 30" stroke-width="1.2"/>
        <path d="M176 76q22 12 46 0" stroke-width="1.8"/><ellipse class="s-lavapool" cx="199" cy="76" rx="15" ry="3.2" stroke-width="1.4"/>
        <path d="${lava}" stroke-width="7.5" fill="none"/><path class="s-lava" d="${lava}" stroke-width="4" fill="none"/>
        ${sRock(150,SB-2,9,8)}${sRock(268,SB-2,8,7)}
        <g class="st-steam">${[0,1,2].map(i=>`<circle class="w" cx="${200+i*6}" cy="${SB-2-i*7}" r="${4+i*1.5}" stroke-width="1.2"/>`).join('')}</g>
        <g class="st-smoke">${[0,1,2].map(i=>`<circle class="s-smoke" cx="${200+i*5}" cy="${60-i*12}" r="${7+i*4}" stroke-width="1.4"/>`).join('')}</g>
        <path d="M128 ${SB-4}l-2 -18M126 ${SB-14}l-6 -6M127 ${SB-18}l5 -5" stroke-width="1.6"/>`;
    }else{
      const lh=v==='lighthouse',top=lh?136:118;
      // a green hill: the lit face and the shaded one, a grass edge along the crest
      g+=beach+`<path class="s-land" d="M70 ${SB}C108 ${top+40} 168 ${top} 214 ${top}C266 ${top+2} 300 ${top+40} 330 ${SB}Z" stroke-width="2.2"/>
        <path class="s-land2" d="M214 ${top}C266 ${top+2} 300 ${top+40} 330 ${SB}H268C268 ${top+50} 244 ${top+14} 214 ${top}Z" stroke="none"/>
        <path d="M70 ${SB}C108 ${top+40} 168 ${top} 214 ${top}C266 ${top+2} 300 ${top+40} 330 ${SB}" fill="none" stroke-width="2.2"/>
        <path d="${[...Array(9)].map((_,i)=>{const x=110+i*20,y=top+Math.pow((x-214)/110,2)*58;return`M${x} ${f1(y+1)}l-2 -5M${x+3} ${f1(y+1)}l1 -6`}).join('')}" stroke-width="1.2"/>
        ${sRock(84,SB+2,14,10)}${sRock(318,SB+2,12,8)}`;
      if(lh){
        // the lighthouse on the rise, banded, its gallery and lamp room; the keeper's cottage at its foot, empty
        const lit=done('light'),x=262,b=150;
        g+=`<g transform="translate(${x} ${b})"><path class="h-wall" d="M-12 0L-9 -72H9L12 0Z" stroke-width="2.2"/><path class="h-wall2" d="M3 -72H9L12 0H5Z" stroke="none"/>
          <path class="s-band" d="M-11.2 -18L-10.5 -30H10.5L11.2 -18ZM-10 -46L-9.5 -56H9.5L10 -46Z" stroke="none"/><path d="M-12 0L-9 -72H9L12 0Z" fill="none" stroke-width="2.2"/>
          <path class="h-door" d="M-4 0v-11q4 -4 8 0v11z" stroke-width="1.4"/><path d="M-14 -72h28M-14 -72v-4M14 -72v-4M-14 -76h28M-6 -76v4M0 -76v4M6 -76v4" stroke-width="1.2"/>
          <path class="${lit?'s-lamp':'h-win'}" d="M-7 -76v-12h14v12z" stroke-width="1.6"/><path d="M0 -88v12" stroke-width="1"/>
          <path class="h-roof" d="M-9 -88h18l-9 -10z" stroke-width="1.8"/><path d="M0 -98v-8M-4 -104h8" stroke-width="1.2"/>
          ${lit?`<g transform="translate(0 -82)"><g class="st-beam"><path class="s-beam" d="M0 0L-90 -14L-90 14Z" stroke-width="1.2"/><path class="s-beam" d="M0 0L90 -14L90 14Z" stroke-width="1.2"/></g></g>`:''}</g>
          <g transform="translate(222 156)"><path class="h-wall" d="M-16 0v-18h32v18z" stroke-width="1.8"/><path class="h-roof" d="M-20 -18l20 -14 20 14z" stroke-width="1.8"/><path class="h-roof2" d="M0 -32l20 14H6z" stroke="none"/><path d="M-20 -18l20 -14 20 14" fill="none" stroke-width="1.8"/>
          <path class="${lit?'h-winlit':'h-win'}" d="M-11 -12h8v7h-8z" stroke-width="1.2"/><path class="h-door" d="M4 0v-11h7v11z" stroke-width="1.2"/><path d="M10 -32v-6h5v4" stroke-width="1.6"/></g>
          <path d="M240 ${SB-2}l6 -10l-2 -12l8 -10l-2 -10" stroke-width="1.2" stroke-dasharray="3 4"/>`;
        g+=sPalm(140,170,40,-6,1);
      }else g+=sPalm(146,168,44,-8,1)+sPalm(178,150,56,-4,1.05)+sPalm(250,152,48,8,1)+sPalm(292,180,30,10,.9);
    }
    // what you've done here stays done
    if(done('peak')){const p=spots.find(s=>s.k==='peak');if(p)g+=sPennant(p.x+2,p.y+8,22)}
    g+=sPennant(108,SB+4,26);
    if(done('survey'))g+=sTripod(126,SB+6);
    const dig=spots.find(s=>s.k==='dig');if(dig)g+=done('dig')?sDug(dig.x,dig.y+6):`<path class="s-x" d="M${dig.x-8} ${dig.y-6}l16 12M${dig.x+8} ${dig.y-6}l-16 12" stroke-width="3"/>`;
    g+=sRowboat(338,SB+16)+(v!=='rock'?sCrab(204,SB+9):'');
  }else{
    const shipName=(placeName(n)||'').replace(/^The Wreck of the /,'').toUpperCase(),old=v==='old',hc=old?'s-hullold':'h-hull',hc2=old?'s-hullold2':'h-hull2';
    g+=sRock(66,SB+4,16,12)+sRock(344,SB+6,14,10);
    if(v==='keel'){
      // turned turtle: the keel to the sky, copper sheathing gone green, a hole you could climb through, a gull on the keel
      // the hull's bottom: copper plates in rows near the keel, the painted wood showing below them at the waterline
      g+=`<path class="s-copper" d="M76 ${SB}Q90 156 210 142Q330 156 344 ${SB}Z" stroke-width="2.2"/><path class="s-copper2" d="M210 142Q330 156 344 ${SB}H276Q268 164 210 142Z" stroke="none"/>
        <path class="h-hull" d="M84 ${SB-14}Q210 ${SB-34} 336 ${SB-14}L344 ${SB}H76Z" stroke-width="1.6"/><path class="h-hull2" d="M262 ${SB-24}Q300 ${SB-22} 336 ${SB-14}L344 ${SB}H262Z" stroke="none"/>
        <path d="M76 ${SB}Q90 156 210 142Q330 156 344 ${SB}" fill="none" stroke-width="2.2"/>
        <path d="M104 172q106 -34 212 0M96 186q114 -30 228 0" stroke-width="1.2" fill="none"/>
        ${[136,162,188,214,240,266,292].map(x=>{const y=144+Math.pow((x-210)/134,2)*48;return`<path d="M${x} ${f1(y+4)}v9" stroke-width="1.2" opacity=".7"/>`}).join('')}
        <path d="M80 ${SB-8}H340" stroke-width="1.2" opacity=".5"/>
        <path d="M110 162Q150 144 210 142Q270 144 310 162" fill="none" stroke-width="6.5"/><path d="M110 162Q150 144 210 142Q270 144 310 162" fill="none" stroke-width="3.2" stroke="var(--wood2)"/>
        <path class="h-wood2" d="M336 ${SB}l10 -34h7l-3 34z" stroke-width="1.8"/><path d="M340 ${SB-14}h10" stroke-width="1.2"/>
        <path class="s-weed" d="M110 ${SB}q4 10 -2 18M200 ${SB+2}q-4 9 2 16M300 ${SB}q5 8 0 14" fill="none" stroke-width="2.4"/>
        <g transform="translate(222 124)"><path class="w" d="M-6 2q6 -9 12 0z" stroke-width="1.2"/><circle class="w" cx="4" cy="-4" r="2.6" stroke-width="1.1"/><path class="s-beak" d="M6 -4l4 1-4 1z" stroke="none"/><path d="M-2 2v4M2 2v4" stroke-width="1"/></g>`;
    }else{
      // a hull on her side: planked, her wale and gunports, broken open amidships; the mast snapped, the sail over the side;
      // the stern with her gallery windows and her name painted across it
      g+=`<g transform="rotate(${v==='reef'?-8:-4} 210 ${SB})">
        <path class="${hc}" d="M86 ${SB}L90 170Q94 156 108 154L292 150L300 130L336 126L342 ${SB}Z" stroke-width="2.2"/>
        <path class="${hc2}" d="M89 182H339L342 ${SB}H86Z" stroke="none"/><path class="${hc2}" d="M318 128L336 126L342 ${SB}H322Z" stroke="none"/>
        <path d="M86 ${SB}L90 170Q94 156 108 154L292 150L300 130L336 126L342 ${SB}Z" fill="none" stroke-width="2.2"/>
        <path d="M100 166Q200 162 296 162L338 160M90 182H339" stroke-width="2.2" fill="none"/><path d="M96 194H340" stroke-width="1.2" opacity=".55"/>
        ${[140,166,192,218].map(x=>`<g><path class="h-win" d="M${x} 168h9v8h-${9}z" stroke-width="1.2"/><path class="${hc}" d="M${x} 168l-2 -6h11l2 6z" stroke-width="1.1"/></g>`).join('')}
        <path class="s-breach" d="M238 ${SB}l2 -16 8 -6 4 -10 9 6 7 -8 6 10 8 2 2 22z" stroke-width="1.8"/>
        <path d="M248 ${SB-1}v-18M258 ${SB-1}v-24M268 ${SB-1}v-22M278 ${SB-1}v-14" stroke="var(--wood)" stroke-width="3.2"/><path d="M248 ${SB-19}v-1M258 ${SB-25}v-1" stroke-width="1.2"/>
        <path class="s-deck" d="M108 154L122 146H288L292 150Z" stroke-width="1.8"/><path d="M300 130L304 122H334L336 126" fill="none" stroke-width="1.8"/>
        ${[0,1,2].map(i=>`<path class="${done('cabin')&&i===1?'h-winlit':'h-win'}" d="M${308+i*8} 134h6v8h-6z" stroke-width="1"/>`).join('')}<path d="M304 146H336" stroke-width="1.2"/>
        <rect class="h-trim" x="${248-shipName.length*2.6}" y="153" width="${shipName.length*5.2+12}" height="10" rx="1.5" stroke-width="1.2"/><text class="s-name" x="${254}" y="160.6" text-anchor="middle">${shipName}</text>
        <path d="M108 154L74 144M84 147l-4 -6" stroke-width="2.4"/>
        <path d="M200 150l-6 -44l3 -6l-6 -4" stroke-width="4"/><path d="M196 112l70 -10" stroke-width="2.4"/>
        <g class="st-flap"><path class="${old?'s-sailold':'s-sail'}" d="M262 102l18 -2l4 40l-4 6l-5 -5l-4 7l-5 -6l-4 4z" stroke-width="1.8"/><path d="M270 112l9 -1M268 126l11 -1" stroke-width="1.2"/></g>
        <path d="M194 104q30 30 72 0M194 104Q150 130 110 152M194 106Q240 120 300 130" stroke-width="1" fill="none"/>
        ${old?'<path class="s-weed" d="M110 200q6 10 0 18M180 204q-4 10 2 16M280 204q5 9-1 14" fill="none" stroke-width="2.4"/>'+[[130,196],[160,198],[220,200],[300,198]].map(([x,y])=>sDot(x,y)).join(''):''}
        </g>`;
      if(v==='reef')g+=`${sRock(176,SB+6,22,16)}<g class="st-foam">${[0,1].map(i=>`<path class="w" d="M${150+i*40} ${SB+2}q6 -8 12 -2q4 -8 10 -2" stroke-width="1.2"/>`).join('')}</g>`;
    }
    // opened hatches stay open
    spots.filter(s=>s.k.startsWith('hatch')&&done(s.k)).forEach(s=>{g+=`<g transform="translate(${s.x} ${s.y+2})"><path class="s-hole" d="M-7 -3h14v6h-14z" stroke-width="1.4"/><path class="h-wood" d="M-7 -3l-4 -9h14l4 9" stroke-width="1.4"/></g>`});
    // a barrel from her hold, floating on its side
    g+=`<g class="st-bob"><g transform="translate(126 ${SB+20})"><path class="h-wood" d="M-11 -7h22q5 7 0 14h-22q-5 -7 0 -14z" stroke-width="1.6"/><path class="h-wood2" d="M4 -7h7q5 7 0 14h-7z" stroke="none"/><path d="M-11 -7h22q5 7 0 14h-22q-5 -7 0 -14z" fill="none" stroke-width="1.6"/><path d="M-5 -7v14M5 -7v14" stroke-width="1.2"/></g></g>`+sRowboat(356,SB+20,1);
  }
  return g+sFoam(30,370,SB+(kind==='isle'?16:4))}

/* ---------- the bottle moment ---------- */
/* a bottle bobs, the cork pops, a rolled page slides out of the neck and unrolls, and the words write themselves in. Then
   whatever comes next (body and buttons) appears under it. Returns the overlay. */
function bottleMoment(text,rest){const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ov=overlay(`<div class="bottlefx${still?' still':''}" aria-hidden="true"><svg viewBox="0 0 300 150">
      <g class="bf-bottle"><path class="bf-glass" d="M60 58H148Q166 58 172 72H200V92H172Q166 106 148 106H60Q46 106 46 82Q46 58 60 58Z"/><path class="bf-shine" d="M62 66H140"/><path class="bf-roll" d="M72 74H150V90H72Z"/><path class="bf-cork" d="M200 74H216V90H200Z"/></g>
      <g class="bf-scroll"><path class="bf-paper" d="M40 40H260V122H40z"/><path class="bf-lines" d="M60 62H240M60 78H230M60 94H236M60 110H180"/><path class="bf-end l" d="M34 36h12v90H34z"/><path class="bf-end r" d="M254 36h12v90h-12z"/></g></svg></div>
    <h2>A message in a bottle</h2><p class="log bf-text">${text}</p>${rest}`,true,'bottlecard');
  return ov}
