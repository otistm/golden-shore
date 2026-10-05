/* Golden Shore: The open sea. The main way to get around: an ink ocean seen from above at an angle, where you steer your ship
   wherever you like. Ports, isles, other ships, flotsam, strangers and fishing grounds sit out on the water, hidden in fog
   until you sail close. Sail into one to see what's there. The chart is now something you carry (seaChart). */
"use strict";
const SK=.6;                        // the sea floor is squashed: the camera looks down at an angle
const SEA_LEN=3600,SEA_W=1700;      // a sea's size in world units: its chart's rows run north (up), its columns across
const SIGHT=330;                    // how far you see through the fog
const MAXV=190,ACC=230,TURN=2.3;    // top speed (units a second), how fast she picks up speed, and how fast she turns
const SEA={el:null,raf:0,last:0,v:0,target:null,hold:false,down:null,inside:new Set(),newly:new Set(),fast:1,cx:null,cy:null,Z:1,
  trav:0,saved:0,dirty:false,wkey:'',q:-1,frame:0,foes:[],call:null};
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
/* G.fog remembers this sea's wake: a point every 70 units you've sailed (the fog is lifted round each one) and the stops you've
   found. Voyages from before the open sea start from the stops they've already been to. */
function fogInit(){if(G.fog&&G.fog.sea===G.sea)return;G.fog={sea:G.sea,p:[],f:[]};
  // each stop you've been to lifts a lumpy patch of fog, so the edge billows from the start
  G.path.forEach(id=>{const n=node(id);if(!n)return;const q=wpos(n),r=RNG(G.seed,'fogstart',id);seeFrom(q.x,q.y);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+r(),d=120+r()*90;seeFrom(q.x+Math.cos(a)*d*1.3,q.y+Math.sin(a)*d)}});
  G.fog.s=G.fog.p.length}   // the chart draws your track from here on
function seeFrom(x,y){const F=G.fog;F.p.push(Math.round(x),Math.round(y));
  G.map.nodes.forEach(n=>{if(F.f.includes(n.id))return;const q=wpos(n);if(Math.hypot(q.x-x,q.y-y)<SIGHT*.85+destR(n)*.4){F.f.push(n.id);SEA.newly.add(n.id)}})}
/* the fog's edge billows: each lifted circle is a little bigger or smaller than the last */
const fogR=i=>{const v=Math.sin(i*12.9898)*43758.5453;return SIGHT*(.86+.14*(v-Math.floor(v)))};

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
/* Ships are drawn from their real shape, turned to their heading and seen from above at an angle, so they look right whichever
   way they sail: the hull's sides that face you, the deck, the stern cabin, then masts and sails from back to front.
   m: masts as [position along the hull, height]. Drawings are cached per heading (64 of them). */
const SHIPISO={sloop:{m:[[4,60]]},galleon:{L:1.12,m:[[14,52],[-8,62]]},privateer:{m:[[12,54],[-10,60]],dark:1},junk:{m:[[4,58]],junk:1},
  t:{m:[[4,56]]},e:{L:1.12,m:[[13,52],[-9,60]]},b:{L:1.55,m:[[16,50],[-2,62],[-19,48]]},row:{L:.8,m:[],fig:1}};
