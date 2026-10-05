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
  app.querySelectorAll('.spot').forEach(el=>{const go=()=>{const s=spots.find(x=>x.k===el.dataset.s);if(!s||G.site.done.includes(s.k))return;siteDo(n,kind,v,s,el)};
    el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  document.getElementById('siteleave').onclick=()=>{G.site=null;save();chart()};
  scrollTo(0,0)}
/* the spots to tap, by kind and variant */
function siteSpots(n,kind,v){const r=RNG(G.seed,'spots',n.id),S=[];
  if(kind==='isle'){
    if(v==='lighthouse')S.push({k:'light',l:'Relight the lamp',x:262,y:62});else S.push({k:'peak',l:'Climb to the peak',x:v==='rock'?200:205,y:v==='rock'?70:v==='volcanic'?92:108});
    S.push({k:'survey',l:'Survey the isle',x:112,y:186,ly:-26});
    if(r()<.55)S.push({k:'dig',l:'Dig here',x:300,y:206,ly:-24})}
  else{const h=v==='keel'?2:3;for(let i=0;i<h;i++)S.push({k:'hatch'+i,l:'Hatch',x:v==='keel'?170+i*70:150+i*52,y:v==='keel'?170:164-i*2,ly:-22});
    S.push({k:'cabin',l:"Captain's cabin",x:v==='keel'?120:300,y:v==='keel'?186:168,ly:24})}
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
/* ---------- the art: one side-on scene per kind, made from shared parts ---------- */
const sCloud=(x,y,s)=>`<g class="hcloud"><path class="w" transform="translate(${x} ${y}) scale(${s})" d="M0 0c-2-8 8-12 13-7 3-9 17-10 21-1 6-4 14 0 13 7 6 1 6 9-1 9H1c-6 0-7-6-1-8z" stroke-width="1.6"/></g>`;
const sSea=()=>`<path class="h-sea" d="M0 150H400V250H0z" stroke="none"/><path d="M0 150H400" stroke-width="1.4"/>
  ${[[30,170],[120,232],[330,178],[260,236],[60,214],[370,220]].map(([x,y])=>`<path d="M${x} ${y}q4-4 8 0t8 0t8 0" stroke-width="1.3" opacity=".5"/>`).join('')}`;
const sSun=()=>`<g class="hrays"><path d="M60 30v-8M60 86v8M32 58h-8M88 58h8M40 38l-6-6M80 78l6 6M40 78l-6 6M80 38l6-6" stroke-width="1.8"/></g><circle class="h-sun" cx="60" cy="58" r="18" stroke-width="2.2"/>`;
const sPalm=(x,y,s,r)=>`<g transform="translate(${x} ${y}) scale(${s})">${palm(r)}</g>`;
function siteArt(n,kind,v){const r=RNG(G.seed,'siteart',n.id);let g=sSun()+sCloud(150,40,1.3)+sCloud(300,64,1)+sSea();
  if(kind==='isle'){
    const sand=v==='volcanic'?'s-blacksand':'s-sand';
    g+=`<path class="${sand}" d="M40 200Q200 166 360 200L356 212Q200 232 44 212Z"/>`;
    if(v==='rock')g+=`<path class="s-rock2" d="M108 202L132 130L152 120L170 84L196 62L222 92L246 86L270 132L298 202Z"/><path class="s-rock" d="M132 130L152 120L170 84L196 62L208 98L180 110L160 150Z"/><path d="M160 150l12 26M232 110l-10 30M200 120l4 20" stroke-width="1.4"/>
      ${[[180,58],[214,52],[240,70],[160,74]].map(([x,y])=>`<path d="M${x} ${y}q3-4 6 0q3-4 6 0" stroke-width="1.6"/>`).join('')}<path class="s-guano" d="M178 66l6 14M200 64l-4 20M238 92l-6 16" stroke-width="3"/>`;
    else if(v==='volcanic')g+=`<path class="s-ash" d="M96 202L178 98L222 98L306 202Z"/><path class="s-ash2" d="M200 98L222 98L306 202L240 202Z"/><path d="M178 98q22 8 44 0" stroke-width="1.6"/><path class="s-lava" d="M196 100l-8 30 10 20-6 30" stroke-width="3" fill="none"/>
      ${[0,1,2].map(i=>`<circle class="o-smoke" style="animation-delay:${-i*1.1}s" cx="${200+i*4}" cy="${88-i*6}" r="${8+i*3}"/>`).join('')}`;
    else{g+=`<path class="s-land2" d="M88 198Q140 118 210 112Q290 118 322 198Z"/><path class="s-land" d="M88 198Q140 118 210 112Q238 114 258 124Q200 140 170 198Z"/>`;
      g+=sPalm(140,170,1.3,r)+sPalm(176,150,1.5,r)+(v==='palm'?sPalm(240,150,1.4,r)+sPalm(276,176,1.2,r):'')}
    if(v==='lighthouse')g+=`<g transform="translate(262 128)"><path class="h-wall" d="M-12 0V-62H12V0z"/><path class="h-roof" d="M-12 -22h24v-8h-24zM-12 -46h24v-6h-24z"/><path class="h-win" d="M-8 -62h16v-12h-16z"/><path class="h-roof" d="M-13 -74h26l-13 -14z"/><path d="M-12 0a12 4 0 0 0 24 0" fill="none"/><path class="h-door" d="M-4 0v-10h8v10z"/></g>`;
    g+=`<g transform="translate(112 196)"><path d="M0 0v-22" stroke-width="2"/><path class="h-flag" d="M0 -22l12 4-12 4z"/></g>`;   // where you'd survey from
    if(G.site&&siteSpots(n,kind,v).some(s=>s.k==='dig'))g+=`<path d="M292 200l16 12M308 200l-16 12" stroke-width="3" class="s-x"/>`;
  }else{
    g+=`<path class="s-rock2" d="M60 214l20-26 24 8 18-14 16 32z"/><path class="s-rock2" d="M300 216l16-30 22 10 14 20z"/>`;
    if(v==='keel')g+=`<path class="s-hull2" d="M70 200Q90 140 210 128Q330 140 350 200Z"/><path d="M90 168Q210 112 330 168" stroke-width="1.4" fill="none"/><path d="M110 186Q210 148 312 186" stroke-width="1.2" fill="none" opacity=".6"/><path d="M210 128v-10" stroke-width="5"/><path class="s-weed" d="M120 200q4 10-2 18M230 202q-3 9 2 16M300 200q4 8 0 14" fill="none" stroke-width="2.4"/>`;
    else{const old=v==='old';
      g+=`<g transform="rotate(${v==='reef'?-9:-5} 210 190)"><path class="${old?'s-hullold':'s-hull'}" d="M84 196Q96 150 140 146L320 146Q340 172 330 204Z"/><path class="${old?'s-hullold2':'s-hull2'}" d="M84 196Q96 174 130 172L330 172Q336 190 330 204Z"/>
        <path d="M100 160H322M96 184H330" stroke-width="1.2" opacity=".6"/><path d="M180 146l-16-80M262 146l12-50" stroke-width="4"/><path class="${old?'s-sailold':'s-sail'}" d="M166 72l-30 6 22 50z"/>${old?'<path class="s-weed" d="M110 196q6 10 0 18M180 200q-4 10 2 16M280 202q5 9-1 14" fill="none" stroke-width="2.4"/>':''}
        <path class="h-win" d="M292 156h16v10h-16z"/></g>`;
      if(v==='reef')g+=`<path class="s-rock" d="M150 216l14-34 18 12 10 22z"/>`}
    g+=`<g class="gulls">${[[260,96],[286,84]].map(([x,y])=>`<path d="M${x} ${y}q3-4 6 0q3-4 6 0" stroke-width="1.6"/>`).join('')}</g>`}
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
