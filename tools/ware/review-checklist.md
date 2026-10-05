# Review Checklist

Never deliver an asset you haven't looked at. The loop, every time:

1. **Render full size**: `render(svg, "x.png", 2)` and view it.
2. **Render crops at 2–3x** of the busiest areas:
   `python scripts/render.py x.svg --crop 300,200,400,250 --scale 3 --out x.crop.png`
3. **Review sheet** for sprites/icons on light, mid and dark grounds:
   `python scripts/review_sheet.py ware_out/*.svg --out ware_out/review.png`
4. **Audit numbers**: `python scripts/render.py x.svg --audit`
5. Walk the checklist below, fix, repeat. Two or three passes is normal.
6. Show the designer the review sheet (not code), and ask one specific question if needed.

## Checklist

**Line**
- [ ] One outline weight for forms, thinner detail and hair weights; borders thicker
- [ ] No hatching or texture strokes used for shading
- [ ] Far background has no outline; skies, light and reflections have none
- [ ] Overlapping body parts show no internal seam (use `union_outline`)
- [ ] Scaled groups haven't thinned or thickened lines unintentionally

**Color**
- [ ] Audit median saturation 0.10–0.40 (dark fantasy ≥ ~0.08), p90 ≤ ~0.58
- [ ] One accent family, small in area
- [ ] Shade planes are hard-edged, same hue, darker and cooler; no grey overlays
- [ ] At least one near-black shape in scenes (doorway, shadow side, night window)
- [ ] Gradients only in sky/light, with grain on top
- [ ] No pure #000; no glow, bloom, blur or drop shadow

**Form and view**
- [ ] Elevation / straight-on / straight-down / axonometric, never a dramatic angle
- [ ] Real proportions (doors, windows, people, vehicles agree with each other)
- [ ] Construction is complete (windows have sills, frames have joints)

**Detail and story**
- [ ] The most important element is unobstructed and has the most detail
- [ ] There is at least one sign of use, time or a person (wear, label, litter, a note)
- [ ] Nothing decorative that doesn't describe material, use, time or a person

**Game readiness**
- [ ] Silhouette reads on light and dark grounds; reads at 50% size
- [ ] Frames share canvas size and anchor; no sliding feet; seeds fixed
- [ ] Tiled layers show no seam in a scrolled preview
- [ ] File size reasonable (< ~250 KB per SVG); no `<style>`, `<filter>`, `<image>`, `<text>`
- [ ] Text is lettered as paths and spelled right; no text collides with objects

## Known failure modes (seen in practice) and fixes

| looks like | cause | fix |
|---|---|---|
| a row of teeth / lace along a waterline or ground edge | long regular serrated strip with big amplitude | broken short dashes (`foam_dashes`) or `serrated_top` with amp ≤ 1.6 and tooth ≥ 7 |
| a caterpillar trailing behind a ship | chain of outlined serrated blobs | flat paler band (no outline) + scattered short foam dashes; 2–4 blobs only at the source |
| a grey flag instead of smoke | one outlined ribbon polygon | overlapping flat circles, no outline, group opacity (`smoke()`) |
| a moon with a visible blue disk | disk covered by a sky-colored disk over a gradient | `crescent()` path |
| a big moon/sun behind a lantern | glow disk too large/opaque | radius ≤ 0.7× object height, opacity 0.12–0.18 |
| a sword that reads as a rifle | long, horizontal, thin dark shape at sprite size | shorter, angled 35–45° down-back, visible hilt/guard |
| an emblem that reads as a letter (φ) | circle + vertical line | choose a shape that isn't a glyph (cross, key, shell) |
| broom-like tree tips | too many short twigs at the same depth | wider `spread`, longer branch ratios, fewer levels on small trees |
| a sprite disappearing on dark ground | trousers/boots/cloak near black | lift dark fills to value ≥ ~0.3; keep INK outline |
| crouching idle pose | hip too low for leg length | hip height ≈ L1 + L2 + ankle − 1 for standing |
| a flame/focal point hidden | frame bar or post crossing it | move or remove the bar; focal element unobstructed |
| a door overlapping a porthole | repeated elements placed without checking other features | skip the repeated item where a feature sits, or shift the feature |
| numbers colliding with an anchor | label positions hard-coded | position labels relative to geometry (e.g. `stem(y) - 7`) |
| confusing handwriting | strike-through plus a superscript word | plain line of text; one clear story beat |
| a scene that looks digital | gradients without grain, pure colors, no specks | `grain_rect`, `speckle_floor`, `litter` |
| a timid, washed-out scene | no near-black masses | add a deep-shadow side plane or dark doorway |
| a cropped tower or head | element taller than the canvas | check the max height against canvas top before rendering |
| a visible tile seam | object crossing the edge not wrapped | wrap the edge-crossing pieces with `wrap_x()`; check in a scrolled preview |
| a background layer over 250 KB | `wrap_x()` applied to the whole layer (3 copies of every tree and stone) | wrap only edge pieces; lower stipple density; or ship that layer as PNG |
