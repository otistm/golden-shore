/* Ink Crossing: Ships, traits (ship and enemy abilities), enemies, seas, landmarks (charts), the cartographer's story and events. */
"use strict";
/* ---------- ships ---------- */
const SHIPS={
  sloop:{n:'The Wren',type:'Sloop',theme:'Speed, haste and crits.',hp:110,trait:'swift',start:[{k:'rapier',t:0},{k:'jib',t:0}]},
  galleon:{n:'The Bulwark',type:'Galleon',theme:'Shields, health and heavy hits.',hp:110,trait:'bulwark',start:[{k:'shieldbash',t:0},{k:'bulkhead',t:0}],lock:'Beat a sea boss to unlock.',ok:a=>a.bosses>0},
  privateer:{n:'The Ember',type:'Privateer',theme:'Cannons, powder and burn.',hp:100,trait:'kindle',start:[{k:'swivel',t:0},{k:'flare',t:0}],lock:'Beat 3 elites to unlock.',ok:a=>a.elites>=3},
  junk:{n:'The Lotus',type:'Junk',theme:'Healing, poison and calm.',hp:105,trait:'lotus',start:[{k:'fugu',t:0},{k:'teapot',t:0}],lock:'Finish a voyage to unlock.',ok:a=>a.wins>0}
};

/* ---------- traits: enemy abilities and ship abilities ---------- */
const TRAITS={
  frenzy:{n:'Frenzy',d:()=>'Below half health, its cargo charges 50% faster.'},
  smoke:{n:'Smoke Screen',d:()=>'Your cargo starts the fight slowed for 3s.'},
  peck:{n:'Peck',every:2,x:s=>2+s*2,d:s=>`Every 2s, pecks you for ${2+s*2}.`},
  rush:{n:'Head Start',d:()=>'Its cargo starts the fight hasted for 4s.'},
  volley:{n:'Broadside',every:5,x:s=>5+s*5,d:s=>`Every 5s, fires a broadside for ${5+s*5}.`},
  coil:{n:'Venom',d:()=>'Its weapons also poison you for 1.'},
  haunt:{n:'Undying Crew',every:1,d:()=>'Heals 1% of its health every second.'},
  armor:{n:'Ironclad',every:4,x:s=>6+s*6,d:s=>`Every 4s, gains ${6+s*6} shield.`},
  song:{n:'Siren Song',every:6,d:()=>'Every 6s, slows 2 of your items for 2s.'},
  fire:{n:'Firebrand',x:s=>3+s*3,d:s=>`You start the fight burning for ${3+s*3}.`},
  whirl:{n:'Whirlpool',d:()=>'The storm arrives 8s early.'},
  undying:{n:'Drowned',d:()=>'The first time it sinks, it rises again with 30% health.'},
  flock:{n:'Flock',every:3,d:()=>'Every 3s, hastes one of its items for 2s.'},
  pierce:{n:'Harpoon Guns',d:()=>'Its damage ignores your shield.'},
  thick:{n:'Thick Hide',d:()=>'Takes 25% less damage from weapons.'},
  captain:{n:"Captain's Orders",every:5,d:()=>'Every 5s, hastes 2 of its items for 2s.'},
  constrict:{n:'Constrict',every:8,d:()=>'Every 8s, slows 3 of your items for 2s.'},
  tentacles:{n:'Tentacles',every:6,x:s=>8+s*5,d:s=>`Every 6s, slams for ${8+s*5} and slows 2 of your items.`},
  swift:{n:'Light Hull',d:()=>'Your cargo charges 15% faster.'},
  bulwark:{n:'Heavy Hull',d:()=>'+40 health, and you start fights with 15 shield.'},
  kindle:{n:'Powder Hands',d:()=>'Every burn you apply is 1 higher.'},
  lotus:{n:'Calm Crew',d:()=>'Your heals also give a third as much shield.'}
};

