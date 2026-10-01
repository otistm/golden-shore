/* Ink Crossing: the tutorial (a short guided first voyage with Ansel as coach) and one-time tips for everything else. */
"use strict";
/* Tutorial steps. when: the event that shows the step (none = right after the previous one).
   until: the event that moves on ('next' shows a Next button, 'finish' a Finish button). pause: holds the fight while it's shown. */
const TUT=[
  {when:'port',until:'next',text:"Welcome aboard, cartographer. I'm Ansel. I keep the Gullhaven light, and I'll see you out of the harbour."},
  {until:'bought',target:'.offers',text:"This is the port market. Buy something with a Buy button. You have enough gold for any of these."},
  {until:'moved',target:'.dock .board',skip:1,text:"It went into your hold. In a fight, each item fires on its own when it's charged. Drag an item to a new spot. Some items boost their neighbours."},
  {until:'chart',target:'#leave',text:"Good. When you're ready, tap Set sail."},
  {when:'chart',until:'fight',target:'.node.reach',text:"This is your chart. Fog hides what's far off. Tap the glowing mark to see what's there, then sail."},
  {when:'fight',until:'next',pause:1,target:'#ef',pos:'bottom',text:"A fight. Every enemy has its own tricks. Tap its card any time to read them. Reef Sharks get faster when they're hurt."},
  {until:'next',pause:1,target:'.board[data-side="p"]',text:"Your cargo charges up and fires by itself. Watch the hatching fill each item."},
  {until:'next',pause:1,target:'.speed',text:"After 30 seconds a storm hits both ships. Win before then. Tap 2× or 4× to speed things up."},
  {when:'spoils',until:'spoilsTaken',target:'.offers',text:"You won. Winners take spoils. Drag one piece of their cargo into your hold, or tap Take. Then Sail on."},
  {when:'chart',until:'sail',target:'.node.reach',text:"Routes branch. Fishing grounds give you fish to sell at port. Uncharted isles give landmarks that help for the whole voyage. Pick one."},
  {when:['fishing','landmarkOpen'],until:['fishDone','landmark'],textFor:{
    fishing:"Tap Cast. When the bobber dips and shows !, tap fast. Then hold to keep the fish inside the bracket.",
    landmarkOpen:"Pick a landmark. It goes on your chart and helps you for the rest of the voyage."}},
  {when:'chart',until:'sail',target:'.node.reach',text:"Last stop today: Saltmere. Sail in."},
  {when:'port',until:'finish',text:"Ports sell cargo and buy fish. Out in the real seas there are people to meet, elites, events and a boss at the end of each sea. That's everything. Good luck, cartographer."}
];
const ANSEL={hat:'cap',beard:1};
function startTutorial(){
  const map={sea:0,start:900,boss:null,nodes:[
    {id:900,row:0,col:1.5,x:170,type:'port',name:'Gullhaven'},
    {id:901,row:1,col:1.5,x:170,type:'threat',enemy:'sharks',fixed:{hp:55,list:[{k:'dagger',t:0},{k:'fenders',t:0}]}},
    {id:902,row:2,col:.5,x:100,type:'fish'},
    {id:903,row:2,col:2.5,x:240,type:'isle'},
    {id:904,row:3,col:1.5,x:170,type:'port',name:'Saltmere'}],
    edges:[[900,901],[901,902],[901,903],[902,904],[903,904]]};
  G=Object.assign({},VOYAGE_DEFAULTS,{seed:'TUTORIAL',ship:'sloop',sea:0,map,at:900,path:[900],day:1,gold:12,hull:20,
    board:SHIPS.sloop.start.map(x=>({...x})),charts:[],log:[],creel:[],hock:'tutorial',tut:{i:0,on:false},crew:['fencer','bosun','herbalist'].map(k=>({k,xp:0,m:3})),
    shops:{900:{offers:[{k:'swordcane',t:0},{k:'sail',t:0},{k:'pork',t:0},{k:'duelglove',t:0}],reroll:1,demand:'mackerel'}}});
  updateReveal();lore(LORE.start);port(900);
}
function finishTutorial(){
  hideCoach();A.tutDone=true;A.tips=A.tips||{};['port','chart','fishing'].forEach(k=>A.tips[k]=1);saveA();
  cancelAnimationFrame(raf);cancelAnimationFrame(FR);B=null;G=null;
  document.querySelectorAll('.overlay').forEach(o=>o.remove());title();
  toast("Tutorial done. Pick a voyage when you're ready.");
}
/* the coach bubble */
function hideCoach(){const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));if(B)B.coachHold=false}
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
  document.body.appendChild(c);
  if(o.pos==='bottom'){const d=document.querySelector('.dock');c.style.bottom=`calc(${d?d.offsetHeight+10:14}px + env(safe-area-inset-bottom,0px))`}
  highlight(o.target);
  c._t=setTimeout(()=>{if(!c.isConnected)return;
    const t=c.querySelector('.ctimer');
    const x=document.createElement('button');x.className='cx';x.setAttribute('aria-label','Close tip');x.innerHTML=XSVG;
    x.onclick=()=>{if(o.onClose)o.onClose();else hideCoach()};
    t.classList.add('out');setTimeout(()=>{t.replaceWith(x)},180)},dur);
  return c;
}
function highlight(target){
  document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));
  if(!target)return;const el=document.querySelector(target);if(!el)return;el.classList.add('coach-hi');
  if(!el.closest('.dock')&&!el.closest('#coach')){const r=el.getBoundingClientRect();if(r.top<150||r.bottom>innerHeight-220)el.scrollIntoView({block:'center',behavior:'smooth'})}
}
function showStep(ev){
  const T=G.tut,st=TUT[T.i];T.on=true;
  const text=st.textFor?st.textFor[ev]:st.text,u=[].concat(st.until);
  // closing a step: explanations move on, the last one finishes, and action steps just tuck the tip away until you do the thing
  const onClose=u.includes('finish')?finishTutorial:(u.includes('next')||st.skip)?()=>advance():()=>{const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}};
  const c=bubble(text,{pos:st.pos,target:st.target,label:`Tip ${T.i+1} of ${TUT.length}`,links:`<button class="linkbtn" data-c="skip">Skip tutorial</button>`,onClose});
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
  port:"Buy cargo here. Drag items in your hold to arrange them. Some items boost their neighbours.",
  chart:"Tap a glowing mark to see what's there. Fog hides everything more than two rows ahead.",
  fishing:"Tap Cast. When the bobber dips and shows !, tap fast. Then hold to keep the fish inside the bracket.",
  storm:"The storm is here. It hurts both ships more every second, so the fight ends soon.",
  elite:"Elites hit harder, but they carry a landmark as well as cargo.",
  boss:"Bosses guard the way to the next sea. Lose and you fall back to port to refit, then try again.",
  people:"People can trade, help, or give you a quest. Choices can cost gold, hull or fish.",
  crew:"Your crew make your cargo work. Each item ability needs someone aboard with its craft, like Steel for weapon damage or Alchemy for poison. An ability is ticked when someone aboard can work it. Unticked ones need a new hire from the tavern.",
  wright:"The shipwright fits parts to your ship. Each one changes how you fight, with a trade-off. Tap your hull to see your ship.",
  locker:"Your new locker holds spare cargo. It stays out of fights. Drag items between it and your hold."
};
function tip(key,pos){
  if(!G||G.tut)return;A.tips=A.tips||{};if(A.tips[key])return;
  if(document.getElementById('coach'))return;
  A.tips[key]=1;saveA();
  bubble(TIPS[key],{pos,label:'Tip'});
}
function hideCoachIfTip(){if(!G||!G.tut)hideCoach()}
