/* Ink Crossing: the tutorial (a short guided first voyage with Ansel as coach) and one-time tips for everything else. */
"use strict";
/* The maiden voyage: the Guild's trial run, six stops that each teach one part of the game by playing it.
   Gullhaven: items, then the crew who make them work. The training hulk: a fight, then renown and a captain's pick.
   The uncharted isle: a landmark. Saltmere: a fitting at the shipwright. The examiner: everything working together.
   The Guild hall: done.
   Steps. when: the event that shows the step (none = right after the previous one).
   until: the event that moves on ('next' shows a Next button, 'finish' a Finish button). pause: holds the fight while it's shown. */
const TUT=[
  // Gullhaven: items
  {when:'port',until:'next',text:"Welcome, cartographer. This trial voyage teaches the game one stop at a time."},
  {until:'bought',target:'#stall',text:"Everything that fights for you is cargo. Tap the Rapier, then Buy."},
  {until:'moved',target:'.dock .board',skip:1,text:"Items fire by themselves once charged. Drag it to another slot."},
  // Gullhaven: crew
  {until:'tavern',target:'[data-bld="tavern"]',pos:'bottom',text:"It's faded: nobody aboard can use it yet. Open the Tavern."},
  {when:'tavern',until:'hired',target:'.talk .buy',text:"The Fencing Master has Steel, which works blades. Sign them on."},
  {when:'hired',until:'next',target:'.dock .board',text:"The Rapier is in full ink now. Faded cargo needs a hand with its skill."},
  {until:'chart',target:'#leave',text:"Now tap Set sail."},
  // the training hulk: fighting
  {when:'chart',until:'fight',target:'.node.reach',text:"Tap the training hulk, then Sail here."},
  {when:'fight',until:'next',pause:1,target:'.board[data-side="p"]',pos:'bottom',text:"Your cargo charges up and fires on its own."},
  {until:'next',pause:1,target:'.speed',pos:'bottom',text:"A storm hits both ships at 30 seconds. Tap 2× or 4× to speed up."},
  // renown
  {when:'renown',until:'perkDone',text:"Wins earn renown. Level up and pick a rule for the whole voyage."},
  {when:'spoils',until:'spoilsTaken',target:'.offers',text:"Take one piece of their cargo, then Sail on."},
  // the isle: landmarks
  {when:'chart',until:'sail',target:'.node.reach',text:"Sail to the uncharted isle."},
  {when:'landmarkOpen',until:'landmark',text:"Landmarks help for the whole voyage. Pick one."},
  {when:'chart',until:'sail',target:'.node.reach',text:"Sail on to Saltmere."},
  // Saltmere: fittings
  {when:'port',until:'wright',target:'[data-bld="wright"]',pos:'bottom',text:"Fittings change how your ship fights. Open the Shipwright."},
  {when:'wright',until:'fitted',target:'#stall',text:"Tap a fitting, then fit it. Each one has a trade-off."},
  {when:'fitted',until:'next',target:'#shipbtn',pos:'bottom',text:"Tap your hull up top any time to see your ship."},
  {until:'chart',target:'#leave',text:"One test left. Set sail."},
  // the examiner: everything together
  {when:'chart',until:'fight',target:'.node.reach',text:"Sail at the Guild's examiner."},
  {when:'fight',until:'next',pause:1,target:'#pf',pos:'bottom',text:"Everything works together now. Watch your fitting and order fire."},
  {when:'spoils',until:'spoilsTaken',target:'.offers',text:"Take your spoils, then Sail on."},
  {when:'chart',until:'sail',target:'.node.reach',text:"Sail in to the Guild hall."},
  {when:'port',until:'finish',text:"Trial passed! The real seas also hold fishing, people, events, bandits and bosses."}
];
const ANSEL=NPCS.ansel.look;
function startTutorial(){
  // open: the places that are open at each port of the trial
  const map={sea:0,start:900,boss:null,rows:5,nodes:[
    {id:900,row:0,col:1.5,x:170,type:'port',name:'Gullhaven',open:['market','tavern']},
    {id:901,row:1,col:1.5,x:170,type:'threat',enemy:'gulls',fixed:{hp:60,list:[{k:'pins',t:0}]}},
    {id:902,row:2,col:1.5,x:170,type:'isle'},
    {id:903,row:3,col:1.5,x:170,type:'port',name:'Saltmere',open:['market','wright']},
    {id:904,row:4,col:1.5,x:170,type:'threat',enemy:'sharks',fixed:{hp:110,list:[{k:'dagger',t:0},{k:'fenders',t:0},{k:'pins',t:0}]}},
    {id:905,row:5,col:1.5,x:170,type:'port',name:'The Guild hall',open:['market']}],
    edges:[[900,901],[901,902],[902,903],[903,904],[904,905]]};
  G=Object.assign({},VOYAGE_DEFAULTS,{seed:'TUTORIAL',ship:'sloop',sea:0,map,at:900,path:[900],day:1,gold:25,hull:20,renown:RENOWN[0]-1,
    board:[],charts:[],log:[],creel:[],hock:'tutorial',tut:{i:0,on:false},crew:[],
    shops:{900:{offers:[{k:'rapier',t:0},{k:'jib',t:0},{k:'swordcane',t:0},{k:'pork',t:0}],tavern:['fencer','bosun','herbalist'],reroll:1,demand:'mackerel'},
      903:{offers:[{k:'pistols',t:0},{k:'sail',t:0},{k:'duelglove',t:0},{k:'fenders',t:0}],fits:['ram','studding'],reroll:1,demand:'mackerel'}}});
  updateReveal();lore(LORE.start);port(900);
}
/* is a place open? Everywhere in a real voyage; in the trial, only where that stop's lesson is */
const tutOpen=view=>!G||!G.tut||((node(G.at)||{}).open||[]).includes(view);
function finishTutorial(){
  hideCoach();A.tutDone=true;A.tips=A.tips||{};['port','chart','crew','wright'].forEach(k=>A.tips[k]=1);saveA();
  cancelAnimationFrame(raf);cancelAnimationFrame(FR);B=null;G=null;
  document.querySelectorAll('.overlay').forEach(o=>o.remove());title();
  toast("Trial passed. Pick a voyage when you're ready.");
}
/* the coach bubble */
function hideCoach(){const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}const dm=document.getElementById('coachdim');if(dm)dm.remove();document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));if(B)B.coachHold=false}
/* How long a tip stays up before its ring resolves into the close button: longer tips get more reading time. */
const readMs=text=>Math.max(3000,Math.min(8000,1800+text.split(/\s+/).length*220));
const XSVG='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>';
/* The coach bubble. A ring in the corner fills while you read, then pops into an x that closes the tip.
   The bubble itself lets taps through, so it never blocks the screen underneath; only its buttons take taps. */
