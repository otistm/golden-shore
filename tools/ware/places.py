"""places.py - places up close (isles and wrecks), drawn with the ware-style-assets skill.

Each place variant is a side-on elevation on a 400 x 250 canvas, waterline at y=206 (the
baseline the game's tap spots are placed against). For each variant this writes:
  base   the scene: grained sky, far shore, sea, the place, foam, your rowboat
  over   overlays the game shows once a spot is used (pennant, tripod, dug chest, lamp lit,
         open hatches, lit cabin), plus 'x' (the dig mark before digging)
  spots  where the tap spots sit
  name   where the ship's name board is (the game letters the name, since it changes per voyage)
and bundles them into play/js/placeart.js (generated: don't edit by hand; run this script).

Run:   py tools/ware/places.py           (writes tools/ware/out/*.svg and play/js/placeart.js)
Look:  node tools/ware/review.mjs        (renders tools/ware/out/review.png on paper, mid and dark)

Animated parts carry the game's stepped-animation classes (st-foam, st-sway, st-smoke, st-steam,
st-flap, st-bob, st-crab, st-beam); styles.css moves them.
"""
import sys, json, math, random
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from ware import *

# ---- palette: "golden shore, fair day" (built per palettes.md: ambient pair, materials pulled
# toward it, shade() for planes, one deep, one accent family: brick red; lamp yellow when lit)
AMB = "#efe2c6"
P = dict(
    sky_top="#9db9c1", sky_low="#f1e4c8", cloud="#f6eedd", far="#b9c8c5", far2="#a8b9b7",
    sea_top="#97b2b6", sea_bot="#5f8089", dash="#c4d6d6",
    sand=mix("#e3cf9e", AMB, .15), sand_wet=mix("#c6ad79", AMB, .1), bsand="#57514c",
    hill=mix("#9fae80", AMB, .15), rock=mix("#b1a698", AMB, .12), ash="#6c6560",
    leaf="#7d9558", leaf_rim="#b8c24e", trunk="#8a6a4c",
    wood="#a57a51", hull=mix("#8f5a43", AMB, .08), hull_old="#6f6a5d", copper="#7c9d8e",
    wall="#e9dfc8", roof="#5f6f7c", stone="#cfc4b6",
    brick="#c4553b", lamp="#f5cf62", white="#f4efe3", cream="#e8dfc9",
    deep="#262321", weed="#6d7a55", seal="#6c737c", coin="#e2b04a", iron="#5a6670",
)
SB = 206                     # the baseline (waterline)
W = Weights(final_px=1.1, outline_px=2.0)   # drawn ~1.1x on a phone (scene ~440px wide)
WW, HH = 400, 250
CLS = lambda c, s: f'<g class="{c}">{s}</g>'

# ---------------------------------------------------------------- shared frame
def frame(seed):
    r = random.Random(seed)
    o = grain_rect(0, 0, WW, 119, [(0, P["sky_top"]), (1, P["sky_low"])], grain=0.45, seed=seed)
    o += circ(64, 48, 15, mix(P["lamp"], P["sky_low"], .45), None)                     # a pale sun, no outline
    o += flat_cloud(120, 250, 74, 7, P["cloud"], seed + 1) + flat_cloud(262, 380, 98, 5, P["cloud"], seed + 2)
    # the far shore: flat, no outline, palest
    fl = 40 + r.uniform(0, 40); fr = 290 + r.uniform(0, 40)
    o += path(f"M{f(fl-70)} 118 Q{f(fl-30)} 104 {f(fl+10)} 110 Q{f(fl+40)} 100 {f(fl+90)} 118 Z", P["far"], None)
    o += path(f"M{f(fr-50)} 118 Q{f(fr-10)} 98 {f(fr+40)} 108 Q{f(fr+80)} 104 {f(fr+120)} 118 Z", P["far2"], None)
    o += sea(WW, HH, 118, P["sea_top"], P["sea_bot"], P["dash"], seed=seed + 5, density=.42)
    return o

def foam(x0, x1, y, seed):
    return CLS("st-foam", foam_dashes(x0, x1, y, seed, P["white"], (6, 18), (12, 30)))

def reflection(d, op=.18):
    """the place's flat dark reflection on the water, mirrored about the waterline, no outline"""
    return f'<g transform="translate(0 {2*SB}) scale(1 -1)" opacity="{op}">{path(d, P["deep"], None)}</g>'

