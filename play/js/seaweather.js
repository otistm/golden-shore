/* Golden Shore: Weather on the open sea. Each sea has its own swell (the waves its wind raises) and its own run of weather,
   and the weather changes from day to day as you sail: calm with cloud shadows sliding over the water, a fair breeze, mist
   lying low on the sea, rain, or a storm with whitecaps, driving rain and lightning. It's seeded by voyage, sea and day, so
   every captain on the same voyage sails through the same storms. Changes ease in over a few seconds.
   Weather shows everywhere on the sea: in the swell every ship rides (seawater.js), the water's colour and whitecaps, the
   wind pushing the fog (seafog.js), mist over sailed water, and rain, a darkening sky and lightning over the whole scene. */
"use strict";
/* each sea's swell: its waves' direction (radians, east = 0, south = π/2), length and height. Speed follows length, as at sea. */
const WAVESETS=[
  [{d:.65,l:430,a:5.5},{d:.35,l:250,a:3.2},{d:1.05,l:160,a:2},{d:.15,l:95,a:1}],          // the Shallows: a short swell off the north-west
  [{d:1.25,l:640,a:7},{d:1,l:390,a:4},{d:1.5,l:150,a:1.2},{d:.9,l:90,a:.7}],              // the Fog Sea: long and heavy, out of the north
  [{d:.1,l:520,a:8},{d:.35,l:300,a:5},{d:-.2,l:170,a:3},{d:.5,l:100,a:1.8}]];              // the Deep: big seas rolling in from the west
WAVESETS.forEach(set=>set.forEach((w,i)=>{w.k=2*Math.PI/w.l;w.dx=Math.cos(w.d);w.dy=Math.sin(w.d);w.w=Math.sqrt(75*w.k);w.p=i*1.9}));
const curWaves=()=>WAVESETS[Math.min(2,G?G.sea:0)];
/* kinds of weather. speed is how fast your ship can sail (and turn); drift is how hard the wind pushes her sideways; swell and chop scale the long and short waves; wind pushes the fog (world units a second); rain 0 to 1;
   dark tints the whole scene; caps are whitecaps; clouds are cloud shadows on the water; mist lies over sailed water. */
const WEATHER={
  calm:{n:'Calm',call:'Flat calm.',speed:1,drift:0,swell:.55,chop:.4,wind:3,rain:0,dark:0,caps:0,clouds:1,mist:0,flash:0},
  breezy:{n:'Fair wind',call:'A fair wind!',speed:1,drift:0,swell:1,chop:1,wind:8,rain:0,dark:0,caps:.25,clouds:.6,mist:0,flash:0},
  mist:{n:'Mist',call:'Mist rolling in.',speed:1,drift:0,swell:.8,chop:.5,wind:4,rain:.15,dark:.15,caps:0,clouds:0,mist:1,flash:0},
  rain:{n:'Rain',call:'Rain coming in!',speed:.85,drift:.35,swell:1.25,chop:1.4,wind:12,rain:.6,dark:.35,caps:.4,clouds:0,mist:.25,flash:0},
  storm:{n:'Storm',call:'Storm! Hold on!',speed:.6,drift:1,swell:1.7,chop:2.1,wind:20,rain:1,dark:.65,caps:1,clouds:0,mist:.2,flash:1}};
/* how often each sea sees each weather */
const SEASKY=[{calm:45,breezy:40,rain:15},{mist:55,breezy:15,rain:25,storm:5},{breezy:25,rain:35,storm:40}];
const WXTRY=(location.search.match(/[?&]weather=([a-z]+)/)||[])[1];   // ?weather=storm (or calm, breezy, mist, rain) to try one out
function weatherOf(sea,day){if(WEATHER[WXTRY])return WXTRY;const r=RNG(G.seed,'weather',sea,day)(),odds=SEASKY[Math.min(2,sea)],tot=Object.values(odds).reduce((a,b)=>a+b,0);
  let x=r*tot;for(const k in odds){x-=odds[k];if(x<0)return k}return Object.keys(odds)[0]}
