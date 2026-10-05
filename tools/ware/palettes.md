# Palettes

All palettes live in `ware.PAL` as dicts of role → hex. The first six were *measured* from
the reference illustrations (median of 7×7 pixel patches); the rest are built with the same
rules. Use a palette as the starting point for a scene, biome or item family. Don't mix
two palettes in one scene except to introduce a single accent.

## Rules (from the measurements)

1. **Saturation budget.** Median saturation of the finished asset 0.10–0.40 (aim ~0.2).
   Large areas (sky, walls, ground) live at 0.05–0.35. Run `render.py --audit`.
2. **One accent family**, fully saturated, covering ≤5% of a scene (≤~15% of a single icon):
   bus yellow, robin red-orange, lit-window yellow, zinnia red, a red cardigan. In dark
   fantasy: ember orange or candle yellow, *or* blood red, never both as big areas.
3. **Four value groups**: light (sky, lit walls, paper), mid (most surfaces), dark (shade
   planes, far fills at night), near-black (deep shadow, doorways, night windows, lines).
   If a scene has no near-black shapes besides lines, add one (a dark doorway, the shadow
   side of a building).
4. **Temperature of the hour.** Every color leans toward the scene's light: peach dusk warms
   the walls; blue snow evening cools everything except the lit windows; rain greys
   everything and makes the reds pop.
5. **Shade = same hue, darker, slightly cooler** (`shade(c, 0.18)`); **rim/lit = lighter,
   slightly warmer** (`tint(c, 0.2)`). Never shade with grey or black overlays.
6. **Foliage rim**: crowns get a lighter band on the sun side: `#9eb49a` body /
   `#a4c141` rim (summer), `#d9952f` body / `#ffda1f` rim (autumn). Rims are allowed to be
   saturated; they count toward the accent budget.

## Measured palettes

| palette | roles (hex) | source mood |
|---|---|---|
| `chicago_afternoon` | sky #8cb7b8, sky_pale #c7d9d7, wall #b58b91, wall_shade #a97f74, trim #d5cba9, far #7a8984, ground #d3d8d6, fence #706d65, leaf #9eb49a, leaf_rim #a4c141, accent #e0603f, deep #151510 | mauve greystone, teal sky, summer tree |
| `dusk_peach` | sky #f6a479, sky_pale #ffe3a2, wall #b58b91, far #aa8d89, ground #5d504f, leaf #a6ce3a, accent #257aa3, deep #35302e | cream/peach sky, blue car accent |
| `snow_evening` | sky #8cb9cc, snow #afd4e3, snow_hi #cfe4ec, wall #9b7d82, roof #67656a, cloud #f2b8b0, lit #f5d36f, trunk #6b4f45, deep #3b393b | everything blue except warm windows and a pink cloud strip |
| `school_morning` | sky #fddea2, brick #9e6a47, stone #ada89e, ochre #cf9c5c, glass #373639, slate #617080, accent #f6ca00, leaf #af684c, deep #242527 | cream morning, brick, yellow bus |
| `winter_city` | sky #c9dae2, sky_hi #e9eded, steel #6a8191, slate #3c4452, stone #9faaac, brick #825f5f, grey #988f8b, deep #242527 | pale grey-blue city, low saturation (median 0.11) |
| `rain_shop` | rain #b3c7d0, wall #534e4c, green #4f754c, leaf #6b8f77, leaf_hi #adcaab, accent #f05a5a, accent2 #ee4d84, warn #ffe68f, deep #151515 | grey rain, greenhouse greens, flowers as the only chroma |

## Built palettes

| palette | roles | use for |
|---|---|---|
| `sea_dusk` | sky_top, sky_mid, sky_low, horizon, cloud, sea, sea_deep, dash, hull, cream, buff, ochre, lit, foam | maritime, harbors, coasts at dusk (Cora Lee exemplar) |
| `night` | sky_top #1d2c3a, sky_low #3b5465, sea #16232c, dash, star, moon, lit #ffd77a, wall #6a7079 | any night exterior; lit windows become the accent |
| `interior_night` | wall #bcc3b1, wall_shade, wood #8f6d4c, floor #3a3633, lamp #fff1b4, fabric #7e9cb2, skin #e4b48e, hair #3a2d27 | rooms, cabins, shops at night |
| `ashen` | sky #7f939c, sky_pale #c4c6b2, fog, far #66767d, stone #8f887c, stone_shade, bone #d9cfb8, soot #2a2826, rust #8a4a32, moss #6d7a55, cloth, blood #6e2b2a, ember #e08a3c, candle #f2c66b, deep #1a1817 | souls-like overworld: ruins, roads, graveyards, ash plains |
| `ember_crypt` | wall #4a3f3a, stone #7a6e64, bone #d6c8a8, brass #b08a4a, ember #e3893a, glow #f6c76a, smoke, deep #141110 | catacombs, forges, candlelit interiors |
| `pale_cathedral` | sky #c7cdc9, stone #b9b2a2, stone_shade #968f80, glass_red #8e3b35, glass_blue #3f5f7d, gold #c9a35a, moss, deep | holy sites, white stone, stained glass accents |
| `bog_dusk` | sky #9a8f86, sky_low #d0a785, water #4d5a52, reed #7a7448, mud #4a3d33, lantern #f0c060, rot #5d6a3e, deep #171612 | swamps, rot, marsh villages |

The ashen palettes run greyer than Ware's median on purpose (souls-like mood), but stay
above ~0.10 overall. If the audit reads below 0.08, warm the horizon or ground, or add
a moss/rust family.

## Building a new palette (step by step)

1. Name the **hour and weather** (e.g., "overcast noon, autumn", "torchlit crypt").
2. Pick the **sky/ambient pair** (top and horizon). This sets the temperature.
3. Pick **3–4 surface colors** for the main materials, each pulled toward the ambient
   (`mix(material, ambient, 0.15–0.3)`), saturation 0.08–0.35.
4. Derive **shade** for each with `shade()`; pick one **deep** near-black with a slight hue.
5. Pick **one accent** (saturation 0.7–1.0) that means something: light, danger, life, loot.
6. Pick **skin/cloth** if figures appear (skin stays warm and fairly light; cloth muted).
7. Render a quick swatch strip and a test scene, run `--audit`, adjust.

```python
from ware import *
amb = "#c4c6b2"
stone = mix("#8f887c", amb, 0.2); stone_sh = shade(stone)
PAL["my_biome"] = dict(sky="#7f939c", sky_pale=amb, stone=stone, stone_shade=stone_sh,
                       wood=mix("#7a5c44", amb, 0.15), deep="#1b1917", accent="#e08a3c")
```

## Day → night conversion

- multiply surfaces toward the night sky: `mix(c, "#22313d", 0.55–0.7)`
- windows, lamps, fires become the accent (`lit`), with flat light shapes spilling out
- add stars (`stars()`) and a crescent (`crescent()`), never a disk-over-disk moon
- keep the outline; lines stay INK even at night
- reflections of lights on water: `reflection_column()`

## Rarity and state colors in UI (game adaptation)

Ware never color-codes, so keep rarity subtle: a colored **band or tag** (`rect` tag with
condensed caps), never a glowing border. Suggested muted set: common `#8d8a83`, uncommon
`#6d7a55`, rare `#3f5f7d`, epic `#7a4a6e`, legendary `#c9a35a`. Damage numbers: INK or
paper-white lettering; crits in the scene's accent.