def rowboat(x, y, flip=False):
    hullc = P["hull"]
    s = poly([(-22, -8), (22, -8), (16, 2), (-16, 2)], hullc, INK, W.outline)
    s += poly([(-19, -3), (19, -3), (16, 2), (-16, 2)], shade(hullc), None)
    s += poly([(-22, -8), (22, -8), (16, 2), (-16, 2)], "none", INK, W.outline)
    s += line(-10, -8, -10, -3, INK, W.detail) + line(8, -8, 8, -3, INK, W.detail)
    s += line(14, -8, 28, -18, INK, W.detail)       # an oar shipped over the side
    s += poly([(26, -19), (32, -23), (34, -20), (28, -16)], P["wood"], INK, W.hair)
    return tr(s, x, y, sx=-1 if flip else None)

def pennant(x, y, h=24):
    s = line(0, 0, 0, -h, INK, W.detail)
    s += CLS("st-flag", poly([(0, -h), (14, -h + 4.5), (0, -h + 9)], P["brick"], INK, W.detail))
    return tr(s, x, y)

def tripod(x, y):
    s = line(0, -16, -7, 0, INK, W.detail) + line(0, -16, 7, 0, INK, W.detail) + line(0, -16, 0, 0, INK, W.hair)
    s += rect(-6, -23, 12, 7, P["wood"], INK, W.detail, rx=1) + line(6, -20, 11, -20, INK, W.outline)
    return tr(s, x, y)

def crab(x, y):
    s = path("M-6 0 Q0 -8 6 0 Z", P["brick"], INK, W.detail)
    for a, b in [(-6, -1), (6, -1)]:
        s += line(a, b, a + (4 if a > 0 else -4), b - 4, INK, W.hair)
    s += line(-4, 0, -7, 3, INK, W.hair) + line(4, 0, 7, 3, INK, W.hair)
    s += circ(-2, -5, .9, INK, None) + circ(2, -5, .9, INK, None)
    return tr(CLS("st-crab", s), x, y)

def gull(x, y, s=1.0):
    b = path("M-5 0 Q0 -6 5 0 Z", P["white"], INK, W.hair) + circ(3.4, -4, 2, P["white"], INK, W.hair)
    b += poly([(5.2, -4.2), (8, -3.6), (5.2, -3.2)], P["coin"], None)
    return tr(b, x, y, s)

def dug(x, y):
    s = ell(0, 1, 17, 4.2, P["deep"], None)
    s += rect(-9, -10, 18, 9, P["wood"], INK, W.detail) + poly([(-9, -10), (-6, -19), (12, -19), (9, -10)], shade(P["wood"]), INK, W.detail)
    s += line(-9, -6, 9, -6, INK, W.hair)
    s += circ(-2, -11, 2.4, P["coin"], INK, W.hair) + circ(3, -12, 2.4, P["coin"], INK, W.hair)
    s += line(19, 2, 25, -20, INK, W.outline) + poly([(15, 0), (19, -6), (25, -4), (23, 2)], P["iron"], INK, W.hair)
    return tr(s, x, y)

def xmark(x, y):
    return line(x - 8, y - 6, x + 8, y + 6, P["brick"], 3) + line(x + 8, y - 6, x - 8, y + 6, P["brick"], 3)

def palm(x, y, h, lean, seed, s=1.0):
    r = random.Random(seed)
    tx, ty = lean, -h
    o = path(f"M-4 0 Q{f(tx/2-3)} {f(ty/2)} {f(tx-2)} {f(ty)} h5 Q{f(tx/2+3)} {f(ty/2)} 5 0 Z", P["trunk"], INK, W.detail)
    for i in range(1, 6):                                          # trunk rings, hairline
        t = i / 6; px = tx * t * t * .6 + tx * t * .4
        o += line(px - 3.4, ty * t, px + 3.4, ty * t + .8, INK, W.hair)
    fr = ""
    def frond(a, ln, col):
        c, sn = math.cos(a), math.sin(a)
        ex, ey = c * ln, sn * ln * .7 + abs(c) * ln * .28
        d = f"M0 0 Q{f(ex*.5-sn*8)} {f(ey*.5-12)} {f(ex)} {f(ey)} Q{f(ex*.5+sn*4)} {f(ey*.5-2)} 0 0 Z"
        return path(d, col, INK, W.detail) + path(f"M0 0 Q{f(ex*.5-sn*5)} {f(ey*.5-8)} {f(ex)} {f(ey)}", "none", INK, W.hair)
    for a in (-2.6, -.5):
        fr += frond(a + r.uniform(-.1, .1), 23, shade(P["leaf"], .22))
    for a in (-3.1, -1.95, -1.15, 0):
        fr += frond(a + r.uniform(-.1, .1), 26, P["leaf"])
    fr += circ(-3, 3, 2.6, shade(P["wood"]), INK, W.hair) + circ(2.5, 4, 2.6, shade(P["wood"]), INK, W.hair)
    o += tr(CLS("st-sway", fr), tx + .5, ty)
    return tr(o, x, y, s)

