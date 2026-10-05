"""itemart.py - every cargo item's picture, drawn with the ware-style-assets skill.

Each item is drawn as the real object (see tools/ware/item-notes.md for what each should look like and why),
side-on or face-on, flat colour by material, ink outlines. Size 1 items are square (40 x 40 game units),
size 2 items 64 x 40 and size 3 items 88 x 40, so long things keep their real proportions. Drawn at 2x and halved.
Writes play/js/itemart.js (ITEMART, generated: don't edit; run `py tools/ware/itemart.py`; the drawings are in items_draw.py) and a review sheet
tools/ware/out/items.svg (every item on its type's colour, on paper and on the dark Diamond tile).
"""
import sys, json, math, random, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "scripts"))
from ware import *

# line weights in drawing units (an icon is 80 units tall and shows about 30-50 px tall)
OL, DT, HR = 3.0, 1.7, 1.0
H = 80
WID = {1: 80, 2: 128, 3: 176}

# materials (muted, period)
M = dict(
    steel="#c9cfd2", steel2="#9fa8ad", iron="#4f555b", iron2="#3a3f44", brass="#cfa75a", brass2="#a9843f",
    gold="#e2b04a", copper="#b8754a", copper2="#8f5a3a", wood="#a87b52", wood2="#86603e", oak="#93704a",
    dark="#5b4433", leather="#7a4e34", leather2="#5e3b27", rope="#cdb88c", rope2="#a8936a", canvas="#efe7d3",
    canvas2="#d8ccb0", tar="#2c2826", red="#b5533c", red2="#8f3e2c", blue="#3f5f7d", green="#5f7a4f",
    meat="#c9786a", fat="#f0dcc6", bone="#efe6cf", glass="#a9c3bb", glass2="#7f9f95", jade="#6f9e83",
    porcelain="#eef0ec", clay="#9a5a3e", clay2="#7a4430", lacquer="#8e2f26", black="#2a2624", paper="#f3ead6",
    fire="#e58a2e", fire2="#f6cf5f", smoke="#b8b2aa", sea="#6f8f98", lime="#b9c55e", fish="#a9b8bb", fish2="#87989c",
    venom="#7a4a6e", cream="#efe6cf", oak2="#7a5c3c", mush="#c9b9d6", flesh="#e6b8a2", jelly="#d9c7e2",
)
ART = {}

def item(key, size=1):
    def deco(fn):
        ART[key] = (size, fn)
        return fn
    return deco

# ---------------------------------------------------------------- small helpers
def F(v): return f"{v:.1f}".rstrip("0").rstrip(".")

def P(pts, fill, sw=OL, stroke=INK, close=True):
    return poly(pts, fill, stroke, sw, close=close)

def blade(x0, y0, x1, y1, w0, w1, fill=None, back=True, curve=0):
    """a blade from (x0,y0) hilt end to (x1,y1) tip; w0 width at the base, w1 near the tip; curve bows the edge"""
    fill = fill or M["steel"]
    a = math.atan2(y1 - y0, x1 - x0); nx, ny = -math.sin(a), math.cos(a)
    L = math.hypot(x1 - x0, y1 - y0)
    pts_top, pts_bot = [], []
    for i in range(11):
        t = i / 10; x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        w = (w0 + (w1 - w0) * t) * (1 - t ** 6)
        bow = curve * math.sin(math.pi * t) * L * .06
        pts_top.append((x + nx * (w / 2 + bow), y + ny * (w / 2 + bow)))
        pts_bot.append((x - nx * (w / 2 - bow), y - ny * (w / 2 - bow)))
    shape = pts_top + pts_bot[::-1]
    s = P(shape, fill, 0, None)
    s += P(pts_bot[:-1] + [(x1, y1)] + [(x0, y0)], shade(fill, .18), 0, None) if back else ""
    s += line(x0 + nx * w0 * .1, y0 + ny * w0 * .1, x0 + (x1 - x0) * .85, y0 + (y1 - y0) * .85, "#ffffff", 1.2, op=.6)
    s += P(shape, "none", OL)
    return s

