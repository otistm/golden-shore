/* Golden Shore: The open sea. The main way to get around: an ink ocean seen from above at an angle, where you steer your ship
   wherever you like. Places sit out on the water, hidden in fog (seafog.js) until you sail close, and look like what they are
   (seaart.js). Days pass as you sail. Bottles adrift and the peaks of
   uncharted isles give you scraps of chart, which fill in the chart you carry (seaChart). */
"use strict";
const SK=.6;                        // the sea floor is squashed: the camera looks down at an angle
const SEA_LEN=3600,SEA_W=1700;      // a sea's size in world units: its chart's rows run north (up), its columns across
const SIGHT=330;                    // how far you see through the fog
const DAYLEN=700;                   // world units of sailing to a day
const BOTTLES=4;                    // bottles adrift on each sea, each with a scrap of chart
const MAXV=190,ACC=230,TURN=2.3;    // top speed (units a second), how fast she picks up speed, and how fast she turns
const SEA={el:null,raf:0,last:0,v:0,target:null,hold:false,down:null,inside:new Set(),newly:new Set(),fast:1,cx:null,cy:null,Z:1,
  trav:0,saved:0,dirty:false,wkey:'',floats:[],wvs:[],turn:0,lkey:'',q:-1,frame:0,foes:[],call:null};
/* lookouts see farther with a crow's-nest landmark, studding sails and the like: the same things that used to show more rows */
const sight=()=>SIGHT+60*Math.min(3,(G.extra||0)+(G.far||0)+(hasC('buoy')?1:0)+(hasF('studding')?1:0));
const angD=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- where things are ---------- */
/* a stop's place on the open sea. Seeded, so every captain on this voyage code finds the same sea. Side stops (after a lost
   boss fight) sit beside the port they lead from. */
let seaPlace={key:'',m:new Map()};
function wpos(n){const key=G.seed+'|'+G.sea;if(seaPlace.key!==key)seaPlace={key,m:new Map()};
  let p=seaPlace.m.get(n.id);if(p)return p;
  const r=RNG(G.seed,'place',n.id),rows=mapRows();
  if(n.side){const e=G.map.edges.find(e=>e[1]===n.id),pp=e&&node(e[0]);
    if(pp&&!pp.side){const q=wpos(pp),sd=q.x<SEA_W/2?1:-1;p={x:q.x+sd*(n.type==='fish'?330:230),y:q.y-150-(n.type==='fish'?130:0)}}}
  if(!p){const fixed=n.type==='boss'||n.id===G.map.start;p={x:n.x*5+(fixed?0:(r()-.5)*170),y:(rows-Math.min(n.row,rows))/rows*SEA_LEN+(fixed?0:(r()-.5)*160)}}
  seaPlace.m.set(n.id,p);return p}
const isleR=n=>n.type==='port'?96:70;                                  // the land of a port or an isle
const destR=n=>n.type==='port'||n.type==='isle'?isleR(n)+34:n.type==='boss'?130:n.type==='elite'?100:n.type==='threat'?90:70;   // how big a stop is, for finding and tapping it
/* where you arrive: a port's jetty, an isle's beach on the near side, or right up to anything else. Sailing past an island's
   other shores never stops you. */
const isIsle=n=>n.type==='port'||n.type==='isle';
function dockAt(n){const q=wpos(n);if(n.type==='port')return{x:q.x+isleR(n)*.18,y:q.y+isleR(n)*1.42+28};if(n.type==='isle')return{x:q.x,y:q.y+isleR(n)+34};return q}
const arriveR=n=>isIsle(n)?50:destR(n);
// ports always welcome you; everything else happens once (and a side stop closes when a later loss opens a fresh pair)
const seaLive=n=>n.type==='port'||!G.path.includes(n.id)&&!(n.side&&!G.map.edges.some(e=>e[1]===n.id));
const seaFound=n=>!!(G.fog&&G.fog.f.includes(n.id));

/* ---------- the fog ---------- */
/* G.fog remembers this sea's wake: a point every 70 units you've sailed (the fog is lifted round each one), the stops you've
   found, the bottles you've picked up (b) and the scraps of chart you've found (m: circles of [x,y,r] inked on your chart).
   Voyages from before the open sea start from the stops they've already been to. */
function fogInit(){if(G.fog&&G.fog.sea===G.sea){G.fog.b=G.fog.b||[];G.fog.m=G.fog.m||[];return}G.fog={sea:G.sea,p:[],f:[],b:[],m:[]};
  // each stop you've been to lifts a lumpy patch of fog, so the edge billows from the start
  G.path.forEach(id=>{const n=node(id);if(!n)return;const q=wpos(n),r=RNG(G.seed,'fogstart',id);seeFrom(q.x,q.y);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+r(),d=120+r()*90;seeFrom(q.x+Math.cos(a)*d*1.3,q.y+Math.sin(a)*d)}});
  G.fog.s=G.fog.p.length}   // the chart draws your track from here on