def rock_lump(x, y, w, h, col=None):
    col = col or P["rock"]
    pts = [(-w, 0), (-w * .6, -h), (w * .3, -h * 1.1), (w, -h * .3), (w, 0)]
    s = poly(pts, col, INK, W.outline)
    s += poly([(w * .3, -h * 1.1), (w, -h * .3), (w, 0), (w * .1, 0)], shade(col), None)
    s += poly(pts, "none", INK, W.outline, close=False)
    return tr(s, x, y)

def beach(black=False):
    sc, wet = (P["bsand"], shade(P["bsand"], .25)) if black else (P["sand"], P["sand_wet"])
    d = f"M40 {SB} Q200 {SB-12} 360 {SB} L352 {SB+14} Q200 {SB+24} 48 {SB+14} Z"
    s = path(d, sc, INK, W.outline)
    s += path(f"M50 {SB+10} Q200 {SB+20} 350 {SB+10} L352 {SB+14} Q200 {SB+24} 48 {SB+14} Z", wet, None)
    s += path(d, "none", INK, W.outline)
    s += stipple(70, SB - 2, 270, 10, 26, "#f6efdc" if black else shade(P["sand"], .3), 1.2, .6, seed=7)
    # a shell and a bit of driftwood: the shore's litter
    s += path(f"M232 {SB+6} q3 -4 6 0 z", P["white"], INK, W.hair)
    s += line(150, SB + 8, 166, SB + 5, P["wood"], 2.4) + line(150, SB + 8, 166, SB + 5, INK, W.hair)
    return s