const HULL=[[34,0],[27,7.5],[14,11.5],[-6,12],[-22,10.5],[-29,8],[-30,0],[-29,-8],[-22,-10.5],[-6,-12],[14,-11.5],[27,-7.5]];
const CABIN=[[-17,8],[-28,7],[-28,-7],[-17,-8]];
const isoCache=new Map();
function isoShip(a,kind){const q=Math.round(a/(Math.PI/32))&63,key=kind+q;let s=isoCache.get(key);if(s)return s;
  const A=q*Math.PI/32,c=Math.cos(A),sn=Math.sin(A),o=SHIPISO[kind]||SHIPISO.sloop,L=(o.L||1)*1.2;
  const P=(x,y,z)=>[(x*c-y*sn)*L,((x*sn+y*c)*SK-z)*L];
  // the faces of a solid between an outline at z0 and one at z1 (the bottom one narrowed by k) that face the viewer
  const sides=(pts,z0,z1,k,c1,c2)=>{let g='';const n=pts.length,top=pts.map(([x,y])=>P(x,y,z1)),bot=pts.map(([x,y])=>P(x*k[0],y*k[1],z0));
    pts.forEach((p,i)=>{const j=(i+1)%n,q2=pts[j];let nx=q2[1]-p[1],ny=-(q2[0]-p[0]);
      const mx=(p[0]+q2[0])/2,my=(p[1]+q2[1])/2;if(nx*mx+ny*my<0){nx=-nx;ny=-ny}
      const len=Math.hypot(nx,ny),wy=(nx*sn+ny*c)/len,wx=(nx*c-ny*sn)/len;if(wy<=.02)return;
      g+=`<path class="${wx<-.25?c2:c1}" d="${poly([top[i],top[j],bot[j],bot[i]])}"/>`});
    return{g,top}};
  const H=9,hull=sides(HULL,0,H,[.88,.72],'s-hull','s-hull2'),cab=sides(CABIN,H,H+7,[1,1],'s-hull','s-hull2');
  let g=`<path class="o-lap" d="${curve(HULL.map(([x,y])=>P(x*1.16-2,y*1.6,0)))}"/>`+hull.g+`<path class="s-deck" d="${poly(hull.top)}"/>`;
  if(!o.fig)g+=`<path d="M${pt(P(24,0,H))}L${pt(P(-14,0,H))}" stroke-width="1" opacity=".5"/>`+cab.g+`<path class="s-deck" d="${poly(cab.top)}"/>`;
  // masts, sails, the jib and the flag, sorted by how near they are to the viewer
  const parts=[],front=sn>0,sc=o.dark?['s-dsail','s-dsail2']:['s-sail','s-sail2'],tall=o.m.reduce((b,m)=>m[1]>b[1]?m:b,[0,0]);
  o.m.forEach(([mx,h])=>{const t=H+h-8,b=H+16,w1=13+h*.07,w2=16+h*.07;
    const tl=P(mx,-w1,t),tr=P(mx,w1,t),br=P(mx,w2,b),bl=P(mx,-w2,b),tc=P(mx+4,0,t),bc=P(mx+9,0,b);
    const ctl=(m,a2,b2)=>[2*m[0]-(a2[0]+b2[0])/2,2*m[1]-(a2[1]+b2[1])/2];
    let sail=`<path class="${front?sc[0]:sc[1]}" d="M${pt(tl)}Q${pt(ctl(tc,tl,tr))} ${pt(tr)}L${pt(br)}Q${pt(ctl(bc,br,bl))} ${pt(bl)}Z"/>`;
    if(o.junk)for(let k=1;k<4;k++){const u=k/4,l=[tl[0]+(bl[0]-tl[0])*u,tl[1]+(bl[1]-tl[1])*u],r2=[tr[0]+(br[0]-tr[0])*u,tr[1]+(br[1]-tr[1])*u];sail+=`<path d="M${pt(l)}L${pt(r2)}" stroke-width="1.2"/>`}
    const mast=`<path d="M${pt(P(mx,0,H))}L${pt(P(mx,0,H+h+(mx===tall[0]?4:0)))}" stroke-width="2.2"/>`;
    const flag=mx===tall[0]?`<path class="s-flag" d="${poly([P(mx,0,H+h+4),P(mx-14,0,H+h),P(mx,0,H+h-4)])}"/>`:'';
    parts.push({d:mx*sn,s:(front?mast+sail:sail+mast)+flag})});
  if(o.m.length){const[fx,fh]=o.m.reduce((b,m)=>m[0]>b[0]?m:b);
    parts.push({d:32*sn,s:`<path d="M${pt(P(31,0,H+1))}L${pt(P(44,0,H+4))}" stroke-width="2"/><path class="${front?sc[0]:sc[1]}" d="${poly([P(fx+1,0,H+fh-6),P(43,0,H+4),P(fx+6,0,H+12)])}"/>`})}
  if(o.fig){const hd=P(0,0,H+15);parts.push({d:0,s:`<path class="s-flag" d="M${pt(P(-4,0,H))}Q${pt(P(0,0,H+14))} ${pt(P(4,0,H))}Z"/><circle class="o-skin" cx="${f1(hd[0])}" cy="${f1(hd[1])}" r="${f1(3.6*L)}"/>`})}
  parts.sort((a,b)=>a.d-b.d).forEach(p=>g+=p.s);
  isoCache.set(key,g);return g}