/* ---------- enemies: three seas, each with threats, an elite and a boss ---------- */
const ENEMIES={
  sharks:{n:'Reef Sharks',sea:0,kind:'t',sig:['dagger','pins'],traits:['frenzy']},
  sloop:{n:'Smuggler Sloop',sea:0,kind:'t',sig:['flare','fenders'],traits:['smoke']},
  gulls:{n:'Gull Swarm',sea:0,kind:'t',sig:['pins'],traits:['peck']},
  runners:{n:'Rum Runners',sea:0,kind:'t',sig:['sail','cutlass'],traits:['rush']},
  brig:{n:'Pirate Brig',sea:0,kind:'e',sig:['cannon','cutlass'],traits:['volley']},
  serpent:{n:'Sea Serpent',sea:0,kind:'b',sig:['puffer','puffer','anchor'],traits:['coil','constrict']},
  ghost:{n:'Ghost Ship',sea:1,kind:'t',sig:['chain','tar'],traits:['haunt']},
  sirens:{n:'Siren Rocks',sea:1,kind:'t',sig:['net','hook'],traits:['song']},
  junkf:{n:'Fire Junk',sea:1,kind:'t',sig:['firepot','flare'],traits:['fire']},
  cutter:{n:'Navy Cutter',sea:1,kind:'t',sig:['swivel','fenders'],traits:['armor']},
  frigate:{n:'Navy Frigate',sea:1,kind:'e',sig:['cannon','plating','guncrew'],traits:['armor','volley']},
  queen:{n:'Pirate Queen',sea:1,kind:'b',sig:['cutlass','harpoon','keg','crows'],traits:['captain','volley']},
  crab:{n:'Maelstrom Crab',sea:2,kind:'t',sig:['anchor','plating'],traits:['whirl']},
  drowned:{n:'Drowned Crew',sea:2,kind:'t',sig:['cutlass','puffer'],traits:['undying']},
  petrels:{n:'Storm Petrels',sea:2,kind:'t',sig:['pins','sail','swivel'],traits:['flock']},
  whaler:{n:'Iron Whaler',sea:2,kind:'t',sig:['harpoon','dagger'],traits:['pierce']},
  leviathan:{n:'Leviathan',sea:2,kind:'e',sig:['anchor','pump'],traits:['thick','frenzy']},
  kraken:{n:'Kraken',sea:2,kind:'b',sig:['anchor','net','puffer'],traits:['tentacles','thick']}
};
const SEAS=['The Shallows','The Fog Sea','The Deep'];
const PORTNAMES=['Saltmere','Cinder Key','Brinehold',"Wrecker's Rest",'Coral Steps','Fogwatch','Widow Reef','Last Light','Stormgate','Kettle Bay','Tallow Point','Myrtle Sound','Bellbuoy','Oyster Row','Greyport','Pike Harbour','Lamplight Quay','Rook Island','Mercy Cove','Driftwood','Hollow Key','Wick Harbour','Gannet Rock','Tidewater'];

/* ---------- charts: landmarks drawn on your map that last the whole voyage ---------- */
const CHARTS={
  trade:{n:'Trade Winds',d:'Earn +3 gold for every fight you win.',g:'<path d="M4 12c5-4 10 4 16 0M4 19c5-4 10 4 16 0M8 26c4-3 8 3 12 0"/>'},
  harbour:{n:'Safe Harbour',d:'Repair 5 hull now.',g:'<circle class="w" cx="15" cy="5" r="2.5"/><path d="M15 8v18M9 12h12M5 20c1 5 5 7 10 7s9-2 10-7"/>'},
  light:{n:'Lighthouse',d:'Start every fight with 20 shield.',g:'<path class="w" d="M10 28l2-18h6l2 18z"/><path d="M9 10h12M11 18h8M15 3v4M5 6l4 2M25 6l-4 2"/>'},
  current:{n:'Fast Current',d:'Your cargo starts every fight a quarter charged.',g:'<path d="M4 10h18l-5-5M26 20H8l5 5"/>'},
  wreck:{n:'Old Wreck',d:'Salvage a free item a tier above normal now.',g:'<path class="w" d="M3 21h24l-5 6H8z"/><path d="M13 21l5-16M18 5l5 4"/>'},
  coral:{n:'Coral Garden',d:'+25 health in every fight.',g:'<path d="M15 28V13M15 18l-6-6V6M15 15l6-6V4M9 11l-4-2M21 9l4-1"/>'},
  calm:{n:'Calm Waters',d:'The storm reaches you 6 seconds later.',g:'<path d="M4 9h22M4 15h22M4 21h22"/>'},
  route:{n:'Merchant Route',d:'Your first reroll at every port is free.',g:'<circle class="w" cx="15" cy="15" r="10"/><circle cx="15" cy="15" r="6" stroke-width="1.2"/><path d="M15 11v8"/>'},
  cove:{n:"Smugglers' Cove",d:'Sell cargo for its full price.',g:'<path class="w" d="M3 27c0-14 6-21 12-21s12 7 12 21z"/><path class="k" d="M10 27c0-6 2-10 5-10s5 4 5 10z"/>'},
  whale:{n:'Whale Road',d:'Your cargo charges 10% faster.',g:'<path class="w" d="M15 27c0-8-2-13-10-17 5 0 8 2 10 5 2-3 5-5 10-5-8 4-10 9-10 17z"/>'},
  pearl:{n:'Pearl Bank',d:'Gain 10 gold now.',g:'<path class="w" d="M4 16c0-8 22-8 22 0-3 8-19 8-22 0z"/><circle class="w" cx="15" cy="15" r="3.5"/>'},
  buoy:{n:'Bell Buoy',d:'See one row further through the fog.',g:'<path class="w" d="M9 26l3-14h6l3 14z"/><path d="M15 12V6M11 6h8M5 27h20"/><circle class="k" cx="15" cy="20" r="2"/>'},
  sound:{n:'Sounding Line',d:"Scout enemies: see their cargo before you sail.",g:'<path d="M15 3v18"/><path class="w" d="M11 21h8l-4 7z"/><path d="M8 8h14M9 13h12" stroke-width="1.2"/>'}
};
const glyph=(k,cls)=>`<svg viewBox="0 0 30 30" class="${cls||'gl'}" aria-hidden="true">${CHARTS[k].g}</svg>`;

