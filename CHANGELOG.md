# Changelog

## 0.6.0
- Fittings: your ship has 4 fitting spots, hull, sails, guns and figurehead. Each of the 16 fittings changes how you fight, with a trade-off. For example, Double Planking gives +40 health but boards up a hold slot, and the Gull figurehead gives +10% crit on all your damage for 10 less health.
- A shipwright in every port sells 2 fittings and repairs hull for 2 gold a point, up to 20. A new fitting replaces the one in its spot, which sells for half.
- Elites carry spare parts: after beating one, you can pick a fitting instead of a landmark.
- Tap your hull in the top bar to see your ship: its trait, hold size and fittings. On a computer, the captain's desk lists your fittings too.

## 0.5.0
- The chart unrolls like a scroll. The roll slides down the page revealing the sea, overshoots a touch and flattens away. It plays the first time you see each sea and when you continue a saved voyage, not every time you come back to the chart.

## 0.4.0
- Spoils are now a screen of their own, laid out like the market, with your hold docked at the bottom. Drag a spoil into any slot in your hold or locker, or tap Take. Changed your mind? Drag it back onto its card, or tap Put back.
- Short on room? Drag your own cargo onto the button at the bottom to sell it, at the port price. Spoils that don't fit yet say how many more slots they need.
- Taking nothing gives you gold, as before: the button reads "Take 4 gold and sail on" until you pick something.
- Pause, like Ink Nine and Ink Rally. A round pause button sits in the top-right corner. It freezes fights and fishing and opens a card to keep sailing, save and go to the title, or send feedback. In the tutorial it offers to leave instead. The game also pauses by itself if you switch away mid-fight or mid-cast. On a computer, P or Esc pauses too.
- A fight you leave, or a page you refresh mid-fight, now starts that fight over when you come back. Before, it let you skip the fight.

## 0.3.0
- Ink Crossing has a proper desktop layout. On a laptop or monitor, the game sits on the left and a captain's desk runs down the right: your ship and its trait, the landmarks you've charted, your catch, and the cartographer's log, always in view.
- The hold is a band along the bottom with big tiles that show each item's name, and Set sail beside it.
- Market cards are big, like playing cards, and the fish market sits beside the dock visitor.
- The chart fills the whole stage, with stops spread wide instead of squeezed into a phone-shaped strip. The route is the same, only the spacing changes. Tap a stop on the chart to see what's there.
- Fights fill the screen with big items.
- Pop-ups open as cards in the middle. With a mouse, things lift when you point at them. Esc closes a pop-up or a tip, and 1, 2 and 4 set the fight speed.
- Phones, even turned sideways, look exactly as before.
- On every screen: after you lose a fight, a card shows the hull you lost, on the chart or back in port after a boss. Your ship rocks, a plank cracks off for each point of hull, and the number counts down. It fades by itself and never blocks the chart.

## 0.2.1
- Tutorial tips and one-time tips work like Ink Nine's. Each tip shows a small ring in its corner that fills while you read, then pops into an x that closes it. Tutorial tips show "Tip N of 13". Closing an explanation moves the tutorial on, and closing a "do this" tip just tucks it away until you do it.
- Tips no longer block the screen. Taps pass through the bubble to whatever is underneath, and only its buttons take taps.

## 0.2.0
- Tutorial: "Learn to sail" is a short guided first voyage out of Gullhaven with Ansel the lighthouse keeper as your coach. It covers buying, arranging the hold, the chart, a fight (paused while Ansel explains), spoils, a fishing or landmark branch, and a second port. It's offered first to new players, it can be replayed from the title screen, and it never touches a voyage in progress.
- One-time tips the first time you meet something the tutorial doesn't cover: the storm, elites, bosses, people, fishing and the locker.

## 0.1.0
- Ink Crossing moves to a proper project, set up like Ink Nine: a front page, the game in `play/`, and code split into readable files with no build step.
- Version number on the title screen and in the log.
- "Send feedback" on the title screen and in the log, once online services are set up. Notes land in Supabase with the version, ship and chart position attached.
- Saved progress is protected across updates, with a backup copy kept each time the version changes.
- Home-screen install, app icons and a share preview image.