function bubble(text,o){o=o||{};
  hideCoach();
  const dur=readMs(text);
  const c=document.createElement('div');c.id='coach';c.className='coach '+(o.pos||'top');c.setAttribute('role','status');c.setAttribute('aria-live','polite');
  c.innerHTML=`${portrait(ANSEL)}<div class="coach-body">${o.label?`<small>${o.label}</small>`:''}<p>${text}</p>${o.links?`<div class="coach-btns">${o.links}</div>`:''}</div>
    <span class="ctimer" style="--dur:${dur}ms" aria-hidden="true"><svg viewBox="0 0 28 28"><circle class="track" cx="14" cy="14" r="11"/><circle class="prog" cx="14" cy="14" r="11" pathLength="100"/></svg></span>`;
  document.body.appendChild(c);dimFor(c,o.target);
  if(o.pos==='bottom'){const d=document.querySelector('.dock');c.style.bottom=`calc(${d?d.offsetHeight+10:14}px + env(safe-area-inset-bottom,0px))`}
  highlight(o.target);
  c._t=setTimeout(()=>{if(!c.isConnected)return;
    const t=c.querySelector('.ctimer');
    const x=document.createElement('button');x.className='cx';x.setAttribute('aria-label','Close tip');x.innerHTML=XSVG;
    x.onclick=()=>{if(o.onClose)o.onClose();else hideCoach()};
    t.classList.add('out');setTimeout(()=>{t.replaceWith(x)},180)},dur);
  return c;
}
/* the dimmer behind the coach bubble. It takes no taps, so you can still do what Ansel asks. It keeps a clear window over
   what he's pointing at (or the open pop-up), following it as the screen scrolls or redraws. */
