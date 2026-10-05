# Style Bible — drawing like Chris Ware

Read this before drawing anything in a new session. Everything else in the skill (palettes,
recipes, the library defaults) derives from it. It was written from close study of seven Ware
pieces: a cutaway apartment-building book cover, two New Yorker covers (kids gaming in a
bedroom; school drop-off), a Chicago poster grid of 40+ small vignettes, a snowy-house page
with a zoom strip, a five-panel "house across the seasons" page, and a rainy-morning
flower-shop page. The exemplar PNGs in `assets/exemplars/` show the rules applied (they are
original work made with this skill, not Ware's).

## Contents
1. What the style is (and is not)
2. Linework
3. Color
4. Perspective and camera
5. Architecture and objects
6. Detail
7. Composition (the page as a diagram)
8. Scale
9. Figures (summary; full guide in figures.md)
10. Mood and subject
11. Translating the style into game assets
12. Originality and attribution

---

## 1. What the style is (and is not)

It is: clear-line, flat-color, architectural cartooning. Drawn as if by a draftsman: a single
mechanical ink line, flat fills, blueprint-straight elevations, and detail that is precise
but schematic. The page is designed like an infographic: panels, insets, connecting lines,
sequences. The mood is quiet, ordinary, a little sad, and very observant.

It is not: brushy, gestural, painterly, rubbery, cel-shaded with highlights, gradient-heavy,
manga-expressive, or "cartoony" in the bouncy sense. No speed lines, no action bursts with
spikes, no dramatic camera angles, no glow effects, no drop shadows, no textures.

If an asset could pass as a mobile-game sticker or a vector stock illustration, it has
drifted. Ware's work feels *measured*: every window has a sill, every brick course is there.

## 2. Linework

**One line.** A uniform, mechanical, warm-black line, like a technical pen or a vector
stroke with round joins and caps. Line weight does NOT vary for expression or depth. It
varies only by *role*:

| role | relative weight | used for |
|---|---|---|
| border | ~2.0× outline | panel borders, card frames |
| outline | 1× | silhouettes, major forms, figures, buildings |
| detail | ~0.6× | mullions, seams, folds, interior edges, rivets |
| hair | ~0.4× | wires, rigging, mortar, wood grain, twigs, text rules |

Measured on the references: the outline is about 0.18–0.25% of the full image width (a
1500 px page → 2.7–3.7 px), panel borders roughly double that, gutters about 0.7% of the page
width. Use `Weights()` in `ware.py`. For game assets, set weights by *final on-screen size*,
and keep one table of weights across the whole game (see game-integration.md).

**No shading lines.** No hatching, cross-hatching, stippled shading or texture strokes for
form. Form comes from flat color planes. (Stipple is used for *grain* in skies and gradients,
and for *specks* on dark floors and snow. Both are atmospheric, not modeling.)

**Where the line is absent** (deliberately, and this matters):
- far-background silhouettes (distant skyline, far trees): flat shape, no outline
- skies, flat cloud bands, light pools, lamp cones, glows: no outline
- reflections on water and cast shadows on the ground: no outline
- the inner "body" color of a tree crown sitting inside its rim band

**Signature edges:**
- *Foliage* (crowns, bushes, hedges): a fine, regular sawtooth/serrated edge, and a lighter
  **rim band** on the sun side (yellow-green on green, yellow on autumn orange). → `crown()`
- *Bare trees*: trunk and limbs as tapered filled shapes with one clean outline; the finest
  twigs become plain hairlines. → `bare_tree()`
- The same serrated technique works for foam, small bursts and cumulus seen from above.
  → `serrated_blob()`
- Snow cover on roofs and hedges: smooth rounded shapes sitting on the form, with a darker
  underside where the snow overhangs.

**Lettering.** Small, neat, hand-lettered caps; condensed grotesque for signage and sound
effects; script/hand for notes and letters. Sound effects (KLATG, CHNGK, VFMMMMM) are set
*inside* the panel near their source, small, often white on dark, sometimes running off the
panel edge. They never get comic-book bursts, outlines or 3D. All lettering is converted to
paths (`text()`, `sfx()`), so fonts never go missing.

## 3. Color

**Measured numbers** (HSV across the seven references):
- median saturation **0.11–0.40, typically ~0.20**; 90th percentile 0.31–0.56
- fully saturated color appears only in **small accent areas, ≤ ~5% of the image**: the
  yellow school bus, a robin, a red cardigan, zinnias, the yellow-green rim on tree crowns,
  lit windows
- near-black covers **~5–15%** of a full scene (lines plus deep shadow planes)

`scripts/render.py --audit` checks an asset against these numbers.

**Flat fills.** Every form is one flat color. A form may get **one shade plane**: the same
hue, darker and slightly cooler (`shade()`), as a hard-edged shape on the side away from the
light (side of a building, underside of a ledge, back of a torso). Deep shade goes almost to
black: the shadow side of a building, an open doorway, a window at night, the dark mass
under a hedge in snow. That near-black gives his pages their weight; a scene with almost
none looks timid.

**Gradients only in light and sky.** Skies get a vertical gradient (peach to cream, steel to
teal), always roughened with fine grain dots (light dots densest toward the bright end, dark
dots toward the dark end). → `grain_rect()`. Never put gradients on objects, figures or
buildings.

**Light is a flat shape.** A lamp's cone, a window's spill, a glow behind a candle: a flat,
semi-transparent lighter polygon or disk. No blur, no radial gradient bloom.

**Highlights** on glossy things (glass, metal, a lipstick case, a car): one flat white or
cream sliver shape. → `highlight_sliver()`

**White** is used for paper, snow and specular highlights. Off-white/cream for lit surfaces.
Pure #000 is never used; INK is warm near-black (#1f1c1d).

**Palette per scene, keyed to time and weather.** A scene has one temperature: peach dusk,
blue snow evening, teal afternoon, grey rain, cream morning. Every color in the scene leans
that way. Interiors are muted green-greys, browns, mauves. See palettes.md.

## 4. Perspective and camera

- **Elevation by default.** Buildings, ships, cars, furniture and figures are drawn straight
  on, like architectural elevations: facades flat to the picture plane, horizontals
  horizontal, verticals vertical. This is the single most recognizable structural trait.
- **Gentle one-point** only when a space needs depth (a room, a street). Never three-point,
  never dramatic foreshortening, no tilted (Dutch) angles.
- **Axonometric/isometric** for overviews (a neighborhood from above in snow, a map).
- **Straight down** for objects on surfaces (a mug, a phone, a plate of tacos) and for maps.
- **Low horizon** in landscapes; big quiet sky.
- Camera at standing eye height or exactly level with the subject. Figures are often seen
  from behind or in strict profile.
- Depth comes from **value and outline**, not from perspective: far things are lighter,
  bluer, flatter and lose their outline. Near things are darker, more detailed, outlined.

## 5. Architecture and objects

Ware draws the built world as a draftsman would: Chicago greystones, brick two-flats,
bungalows, schools, El tracks and steel bridges, alleys, fences, power poles.

- Every window is fully specified: frame, sash, mullions, sill, lintel. Glass is dark (near
  black or slate) with a single lighter diagonal or horizontal reflection bar, or flat warm
  yellow if lit at night. → `window()`
- Materials are explicit and patterned: brick coursing in thin lines (`bricks()`), stone
  courses (`stone_courses()`), clapboard lines, board fences (`fence()`), riveted steel
  (`rivet_row()`), carved cornices, keystones, dentils.
- Ornament is drawn, not suggested (the carved cornice, the stone garland).
- Buildings sit on a ground line with a sidewalk strip, a curb and litter specks.
- Objects are drawn by their essential parts, in elevation or straight down: a watch (band,
  case, crown, face), keys (ring, bow, teeth), a traffic light (housing, three lenses, visor).
- **Wear and time** are part of the drawing: boarded windows, missing shingles, rust
  running *straight down* from fixtures (`rust_streaks()`), stains, a parking boot on a tire,
  litter in the gutter, a face mask on the pavement.
- Cutaways: buildings opened like dollhouses to show rooms, each room a small
  elevation-view interior.

## 6. Detail

Dense but schematic. Detail is distributed by *meaning*: the thing the story is about gets
the most (the keys, the note, the flowers); the rest stays quiet. The detail is inventory-like:
labels on bottles (QUIK DIP, Floralife), a sticky note with a handwritten list, a sign
("BEAUTY"), a $1.00 price card, a CAUTION WET FLOOR stand.

Atmospheric detail that should almost always be present:
- specks on dark floors and pavement (`speckle_floor()`), litter on sidewalks (`litter()`)
- grain on skies (`grain_rect()`)
- snowflakes as stipple; rain as fine pale diagonal hairlines
- birds on wires; power lines; a single leaf

Avoid noise for its own sake. If a detail doesn't describe a material, a use, a time or a
person, cut it.

## 7. Composition (the page as a diagram)

- **Panel grids**: rectangles with white gutters and thick black borders (or borderless
  tiles on white, in poster mode). Panel sizes vary: a big establishing panel plus strips of
  small panels. → `panel()`, `grid()`
- **Time sequences**: the same viewpoint repeated as the season, weather or hour changes (a
  house through decades; a bird arriving and leaving across three small panels with
  changing background colors).
- **Zoom sequences**: a strip that moves from far to near (or the reverse), sometimes linked
  by small circles: a snowflake → house → window → face.
- **Insets and links**: circles holding a memory, thought or detail, joined by thin straight
  lines to the window or object they belong to; a junction dot where lines branch; a ring
  around the target. Arrows point from one panel to another. → `inset_circle()`, `link()`,
  `arrow()`
- **Quiet vs dense**: big empty areas (sky, an empty lot, a blank wall) set against dense
  clusters of detail. Covers are often centrally symmetric.
- **Balloons** are small rectangles with a squiggly tail for voices from off-panel.
  → `balloon()`

## 8. Scale

- People are small against architecture.
- Extreme scale jumps between neighboring panels: a skyscraper beside a snowflake, an aerial
  neighborhood beside one window, a whole panel for a key or a lipstick.
- A scale jump is emphasis: give the emotionally important small object a big panel.
- Within one image, keep real-world proportions exact (door heights, window sizes, car
  lengths). The precision is what makes the small human moments land.

## 9. Figures (summary)

Plain and stiff. Small round or oval heads, dot eyes, a short nose line or bump, minimal or
no mouth, hair as one flat mass. Bodies upright, weight on both feet, arms close to the
body. Clothes as flat color with one or two seam or fold lines. Hands as compact mitten
shapes with a line or two for fingers. Often seen from behind (kids at their screens) or in
strict profile. Expression comes from posture and situation, not faces. Full guide:
figures.md.

## 10. Mood and subject

Ordinary moments, routine, weather, loneliness, memory, the passage of time. Rooms at night
with one lamp; a person alone in a crowd; a building outliving its tenants. For games
(including dark fantasy): carry the same restraint. An item can tell a story with a label,
a mend, a stain; a ruin can show who lived there by what they left behind.

## 11. Translating the style into game assets

| Ware device | game use |
|---|---|
| elevation drawing | side-scroller environments, building facades, props, vehicles |
| value-and-outline depth | parallax layers (far: flat, no outline, light; near: dark, detailed) |
| panel grid with gutters | inventory grids, shop boards, UI layout, menus |
| inset circle + link line | tooltips, item detail callouts, status explanations |
| time / zoom sequences | animation frames, cutscenes, level intros, transitions |
| SFX lettering | hit feedback, ability procs, ambient sound cues |
| diagrams, arrows, ticks | stat displays, cooldown clocks, combo explanations |
| scene palettes keyed to time/weather | biome/level palettes, day–night variants |
| cutaway building | base-building screens, hub interiors, level-select |
| wear and inventory detail | loot flavor, rarity through use rather than glow |

Game-specific adaptations Ware never needed:
- **Silhouette on any ground**: sprites must read on light AND dark backgrounds. Keep the
  darkest large fills at value ≥ ~0.3 so the outline still separates them; check with
  `review_sheet.py --grounds paper,dark`.
- **One line-weight table for the whole game**, set by on-screen size.
- **Tileable layers** (`wrap_x()`), consistent frame canvases and anchors for animation.

## 12. Originality and attribution

The style (a way of drawing) is fair to learn and use. Specific works are not to be copied:
- never reproduce a specific Ware cover, page, panel layout or composition
- never draw his characters (e.g., Jimmy Corrigan, Rusty Brown, the Building Stories cast) or
  his logos and mastheads (the ACME Novelty Library marks)
- never sign assets with his initials or name, or describe output as "by Chris Ware";
  "in the style of" or "Ware-inspired" is the honest description
- invent subjects, layouts and characters for each game
