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
    <div class="hscene site" id="sitescene"><div class="hscroll" id="sitescroll"><svg class="hworld site" viewBox="0 0 400 250" role="img" aria-label="${head}">${siteArt(n,kind,v)}
      ${spots.map(s=>`<g class="spot${G.site.done.includes(s.k)?' done':''}" data-s="${s.k}" role="button" tabindex="0" aria-label="${s.l}" transform="translate(${s.x} ${s.y})"><circle class="hit" r="24"/><circle class="ring" r="13"/><g class="lbl" transform="translate(0 ${s.ly||-24})"><rect x="${-s.l.length*3.4-8}" y="-11" width="${s.l.length*6.8+16}" height="18" rx="7"/><text y="2.5" text-anchor="middle">${s.l}</text></g></g>`).join('')}</svg></div></div>
    <div class="sitepanel" id="siteout"><p class="log">${said}</p><p class="soft">Tap a spot to look closer.</p></div>
    ${holdDock(`<button class="primary" id="siteleave">Back to the sea</button>`)}`;
  bindBar();bindHold('hold',()=>siteScene(n));fitDock();portWeather();
  // on a phone the scene is wider than the screen and scrolls sideways like the harbour; it opens centred, or where you were
  const sc=document.getElementById('sitescroll');if(sc){const k=(G.site.sx!=null)?G.site.sx:.5;sc.scrollLeft=(sc.scrollWidth-sc.clientWidth)*k;
    sc.addEventListener('scroll',()=>{const w=sc.scrollWidth-sc.clientWidth;if(w>0)G.site.sx=sc.scrollLeft/w},{passive:true})}
  app.querySelectorAll('.spot').forEach(el=>{const go=()=>{const s=spots.find(x=>x.k===el.dataset.s);if(!s)return;if(G.site.done.includes(s.k)){el.classList.add('done');return}siteDo(n,kind,v,s,el)};
    el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  document.getElementById('siteleave').onclick=()=>{G.site=null;save();chart()};
  scrollTo(0,0)}
/* the spots to tap, by kind and variant */
function siteSpots(n,kind,v){const r=RNG(G.seed,'spots',n.id),dig=kind==='isle'&&r()<.55;
  return PLACEART[v].spots.filter(sp=>sp.k!=='dig'||dig).map(sp=>Object.assign({},sp))}
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
/* ---------- the art ----------
   Each variant is drawn with the ware-style-assets skill in tools/ware/places.py and bundled into placeart.js. The game
   adds only what changes: the overlays for spots you've used (or the dig mark before you dig), the ship's name painted
   on her bow, and your own ship riding at anchor offshore. */
function siteArt(n,kind,v){const A=PLACEART[v],done=k=>!!(G.site&&G.site.done.includes(k)),spots=siteSpots(n,kind,v),k=SHIPDRAW[G.ship]?G.ship:'sloop';
  // the generated art carries its own strokes; nothing should inherit the scene's default outline
  // every place sits in the same sky and sea (PLACEART.frame), then its own drawing on top
  let g=`<defs>${PLACEART.frame.defs}${A.defs}</defs><g stroke="none">${PLACEART.frame.base}${A.base}`;
  g+=`<g transform="translate(354 99) scale(.3)"><g class="shipdraw ship-${k}" stroke="#1f1c1d" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#fff">${SHIPDRAW[k]}</g></g>`;
  spots.forEach(sp=>{if(done(sp.k)&&A.over[sp.k])g+=A.over[sp.k]});
  if(spots.some(sp=>sp.k==='dig')&&!done('dig'))g+=A.over.x||'';
  g+='</g>';
  if(A.name){const nm=(placeName(n)||'').replace(/^The Wreck of the /,'').toUpperCase();
    g+=`<text class="s-name" x="${A.name.x}" y="${A.name.y}" text-anchor="middle" transform="rotate(${A.name.rot} ${A.name.x} ${A.name.y})">${nm}</text>`}
  return g}

/* ---------- the bottle moment ---------- */
/* a bottle bobs, the cork pops, a rolled page slides out of the neck and unrolls, and the words write themselves in. Then
   whatever comes next (body and buttons) appears under it. Returns the overlay. */
function bottleMoment(text,rest){const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ov=overlay(`<div class="bottlefx${still?' still':''}" aria-hidden="true"><svg viewBox="0 0 300 150">
      <g class="bf-bottle"><path class="bf-glass" d="M60 58H148Q166 58 172 72H200V92H172Q166 106 148 106H60Q46 106 46 82Q46 58 60 58Z"/><path class="bf-shine" d="M62 66H140"/><path class="bf-roll" d="M72 74H150V90H72Z"/><path class="bf-cork" d="M200 74H216V90H200Z"/></g>
      <g class="bf-scroll"><path class="bf-paper" d="M40 40H260V122H40z"/><path class="bf-lines" d="M60 62H240M60 78H230M60 94H236M60 110H180"/><path class="bf-end l" d="M34 36h12v90H34z"/><path class="bf-end r" d="M254 36h12v90h-12z"/></g></svg></div>
    <h2>A message in a bottle</h2><p class="log bf-text">${text}</p>${rest}`,true,'bottlecard');
  return ov}
