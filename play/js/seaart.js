/* Golden Shore: How things look on the open sea. Ships at any heading, islands and towns, creatures, scenery and flotsam.
   Nothing out here is drawn as an icon: each place looks like what it is. Everything is drawn round its own spot on the water
   (0,0), seen from above at an angle (pr in sea.js). */
"use strict";
/* Ships are drawn from their real shape, turned to their heading, so they look right whichever way they sail: the hull's sides
   that face you, the deck, the stern cabin, then masts and sails from back to front. m: masts as [position along the hull,
   height]. Drawings are cached per heading (64 of them). */
const SHIPISO={sloop:{m:[[4,60]]},galleon:{L:1.12,m:[[14,52],[-8,62]]},privateer:{m:[[12,54],[-10,60]],dark:1},junk:{m:[[4,58]],junk:1},
  t:{m:[[4,56]]},e:{L:1.12,m:[[13,52],[-9,60]]},b:{L:1.55,m:[[16,50],[-2,62],[-19,48]]},jk:{L:1.05,m:[[10,52],[-10,56]],junk:1},row:{L:.8,m:[],fig:1}};
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
  let g=hull.g+`<path class="s-deck" d="${poly(hull.top)}"/>`;
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
/* the water round a hull: a band of pale foam where she meets the sea. It stays on the water while the ship rides the swell. */
const isoFoam=new Map();
function isoWater(a,kind){const q=Math.round(a/(Math.PI/32))&63,key=kind+q;let s=isoFoam.get(key);if(s)return s;
  const A=q*Math.PI/32,c=Math.cos(A),sn=Math.sin(A),o=SHIPISO[kind]||SHIPISO.sloop,L=(o.L||1)*1.2,P=(x,y)=>[(x*c-y*sn)*L,(x*sn+y*c)*SK*L];
  s=`<path class="o-foam" d="${curve(HULL.map(([x,y])=>P(x*1.12+(x>0?4:-2),y*1.55)))}"/>`;isoFoam.set(key,s);return s}
const shipKind=()=>SHIPISO[G.ship]?G.ship:'sloop';

/* ---------- islands ---------- */
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
    const lh=LIGHT(Rd),b=pr(lh[0],lh[1],zt);
    things.push({y:lh[1],s:`<g transform="translate(${pt(b)})"><path class="o-wall" d="M-7 0V-40H7V0z"/><path class="o-roof" d="M-7 -14h14v-7h-14zM-7 -30h14v-5h-14z"/><path class="o-win" d="M-5 -40h10v-8h-10z"/><path class="o-roof" d="M-8 -48h16l-8 -9z"/><path d="M-7 0a7 3 0 0 0 14 0" fill="none"/></g>`});
    // houses, back to front
    const spots=[];for(let t=0;t<40&&spots.length<5;t++){const x=(r()-.5)*Rd*1.1,y=(r()-.4)*Rd*.9;if(Math.hypot(x-lh[0],(y-lh[1])*1.6)<34)continue;if(spots.every(s=>Math.hypot(s[0]-x,(s[1]-y)*1.6)>34))spots.push([x,y])}
    spots.forEach(([x,y],i)=>{const b2=pr(x,y,zt);things.push({y,s:isoHouse(b2[0],b2[1],22+r()*8,13+r()*8,9+r()*5,i%3)})});
  }else{
    for(let i=0;i<3;i++){const x=(r()-.5)*Rd*.9,y=(r()-.5)*Rd*.6,b2=pr(x,y,zt);things.push({y,s:`<g transform="translate(${pt(b2)})">${palm(r)}</g>`})}
    if(!live){const b2=pr(-Rd*.2,Rd*.2,zt);things.push({y:Rd*.2,s:`<g transform="translate(${pt(b2)})"><path d="M0 0v-30" stroke-width="2"/><path class="s-flag" d="M0 -30l16 5l-16 5z"/></g>`})}
  }
  things.sort((a,b)=>a.y-b.y).forEach(t=>g+=t.s);return g}
const LIGHT=Rd=>[Rd*.72,-Rd*.18];   // where a port's lighthouse stands
function palm(r){const lean=(r()-.5)*16,h=26+r()*12;
  return`<path class="o-trunk" d="M-2 0q${f1(lean/2)} ${f1(-h/2)} ${f1(lean)} ${f1(-h)}l3 1q${f1(-lean/2+2)} ${f1(h/2)} 2 ${f1(h-1)}z"/>${[-1,-.4,.4,1].map(s=>`<path class="o-leaf" d="M${f1(lean)} ${f1(-h)}q${f1(s*9)} -9 ${f1(s*20)} ${f1(Math.abs(s)*6-2)}q${f1(-s*10)} -3 ${f1(-s*20)} ${f1(-Math.abs(s)*6+2)}z"/>`).join('')}`}
