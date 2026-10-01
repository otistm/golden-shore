/* Ink Crossing: Voyage state (G), Atlas (A), saving, map generation and seeded enemy boards. */
"use strict";
/* ---------- state ---------- */
let G=null,B=null,raf=0,last=0,bump=null,fresh=false;
/* Saved data lives in localStorage: 'crossing-atlas' (meta progress) and 'crossing-voyage' (the voyage in progress).
   RULES FOR CHANGES: never rename or remove a field; give new fields a default in migrateAtlas / VOYAGE_DEFAULTS;
   if a field's meaning changes, bump the schema number and convert old data in the migrate function. */
const ATLAS_SCHEMA=1,VOYAGE_SCHEMA=1;
const VOYAGE_DEFAULTS={sv:VOYAGE_SCHEMA,charts:[],log:[],shops:{},creel:[],rod:0,tip:0,far:0,extra:0,full:false,freeRoll:true,quest:null,hock:null,locker:null,fightAt:null,unrolled:-1,fit:null,renown:0,perks:null,crew:null,orders:null};
function readKey(key){let raw=null;try{raw=localStorage.getItem(key)}catch(e){}if(!raw)return{raw:null,val:null};
  try{return{raw,val:JSON.parse(raw)}}catch(e){try{localStorage.setItem(key+'-unreadable',raw)}catch(_){}return{raw,val:null}}}
function migrateAtlas(m){
  const out=Object.assign({sv:ATLAS_SCHEMA,voyages:0,wins:0,bosses:0,elites:0,met:{},beat:{},items:{},charts:{},fish:{},people:{},tips:{},tutDone:false,best:0,daily:{}},m||{});
  ['met','beat','items','charts','fish','people','tips','daily'].forEach(k=>{if(!out[k]||typeof out[k]!=='object')out[k]={}});
  ['voyages','wins','bosses','elites','best'].forEach(k=>{if(typeof out[k]!=='number'||!isFinite(out[k]))out[k]=0});
  // for the future: if(out.sv<2){ ...convert...; out.sv=2; }
  out.sv=ATLAS_SCHEMA;return out}
function migrateVoyage(v){if(!v||!v.map||!v.board)return null;const out=Object.assign({},VOYAGE_DEFAULTS,v);out.sv=VOYAGE_SCHEMA;if(!out.crew)crewFromOldSave(out);trimHold(out);if(out.perks&&out.perks.some(k=>!PERKS[k]))out.perks=[];return out}
/* holds shrank from 10 slots to 9: whatever no longer fits moves to the locker if there's room, otherwise it's sold */
function trimHold(g){const cap=g.fit&&Object.values(g.fit).includes('planks')?HOLD-1:HOLD;
  while(g.board.length&&used(g.board)>cap){const it=g.board.pop(),d=DEFS[it.k];
    if(g.locker&&used(g.locker)+d.s<=LOCK){g.locker.push(it);g.log.push({d:g.day,t:`The hold shrank to ${cap} slots. Stowed the ${d.n} in the locker.`})}
    else{const p=Math.max(1,Math.floor(price(it.k,it.t)/2));g.gold+=p;g.log.push({d:g.day,t:`The hold shrank to ${cap} slots. Sold the ${d.n} for ${p} gold.`})}}}
/* voyages from before crafts: crew items leave the hold for the deck, the ship gets its starting crew, and free berths go to whoever covers the crafts the hold needs most */
function crewFromOldSave(g){
  const b=SHIPS[g.ship].berths||3,crew=[],has=k=>crew.some(c=>c.k===k),addC=k=>{if(!has(k)&&CREW[k]&&crew.length<b)crew.push({k,xp:0,m:3})};
  for(const list of [g.board,g.locker||[]])for(let i=list.length-1;i>=0;i--)if(DEFS[list[i].k]&&DEFS[list[i].k].tags.includes('K')){const k=list.splice(i,1)[0].k;if(CREW[k]&&!has(k)&&crew.length<b)crew.push({k,xp:0,m:3});else g.gold+=price(k,0)}
  (SHIPS[g.ship].crew||[]).forEach(addC);
  const need={};g.board.forEach(it=>itemCrafts(it.k).forEach(c=>need[c]=(need[c]||0)+1));
  while(crew.length<b){const cov=new Set(crew.flatMap(c=>CREW[c.k].crafts));let best=null,bv=0;
    for(const k in CREW){if(has(k))continue;const v=CREW[k].crafts.filter(c=>!cov.has(c)).reduce((a,c)=>a+(need[c]||0),0);if(v>bv){bv=v;best=k}}
    if(!best)break;crew.push({k:best,xp:0,m:3})}
  g.crew=crew;
  for(const id in g.shops||{}){const S=g.shops[id];if(S.offers)S.offers=S.offers.map(o=>o&&DEFS[o.k]&&DEFS[o.k].tags.includes('K')?null:o)}
}
function loadA(){const{raw,val}=readKey('crossing-atlas'),out=migrateAtlas(val);
  if(raw&&val&&val.lastVersion!==VERSION){try{localStorage.setItem('crossing-atlas-backup',raw)}catch(e){}}   // one safety copy per update
  out.lastVersion=VERSION;return out}