function seeFrom(x,y){const F=G.fog;F.p.push(Math.round(x),Math.round(y));
  G.map.nodes.forEach(n=>{if(F.f.includes(n.id))return;const q=wpos(n);if(Math.hypot(q.x-x,q.y-y)<sight()*.85+destR(n)*.4){F.f.push(n.id);SEA.newly.add(n.id)}})}
/* the fog's edge billows: each lifted circle is a little bigger or smaller than the last */
const fogR=i=>{const v=Math.sin(i*12.9898)*43758.5453;return sight()*(.86+.14*(v-Math.floor(v)))};

/* ---------- scraps of chart ---------- */
/* bottles adrift on open water, away from everything else. Seeded, so every captain finds them in the same places. */
let seaBottleAt={key:'',l:[]};
function seaBottles(){const key=G.seed+'|'+G.sea;if(seaBottleAt.key===key)return seaBottleAt.l;
  const r=RNG(G.seed,'bottles',G.sea),l=[];
  for(let t=0;t<200&&l.length<BOTTLES;t++){const x=80+r()*(SEA_W-160),y=300+r()*(SEA_LEN-700);
    if(G.map.nodes.some(n=>{const q=wpos(n);return Math.hypot(q.x-x,q.y-y)<240})||l.some(b=>Math.hypot(b.x-x,b.y-y)<600))continue;l.push({x,y})}
  seaBottleAt={key,l};return l}
/* a scrap of chart: inks in a stretch of this sea round a place you haven't found yet (a port or an isle if there's one left),
   and says what it shows and which way. Returns the words, or null when there's nothing left to show. */
const charted=n=>!!(G.full||G.fog.m.some(([x,y,r])=>Math.hypot(wpos(n).x-x,wpos(n).y-y)<r));
function seaFragment(src){const F=G.fog,r=RNG(G.seed,'frag',G.sea,src,F.m.length),p=G.pos;
  const pool=G.map.nodes.filter(n=>n.type!=='boss'&&!seaFound(n)&&!charted(n));if(!pool.length)return null;
  const land=pool.filter(isIsle),ahead=(land.length?land:pool).filter(n=>wpos(n).y<p.y),from=ahead.length?ahead:land.length?land:pool;
  const n=pick(r,from),q=wpos(n);F.m.push([Math.round(q.x+(r()-.5)*200),Math.round(q.y+(r()-.5)*160),420]);SEA.chartNew=true;
  const what=n.type==='port'?`a port called ${n.name}`:n.type==='isle'?'an island no chart shows':n.enemy?'waters marked with a warning':n.type==='fish'?'good fishing, marked with a hook':'a cross drawn on open water';
  const dirs=['east','south-east','south','south-west','west','north-west','north','north-east'];
  return`${what}, ${dirs[Math.round(Math.atan2(q.y-p.y,q.x-p.x)/(Math.PI/4)+8)%8]} of here`}