const WXKEYS=['speed','drift','swell','chop','wind','rain','dark','caps','clouds','mist','flash'];
/* the weather now: cur eases from 'from' to the day's weather; wo is how far the wind has pushed things (fog, cloud shadows) */
const WX={k:null,sea:-1,cur:null,from:null,t0:0,wo:[0,0],drops:[],rings:[],flashAt:0,bolt:null};
function weatherTick(dt){if(!G)return;const k=weatherOf(G.sea,G.day),now=performance.now();
  if(!WX.cur||WX.sea!==G.sea||WX.seed!==G.seed){WX.k=k;WX.sea=G.sea;WX.seed=G.seed;WX.cur=Object.assign({},WEATHER[k]);WX.from=null}   // a new sea: its weather is simply there
  else if(k!==WX.k){WX.from=Object.assign({},WX.cur);WX.k=k;WX.t0=now;seaSay(WEATHER[k].call);seaWxLabel()}
  if(WX.from){const e=clamp((now-WX.t0)/6000,0,1),s=e*e*(3-2*e);WXKEYS.forEach(p=>WX.cur[p]=WX.from[p]+(WEATHER[WX.k][p]-WX.from[p])*s);if(e>=1)WX.from=null}
  const wd=curWaves()[0];WX.wo[0]+=wd.dx*WX.cur.wind*dt;WX.wo[1]+=wd.dy*WX.cur.wind*dt}
/* the weather's name beside the sea's */
function seaWxLabel(){const e=document.getElementById('seawx');if(e&&G)e.textContent=`Sea ${G.sea+1} of 3 · ${WEATHER[weatherOf(G.sea,G.day)].n}`}
/* rain, the darkened sky and lightning, drawn over the whole sea (fog included) on their own canvas */
function seaRain(dt){const c=SEA.el.querySelector('#searain');if(!c)return;const x=c.getContext('2d'),W=SEA.vw,H=SEA.vh,d=Math.min(2,devicePixelRatio||1),w=WX.cur;
  if(c.width!==Math.round(W*d)||c.height!==Math.round(H*d)){c.width=Math.round(W*d);c.height=Math.round(H*d)}
  x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,H);
  if(w.dark>.01){x.fillStyle=`rgba(28,38,52,${(w.dark*.24).toFixed(3)})`;x.fillRect(0,0,W,H)}
  const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // drops fall slanted with the wind; on the water each leaves a ring that spreads and fades
  const want=Math.round(w.rain*W*H/1400),wd=curWaves()[0],slant=wd.dx*(.15+w.wind*.025);
  while(WX.drops.length<want)WX.drops.push({x:Math.random()*W,y:Math.random()*H,v:700+Math.random()*500,l:10+Math.random()*14});
  if(WX.drops.length>want)WX.drops.length=want;
  if(!still&&dt){x.strokeStyle='rgba(31,42,60,.32)';x.lineWidth=1.1;x.beginPath();
    for(const p of WX.drops){p.y+=p.v*dt;p.x+=p.v*slant*dt;if(p.y>H||p.x<-30||p.x>W+30){p.y=-p.l-Math.random()*60;p.x=Math.random()*(W+60)-30}
      x.moveTo(p.x,p.y);x.lineTo(p.x-p.l*slant,p.y-p.l)}
    x.stroke();
    for(let i=0;i<Math.round(w.rain*W*H/9000*dt*60/8);i++)WX.rings.push({x:Math.random()*W,y:SEA.top+Math.random()*(SEA.bot-SEA.top),t:0});
    x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=1;
    WX.rings=WX.rings.filter(r=>(r.t+=dt)<.6);for(const r of WX.rings){const s=2+r.t*16;x.globalAlpha=1-r.t/.6;x.beginPath();x.ellipse(r.x,r.y,s,s*SK,0,0,Math.PI*2);x.stroke()}x.globalAlpha=1}
  // lightning in a storm: now and then a bolt in the distance and the whole sky goes pale for a moment
  if(w.flash>.5&&!still&&dt){const now=performance.now();if(!WX.flashAt)WX.flashAt=now+4000+Math.random()*9000;
    if(now>WX.flashAt){WX.flashAt=now+5000+Math.random()*10000;const bx=W*(.15+Math.random()*.7);let y=SEA.top,px=bx;const pts=[[px,y]];
      while(y<SEA.top+(SEA.bot-SEA.top)*.45){y+=14+Math.random()*16;px+=(Math.random()-.5)*26;pts.push([px,y])}WX.bolt={pts,t:now}}
    if(WX.bolt){const a=now-WX.bolt.t;if(a>260)WX.bolt=null;else{x.fillStyle=`rgba(251,245,232,${(.22*(1-a/260)).toFixed(3)})`;x.fillRect(0,0,W,H);
      x.strokeStyle='#FBF5E8';x.lineWidth=3;x.beginPath();WX.bolt.pts.forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py));x.stroke();
      x.strokeStyle='#1F2A3C';x.lineWidth=1.2;x.stroke()}}}}