const shipKind=()=>SHIPISO[G.ship]?G.ship:'sloop';
/* an island: a seeded blob of land standing a little out of the sea, its cliff showing on the near side, shallows round it */
function isleArt(n,live){const town=n.type==='port',r=RNG(G.seed,'isleart',n.id),Rd=isleR(n),zt=14,k=11;
  const pts=Array.from({length:k},(_,i)=>{const a=i/k*Math.PI*2,rr=Rd*(.84+r()*.26);return[Math.cos(a)*rr*1.12,Math.sin(a)*rr]});
  const at=(s,z)=>pts.map(([x,y])=>pr(x*s,y*s,z));
  let g=`<path class="o-shore" d="${curve(at(1.28,0))}"/><path class="o-cliff" d="${curve(at(1,0))}"/><path class="o-land" d="${curve(at(1,zt))}"/>`;
  for(let i=0;i<5;i++){const x=(r()-.5)*Rd*1.2,y=(r()-.5)*Rd*.9,p=pr(x,y,zt);g+=`<path class="o-hatch" d="M${pt(p)}l7 -3"/>`}
  const things=[];   // drawn back to front
  if(town){
    // a jetty out into the water on the near side, where you make port
    const jx=Rd*.18,j0=pr(jx-6,Rd*.7,zt-4),j1=pr(jx+6,Rd*.7,zt-4),j2=pr(jx+6,Rd*1.42,4),j3=pr(jx-6,Rd*1.42,4);
    things.push({y:Rd*1.4,s:`<path d="M${pt(j3)}v8M${pt(j2)}v8" stroke-width="1.6"/><path class="o-wood" d="${poly([j0,j1,j2,j3])}"/>`});
    // the lighthouse on the east point
    const lh=[Rd*.72,-Rd*.18],b=pr(lh[0],lh[1],zt);
    things.push({y:lh[1],s:`<g transform="translate(${pt(b)})"><path class="o-wall" d="M-7 0V-40H7V0z"/><path class="o-roof" d="M-7 -14h14v-7h-14zM-7 -30h14v-5h-14z"/><path class="o-win" d="M-5 -40h10v-8h-10z"/><path class="o-roof" d="M-8 -48h16l-8 -9z"/><path d="M-7 0a7 3 0 0 0 14 0" fill="none"/></g>`});
    // houses, back to front
    const spots=[];for(let t=0;t<40&&spots.length<5;t++){const x=(r()-.5)*Rd*1.1,y=(r()-.4)*Rd*.9;if(Math.hypot(x-lh[0],(y-lh[1])*1.6)<34)continue;if(spots.every(s=>Math.hypot(s[0]-x,(s[1]-y)*1.6)>34))spots.push([x,y])}
    spots.forEach(([x,y],i)=>{const b2=pr(x,y,zt);things.push({y,s:isoHouse(b2[0],b2[1],22+r()*8,13+r()*8,9+r()*5,i%3)})});
    const w=n.name.length*8.4+22;
    things.push({y:1e4,s:`<g class="o-name" transform="translate(${f1(-Rd*.62)} ${f1(Rd*SK+22)})"><rect x="${f1(-w/2)}" y="-14" width="${f1(w)}" height="24" rx="9"/><text y="3.5" text-anchor="middle">${n.name}</text></g>`});
  }else{
    for(let i=0;i<3;i++){const x=(r()-.5)*Rd*.9,y=(r()-.5)*Rd*.6,b2=pr(x,y,zt),lean=(r()-.5)*16,h=26+r()*12;
      things.push({y,s:`<g transform="translate(${pt(b2)})"><path class="o-trunk" d="M-2 0q${f1(lean/2)} ${f1(-h/2)} ${f1(lean)} ${f1(-h)}l3 1q${f1(-lean/2+2)} ${f1(h/2)} 2 ${f1(h-1)}z"/>${[-1,-.4,.4,1].map(s=>`<path class="o-leaf" d="M${f1(lean)} ${f1(-h)}q${f1(s*9)} -9 ${f1(s*20)} ${f1(Math.abs(s)*6-2)}q${f1(-s*10)} -3 ${f1(-s*20)} ${f1(-Math.abs(s)*6+2)}z"/>`).join('')}</g>`})}
    if(!live){const b2=pr(-Rd*.2,Rd*.2,zt);things.push({y:Rd*.2,s:`<g transform="translate(${pt(b2)})"><path d="M0 0v-30" stroke-width="2"/><path class="s-flag" d="M0 -30l16 5l-16 5z"/></g>`})}
  }
  things.sort((a,b)=>a.y-b.y).forEach(t=>g+=t.s);return g}
/* a little house seen from the corner: two walls (the shaded one on the right), a pyramid roof and a window */
function isoHouse(x,y,w,h,rh,v){const dx=w/2,dy=dx*.5,F=[x,y],Lf=[x-dx,y-dy],Rt=[x+dx,y-dy],up=(p,z)=>[p[0],p[1]-z];
  const ap=[x,y-dy-h-rh],o=1.15,ov=p=>[x+(p[0]-x)*o,y-dy-h+(p[1]-(y-dy-h))*o],lerp=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
  const wl=[.32,.68].map(u=>lerp(Lf,F,u));
  return`<g class="o-house r${v}"><path class="o-wall" d="${poly([Lf,F,up(F,h),up(Lf,h)])}"/><path class="o-wall2" d="${poly([F,Rt,up(Rt,h),up(F,h)])}"/>
    <path class="o-win" d="${poly([up(wl[0],h*.38),up(wl[1],h*.38),up(wl[1],h*.72),up(wl[0],h*.72)])}" stroke-width="1"/>
    <path class="o-roof" d="${poly([ov(up(Lf,h)),ov(up(F,h)),ap])}"/><path class="o-roof2" d="${poly([ov(up(F,h)),ov(up(Rt,h)),ap])}"/></g>`}