def grip(x0, y0, x1, y1, w, fill=None, wraps=4):
    fill = fill or M["leather"]
    a = math.atan2(y1 - y0, x1 - x0); nx, ny = -math.sin(a), math.cos(a)
    pts = [(x0 + nx * w / 2, y0 + ny * w / 2), (x1 + nx * w / 2, y1 + ny * w / 2), (x1 - nx * w / 2, y1 - ny * w / 2), (x0 - nx * w / 2, y0 - ny * w / 2)]
    s = P(pts, fill, 0, None)
    for i in range(1, wraps + 1):
        t = i / (wraps + 1); x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        s += line(x + nx * w / 2, y + ny * w / 2, x - nx * w / 2 + (x1 - x0) * .06, y - ny * w / 2 + (y1 - y0) * .06, INK, HR)
    s += P(pts, "none", OL)
    return s

def tube(d, color, width, sw=OL):
    return path(d, "none", INK, width + 2 * sw) + path(d, "none", color, width)

def stave_barrel(cx, by, w, h, wood=None, hoops=(.15, .85), hoopc=None):
    """a barrel standing, side view, bottom at by"""
    wood = wood or M["wood"]; hoopc = hoopc or M["iron"]
    x0, x1, top = cx - w / 2, cx + w / 2, by - h
    bulge = w * .1
    d = f"M{x0} {by} C{x0-bulge} {by-h*.35} {x0-bulge} {top+h*.35} {x0} {top} H{x1} C{x1+bulge} {top+h*.35} {x1+bulge} {by-h*.35} {x1} {by} Z"
    s = path(d, wood, None)
    s += path(f"M{cx+w*.18} {by} C{cx+w*.22} {by-h*.35} {cx+w*.22} {top+h*.35} {cx+w*.18} {top} H{x1} C{x1+bulge} {top+h*.35} {x1+bulge} {by-h*.35} {x1} {by} Z", shade(wood, .2), None)
    for f_ in (-.25, 0, .25):
        xx = cx + w * f_
        s += path(f"M{xx} {by} C{xx+w*f_*.15} {by-h*.4} {xx+w*f_*.15} {top+h*.4} {xx} {top}", "none", INK, HR)
    for hp in hoops:
        y = top + h * hp
        s += line(x0 - bulge * .55, y, x1 + bulge * .55, y, INK, 6.2) + line(x0 - bulge * .55, y, x1 + bulge * .55, y, hoopc, 3.4)
    s += path(d, "none", INK, OL)
    return s

def ellipse_top(cx, cy, rx, ry, fill, sw=OL):
    return ell(cx, cy, rx, ry, fill, INK, sw)

def rot_pts(pts, cx, cy, deg):
    a = math.radians(deg); c, s_ = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * c - (y - cy) * s_, cy + (x - cx) * s_ + (y - cy) * c) for x, y in pts]

def R(content, deg, cx, cy):
    return f'<g transform="rotate({deg} {cx} {cy})">{content}</g>'

def rope_line(d, w=4.4, col=None):
    """a laid hemp rope along a path: an outlined tube with the lay ticked across it"""
    col = col or M["rope"]
    return path(d, "none", INK, w + 2 * DT) + path(d, "none", col, w) + path(d, "none", M["rope2"], w * .45, extra=f'stroke-dasharray="1.6 {w*.9:.1f}"')

def coin(x, y, r=5):
    return circ(x, y, r, M["gold"], INK, DT) + circ(x - r * .25, y - r * .25, r * .35, "#f4d58a", None)

