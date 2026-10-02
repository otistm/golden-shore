/* Ink Crossing: the bandits. Hidden in one stretch of unknown water per sea: pirates board you and make you play a hand of
   cards for your freedom. Poker hands score chips times mult, like Balatro: three plays and two discards to beat their score.
   Win and they still take half your hold; lose and they take all of it and smash your hull to half. */
"use strict";
const BANDIT_LOOK={body:'Killer',head:'hat-hip',face:'Very Angry',beard:'Full 3',acc:'Eyepatch'};
// each hand: [name, chips, mult]
const BHANDS={HC:['High card',5,1],P:['Pair',10,2],TP:['Two pair',20,2],TK:['Three of a kind',30,3],S:['Straight',30,4],F:['Flush',35,4],FH:['Full house',40,4],FK:['Four of a kind',60,7],SF:['Straight flush',100,8]};
const BSUIT={S:'♠',H:'♥',D:'♦',C:'♣'},BRANK={11:'J',12:'Q',13:'K',14:'A'};
const bandTarget=()=>360+G.sea*60;
const cardChips=c=>c.r===14?11:c.r>10?10:c.r;
/* what a set of cards makes: the hand and the cards in it that score */
function bandEval(cs){if(!cs.length)return null;const n=cs.length,by={};cs.forEach(c=>(by[c.r]=by[c.r]||[]).push(c));
  const g=Object.values(by).sort((a,b)=>b.length-a.length||b[0].r-a[0].r),flush=n===5&&cs.every(c=>c.s===cs[0].s);
  const rs=[...new Set(cs.map(c=>c.r))].sort((a,b)=>a-b),straight=n===5&&rs.length===5&&(rs[4]-rs[0]===4||rs.join()==='2,3,4,5,14');
  const t=straight&&flush?['SF',cs]:g[0].length===4?['FK',g[0]]:g[0].length===3&&g[1]&&g[1].length>=2?['FH',[...g[0],...g[1]]]:flush?['F',cs]:straight?['S',cs]
    :g[0].length===3?['TK',g[0]]:g[0].length===2&&g[1]&&g[1].length===2?['TP',[...g[0],...g[1]]]:g[0].length===2?['P',g[0]]:['HC',[cs.slice().sort((a,b)=>b.r-a.r)[0]]];
  const[,ch,mu]=BHANDS[t[0]],chips=ch+t[1].reduce((a,c)=>a+cardChips(c),0);return{k:t[0],name:BHANDS[t[0]][0],cards:t[1],chips,mult:mu,score:chips*mu}}
/* the boarding: a black-sailed ship runs up alongside yours, grappling hooks fly across and bite, the bandits swing over on
   ropes and land on your deck, and "Boarded!" slams on. A tap skips it; reduced motion goes straight to the cards. */
function boardingFx(then){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return then();
  const fx=document.createElement('div');fx.className='boardfx';
  const wave=(y,amp,len)=>{let d=`M${-len*2} ${y}`;for(let x=-len*2;x<900;x+=len)d+=`q${len/4} ${-amp} ${len/2} 0t${len/2} 0`;return`<path class="w" d="${d}V1400H${-len*2}z"/>`};
  const hooks=[[262,96,148,104],[270,120,150,124],[258,72,132,88]];
  fx.innerHTML=`<svg class="bf-sea" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g class="bf-w1">${wave(178,6,80)}</g>
      <g class="bf-mine"><g transform="translate(30 70)"><g stroke="#000" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#fff">${SHIPDRAW[G.ship]||SHIPDRAW.sloop}</g></g></g>
      <g class="bf-pirate"><g transform="translate(372 62) scale(-1 1)"><g stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="#000" class="bf-black">${SHIPDRAW.galleon}</g></g></g>
      ${hooks.map(([x1,y1,x2,y2],i)=>`<g class="bf-hook" style="--i:${i}"><path class="bf-rope" d="M${x1} ${y1}Q${(x1+x2)/2} ${Math.min(y1,y2)-26} ${x2} ${y2}"/><path class="bf-claw" d="M${x2} ${y2}m-6 -4q2 8 6 4q4 4 6-4M${x2} ${y2}v-6"/></g>`).join('')}
      ${[0,1,2].map(i=>`<g class="bf-bandit" style="--i:${i}"><g transform="translate(${262+i*14} ${26+i*6}) scale(.17)">${peepLayers(BANDIT_LOOK)}</g></g>`).join('')}
      <g class="bf-w2">${wave(200,12,100)}</g><g class="bf-w3">${wave(226,16,120)}</g>
    </svg>
    <div class="bf-call"><span>Boarded!</span></div>`;
  document.body.appendChild(fx);
  let gone=false;const end=()=>{if(gone)return;gone=true;clearTimeout(t);then();fx.classList.add('out');setTimeout(()=>fx.remove(),400)};
  const t=setTimeout(end,3600);setTimeout(()=>fx.addEventListener('click',end),300)}