/* barrels and a crate adrift: something to look into */
function flotsamArt(){const barrel=(x,y)=>`<g transform="translate(${x} ${y})"><path class="o-wood" d="M-7 -12v12a7 3.5 0 0 0 14 0v-12z"/><ellipse class="o-wood2" cx="0" cy="-12" rx="7" ry="3.5"/><path d="M-7 -5a7 3.5 0 0 0 14 0" fill="none" stroke-width="1.2"/></g>`;
  return`<ellipse class="o-lap" rx="34" ry="${f1(34*SK)}"/><g class="boatbob">${barrel(-14,4)}${barrel(12,-2)}<g transform="translate(0 10) rotate(-8)"><path class="o-wood2" d="M-9 -6l9-4 9 4-9 4z"/><path class="o-wood" d="M-9 -6v6l9 4v-6zM9 -6v6l-9 4v-6z"/></g></g>`}
/* a beaten ship: planks and a broken mast on the water */
function wreckArt(){return`<ellipse class="o-lap" rx="40" ry="${f1(40*SK)}"/><g class="boatbob"><path class="o-wood" d="M-26 4l20 -6 2 5 -20 6z"/><path class="o-wood" d="M4 -8l24 3 -1 5 -24 -3z"/><path class="o-wood2" d="M-6 10l18 -2 1 5 -18 2z"/><path d="M-2 0l10 -30" stroke-width="2.4"/><path class="s-sail2" d="M6 -24l12 4 -4 8z"/></g>`}
/* fishing grounds: boiling water and gulls wheeling over it */
function fishArt(){const gull=(a)=>`<path d="M${f1(Math.cos(a)*34-6)} ${f1(Math.sin(a)*34)}q3 -4 6 0q3 -4 6 0" fill="none" stroke-width="1.6"/>`;
  return`${[0,1,2,3,4].map(i=>`<ellipse class="o-boil" style="animation-delay:${-i*.5}s" cx="${(i%3-1)*14}" cy="${(i%2)*8-4}" rx="9" ry="${f1(9*SK)}"/>`).join('')}
    <g transform="translate(0 -46)"><g transform="scale(1 ${SK})"><g class="o-gulls">${[0,2.1,4.2].map(gull).join('')}</g></g></g>`}
const ripArt=()=>`<ellipse class="o-lap" rx="26" ry="${f1(26*SK)}"/>`;
/* the round glyph floating over a stop, as on the chart */
const badge=(type,y)=>`<g transform="translate(0 ${y})"><g class="o-badge"><circle r="13"/><g transform="translate(-8.3 -8.3) scale(.69)" fill="none" stroke-width="2.4">${NG[type]}</g></g></g>`;
/* each stranger's ship faces somewhere of its own until you're near; then it turns to watch you */
const foeAng=n=>RNG(G.seed,'face',n.id)()*Math.PI*2;
function destArt(n,live){const t=n.type;
  if(t==='port'||t==='isle')return isleArt(n,live);
  if(t==='threat'||t==='elite'||t==='boss'){if(!live)return wreckArt();const k=t==='boss'?'b':t==='elite'?'e':'t',L=SHIPISO[k].L||1;
    return`<g class="shipdraw foe-${k}"><g class="boatbob"><g class="o-ship">${isoShip(foeAng(n),k)}</g></g></g>${badge(t,-Math.round(70*L+26))}${t==='boss'?`<g class="o-name boss" transform="translate(0 30)"><text y="3" text-anchor="middle">${ENEMIES[n.enemy].n}</text></g>`:''}`}
  if(!live)return ripArt();
  if(t==='event')return flotsamArt()+badge('event',-44);
  if(t==='npc')return`<g class="shipdraw foe-n"><g class="boatbob"><g class="o-ship">${isoShip(foeAng(n),'row')}</g></g></g>`+badge('npc',-50);
  if(t==='fish')return fishArt()+badge('fish',-78);
  return ripArt()}
function destHTML(n){const q=wpos(n),live=seaLive(n),pop=SEA.newly.has(n.id);
  return`<g class="dest d-${n.type}${live?' live':' spent'}" data-id="${n.id}" data-y="${q.y}" transform="translate(${f1(q.x)} ${f1(q.y*SK)})"${live?` tabindex="0" role="button" aria-label="${nodeTitle(n)}"`:''}>
    <ellipse class="o-hit" rx="${f1(destR(n)*.85)}" ry="${f1(destR(n)*.85*SK+30)}" cy="-20"/><g class="dbody${pop?' pop':''}">${destArt(n,live)}</g></g>`}
