/* Ink Crossing: Voyage state (G), Atlas (A), saving, map generation and seeded enemy boards. */
"use strict";
/* ---------- state ---------- */
let G=null,B=null,raf=0,last=0,bump=null,fresh=false;
/* Saved data lives in localStorage: 'crossing-atlas' (meta progress) and 'crossing-voyage' (the voyage in progress).
   RULES FOR CHANGES: never rename or remove a field; give new fields a default in migrateAtlas / VOYAGE_DEFAULTS;
   if a field's meaning changes, bump the schema number and convert old data in the migrate function. */
const ATLAS_SCHEMA=1,VOYAGE_SCHEMA=1;
const VOYAGE_DEFAULTS={sv:VOYAGE_SCHEMA,charts:[],log:[],shops:{},creel:[],rod:0,tip:0,far:0,extra:0,full:false,freeRoll:true,quest:null,hock:null,locker:null};
function readKey(key){let raw=null;try{raw=localStorage.getItem(key)}catch(e){}if(!raw)return{raw:null,val:null};
  try{return{raw,val:JSON.parse(raw)}}catch(e){try{localStorage.setItem(key+'-unreadable',raw)}catch(_){}return{raw,val:null}}}
function migrateAtlas(m){
  const out=Object.assign({sv:ATLAS_SCHEMA,voyages:0,wins:0,bosses:0,elites:0,met:{},beat:{},items:{},charts:{},fish:{},people:{},best:0,daily:{}},m||{});
  ['met','beat','items','charts','fish','people','daily'].forEach(k=>{if(!out[k]||typeof out[k]!=='object')out[k]={}});
  ['voyages','wins','bosses','elites','best'].forEach(k=>{if(typeof out[k]!=='number'||!isFinite(out[k]))out[k]=0});
  // for the future: if(out.sv<2){ ...convert...; out.sv=2; }
  out.sv=ATLAS_SCHEMA;return out}
function migrateVoyage(v){if(!v||!v.map||!v.board)return null;const out=Object.assign({},VOYAGE_DEFAULTS,v);out.sv=VOYAGE_SCHEMA;return out}
function loadA(){const{raw,val}=readKey('crossing-atlas'),out=migrateAtlas(val);
  if(raw&&val&&val.lastVersion!==VERSION){try{localStorage.setItem('crossing-atlas-backup',raw)}catch(e){}}   // one safety copy per update
  out.lastVersion=VERSION;return out}
let A=loadA();
function saveA(){try{localStorage.setItem('crossing-atlas',JSON.stringify(A))}catch(e){}}
function save(){try{const{sel,moving,...r}=G;localStorage.setItem('crossing-voyage',JSON.stringify(r))}catch(e){}}
function load(){return migrateVoyage(readKey('crossing-voyage').val)}
function clearSave(){try{localStorage.removeItem('crossing-voyage')}catch(e){}}
const hasC=k=>!!(G&&G.charts&&G.charts.some(c=>c.k===k));
const node=id=>G.map.nodes.find(n=>n.id===id);
const depthOf=n=>G.sea*7+n.row;
const reachable=()=>G.map.edges.filter(e=>e[0]===G.at).map(e=>e[1]);
function logL(t){G.log.push({d:G.day,t})}
function lore(t){G.log.push({lore:1,t})}
function seen(k){if(!A.items[k]){A.items[k]=1;saveA()}}