# ---------------------------------------------------------------- isles
def isle(v, seed):
    reset()
    o = frame(seed)
    spots, over = [], {}
    if v == "rock":
        outline = [(104, SB), (126, 138), (150, 126), (166, 86), (192, 58), (214, 64), (232, 96), (254, 92), (274, 138), (300, SB)]
        o += reflection(pts_d(outline))
        o += beach()
        o += poly(outline, P["rock"], INK, W.outline)
        o += poly([(214, 64), (232, 96), (254, 92), (274, 138), (300, SB), (244, SB), (236, 150), (222, 110)], shade(P["rock"], .2), None)
        o += poly([(166, 86), (192, 58), (200, 92), (178, 118)], shade(P["rock"], .4), None)
        o += poly([(186, 132), (196, 126), (200, 146), (188, 150)], P["deep"], None)          # a sea cave: the near-black mass
        o += poly(outline, "none", INK, W.outline, close=False)
        for a, b, c, d in [(136, 160, 150, 166), (146, 182, 166, 186), (240, 160, 256, 156), (250, 184, 268, 186), (196, 120, 208, 124)]:
            o += line(a, b, c, d, INK, W.detail)                                               # strata
        for a, b, c, d in [(178, 76, 182, 92), (196, 62, 194, 82), (226, 92, 222, 108), (252, 96, 254, 110)]:
            o += line(a, b, c, d, P["white"], 3)                                               # guano runs straight down
        for gx, gy in [(172, 82), (198, 56), (230, 90), (256, 88), (150, 124)]:
            o += gull(gx, gy, .9)
        o += tr(path("M-16 0 q2 -10 14 -10 q8 0 10 -6 q6 2 4 8 q-2 6 -8 8 z", P["seal"], INK, W.detail)
                + circ(9, -12, .9, INK, None) + line(-16, 0, -22, -3, INK, W.detail) + line(-16, 0, -22, 3, INK, W.detail), 280, SB - 2)
        spots.append(dict(k="peak", l="Climb to the peak", x=192, y=50))
        over["peak"] = pennant(194, 58, 22)
    elif v == "volcanic":
        cone = [(88, SB), (176, 76), (222, 76), (316, SB)]
        o += reflection(pts_d(cone))
        o += beach(black=True)
        o += poly(cone, P["ash"], INK, W.outline)
        o += poly([(208, 70), (222, 76), (316, SB), (254, SB)], shade(P["ash"], .25), None)
        for a, b, c, d in [(184, 84, 154, 154), (170, 110, 160, 136), (232, 92, 258, 152), (244, 130, 256, 160)]:
            o += line(a, b, c, d, INK, W.detail)                                               # ridges
        o += ell(199, 77, 22, 4.5, P["deep"], INK, W.detail)                                   # the crater mouth
        lava = f"M200 79 l-5 30 9 22 -7 30 5 {SB-165}"
        o += path(lava, "none", INK, 7.2) + path(lava, P["brick"], "none") + f'<path d="{lava}" fill="none" stroke="{P["brick"]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        o += ell(199, 77, 14, 2.6, P["brick"], None)
        o += rock_lump(150, SB - 2, 9, 8, P["ash"]) + rock_lump(268, SB - 2, 8, 7, P["ash"])
        o += CLS("st-smoke", smoke(201, 66, 18, -40, 70, 7, 20, "#b9b3ab", .85, seed=4, lift=.2))
        o += CLS("st-steam", smoke(200, SB, 6, -14, 22, 3, 7, P["white"], .8, seed=9, lift=.1))
        o += tr(line(0, 0, -2, -18, INK, W.outline) + line(-2, -10, -8, -16, INK, W.detail) + line(-1, -14, 4, -19, INK, W.detail), 128, SB - 4)   # a burnt tree
        spots.append(dict(k="peak", l="Climb to the peak", x=198, y=66))
        over["peak"] = pennant(212, 74, 22)
    else:
        lh = v == "lighthouse"
        top = 136 if lh else 118
        hill = f"M70 {SB} C108 {top+40} 168 {top} 214 {top} C266 {top+2} 300 {top+40} 330 {SB} Z"
        o += reflection(hill)
        o += beach()
        o += path(hill, P["hill"], INK, W.outline)
        o += path(f"M214 {top} C266 {top+2} 300 {top+40} 330 {SB} H268 C268 {top+50} 244 {top+14} 214 {top} Z", shade(P["hill"], .2), None)
        o += path(hill, "none", INK, W.outline)
        o += grass_tufts(110, 300, top + 6, 9, seed, shade(P["hill"], .35), 5, W.hair) if False else ""
        for i in range(9):                                                              # a grass edge along the crest
            x = 110 + i * 20; y = top + ((x - 214) / 110) ** 2 * 58
            o += line(x, y + 1, x - 2, y - 4, INK, W.hair) + line(x + 3, y + 1, x + 4, y - 5, INK, W.hair)
        o += rock_lump(84, SB + 2, 14, 10) + rock_lump(318, SB + 2, 12, 8)
        if lh:
            x, b = 262, 150
            t = poly([(-12, 0), (-9, -72), (9, -72), (12, 0)], P["wall"], INK, W.outline)
            t += poly([(3, -72), (9, -72), (12, 0), (5, 0)], shade(P["wall"], .16), None)
            t += poly([(-11.2, -18), (-10.5, -30), (10.5, -30), (11.2, -18)], P["brick"], None)
            t += poly([(-10, -46), (-9.5, -56), (9.5, -56), (10, -46)], P["brick"], None)
            t += poly([(-12, 0), (-9, -72), (9, -72), (12, 0)], "none", INK, W.outline)
            t += path("M-4 0 v-11 q4 -4 8 0 v11 z", P["deep"], INK, W.detail)                  # the door: near-black
            t += rect(-14, -76, 28, 4, P["cream"], INK, W.detail) + railing(-14, 14, -76, 6, 5, W.hair)
            t += window(-7, -88, 14, 12, 2, 1, P["cream"], P["deep"], None, W.detail, False, False)
            t += poly([(-9, -88), (9, -88), (0, -98)], P["roof"], INK, W.outline)
            t += line(0, -98, 0, -106, INK, W.detail) + line(-4, -104, 4, -104, INK, W.hair)
            o += tr(t, x, b)
            c = rect(-16, -18, 32, 18, P["wall"], INK, W.outline)
            c += poly([(-20, -18), (0, -32), (20, -18)], P["roof"], INK, W.outline) + poly([(0, -32), (20, -18), (6, -18)], shade(P["roof"]), None)
            c += window(-12, -13, 9, 8, 1, 1, P["cream"], P["deep"], None, W.hair, True, False)
            c += rect(4, -11, 7, 11, P["deep"], INK, W.detail) + rect(9, -38, 5, 8, P["stone"], INK, W.detail)
            o += tr(c, 222, 156)
            o += path(f"M240 {SB-2} l6 -10 l-2 -12 l8 -10 l-2 -10", "none", INK, W.hair, extra='stroke-dasharray="3 4"')
            o += palm(140, 170, 40, -6, seed)
            spots.append(dict(k="light", l="Relight the lamp", x=262, y=66))
            lit = tr(rect(-7, -88, 14, 12, P["lamp"], INK, W.detail) + line(0, -88, 0, -76, INK, W.hair), x, b)
            beam = tr(CLS("st-beam", poly([(0, 0), (-92, -13), (-92, 13)], P["lamp"], None, op=.42) + poly([(0, 0), (92, -13), (92, 13)], P["lamp"], None, op=.42)), x, b - 82)
            cot = tr(rect(-12, -13, 9, 8, P["lamp"], INK, W.hair), 222, 156)
            over["light"] = lit + beam + cot
        else:
            o += palm(146, 168, 44, -8, seed) + palm(178, 150, 56, -4, seed + 1, 1.05) + palm(250, 152, 48, 8, seed + 2) + palm(292, 180, 30, 10, seed + 3, .9)
            spots.append(dict(k="peak", l="Climb to the peak", x=214, y=110))
            over["peak"] = pennant(216, 118, 22)
    # every isle: the surveying flag, a dig mark (the game decides if this isle has one), the crab, your boat, foam
    o += pennant(108, SB + 4, 26)
    spots.append(dict(k="survey", l="Survey the isle", x=108, y=186, ly=-28))
    over["survey"] = tripod(126, SB + 6)
    spots.append(dict(k="dig", l="Dig here", x=292, y=212, ly=-22))
    over["x"] = xmark(292, 212)
    over["dig"] = dug(292, SB + 12)
    if v != "rock":
        o += crab(204, SB + 9)
    o += foam(30, 370, SB + 16, seed)
    o += rowboat(338, SB + 16)
    return o, over, spots, None