/* draw every stop you've found, back to front, and put your ship back among them */
function seaThings(){const L=SEA.el&&SEA.el.querySelector('#seathings');if(!L)return;
  const ns=G.map.nodes.filter(seaFound).sort((a,b)=>wpos(a).y-wpos(b).y);
  L.innerHTML=ns.map(destHTML).join('');
  SEA.newly.clear();SEA.ship=null;SEA.q=-1;
  SEA.foes=[...L.querySelectorAll('.dest.live.d-threat,.dest.live.d-elite,.dest.live.d-boss,.dest.live.d-npc')].map(el=>{const n=node(+el.dataset.id);return{el:el.querySelector('.o-ship'),n,q:wpos(n),k:n.type==='boss'?'b':n.type==='elite'?'e':n.type==='npc'?'row':'t',a:-1}});
  L.querySelectorAll('.dest.live').forEach(el=>el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();seaTapDest(+el.dataset.id)}})}
/* wave marks on the open water, from seeded tiles, so the sea goes on as far as you sail */
function seaWaves(v){const T=300,x0=Math.floor(v.x0/T),x1=Math.floor(v.x1/T),y0=Math.floor(v.y0/T),y1=Math.floor(v.y1/T),key=[x0,x1,y0,y1].join();
  if(key===SEA.wkey)return;SEA.wkey=key;
  const land=G.map.nodes.filter(n=>n.type==='port'||n.type==='isle').map(n=>[wpos(n),isleR(n)*1.5]);let g='';
  for(let tx=x0;tx<=x1;tx++)for(let ty=y0;ty<=y1;ty++){const r=RNG(G.seed,'wv',G.sea,tx,ty);
    for(let k=0;k<4;k++){const x=(tx+r())*T,y=(ty+r())*T,w=7+r()*7,dl=-r()*6;if(land.some(([q,rr])=>Math.hypot(q.x-x,q.y-y)<rr))continue;
      g+=`<path class="wv" style="animation-delay:${dl.toFixed(2)}s" d="M${f1(x-w)} ${f1(y*SK)}q${f1(w/4)} -4 ${f1(w/2)} 0t${f1(w/2)} 0t${f1(w/2)} 0t${f1(w/2)} 0"/>`}}
  SEA.el.querySelector('#seawaves').innerHTML=g}

/* ---------- the screen ---------- */
const CHARTICON='<svg viewBox="0 0 32 32" aria-hidden="true"><path class="w" d="M7 7h18v18H7z"/><path d="M11 21c2-4 6-2 8-6s2-4 3-5" fill="none" stroke-dasharray="1.5 3"/><path d="M19 9l3 3M22 9l-3 3"/><rect class="w" x="4" y="4" width="24" height="5" rx="2.5"/><rect class="w" x="4" y="23" width="24" height="5" rx="2.5"/></svg>';
function openSea(){
  cancelAnimationFrame(raf);B=null;G.inPort=false;PV.id=null;
  if(G.sel==null)G.moving=false;
  fogInit();const p=seaShip();
  app.innerHTML=`<div class="charthead">${barHTML()}<div class="seahead"><h2>${SEAS[G.sea]}</h2><span>Sea ${G.sea+1} of 3</span></div></div>
    <div class="ocean" id="ocean"><svg id="seasvg" role="application" aria-label="The open sea. Tap the water to sail there, or tap a place to sail to it."><g id="seacam"><g id="seawaves"></g><g id="seawake"></g><g id="seatgt"></g><g id="seathings"></g></g></svg>
      <canvas id="seafog" aria-hidden="true"></canvas><div class="seapoint" id="seapoint" hidden aria-hidden="true"><i></i><svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${NG.boss}</svg></div></div>
    <button class="chartbtn" id="chartbtn" type="button" aria-label="Open your chart">${CHARTICON}<span>Chart</span></button>
    ${holdDock('')}`;
  document.body.classList.add('atsea');
  bindBar();bindHold('hold',chart);fitDock();
  SEA.el=app.querySelector('#ocean');SEA.wkey='';
  SEA.inside=new Set(G.map.nodes.filter(n=>seaFound(n)&&seaLive(n)&&Math.hypot(dockAt(n).x-p.x,dockAt(n).y-p.y)<arriveR(n)+30).map(n=>n.id));
  if(SEA.cx==null||Math.hypot(SEA.cx-p.x,SEA.cy-p.y)>600){SEA.cx=p.x;SEA.cy=p.y}
  seaLayout();seaThings();seaBind();
  document.getElementById('chartbtn').onclick=()=>seaChart();
  if(!SEA.raf){SEA.last=0;SEA.raf=requestAnimationFrame(seaLoop)}
  save();coach('chart');
}
/* the space the sea shows between the top bar and the hold, and the fog's canvas to match */
function seaLayout(){const el=SEA.el;if(!el)return;const r=el.getBoundingClientRect(),h=app.querySelector('.charthead'),d=app.querySelector('.dock');
  SEA.ox=r.left;SEA.oy=r.top;SEA.vw=r.width;SEA.vh=r.height;
  SEA.top=h?Math.max(0,h.getBoundingClientRect().bottom-r.top):0;SEA.bot=d?d.getBoundingClientRect().top-r.top:r.height;
  if(SEA.bot-SEA.top<120)SEA.bot=Math.min(r.height,SEA.top+120);
  SEA.Z=clamp(Math.min(SEA.vw/520,(SEA.bot-SEA.top)/470),1,1.5);
  const c=el.querySelector('#seafog'),dpr=Math.min(2,devicePixelRatio||1);
  if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr)}SEA.dpr=dpr}
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
  seaDraw(real)}
