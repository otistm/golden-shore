/* Ink Crossing: People you meet: portraits, NPCs and quests (Hock, Wet Jack, the lost cartographers), dialogue, the creel sheet. */
"use strict";
/* ---------- people you meet ---------- */
function portrait(L){L=L||{};let g='';
  const dash=L.ghost?' stroke-dasharray="3 2.5"':'';
  if(L.hair)g+=`<path class="w" d="M16 24c-3 12-2 22 2 28h24c4-6 5-16 2-28"${dash}/>`;
  g+=`<path class="w" d="M6 60c2-13 12-17 24-17s22 4 24 17z"${dash}/><path class="w" d="M25 38v7h10v-7"${dash}/>`;
  g+=`<circle class="w" cx="30" cy="${L.kid?30:27}" r="${L.kid?11:12.5}"${dash}/>`;
  const y=L.kid?30:27;
  g+=`<circle class="k" cx="25.5" cy="${y-1}" r="1.5"/>`;
  g+=L.patch?`<path d="M31 ${y-5}l8 -3"/><circle class="k" cx="34.5" cy="${y-1}" r="2.8"/>`:`<circle class="k" cx="34.5" cy="${y-1}" r="1.5"/>`;
  g+=L.beard?`<path class="w" d="M19 ${y+2}c1 11 21 11 22 0-4 3-8 4-11 4s-7-1-11-4z"/>`:`<path d="M27 ${y+6}q3 2 6 0"/>`;
  if(L.hat==='tricorn')g+=`<path class="k" d="M12 ${y-9}c5-11 31-11 36 0l-5 3c-7-5-19-5-26 0z"/>`;
  if(L.hat==='bandana')g+=`<path class="k" d="M17 ${y-6}c1-11 25-11 26 0z"/><path d="M43 ${y-7}l6 5M43 ${y-7}l5 7"/>`;
  if(L.hat==='hood')g+=`<path class="w" d="M14 ${y+12}c-3-15 3-27 16-27s19 12 16 27c-2-9-7-16-16-16s-14 7-16 16z"/>`;
  if(L.hat==='cap')g+=`<path class="k" d="M18 ${y-8}c1-9 23-9 24 0z"/><path d="M15 ${y-8}h30" stroke-width="3"/>`;
  if(L.hat==='chef')g+=`<path class="w" d="M20 ${y-9}c-6-2-5-11 2-10 1-6 15-6 16 0 7-1 8 8 2 10z"/><path d="M20 ${y-9}h20"/>`;
  if(L.hat==='plume')g+=`<path class="k" d="M17 ${y-8}c2-8 24-8 26 0z"/><path class="w" d="M38 ${y-12}c4-8 10-10 14-8-4 1-8 5-11 10z"/>`;
  return`<svg viewBox="0 0 60 60" class="portrait" aria-hidden="true"><g stroke="#000" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none">${g}</g></svg>`}
