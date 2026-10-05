/* Golden Shore: Places you discover and claim for the Guild. A place's name stays hidden until you sail alongside it; then it
   inks in on the water, and the first time, the claim card plays: a sketch of the place draws itself, the name is written
   under it, the Guild's stamp lands, and the card flies into your chart. Claims go on the chart (G.claims) and into the
   Atlas across voyages (A.claims). Ships, bottles, people in boats and fights are encounters, not places: they aren't claimed. */
"use strict";
/* what kind of place a stop is, or null if it isn't one you can claim */
const CLAIMEV={wreck:'Wreck',shrine:'Shrine',cache:'Cairn',castaway:'Sandbar',whirl:'Whirlpool',mermaid:'Siren rock',gunsmith:'Forge islet',fishing:'Fishing grounds'};
function placeKind(n){if(!n)return null;if(n.type==='port')return'Port';if(n.type==='isle')return isleVariant(n)==='lighthouse'?'Lighthouse':'Isle';if(n.type==='fish')return'Fishing grounds';
  if(n.type==='event'&&CLAIMEV[n.ev])return CLAIMEV[n.ev];return null}
/* names, from the voyage seed: every captain on the same voyage code charts the same names */
const PNAME={
  Isle:[['Gannet','Crow','Widow','Saint Ide\'s','Hollow','Kettle','Lantern','Mussel','Cutlass','Lonely','Puffin','Bishop\'s','Sorrow','Driftwood','Tern','Salt','Gull','Mother Carey\'s','Old Nan\'s','Thimble'],['Rock','Isle','Key','Cay','Holm','Skerry','Head','Tor']],
  Lighthouse:[['Gannet','Widow\'s','North','Kettle','Tern','Lonely','Old Ide\'s','Candle','Saint Ebb\'s','Fisher\'s'],['Light','Lamp','Beacon']],
  'Fishing grounds':[['Silver','Teeming','Shimmering','Mackerel','Herring','Restless','Boiling','Glass','Gannet\'s','Old Marrow\'s'],['Shoals','Banks','Grounds','Run','Reach','Water']],
  Wreck:[['The Wreck of the'],['Mary Cole','Sweet Hannah','Pelican','Good Intent','Merry Widow','Albatross','Three Sisters','Constant','Lark','Fortitude','Hope of Brine','Black Swan','Patience','Saint Elmo','Gull\'s Luck','Cormorant']],
  Shrine:[['The'],['Green Idol','Weeping Saint','Drowned Altar','Coin Rock','Shell Mother','Quiet Idol','Salt Madonna','Tide Stone']],
  Cairn:[['The'],['Leaning Cairn','Mapmaker\'s Cairn','Seven Stones','Marker Rock','Circle Stone','Pilgrim\'s Pile']],
  Sandbar:[['The'],['Long Bar','Shirt Flag Sands','Pale Spit','Lonely Bar','Gull Sands','Sunken Spit']],
  Whirlpool:[['The'],['Churn','Old Swirl','Drain','Mill Race','Kettle','Sinking Eye']],
  'Siren rock':[['The'],['Combing Rock','Siren\'s Seat','Singing Stone','Weeping Rock','Mermaid\'s Chair']],
  'Forge islet':[['The'],['Smoking Key','Anvil','Forge Rock','Bellows Isle','Hammer Cay']]};
let placeNames={key:'',m:new Map()};
function placeName(n){const k=placeKind(n);if(!k)return null;if(n.type==='port')return n.name;
  const key=G.seed+'|'+G.sea;if(placeNames.key!==key){placeNames={key,m:new Map()};const used=new Set();
    // dealt in order of the stops so the same voyage always gets the same names, with no name used twice on a sea
    G.map.nodes.slice().sort((a,b)=>a.id-b.id).forEach(o=>{const ok=placeKind(o);if(!ok||o.type==='port')return;const T=PNAME[ok]||PNAME.Isle,r=RNG(G.seed,'pname',o.id);let nm='';
      for(let t=0;t<20;t++){nm=`${pick(r,T[0])} ${pick(r,T[1])}`;if(!used.has(nm))break}used.add(nm);placeNames.m.set(o.id,nm)})}
  return placeNames.m.get(n.id)}
