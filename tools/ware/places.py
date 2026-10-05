"""places.py - places up close (isles and wrecks), drawn with the ware-style-assets skill.

Drawn at 800 x 500 with the line weights of the skill's Cora Lee exemplar (outline 1.9, detail 1.1,
hair 0.7), then shrunk by half into the game's 400 x 250 scene, so lines land fine on a phone and
crisp on a big screen. Waterline y=412 here (206 in the game). For each variant this writes:
  base   the place: far shore, its reflection, the place itself, foam, your rowboat
  over   overlays the game shows once a spot is used (pennant, theodolite, dug chest, lamp lit,
         open hatches, lit cabin), plus 'x' (the dig mark before digging)
  spots  where the tap spots sit (game units)
  name   where the ship's name is painted (the game letters it, since it changes per voyage)
and one shared FRAME (sky, sun, clouds, sea) every place sits in, so they all share the same day.
Bundled into play/js/placeart.js (generated: don't edit by hand; run this script).

Run:   py tools/ware/places.py                 (writes tools/ware/out/*.svg and play/js/placeart.js)
Look:  node tools/ware/review.mjs              (all variants on one sheet: tools/ware/out/review.png)
       node tools/ware/shot.mjs a.svg a.png 3 x,y,w,h   (a zoomed crop, for checking detail)

Animated parts carry the game's stepped-animation classes (st-foam, st-sway, st-smoke, st-steam,
st-flap, st-bob, st-crab, st-beam); styles.css moves them.
"""
import sys, json, math, random, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from ware import *

# ---- palette: "golden shore, fair afternoon" (palettes.md: an ambient pair, materials pulled toward
# it, shade() for side planes, one deep, one accent family: brick red, and lamp yellow only when lit)
AMB = "#efdcb8"
P = dict(
    sky_top="#86a9b4", sky_mid="#b2c4be", sky_low="#e8d6b0", sky_hz="#f0cf9c",
    cloud="#f5ead4", cloud2="#e7c7a2", sun="#f5dc9a",
    far="#b6c6c1", far2="#a3b6b3", far3="#c9d2c7",
    sea_hz="#8eabaf", sea_lo="#4e6f79", dash="#b7cdcf", glint="#f2dcae", refl="#3a565e",
    sand=mix("#e4cf9c", AMB, .15), sand_wet="#bfa377", bsand="#4f4a46", earth="#a07d58",
    hill=mix("#9cad7d", AMB, .15), grass_rim="#c4c66a",
    rock=mix("#b3a899", AMB, .12), ash="#6b6460", basalt="#4c4a4c",
    leaf="#83a062", leaf2="#6a8551", leaf_rim="#b9c55e", trunk="#8f6d4e",
    wood="#a87b52", hull="#7b4d3b", hull_old="#6c695c", wale="#2e2a29",
    copper="#7f9f8f", copper2="#93b3a1",
    wall="#ebe1ca", roof="#5f6e7a", stone="#d2c8b7", cream="#ebe2cb", white="#f5f0e4", foam="#f6f1e6",
    brick="#c0503a", lamp="#f6cf5f", deep="#252220", glass="#3b4b55", glass_hi="#6a8290",
    weed="#5f7150", iron="#59636b", seal="#6a717a", coin="#e2b04a", rust="#7b5444", tarp="#7a846e",
)
WW, HH = 800, 500           # drawing size; the game shows it at half
HZ, SB = 236, 412           # horizon, waterline
O, D, Hh = 1.9, 1.1, 0.7    # outline, detail, hair
SUNX = 120
CLS = lambda c, s: f'<g class="{c}">{s}</g>'
def F(v): return f"{v:.1f}".rstrip("0").rstrip(".")

def rects_path(rs, color, op=None):
    """many little flat rects (dashes, dots) as one path"""
    if not rs: return ""
    d = "".join(f"M{F(x)} {F(y)}h{F(w)}v{F(h)}h{F(-w)}z" for x, y, w, h in rs)
    return f'<path d="{d}" fill="{color}"' + (f' opacity="{op}"' if op else "") + "/>"

# ================================================================ the shared frame: sky and sea
def frame():
    reset()
    r = random.Random(5)
    o = rect(0, 0, WW, HZ + 2, lingrad([(0, P["sky_top"]), (.45, P["sky_mid"]), (.84, P["sky_low"]), (1, P["sky_hz"])]), None)
    o += stipple(0, 0, WW, HZ, 520, "#f6e5c8", 1.4, .55, lambda u, v: v ** 2.2, seed=3)
    o += stipple(0, 0, WW, HZ, 300, "#62808c", 1.4, .45, lambda u, v: (1 - v) ** 3, seed=4)
    o += circ(SUNX, 74, 24, P["sun"], None)                               # a pale sun: no outline, no glow
    def cloud(x0, x1, yb, hgt, col, seed):
        rr = random.Random(seed); d = f"M{x0} {yb}"; x = x0
        while x < x1:
            st = rr.uniform(26, 60)
            d += f" Q{F(x + st/2)} {F(yb - hgt - rr.uniform(0, hgt*.8))} {F(min(x + st, x1))} {F(yb - hgt*.35)}"; x += st
        return path(d + f" L{x1} {yb} Z", col, None)
    o += cloud(170, 470, 132, 6, P["cloud"], 1) + cloud(250, 400, 120, 4, P["cloud"], 7)
    o += cloud(520, 820, 168, 6, P["cloud2"], 2) + cloud(-20, 150, 196, 5, P["cloud2"], 5)
    o += rect(0, HZ - 5, WW, 5, "#f3d7a8", None, op=.7)                    # the band of light on the horizon
    o += rect(0, HZ, WW, HH - HZ, lingrad([(0, P["sea_hz"]), (1, P["sea_lo"])]), None)
    # wave marks: rows that grow longer, thicker and further apart toward you (Ware's perspective
    # without vanishing lines); warm glints under the sun near the horizon
    dash, glint = [], []
    k, y = 0, HZ + 3.0
    while y < HH + 10:
        n = int(30 - (y - HZ) * .07) + 6
        th = .8 + (y - HZ) * .012
        for _ in range(n):
            x = r.uniform(-20, WW + 20)
            L = 4 + (y - HZ) * .2 * r.uniform(.5, 1.4)
            near = abs(x - SUNX) < 90 - (y - HZ) * .6
            (glint if near and r.random() < .85 else dash).append((x, y, L, th))
        k += 1; y = HZ + 3 * (1.16 ** k)
    o += rects_path(dash, P["dash"], .75) + rects_path(glint, P["glint"], .85)
    return o

# ================================================================ shared pieces
def far_shore(seed):
    """the far shore: two flat silhouettes, no outline, palest; a far house and a far sail"""
    r = random.Random(seed)
    a = r.uniform(80, 200); b = r.uniform(560, 660)
    o = path(f"M{F(a-190)} {HZ} Q{F(a-120)} {HZ-22} {F(a-40)} {HZ-14} Q{F(a+20)} {HZ-30} {F(a+90)} {HZ-12} Q{F(a+140)} {HZ-6} {F(a+190)} {HZ} Z", P["far"], None)
    o += path(f"M{F(b-120)} {HZ} Q{F(b-60)} {HZ-34} {F(b+10)} {HZ-26} Q{F(b+80)} {HZ-40} {F(b+150)} {HZ-18} Q{F(b+220)} {HZ-12} {F(b+260)} {HZ} Z", P["far2"], None)
    o += path(f"M{F(b-40)} {HZ} Q{F(b+30)} {HZ-14} {F(b+120)} {HZ-8} L{F(b+140)} {HZ} Z", P["far3"], None)
    hx = b + 36                                                            # a far cottage on the ridge
    o += rect(hx, HZ - 34, 7, 6, shade(P["far2"], .12), None) + poly([(hx - 1, HZ - 34), (hx + 3.5, HZ - 38), (hx + 8, HZ - 34)], shade(P["far2"], .12), None)
    sx = r.uniform(300, 460)                                               # a far sail
    o += poly([(sx, HZ - 2), (sx + 3, HZ - 15), (sx + 6, HZ - 2)], shade(P["far"], .1), None) + rect(sx - 2, HZ - 2, 10, 1.6, shade(P["far"], .1), None)
    o += line(0, HZ, WW, HZ, INK, 1.4)
    return o

def far_gulls(seed, n=3):
    r = random.Random(seed); o = ""
    for _ in range(n):
        x, y, s = r.uniform(260, 760), r.uniform(60, 180), r.uniform(.7, 1.2)
        o += path(f"M{F(x-5*s)} {F(y)} q{F(2.5*s)} {F(-3*s)} {F(5*s)} 0 q{F(2.5*s)} {F(-3*s)} {F(5*s)} 0", "none", INK, Hh)
    return o

def reflection(x0, x1, depth, seed, stripes=(), op=.8):
    """Cora Lee's reflection: a dark band under the place with a wavy lower edge, then a few broken
    stripes of the place's own colours in it"""
    r = random.Random(seed)
    pts = [(x0, SB)] + [(x, SB + depth + 5 * math.sin(x * .09 + seed) + 3 * math.sin(x * .23)) for x in range(int(x0), int(x1), 10)] + [(x1, SB)]
    o = poly(pts, P["refl"], None, op=op)
    rs = {}
    for col, a, b in stripes:
        for i in range(7):
            yy = SB + 4 + i * (depth / 8)
            xa = r.uniform(a, (a + b) / 2); w = r.uniform(12, (b - a) * .5)
            rs.setdefault(col, []).append((xa, yy, w, 1.8))
    for col, lst in rs.items():
        o += rects_path(lst, col, .45)
    return o