const NPCS={
  angler:{n:'Old Marrow',role:'Angler',look:{hat:'bandana',beard:1},sea:-1,x:"You fish? Not with that twig you don't.",o:[
    {l:'Buy a better rod',d:'12 gold. Your catch zone gets wider.',need:()=>G.gold>=12&&G.rod<3,f:()=>{G.gold-=12;G.rod++;return'Bought a better rod from Old Marrow.'}},
    {l:'Ask for a tip',d:'One extra cast at your next fishing spot.',f:()=>{G.tip++;return'Old Marrow told me where the fish hide. One extra cast next time.'}},
    {l:'Fish with him',d:'Two casts, right here.',f:()=>({fish:2,msg:'Went fishing with Old Marrow.'})}]},
  nell:{n:'Nell',role:'Fishwife',look:{hat:'hood',hair:1},sea:-1,x:"Fish, fish, who's got fish? I pay better than any dock.",o:[
    {l:'Sell her your catch',d:'She pays 1.5 times the price for everything.',need:hasFish,f:()=>`Sold my whole catch to Nell for ${sellAll(1.5)} gold.`},
    {l:'Trade a fish for supper',d:'Your cheapest fish for a Salt Pork.',need:hasFish,f:r=>{takeCheapFish();return addOrGold({k:'pork',t:rollTier(D()+2,r)},'Nell traded me')}},
    {l:'Nothing today',d:'She shrugs.',f:()=>'Waved to Nell and moved on.'}]},
  tobin:{n:'Tobin',role:'Hungry deckhand',look:{},sea:-1,x:"Captain, the crew hasn't eaten proper in days. Spare a fish?",o:[
    {l:'Give a fish',d:'Your cheapest fish. Repair 3 hull.',need:hasFish,f:()=>{takeCheapFish();G.hull+=3;return'Fed the crew a fish. They patched the hull with a will. +3 hull.'}},
    {l:'Pay the crew extra',d:'5 gold. Repair 2 hull.',need:()=>G.gold>=5,f:()=>{G.gold-=5;G.hull+=2;return'Paid the crew extra. +2 hull.'}},
    {l:'Tell him to wait',d:'Nothing happens.',f:()=>'Told Tobin to wait for port.'}]},
  quill:{n:'Quill',role:'Smuggler',look:{hat:'tricorn',patch:1},sea:-1,x:"Psst. Contraband. No questions, no receipts.",o:[
    {l:'Buy contraband',d:'12 gold for an item a tier above normal.',need:()=>G.gold>=12,f:r=>{G.gold-=12;return addOrGold(randItem(r,D()+5),'Bought contraband:')}},
    {l:'Sell him your route',d:'+8 gold.',f:()=>{G.gold+=8;return'Sold Quill a copy of my route. +8 gold.'}}]},
  tide:{n:'Brother Tide',role:'Sea priest',look:{hat:'hood',beard:1},sea:-1,x:"The sea keeps a ledger, captain. Shall we balance yours?",o:[
    {l:'Make an offering',d:'5 gold. Repair 3 hull.',need:()=>G.gold>=5,f:()=>{G.gold-=5;G.hull+=3;return'Brother Tide blessed the hull. +3 hull.'}},
    {l:'Offer your best fish',d:'Draw a landmark.',need:hasFish,f:()=>{takeBestFish();return{chart:1,msg:'Gave Brother Tide my best fish. He showed me a mark for my chart.'}}},
    {l:'Move on',d:'He keeps praying.',f:()=>'Passed Brother Tide at prayer.'}]},
  pip:{n:'Pip',role:'Stowaway',look:{hat:'cap',kid:1},sea:-1,x:"Found them curled up in the sail locker. They say they can sew.",o:[
    {l:'Let Pip stay',d:'Pip mends a Spare Sail for you.',f:r=>addOrGold({k:'sail',t:rollTier(D()+2,r)},'Pip joined the crew and sewed')},
    {l:'Put Pip ashore',d:'+3 gold. They leave a coin on the rail.',f:()=>{G.gold+=3;return'Put Pip ashore. They left a coin on the rail.'}}]},
  coral:{n:'Madame Coral',role:'Merchant princess',look:{hat:'plume',hair:1},sea:-1,x:"I collect rare things. Fish, mostly. Don't ask why.",o:[
    {l:'Sell her your catch',d:'She pays double for everything.',need:hasFish,f:()=>`Madame Coral bought my whole catch for ${sellAll(2)} gold.`},
    {l:'Buy a Treasure Chest',d:'14 gold.',need:()=>G.gold>=14,f:r=>{G.gold-=14;return addOrGold({k:'chest',t:rollTier(D(),r)},'Bought')}},
    {l:'Bow and leave',d:'She bows back.',f:()=>'Bowed to Madame Coral and left.'}]},
  ada:{n:'Ink Ada',role:'Tattooist',look:{hat:'bandana',hair:1},sea:-1,x:"A mapmaker with bare arms? Let me draw something that lasts.",o:[
    {l:'Get a tattoo',d:'8 gold. Draw a landmark.',need:()=>G.gold>=8,f:()=>{G.gold-=8;return{chart:1,msg:'Ink Ada tattooed a landmark on my arm.'}}},
    {l:'Just watch',d:'Nothing happens.',f:()=>'Watched Ink Ada work.'}]},
  cookie:{n:'Cookie',role:"Ship's cook",look:{hat:'chef'},sea:-1,x:"Give me a fish and I'll give you a meal that fights back.",o:[
    {l:'Cook your best fish',d:'It becomes food cargo. Rarer fish, better tier.',need:hasFish,f:r=>{const f=takeBestFish();return addOrGold({k:pick(r,['pork','lime']),t:Math.min(3,FISH[f].rar+(G.sea>0?1:0))},`Cookie cooked the ${FISH[f].n} into`)}},
    {l:'No thanks',d:'Cookie sulks.',f:()=>'Declined a meal from Cookie.'}]},
  bram:{n:'Bram',role:'Rival mapmaker',look:{hat:'tricorn',beard:1},sea:-1,x:"Another cartographer? The Guild must be desperate. Show me yours and I'll show you mine.",o:[
    {l:'Compare charts',d:'See one row further through the fog for the rest of the voyage.',f:()=>{G.far++;updateReveal();return'Compared charts with Bram. I can see further now.'}},
    {l:'Sell him a copy',d:'+12 gold.',f:()=>{G.gold+=12;return'Sold Bram a copy of my chart for 12 gold.'}}]},
  ansel:{n:'Ansel',role:'Lighthouse keeper',look:{hat:'cap',beard:1},sea:0,x:"Forty years I've watched ships pass this light. Three had mapmakers aboard. None came back.",o:[
    {l:'Ask about them',d:'Hear about the first cartographer.',f:()=>{lore("Ansel remembers the first cartographer. She carved a circle with a line through it on every dock she passed. It means: I was here, keep going.");return'Heard about the first cartographer from Ansel.'}},
    {l:'Buy lamp oil',d:'6 gold for a Signal Flare.',need:()=>G.gold>=6,f:r=>{G.gold-=6;return addOrGold({k:'flare',t:rollTier(D()+2,r)},'Bought')}}]},
  hale:{n:'Lieutenant Hale',role:'Navy officer',look:{hat:'cap'},sea:1,x:"These waters belong to the Crown. So does a toll.",o:[
    {l:'Pay the toll',d:'6 gold.',need:()=>G.gold>=6,f:()=>{G.gold-=6;return"Paid Lieutenant Hale's toll."}},
    {l:'Refuse',d:'He fires a warning shot. Lose 3 hull.',f:()=>{G.hull-=3;return'Refused the Navy toll and took a warning shot. Lost 3 hull.'}},
    {l:'Bribe him with fish',d:'Your best fish. He waves you through with a gift.',need:hasFish,f:r=>{takeBestFish();return addOrGold({k:'chain',t:rollTier(D()+2,r)},'Hale took the fish and handed me')}}]},
  second:{n:'The Second Cartographer',role:'Lost in the fog',look:{hair:1,ghost:1},sea:1,lore:1,x:"You're drawing the fog? I tried. It kept moving. Take something, and don't trust the Queen's compass.",o:[
    {l:'Take her last page',d:'Clear the fog from this whole sea.',f:()=>{G.full=true;updateReveal();lore('The second cartographer is a ghost in the fog. Her last page fits my chart exactly.');return'The second cartographer gave me her last page. The fog is charted.'}},
    {l:'Take her compass',d:'A Brass Compass, a tier above normal.',f:r=>{lore('The second cartographer is a ghost in the fog. She pressed her compass into my hand.');return addOrGold({k:'compass',t:rollTier(D()+4,r)},'The second cartographer gave me')}}]},
  jack:{n:'Wet Jack',role:'Drowned sailor',look:{hat:'bandana',ghost:1,beard:1},sea:2,x:"Deliver a letter for me? My girl's at the next port. She thinks I'm late, not dead.",o:[
    {l:'Take the letter',d:'Deliver it at your next port for a reward.',need:()=>!G.quest,f:()=>{G.quest='letter';return'Took a letter from Wet Jack to deliver at the next port.'}},
    {l:'Refuse',d:'He sinks back down.',f:()=>"Couldn't take a dead man's letter."}]},
  third:{n:'The Third Cartographer',role:'Alive, somehow',look:{hat:'hood',hair:1},sea:2,lore:1,x:"The Queen took my ship, not me. I've been rowing toward the Kraken for a year. You'll get there first. Draw it well.",o:[
    {l:'Take her notes',d:'Draw a landmark.',f:()=>{lore('The third cartographer is alive, rowing toward the Kraken in a dinghy. She gave me her notes.');return{chart:1,msg:'The third cartographer gave me her notes on the Deep.'}}},
    {l:'Give her a fish',d:'Your best fish, for her harpoon.',need:hasFish,f:r=>{takeBestFish();lore('The third cartographer is alive. I fed her, and she gave me her harpoon.');return addOrGold({k:'harpoon',t:rollTier(D()+4,r)},'The third cartographer traded me')}}]}
};
function unlockLocker(){G.hock='done';G.locker=[];lore('Hock built a locker below the waterline. Six slots for spare cargo. It smells of fresh pine and fish.')}
NPCS.hock={n:'Hock',role:'Shipwright',look:{hat:'cap',beard:1},sea:0,quest:1,x:"That hold of yours is a shoebox. Bring me three fish, any kind, and I'll build you a locker below deck for spare cargo. Find me on any dock.",o:[
  {l:'Take the job',d:'Bring Hock 3 fish at any port. Reward: a 6-slot locker for extra cargo.',need:()=>!G.hock,f:()=>{G.hock='active';return'Hock the shipwright will build me a locker for three fish.'}},
  {l:'Hand over 3 fish now',d:'Your three cheapest fish. He starts building today.',need:()=>!G.hock&&G.creel.length>=3,f:()=>{takeCheapFish();takeCheapFish();takeCheapFish();unlockLocker();return'Gave Hock three fish on the spot. He built me a locker below deck.'}},
  {l:'Not now',d:"He'll be around the docks.",f:()=>{G.hock='active';return"Told Hock I'd think about it. He said he'd wait on the docks."}}]};
