/* Ink Crossing: every character's portrait, built from Open Peeps (CC0, by Pablo Stanley) the way the set is meant to be used:
   a body, a head (hair or hat), a face, facial hair and an accessory, stacked at fixed spots. The parts themselves live in
   peep-parts.js, copied from the atoms by tools/peeps.mjs. A look ({body,head,face,beard,acc}) names one part per layer. */
"use strict";
// where each layer sits in the Open Peeps bust (1136 by 1533), and the scale down to our 240 by 324 bust
const PEEP_ORDER=['body','head','face','beard','acc'];
const PEEP_AT={body:[147,639],head:[372,180],face:[531,366],beard:[495,518],acc:[419,421]},PEEP_SCALE=240/1136;
const PEEP_BASE={body:'Tee 1',head:'Short 1',face:'Calm'};
const PEEP_BUST='0 0 240 324',PEEP_HEAD='62 30 132 132';   // the whole bust, and a crop to head and shoulders for round portraits
/* a portrait's layers from a look (body, head and face fall back to the base); drawn in the 240 by 324 frame */
/* colour: the black shapes are the line art and stay black. Each part's white is split into areas (skin, hair, hat, clothes,
   lens, a cream prop) by tools/peepcolor.mjs, saved in PEEP_AREAS, and drawn under the lines. A person's skin, light hair, hat
   and clothes colours come from the look itself, so they always look the same. */
const PEEP_SKIN=['#F0CDAA','#E2B48C','#C9946C','#A8744F','#7E5238','#EBC29C'],PEEP_CLOTH=['#5E7487','#B5533C','#D9A93A','#93A47E','#C27866','#7F98A7','#8E6A4B','#D7BA8E'],
  PEEP_HAIR=['#D9B46A','#C9844E','#E6D29A','#B98E64'];
function peepTone(L){let h=7;for(const c of JSON.stringify(L))h=(h*31+c.charCodeAt(0))>>>0;
  const hair=/Gray/.test(L.head||'')?'#C2BCB2':PEEP_HAIR[(h>>>9)%PEEP_HAIR.length];
  return`--skin:${PEEP_SKIN[h%PEEP_SKIN.length]};--cloth:${PEEP_CLOTH[(h>>>5)%PEEP_CLOTH.length]};--hair:${hair};--hat:${PEEP_CLOTH[((h>>>5)+3)%PEEP_CLOTH.length]}`}
/* a part with its colour areas laid under its lines: the white shape takes the part's main colour, the areas go on top of it */
function peepPart(s,name,p){const A=typeof PEEP_AREAS!=='undefined'&&PEEP_AREAS[s]&&PEEP_AREAS[s][name];if(!A)return p;
  const i=p.indexOf(' fill="#fff"');if(i<0)return p;const end=p.indexOf('</path>',i)+7;
  return p.slice(0,i)+` class="ar-${A.b}"`+p.slice(i,end)+A.a.map(([r,d])=>`<path class="ar-${r}" d="${d}"/>`).join('')+p.slice(end)}
function peepLayers(look){const L=Object.assign({},PEEP_BASE,look||{});
  return`<g class="peepart" style="${peepTone(L)}" transform="scale(${PEEP_SCALE.toFixed(5)})" fill="none" stroke="none" fill-rule="evenodd">${PEEP_ORDER.map(s=>{const p=L[s]&&PEEP_PARTS[s][L[s]];
    return p?`<g class="pl-${s}" transform="translate(${PEEP_AT[s][0]} ${PEEP_AT[s][1]})">${peepPart(s,L[s],p)}</g>`:''}).join('')}</g>`}
function peep(look,view,cls){return`<svg class="${cls||'peep'}" viewBox="${view||PEEP_BUST}" aria-hidden="true">${peepLayers(look)}</svg>`}
/* a crew member's face for the round portraits in the tavern, the crew strip, the ship card and the desk */
const crewFace=k=>peep(CREW[k]&&CREW[k].look,PEEP_HEAD);
