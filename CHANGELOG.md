# Changelog

## 0.3.0
- Ink Crossing has a proper desktop layout. On a laptop or monitor, the game sits on the left and a captain's desk runs down the right: your ship and its trait, the landmarks you've charted, your catch, and the cartographer's log, always in view.
- The hold is a band along the bottom with big tiles that show each item's name, and Set sail beside it.
- Market cards are big, like playing cards, and the fish market sits beside the dock visitor.
- The chart fills the whole stage, with stops spread wide instead of squeezed into a phone-shaped strip. The route is the same, only the spacing changes. Tap a stop on the chart to see what's there.
- Fights fill the screen with big items.
- Pop-ups open as cards in the middle. With a mouse, things lift when you point at them. Esc closes a pop-up or a tip, and 1, 2 and 4 set the fight speed.
- Phones, even turned sideways, look exactly as before.

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