/* a little house seen from the corner: two walls (the shaded one on the right), a pyramid roof and a window */
function isoHouse(x,y,w,h,rh,v){const dx=w/2,dy=dx*.5,F=[x,y],Lf=[x-dx,y-dy],Rt=[x+dx,y-dy],up=(p,z)=>[p[0],p[1]-z];
  const ap=[x,y-dy-h-rh],o=1.15,ov=p=>[x+(p[0]-x)*o,y-dy-h+(p[1]-(y-dy-h))*o],lerp=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
  const wl=[.32,.68].map(u=>lerp(Lf,F,u));
  return`<g class="o-house r${v}"><path class="o-wall" d="${poly([Lf,F,up(F,h),up(Lf,h)])}"/><path class="o-wall2" d="${poly([F,Rt,up(Rt,h),up(F,h)])}"/>
    <path class="o-win" d="${poly([up(wl[0],h*.38),up(wl[1],h*.38),up(wl[1],h*.72),up(wl[0],h*.72)])}" stroke-width="1"/>
    <path class="o-roof" d="${poly([ov(up(Lf,h)),ov(up(F,h)),ap])}"/><path class="o-roof2" d="${poly([ov(up(F,h)),ov(up(Rt,h)),ap])}"/></g>`}

/* ---------- small pieces ---------- */
/* foam where something meets the water, and a group that rides the swell (moved every frame by seawater.js) */
const lap=r=>`<ellipse class="o-lapr" rx="${r}" ry="${f1(r*SK*.8)}"/>`;
const bobs=s=>`<g class="o-float">${s}</g>`;
/* a rock standing out of the water: a dark side and a lighter top */
const rock=(x,y,w,h)=>`<g transform="translate(${x} ${y})"><path class="o-rock2" d="M${-w} 0L${-w*.7} ${-h}L${w*.35} ${-h*1.15}L${w} ${-h*.4}L${w} 0Z"/><path class="o-rock" d="M${-w*.7} ${-h}L${w*.35} ${-h*1.15}L${w} ${-h*.4}L${w*.2} ${-h*.55}Z"/><path class="o-lap" d="M${-w-8} 2q${w+8} 8 ${w*2+16} 0"/></g>`;
/* a figure with a fish's tail, sitting on a rock */
const merfolk=(x,y,flip)=>`<g transform="translate(${x} ${y}) scale(${flip?-1:1} 1)"><path class="o-tail" d="M-2 0q-8 6 -15 2q6 -1 8 -7z"/><path class="o-skin" d="M-3 0v-12h6v12z"/><circle class="o-skin" cy="-16" r="4.5"/><path class="o-hair" d="M-5 -17q5 -8 10 0v13q-3 -5 -5 -5q-2 0 -5 5z"/></g>`;
/* birds wheeling round a point high above the water */
function birds(dark,y,n){let b='';for(let i=0;i<n;i++){const a=i*2.4,r=16+i*(24/n)*1.6;b+=`<path d="M${f1(Math.cos(a)*r-7)} ${f1(Math.sin(a)*r*.7)}q3.5 -5 7 0q3.5 -5 7 0"/>`}
  return`<g transform="translate(0 ${y})"><g class="o-gulls${dark?' dark':''}">${b}</g></g>`}
/* smoke rising in puffs */
const smoke=(x,y)=>`<g transform="translate(${x} ${y})">${[0,1,2].map(i=>`<circle class="o-smoke" style="animation-delay:${-i*1.1}s" r="${6+i*3}"/>`).join('')}</g>`;
/* a dark cloud, low on the water, with rain and (for the storm round a boss) lightning */
const cloud=(y,s,bolt)=>`<g transform="translate(0 ${y}) scale(${s})"><path class="o-rain" d="M-30 6l-8 40M-14 8l-8 40M2 8l-8 40M18 8l-8 40M32 6l-8 40"/>
  <path class="o-cloud" d="M-44 8q-12 0 -10 -12q2 -10 14 -8q2 -16 20 -14q8 -12 24 -6q16 -6 22 10q16 0 14 14q0 10 -12 10z"/>${bolt?'<path class="o-bolt" d="M4 8l-8 18h8l-6 18 16 -24h-8l6 -12z"/>':''}</g>`;

