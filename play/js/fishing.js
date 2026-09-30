/* Ink Crossing: The fishing minigame. */
"use strict";
/* ---------- fishing ---------- */
let FR=0;
function fishing(key,casts,done){
  cancelAnimationFrame(raf);cancelAnimationFrame(FR);B=null;app.style.paddingBottom='';G.inPort=false;
  const F={left:casts,n:0,phase:'idle',hold:false,t0:performance.now(),bx:62,by:34,tx:62,ty:34,ax:0,ay:0,at:0,
    p:.5,pt:.5,pv:0,retarget:0,z:.37,zv:0,prog:.3,fish:null,biteAt:0,nibble:0,winEnd:0,msg:'Tap Cast to throw your line.'};
  const zoneW=()=>.24+G.rod*.05;
  app.innerHTML=`${barHTML()}<div class="seahead"><h2>Fishing</h2><span id="casts"></span></div>
    <div class="pond" id="pond"><svg viewBox="0 0 340 150" aria-hidden="true">
      <g class="pwave"><path d="M-40 88 Q-20 80 0 88 T40 88 T80 88 T120 88 T160 88 T200 88 T240 88 T280 88 T320 88 T360 88 T400 88" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"/></g>
      <g class="pwave back"><path d="M-40 112 Q-20 105 0 112 T40 112 T80 112 T120 112 T160 112 T200 112 T240 112 T280 112 T320 112 T360 112 T400 112" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round" opacity=".4"/></g>
      <path d="M0 150V60l26 6 6 84z" fill="#fff" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M14 70L60 12" stroke="#000" stroke-width="3" stroke-linecap="round"/>
      <path id="fline" fill="none" stroke="#000" stroke-width="1.2"/>
      <g id="bob"><path d="M0-9v5" stroke="#000" stroke-width="1.6"/><circle r="5" fill="#fff" stroke="#000" stroke-width="2"/><path d="M-5 0a5 5 0 0 0 10 0z" fill="#000"/></g>
      <text id="bang" x="0" y="0" text-anchor="middle" class="bang" opacity="0">!</text>
    </svg></div>
    <div class="reel" id="reel" hidden>
      <div class="track" id="track"><div class="zone" id="zone"></div><div class="fishmark" id="fmark"><svg viewBox="0 0 24 14"><path d="M2 7c4-6 12-6 16 0-4 6-12 6-16 0z" fill="#fff" stroke="#000" stroke-width="1.8"/><path d="M18 7l5-4v8z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6" cy="6.5" r="1.1"/></svg></div></div>
      <div class="prog"><div id="progf"></div></div>
    </div>
    <p class="fmsg" id="fmsg"></p>
    <div class="fbtns"><button class="primary" id="fbtn">Cast</button><button class="linkbtn" id="fstop">Stop fishing</button></div>
    <p class="seed" style="text-align:center;margin-top:10px">Creel ${G.creel.length}/${CREEL}. Rod ${['basic','good','fine','master'][G.rod]}.</p>`;
  bindBar();scrollTo(0,0);setTimeout(()=>{coach('fishing');tip('fishing','bottom')},300);
  const $=id=>document.getElementById(id),btn=$('fbtn'),bob=$('bob'),line=$('fline'),bang=$('bang');
  const ui=()=>{$('casts').textContent=`${F.left} cast${F.left===1?'':'s'} left`;$('fmsg').textContent=F.msg};
  const setBtn=(t,cls)=>{btn.textContent=t;btn.className='primary'+(cls?' '+cls:'')};
  ui();
  const now=pauseClock;
  function cast(){F.phase='fly';F.at=now();F.ax=F.bx;F.ay=F.by;F.tx=200+Math.random()*70;F.ty=88;F.msg='Watch the bobber…';setBtn('Wait…','wait');ui()}
  function bite(){F.phase='bite';F.winEnd=now()+Math.max(.55,.9-G.sea*.1);F.msg='Bite! Tap now!';setBtn('Hook it!','hot');ui();bang.setAttribute('opacity',1);navigator.vibrate&&navigator.vibrate(40)}
  function hook(){F.n++;F.fish=fishOf(RNG(G.seed,'fish',key,F.n));F.phase='reel';F.prog=.3;F.p=.5;F.pt=.5;F.z=.5-zoneW()/2;F.zv=0;
    $('reel').hidden=false;$('zone').style.width=zoneW()*100+'%';F.msg='Hold to pull the bracket right. Keep the fish inside it.';setBtn('Hold to reel','hold');bang.setAttribute('opacity',0);ui()}
  function miss(){F.left--;F.phase='done1';F.msg='Too slow. It spat the hook.';bang.setAttribute('opacity',0);after()}
  function after(){$('reel').hidden=true;F.tx=62;F.ty=34;F.phase=F.phase==='done1'?'rest':'rest';setBtn(F.left>0?'Cast again':'Head back');ui();save()}
  function caught(){F.left--;const k=F.fish;A.fish=A.fish||{};A.fish[k]=1;saveA();
    let note='';
    if(G.creel.length<CREEL){G.creel.push(k)}else{let j=0;G.creel.forEach((f,i)=>{if(FISH[f].v<FISH[G.creel[j]].v)j=i});
      if(FISH[G.creel[j]].v<FISH[k].v){note=` Released ${an(FISH[G.creel[j]].n)} to make room.`;G.creel[j]=k}else note=' Your creel is full, so you let it go.'}
    logL(`Caught ${an(FISH[k].n)}.`);F.msg=`Caught ${an(FISH[k].n)}!${note}`;F.phase='rest';after();
    const ov=overlay(`<div class="catch">${fishSVG(k,'bigfish')}</div><h2 style="text-align:center">${FISH[k].n}</h2><p class="soft" style="text-align:center">${RAR[FISH[k].rar]}. Worth ${FISH[k].v} gold at port.${note}</p><button class="primary" data-a="c">Nice</button>`,true);
    ov.querySelector('button').onclick=()=>ov.remove();ov.querySelector('button').focus()}
  function escaped(){F.left--;F.msg=`It got away. It felt like a ${FISH[F.fish].rar>=2?'big one':'decent one'}.`;F.phase='rest';after()}
  const press=e=>{e.preventDefault();
    if(F.phase==='idle'||F.phase==='rest'){if(F.left<=0)return leave();cast()}
    else if(F.phase==='wait'){F.left--;F.phase='rest';F.msg='Too early. You spooked it.';after()}
    else if(F.phase==='bite')hook();
    else if(F.phase==='reel')F.hold=true};
  const release=()=>{F.hold=false};
  btn.addEventListener('pointerdown',press);
  $('pond').addEventListener('pointerdown',e=>{if(F.phase==='bite'||F.phase==='reel'||F.phase==='wait')press(e)});
  $('reel').addEventListener('pointerdown',e=>{if(F.phase==='reel'){e.preventDefault();F.hold=true}});
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  btn.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){if(F.phase==='reel')F.hold=true;else press(e)}});
  btn.addEventListener('keyup',release);
  $('fstop').onclick=leave;
  function leave(){cancelAnimationFrame(FR);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);save();hideCoachIfTip();coach('fishDone');done()}
  let lt=now();
  function frame(){if(PAUSE.on){FR=requestAnimationFrame(frame);return}const t=now(),dt=Math.min(.05,t-lt);lt=t;
    if(F.phase==='fly'){const k=Math.min(1,(t-F.at)/.6);F.bx=F.ax+(F.tx-F.ax)*k;F.by=F.ay+(F.ty-F.ay)*k-Math.sin(k*Math.PI)*60;
      if(k>=1){F.phase='wait';F.biteAt=t+1.3+Math.random()*2.6;F.nibble=t+.6+Math.random()*.8}}
    else if(F.phase==='wait'){F.bx=F.tx;F.by=F.ty+Math.sin(t*2.4)*1.5;
      if(t>F.nibble&&t<F.biteAt-.4){F.by+=Math.max(0,Math.sin((t-F.nibble)*18))*3;if(t>F.nibble+.3)F.nibble=t+.7+Math.random()*1.1}
      if(t>=F.biteAt)bite()}
    else if(F.phase==='bite'){F.bx=F.tx+Math.sin(t*40)*1.5;F.by=F.ty+8;if(t>F.winEnd)miss()}
    else if(F.phase==='reel'){const d=FISH[F.fish].diff;
      F.retarget-=dt;if(F.retarget<=0){F.pt=Math.random();F.retarget=(1.7-d*.22)*(.5+Math.random())}
      const sp=.18+d*.09;F.pv+=(Math.sign(F.pt-F.p)*sp-F.pv)*Math.min(1,dt*(2+d));F.p=Math.max(0,Math.min(1,F.p+F.pv*dt));
      if(Math.abs(F.pt-F.p)<.02)F.pv*=.9;
      F.zv+=(F.hold?2.4:-2.1)*dt;F.zv=Math.max(-.9,Math.min(.9,F.zv));F.z+=F.zv*dt;
      const w=zoneW();if(F.z<0){F.z=0;F.zv=Math.max(0,-F.zv*.25)}if(F.z>1-w){F.z=1-w;F.zv=-Math.abs(F.zv)*.25}
      const inside=F.p>=F.z&&F.p<=F.z+w;
      F.prog+=inside?dt*(.34-d*.03):-dt*(.2+d*.025);
      $('zone').style.left=F.z*100+'%';$('zone').classList.toggle('on',inside);$('fmark').style.left=F.p*100+'%';$('fmark').classList.toggle('flip',F.pv>0);$('progf').style.width=Math.max(0,Math.min(1,F.prog))*100+'%';
      F.bx=F.tx+(F.p-.5)*40;F.by=F.ty+4+Math.sin(t*20)*2;
      if(F.prog>=1)caught();else if(F.prog<=0)escaped()}
    else{F.bx+=(F.tx-F.bx)*Math.min(1,dt*6);F.by+=(F.ty-F.by)*Math.min(1,dt*6)}
    bob.setAttribute('transform',`translate(${F.bx} ${F.by})`);bang.setAttribute('x',F.bx);bang.setAttribute('y',F.by-16);
    const sag=F.phase==='reel'?4:F.phase==='wait'?22:10;
    line.setAttribute('d',`M60 12Q${(60+F.bx)/2} ${Math.max(12,F.by)-4+sag} ${F.bx} ${F.by-8}`);
    FR=requestAnimationFrame(frame)}
  FR=requestAnimationFrame(frame);
}