function dimFor(c,target){let d=document.getElementById('coachdim');if(!d){d=document.createElement('div');d.id='coachdim';d.className='coachdim';d.setAttribute('aria-hidden','true');document.body.appendChild(d)}
  d.dataset.t=target||'';const hole=document.createElement('i');d.innerHTML='';d.appendChild(hole);
  const place=()=>{if(!c.isConnected||!d.isConnected)return;const t=d.dataset.t;let el=t&&document.querySelector(t);
    if(!el){const ovs=[...document.querySelectorAll('.overlay .sheet')];el=ovs[ovs.length-1]||null}
    if(el){const r=el.getBoundingClientRect(),p=8;if(r.width&&r.height){hole.style.cssText=`left:${r.left-p}px;top:${r.top-p}px;width:${r.width+p*2}px;height:${r.height+p*2}px`;requestAnimationFrame(place);return}}
    hole.style.cssText='left:50%;top:50%;width:0;height:0';requestAnimationFrame(place)};
  place()}
function highlight(target){
  const dm=document.getElementById('coachdim');if(dm)dm.dataset.t=target||'';
  document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));
  if(!target)return;const el=document.querySelector(target);if(!el)return;el.classList.add('coach-hi');
  if(!el.closest('.dock')&&!el.closest('#coach')){const r=el.getBoundingClientRect();if(r.top<150||r.bottom>innerHeight-220)el.scrollIntoView({block:'center',behavior:'smooth'})}
}
function showStep(ev){
  const T=G.tut,st=TUT[T.i];T.on=true;
  const text=st.textFor?st.textFor[ev]:st.text,u=[].concat(st.until);
  // closing a step: explanations move on, the last one finishes, and action steps just tuck the tip away until you do the thing
  const onClose=u.includes('finish')?finishTutorial:(u.includes('next')||st.skip)?()=>advance():()=>{const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}};
  const c=bubble(text,{pos:st.pos,target:st.target,label:`Maiden voyage, stop ${Math.min(G.path.length,G.map.nodes.length)} of ${G.map.nodes.length}`,links:`<button class="linkbtn" data-c="skip">Skip tutorial</button>`,onClose});
  if(st.pause&&B)B.coachHold=true;
  c.querySelector('[data-c=skip]').onclick=finishTutorial;
}
function advance(ev){const T=G.tut;hideCoach();T.i++;T.on=false;const nx=TUT[T.i];
  if(nx&&(!nx.when||(ev&&[].concat(nx.when).includes(ev))))setTimeout(()=>{if(G&&G.tut&&!G.tut.on&&TUT[G.tut.i]===nx)showStep(ev)},320)}
/* the game reports what just happened */
function coach(ev){
  if(!G||!G.tut)return;const T=G.tut,st=TUT[T.i];if(!st)return;
  if(T.on){
    if([].concat(st.until).includes(ev))return advance(ev);
    if(st.target)setTimeout(()=>highlight(st.target),30);   // screen redrew: put the highlight back
    return}
  const w=st.when?[].concat(st.when):null;
  if(!w||w.includes(ev))setTimeout(()=>{if(G&&G.tut&&!G.tut.on&&TUT[G.tut.i]===st)showStep(ev)},st.when?260:0);
}
/* one-time tips outside the tutorial */
const TIPS={
  port:"Buy cargo here. Drag items to arrange them; neighbours can boost each other.",
  chart:"Tap a mark to see what's there. Fog hides what's far off.",
  fishing:"Tap when the bobber shows !, then hold to keep the fish in the bracket.",
  storm:"The storm hurts both ships more every second.",
  elite:"Elites hit harder, but they carry a landmark.",
  boss:"Lose to a boss and you fall back to port. A side route opens, up to twice.",
  people:"People trade, help or give quests. Choices can cost gold, hull or fish.",
  crew:"Faded cargo needs crew. Hire someone with the skill its lines show.",
  wright:"Fittings change your ship's rules, each with a trade-off.",
  locker:"Your locker holds spare cargo outside fights. Drag items in and out."
};
// fire a tip where it applies (the place it's about, the moment it explains); "End tutorial" on any tip stops the rest for good
function tip(key,pos){
  if(!G||G.tut||A.tipsOff)return;A.tips=A.tips||{};if(A.tips[key])return;
  if(document.getElementById('coach'))return;
  A.tips[key]=1;saveA();
  const c=bubble(TIPS[key],{pos,label:'Tip',links:'<button class="linkbtn" data-c="end">End tutorial</button>'});
  c.querySelector('[data-c=end]').onclick=()=>{A.tipsOff=true;saveA();hideCoach()};
}
// cargo nobody aboard can work: the crew tip is about exactly this, so it takes over from whatever tip is showing
function deadTip(o){if(!G||G.tut||A.tipsOff||(A.tips&&A.tips.crew)||itemUse(o.k,crewCrafts())==='all')return;hideCoachIfTip();tip('crew')}
function hideCoachIfTip(){if(!G||!G.tut)hideCoach()}