/* one tick of sailing. Returns true when she arrived somewhere (and the sea stops for the card). */
function seaStep(dt){const p=G.pos;let want=0;
  if(SEA.target){const dx=SEA.target.x-p.x,dy=SEA.target.y-p.y,d=Math.hypot(dx,dy);
    if(d<(SEA.hold?34:14)){if(!SEA.hold){SEA.target=null;seaMark()}}
    else{
      // stuck against the edge of the sea or a shore with no way round: give up after a few seconds rather than push forever
      if(SEA.best==null||d<SEA.best-8){SEA.best=d;SEA.stall=0}else if(!SEA.hold&&(SEA.stall+=dt)>3.5){SEA.target=null;seaMark();return false}
      const da=angD(Math.atan2(dy,dx)-p.a),t=TURN*dt;p.a=angD(p.a+clamp(da,-t,t));
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
  SEA.dirty=true;SEA.trav+=SEA.v*dt;
  if(SEA.trav>26){SEA.trav=0;seaWake()}
  const F=G.fog.p;if(Math.hypot(p.x-F[F.length-2],p.y-F[F.length-1])>70){seeFrom(p.x,p.y);if(SEA.newly.size){const found=[...SEA.newly].map(node);seaThings();seaCall(found)}}
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
/* "Land ho!": a call from the lookout when you find something */
function seaCall(ns){const k=ns.some(n=>n.type==='boss')?'boss':ns.some(n=>n.type==='port')?'port':ns.some(n=>n.type==='isle')?'isle':ns.some(n=>n.enemy)?'ship':ns.some(n=>n.type==='fish')?'fish':'odd';
  const t={boss:'Something huge, dead ahead!',port:'Land ho! A port!',isle:'Land ho!',ship:'Sail ho!',fish:'Birds working the water!',odd:'Something in the water!'}[k];
  if(SEA.call)SEA.call.remove();const c=document.createElement('div');c.className='seacall';c.setAttribute('role','status');c.textContent=t;SEA.el.appendChild(c);SEA.call=c;
  setTimeout(()=>{if(c===SEA.call){c.classList.add('out');setTimeout(()=>c.remove(),400)}},1700)}
function seaDraw(dt){const p=G.pos,Z=SEA.Z,el=SEA.el;
  const k=Math.min(1,dt*3.2);SEA.cx+=(p.x-SEA.cx)*k;SEA.cy+=(p.y-SEA.cy)*k;
  const cy0=SEA.top+(SEA.bot-SEA.top)*.62,tx=SEA.vw/2-SEA.cx*Z,ty=cy0-SEA.cy*SK*Z;SEA.tx=tx;SEA.ty=ty;
  el.querySelector('#seacam').setAttribute('transform',`translate(${f1(tx)} ${f1(ty)}) scale(${Z.toFixed(3)})`);
  // your ship, among the stops so nearer things cover farther ones
  const L=el.querySelector('#seathings');
  if(!SEA.ship||!SEA.ship.isConnected){SEA.ship=document.createElementNS('http://www.w3.org/2000/svg','g');SEA.ship.id='seaship';SEA.ship.setAttribute('class',`shipdraw ship-${shipKind()}`);SEA.ship.innerHTML='<g class="boatbob"><g class="o-ship"></g></g>';SEA.q=-1}
  const q=Math.round(p.a/(Math.PI/32))&63;if(q!==SEA.q){SEA.q=q;SEA.ship.querySelector('.o-ship').innerHTML=isoShip(p.a,shipKind())}
  SEA.ship.setAttribute('transform',`translate(${f1(p.x)} ${f1(p.y*SK)})`);
  let next=null;for(const c of L.children){if(c!==SEA.ship&&+c.dataset.y>p.y){next=c;break}}
  if(SEA.ship.parentNode!==L||SEA.ship.nextSibling!==next)L.insertBefore(SEA.ship,next);
  // strangers turn to watch you as you come near
  SEA.foes.forEach(f=>{if(!f.el||Math.hypot(f.q.x-p.x,f.q.y-p.y)>520)return;const a=Math.atan2(p.y-f.q.y,p.x-f.q.x)+(f.k==='row'?0:Math.PI/2),qq=Math.round(a/(Math.PI/32))&63;
    if(qq!==f.a){f.a=qq;f.el.innerHTML=isoShip(a,f.k)}});
  const v={x0:-tx/Z,x1:(SEA.vw-tx)/Z,y0:-ty/Z/SK,y1:(SEA.vh-ty)/Z/SK};
  seaWaves(v);seaFog(v);seaPoint();
  if(SEA.call){const sx=tx+p.x*Z,sy=ty+p.y*SK*Z;SEA.call.style.transform=`translate(${f1(sx)}px,${f1(sy-110*Z)}px) translate(-50%,-100%)`}}
/* the fog: flat paper fog with stipple, cut away round everywhere you've sailed, with an ink line along its edge */
let fogPat=null;
function seaFog(v){const c=SEA.el.querySelector('#seafog'),x=c.getContext('2d'),d=SEA.dpr,Z=SEA.Z;
  x.setTransform(d,0,0,d,0,0);x.globalCompositeOperation='source-over';x.clearRect(0,0,SEA.vw,SEA.vh);
  if(!fogPat){const t=document.createElement('canvas');t.width=t.height=9;const tc=t.getContext('2d');tc.fillStyle='rgba(0,0,0,.26)';tc.beginPath();tc.arc(2,2,.9,0,7);tc.fill();tc.fillStyle='rgba(0,0,0,.16)';tc.beginPath();tc.arc(6.5,6.5,.9,0,7);tc.fill();fogPat=x.createPattern(t,'repeat')}
  x.fillStyle=SEA.fogC||(SEA.fogC=getComputedStyle(document.documentElement).getPropertyValue('--fog').trim()||'#E8DFD0');x.fillRect(0,0,SEA.vw,SEA.vh);x.fillStyle=fogPat;x.fillRect(0,0,SEA.vw,SEA.vh);
  const P=G.fog.p,vis=[];for(let i=0;i<P.length;i+=2){const r=fogR(i/2);if(P[i]+r<v.x0||P[i]-r>v.x1||P[i+1]+r<v.y0||P[i+1]-r>v.y1)continue;vis.push([P[i],P[i+1],r])}
  x.translate(SEA.tx,SEA.ty);x.scale(Z,Z);
  const ring=sh=>{x.beginPath();vis.forEach(([px,py,r])=>{x.moveTo(px+r-sh,py*SK);x.ellipse(px,py*SK,r-sh,(r-sh)*SK,0,0,Math.PI*2)})};
  ring(0);x.lineWidth=2.4/Z;x.strokeStyle='#000';x.stroke();
  x.globalCompositeOperation='destination-out';x.fillStyle='#000';ring(1.3/Z);x.fill();x.globalCompositeOperation='source-over'}
/* an arrow at the edge of the screen pointing to the sea's boss, while it's out of sight */
function seaPoint(){const el=SEA.el.querySelector('#seapoint'),b=node(G.map.boss);if(!el||!b)return;const q=wpos(b),Z=SEA.Z;
  const sx=SEA.tx+q.x*Z,sy=SEA.ty+q.y*SK*Z,m=34,top=SEA.top+m,bot=SEA.bot-m;
  if(seaFound(b)&&sx>m&&sx<SEA.vw-m&&sy>top&&sy<bot){el.hidden=true;return}
  const cx=SEA.vw/2,cy=(top+bot)/2,dx=sx-cx,dy=sy-cy,k=Math.min(Math.abs((SEA.vw/2-m)/(dx||1e-6)),Math.abs(((bot-top)/2)/(dy||1e-6)),1);
  el.hidden=false;el.style.transform=`translate(${f1(cx+dx*k)}px,${f1(cy+dy*k)}px)`;el.firstChild.style.transform=`rotate(${Math.atan2(dy,dx).toFixed(3)}rad)`}
/* what's here: the card when you sail into a stop, with the button that goes in */
function seaArrive(n){const{head,body}=nodeInfo(n);
  const verb={port:'Make port',threat:'Engage',elite:'Engage',boss:'Engage',event:'Take a look',isle:'Go ashore',npc:'Hail them',fish:'Cast your lines'}[n.type]||'Go';
  const ov=overlay(`<h2>${head}</h2>${body}<div class="sh-actions"><button class="ghost" data-a="close">Sail on</button><button class="primary" data-a="go">${verb}</button></div>`);
  ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();return}const a=e.target.closest('[data-a]');if(!a)return;ov.remove();if(a.dataset.a==='go')seaVisit(n.id)});
  ov.querySelector('[data-a="go"]').focus()}