def foam_line(x0, x1, y, seed, skip=()):
    """waterline foam as broken short dashes"""
    r = random.Random(seed); rs = []; x = x0
    while x < x1:
        L = r.uniform(8, 34)
        if not any(a < x < b for a, b in skip): rs.append((x, y + r.uniform(-1, 1.5), L * .6, 1.8))
        x += L + r.uniform(4, 20)
    return CLS("st-foam", rects_path(rs, P["foam"], .95))

def foam_blobs(spots, seed):
    """bubbly foam where things meet the water: little serrated blobs with an ink edge"""
    o = ""
    for i, (x, y, rx, ry) in enumerate(spots):
        o += path(serrated_blob(x, y, rx, ry, max(10, int(rx * 1.1)), .16, seed + i, .08), P["foam"], INK, D)
    return o

def rust(x, y, n, L, spread, seed, op=.7, col=None):
    r = random.Random(seed); o = ""
    for i in range(n):
        sx = x + (i - (n - 1) / 2) * spread + r.uniform(-1, 1); ln = L * r.uniform(.6, 1.1)
        o += path(f"M{F(sx-1.1)} {F(y)} L{F(sx+1.1)} {F(y)} L{F(sx+.3)} {F(y+ln)} Z", col or P["rust"], None, op=op)
    return o

def rowboat(x, y, flip=False, stake=True):
    """a clinker-built rowboat pulled up: strakes, thwarts, oarlocks, oars shipped, a painter to the shore"""
    hullc = P["wood"]
    shape = "M-34 -14 Q0 -10 34 -16 L28 -2 Q0 4 -28 -2 Z"
    s = path(shape, hullc, None)
    s += path("M-31 -8 Q0 -4 31 -10 L28 -2 Q0 4 -28 -2 Z", shade(hullc, .2), None)       # the side in shadow
    s += path("M-33 -11 Q0 -7 33 -13", "none", INK, Hh) + path("M-30 -5 Q0 -1 30 -7", "none", INK, Hh)  # strakes
    s += path(shape, "none", INK, O)
    s += path("M-34 -14 Q0 -10 34 -16", "none", P["cream"], 2.2) + path("M-34 -15.3 Q0 -11.3 34 -17.3", "none", INK, Hh)  # gunwale
    for tx in (-12, 10):
        s += line(tx, -14.5, tx + 2, -18, INK, D)                                             # thwart ends
    s += line(-20, -14, -20, -19, INK, D) + circ(-20, -19.5, 1.2, "none", INK, Hh)            # oarlock
    s += tube("M-26 -20 L30 -26", P["wood"], 1.6, .6) + poly([(30, -28.5), (44, -31), (45, -26), (31, -23.5)], P["wood"], INK, D)  # oar shipped
    if stake: s += path("M-34 -13 q-14 6 -30 10", "none", INK, Hh) + rect(-68, -6, 3, 10, P["wood"], INK, Hh)   # painter to a stake
    else: s += path("M-34 -13 q-10 10 -6 22", "none", INK, Hh)                                                  # painter trailing
    return tr(s, x, y, sx=-1 if flip else None)

def pennant(x, y, h=48):
    s = line(0, 0, 0, -h, INK, D + .4) + circ(0, -h - 1.5, 1.6, P["wood"], INK, Hh)
    s += line(0, -h * .6, -10, 0, INK, Hh) + line(0, -h * .6, 10, 0, INK, Hh)                 # guy lines
    s += CLS("st-flap", poly([(1, -h + 1), (30, -h + 8), (1, -h + 15)], P["brick"], INK, D)
             + line(10, -h + 4, 10, -h + 12, P["cream"], 1.2))
    return tr(s, x, y)

def theodolite(x, y):
    """the surveyor's instrument on its tripod, with a plumb bob"""
    s = line(0, -30, -13, 0, INK, D + .3) + line(0, -30, 13, 0, INK, D + .3) + line(0, -30, 3, 0, INK, D)
    s += line(-13, 0, -13, 2, INK, D) + line(13, 0, 13, 2, INK, D)
    s += line(0, -30, 0, -18, INK, Hh) + poly([(-1.6, -18), (1.6, -18), (0, -13)], P["coin"], INK, Hh)
    s += rect(-7, -34, 14, 4, P["wood"], INK, D)
    s += rect(-4, -44, 8, 10, P["coin"], INK, D) + rect(-12, -50, 24, 7, P["coin"], INK, D, rx=3)
    s += circ(-12, -46.5, 3.5, P["glass"], INK, D) + line(12, -46.5, 17, -46.5, INK, D)
    s += rect(-10, -49, 3, 5, "#f7e7ad", None)
    return tr(s, x, y)

def crab(x, y):
    s = path("M-9 0 Q0 -12 9 0 Z", P["brick"], INK, D)
    s += path("M-9 -1 l-6 -5 l2 -4 M9 -1 l6 -5 l-2 -4", "none", INK, D)
    s += circ(-15, -10, 2.4, P["brick"], INK, Hh) + circ(15, -10, 2.4, P["brick"], INK, Hh)
    for i in range(3):
        s += line(-5 + i * -1.5, 0, -9 - i * 2.5, 4, INK, Hh) + line(5 + i * 1.5, 0, 9 + i * 2.5, 4, INK, Hh)
    s += line(-2.5, -9, -3, -13, INK, Hh) + line(2.5, -9, 3, -13, INK, Hh)
    s += circ(-3, -13.5, 1.1, INK, None) + circ(3, -13.5, 1.1, INK, None)
    return tr(CLS("st-crab", s), x, y)

def gull(x, y, s=1.0, face=1):
    b = path("M-9 0 Q-2 -11 8 -2 L11 0 Z", P["white"], INK, D)
    b += path("M-7 -3 Q0 -8 6 -3 Q0 -4 -7 -3 Z", "#a9b2b6", INK, Hh)                   # the grey wing
    b += circ(7, -7, 3.6, P["white"], INK, D) + poly([(10.4, -7.6), (15, -6.6), (10.4, -5.6)], P["coin"], INK, Hh * .8)
    b += circ(8, -7.8, .7, INK, None) + poly([(-9, 0), (-14, -1.6), (-13, 1.6)], INK, None)
    b += line(-1, 0, -1, 4, INK, Hh) + line(2, 0, 2, 4, INK, Hh)
    return tr(b, x, y, s, sx=-1 if face < 0 else None)

def dug(x, y):
    """the dig: a spoil heap, the hole, the chest open with coins, the spade left in the heap"""
    s = path("M-44 2 Q-36 -14 -22 -6 Q-14 -18 -4 -4 L-2 2 Z", P["sand_wet"], INK, D)
    s += stipple(-40, -12, 36, 12, 18, shade(P["sand"], .35), 1.4, .9, seed=3)
    s += ell(6, 2, 24, 5.5, P["deep"], INK, D)
    s += rect(-8, -14, 28, 14, P["wood"], INK, D) + rect(-8, -10, 28, 2.6, P["iron"], INK, Hh) + rect(14, -14, 6, 14, shade(P["wood"]), None)
    s += rect(-8, -14, 28, 14, "none", INK, D) + rect(4, -9, 4, 5, P["coin"], INK, Hh)
    s += poly([(-8, -14), (-4, -30), (24, -30), (20, -14)], shade(P["wood"], .3), INK, D)       # lid thrown back
    s += line(-6, -22, 22, -22, INK, Hh)
    for cx, cy in ((-2, -15), (4, -17), (10, -15.5), (15, -16.5), (7, -19)):
        s += circ(cx, cy, 2.8, P["coin"], INK, Hh)
    s += line(-30, -10, -38, -46, INK, D + .6) + rect(-41, -50, 7, 4, P["wood"], INK, Hh)
    s += poly([(-33, -12), (-26, -6), (-25, 2), (-31, 3), (-35, -4)], P["iron"], INK, D)
    return tr(s, x, y)

def xmark(x, y):
    a = tube(f"M{x-14} {y-8} L{x+14} {y+8}", P["brick"], 3.2, .8)
    b = tube(f"M{x+14} {y-8} L{x-14} {y+8}", P["brick"], 3.2, .8)
    return a + b