function bandits(n,done,resumed){
  if(!resumed&&G.boarded==null){G.boarded=n.id;save();return boardingFx(()=>bandits(n,done,true))}
  cancelAnimationFrame(raf);B=null;G.inPort=false;G.boarded=n.id;save();
  // the deck is shuffled by the voyage code, so every captain on this voyage is dealt the same cards
  const r=RNG(G.seed,'bandits',n.id),deck=[];for(const s of 'SHDC')for(let k=2;k<=14;k++)deck.push({r:k,s,id:s+k});
  for(let i=deck.length-1;i>0;i--){const j=ri(r,i+1);[deck[i],deck[j]]=[deck[j],deck[i]]}
  const T=bandTarget(),still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let hand=deck.splice(0,8),sel=new Set(),score=0,plays=3,discs=2,busy=false,last=null,dealt=new Set(hand.map(c=>c.id));
  const sortHand=()=>hand.sort((a,b)=>b.r-a.r||a.s.localeCompare(b.s));sortHand();
  const card=c=>`<button class="bcard${'HD'.includes(c.s)?' red':''}${sel.has(c.id)?' on':''}${dealt.has(c.id)?' deal':''}" data-c="${c.id}" aria-pressed="${sel.has(c.id)}" aria-label="${BRANK[c.r]||c.r} of ${({S:'spades',H:'hearts',D:'diamonds',C:'clubs'})[c.s]}"><b>${BRANK[c.r]||c.r}</b><i>${BSUIT[c.s]}</i></button>`;
  function render(){const picked=hand.filter(c=>sel.has(c.id)),ev=bandEval(picked);
    app.innerHTML=`${barHTML()}<div class="seahead"><h2>Boarded!</h2><span>Bandits</span></div>
    <section class="bandits">
      <div class="bd-top"><div class="bd-face">${peep(BANDIT_LOOK,'40 22 172 150')}</div>
        <div class="talk bd-talk"><p class="say">“${score>=T?'Fine. You play well. We still take our cut.':plays===3&&discs===2?`Cards, captain. Beat ${T} and we only take half your hold. Lose, and we take the lot.`:score?`${T-score} more, or you lose everything.`:'Play your cards, captain.'}”</p></div></div>
      <div class="bd-score"><div><span class="sc-lbl">Their score</span><b>${T}</b></div><div class="bd-mine"><span class="sc-lbl">Your score</span><b id="bdscore">${score}</b></div><div><span class="sc-lbl">Plays</span><b>${plays}</b></div><div><span class="sc-lbl">Discards</span><b>${discs}</b></div></div>
      <div class="bd-bar"><i style="width:${Math.min(100,score/T*100)}%"></i></div>
      <p class="bd-now" id="bdnow">${last?`<b>${last.name}</b> (${last.chips} × ${last.mult}) = <b>${last.score}</b>`:ev?`<b>${ev.name}</b>: ${ev.chips} chips × ${ev.mult} mult = ${ev.score}`:'Pick up to 5 cards to play, or to discard.'}</p>
      <div class="bd-hand" id="bdhand">${hand.map(card).join('')}</div>
      <div class="bd-acts"><button class="primary" id="bplay" ${picked.length&&!busy?'':'disabled'}>Play hand</button><button class="ghost" id="bdisc" ${picked.length&&discs&&!busy?'':'disabled'}>Discard (${discs})</button></div>
      <details class="bd-help"><summary>How hands score</summary><div class="bd-table">${Object.values(BHANDS).map(([nm,c,m])=>`<span>${nm}</span><span>${c} × ${m}</span>`).join('')}</div><p class="soft">Each scoring card adds its chips: number cards their number, J, Q and K 10, aces 11.</p></details>
    </section>`;
    bindBar();dealt.clear();
    app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{if(busy)return;const id=b.dataset.c;if(sel.has(id))sel.delete(id);else if(sel.size<5)sel.add(id);last=null;render()});
    const pb=document.getElementById('bplay'),db=document.getElementById('bdisc');
    pb.onclick=play;db.onclick=discard}
  function draw(k){const nw=deck.splice(0,k);nw.forEach(c=>dealt.add(c.id));hand=hand.concat(nw);sortHand()}
  function discard(){if(!sel.size||!discs||busy)return;discs--;hand=hand.filter(c=>!sel.has(c.id));const k=sel.size;sel.clear();last=null;draw(k);render()}
  function play(){if(!sel.size||busy)return;const picked=hand.filter(c=>sel.has(c.id)),ev=bandEval(picked);busy=true;
    // the played cards lift, the scoring ones flash, the score counts up
    app.querySelectorAll('.bcard.on').forEach(el=>{el.classList.add('played');if(ev.cards.some(c=>c.id===el.dataset.c))el.classList.add('scores')});
    const now=document.getElementById('bdnow');now.innerHTML=`<b>${ev.name}</b>: ${ev.chips} chips × ${ev.mult} mult`;
    const from=score;score+=ev.score;plays--;last=ev;
    const el=document.getElementById('bdscore'),t0=performance.now(),D=still?0:700;
    const tick=t=>{const k=D?Math.min(1,(t-t0-350)/D):1;if(k>0){el.textContent=Math.round(from+ev.score*k);}if(k<1)requestAnimationFrame(tick);else setTimeout(next,still?0:450)};
    setTimeout(()=>{now.innerHTML=`<b>${ev.name}</b> (${ev.chips} × ${ev.mult}) = <b>${ev.score}</b>`;squish(el,'bump');requestAnimationFrame(tick)},still?0:300);
    function next(){hand=hand.filter(c=>!sel.has(c.id));const k=sel.size;sel.clear();busy=false;
      if(score>=T)return finish(true);if(!plays)return finish(false);draw(k);render()}}
  function finish(won){G.boarded=null;
    const lost=[];let msg;
    if(won){// they take the most valuable half of your hold
      const half=Math.ceil(used(G.board)/2);let took=0;const order=G.board.map((b,i)=>[price(b.k,b.t),i]).sort((a,b)=>b[0]-a[0]);
      const gone=new Set();for(const[,i]of order){if(took>=half)break;gone.add(i);took+=DEFS[G.board[i].k].s}
      G.board.forEach((b,i)=>{if(gone.has(i))lost.push(b)});G.board=G.board.filter((b,i)=>!gone.has(i));
      msg=lost.length?`Beat the bandits at cards. They took half the hold anyway: ${lost.map(b=>DEFS[b.k].n).join(', ')}.`:'Beat the bandits at cards. There was nothing in the hold for them to take.'}
    else{lost.push(...G.board);G.board=[];const was=G.hull;G.hull=Math.max(1,Math.floor(G.hull/2));
      msg=`Lost to the bandits at cards. They stripped the hold${lost.length?` (${lost.length} piece${lost.length===1?'':'s'} of cargo)`:''} and smashed the hull from ${was} to ${G.hull}.`}
    logL(msg);save();
    const ov=overlay(`<div class="bd-end ${won?'won':'lost'}"><div class="bd-face big">${peep(BANDIT_LOOK,'40 22 172 150')}</div>
      <h2>${won?'You keep your ship':'They take everything'}</h2>
      <p>${won?`${score} beats ${T}. The bandits keep their word, mostly.`:`${score} against their ${T}.`}</p>
      ${lost.length?`<div class="bd-lost">${lost.map(b=>`<span class="o-icon t${b.t}">${icon(b.k)}</span>`).join('')}</div><p class="soft">${won?'They took':'Gone'}: ${lost.map(b=>DEFS[b.k].n).join(', ')}.</p>`:''}
      ${won?'':`<p><b>Hull smashed to ${G.hull}.</b></p>`}</div>
      <button class="primary" id="bdgo">Sail on</button>`,true,'bdresult');
    const b=ov.querySelector('#bdgo');b.focus();b.onclick=()=>{ov.remove();done()}}
  render();
}