let A=loadA();
function saveA(){try{localStorage.setItem('crossing-atlas',JSON.stringify(A))}catch(e){}}
function save(){if(G&&G.tut)return;try{const{sel,moving,...r}=G;localStorage.setItem('crossing-voyage',JSON.stringify(r))}catch(e){}}
function load(){return migrateVoyage(readKey('crossing-voyage').val)}
function clearSave(){try{localStorage.removeItem('crossing-voyage')}catch(e){}}
const hasC=k=>!!(G&&G.charts&&G.charts.some(c=>c.k===k));
/* ---------- crew ---------- */
const berths=()=>(SHIPS[G.ship].berths||3)+(hasP('berth')?1:0)+(hasF('ballast')?FITTINGS.ballast.berth:0);
const rankXP=()=>hasP('drill')?RANKXP.map(x=>Math.max(0,x-1)):RANKXP;
const crewRank=c=>rankXP().filter(x=>c.xp>=x).length;
const wageOf=k=>Math.max(0,CREW[k].wage-(hasP('paymaster')?1:0));
const feeOf=k=>Math.max(1,CREW[k].fee-(hasP('recruiter')?3:0));
/* the crafts your crew cover, or null (everything works) when there's no voyage */
function crewCrafts(){if(!G||!G.crew)return null;return new Set(G.crew.flatMap(c=>CREW[c.k].crafts))}
/* the rank of each craft aboard: the best crew member with it */
function craftRanks(){const r={};((G&&G.crew)||[]).forEach(c=>CREW[c.k].crafts.forEach(k=>r[k]=Math.max(r[k]||0,crewRank(c))));return r}
function hire(k){G.crew=G.crew||[];G.crew.push({k,xp:0,m:3});logL(`Hired ${an(CREW[k].n)} for ${feeOf(k)} gold.`)}
/* wages at every new port: paid in order while the gold lasts. Unpaid crew lose heart, and leave when it runs out. */
function payWages(){if(!G.crew||!G.crew.length||G.tut||G.path.length<2)return'';   // nothing is owed in the port you set out from
  let paid=0,left=[],sad=[];
  G.crew=G.crew.filter(c=>{const w=wageOf(c.k);if(G.gold>=w){G.gold-=w;paid+=w;c.m=Math.min(3,c.m+1);return true}
    c.m--;if(hasP('loyal'))c.m=Math.max(1,c.m);if(c.m<=0){left.push(CREW[c.k].n);return false}sad.push(CREW[c.k].n);return true});
  if(paid)logL(`Paid ${paid} gold in wages.`);
  if(sad.length)logL(`Couldn't pay ${sad.join(' and ')}. They're grumbling.`);
  if(left.length)logL(`${left.join(' and ')} left the ship over unpaid wages.`);
  return[paid?`Paid ${paid} gold in wages`:'',sad.length?`${sad.join(' and ')} went unpaid`:'',left.length?`${left.join(' and ')} quit`:''].filter(Boolean).join('. ')}
/* fittings: G.fit is {hull,sails,guns,head}, or null until the first one */
const hasF=k=>!!(G&&G.fit&&Object.values(G.fit).includes(k));
const fitIn=spot=>G&&G.fit&&G.fit[spot]||null;
const fitHP=()=>G&&G.fit?Object.values(G.fit).reduce((a,k)=>a+(k&&FITTINGS[k].hp||0),0):0;
/* your hold's size: HOLD slots, one fewer with Double Planking. Never more than HOLD. */
const holdCap=()=>hasF('planks')?HOLD-1:HOLD;
const HULL_MAX=20;   // the shipwright repairs hull up to 20
const repairCost=()=>hasP('wright')?1:2;
/* renown: win fights to earn it (threat 1, elite 2, boss 3). Each level lets you pick a perk. Resets every voyage. */
const RENOWN=[3,7,12,18,25];
const renownLvl=()=>RENOWN.filter(x=>(G.renown||0)>=x).length;
const renownNext=()=>RENOWN.find(x=>(G.renown||0)<x);
const perksOwed=()=>renownLvl()-(G.perks||[]).length;   // after the captain's picks came in, old saves re-pick (see migrateVoyage)
/* everything your perks add up to, read by the fight */
const hasP=k=>!!(G&&G.perks&&G.perks.includes(k));
/* fit a part. The one it replaces sells for half. */
function equip(k){const f=FITTINGS[k],old=fitIn(f.spot);G.fit=Object.assign({hull:null,sails:null,guns:null,head:null},G.fit);
  let back=0;if(old){back=Math.floor(FITTINGS[old].p/2);G.gold+=back}
  G.fit[f.spot]=k;if(k==='studding'||old==='studding')updateReveal();
  logL(old?`Fitted ${f.n} in place of ${FITTINGS[old].n}, which sold for ${back} gold.`:`Fitted ${f.n}.`);return back}