# ---- plants
def palm(x, y, h, lean, seed, s=1.0):
    r = random.Random(seed)
    def at(t): return (2 * (1 - t) * t * lean * .15 + t * t * lean, -h * t)
    o = ""; segs = max(7, int(h / 9)); L, R = [], []
    for i in range(segs):
        t0, t1 = i / segs, (i + 1) / segs
        (x0, y0), (x1, y1) = at(t0), at(t1)
        w0, w1 = 6.2 - 3.2 * t0, 6.2 - 3.2 * t1
        o += poly([(x0 - w0, y0), (x1 - w1 * 1.15, y1 + 1.2), (x1 + w1 * 1.15, y1 + 1.2), (x0 + w0, y0)], P["trunk"], INK, Hh)
        o += poly([(x0 + w0 * .3, y0), (x1 + w1 * .3, y1 + 1.2), (x1 + w1 * 1.15, y1 + 1.2), (x0 + w0, y0)], shade(P["trunk"], .2), None)
        L.append((x0 - w0, y0)); R.append((x0 + w0, y0))
    tx, ty = at(1)
    o += poly(L + [(tx - 3, ty), (tx + 3, ty)] + R[::-1], "none", INK, D)
    def frond(ang, ln, col, droop):
        ex, ey = math.cos(ang) * ln, math.sin(ang) * ln * .5 + droop
        cx_, cy_ = math.cos(ang) * ln * .5, math.sin(ang) * ln * .5 - ln * .3
        pts = []
        for i in range(11):
            t = i / 10
            px = (1 - t) ** 2 * 0 + 2 * (1 - t) * t * cx_ + t * t * ex
            py = (1 - t) ** 2 * 0 + 2 * (1 - t) * t * cy_ + t * t * ey
            pts.append((px, py))
        up, dn = [], []
        for i in range(1, 10):
            (ax, ay), (bx, by) = pts[i - 1], pts[i + 1]
            dx, dy = bx - ax, by - ay; m = math.hypot(dx, dy) or 1
            nx, ny = -dy / m, dx / m
            if ny > 0: nx, ny = -nx, -ny                                  # n points up
            t = i / 10; w = ln * .16 * math.sin(math.pi * t) ** .6
            px, py = pts[i]
            up += [(px + nx * w + dx / m * 3, py + ny * w + dy / m * 3), (px + nx * w * .35, py + ny * w * .35)]
            dn += [(px - nx * w * 1.3 + dx / m * 3, py - ny * w * 1.3 + dy / m * 3 + w * .4), (px - nx * w * .4, py - ny * w * .4)]
        poly_pts = [pts[0]] + up + [pts[-1]] + dn[::-1]
        return poly(poly_pts, col, INK, Hh) + path("M" + " L".join(f"{F(a)} {F(b)}" for a, b in pts), "none", INK, Hh)
    fr = ""
    for a, ln, dr in ((-2.75, 44, 10), (-.35, 42, 12), (-2.2, 34, -4)):
        fr += frond(a + r.uniform(-.08, .08), ln, P["leaf2"], dr)
    for a, ln, dr in ((-3.05, 48, 18), (-1.85, 38, -2), (-1.2, 40, -2), (-.05, 50, 18), (-2.55, 46, 6), (-.6, 46, 8)):
        fr += frond(a + r.uniform(-.08, .08), ln, P["leaf"], dr)
    for cx, cy in ((-4, 4), (3, 5), (-.5, 8)):
        fr += circ(cx, cy, 3.6, "#7a5a3c", INK, Hh)
    o += tr(CLS("st-sway", fr), tx, ty)
    return tr(o, x, y, s)

def bush(x, y, w, h, seed):
    lobes = [(x - w * .45, y - h * .45, w * .42, h * .5), (x + w * .05, y - h * .62, w * .5, h * .55), (x + w * .5, y - h * .4, w * .38, h * .45)]
    return crown(lobes, P["leaf"], P["leaf_rim"], D, (-1, -1), seed, 70, .05)

def tufts_on(fy, x0, x1, n, seed, col=INK):
    r = random.Random(seed); o = ""
    for i in range(n):
        x = x0 + (x1 - x0) * (i + r.uniform(.1, .9)) / n; y = fy(x) + 1
        hh = r.uniform(4, 8)
        o += path(f"M{F(x-3)} {F(y)} L{F(x-2)} {F(y-hh*.7)} M{F(x)} {F(y)} L{F(x+.5)} {F(y-hh)} M{F(x+2.5)} {F(y)} L{F(x+4)} {F(y-hh*.6)}", "none", col, Hh)
    return o

def rock_lump(x, y, w, h, seed, col=None, wet=True):
    """a rock: lit face, a shade face on the far side, one crack, and a wet dark band where the sea reaches"""
    r = random.Random(seed); col = col or P["rock"]
    pts = [(-w, 0), (-w * .8, -h * .55), (-w * .35, -h), (w * .25, -h * 1.05), (w * .75, -h * .6), (w, 0)]
    pts = [(a + r.uniform(-1.5, 1.5), b + r.uniform(-1.5, 1.5)) for a, b in pts]
    s = poly(pts, col, None)
    s += poly([pts[3], pts[4], pts[5], (w * .1, 0), (w * .05, -h * .5)], shade(col, .2), None)
    s += poly([pts[1], pts[2], (-w * .2, -h * .7)], tint(col, .15), None)
    if wet: s += rect(-w, -h * .2, 2 * w, h * .2, shade(col, .38), None, op=.9)
    s += line(-w * .1, -h * .85, w * .05, -h * .45, INK, Hh)
    s += poly(pts, "none", INK, O, close=False)
    return tr(s, x, y)

def beach(x0, x1, top, seed, black=False):
    """a beach from x0 to x1, rising to top: dry sand, the wet band, the tide line, pebbles and shells"""
    r = random.Random(seed)
    sc, wet = (P["bsand"], shade(P["bsand"], .25)) if black else (P["sand"], P["sand_wet"])
    mid = (x0 + x1) / 2
    d = f"M{x0} {SB+4} Q{x0+30} {top+4} {x0+80} {top} Q{mid} {top-6} {x1-80} {top} Q{x1-30} {top+4} {x1} {SB+4} Q{mid} {SB+12} {x0} {SB+4} Z"
    s = path(d, sc, None)
    s += path(f"M{x0+10} {SB-2} Q{mid} {SB-10} {x1-10} {SB-2} L{x1} {SB+4} Q{mid} {SB+12} {x0} {SB+4} Z", wet, None)
    # tide line of weed, a scatter of sand grains near the water
    rs = []
    x = x0 + 40
    while x < x1 - 40:
        L = r.uniform(3, 10); rs.append((x, SB - 8 + r.uniform(-1.5, 1.5) - 2 * math.sin((x - x0) / (x1 - x0) * math.pi), L, 1.6)); x += L + r.uniform(4, 30)
    s += rects_path(rs, P["weed"] if not black else "#8b8f7c", .9)
    s += stipple(x0 + 40, top + 6, x1 - x0 - 80, SB - top - 16, int((x1 - x0) / 9), "#f6efdc" if black else shade(sc, .3), 1.3, .7, lambda u, v: v ** 1.5, seed=seed)
    for i in range(7):                                                        # pebbles
        px, py = r.uniform(x0 + 60, x1 - 60), r.uniform(SB - 12, SB - 2)
        s += ell(px, py, r.uniform(2, 3.6), r.uniform(1.4, 2.2), mix(P["rock"], sc, .3), INK, Hh)
    s += path(d, "none", INK, O)
    return s

def driftwood(x, y, ln, seed):
    r = random.Random(seed)
    s = tube(f"M0 0 Q{F(ln*.5)} {F(-4)} {F(ln)} -1", P["cream"] if r.random() < .5 else "#cbbd9f", 4.4, D)
    s += path(f"M{F(ln*.2)} -1.5 Q{F(ln*.5)} -4 {F(ln*.8)} -2.2", "none", INK, Hh * .8)
    s += line(ln * .62, -3, ln * .7, -10, INK, D) + circ(ln * .35, -1.8, 1, INK, None)
    return tr(s, x, y)

def campfire(x, y):
    s = ""
    for i, a in enumerate((-16, -10, -2, 6, 14)):
        s += ell(a, -1.5 - (i % 2), 4, 3, P["rock"], INK, Hh)
    s += ell(-1, -2, 9, 2.4, "#8d8984", None)
    s += line(-8, -3, 6, -6, P["deep"], 2.4) + line(-4, -6, 8, -2, P["deep"], 2.4)
    return tr(s, x, y)

# ================================================================ isles
def hill_shape(x0, x1, top, peakx):
    return f"M{x0} {SB-18} C{x0+40} {top+50} {peakx-80} {top} {peakx} {top} C{peakx+70} {top+2} {x1-40} {top+56} {x1} {SB-18} Z"

def hill_y(x0, x1, top, peakx):
    """the crest's height at x (a good-enough fit of hill_shape for planting things on it)"""
    def fy(x):
        if x <= peakx: t = (peakx - x) / (peakx - x0); return top + (SB - 18 - top) * t ** 1.9
        t = (x - peakx) / (x1 - peakx); return top + (SB - 18 - top) * t ** 1.9
    return fy

def earth_bank(x0, x1, seed):
    """where the hill meets the beach: a low cut bank of earth with strata and roots"""
    r = random.Random(seed)
    d = f"M{x0} {SB-24} Q{(x0+x1)/2} {SB-34} {x1} {SB-24} L{x1-8} {SB-14} Q{(x0+x1)/2} {SB-20} {x0+8} {SB-14} Z"
    s = path(d, P["earth"], None)
    s += path(f"M{x0+14} {SB-21} Q{(x0+x1)/2} {SB-30} {x1-14} {SB-21}", "none", INK, Hh)
    for i in range(6):
        rx = r.uniform(x0 + 30, x1 - 30)
        s += path(f"M{F(rx)} {F(SB-26)} q2 4 -1 7", "none", INK, Hh)
    s += path(d, "none", INK, D)
    return s