/* ---------- creatures and strangers ---------- */
/* each stranger's ship faces somewhere of its own until you're near; then it turns to watch you (seaDraw) */
const foeAng=n=>RNG(G.seed,'face',n.id)()*Math.PI*2;
const shipAt=(n,k,pal)=>`<g class="shipdraw ${pal}"><g class="o-wl">${isoWater(foeAng(n),k)}</g><g class="o-float" data-l="${(SHIPISO[k].L||1)}"><g class="o-ship" data-k="${k}">${isoShip(foeAng(n),k)}</g></g></g>`;
const ART={
  fins:()=>lap(50)+[[-30,6],[10,-10],[34,8]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"><g class="o-fin" style="animation-delay:${-i*1.3}s"><path class="o-shark" d="M-8 0q6 -4 9 -16q2 10 7 16z"/><path class="o-lap" d="M-16 2q10 4 28 0"/></g></g>`).join(''),
  flock:(n,s)=>lap(30)+birds(s.dark,-64,12),
  sirens:()=>lap(54)+rock(-22,6,24,18)+rock(20,-4,20,14)+merfolk(-20,-12,0)+merfolk(20,-18,1),
  claws:()=>`${[0,1,2].map(i=>`<ellipse class="o-boil" style="animation-delay:${-i*.6}s" rx="34" ry="${f1(34*SK)}"/>`).join('')}${[[-18,0],[18,1]].map(([x,f])=>`<g transform="translate(${x} 4) scale(${f?-1:1} 1)"><g class="o-sway" style="animation-delay:${-f*1.4}s"><path class="o-crab" d="M-5 0q-6 -16 2 -28l8 2q-6 10 -2 26z"/><path class="o-crab" d="M-2 -28q2 -16 18 -16q-4 8 -12 12z"/><path class="o-crab2" d="M2 -24q12 -4 16 6q-8 -2 -14 0z"/></g></g>`).join('')}`,
  humps:(n,s)=>`<g class="${s.sp?'o-levi':'o-serp'}">${[-56,-22,12].map((x,i)=>`<g transform="translate(${x} ${i*-4})">${lap(16)}<g class="o-hump" style="animation-delay:${-i*.5}s"><path class="o-body" d="M-15 0q0 -22 15 -22q15 0 15 22z"/><path d="M-8 -12q8 -6 16 0" fill="none" stroke-width="1.2"/></g></g>`).join('')}
    ${s.sp?`<g transform="translate(46 -10)">${lap(26)}<path class="o-body" d="M-26 0q4 -26 26 -26q22 0 26 26z"/><path class="o-spout" d="M0 -26q-6 -18 -16 -22M0 -26q6 -18 16 -22M0 -26v-26"/></g>`
      :`<g transform="translate(46 -4)">${lap(14)}<path class="o-body" d="M-8 0q-4 -34 12 -40q14 -4 18 6q-8 2 -14 8q-6 10 -4 26z"/><circle class="o-eye" cx="10" cy="-33" r="2.2"/></g>`}</g>`,
  tentacles:()=>`<ellipse class="o-deep" rx="80" ry="${f1(80*SK)}"/>${[[-56,10,-1],[-24,-14,1],[8,-20,-1],[38,-8,1],[60,12,-1]].map(([x,y,f],i)=>`<g transform="translate(${x} ${y}) scale(${f} 1)"><g class="o-sway" style="animation-delay:${-i*.7}s"><path class="o-krak" d="M-7 0C-9 -34 12 -46 4 -72C16 -50 6 -30 7 0Z"/>${[-12,-26,-40].map(v=>`<circle class="o-sucker" cx="${1+v*.05}" cy="${v}" r="1.6"/>`).join('')}</g></g>`).join('')}`,
  // things adrift and on the rocks
  bottle:()=>lap(22)+bobs(`<g transform="scale(1.6) rotate(-28)"><path class="o-glass" d="M-10 -4h14l6 -2v-3h4v10h-4v-3l-6 -2h-14z"/><path class="o-paper" d="M-7 -3h9v4h-9z"/></g><path class="o-glint" d="M10 -18l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>`),
  keel:()=>lap(48)+bobs(`<path class="o-keel" d="M-40 0q4 -18 40 -20q36 2 40 20z"/><path d="M-30 -10q30 -16 64 -4" fill="none"/><path class="o-weed" d="M-20 0q2 8 -2 14M6 0q-2 8 2 12M22 0q2 6 0 10"/><g transform="translate(6 -20)"><path class="o-wall" d="M-5 0q0 -7 6 -7q5 0 6 4l4 1q-3 2 -4 2v0z"/></g>`),
  ship:(n,s)=>shipAt(n,s.k,s.pal),
  idol:()=>lap(36)+rock(0,6,30,16)+`<g transform="translate(-2 -14)"><path class="o-rock" d="M-6 0v-18q0 -8 6 -8q6 0 6 8v18z"/><path d="M-3 -18h2M2 -18h2M-2 -11h4" fill="none" stroke-width="1.4"/></g><g transform="translate(14 -6)"><circle class="o-gold" r="2.6"/><circle class="o-gold" cx="5" cy="1" r="2.6"/></g>`,
  cairn:()=>lap(30)+rock(0,6,26,12)+`<g transform="translate(0 -10)"><ellipse class="o-rock" rx="11" ry="5"/><ellipse class="o-rock" cy="-7" rx="8" ry="4"/><ellipse class="o-rock" cy="-13" rx="5" ry="3"/></g>`,
  sandbar:()=>`<ellipse class="o-sand" rx="52" ry="${f1(52*SK*.6)}"/><g transform="translate(8 -2)"><path d="M0 0v-34" stroke-width="1.8"/><path class="o-wall o-wave2" d="M0 -34q8 -4 16 2v10q-8 -5 -16 -2z"/></g><g transform="translate(-12 0)"><path class="s-flag" d="M-4 0v-12h8v12z"/><circle class="o-skin" cy="-16" r="4.5"/><path class="o-wave2" d="M4 -10l9 -12" fill="none" stroke-width="2"/></g>`,
  whirl:()=>`<g transform="scale(1 ${SK})"><g class="o-spin"><path class="o-swirl" d="M0 0q8 -2 6 -10q-4 -12 -18 -6q-16 10 -6 28q14 20 40 4q24 -20 6 -48q-20 -26 -56 -8"/></g></g>`,
  squall:()=>lap(50)+cloud(-70,1,0),
  mermaid:()=>lap(38)+rock(0,6,26,16)+merfolk(2,-12,0),
  fish:()=>`<g transform="scale(1 ${SK})"><g class="o-shoal">${[0,1.3,2.6,3.9,5.2].map((a,i)=>`<path class="o-fishy" transform="rotate(${f1(a*57.3)}) translate(${24+i*6} 0) scale(1.6)" d="M-7 0q7 -5 14 0q-7 5 -14 0zM-7 0l-5 -4v8z"/>`).join('')}</g></g>${[0,1,2,3].map(i=>`<ellipse class="o-boil" style="animation-delay:${-i*.5}s" cx="${(i%3-1)*16}" cy="${(i%2)*8-4}" rx="9" ry="${f1(9*SK)}"/>`).join('')}${birds(0,-56,5)}`,
  fogbank:()=>[[-30,0,26],[4,-8,30],[34,2,22]].map(([x,y,r])=>`<ellipse class="o-fogp" cx="${x}" cy="${y-r*.4}" rx="${r}" ry="${f1(r*.7)}"/>`).join(''),
  forge:()=>lap(44)+rock(0,8,38,14)+`<g transform="translate(-4 -8)"><path class="o-wall" d="M-12 0v-12h16v12z"/><path class="o-roof" d="M-14 -12l10 -8 10 8z"/><path class="o-win" d="M-8 0v-6h6v6z"/><path class="o-rock2" d="M6 0v-24h5v24z"/></g>${smoke(4,-36)}`,
  swell:()=>`<path class="o-wave" d="M-60 0q20 -4 34 -22q12 -16 30 -14q14 2 12 14q-8 -6 -14 0q8 10 28 14q16 4 30 8z"/><path class="o-lap" d="M-70 6q70 8 140 0"/>`,
  flotsam:()=>{const barrel=(x,y)=>`<g transform="translate(${x} ${y})"><path class="o-wood" d="M-7 -12v12a7 3.5 0 0 0 14 0v-12z"/><ellipse class="o-wood2" cx="0" cy="-12" rx="7" ry="3.5"/><path d="M-7 -5a7 3.5 0 0 0 14 0" fill="none" stroke-width="1.2"/></g>`;
    return lap(34)+bobs(`${barrel(-14,4)}${barrel(12,-2)}<g transform="translate(0 10) rotate(-8)"><path class="o-wood2" d="M-9 -6l9-4 9 4-9 4z"/><path class="o-wood" d="M-9 -6v6l9 4v-6zM9 -6v6l-9 4v-6z"/></g>`)},
  wreck:()=>lap(40)+bobs(`<path class="o-wood" d="M-26 4l20 -6 2 5 -20 6z"/><path class="o-wood" d="M4 -8l24 3 -1 5 -24 -3z"/><path class="o-wood2" d="M-6 10l18 -2 1 5 -18 2z"/><path d="M-2 0l10 -30" stroke-width="2.4"/><path class="s-sail2" d="M6 -24l12 4 -4 8z"/>`),
  calm:()=>''
};
/* what a place looks like out on the water: {art, and its settings} */
function sightOf(n){
  if(n.enemy)return Object.assign({art:'ship',k:'t',pal:'foe-t'},FOESEEN[n.enemy]);
  if(n.type==='event')return EVSEEN[n.ev]||{art:'flotsam'};
  if(n.type==='npc')return{art:'row'};
  if(n.type==='fish')return{art:'fish'};
  return{art:n.type}}
function destArt(n,live){const t=n.type;
  if(t==='port'||t==='isle')return isleArt(n,live);
  const s=sightOf(n);
  if(!live)return s.art==='ship'&&n.enemy?ART.wreck():ART.calm();
  if(s.art==='row')return shipAt(n,'row','foe-n');
  return(ART[s.art]||ART.flotsam)(n,s)}