def flint_lock(x, y, k=1.0):
    """a flintlock seen from the lock side at (x,y) = the pan: the cock with its flint, the frizzen, the pan"""
    s = path(f"M{x-14*k} {y+3*k} L{x+6*k} {y+3*k} L{x+8*k} {y+7*k} L{x-12*k} {y+7*k} Z", M["iron"], INK, DT)     # lock plate
    s += P([(x - 2 * k, y), (x + 6 * k, y), (x + 6 * k, y + 3 * k), (x - 2 * k, y + 3 * k)], M["iron2"], DT)        # pan
    s += path(f"M{x+4*k} {y} L{x+6*k} {y-12*k} L{x+9*k} {y-12*k} L{x+7*k} {y}", M["steel2"], INK, DT)             # frizzen
    s += path(f"M{x-10*k} {y+3*k} Q{x-14*k} {y-6*k} {x-6*k} {y-12*k} L{x-1*k} {y-13*k} L{x-1*k} {y-8*k} L{x-5*k} {y-7*k} Q{x-8*k} {y-3*k} {x-6*k} {y+3*k} Z", M["iron"], INK, DT)   # cock
    s += P([(x - 1 * k, y - 13 * k), (x + 3 * k, y - 12 * k), (x + 2 * k, y - 9 * k), (x - 1 * k, y - 9 * k)], "#cfcab8", HR)   # the flint
    return s

# ---------------------------------------------------------------- build
def build():
    out = {}
    for key, (size, fn) in ART.items():
        reset()
        s = fn()
        assert not DEFS, f"{key}: no gradients or clips in icons"
        out[key] = dict(w=WID[size] // 2, s=f'<g transform="scale(.5)">{s}</g>')
    js = ("/* Golden Shore: every cargo item's picture, drawn with the ware-style-assets skill (tools/ware/itemart.py).\n"
          "   GENERATED: don't edit; change itemart.py and run `py tools/ware/itemart.py`. */\n"
          '"use strict";\nconst ITEMART=' + json.dumps(out, separators=(",", ":")) + ";\n")
    (HERE.parent.parent / "play" / "js" / "itemart.js").write_text(js, encoding="utf-8")
    sheet(out)
    print(f"wrote play/js/itemart.js ({len(js)//1024} KB, {len(out)} items) and tools/ware/out/items.svg")

TYPEC = dict(W="#EFCDBF", C="#DAD5CC", X="#F6D8B4", V="#E2CEDC", F="#F3E3AE", A="#CCDCEA", R="#CFE5DC", T="#E6D7C3", K="#F2DACB")
def sheet(out):
    meta = json.loads((HERE / "items_meta.json").read_text()) if (HERE / "items_meta.json").exists() else {}
    cells, x, y, rowh = "", 10, 10, 0
    for key, a in out.items():
        w = a["w"] * 2.2
        if x + w + 10 > 1400: x, y = 10, y + rowh + 26; rowh = 0
        bg = TYPEC.get((meta.get(key, {}).get("kind") or "T"), "#E6D7C3")
        for j, b in enumerate((bg, "#1f1c1d")):
            yy = y + j * (40 * 2.2 + 8)
            cells += f'<rect x="{x-4}" y="{yy-4}" width="{w+8}" height="{40*2.2+8}" rx="8" fill="{b}" stroke="#1f1c1d" stroke-width="1.5"/>'
            cells += f'<g transform="translate({x} {yy}) scale(2.2)">{a["s"]}</g>'
        cells += f'<text x="{x}" y="{y + 2*(40*2.2+8) + 10}" font-size="11" font-family="sans-serif">{key}</text>'
        rowh = max(rowh, 2 * (40 * 2.2 + 8) + 14); x += w + 18
    hgt = y + rowh + 30
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 {hgt}" width="1400" height="{hgt}"><rect width="1400" height="{hgt}" fill="#f3ead6"/>{cells}</svg>'
    (HERE / "out").mkdir(exist_ok=True)
    save(svg, HERE / "out" / "items.svg")

# ================================================================ the items
# (drawn in 80-unit-tall boxes: 80 x 80, 128 x 80 or 176 x 80; keep a few units clear of the edges)

if __name__ == "__main__":
    import runpy   # the drawings live in items_draw.py, which registers them with @item and builds
    runpy.run_path(str(HERE / "items_draw.py"), run_name="__main__")