function seaBottle(i){G.fog.b.push(i);seaFlot();
  const note=NOTES[ri(RNG(G.seed,'note',G.sea,i),NOTES.length)],what=seaFragment('bottle'+i);
  logL(what?`Fished a bottle out of the sea. Inside, a scrap of chart showing ${what}.`:'Fished a bottle out of the sea. The scrap of chart inside shows water I already know.');save();
  const ov=overlay(`<h2>A message in a bottle</h2><p class="log">${note}</p><p>${what?`It's a scrap of chart. It shows ${what}.`:"It's a scrap of chart, of water you've already sailed."}</p>
    <div class="sh-actions"><button class="ghost" data-a="close">Sail on</button><button class="primary" data-a="chart">Look at the chart</button></div>`);
  ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='chart')seaChart()})}
function seaFlot(){const g=SEA.el&&SEA.el.querySelector('#seaflot');if(!g)return;
  g.innerHTML=seaBottles().map((b,i)=>G.fog.b.includes(i)?'':`<g data-wx="${f1(b.x)}" data-wy="${f1(b.y)}" transform="translate(${f1(b.x)} ${f1(b.y*SK)})">${ART.bottle()}</g>`).join('');seaFloats()}

/* ---------- days ---------- */
/* a day passes for every stretch of sea you sail */
function seaMiles(d){G.sailed=(G.sailed||0)+d;while(G.sailed>=DAYLEN){G.sailed-=DAYLEN;G.day++;
  const b=document.querySelector('.stat.day b'),s=b&&b.parentNode;if(s){b.textContent=G.day;s.classList.remove('bump');void s.offsetWidth;s.classList.add('bump')}}}

/* where your ship is: G.pos {x,y,a (heading),at,sea}. When the voyage moved you without sailing (a new sea, falling back to port
   after a boss), she starts just off that stop. */
function seaShip(){const n=node(G.at);
  if(!G.pos||G.pos.at!==G.at||G.pos.sea!==G.sea){const q=dockAt(n);G.pos={x:q.x,y:q.y+(isIsle(n)?60:destR(n)+40),a:-Math.PI/2,at:G.at,sea:G.sea};SEA.cx=null;SEA.target=null}
  const F=G.fog.p;if(!F.length||Math.hypot(G.pos.x-F[F.length-2],G.pos.y-F[F.length-1])>70)seeFrom(G.pos.x,G.pos.y);
  return G.pos}

/* ---------- drawing ---------- */
const pr=(x,y,z)=>[x,y*SK-(z||0)];
const f1=v=>v.toFixed(1),pt=p=>f1(p[0])+' '+f1(p[1]);
const poly=ps=>'M'+ps.map(pt).join('L')+'Z';
/* a smooth closed curve through already-projected points */
function curve(ps){const n=ps.length;let d='';
  for(let i=0;i<n;i++){const a=ps[i],b=ps[(i+1)%n];if(!i){const z=ps[n-1];d+=`M${f1((z[0]+a[0])/2)} ${f1((z[1]+a[1])/2)}`}
    d+=`Q${pt(a)} ${f1((a[0]+b[0])/2)} ${f1((a[1]+b[1])/2)}`}return d+'Z'}
function destHTML(n){const q=wpos(n),live=seaLive(n),pop=SEA.newly.has(n.id);
  return`<g class="dest d-${n.type}${live?' live':' spent'}" data-id="${n.id}" data-y="${q.y}" data-wx="${f1(q.x)}" data-wy="${f1(q.y)}" transform="translate(${f1(q.x)} ${f1(q.y*SK)})"${live?` tabindex="0" role="button" aria-label="${seaSeen(n).head}"`:''}>
    <ellipse class="o-hit" rx="${f1(destR(n)*.85)}" ry="${f1(destR(n)*.85*SK+30)}" cy="-20"/><g class="dbody${pop?' pop':''}">${destArt(n,live)}</g></g>`}
/* draw every stop you've found, back to front, and put your ship back among them */
function seaThings(){const L=SEA.el&&SEA.el.querySelector('#seathings');if(!L)return;
  const ns=G.map.nodes.filter(seaFound).sort((a,b)=>wpos(a).y-wpos(b).y);
  L.innerHTML=ns.map(destHTML).join('');
  SEA.newly.clear();SEA.ship=null;SEA.q=-1;
  SEA.foes=[...L.querySelectorAll('.dest.live .o-ship[data-k]')].map(el=>{const n=node(+el.closest('.dest').dataset.id);return{el,wl:el.closest('.shipdraw').querySelector('.o-wl'),n,q:wpos(n),k:el.dataset.k,a:-1}});
  seaFloats();
  L.querySelectorAll('.dest.live').forEach(el=>el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();seaTapDest(+el.dataset.id)}})}
/* wave marks on the open water, from seeded tiles, so the sea goes on as far as you sail */
function seaWaves(v){const T=300,x0=Math.floor(v.x0/T),x1=Math.floor(v.x1/T),y0=Math.floor(v.y0/T),y1=Math.floor(v.y1/T),key=[x0,x1,y0,y1].join();
  if(key===SEA.wkey)return;SEA.wkey=key;
  const land=G.map.nodes.filter(n=>n.type==='port'||n.type==='isle').map(n=>[wpos(n),isleR(n)*1.5]);let g='';
  for(let tx=x0;tx<=x1;tx++)for(let ty=y0;ty<=y1;ty++){const r=RNG(G.seed,'wv',G.sea,tx,ty);
    for(let k=0;k<4;k++){const x=(tx+r())*T,y=(ty+r())*T,w=7+r()*7,dl=-r()*6;if(land.some(([q,rr])=>Math.hypot(q.x-x,q.y-y)<rr))continue;
      g+=`<path class="wv" data-x="${f1(x)}" data-y="${f1(y)}" d="M${f1(x-w)} ${f1(y*SK)}q${f1(w/4)} -4 ${f1(w/2)} 0t${f1(w/2)} 0t${f1(w/2)} 0t${f1(w/2)} 0"/>`}}
  const W=SEA.el.querySelector('#seawaves');W.innerHTML=g;SEA.wvs=[...W.children].map(el=>({el,x:+el.dataset.x,y:+el.dataset.y}))}

/* ---------- the screen ---------- */
const CHARTICON='<svg viewBox="0 0 32 32" aria-hidden="true"><path class="w" d="M7 7h18v18H7z"/><path d="M11 21c2-4 6-2 8-6s2-4 3-5" fill="none" stroke-dasharray="1.5 3"/><path d="M19 9l3 3M22 9l-3 3"/><rect class="w" x="4" y="4" width="24" height="5" rx="2.5"/><rect class="w" x="4" y="23" width="24" height="5" rx="2.5"/></svg>';
function openSea(){
  cancelAnimationFrame(raf);B=null;G.inPort=false;PV.id=null;
  if(G.sel==null)G.moving=false;
  fogInit();const p=seaShip();
  app.innerHTML=`<div class="charthead">${barHTML()}<div class="seahead"><h2>${SEAS[G.sea]}</h2><span id="seawx">Sea ${G.sea+1} of 3 · ${WEATHER[weatherOf(G.sea,G.day)].n}</span></div></div>
    <div class="ocean" id="ocean"><canvas id="seawater" aria-hidden="true"></canvas><svg id="seasvg" role="application" aria-label="The open sea. Tap the water to sail there, or tap a place to sail to it."><g id="seacam"><g id="seawaves"></g><g id="seawake"></g><g id="seatgt"></g><g id="seaflot"></g><g id="seathings"></g></g></svg>
      <canvas id="seafog" aria-hidden="true"></canvas><canvas id="searain" aria-hidden="true"></canvas></div>
    <button class="chartbtn${SEA.chartNew?' new':''}" id="chartbtn" type="button" aria-label="Open your chart">${CHARTICON}<span>Chart</span></button>
    ${holdDock('')}`;
  document.body.classList.add('atsea');
  bindBar();bindHold('hold',chart);fitDock();
  SEA.el=app.querySelector('#ocean');SEA.wkey='';
  SEA.inside=new Set(G.map.nodes.filter(n=>seaFound(n)&&seaLive(n)&&Math.hypot(dockAt(n).x-p.x,dockAt(n).y-p.y)<arriveR(n)+30).map(n=>n.id));
  if(SEA.cx==null||Math.hypot(SEA.cx-p.x,SEA.cy-p.y)>600){SEA.cx=p.x;SEA.cy=p.y}
  seaLayout();seaThings();seaFlot();seaBind();
  document.getElementById('chartbtn').onclick=()=>seaChart();
  if(!SEA.raf){SEA.last=0;SEA.raf=requestAnimationFrame(seaLoop)}
  save();coach('chart');
}
/* the space the sea shows between the top bar and the hold, and the fog's canvas to match */
function seaLayout(){const el=SEA.el;if(!el)return;const r=el.getBoundingClientRect(),h=app.querySelector('.charthead'),d=app.querySelector('.dock');
  SEA.ox=r.left;SEA.oy=r.top;SEA.vw=r.width;SEA.vh=r.height;
  SEA.top=h?Math.max(0,h.getBoundingClientRect().bottom-r.top):0;SEA.bot=d?d.getBoundingClientRect().top-r.top:r.height;
  if(SEA.bot-SEA.top<120)SEA.bot=Math.min(r.height,SEA.top+120);
  SEA.Z=clamp(Math.min(SEA.vw/520,(SEA.bot-SEA.top)/470),.85,1.5);   // phones see a little farther
}
addEventListener('resize',()=>{if(SEA.el&&SEA.el.isConnected){seaLayout();SEA.wkey=''}});
/* tap or drag on the water to steer toward your finger; tap a place to sail to it */
function seaBind(){const el=SEA.el;
  const aim=e=>{const x=(e.clientX-SEA.ox-SEA.tx)/SEA.Z,y=(e.clientY-SEA.oy-SEA.ty)/SEA.Z/SK;seaTarget(x,y,null)};
  el.addEventListener('pointerdown',e=>{if(e.button>0||seaBusy())return;const d=e.target.closest('.dest.live');
    SEA.down={id:e.pointerId,x:e.clientX,y:e.clientY,d:d?+d.dataset.id:null,moved:false};
    if(!d){aim(e);SEA.hold=true;seaMark()}try{el.setPointerCapture(e.pointerId)}catch(_){}});
  el.addEventListener('pointermove',e=>{const D=SEA.down;if(!D||D.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-D.x,e.clientY-D.y)>12)D.moved=true;if(SEA.hold||D.moved){SEA.hold=true;aim(e)}});
  const up=e=>{const D=SEA.down;if(!D||D.id!==e.pointerId)return;SEA.down=null;SEA.hold=false;
    if(D.d!=null&&!D.moved)seaTapDest(D.d);else seaMark()};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}
/* a stop you tap: sail to it, or if you're already there, see what it is */
function seaTapDest(id){const n=node(id);if(!n)return;
  if(SEA.inside.has(id)&&seaLive(n))return seaArrive(n);
  const q=dockAt(n);seaTarget(q.x,q.y,id);seaMark()}
function seaAim(x,y,id){if(id!=null)return seaTapDest(id);seaTarget(x,y,null);seaMark()}
function seaTarget(x,y,dock){SEA.target={x,y};SEA.dock=dock;SEA.best=null;SEA.stall=0}
/* an ink cross where you're heading */
function seaMark(){const g=SEA.el&&SEA.el.querySelector('#seatgt');if(!g)return;const t=SEA.target;
  g.innerHTML=t&&SEA.dock==null?`<g transform="translate(${f1(t.x)} ${f1(t.y*SK)})"><g class="o-tgt"><ellipse rx="14" ry="${f1(14*SK)}"/><path d="M-6 -4l12 8M6 -4l-12 8"/></g></g>`:''}
const seaBusy=()=>PAUSE.on||!!document.querySelector('.overlay,.chestfx,.hullcard,.coachdim');
function seaLoop(now){
  if(!SEA.el||!SEA.el.isConnected||!G){SEA.raf=0;SEA.el=null;document.body.classList.remove('atsea');return}
  SEA.raf=requestAnimationFrame(seaLoop);
  const real=Math.min(.05,SEA.last?(now-SEA.last)/1000:0);SEA.last=now;
  if(!seaBusy()&&real){const n=Math.ceil(SEA.fast);for(let i=0;i<n;i++)if(seaStep(real*SEA.fast/n))break}
  if(SEA.dirty&&now-SEA.saved>3000){SEA.saved=now;SEA.dirty=false;save()}
  if(++SEA.frame%30===0)seaLayout();
  const wdt=PAUSE.on?0:real;weatherTick(wdt);
  seaDraw(real);seaRain(wdt)}
/* one tick of sailing. Returns true when she arrived somewhere (and the sea stops for the card). */
function seaStep(dt){const p=G.pos;let want=0;
  if(SEA.target){const dx=SEA.target.x-p.x,dy=SEA.target.y-p.y,d=Math.hypot(dx,dy);
    if(d<(SEA.hold?34:14)){if(!SEA.hold){SEA.target=null;seaMark()}}
    else{
      // stuck against the edge of the sea or a shore with no way round: give up after a few seconds rather than push forever
      if(SEA.best==null||d<SEA.best-8){SEA.best=d;SEA.stall=0}else if(!SEA.hold&&(SEA.stall+=dt)>3.5){SEA.target=null;seaMark();return false}
      const da=angD(Math.atan2(dy,dx)-p.a),t=TURN*dt,turn=clamp(da,-t,t);p.a=angD(p.a+turn);SEA.turn+=(turn/dt-SEA.turn)*Math.min(1,dt*4);
      want=MAXV*Math.min(1,.25+d/160)*Math.max(.15,1-Math.abs(da)/2.2)}}
  SEA.v+=clamp(want-SEA.v,-ACC*1.5*dt,ACC*dt);
  if(SEA.v<1&&!want){SEA.v=0;return false}
  p.x+=Math.cos(p.a)*SEA.v*dt;p.y+=Math.sin(p.a)*SEA.v*dt;
  // the edges of the sea, and land: she slides along a shore rather than sailing over it
  p.x=clamp(p.x,-220,SEA_W+220);p.y=clamp(p.y,-460,SEA_LEN+460);
  for(const n of G.map.nodes){if(n.type!=='port'&&n.type!=='isle')continue;const q=wpos(n),rr=isleR(n)+10,ex=(p.x-q.x)/1.12,dy=p.y-q.y,d=Math.hypot(ex,dy);
    if(d<rr&&d>0){p.x=q.x+ex/d*rr*1.12;p.y=q.y+dy/d*rr;
      // turn along the shore, toward whichever way round is nearer where you are heading
      if(SEA.target){const tx=-dy/d,ty=ex/d,sg=tx*(SEA.target.x-p.x)+ty*(SEA.target.y-p.y)>0?1:-1;p.a=angD(p.a+clamp(angD(Math.atan2(ty*sg,tx*sg)-p.a),-TURN*dt,TURN*dt))}if(SEA.target&&!SEA.hold&&Math.hypot(SEA.target.x-q.x,SEA.target.y-q.y)<rr+20){SEA.target=null;seaMark()}}}
  SEA.dirty=true;SEA.trav+=SEA.v*dt;seaMiles(SEA.v*dt);
  if(SEA.trav>26){SEA.trav=0;seaWake()}
  const F=G.fog.p;if(Math.hypot(p.x-F[F.length-2],p.y-F[F.length-1])>70){seeFrom(p.x,p.y);if(SEA.newly.size){const found=[...SEA.newly].map(node);seaThings();seaCall(found)}}
  // a bottle adrift: sail through it to fish it out
  const bi=seaBottles().findIndex((b,i)=>!G.fog.b.includes(i)&&Math.hypot(b.x-p.x,b.y-p.y)<44);
  if(bi>=0){SEA.target=null;SEA.v*=.3;SEA.hold=false;SEA.down=null;seaMark();seaBottle(bi);return true}
  // arriving: sailing into a stop you haven't spent stops the ship and shows what's there
  for(const n of G.map.nodes){if(!seaFound(n)||!seaLive(n))continue;const q=dockAt(n),d=Math.hypot(p.x-q.x,p.y-q.y),r=arriveR(n);
    if(d<r){if(!SEA.inside.has(n.id)){SEA.inside.add(n.id);SEA.target=null;SEA.v=0;SEA.hold=false;SEA.down=null;seaMark();seaArrive(n);return true}}
    else if(d>r+30)SEA.inside.delete(n.id)}
  return false}
/* the ship's wake: short ink strokes at the stern that spread and fade */
function seaWake(){const w=SEA.el.querySelector('#seawake');if(!w||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const p=G.pos,c=Math.cos(p.a),s=Math.sin(p.a),L=(SHIPISO[shipKind()].L||1),sx=p.x-c*30*L,sy=p.y-s*30*L,a=pr(sx-s*7,sy+c*7),b=pr(sx+s*7,sy-c*7);
  const e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('class','o-wake');e.setAttribute('d',`M${pt(a)}L${pt(b)}`);
  w.appendChild(e);setTimeout(()=>e.remove(),1800)}
/* "Land ho!": the lookout calls out the most striking thing just found */
function seaCall(ns){const rank=n=>n.type==='boss'?0:n.type==='port'?1:n.type==='elite'?2:n.type==='isle'?3:n.enemy?4:5,n=ns.slice().sort((a,b)=>rank(a)-rank(b))[0],s=sightOf(n);
  const t=n.type==='boss'?'Something huge, dead ahead!':s.call||SEECALL[n.type]||'Something in the water!';
  seaSay(t)}
/* the lookout's words, over the ship for a moment */
function seaSay(t){if(!SEA.el||!SEA.el.isConnected)return;
  if(SEA.call)SEA.call.remove();const c=document.createElement('div');c.className='seacall';c.setAttribute('role','status');c.textContent=t;SEA.el.appendChild(c);SEA.call=c;
  setTimeout(()=>{if(c===SEA.call){c.classList.add('out');setTimeout(()=>c.remove(),400)}},1700)}
function seaDraw(dt){const p=G.pos,Z=SEA.Z,el=SEA.el;
  const k=Math.min(1,dt*3.2);SEA.cx+=(p.x-SEA.cx)*k;SEA.cy+=(p.y-SEA.cy)*k;
  const cy0=SEA.top+(SEA.bot-SEA.top)*.62,tx=SEA.vw/2-SEA.cx*Z,ty=cy0-SEA.cy*SK*Z;SEA.tx=tx;SEA.ty=ty;
  el.querySelector('#seacam').setAttribute('transform',`translate(${f1(tx)} ${f1(ty)}) scale(${Z.toFixed(3)})`);
  // your ship, among the stops so nearer things cover farther ones
  const L=el.querySelector('#seathings');
  if(!SEA.ship||!SEA.ship.isConnected){SEA.ship=document.createElementNS('http://www.w3.org/2000/svg','g');SEA.ship.id='seaship';SEA.ship.setAttribute('class',`shipdraw ship-${shipKind()}`);SEA.ship.innerHTML='<g class="o-wl"></g><g class="o-float"><g class="o-ship"></g></g>';SEA.q=-1}
  const q=Math.round(p.a/(Math.PI/32))&63;if(q!==SEA.q){SEA.q=q;SEA.ship.querySelector('.o-ship').innerHTML=isoShip(p.a,shipKind());SEA.ship.querySelector('.o-wl').innerHTML=isoWater(p.a,shipKind())}
  // she rides the swell like everything else, and leans into her turns (the lean shows most when she's sailing up or down the screen)
  if(!SEA.v)SEA.turn*=.9;rideSwell(SEA.ship.querySelector('.o-float'),p.x,p.y,seaTime(),SHIPISO[shipKind()].L||1,clamp(SEA.turn*SEA.v/MAXV*-9,-9,9)*-Math.sin(p.a));
  SEA.ship.setAttribute('transform',`translate(${f1(p.x)} ${f1(p.y*SK)})`);
  let next=null;for(const c of L.children){if(c!==SEA.ship&&+c.dataset.y>p.y){next=c;break}}
  if(SEA.ship.parentNode!==L||SEA.ship.nextSibling!==next)L.insertBefore(SEA.ship,next);
  // strangers turn to watch you as you come near
  SEA.foes.forEach(f=>{if(!f.el||Math.hypot(f.q.x-p.x,f.q.y-p.y)>520)return;const a=Math.atan2(p.y-f.q.y,p.x-f.q.x)+(f.k==='row'?0:Math.PI/2),qq=Math.round(a/(Math.PI/32))&63;
    if(qq!==f.a){f.a=qq;f.el.innerHTML=isoShip(a,f.k);if(f.wl)f.wl.innerHTML=isoWater(a,f.k)}});
  const v={x0:-tx/Z,x1:(SEA.vw-tx)/Z,y0:-ty/Z/SK,y1:(SEA.vh-ty)/Z/SK};
  seaWaves(v);seaRide(v);if(!fogGL())seaFog(v);
  if(SEA.call){const sx=tx+p.x*Z,sy=ty+p.y*SK*Z;SEA.call.style.transform=`translate(${f1(sx)}px,${f1(sy-110*Z)}px) translate(-50%,-100%)`}}
/* the fog where WebGL isn't available: flat paper fog with stipple, cut away round everywhere you've sailed, with an ink line along its edge */
let fogPat=null;
function seaFog(v){const c=SEA.el.querySelector('#seafog'),x=c.getContext('2d'),d=Math.min(2,devicePixelRatio||1),Z=SEA.Z;if(!x)return;
  if(c.width!==Math.round(SEA.vw*d)||c.height!==Math.round(SEA.vh*d)){c.width=Math.round(SEA.vw*d);c.height=Math.round(SEA.vh*d)}
  x.setTransform(d,0,0,d,0,0);x.globalCompositeOperation='source-over';x.clearRect(0,0,SEA.vw,SEA.vh);
  if(!fogPat){const t=document.createElement('canvas');t.width=t.height=9;const tc=t.getContext('2d');tc.fillStyle='rgba(0,0,0,.26)';tc.beginPath();tc.arc(2,2,.9,0,7);tc.fill();tc.fillStyle='rgba(0,0,0,.16)';tc.beginPath();tc.arc(6.5,6.5,.9,0,7);tc.fill();fogPat=x.createPattern(t,'repeat')}
  x.fillStyle=SEA.fogC||(SEA.fogC=getComputedStyle(document.documentElement).getPropertyValue('--fog').trim()||'#E8DFD0');x.fillRect(0,0,SEA.vw,SEA.vh);x.fillStyle=fogPat;x.fillRect(0,0,SEA.vw,SEA.vh);
  const P=G.fog.p,vis=[];for(let i=0;i<P.length;i+=2){const r=fogR(i/2);if(P[i]+r<v.x0||P[i]-r>v.x1||P[i+1]+r<v.y0||P[i+1]-r>v.y1)continue;vis.push([P[i],P[i+1],r])}
  x.translate(SEA.tx,SEA.ty);x.scale(Z,Z);
  const ring=sh=>{x.beginPath();vis.forEach(([px,py,r])=>{x.moveTo(px+r-sh,py*SK);x.ellipse(px,py*SK,r-sh,(r-sh)*SK,0,0,Math.PI*2)})};
  ring(0);x.lineWidth=2.4/Z;x.strokeStyle='#000';x.stroke();
  x.globalCompositeOperation='destination-out';x.fillStyle='#000';ring(1.3/Z);x.fill();x.globalCompositeOperation='source-over'}
/* what you see, in words: the title and lines for a place's card */
function seaSeen(n){const s=sightOf(n);
  if(n.type==='port')return{head:n.name,x:seenLine(SEEN.port,n.id)};
  if(n.enemy)return{head:'The '+ENEMIES[n.enemy].n,x:seenLine(s.x,n.id)};
  if(n.type==='event')return{head:s.t||'Something in the water',x:s.x||''};
  if(n.type==='isle')return{head:'An uncharted isle',x:seenLine(SEEN.isle,n.id)};
  if(n.type==='npc')return{head:'A small boat',x:seenLine(SEEN.npc,n.id)};
  if(n.type==='fish')return{head:'Birds over the water',x:seenLine(SEEN.fish,n.id)};
  return{head:nodeTitle(n),x:''}}
/* what's here: the card when you sail into a stop, with the button that goes in */
function seaArrive(n){const{head,x}=seaSeen(n);let{body}=nodeInfo(n);
  if(n.type==='event')body='';if(n.type==='isle')body+='<p class="soft">From its peak you could see more of the sea.</p>';
  const verb={port:'Make port',threat:'Engage',elite:'Engage',boss:'Engage',event:'Take a look',isle:'Go ashore',npc:'Hail them',fish:'Cast your lines'}[n.type]||'Go';
  const ov=overlay(`<h2>${head}</h2>${x?`<p class="log">${x}</p>`:''}${body}<div class="sh-actions"><button class="ghost" data-a="close">Sail on</button><button class="primary" data-a="go">${verb}</button></div>`);
  ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')seaVisit(n.id)});
  ov.querySelector('[data-a="go"]').focus()}
function seaVisit(id){const n=node(id);G.pos.at=id;SEA.target=null;
  if(n.type==='port'&&G.at===id){coach('sail');return port(id)}   // back to the port you last left: no new day, no wages
  // the view from an uncharted isle's peak goes on your chart
  if(n.type==='isle'&&seaLive(n)){const w=seaFragment('isle'+id);if(w)logL(`From the isle's peak I could see ${w}. I drew it on my chart.`)}
  goNow(id,true)}   // the days passed on the way there

/* ---------- the chart ---------- */
/* your chart of this sea, seen straight down: the water you've sailed is inked in, the rest is blank paper. Scraps of chart
   you've found are pasted in, with the places they show. Every place you've found is marked, the ones you're done with crossed
   off, with your track and where you are now. */
function seaChart(inPort){fogInit();seaShip();const s=1/5,X=v=>f1(v*s),P=G.fog.p,x0=-260,y0=-480,W=SEA_W+520,H=SEA_LEN+960;
  let circ='';for(let i=0;i<P.length;i+=2)circ+=`<circle cx="${X(P[i])}" cy="${X(P[i+1])}" r="${X(fogR(i/2)*.9)}"/>`;
  const r=RNG(G.seed,'chartwv',G.sea);let wv='';for(let i=0;i<160;i++){const x=x0+r()*W,y=y0+r()*H,w=5+r()*4;wv+=`<path d="M${X(x)-w} ${X(y)}q${w/4} -3 ${w/2} 0t${w/2} 0t${w/2} 0t${w/2} 0"/>`}
  const found=G.map.nodes.filter(seaFound),heard=G.map.nodes.filter(n=>!seaFound(n)&&charted(n)),b=node(G.map.boss);
  // scraps of chart: a torn patch of inked sea round each
  let frag='';G.fog.m.forEach(([fx,fy,fr],i)=>{const rr=RNG(G.seed,'torn',G.sea,i),k=16;
    frag+='<path d="M'+Array.from({length:k},(_,j)=>{const a=j/k*Math.PI*2,d=fr*(.86+rr()*.2);return X(fx+Math.cos(a)*d)+' '+X(fy+Math.sin(a)*d)}).join('L')+'Z"/>'});
  if(G.full)frag=`<rect x="${X(x0+40)}" y="${X(y0+40)}" width="${X(W-80)}" height="${X(H-80)}"/>`;
  let land='',marks='';
  [...found,...heard].filter(isIsle).forEach(n=>{const q=wpos(n),rr=isleR(n)*s;land+=`<ellipse cx="${X(q.x)}" cy="${X(q.y)}" rx="${f1(rr*1.15)}" ry="${f1(rr)}"/>`});
  [...new Set([...found,...heard,b])].forEach(n=>{const q=wpos(n),big=n.type==='boss',rr=big?15:11,known=seaFound(n)||charted(n),done=seaFound(n)&&!seaLive(n);
    marks+=`<g class="sc-node${done?' done':''}${seaFound(n)?'':' heard'}" transform="translate(${X(q.x)} ${X(q.y)})"><circle r="${rr}"/><g transform="translate(${big?-10:-7.5} ${big?-10:-7.5}) scale(${big?.83:.62})" fill="none" stroke-width="2.4">${known?NG[n.type]:NG.event}</g>${done?`<path class="x" d="M${-rr-3} ${-rr-3}L${rr+3} ${rr+3}M${rr+3} ${-rr-3}L${-rr-3} ${rr+3}"/>`:''}
      ${n.type==='port'?`<text y="${rr+15}" text-anchor="middle">${n.name}</text>`:big?`<text y="${-rr-7}" text-anchor="middle">${known?ENEMIES[n.enemy].n:'Something waits'}</text>`:''}</g>`});
  G.charts.forEach(c=>{if(c.sea!==G.sea)return;const n=node(c.at);if(!n)return;const q=wpos(n);
    marks+=`<g transform="translate(${f1(q.x*s+14)} ${f1(q.y*s-22)}) scale(.6)" fill="none" stroke-width="2.4">${CHARTS[c.k].g}</g>`});
  let track='';for(let i=G.fog.s||0;i<P.length;i+=2)track+=(i>(G.fog.s||0)?'L':'M')+X(P[i])+' '+X(P[i+1]);
  const p=G.pos;
  const svg=`<svg viewBox="${X(x0)} ${X(y0)} ${X(W)} ${X(H)}" aria-label="Your chart of ${SEAS[G.sea]}"><defs><clipPath id="scseen">${circ}</clipPath>
    <pattern id="scfog" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#000" opacity=".25"/></pattern></defs>
    <rect class="sc-paper" x="${X(x0)}" y="${X(y0)}" width="${X(W)}" height="${X(H)}"/><rect x="${X(x0)}" y="${X(y0)}" width="${X(W)}" height="${X(H)}" fill="url(#scfog)"/>
    <text class="sc-monsters" x="${X(SEA_W/2)}" y="${X(SEA_LEN*.3)}" text-anchor="middle">here be monsters</text>
    <g class="sc-frag">${frag}</g><g class="sc-edge">${circ}</g><g class="sc-sea">${circ}</g><g clip-path="url(#scseen)"><g class="sc-wv">${wv}</g><g class="sc-land">${land}</g></g>
    <path class="sc-track" d="${track}"/>${marks}
    <g transform="translate(${X(p.x)} ${X(p.y)})"><g transform="translate(-12 -26)" stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#FBF5E8"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z" fill="#5E7487"/></g></g></svg>`;
  const ov=overlay(`<div class="peekhead"><h2>${SEAS[G.sea]}</h2><span class="soft">${found.length} found${heard.length?`, ${heard.length} more charted`:''}</span></div>
    <div class="peekwrap" id="peekwrap"><div class="seachart">${svg}</div></div><button class="primary" data-a="close">${inPort?'Back to port':'Back to the sea'}</button>`,false,'peekov');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()});
  SEA.chartNew=false;const cb=document.getElementById('chartbtn');if(cb)cb.classList.remove('new');
  const wrap=ov.querySelector('#peekwrap'),sv=ov.querySelector('svg');
  if(wrap&&sv){const k=sv.getBoundingClientRect().height/(H*s);wrap.scrollTop=Math.max(0,(p.y-y0)*s*k-wrap.clientHeight*.5)}}