/* ---------- map generation ---------- */
function genMap(seed,sea){
  const r=RNG(seed,'map',sea),nodes=[],edges=new Set(),pos={};
  const add=(row,col)=>{const key=row+'_'+col;if(pos[key]!=null)return pos[key];const id=sea*100+nodes.length;nodes.push({id,row,col});pos[key]=id;return id};
  const start=add(0,1.5),boss=add(6,1.5);
  const paths=3+ri(r,2);
  for(let p=0;p<paths;p++){let c=ri(r,4),prev=start;
    for(let row=1;row<=5;row++){if(row>1)c=Math.max(0,Math.min(3,c+ri(r,3)-1));const id=add(row,c);edges.add(prev+'>'+id);prev=id}
    edges.add(prev+'>'+boss)}
  const pool=Object.keys(ENEMIES).filter(k=>ENEMIES[k].sea===sea&&ENEMIES[k].kind==='t');
  const elite=Object.keys(ENEMIES).find(k=>ENEMIES[k].sea===sea&&ENEMIES[k].kind==='e');
  const bossE=Object.keys(ENEMIES).find(k=>ENEMIES[k].sea===sea&&ENEMIES[k].kind==='b');
  let evs=Object.keys(EVENTS);const names=[...PORTNAMES];
  nodes.forEach(n=>{
    n.x=n.col===1.5?170:45+n.col*83+(r()*14-7);
    if(n.row===0||n.row===5)n.type='port';
    else if(n.row===6)n.type='boss';
    else if(n.row===1)n.type='threat';
    else{const x=r();n.type=x<.32?'threat':x<.45?'event':x<.6?'npc':x<.7?'fish':x<.8?'elite':x<.88?'isle':'port'}
    if(n.type==='threat')n.enemy=pick(r,pool);
    if(n.type==='elite')n.enemy=elite;
    if(n.type==='boss')n.enemy=bossE;
    if(n.type==='event'){if(!evs.length)evs=Object.keys(EVENTS);n.ev=evs.splice(ri(r,evs.length),1)[0]}
    if(n.type==='port')n.name=sea===0&&n.row===0?'Gullhaven':names.splice(ri(r,names.length),1)[0];
    if(n.type==='port'&&r()<.6)n.visitor=pick(r,NPC_POOL.filter(k=>NPCS[k].sea===-1));
  });
  let npcs=Object.keys(NPCS).filter(k=>!NPCS[k].lore&&!NPCS[k].quest&&(NPCS[k].sea===-1||NPCS[k].sea===sea));
  nodes.filter(n=>n.type==='npc').forEach(n=>{if(!npcs.length)npcs=NPC_POOL.filter(k=>NPCS[k].sea===-1);n.npc=npcs.splice(ri(r,npcs.length),1)[0]});
  const loreN=Object.keys(NPCS).find(k=>NPCS[k].lore&&NPCS[k].sea===sea);
  if(loreN){const c=nodes.filter(n=>n.row>=2&&n.row<=4&&n.type!=='elite');if(c.length){const n=pick(r,c);n.type='npc';n.npc=loreN;delete n.enemy;delete n.ev}}
  return{sea,start,boss,nodes,edges:[...edges].map(e=>e.split('>').map(Number))};
}
function updateReveal(){const row=node(G.at).row;G.reveal=G.full?99:row+2+G.extra+(G.far||0)+(hasC('buoy')?1:0)}

/* ---------- enemy boards (seeded: every captain on this sea meets the same crew) ---------- */
function enemyOf(n){
  const e=ENEMIES[n.enemy],depth=depthOf(n),r=RNG(G.seed,'foe',n.id),mult=e.kind==='e'?1.2:e.kind==='b'?1.3:1;
  let budget=(6+depth*6)*mult;const list=[];
  e.sig.forEach(k=>{const t=rollTier(depth,r);if(used(list)+DEFS[k].s<=10){list.push({k,t});budget-=price(k,t)*.5}});
  const theme=pick(r,SHIPKEYS);
  let tries=0;while(tries++<90&&used(list)<10&&budget>2){const k=drawKey(r,theme),d=DEFS[k];if(k==='chest')continue;
    const t=rollTier(depth,r),p=price(k,t);if(used(list)+d.s>10||p>budget)continue;list.splice(ri(r,list.length+1),0,{k,t});budget-=p}
  const hp=Math.round((70+depth*12)*(e.kind==='e'?1.15:e.kind==='b'?1.3:1));
  return{e,list,hp,depth};
}
const randItem=(r,depth,ship)=>{let k;do{k=drawKey(r,ship)}while(k==='chest'&&r()<.5);return{k,t:rollTier(depth,r)}};
/* an item upgrades yours if it's the same item, at the same tier or higher */
const LOCK=6;
function matchIdx(it){let j=-1;G.board.forEach((b,i)=>{if(b.k===it.k&&b.t<3&&it.t>=b.t&&(j<0||b.t>G.board[j].t))j=i});return j}
function findMatch(it){let best=null;for(const list of [G.board,G.locker||[]])list.forEach((b,i)=>{if(b.k===it.k&&b.t<3&&it.t>=b.t&&(!best||b.t>best.list[best.i].t))best={list,i}});return best}
function lockerUps(offers){const u=new Set();if(!G.locker)return u;offers.forEach(o=>{if(!o)return;if(matchIdx(o)>=0)return;const m=findMatch(o);if(m&&m.list===G.locker)u.add(m.i)});return u}
function addItem(it){
  const m=findMatch(it);
  if(m){const b=m.list[m.i];b.t=Math.max(b.t+1,it.t);seen(it.k);return'up'}
  if(used(G.board)+DEFS[it.k].s<=10){G.board.push({k:it.k,t:it.t});seen(it.k);return'add'}
  if(G.locker&&used(G.locker)+DEFS[it.k].s<=LOCK){G.locker.push({k:it.k,t:it.t});seen(it.k);return'locker'}
  return false;
}
const fits=it=>!!findMatch(it)||used(G.board)+DEFS[it.k].s<=10||!!(G.locker&&used(G.locker)+DEFS[it.k].s<=LOCK);
function addOrGold(it,prefix){const r=addItem(it),n=`${TIER[it.t]} ${DEFS[it.k].n}`;
  if(r==='locker')return`${prefix} a ${n}. The hold was full, so it went in the locker.`;
  if(r)return`${prefix} a ${n}.`;const g=Math.max(1,Math.floor(price(it.k,it.t)/2));G.gold+=g;return`${prefix} a ${n}, but there was no room aboard. Sold it for ${g} gold.`}