# ---------------------------------------------------------------- wrecks
def wreck(v, seed):
    reset()
    o = frame(seed)
    over, spots = {}, []
    old = v == "old"
    hullc = P["hull_old"] if old else P["hull"]
    o += rock_lump(66, SB + 4, 16, 12) + rock_lump(344, SB + 6, 14, 10)
    name = None
    if v == "keel":
        dome = f"M76 {SB} Q90 156 210 142 Q330 156 344 {SB} Z"
        o += reflection(dome, .14)
        o += path(dome, P["copper"], INK, W.outline)
        o += path(f"M210 142 Q330 156 344 {SB} H276 Q268 164 210 142 Z", shade(P["copper"], .2), None)
        o += path(f"M84 {SB-14} Q210 {SB-34} 336 {SB-14} L344 {SB} H76 Z", hullc, INK, W.detail)   # painted wood below the copper
        o += path(f"M262 {SB-24} Q300 {SB-22} 336 {SB-14} L344 {SB} H262 Z", shade(hullc), None)
        o += path(dome, "none", INK, W.outline)
        o += path("M104 172 q106 -34 212 0", "none", INK, W.detail) + path("M96 186 q114 -30 228 0", "none", INK, W.detail)
        for x in range(136, 300, 26):                                                       # copper plate seams
            y = 144 + ((x - 210) / 134) ** 2 * 48
            o += line(x, y + 4, x, y + 13, INK, W.hair)
        o += path("M110 162 Q150 144 210 142 Q270 144 310 162", "none", INK, 6.4) + path("M110 162 Q150 144 210 142 Q270 144 310 162", "none", P["wood"], 3.2)  # the keel
        o += poly([(336, SB), (346, SB - 34), (353, SB - 34), (350, SB)], shade(P["wood"]), INK, W.outline)   # rudder
        o += rust_streaks(348, SB - 30, 2, 16, 3, seed, op=.7)
        for x0 in (110, 200, 300):
            o += path(f"M{x0} {SB} q4 10 -2 18", "none", P["weed"], 2.4)
        o += gull(222, 124)
        hatches = [(170, 164), (250, 160)]
        cabin = (304, 186)
    else:
        rot = -8 if v == "reef" else -4
        h = ""
        outline = f"M86 {SB} L90 170 Q94 156 108 154 L292 150 L300 130 L336 126 L342 {SB} Z"
        h += path(outline, hullc, INK, W.outline)
        h += rect(89, 182, 253, SB - 182, shade(hullc, .2), None) + poly([(318, 128), (336, 126), (342, SB), (322, SB)], shade(hullc, .2), None)
        h += path(outline, "none", INK, W.outline)
        h += path("M100 166 Q200 162 296 162 L338 160", "none", INK, W.outline) + line(90, 182, 339, 182, INK, W.outline)  # wales
        for yy in (172, 176, 190, 196):                                                     # a few plank seams, near the waterline
            h += line(96, yy, 338, yy, INK, W.hair, op=.6)
        for x in (140, 166, 192, 218):                                                      # gunports, lids raised
            h += rect(x, 168, 9, 8, P["deep"], INK, W.detail) + poly([(x, 168), (x - 2, 162), (x + 11, 162), (x + 13, 168)], hullc, INK, W.hair)
            h += rust_streaks(x + 4.5, 177, 1, 9, 2, seed + x, op=.6)
        brk = [(238, SB), (240, SB - 16), (248, SB - 22), (252, SB - 32), (261, SB - 26), (268, SB - 34), (274, SB - 24), (282, SB - 22), (284, SB)]
        h += poly(brk, P["deep"], INK, W.detail)                                            # the breach: near-black, ribs showing
        for x, top in ((248, 18), (258, 24), (268, 22), (278, 14)):
            h += line(x, SB - 1, x, SB - top, P["wood"], 3.2) + line(x - 1.6, SB - top, x + 1.6, SB - top, INK, W.hair)
        h += poly([(108, 154), (122, 146), (288, 146), (292, 150)], P["cream"], INK, W.detail)   # the deck, seen from a little above
        h += path("M300 130 L304 122 H334 L336 126", "none", INK, W.detail)
        for i in range(3):
            h += rect(308 + i * 8, 134, 6, 8, P["deep"], INK, W.hair)                       # stern gallery windows
        h += line(304, 146, 336, 146, INK, W.detail)
        h += line(108, 154, 74, 144, INK, W.outline) + line(84, 147, 80, 141, INK, W.detail)  # the broken bowsprit
        h += path("M200 150 l-6 -44 l3 -6 l-6 -4", "none", INK, 4) + line(196, 112, 266, 102, INK, W.outline)   # the mast, snapped
        sail = poly([(262, 102), (280, 100), (284, 140), (280, 146), (275, 141), (271, 148), (266, 142), (262, 146)], P["cream"] if old else P["white"], INK, W.detail)
        sail += poly([(272, 101), (280, 100), (284, 140), (280, 146), (276, 141)], shade(P["white"], .12), None)
        sail += line(270, 112, 279, 111, INK, W.hair) + line(268, 126, 279, 125, INK, W.hair)
        h += CLS("st-flap", sail)
        h += path("M194 104 q30 30 72 0", "none", INK, W.hair) + path("M194 104 Q150 130 110 152", "none", INK, W.hair) + path("M194 106 Q240 120 300 130", "none", INK, W.hair)
        h += rect(232, 153, 44, 10, P["cream"], INK, W.detail, rx=1.5)                      # the name board (lettered by the game)
        if old:
            for x0, y0 in ((110, 200), (180, 204), (280, 204)):
                h += path(f"M{x0} {y0} q6 10 0 18", "none", P["weed"], 2.4)
            h += stipple(100, 186, 220, 16, 24, P["white"], 1.4, .8, seed=seed)              # barnacles
        o += reflection(f"M86 {SB} L90 170 Q94 156 108 154 L292 150 L300 130 L336 126 L342 {SB} Z", .12)
        o += f'<g transform="rotate({rot} 210 {SB})">{h}</g>'
        if v == "reef":
            o += rock_lump(176, SB + 6, 22, 16)
            o += CLS("st-foam", foam_dashes(140, 220, SB + 2, seed + 3, P["white"], (3, 8), (8, 16)))
        a = math.radians(rot)
        R = lambda x, y: (round(210 + (x - 210) * math.cos(a) - (y - SB) * math.sin(a)), round(SB + (x - 210) * math.sin(a) + (y - SB) * math.cos(a)))
        hatches = [R(x, 146) for x in (170, 215, 260)]
        cabin = R(316, 138)
        name = dict(x=R(254, 158)[0], y=R(254, 158)[1] + 2.6, rot=rot)
    for i, (x, y) in enumerate(hatches):
        spots.append(dict(k=f"hatch{i}", l="Hatch", x=x, y=y, ly=-22))
        over[f"hatch{i}"] = tr(rect(-7, -3, 14, 6, P["deep"], INK, W.detail) + poly([(-7, -3), (-11, -12), (3, -12), (7, -3)], P["wood"], INK, W.detail), x, y + 2)
    spots.append(dict(k="cabin", l="Captain's cabin", x=cabin[0], y=cabin[1], ly=26 if v == "keel" else 30))
    over["cabin"] = (tr(rect(-3, -4, 6, 8, P["lamp"], INK, W.hair), cabin[0], cabin[1]) if v != "keel"
                     else tr(circ(0, 0, 5, P["lamp"], INK, W.detail), cabin[0], cabin[1]))
    # a barrel from her hold, adrift
    bar = rect(-11, -7, 22, 14, P["wood"], INK, W.detail, rx=6) + rect(4, -7, 7, 14, shade(P["wood"]), None, rx=3) + line(-5, -7, -5, 7, INK, W.hair) + line(5, -7, 5, 7, INK, W.hair)
    o += CLS("st-bob", tr(bar, 126, SB + 20))
    o += foam(30, 370, SB + 4, seed)
    o += rowboat(356, SB + 20, True)
    return o, over, spots, name