const claimed=n=>!!(G.claims&&G.claims.includes(n.id));
/* claim a place: on the voyage's chart, and in the Atlas for good. quiet: no card (your home port) */
function claimPlace(n,quiet){G.claims=G.claims||[];if(G.claims.includes(n.id))return;G.claims.push(n.id);
  const k=placeKind(n),nm=placeName(n);A.claims=A.claims||{n:0,kinds:{},recent:[]};A.claims.n++;A.claims.kinds[k]=(A.claims.kinds[k]||0)+1;
  A.claims.recent.unshift({n:nm,k,s:G.sea});A.claims.recent.length=Math.min(A.claims.recent.length,24);saveA();
  if(!quiet){logL(`Claimed ${nm} for the Guild.`);save();claimCard(n)}}
/* how many of this sea's places you've claimed, out of all of them */
const seaPlaces=()=>G.map.nodes.filter(placeKind);
/* the claim card: a sketch draws itself, the name is written, the stamp lands, then it flies into the chart */
function claimCard(n){if(!SEA.el)return;document.querySelectorAll('.claimcard').forEach(c=>c.remove());
  const all=seaPlaces(),got=all.filter(claimed).length,still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const c=document.createElement('div');c.className='claimcard';c.setAttribute('role','status');
  c.innerHTML=`<svg class="sk" viewBox="-160 -150 320 230" aria-hidden="true"><g class="skg">${destArt(n,true)}</g></svg>
    <div class="ct"><span class="ck">${placeKind(n)} · ${SEAS[G.sea]}</span><b class="cn">${placeName(n)}</b><span class="cs">Claimed for the Guild</span>
    <span class="cc">Charted: ${got} of ${all.length} places in ${SEAS[G.sea].replace(/^The /,'the ')}</span></div>`;
  SEA.el.appendChild(c);
  // fit the sketch to the drawing, then ink it in stroke by stroke
  const sv=c.querySelector('.sk'),g=c.querySelector('.skg');try{const b=g.getBBox();if(b.width)sv.setAttribute('viewBox',`${f1(b.x-12)} ${f1(b.y-12)} ${f1(b.width+24)} ${f1(b.height+24)}`)}catch(e){}
  if(!still)g.querySelectorAll('path,ellipse,circle,rect').forEach((p,i)=>{p.setAttribute('pathLength','1');p.style.setProperty('--d',(Math.min(i,40)*.03).toFixed(2)+'s')});
  const gone=()=>{if(!c.isConnected)return;const b=document.getElementById('chartbtn'),r=c.getBoundingClientRect();
    if(b&&!still){const t=b.getBoundingClientRect();c.style.setProperty('--flyx',`${f1(t.left+t.width/2-(r.left+r.width/2))}px`);c.style.setProperty('--flyy',`${f1(t.top+t.height/2-(r.top+r.height/2))}px`)}
    c.classList.add('fly');SEA.chartNew=true;if(b)b.classList.add('new');setTimeout(()=>c.remove(),still?300:700)};
  c.addEventListener('click',gone);setTimeout(gone,still?2600:3800)}
/* each frame: names ink in on the water when you're alongside, and the first time you're alongside, you claim the place */
const NEAR=150;   // world units beyond a place's size that count as alongside
function seaNames(){const p=G.pos;
  for(const e of SEA.names){const d=Math.hypot(e.q.x-p.x,e.q.y-p.y),near=d<destR(e.n)+NEAR;
    if(near!==e.near){e.near=near;e.el.classList.toggle('near',near)}
    if(near&&!claimed(e.n)&&!seaBusy())claimPlace(e.n)}}
/* the name tag drawn under a place on the water (hidden until you're alongside) */
function nameTag(n){const nm=placeName(n);if(!nm)return'';const x=isIsle(n)?-isleR(n)*.55:0,y=isIsle(n)?isleR(n)*SK+24:34;   // islands: off to the side, clear of the jetty and your ship
  return`<g class="o-pname" transform="translate(${f1(x)} ${f1(y)})"><text text-anchor="middle">${nm}</text></g>`}