function seaVisit(id){const n=node(id);G.pos.at=id;SEA.target=null;
  if(n.type==='port'&&G.at===id){coach('sail');return port(id)}   // back to the port you last left: no new day, no wages
  goNow(id)}

/* ---------- the chart ---------- */
/* your chart of this sea, seen straight down: the water you've sailed is inked in, the rest is blank paper. Every place you've
   found is marked, the ones you're done with crossed off, with your track and where you are now. */
function seaChart(inPort){fogInit();seaShip();const s=1/5,X=v=>f1(v*s),P=G.fog.p,x0=-260,y0=-480,W=SEA_W+520,H=SEA_LEN+960;
  let circ='';for(let i=0;i<P.length;i+=2)circ+=`<circle cx="${X(P[i])}" cy="${X(P[i+1])}" r="${X(fogR(i/2)*.9)}"/>`;
  const r=RNG(G.seed,'chartwv',G.sea);let wv='';for(let i=0;i<160;i++){const x=x0+r()*W,y=y0+r()*H,w=5+r()*4;wv+=`<path d="M${X(x)-w} ${X(y)}q${w/4} -3 ${w/2} 0t${w/2} 0t${w/2} 0t${w/2} 0"/>`}
  const found=G.map.nodes.filter(seaFound),b=node(G.map.boss);
  let land='',marks='';
  found.filter(n=>n.type==='port'||n.type==='isle').forEach(n=>{const q=wpos(n),rr=isleR(n)*s;land+=`<ellipse cx="${X(q.x)}" cy="${X(q.y)}" rx="${f1(rr*1.15)}" ry="${f1(rr)}"/>`});
  [...new Set([...found,b])].forEach(n=>{const q=wpos(n),big=n.type==='boss',rr=big?15:11,done=!seaLive(n),known=seaFound(n);
    marks+=`<g class="sc-node${done?' done':''}" transform="translate(${X(q.x)} ${X(q.y)})"><circle r="${rr}"/><g transform="translate(${big?-10:-7.5} ${big?-10:-7.5}) scale(${big?.83:.62})" fill="none" stroke-width="2.4">${known?NG[n.type]:NG.event}</g>${done?`<path class="x" d="M${-rr-3} ${-rr-3}L${rr+3} ${rr+3}M${rr+3} ${-rr-3}L${-rr-3} ${rr+3}"/>`:''}
      ${n.type==='port'?`<text y="${rr+15}" text-anchor="middle">${n.name}</text>`:big?`<text y="${-rr-7}" text-anchor="middle">${known?ENEMIES[n.enemy].n:'Something waits'}</text>`:''}</g>`});
  G.charts.forEach(c=>{if(c.sea!==G.sea)return;const n=node(c.at);if(!n)return;const q=wpos(n);
    marks+=`<g transform="translate(${f1(q.x*s+14)} ${f1(q.y*s-22)}) scale(.6)" fill="none" stroke-width="2.4">${CHARTS[c.k].g}</g>`});
  let track='';for(let i=G.fog.s||0;i<P.length;i+=2)track+=(i>(G.fog.s||0)?'L':'M')+X(P[i])+' '+X(P[i+1]);
  const p=G.pos;
  const svg=`<svg viewBox="${X(x0)} ${X(y0)} ${X(W)} ${X(H)}" aria-label="Your chart of ${SEAS[G.sea]}"><defs><clipPath id="scseen">${circ}</clipPath>
    <pattern id="scfog" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#000" opacity=".25"/></pattern></defs>
    <rect class="sc-paper" x="${X(x0)}" y="${X(y0)}" width="${X(W)}" height="${X(H)}"/><rect x="${X(x0)}" y="${X(y0)}" width="${X(W)}" height="${X(H)}" fill="url(#scfog)"/>
    <text class="sc-monsters" x="${X(SEA_W/2)}" y="${X(SEA_LEN*.3)}" text-anchor="middle">here be monsters</text>
    <g class="sc-edge">${circ}</g><g class="sc-sea">${circ}</g><g clip-path="url(#scseen)"><g class="sc-wv">${wv}</g><g class="sc-land">${land}</g></g>
    <path class="sc-track" d="${track}"/>${marks}
    <g transform="translate(${X(p.x)} ${X(p.y)})"><g transform="translate(-12 -26)" stroke="#000" stroke-width="1.8" stroke-linejoin="round" fill="#FBF5E8"><path d="M11 1v17" fill="none"/><path d="M12 3c6 3 7 8 6 13h-6z"/><path d="M1 18h21l-3 5H4z" fill="#5E7487"/></g></g></svg>`;
  const ov=overlay(`<div class="peekhead"><h2>${SEAS[G.sea]}</h2><span class="soft">${found.length} of ${G.map.nodes.length} places found</span></div>
    <div class="peekwrap" id="peekwrap"><div class="seachart">${svg}</div></div><button class="primary" data-a="close">${inPort?'Back to port':'Back to the sea'}</button>`,false,'peekov');
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]'))ov.remove()});
  const wrap=ov.querySelector('#peekwrap'),sv=ov.querySelector('svg');
  if(wrap&&sv){const k=sv.getBoundingClientRect().height/(H*s);wrap.scrollTop=Math.max(0,(p.y-y0)*s*k-wrap.clientHeight*.5)}}