/* can this part go on? Double Planking needs a free slot, and taking it off always fits */
function canEquip(k){const f=FITTINGS[k],old=fitIn(f.spot);if(old===k)return false;
  const cap=HOLD-(k==='planks'?1:0)-(f.spot!=='hull'&&hasF('planks')?1:0);return used(G.board)<=cap}
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
function updateReveal(){const row=node(G.at).row;G.reveal=G.full?99:row+2+G.extra+(G.far||0)+(hasC('buoy')?1:0)+(hasF('studding')?1:0)}

/* ---------- enemy boards (seeded: every captain on this sea meets the same crew) ---------- */
function enemyOf(n){
  if(n.fixed){const list=n.fixed.list.map(x=>({...x}));list.enemy=true;return{e:ENEMIES[n.enemy],list,hp:n.fixed.hp,depth:depthOf(n)}}
  const e=ENEMIES[n.enemy],depth=depthOf(n),r=RNG(G.seed,'foe',n.id),mult=e.kind==='e'?1.2:e.kind==='b'?1.3:1;
  let budget=(6+depth*6)*mult;const list=[];
  e.sig.forEach(k=>{const t=rollTier(depth,r);if(used(list)+DEFS[k].s<=HOLD){list.push({k,t});budget-=price(k,t)*.5}});
  const theme=pick(r,SHIPKEYS);
  let tries=0;while(tries++<90&&used(list)<HOLD&&budget>2){const k=drawKey(r,theme),d=DEFS[k];if(k==='chest')continue;
    const t=rollTier(depth,r),p=price(k,t);if(used(list)+d.s>HOLD||p>budget)continue;list.splice(ri(r,list.length+1),0,{k,t});budget-=p}
  const hp=Math.round((70+depth*12)*(e.kind==='e'?1.15:e.kind==='b'?1.3:1));
  list.enemy=true;   // enemy cargo needs no crew
  return{e,list,hp,depth};
}
const randItem=(r,depth,ship)=>{let k;do{k=drawKey(r,ship)}while(k==='chest'&&r()<.5);return{k,t:rollTier(depth,r)}};
/* an item upgrades yours if it's the same item, at the same tier or higher */
const LOCK=6;
function matchIdx(it){let j=-1;G.board.forEach((b,i)=>{if(b.k===it.k&&b.t<3&&it.t>=b.t&&(j<0||b.t>G.board[j].t))j=i});return j}
function findMatch(it){let best=null;for(const list of [G.board,G.locker||[]])list.forEach((b,i)=>{if(b.k===it.k&&b.t<3&&it.t>=b.t&&(!best||b.t>best.list[best.i].t))best={list,i}});return best}
function lockerUps(offers){const u=new Set();if(!G.locker)return u;offers.forEach(o=>{if(!o)return;if(matchIdx(o)>=0)return;const m=findMatch(o);if(m&&m.list===G.locker)u.add(m.i)});return u}
/* the item that just came aboard (or was upgraded), so the hold can celebrate it the next time it's drawn (holdFlash in ui.js) */
let flash=null;
function addItem(it){
  const m=findMatch(it);
  if(m){const b=m.list[m.i];b.t=Math.max(b.t+1,it.t);seen(it.k);flash={ref:b,kind:'up'};return'up'}
  if(used(G.board)+DEFS[it.k].s<=holdCap()){const b={k:it.k,t:it.t};G.board.push(b);seen(it.k);flash={ref:b,kind:'add'};return'add'}
  if(G.locker&&used(G.locker)+DEFS[it.k].s<=LOCK){const b={k:it.k,t:it.t};G.locker.push(b);seen(it.k);flash={ref:b,kind:'add'};return'locker'}
  return false;
}
const fits=it=>!!findMatch(it)||used(G.board)+DEFS[it.k].s<=holdCap()||!!(G.locker&&used(G.locker)+DEFS[it.k].s<=LOCK);
function addOrGold(it,prefix){const r=addItem(it),n=`${TIER[it.t]} ${DEFS[it.k].n}`;
  if(r==='locker')return`${prefix} a ${n}. The hold was full, so it went in the locker.`;
  if(r)return`${prefix} a ${n}.`;const g=Math.max(1,Math.floor(price(it.k,it.t)/2));G.gold+=g;return`${prefix} a ${n}, but there was no room aboard. Sold it for ${g} gold.`}