# ---------------------------------------------------------------- build
VARIANTS = [("palm", isle), ("rock", isle), ("volcanic", isle), ("lighthouse", isle),
            ("fresh", wreck), ("old", wreck), ("reef", wreck), ("keel", wreck)]

import re
_RECT = re.compile(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9a-fA-F]+)"(?: opacity="([\d.]+)")?/>')
def compact(svg):
    """Merge runs of plain dots and dashes (grain, sea dashes, foam) that share a colour into one path each.
    It draws exactly the same and keeps the bundle small for phones."""
    parts = []
    last = 0
    run = None   # (fill, op, [d...])
    def flush():
        nonlocal run
        if run:
            fill, op, ds = run
            parts.append(f'<path d="{"".join(ds)}" fill="{fill}"' + (f' opacity="{op}"' if op else "") + "/>")
            run = None
    for m in _RECT.finditer(svg):
        if m.start() != last:
            flush(); parts.append(svg[last:m.start()])
        x, y, w, h, fill, op = m.groups()
        d = f"M{x} {y}h{w}v{h}h-{w}z"
        if run and run[0] == fill and run[1] == op: run[2].append(d)
        else:
            flush(); run = (fill, op, [d])
        last = m.end()
    flush(); parts.append(svg[last:])
    return "".join(parts)