NPCS.hock2={n:'Hock',role:'Shipwright',look:{hat:'cap',beard:1},sea:0,quest:1,hidden:1,x:"Well? Three fish and I'll have that locker built by the tide.",o:[
  {l:'Hand over 3 fish',d:'Your three cheapest fish. Unlock a 6-slot locker.',need:()=>G.creel.length>=3,f:()=>{takeCheapFish();takeCheapFish();takeCheapFish();unlockLocker();return'Gave Hock three fish. He built me a locker below deck.'}},
  {l:'Pay him 20 gold instead',d:'Unlock the locker without fish.',need:()=>G.gold>=20,f:()=>{G.gold-=20;unlockLocker();return'Paid Hock 20 gold. He built me a locker below deck.'}},
  {l:'Not yet',d:G_fishHint(),f:()=>"Told Hock I'd be back with fish."}]};
function G_fishHint(){return'Catch fish at fishing grounds, events, or with Old Marrow.'}
const NPC_POOL=Object.keys(NPCS).filter(k=>!NPCS[k].lore&&!NPCS[k].quest);
function talk(k,key,done,after){
  const N=NPCS[k];A.people=A.people||{};A.people[k]=1;saveA();
  const ov=overlay(`<div class="npc">${portrait(N.look)}<div><h2>${N.n}</h2><p class="soft">${N.role}</p></div></div><p class="log">“${N.x}”</p>
    <div class="picks">${N.o.map((o,i)=>{const ok=!o.need||o.need();return`<button class="opt" data-o="${i}" ${ok?'':'disabled'}><b>${o.l}</b>${o.d?`<span>${o.d}</span>`:''}</button>`}).join('')}</div>`,true);
  ov.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{if(b.disabled)return;ov.remove();
    const res=N.o[+b.dataset.o].f(RNG(G.seed,'npc',key,b.dataset.o));
    if(after)after();
    if(res&&res.chart){logL(res.msg);chartPick(RNG(G.seed,'npcchart',key),res.msg,fin);return}
    if(res&&res.fish){logL(res.msg);save();fishing(key+'f',res.fish,fin);return}
    logL(res);toast(res);fin()});
  function fin(){if(G.hull<=0)return sink();save();done()}
  (ov.querySelector('[data-o]:not([disabled])')||ov.querySelector('button')).focus();
}
function creelSheet(){
  const tot=G.creel.reduce((a,f)=>a+FISH[f].v,0);
  const ov=overlay(`<h2>Your creel</h2><p class="soft">${G.creel.length} of ${CREEL} fish, worth about ${tot} gold. Sell them at any port's fish market.</p>
    <div class="fishlist">${G.creel.map((f,i)=>`<div class="fishrow">${fishSVG(f)}<div><b>${FISH[f].n}</b><span class="soft">${RAR[FISH[f].rar]}, ${FISH[f].v} gold</span></div><button class="ghost" data-r="${i}">Release</button></div>`).join('')||'<p class="soft">Empty.</p>'}</div>
    <button class="primary" data-a="c">Close</button>`);
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-a]')){ov.remove();return}const r=e.target.closest('[data-r]');if(r){const[f]=G.creel.splice(+r.dataset.r,1);save();ov.remove();toast(`Released the ${FISH[f].n}`);creelSheet()}});
}
