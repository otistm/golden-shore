/* Golden Shore: What you see on the open sea, in words. The lookout's calls, the lines on each arrival card, and the notes in
   drifting bottles. Picked from the voyage seed, so captains on the same voyage read the same lines. */
"use strict";
/* each stranger at sea: how it looks from far off (art kind, read by seaart.js), what the lookout calls, and what you see up close */
const FOESEEN={
  sloop:{art:'ship',k:'t',pal:'foe-t',call:'Sail ho!',x:["A low sloop with her gunports painted shut. Painted shut from the outside.","She's riding heavy for her size. Whatever she carries, she doesn't want it looked at."]},
  runners:{art:'ship',k:'t',pal:'foe-r',call:'Sail ho!',x:["You can smell the rum from here. So can every gull for a mile.","Her crew are singing. They stop when they see you."]},
  sharks:{art:'fins',call:'Fins in the water!',x:["Fins, circling something that isn't there any more.","The water is a shade darker here, and the fins never stop moving."]},
  gulls:{art:'flock',dark:0,call:'Birds, a lot of them!',x:["Gulls by the hundred, wheeling and screaming. They aren't feeding. They're waiting.","A cloud of gulls hangs over the water. One by one, they turn to look at your sails."]},
  brig:{art:'ship',k:'e',pal:'foe-e',call:'Sail ho! A big one!',x:["Two masts, a full gun deck, and a black flag she isn't bothering to hide.","Her captain lowers a spyglass and says something that makes the whole crew laugh."]},
  serpent:{art:'humps',sp:0,call:'Something huge in the water!',x:["The water ahead is too still. A long shadow moves under it, and the gulls have all gone.","Coils rise and sink like a chain being hauled. Each one is wider than your hull."]},
  ghost:{art:'ship',k:'e',pal:'foe-ghost',call:'A sail, in the fog!',x:["Her sails are rags and her lanterns are lit at noon. Nobody is at the wheel.","She makes no sound at all. Not the creak of a rope, not the slap of a wave."]},
  sirens:{art:'sirens',call:'Singing! Off the bow!',x:["Rocks, and someone singing on them. Your crew have gone very quiet.","The song is in a language nobody aboard knows. Everybody aboard knows the words."]},
  junkf:{art:'ship',k:'jk',pal:'foe-fire',call:'Smoke! A burning sail!',x:["Her battened sails are scorched black at the edges, and she smells of pitch and lamp oil.","Fire pots swing from her yards like lanterns at a feast."]},
  cutter:{art:'ship',k:'t',pal:'foe-navy',call:'Navy sail!',x:["Grey sails and the Admiralty's flag. Her guns are already run out.","A navy cutter, very clean, very fast, and very interested in you."]},
  frigate:{art:'ship',k:'e',pal:'foe-navy',call:'Navy sail! A frigate!',x:["A frigate under full sail, every gun manned. Somebody wants the fog sea for themselves.","Marines line her rail in neat rows, muskets shouldered."]},
  queen:{art:'ship',k:'b',pal:'foe-b',call:'Black sails!',x:["A black ship in the fog, lanterns lit at noon. They say the Queen never sleeps.","She has three cartographers' compasses nailed to her mast. One of them still swings."]},
  crab:{art:'claws',call:'Something in the water!',x:["Two claws break the surface, each the size of a rowboat. They open, slowly.","The sea here spins in a slow circle, and something clicks beneath it."]},
  drowned:{art:'ship',k:'t',pal:'foe-ghost',call:'A sail! Low in the water!',x:["She sails with her decks awash, and her crew don't seem to mind.","Weed hangs from her yards. The men at her rail are wearing it too."]},
  petrels:{art:'flock',dark:1,call:'Storm birds!',x:["Black birds skim the waves in a tight flock. Sailors say they carry the storm with them.","Petrels, hundreds, and the sky darkens wherever they fly."]},
  whaler:{art:'ship',k:'e',pal:'foe-iron',call:'Sail ho! Iron-hulled!',x:["Her hull is plated in iron and her harpoons are longer than your mast.","She's been hunting something down here. From the look of her, it's been hunting her too."]},
  leviathan:{art:'humps',sp:1,call:'Something huge in the water!',x:["An island where no island should be. Then it breathes.","A back like a reef rolls past, and keeps rolling."]},
  kraken:{art:'tentacles',call:'Something huge in the water!',x:["The sea bulges. The compass needle spins and stops, pointing straight down.","Arms rise from the water, one after another, as if counting you."]}
};
/* what you see when you come up to each kind of place. Ports and isles get their own lines; boss and elite lines come from FOESEEN. */
const SEEN={
  port:["Lamps along the quay, and smoke from the tavern chimney. Someone is singing badly.","Gulls on every piling. The harbourmaster watches you come in and doesn't wave.","Nets drying on the sea wall, and the smell of tar and new bread.","A bell rings twice from the lighthouse: a ship in, safe."],
  isle:["Land no chart shows. Somewhere on it there may be a rock with the first cartographer's mark.","A green hump of an island with one good beach, and a lookout's height at its peak.","Palms lean all the same way, as if listening to something across the water."],
  npc:["A small boat with one lantern, and someone rowing nowhere in particular.","A rowboat drifts, oars shipped. Its passenger is waiting, and seems to have been waiting for you.","Someone in a dinghy, watching you come. They don't seem surprised."],
  fish:["Gulls dive and scream over water that boils silver. Something below is feeding well.","The sea is thick with fish here, so thick you can hear them.","A shoal turns all at once under the hull, flashing like a dropped purse."]
};
const SEECALL={port:'Land ho! A port!',isle:'Land ho!',npc:'A lantern on the water!',fish:'Birds working the water!'};
/* events, as they look from the deck before you know what they are. art is read by seaart.js. */
const EVSEEN={
  bottle:{art:'bottle',t:'A glint in the water',x:"A bottle turns over and over in the swell, catching the light.",call:'Something glinting!'},
  wreck:{art:'keel',t:'A hull, keel-up',x:"Weed trails from her keel, and a gull stands on it like a captain. She hasn't been down long.",call:'A wreck!'},
  trader:{art:'ship',k:'t',pal:'foe-m',t:'A merchant ship',x:"Fat with cargo, flying a trader's pennant. Her captain is already at the rail.",call:'Sail ho!'},
  swindler:{art:'ship',k:'t',pal:'foe-m',t:'A merchant ship',x:"Bright new paint on an old hull. Her captain waves both arms, and smiles with all his teeth.",call:'Sail ho!'},
  bandits:{art:'ship',k:'t',pal:'foe-m',t:'A merchant ship',x:"She rides low and quiet. No one at the rail. No one at the wheel.",call:'Sail ho!'},
  toll:{art:'ship',k:'t',pal:'foe-navy',t:'A navy cutter',x:"Grey sails and the Admiralty's flag. She has seen you, and she's turning.",call:'Navy sail!'},
  shrine:{art:'idol',t:'A rock with something on it',x:"A stone figure on a bare rock, coins green at its feet. Gulls won't land on it.",call:'Something on the rocks!'},
  cache:{art:'cairn',t:'A cairn on a rock',x:"Stones piled with care on a rock too small to stand on. Someone wanted this found.",call:'Something on the rocks!'},
  castaway:{art:'sandbar',t:'A sandbar',x:"A strip of sand, a flag made of a shirt, and someone waving it with both arms.",call:'Someone waving!'},
  whirl:{art:'whirl',t:'Turning water',x:"The sea here moves in a slow circle, drawing the foam into a spiral.",call:'The water is turning!'},
  storm:{art:'squall',t:'A squall',x:"A dark cloud sits low on the water as if it's waiting for you.",call:'Weather ahead!'},
  mermaid:{art:'mermaid',t:'A rock with someone on it',x:"Someone sits on the rock, combing her hair with a fishbone. She already knows your name.",call:'Someone on the rocks!'},
  fishing:{art:'fish',t:'Birds over the water',x:"Gulls dive and scream over water that boils silver.",call:'Birds working the water!'},
  fog:{art:'fogbank',t:'A fog bank',x:"A wall of grey on calm water. Bells ring inside it, though no chart shows a buoy here.",call:'Fog ahead!'},
  gunsmith:{art:'forge',t:'Smoke on an islet',x:"A forge on the beach, hammering, and the smell of hot iron coming over the water.",call:'Smoke on the water!'},
  rogue:{art:'swell',t:'A swell building',x:"The sea rises and falls, rises and falls, higher every time.",call:'Big water ahead!'},
  pickpocket:{art:'flotsam',t:'Barrels adrift',x:"Barrels and a coil of good rope, bobbing together as if someone tied them.",call:'Something in the water!'}
};
/* notes found with a scrap of chart in a drifting bottle */
const NOTES=[
  "Half a page, salt-stained. The hand is neat. A coastline, and in the corner the circle with a line through it.",
  "Whoever drew this was in a hurry. The ink ran. One island is circled twice.",
  "Torn from a log: 'Day 40. The fog moves when you look away. I have stopped looking away.'",
  "On the back, a list of debts and one line underlined: 'The Queen's compass lies.'",
  "A child's drawing of a sea monster, and under it, very small, a real coastline.",
  "The paper is good Guild stock. Someone has written 'keep going' along the edge, three times.",
  "A careful sketch of a bay, with soundings, and a note: 'Fresh water here. Bad dreams.'",
  "Most of it is water damage. What's left is a good piece of coast, and a cross where a ship went down."
];
/* a line from a list, the same for every captain on this voyage */
const seenLine=(arr,...k)=>arr[ri(RNG(G.seed,'seen',...k),arr.length)];