def build():
    out = HERE / "out"; out.mkdir(exist_ok=True)
    bundle = {}
    for i, (v, fn) in enumerate(VARIANTS):
        body, over, spots, name = fn(v, 11 + i * 7)
        defs = "".join(DEFS).replace('id="', f'id="{v}-').replace("url(#", f"url(#{v}-")
        body = compact(body.replace("url(#", f"url(#{v}-"))
        over = {k: s.replace("url(#", f"url(#{v}-") for k, s in over.items()}
        bundle[v] = dict(w=WW, h=HH, defs=defs, base=body, over=over, spots=spots, name=name)
        # a review copy with every overlay on
        full = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WW} {HH}" width="{WW}" height="{HH}"><defs>{defs}</defs>{body}</svg>'
        used = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WW} {HH}" width="{WW}" height="{HH}"><defs>{defs}</defs>{body}{"".join(s for k, s in over.items() if k != "x")}</svg>'
        save(full, out / f"{v}.svg"); save(used, out / f"{v}_used.svg")
    js = ("/* Golden Shore: places up close, drawn with the ware-style-assets skill (tools/ware/places.py).\n"
          "   GENERATED: don't edit; change tools/ware/places.py and run `py tools/ware/places.py`. */\n"
          '"use strict";\nconst PLACEART=' + json.dumps(bundle, separators=(",", ":")) + ";\n")
    dest = HERE.parent.parent / "play" / "js" / "placeart.js"
    dest.write_text(js, encoding="utf-8")
    print(f"wrote {dest} ({len(js)//1024} KB) and {len(VARIANTS)*2} review SVGs")

if __name__ == "__main__":
    build()