def isle(v, seed):
    reset()
    r = random.Random(seed)
    o = far_shore(seed) + far_gulls(seed)
    spots, over = [], {}
    if v == "rock":
        o += reflection(200, 620, 34, seed, [(P["rock"], 220, 600), ("#f2efe6", 300, 500)])
        o += foam_line(60, 740, SB + 14, seed)
        o += beach(150, 330, SB - 26, seed)
        body = [(208, SB), (226, 330), (262, 300), (300, 240), (338, 168), (380, 112), (420, 122), (446, 168), (470, 182), (500, 160), (530, 196), (556, 262), (590, 320), (612, SB)]
        o += poly(body, P["rock"], None)
        o += poly([(420, 122), (446, 168), (470, 182), (500, 160), (530, 196), (556, 262), (590, 320), (612, SB), (480, SB), (470, 300), (446, 220)], shade(P["rock"], .2), None)
        o += poly([(338, 168), (380, 112), (392, 170), (356, 230)], shade(P["rock"], .36), None)
        o += poly([(226, 330), (262, 300), (276, 330), (250, 360)], tint(P["rock"], .12), None)
        # ledges: a shelf of stone with a dark undercut, and guano down from each
        for lx0, lx1, ly in ((270, 330, 296), (350, 420, 224), (430, 500, 250), (470, 540, 318), (300, 370, 352)):
            o += poly([(lx0, ly), (lx1, ly - 3), (lx1 - 4, ly + 4), (lx0 + 4, ly + 6)], shade(P["rock"], .5), None)
            o += line(lx0, ly, lx1, ly - 3, INK, D)
            for gx in range(int(lx0) + 8, int(lx1) - 4, 14):
                ln = r.uniform(8, 22)
                o += path(f"M{gx-1.4} {ly+5} L{gx+1.4} {ly+5} L{gx+.4} {F(ly+5+ln)} Z", P["white"], None, op=.9)
        for a, b, c, d2 in ((240, 380, 300, 372), (520, 300, 560, 296), (330, 300, 370, 296), (480, 210, 520, 214), (392, 160, 426, 158)):
            o += line(a, b, c, d2, INK, D)                                                     # bedding
        for a, b, c, d2 in ((300, 260, 304, 292), (412, 180, 410, 214), (500, 270, 498, 300), (540, 220, 536, 248), (360, 320, 358, 346)):
            o += line(a, b, c, d2, INK, Hh)                                                    # joints
        o += path("M372 412 L372 382 Q390 360 408 382 L408 412 Z", P["deep"], INK, D)          # a sea cave: the near-black mass
        o += rect(208, SB - 16, 404, 16, shade(P["rock"], .4), None, op=.85)                    # wet rock where the sea reaches
        o += stipple(214, SB - 15, 390, 13, 70, P["white"], 1.3, .8, seed=seed)                # barnacles
        o += poly(body, "none", INK, O, close=False)
        for gx, gy in ((300, 240), (338, 166), (382, 110), (420, 120), (500, 158), (360, 222), (448, 248), (488, 316)):
            o += gull(gx, gy, .9, 1 if r.random() < .6 else -1)
        for sx in range(276, 330, 11):                                                        # birds packed on the low ledge
            o += tr(path("M-2.5 0 Q-3 -9 0 -10 Q3 -9 2.5 0 Z", INK, None) + path("M-1 0 Q-1.4 -6 0 -6.5 Q1.4 -6 1 0 Z", P["white"], None) + poly([(0, -10), (2.6, -9.2), (0, -8.4)], P["brick"], None), sx, 296)
        o += tr(path("M-30 0 q4 -18 26 -18 q14 0 18 -10 q10 4 8 14 q-3 10 -14 14 z", P["seal"], INK, D)
                + path("M-24 -4 q12 -6 30 -4", "none", INK, Hh) + circ(17, -22, 1.1, INK, None)
                + path("M-30 0 l-12 -6 M-30 0 l-12 5", "none", INK, D), 580, SB - 4)            # a seal hauled out
        o += foam_blobs([(214, SB - 2, 14, 3.4), (390, SB - 2, 16, 3.6), (606, SB - 1, 12, 3)], seed)
        spots.append(dict(k="peak", l="Climb to the peak", x=380, y=96))
        over["peak"] = pennant(384, 114, 46)
        o += kelp([(230, SB), (470, SB), (520, SB)], seed)
        sv = (196, SB - 6)
    elif v == "volcanic":
        o += reflection(160, 640, 36, seed, [(P["ash"], 180, 620), (P["brick"], 380, 420)])
        o += foam_line(60, 740, SB + 14, seed)
        o += beach(140, 680, SB - 22, seed, black=True)
        cone = [(170, SB - 14), (360, 156), (378, 148), (432, 150), (446, 158), (632, SB - 14)]
        o += poly(cone, P["ash"], None)
        o += poly([(432, 150), (446, 158), (632, SB - 14), (510, SB - 14), (470, 260)], shade(P["ash"], .22), None)
        o += speckle_floor(200, 170, 420, 220, "#8f8883", .5, seed)
        for a, b, c, d2 in ((370, 168, 316, 300), (352, 210, 300, 330), (392, 170, 380, 260), (452, 176, 500, 290), (470, 220, 540, 340), (420, 230, 430, 320)):
            o += path(f"M{a} {b} Q{(a+c)/2+6} {(b+d2)/2} {c} {d2}", "none", INK, D)          # gullies
        o += ell(404, 152, 34, 6, P["deep"], INK, D)                                            # the crater mouth
        o += ell(404, 153, 22, 3, P["brick"], None)
        lava = "M404 158 C398 200 420 226 408 262 C398 300 418 330 404 398"
        o += path(lava, "none", INK, 11) + path(lava, "none", P["brick"], 7.6) + path(lava, "none", P["lamp"], 2)
        o += path("M404 158 C398 200 420 226 408 262", "none", P["deep"], 1.2, extra='stroke-dasharray="6 9"')   # a crust forming
        o += poly(cone, "none", INK, O, close=False)
        # basalt columns at the shore: prisms with a lit front, a shade side and a hexagon top
        for i, (bx, bh) in enumerate(((520, 46), (536, 60), (552, 52), (568, 70), (584, 54), (600, 38), (614, 30))):
            top = SB - 8 - bh
            o += rect(bx, top, 12, bh, P["basalt"], INK, D) + rect(bx + 8, top, 4, bh, shade(P["basalt"], .3), None)
            o += poly([(bx, top), (bx + 3, top - 3), (bx + 11, top - 3), (bx + 12, top)], tint(P["basalt"], .25), INK, Hh)
            o += rect(bx, top, 12, bh, "none", INK, D)
            o += line(bx + 1, top + bh * .55, bx + 11, top + bh * .5, INK, Hh)
        for tx, th in ((236, 46), (268, 34), (300, 28)):
            o += bare_tree(tx, SB - 30 + (tx - 236) * -.2, th, seed + tx, 4, .6, P["deep"], D, -.1)
        o += rock_lump(206, SB + 2, 16, 12, seed, P["ash"]) + rock_lump(658, SB + 2, 14, 10, seed + 1, P["ash"])
        o += CLS("st-smoke", smoke(406, 140, 60, -100, 170, 9, 34, "#b8b2aa", .85, seed=4, lift=.18))
        o += CLS("st-steam", smoke(404, SB - 2, 18, -30, 50, 6, 16, P["white"], .85, seed=9, lift=.1))
        o += foam_blobs([(392, SB - 1, 16, 4), (420, SB, 12, 3.4), (200, SB + 1, 12, 3), (640, SB, 14, 3.2)], seed)
        for px, py in ((470, SB + 14), (520, SB + 22), (300, SB + 18)):
            o += ell(px, py, 4, 2, "#cfc7bb", INK, Hh)                                          # pumice adrift
        spots.append(dict(k="peak", l="Climb to the peak", x=396, y=128))
        over["peak"] = pennant(430, 150, 44)
        sv = (196, SB - 4)
    else:
        lh = v == "lighthouse"
        top, peakx, x0, x1 = (272 if lh else 236), 428, 140, 660
        hill = hill_shape(x0, x1, top, peakx); fy = hill_y(x0, x1, top, peakx)
        o += reflection(130, 680, 40, seed, [(P["hill"], 180, 640), (P["sand"], 140, 680)] + ([(P["wall"], 500, 580)] if lh else []))
        o += foam_line(60, 740, SB + 14, seed)
        o += beach(96, 708, SB - 26, seed)
        o += path(hill, P["hill"], None)
        o += path(f"M{peakx} {top} C{peakx+70} {top+2} {x1-40} {top+56} {x1} {SB-18} H{peakx+130} C{peakx+120} {top+80} {peakx+60} {top+20} {peakx} {top} Z", shade(P["hill"], .18), None)
        o += path(f"M{x0+30} {SB-40} C{x0+60} {top+60} {peakx-70} {top+6} {peakx} {top+2}", "none", P["grass_rim"], 3, op=.9)   # the sunlit rim
        o += path(hill, "none", INK, O)
        o += rock_lump(500, fy(500) + 30, 24, 14, seed + 7, wet=False) + rock_lump(240, fy(240) + 40, 16, 10, seed + 8, wet=False)
        o += stipple(260, fy(260) + 6, 70, 24, 22, P["cream"], 2, .9, seed=seed) + stipple(560, fy(560) + 10, 50, 20, 14, "#e2a58c", 2, .9, seed=seed + 1)
        o += tufts_on(fy, x0 + 30, x1 - 30, 16, seed)
        o += tufts_on(lambda x: SB - 30 - 10 * math.sin((x - x0) / (x1 - x0) * math.pi), x0 + 60, x1 - 60, 8, seed + 1, shade(P["hill"], .45))
        o += path(f"M300 {SB-26} q20 -18 8 -34 q-10 -16 18 -28 q24 -10 22 -30", "none", INK, Hh, extra='stroke-dasharray="4 5"')   # a footpath
        o += rock_lump(124, SB + 2, 22, 16, seed) + rock_lump(686, SB + 4, 18, 12, seed + 1)
        if lh:
            o += cottage(452, fy(452) + 6) + lighthouse(560, fy(560) + 8)
            o += palm(220, fy(220) + 10, 76, -10, seed) + bush(300, fy(300) + 6, 30, 22, seed)
            o += bush(620, fy(620) + 6, 24, 16, seed + 5)
            spots.append(dict(k="light", l="Relight the lamp", x=560, y=124))
            over["light"] = lamp_lit(560, fy(560) + 8) + tr(rect(-26, -26, 10, 11, P["lamp"], INK, D), 452, fy(452) + 6)
        else:
            o += bush(250, fy(250) + 8, 34, 24, seed) + bush(560, fy(560) + 6, 30, 20, seed + 3)
            o += palm(300, fy(300) + 8, 92, -18, seed) + palm(372, fy(372) + 6, 118, -6, seed + 1, 1.05)
            o += palm(500, fy(500) + 6, 102, 14, seed + 2) + palm(588, fy(588) + 8, 66, 18, seed + 3, .9)
            o += campfire(330, SB - 16) + driftwood(470, SB - 8, 40, seed)
            spots.append(dict(k="peak", l="Climb to the peak", x=430, y=214))
            over["peak"] = pennant(434, top + 2, 46)
        o += foam_blobs([(120, SB + 3, 12, 3), (690, SB + 4, 12, 3)], seed)
        sv = (210, SB - 16)
        o += crab(400, SB - 4)
        o += tr(path("M-5 0 q5 -8 10 0 z", P["white"], INK, Hh) + line(-2, -1, -1, -4, INK, Hh * .7) + line(2, -1, 1, -4, INK, Hh * .7), 604, SB - 6)  # a shell
        o += footprints(620, SB - 4, 520, SB - 20, seed)
    # every isle: the survey flag, a dig mark (the game decides if this isle has one), your boat, foam
    o += pennant(sv[0], sv[1], 50)
    spots.append(dict(k="survey", l="Survey the isle", x=sv[0] // 2, y=(sv[1] - 40) // 2, ly=-28))
    over["survey"] = theodolite(sv[0] + 34, sv[1] + 6)
    if v not in ("rock",):
        spots.append(dict(k="dig", l="Dig here", x=556, y=420, ly=-22))
        over["x"] = xmark(556, SB - 4)
        over["dig"] = dug(556, SB)
    o += rowboat(286 if v == "rock" else 650, SB + 6)
    # spots were written in drawing units except the survey; bring them to game units
    for sp in spots:
        if sp["k"] != "survey": sp["x"], sp["y"] = sp["x"] // 2, sp["y"] // 2
    return o, over, spots, None

def kelp(points, seed):
    r = random.Random(seed); o = ""
    for x, y in points:
        for i in range(3):
            xx = x + i * 5
            o += path(f"M{xx} {y} q{F(r.uniform(4,8))} 10 {F(r.uniform(-4,2))} {F(r.uniform(18,28))}", "none", P["weed"], 2.4)
    return o

def footprints(x0, y0, x1, y1, seed):
    """two lines of footprints from your boat up the beach: someone's been ashore"""
    o = []; n = 9
    for i in range(n):
        t = i / (n - 1); x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t + (3 if i % 2 else -3)
        o.append(ell(x, y, 2.6, 1.3, shade(P["sand"], .3), None))
    return "".join(o)

def cottage(x, y):
    """the keeper's cottage: clapboard, a slate roof, a chimney, shutters (one hanging), a fence, a washing line"""
    s = rect(-34, -34, 68, 34, P["wall"], None)
    s += rect(14, -34, 20, 34, shade(P["wall"], .14), None)
    for yy in (-28, -22, -16):
        s += line(-34, yy, 14, yy, INK, Hh * .8)                                      # clapboard, a few courses only
    s += rect(-34, -34, 68, 34, "none", INK, O)
    s += poly([(-40, -34), (-18, -56), (18, -56), (40, -34)], P["roof"], INK, O)
    s += poly([(18, -56), (40, -34), (22, -34)], shade(P["roof"], .2), None)
    s += line(-28, -44, 28, -44, INK, Hh) + poly([(-40, -34), (-18, -56), (18, -56), (40, -34)], "none", INK, O)
    s += rect(8, -66, 9, 16, P["brick"], INK, D) + rect(7, -68, 11, 3, shade(P["brick"]), INK, Hh) + line(8, -60, 17, -60, INK, Hh)
    s += window(-26, -26, 10, 11, 1, 1, P["cream"], P["glass"], None, D, True, False, P["glass_hi"])
    s += rect(-30, -26, 3.6, 11, P["roof"], INK, Hh)                                  # a shutter
    s += tr(rect(0, 0, 3.6, 11, P["roof"], INK, Hh), -16, -24, rot=24)                # the other, hanging by one hinge
    s += rect(-4, -20, 12, 20, P["deep"], INK, D) + rect(-6, 0, 16, 2.4, P["stone"], INK, Hh)   # the door, near-black
    s += line(-50, 0, -50, -22, INK, D) + line(-90, 0, -90, -22, INK, D)                # the washing line
    s += path("M-90 -20 Q-70 -16 -50 -20", "none", INK, Hh)
    s += CLS("st-flap", path("M-78 -18.2 l10 .4 l1 10 l-12 0 z", P["cream"], INK, Hh) + path("M-64 -17.2 l6 0 l-1 7 l-5 0 z", "#a8b8be", INK, Hh))
    for i in range(7):                                                                 # a picket fence, a picket gone
        if i == 4: continue
        px = 40 + i * 7
        s += poly([(px, 0), (px, -12), (px + 2, -14.5), (px + 4, -12), (px + 4, 0)], P["cream"], INK, Hh)
    s += line(38, -8, 88, -8, INK, Hh)
    s += rect(-48 + 4, -12, 12, 12, P["wood"], INK, D, rx=3) + line(-44, -6, -32, -6, INK, Hh)   # water butt
    return tr(s, x, y)

def lighthouse(x, y):
    """the tower: stone, two red bands, a stair of small windows, the gallery on corbels, the lantern
    with its astragals and one cracked pane, a copper dome, a vane"""
    H = 150; bw, tw = 24, 17
    out = [(-bw, 0), (-tw, -H), (tw, -H), (bw, 0)]
    s = poly(out, P["wall"], None)
    cp = clip(f'<path d="{pts_d(out)}"/>')
    inner = rect(6, -H, 30, H, shade(P["wall"], .14), None)
    inner += rect(-30, -98, 60, 18, P["brick"], None) + rect(-30, -44, 60, 18, P["brick"], None)
    inner += rect(6, -98, 30, 18, shade(P["brick"], .15), None) + rect(6, -44, 30, 18, shade(P["brick"], .15), None)
    for yy in range(-10, -30, -7):                                                      # stone courses near the foot only
        inner += line(-30, yy, 30, yy, INK, Hh * .8)
        for jx in (-14, 2, 16) if (yy // 7) % 2 else (-6, 10):
            inner += line(jx, yy, jx, yy + 7, INK, Hh * .8)
    s += f"<g {cp}>{inner}</g>"
    s += poly(out, "none", INK, O)
    for wx, wy in ((-6, -66), (4, -118), (-4, -140)):
        s += rect(wx - 3, wy, 7, 10, P["glass"], INK, D) + rect(wx - 4, wy + 10, 9, 2, P["stone"], INK, Hh)
    s += path("M-7 0 V-16 Q0 -24 7 -16 V0 Z", P["deep"], INK, D) + path("M-10 0 V-17 Q0 -28 10 -17 V0", "none", INK, Hh)  # the door
    s += rect(-12, 0, 24, 3, P["stone"], INK, Hh) + rect(-15, 3, 30, 3, P["stone"], INK, Hh)
    s += rect(-26, -H - 5, 52, 5, P["cream"], INK, D)                                   # the gallery
    for cx in (-20, -10, 0, 10, 20):
        s += poly([(cx - 3, -H), (cx + 3, -H), (cx, -H + 6)], P["cream"], INK, Hh)      # corbels
    s += railing(-26, 26, -H - 5, 9, 6.5, Hh)
    s += rect(-13, -H - 31, 26, 26, P["glass"], INK, D)                                 # the lantern
    s += line(-13, -H - 31, 13, -H - 5, INK, Hh) + line(13, -H - 31, -13, -H - 5, INK, Hh) + line(0, -H - 31, 0, -H - 5, INK, Hh)
    s += path(f"M5 {-H-26} l4 6 l-2 5", "none", P["cream"], .9)                          # a cracked pane
    s += rect(-13, -H - 31, 26, 26, "none", INK, D)
    s += path(f"M-16 {-H-31} Q0 {-H-52} 16 {-H-31} Z", P["copper"], INK, D)            # the dome
    s += path(f"M4 {-H-49} Q12 {-H-44} 16 {-H-31} H8 Q8 {-H-42} 4 {-H-49} Z", shade(P["copper"], .2), None)
    s += circ(0, -H - 52, 3, P["copper"], INK, D) + line(0, -H - 55, 0, -H - 70, INK, D)
    s += poly([(-8, -H - 64), (8, -H - 64), (12, -H - 66), (8, -H - 68), (-8, -H - 68)], P["iron"], INK, Hh) + line(-4, -H - 61, 4, -H - 61, INK, Hh)
    return tr(s, x, y)

def lamp_lit(x, y):
    H = 150
    s = rect(-12.4, -H - 30.4, 24.8, 24.8, P["lamp"], None)
    s += line(-13, -H - 31, 13, -H - 5, INK, Hh) + line(13, -H - 31, -13, -H - 5, INK, Hh) + line(0, -H - 31, 0, -H - 5, INK, Hh)
    s += circ(0, -H - 18, 4.6, "#fff4c8", INK, Hh)
    s += rect(-13, -H - 31, 26, 26, "none", INK, D)
    beam = CLS("st-beam", poly([(0, 0), (-210, -22), (-210, 22)], P["lamp"], None, op=.34) + poly([(0, 0), (210, -22), (210, 22)], P["lamp"], None, op=.34))
    for wx, wy in ((-6, -66), (4, -118), (-4, -140)):
        s += rect(wx - 3, wy, 7, 10, P["lamp"], INK, D)
    return tr(s, x, y) + tr(beam, x, y - H - 18)

# ================================================================ wrecks
def quad(p0, p1, p2):
    (x0, y0), (x1, y1), (x2, y2) = p0, p1, p2
    def fy(x):
        return (y0 * (x - x1) * (x - x2) / ((x0 - x1) * (x0 - x2)) + y1 * (x - x0) * (x - x2) / ((x1 - x0) * (x1 - x2))
                + y2 * (x - x0) * (x - x1) / ((x2 - x0) * (x2 - x1)))
    return fy

def wreck(v, seed):
    reset()
    r = random.Random(seed)
    o = far_shore(seed) + far_gulls(seed, 2)
    over, spots, name = {}, [], None
    old = v == "old"
    if v == "keel":
        return keel_up(o, seed)
    hullc = P["hull_old"] if old else P["hull"]
    rot = -8 if v == "reef" else -4
    sheer = quad((196, 318), (430, 304), (600, 300))
    S = lambda x: sheer(x)
    h = ""
    # ---- rigging first, behind everything on deck
    rig = ""
    MX, MTOP = 420, (96 if not old else 150)
    shroud_base = lambda x: S(x) + 6
    if not old:
        for side in (-1, 1):
            bx = MX + side * 34
            rig += line(MX + side * 3, MTOP + 44, bx, shroud_base(bx), INK, D * .9)
            rig += line(MX + side * 3, MTOP + 44, MX + side * 20, shroud_base(MX + side * 20), INK, D * .9)
        for ry in range(int(MTOP) + 56, int(S(MX)) - 14, 11):                          # ratlines
            t = (ry - MTOP - 44) / (S(MX) - MTOP - 44)
            rig += line(MX - 4 - 30 * t, ry, MX - 4 - 16 * t, ry, INK, Hh * .8) + line(MX + 4 + 16 * t, ry, MX + 4 + 30 * t, ry, INK, Hh * .8)
        rig += line(MX, MTOP + 4, 150, 270, INK, D * .9)                                  # forestay to the bowsprit
        rig += line(MX, MTOP + 4, 612, 170, INK, D * .9) + line(612, 170, 684, 262, INK, D * .9)   # stays aft
        rig += path(f"M{MX-2} {MTOP+30} Q{MX-60} {MTOP+120} {MX-40} {MTOP+170}", "none", INK, Hh)      # a parted line, hanging
    else:
        rig += line(MX + 4, MTOP + 4, MX + 30, shroud_base(MX + 30), INK, D * .9)
        rig += path(f"M{MX-2} {MTOP+10} Q{MX-26} {MTOP+70} {MX-12} {MTOP+120}", "none", INK, Hh)
    h += rig
    # ---- masts
    def mast(x, base, top, w0=9, w1=6):
        return poly([(x - w0 / 2, base), (x - w1 / 2, top), (x + w1 / 2, top), (x + w0 / 2, base)], P["wood"], INK, D) + rect(x + w0 * .1, top, w1 * .35, base - top, shade(P["wood"], .2), None, op=.8)
    fx = 270
    h += mast(fx, S(fx), 214)                                                              # the foremast, snapped
    h += poly([(fx - 4.5, 214), (fx - 2, 204), (fx, 212), (fx + 2, 200), (fx + 4.5, 214)], P["cream"], INK, D)   # splintered
    if not old:
        h += tube(f"M{fx+2} 208 L{fx+70} {S(fx+70)-4}", P["wood"], 4.2, D)                 # the topmast, down across the deck
        h += line(fx + 18, 200, fx + 50, 260, INK, D * 1.4) + line(fx + 18, 200, fx + 50, 260, P["wood"], 1.6)  # its yard
        h += path(f"M{fx+22} 214 Q{fx+40} 236 {fx+30} 252 Q{fx+50} 250 {fx+48} 262 Q{fx+34} 268 {fx+22} 254 Z", P["cream"], INK, D)  # sail bunched
        h += line(fx + 28, 228, fx + 38, 246, INK, Hh)
    h += mast(MX, S(MX), MTOP, 10, 6)
    if not old:
        h += rect(MX - 18, MTOP + 40, 36, 4, P["wood"], INK, D)                                      # the top
        h += line(MX, MTOP, MX, MTOP - 30, INK, D + 1) + line(MX, MTOP, MX, MTOP - 30, P["wood"], 1.6) + circ(MX, MTOP - 32, 2.6, P["wood"], INK, Hh)
        h += rect(MX - 24, MTOP - 6, 48, 3, P["wood"], INK, Hh)                                      # crosstrees
    else:
        h += poly([(MX - 3, MTOP), (MX - 1, MTOP - 8), (MX + 1, MTOP - 2), (MX + 3, MTOP - 10), (MX + 3, MTOP)], P["cream"], INK, D)
    # the main yard, one lift gone, and the sail torn
    ya, yb = (MX - 74, MTOP + 58), (MX + 80, MTOP + 84)
    h += tube(f"M{ya[0]} {ya[1]} L{yb[0]} {yb[1]}", P["wood"], 3.4, D * .8)
    h += line(MX, MTOP + 2, ya[0] + 4, ya[1], INK, Hh)                                            # the lift that held
    if not old:
        sl = [(ya[0] + 8, ya[1] + 2), (yb[0] - 6, yb[1] - 1), (yb[0] - 14, yb[1] + 70), (yb[0] - 26, yb[1] + 62), (yb[0] - 34, yb[1] + 80),
              (MX + 8, yb[1] + 66), (MX - 6, yb[1] + 88), (MX - 22, yb[1] + 70), (MX - 40, yb[1] + 92), (ya[0] + 18, ya[1] + 96)]
        sail = poly(sl, P["white"], None)
        sail += poly([(MX + 20, ya[1] + 13), (yb[0] - 6, yb[1] - 1), (yb[0] - 14, yb[1] + 70), (yb[0] - 26, yb[1] + 62), (yb[0] - 34, yb[1] + 80), (MX + 20, yb[1] + 70)], shade(P["white"], .1), None)
        for sx in (MX - 40, MX - 10, MX + 20, MX + 48):                                           # cloths
            sy = ya[1] + (sx - ya[0]) * (yb[1] - ya[1]) / (yb[0] - ya[0])
            sail += line(sx, sy + 2, sx + 2, sy + 70, INK, Hh * .8)
        for i in range(10):                                                                      # reef points
            px = ya[0] + 14 + i * 14; py = ya[1] + (px - ya[0]) * (yb[1] - ya[1]) / (yb[0] - ya[0]) + 14
            sail += line(px, py, px, py + 4, INK, Hh)
        sail += rect(MX - 30, ya[1] + 40, 16, 14, "#e4d8bd", INK, Hh) + rect(MX - 28, ya[1] + 42, 12, 10, "none", INK, .5, extra='stroke-dasharray="1.5 1.5"')   # a patch
        sail += poly(sl, "none", INK, D)
        h += CLS("st-flap", sail)
        h += path(f"M{yb[0]-14} {yb[1]+70} Q{yb[0]} {yb[1]+110} {yb[0]-10} {yb[1]+130}", "none", INK, Hh)   # a sheet trailing
        h += gull(MX + 50, yb[1] - 10, .9, -1) + gull(ya[0] + 26, ya[1] - 6, .85)
    else:
        h += gull(ya[0] + 30, ya[1] - 6, .9)
    # the mizzen on the stern castle, and the ensign
    zx = 612
    if not old:
        h += mast(zx, 272, 170, 7, 5)
        h += line(zx, 182, zx + 52, 200, INK, D * 1.2) + line(zx, 182, zx + 52, 200, P["wood"], 1.4)   # the gaff
        h += CLS("st-flap", path(f"M{zx+52} 200 l26 4 l-4 4 l6 3 l-5 3 l5 4 l-28 -2 z", P["brick"], INK, D) + line(zx + 52, 204, zx + 70, 207, P["cream"], 1.2))
    else:
        h += mast(zx, 272, 236, 7, 6) + poly([(zx - 3, 236), (zx - 1, 230), (zx + 1, 234), (zx + 3, 228), (zx + 3, 236)], P["cream"], INK, D)
    # ---- the hull: one outline, planking clipped inside it
    stern = f"L600 272 L676 262 Q694 296 690 332 L688 {SB+70}"
    top = " L".join(f"{x} {F(S(x))}" for x in range(196, 597, 10))
    hd = f"M184 {SB+70} L184 412 Q156 352 178 298 L{top} {stern} Z"
    hole = ""
    if old:   # upper strakes gone amidships: the ribs show against the sky
        hole = f" M330 {F(S(330)+2)} L420 {F(S(420)+2)} L414 {F(S(414)+18)} L392 {F(S(392)+14)} L366 {F(S(366)+19)} L338 {F(S(338)+15)} Z"
    h += path(hd + hole, hullc, None, extra='fill-rule="evenodd"')
    cpd = clip(f'<path d="{hd}{hole}" clip-rule="evenodd" fill-rule="evenodd"/>')
    inner = ""
    line_c = shade(hullc, .18)
    for k in range(1, 20):
        pts = [(x, S(x) + k * 9) for x in range(150, 700, 10)]
        inner += poly(pts, "none", line_c, D * .9, close=False)
    for k in range(1, 4):
        inner += line(596, 272 + k * 9, 700, 262 + k * 9, line_c, D * .9)
    for bx in range(214, 690, 46):
        kk = (bx // 46) % 4
        for k in (kk, kk + 4, kk + 8):
            y0 = S(bx) + k * 9
            inner += line(bx, y0, bx, y0 + 9, line_c, D * .9)
    inner += poly([(676, 262), (694, 300), (692, 412), (668, 412), (670, 300)], shade(hullc, .2), None)   # the transom's side, in shade
    for off, th in ((20, 7), (58, 7)):                                                          # wales
        pts_t = [(x, S(x) + off) for x in range(150, 700, 10)]
        pts_b = [(x, S(x) + off + th) for x in range(150, 700, 10)]
        inner += poly(pts_t + pts_b[::-1], P["wale"], None) + poly(pts_t, "none", INK, D, close=False) + poly(pts_b, "none", INK, D, close=False)
    for sx in (232, 300, 360, 470, 520, 640):                                                    # rust and weather, straight down
        inner += rust(sx, S(sx) + 28, 1, r.uniform(14, 28), 0, seed + sx)
    if old:
        inner += rect(150, SB - 24, 560, 24, shade(hullc, .3), None, op=.8)
        inner += stipple(160, SB - 22, 520, 20, 110, P["white"], 1.4, .8, seed=seed)              # barnacles
    h += f"<g {cpd}>{inner}</g>"
    h += path(hd + hole, "none", INK, O)
    if old:
        for i, xx in enumerate(range(338, 418, 14)):                                              # ribs in the gap
            h += rect(xx, S(xx) - 8 - (i % 2) * 6, 5, 30, shade(P["wood"], .1), INK, D)
    h += path(f"M178 298 L{top}", "none", P["cream"], 3.4) + path(f"M178 296.3 L{top.replace(' ', ' ')}", "none", INK, Hh)   # the cap rail
    # gunports between the wales, lids up at odd angles, one hanging, one gone
    for i, gx in enumerate((316, 372, 428, 484, 592)):
        gy = S(gx) + 34
        h += rect(gx, gy, 15, 15, P["deep"], INK, D)
        if i == 2: continue
        if i == 3:
            h += tr(rect(0, 0, 15, 15, hullc, INK, D) + line(0, 5, 15, 5, line_c, Hh), gx + 1, gy + 15, rot=168)
        else:
            a = math.radians([62, 74, 0, 0, 55][i]); lx, ly = 15 * math.cos(a), 15 * math.sin(a)
            h += poly([(gx - 1, gy), (gx + 16, gy), (gx + 16 + lx * .1, gy - ly), (gx - 1 + lx * .1, gy - ly)], hullc, INK, D)
        h += rust(gx + 7, gy + 16, 2, 14, 5, seed + i, .6)
    # the breach at the waterline: near-black, broken plank ends, ribs inside
    brk = [(500, SB + 30), (504, SB - 26), (514, SB - 34), (522, SB - 54), (536, SB - 44), (548, SB - 62), (560, SB - 46), (570, SB - 40), (576, SB - 18), (580, SB + 30)]
    h += poly(brk, P["deep"], INK, D)
    for bx, bt in ((514, 30), (530, 44), (546, 50), (562, 40)):
        h += rect(bx, SB - bt, 5, bt, shade(P["wood"], .25), INK, Hh)
    for (ax, ay), (bx, by) in zip(brk[1:-2], brk[2:-1]):
        h += line(ax, ay, ax + (bx - ax) * .3, ay - 3, P["cream"], 1.4)
    # the stern: a quarter gallery with windows, carved trim, a lantern
    h += path("M634 278 H682 L686 306 Q660 316 632 306 Z", P["cream"], INK, D)
    for wx in (640, 653, 666):
        h += rect(wx, 284, 10, 14, P["glass"], INK, D) + line(wx + 2, 296, wx + 8, 286, P["glass_hi"], 1.1)
    h += path("M640 306 Q660 330 680 306", P["cream"], INK, D) + path("M632 278 H684", "none", INK, D)
    h += line(684, 262, 684, 248, INK, D) + rect(679, 236, 10, 12, P["glass"], INK, D) + poly([(678, 236), (684, 230), (690, 236)], P["coin"], INK, Hh)
    h += line(600, 262, 676, 252, INK, Hh) + line(600, 268, 676, 258, INK, Hh)                    # the taffrail
    for px in range(606, 676, 10): h += line(px, 271 - (px - 600) * .13, px, 263 - (px - 600) * .13, INK, Hh)
    # the bow: stem, a broken bowsprit, the cathead and the anchor hanging
    bs_end = (110, 268) if old else (86, 258)
    h += tube(f"M188 304 L{bs_end[0]} {bs_end[1]}", P["wood"], 5, D)
    h += poly([(bs_end[0] + 1, bs_end[1] - 3), (bs_end[0] - 6, bs_end[1] - 1), (bs_end[0] - 1, bs_end[1] + 1), (bs_end[0] - 5, bs_end[1] + 4), (bs_end[0] + 2, bs_end[1] + 3)], P["cream"], INK, Hh)
    if not old:
        h += CLS("st-flap", path("M120 266 Q132 290 126 312 L138 300 L134 288 Z", P["cream"], INK, D))    # a rag of jib
    h += line(204, 318, 190, 314, INK, D * 2) + line(190, 314, 190, 336, INK, D)
    anc = line(0, 0, 0, 34, INK, 3.6) + line(0, 0, 0, 34, P["iron"], 1.6) + line(-8, 4, 8, 4, INK, 2.4)
    anc += path("M-12 28 Q0 42 12 28", "none", INK, 3.6) + path("M-12 28 Q0 42 12 28", "none", P["iron"], 1.6)
    anc += poly([(-12, 28), (-15, 22), (-8, 26)], P["iron"], INK, Hh) + poly([(12, 28), (15, 22), (8, 26)], P["iron"], INK, Hh) + circ(0, -2, 2.4, "none", INK, D)
    h += tr(anc, 190, 338, rot=8)
    h += ell(200, 330, 4, 3.4, P["deep"], INK, Hh) + rust(200, 334, 2, 22, 3, seed + 2)
    # on deck: hatches (the spots), the capstan, the wheel, a cask, a coil of rope
    hatch_x = (330, 476, 548)
    for hx in hatch_x:
        hy = S(hx)
        h += rect(hx - 16, hy - 9, 32, 9, P["wood"], INK, D) + rect(hx - 13, hy - 8, 26, 4, P["deep"], None)
        for gx in range(int(hx) - 11, int(hx) + 13, 4): h += line(gx, hy - 8, gx, hy - 4, P["wood"], 1.4)
    h += rect(508, S(508) - 14, 12, 14, P["wood"], INK, D) + ell(514, S(508) - 14, 9, 2.6, shade(P["wood"]), INK, D)
    h += circ(646, 260, 11, "none", INK, D * 1.4) + circ(646, 260, 11, "none", P["wood"], .8)
    for a in range(0, 360, 45):
        c, s_ = math.cos(math.radians(a)), math.sin(math.radians(a))
        h += line(646 + c * 3, 260 + s_ * 3, 646 + c * 15, 260 + s_ * 15, INK, D)
    h += circ(646, 260, 3, P["wood"], INK, Hh) + line(646, 271, 646, 272, INK, D)
    h += rect(378, S(378) - 14, 14, 14, P["wood"], INK, D, rx=4) + line(378, S(378) - 7, 392, S(378) - 7, INK, Hh)
    h += ell(460, S(460) - 3, 10, 3, "none", INK, D) + ell(460, S(460) - 5, 7, 2, "none", INK, Hh)
    if old:
        for x0 in range(200, 680, 60):
            h += path(f"M{x0} {SB} q6 10 0 22 M{x0+8} {SB} q-5 8 2 16", "none", P["weed"], 2.4)
    o += reflection(150, 700, 40, seed, [(hullc, 180, 680), (P["white"] if not old else P["hull_old"], 360, 480)])
    o += foam_line(40, 780, SB + 4, seed, skip=((190, 690),))
    wcp = clip(f'<rect x="-50" y="-50" width="900" height="{SB+51}"/>')
    o += f'<g {wcp}><g transform="rotate({rot} 430 {SB})">{h}</g></g>'
    if v == "reef":
        o += rock_lump(330, SB + 10, 40, 26, seed) + rock_lump(250, SB + 14, 22, 14, seed + 1) + rock_lump(612, SB + 16, 26, 16, seed + 2)
        o += foam_blobs([(296, SB - 4, 20, 5), (360, SB + 2, 16, 4), (240, SB + 6, 12, 3), (590, SB + 6, 16, 4), (640, SB + 8, 12, 3)], seed)
    else:
        o += rock_lump(130, SB + 8, 30, 20, seed) + rock_lump(720, SB + 10, 26, 16, seed + 1)
    a = math.radians(rot)
    R = lambda x, y: (430 + (x - 430) * math.cos(a) - (y - SB) * math.sin(a), SB + (x - 430) * math.sin(a) + (y - SB) * math.cos(a))
    for i, hx in enumerate(hatch_x):
        x, y = R(hx, S(hx) - 6)
        spots.append(dict(k=f"hatch{i}", l="Hatch", x=round(x / 2), y=round(y / 2), ly=-22))
        hy = S(hx)
        ov = rect(hx - 13, hy - 8, 26, 6, P["deep"], INK, D)
        ov += tr(rect(-16, -4, 32, 4, P["wood"], INK, D) + "".join(line(gx, -4, gx, 0, INK, Hh) for gx in range(-12, 14, 4)), hx + 12, hy - 22, rot=-28)
        over[f"hatch{i}"] = f'<g transform="rotate({rot} 430 {SB})">{ov}</g>'
    cx, cy = R(659, 291)
    spots.append(dict(k="cabin", l="Captain's cabin", x=round(cx / 2), y=round(cy / 2), ly=30))
    lit = "".join(rect(wx, 284, 10, 14, P["lamp"], INK, D) for wx in (640, 653, 666)) + rect(679, 236, 10, 12, P["lamp"], INK, D)
    over["cabin"] = f'<g transform="rotate({rot} 430 {SB})">{lit}</g>'
    nx, ny = R(258, S(258) + 48)
    name = dict(x=round(nx / 2, 1), y=round(ny / 2, 1), rot=rot)
    o += debris(seed)
    o += foam_blobs([(196, SB - 1, 16, 3.6), (690, SB, 14, 3.4), (540, SB, 22, 4)], seed + 5)
    o += rowboat(728, SB + 30, True, False)
    return o, over, spots, name

def debris(seed):
    """a barrel from her hold, adrift, and a plank"""
    bar = rect(-16, -10, 32, 20, P["wood"], None, rx=8) + rect(6, -10, 10, 20, shade(P["wood"]), None, rx=4)
    bar += line(-7, -10, -7, 10, P["iron"], 2.4) + line(7, -10, 7, 10, P["iron"], 2.4) + rect(-16, -10, 32, 20, "none", INK, D, rx=8)
    bar += rect(-16, 2, 32, 8, P["refl"], None, op=.35)
    o = CLS("st-bob", tr(bar, 250, SB + 40))
    o += CLS("st-bob", tr(rect(-22, -2.5, 44, 5, "#cbbd9f", INK, D) + line(-8, -2.5, -8, 2.5, INK, Hh), 152, SB + 54, rot=-4))
    return o

def keel_up(o, seed):
    """a hull turned over: copper sheathing in plates, the keel, the rudder on its pintles, a hole stove in"""
    r = random.Random(seed)
    over, spots = {}, []
    dome = f"M150 {SB} Q176 300 420 284 Q664 300 690 {SB} Z"
    o += reflection(150, 690, 34, seed, [(P["copper"], 170, 670), (P["hull"], 160, 680)])
    o += path(dome, P["copper"], None)
    cp = clip(f'<path d="{dome}"/>')
    inner = path(f"M420 284 Q664 300 690 {SB} H560 Q548 330 420 284 Z", shade(P["copper"], .18), None)
    def ydome(x):     # the dome's top at x (good enough for laying plates)
        t = (x - 420) / 270; return 284 + 128 * abs(t) ** 1.8
    rows = 7
    for k in range(1, rows):
        pts = [(x, ydome(x) + k * 14) for x in range(150, 692, 8)]
        inner += poly(pts, "none", shade(P["copper"], .35), Hh, close=False)
        off = 0 if k % 2 else 14
        for x in range(176 + off, 680, 28):
            inner += line(x, ydome(x) + (k - 1) * 14, x, ydome(x) + k * 14, shade(P["copper"], .35), Hh)
    for i in range(16):                                                                   # a few plates greened differently
        x = r.choice(range(190, 660, 28)); k = r.randint(0, rows - 2)
        inner += rect(x + 1, ydome(x) + k * 14 + 1, 26, 12, P["copper2"], None, op=.9)
    for x, y in ((300, 340), (316, 340), (520, 326), (536, 326), (552, 326)):
        inner += circ(x, y, .9, INK, None)                                                  # nail heads, a few only
    inner += path(f"M150 {SB-30} Q420 {SB-46} 690 {SB-30} L690 {SB} H150 Z", P["hull"], None)   # painted wood below the copper
    inner += path(f"M150 {SB-30} Q420 {SB-46} 690 {SB-30}", "none", INK, D)
    inner += path(f"M150 {SB-12} Q420 {SB-26} 690 {SB-12}", "none", INK, Hh)
    inner += rect(150, SB - 14, 540, 14, shade(P["hull"], .3), None, op=.8) + stipple(160, SB - 13, 520, 12, 90, P["white"], 1.4, .8, seed=seed)
    o += f"<g {cp}>{inner}</g>"
    o += path(dome, "none", INK, O)
    kd = "M" + " L".join(f"{x} {F(ydome(x) - 2.5)}" for x in range(196, 650, 8))
    o += path(kd, "none", INK, 7.6) + path(kd, "none", P["wood"], 4)   # the keel
    o += poly([(676, SB), (690, SB - 70), (706, SB - 70), (702, SB)], shade(P["wood"]), INK, O)   # the rudder
    for py in (SB - 60, SB - 36, SB - 12):
        o += rect(684, py, 12, 4, P["copper"], INK, Hh)
    o += rust(700, SB - 64, 2, 22, 4, seed)
    o += path("M640 336 Q636 354 646 372 Q656 356 652 334", "none", INK, Hh)               # a rope still made fast
    brk = [(330, 348), (342, 330), (354, 338), (366, 322), (380, 334), (388, 352), (370, 362), (350, 364)]
    o += poly(brk, P["deep"], INK, D)                                                       # stove in
    for bx in (346, 362, 376):
        o += line(bx, 334, bx, 360, shade(P["wood"], .25), 3.4)
    o += kelp([(200, SB), (420, SB), (610, SB)], seed)
    o += foam_line(40, 780, SB + 4, seed, skip=((150, 690),))
    o += gull(420, 276, 1.0) + gull(470, 284, .9, -1)
    o += rock_lump(110, SB + 8, 26, 18, seed) + rock_lump(740, SB + 10, 24, 14, seed + 1)
    holes = [(270, 340), (520, 322)]
    for i, (x, y) in enumerate(holes):
        spots.append(dict(k=f"hatch{i}", l="Prise a plank", x=x // 2, y=y // 2, ly=-22))
        over[f"hatch{i}"] = (poly([(x - 14, y - 6), (x + 14, y - 8), (x + 13, y + 7), (x - 13, y + 8)], P["deep"], INK, D)
                             + tr(rect(-16, -3, 32, 6, P["copper"], INK, D), x + 8, y - 16, rot=-24))
    cx, cy = 608, 372
    o += circ(cx, cy, 8, P["glass"], INK, D) + circ(cx, cy, 10.5, "none", P["coin"], 1.8) + circ(cx, cy, 11.8, "none", INK, Hh)
    spots.append(dict(k="cabin", l="Captain's cabin", x=cx // 2, y=cy // 2, ly=26))
    over["cabin"] = circ(cx, cy, 8, P["lamp"], INK, D)
    o += debris(seed)
    o += foam_blobs([(156, SB - 1, 14, 3.4), (684, SB, 14, 3.4), (420, SB + 1, 20, 4)], seed + 5)
    o += rowboat(740, SB + 30, True, False)
    return o, over, spots, None

# ================================================================ build
VARIANTS = [("palm", isle), ("rock", isle), ("volcanic", isle), ("lighthouse", isle),
            ("fresh", wreck), ("old", wreck), ("reef", wreck), ("keel", wreck)]

_RECT = re.compile(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9a-fA-F]+)"(?: opacity="([\d.]+)")?/>')
def compact(svg):
    """Merge runs of plain flat rects that share a colour into one path each (draws the same, much smaller)."""
    parts, last, run = [], 0, None
    def flush():
        nonlocal run
        if run:
            fill, op, ds = run
            parts.append(f'<path d="{"".join(ds)}" fill="{fill}"' + (f' opacity="{op}"' if op else "") + "/>"); run = None
    for m in _RECT.finditer(svg):
        if m.start() != last: flush(); parts.append(svg[last:m.start()])
        x, y, w, h, fill, op = m.groups()
        d = f"M{x} {y}h{w}v{h}h-{w}z"
        if run and run[0] == fill and run[1] == op: run[2].append(d)
        else: flush(); run = (fill, op, [d])
        last = m.end()
    flush(); parts.append(svg[last:])
    return "".join(parts)

HALF = lambda s: f'<g transform="scale(.5)">{s}</g>'
def svgdoc(defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="800" height="500"><defs>{defs}</defs>{body}</svg>'

def build():
    out = HERE / "out"; out.mkdir(exist_ok=True)
    fbody = frame()
    fdefs = "".join(DEFS).replace('id="', 'id="frame-').replace("url(#", "url(#frame-")
    fbody = HALF(compact(fbody.replace("url(#", "url(#frame-")))
    bundle = {"frame": dict(defs=fdefs, base=fbody)}
    for i, (v, fn) in enumerate(VARIANTS):
        body, over, spots, name = fn(v, 11 + i * 7)
        defs = "".join(DEFS).replace('id="', f'id="{v}-').replace("url(#", f"url(#{v}-")
        body = HALF(compact(body.replace("url(#", f"url(#{v}-")))
        over = {k: HALF(s.replace("url(#", f"url(#{v}-")) for k, s in over.items()}
        bundle[v] = dict(defs=defs, base=body, over=over, spots=spots, name=name)
        save(svgdoc(fdefs + defs, fbody + body), out / f"{v}.svg")
        save(svgdoc(fdefs + defs, fbody + body + "".join(s for k, s in over.items() if k != "x")), out / f"{v}_used.svg")
    js = ("/* Golden Shore: places up close, drawn with the ware-style-assets skill (tools/ware/places.py).\n"
          "   GENERATED: don't edit; change tools/ware/places.py and run `py tools/ware/places.py`. */\n"
          '"use strict";\nconst PLACEART=' + json.dumps(bundle, separators=(",", ":")) + ";\n")
    dest = HERE.parent.parent / "play" / "js" / "placeart.js"
    dest.write_text(js, encoding="utf-8")
    print(f"wrote {dest} ({len(js)//1024} KB) and {len(VARIANTS)*2} review SVGs")

if __name__ == "__main__":
    build()