/* ---------- the cartographer's story ---------- */
const LORE={
  start:"The Guild pays well for a map to the Far Shore. Three cartographers sailed before me. None came back. I have a small ship, a blank chart, and ten gold.",
  1:"The serpent sank back into the Shallows. Past here the charts I carry go blank and the fog begins. The second cartographer's last page ends somewhere in this fog.",
  2:"The Queen had the third cartographer's compass. It doesn't point north. It points into the Deep, at something huge.",
  end:"No one has drawn this coast before. Now someone has. I'm sailing home with the only map there is.",
  sink:"The chart goes down with the ship. Someone else will have to try."
};

/* ---------- events ---------- */
const D=()=>depthOf(node(G.at));
const EVENTS={
  bottle:{t:'Message in a bottle',x:'A bottle bobs past. There is a scrap of chart inside.',o:[
    {l:'Read the chart',d:'Clear the fog from this whole sea.',f:()=>{G.full=true;updateReveal();return'Found a scrap of chart in a bottle. The whole sea is clear now.'}},
    {l:'Sell the bottle',d:'+6 gold.',f:()=>{G.gold+=6;return'Sold a message in a bottle for 6 gold.'}}]},
  wreck:{t:'Drifting wreck',x:'A hull floats keel-up. Something knocks inside.',o:[
    {l:'Search it',d:'Maybe cargo. Maybe trouble.',f:r=>{if(r()<.6)return addOrGold(randItem(r,D()+3),'Salvaged');G.hull-=3;return'Searched a wreck and it rolled on us. Lost 3 hull.'}},
    {l:'Leave it',d:'Nothing happens.',f:()=>'Left a drifting wreck alone.'}]},
  trader:{t:'Passing trader',x:'A merchant ship signals to trade.',o:[
    {l:'Upgrade your first item',d:'10 gold. Raises the leftmost item in your hold one tier.',need:()=>G.gold>=10&&G.board.length&&G.board[0].t<3,f:()=>{G.gold-=10;G.board[0].t++;return`Paid a trader to upgrade the ${DEFS[G.board[0].k].n}.`}},
    {l:'Buy a mystery crate',d:'7 gold for a random item.',need:()=>G.gold>=7,f:r=>{G.gold-=7;return addOrGold(randItem(r,D()+2),'Opened a mystery crate and found')}},
    {l:'Wave them off',d:'Nothing happens.',f:()=>'Waved off a passing trader.'}]},
  shrine:{t:'Sea shrine',x:'A stone idol stands on a rock with coins at its feet.',o:[
    {l:'Leave an offering',d:'6 gold. Repair 4 hull.',need:()=>G.gold>=6,f:()=>{G.gold-=6;G.hull+=4;return'Left an offering at a sea shrine. Repaired 4 hull.'}},
    {l:'Take the coins',d:'+12 gold, lose 2 hull.',f:()=>{G.gold+=12;G.hull-=2;return'Took the shrine coins. A wave hit us after. Lost 2 hull.'}}]},
  castaway:{t:'Castaway',x:'A sailor waves from a sandbar.',o:[
    {l:'Take them aboard',d:'They bring supplies.',f:r=>addOrGold({k:pick(r,['pork','lime','tar','pump']),t:rollTier(D()+3,r)},'A castaway joined us with')},
    {l:'Ask for directions',d:'See two rows further through the fog.',f:()=>{G.extra+=2;updateReveal();return'A castaway pointed out the way ahead.'}}]},
  whirl:{t:'Whirlpool',x:'The water turns in a slow circle.',o:[
    {l:'Ride the edge',d:'+15 gold, lose 3 hull.',f:()=>{G.gold+=15;G.hull-=3;return"Rode a whirlpool's edge. Found 15 gold in the churn, lost 3 hull."}},
    {l:'Go around',d:'Nothing happens.',f:()=>'Sailed around a whirlpool.'}]},
  cache:{t:"Cartographer's cache",x:"A tin box under a cairn, stamped with the first cartographer's mark: a circle with a line through it.",o:[
    {l:'Take her notes',d:'Draw a landmark on your chart.',f:()=>({chart:1,msg:"Found the first cartographer's notes."})},
    {l:'Take her coins',d:'+12 gold.',f:()=>{G.gold+=12;return"Took the first cartographer's coins."}}]},
  storm:{t:'Storm front',x:'Black clouds, and no way around them.',o:[
    {l:'Ride it out',d:'Lose 3 hull.',f:()=>{G.hull-=3;return'Rode out a storm front. Lost 3 hull.'}},
    {l:'Jettison cargo',d:'Lose your cheapest item.',need:()=>G.board.length>0,f:()=>{let j=0;G.board.forEach((b,i)=>{if(price(b.k,b.t)<price(G.board[j].k,G.board[j].t))j=i});const[b]=G.board.splice(j,1);return`Threw the ${DEFS[b.k].n} overboard in a storm.`}}]},
  mermaid:{t:"Mermaid's bargain",x:'She offers to bless your cargo, for a piece of your hull.',o:[
    {l:'Give 4 hull',d:'Upgrade two random items.',need:()=>G.board.some(b=>b.t<3),f:r=>{G.hull-=4;const n=[];for(let k=0;k<2;k++){const c=G.board.filter(b=>b.t<3);if(!c.length)break;const b=pick(r,c);b.t++;n.push(DEFS[b.k].n)}return`Gave a mermaid 4 hull. She blessed the ${n.join(' and the ')}.`}},
    {l:'Refuse',d:'Nothing happens.',f:()=>"Refused a mermaid's bargain."}]},
  fishing:{t:'Fishing grounds',x:'The water boils with fish.',o:[
    {l:'Patch the hull',d:'Repair 3 hull.',f:()=>{G.hull+=3;return'Stopped at fishing grounds and patched the hull.'}},
    {l:'Cast a line',d:'Two casts, right here.',f:()=>({fish:2,msg:'Stopped to fish the boiling water.'})},
    {l:'Net a Pufferfish',d:'Add a Pufferfish to your hold.',f:r=>addOrGold({k:'puffer',t:rollTier(D()+2,r)},'Netted')}]},
  fog:{t:'Fog bank',x:"You can't see the bow.",o:[
    {l:'Sail blind',d:'Could go either way.',f:r=>{if(r()<.5){G.gold+=10;return'Sailed blind through fog and slipped past a toll ship. +10 gold.'}G.hull-=2;return'Sailed blind through fog and scraped a reef. Lost 2 hull.'}},
    {l:'Wait it out',d:'Nothing happens.',f:()=>'Waited out a fog bank.'}]},
  gunsmith:{t:"Gunsmith's island",x:'A forge smokes on the beach.',o:[
    {l:'Buy a Swivel Gun',d:'5 gold.',need:()=>G.gold>=5,f:r=>{G.gold-=5;return addOrGold({k:'swivel',t:rollTier(D(),r)},'Bought')}},
    {l:'Upgrade a cannon',d:'8 gold. Upgrades a random cannon.',need:()=>G.gold>=8&&G.board.some(b=>DEFS[b.k].tags.includes('C')&&b.t<3),f:r=>{G.gold-=8;const b=pick(r,G.board.filter(b=>DEFS[b.k].tags.includes('C')&&b.t<3));b.t++;return`The gunsmith upgraded the ${DEFS[b.k].n}.`}},
    {l:'Move on',d:'Nothing happens.',f:()=>"Passed a gunsmith's island."}]}
};
