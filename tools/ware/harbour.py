"""harbour.py - the harbour panorama, drawn with the ware-style-assets skill.

Drawn at 2560 x 640 with the Cora Lee line weights (outline 1.9, detail 1.1, hair 0.7) and halved
into the game's 1280 x 320 harbour (harbour.js keeps its places, tap areas and signs where they were).
Writes play/js/harbourart.js (generated: don't edit by hand; run this script):
  frame   sky, sun, far shore and sea. Its colours are CSS variables (--hk-*) so the weather
          recolours it (styles.css); everything else keeps the day's palette
  clouds  flat cloud bands (game units) that harbour.js sets drifting
  back    the quay wall, bunting, the lamp post, a coil of rope
  docks, market, tavern, wright   each place's drawing
  over    what changes with the port's state: fish (a crate of your catch), good0-3 (goods on the
          counter), face0-3 (a lit window with a hand looking for work), crate0-2 (fittings)

Run:   py tools/ware/harbour.py
Look:  writes tools/ware/out/harbour.svg (everything shown) ; node tools/ware/shot.mjs to render it
"""
import sys, json, math, random, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "scripts"))
from ware import *
import places as PL
from places import F, rects_path, foam_blobs, rust, gull, O, D, Hh, CLS

W2, H2 = 2560, 640
HZ, GR, QB = 336, 476, 556          # horizon, the quay's ground line, the foot of the quay wall
# the weather-driven colours are written as sentinels, then swapped for CSS variables
SENT = {"#a10001": "hk-sky1", "#a10002": "hk-sky2", "#a10003": "hk-sky3", "#a10004": "hk-sky4", "#a10005": "hk-grain",
        "#a10006": "hk-grain2", "#a10007": "hk-sun", "#a10008": "hk-far", "#a10009": "hk-far2", "#a1000a": "hk-sea1",
        "#a1000b": "hk-sea2", "#a1000c": "hk-dash", "#a1000d": "hk-glint", "#a1000e": "hk-cloud"}
K = {v: k for k, v in SENT.items()}
C = dict(
    wall="#e3d3b8", trim="#f1e7d3", roof="#5d6e7c", win="#3b4454", winhi="#6a8290", lit="#e8c46e",
    door="#7b5a49", wood="#b98e64", wood2="#9a7350", crate="#d7ba8e", iron="#3d4247", deep="#252220",
    market="#c27866", tavern="#d8b05e", tavern_roof="#7c5848", wright="#9dae8a",
    awn="#f3e9d6", stripe="#b5533c", flag2="#d9a93a", hull="#9c5e48", quay="#b7a7a0", stone="#cec0b8",
    rope="#c9b48a", sack="#e6d8b8", apple="#b5533c", weed="#5f7150", cream="#ebe2cb", skin="#d9a982",
)
SUNX = 240

def wall_courses(x0, x1, ys, sw=Hh):
    return "".join(line(x0, y, x1, y, INK, sw * .8) for y in ys)

# ================================================================ frame (weather-coloured)
def frame():
    r = random.Random(3)
    o = rect(0, 0, W2, HZ + 2, lingrad([(0, K["hk-sky1"]), (.5, K["hk-sky2"]), (.86, K["hk-sky3"]), (1, K["hk-sky4"])]), None)
    o += stipple(0, 0, W2, HZ, 1200, K["hk-grain"], 1.4, .55, lambda u, v: v ** 2.2, seed=3)
    o += stipple(0, 0, W2, HZ, 700, K["hk-grain2"], 1.4, .45, lambda u, v: (1 - v) ** 3, seed=4)
    o += f'<g class="hk-sun">{circ(SUNX, 116, 40, K["hk-sun"], None)}</g>'
    # the far shore: a headland with a lighthouse, a low point to the east, a sail; flat, no outline
    o += path(f"M260 {HZ} Q330 {HZ-30} 420 {HZ-24} Q520 {HZ-56} 640 {HZ-48} Q760 {HZ-40} 860 {HZ-22} Q930 {HZ-10} 980 {HZ} Z", K["hk-far"], None)
    o += path(f"M560 {HZ} Q640 {HZ-26} 760 {HZ-20} Q860 {HZ-16} 920 {HZ} Z", K["hk-far2"], None)
    o += poly([(357, HZ - 26), (359, HZ - 56), (367, HZ - 56), (369, HZ - 26)], K["hk-far2"], None)         # far lighthouse
    o += rect(356, HZ - 62, 14, 6, K["hk-far2"], None) + poly([(357, HZ - 62), (363, HZ - 68), (369, HZ - 62)], K["hk-far2"], None)
    o += path(f"M1900 {HZ} Q2000 {HZ-18} 2140 {HZ-14} Q2300 {HZ-26} 2440 {HZ-12} Q2520 {HZ-6} 2560 {HZ-4} V{HZ} Z", K["hk-far"], None)
    for sx in (944, 2300):
        o += poly([(sx, HZ - 2), (sx + 5, HZ - 24), (sx + 10, HZ - 2)], K["hk-far2"], None) + rect(sx - 4, HZ - 3, 18, 3, K["hk-far2"], None)
    o += rect(0, HZ, W2, H2 - HZ, lingrad([(0, K["hk-sea1"]), (1, K["hk-sea2"])]), None)
    dash, glint = [], []
    k, y = 0, HZ + 3.0
    while y < H2 + 10:
        n = int(80 - (y - HZ) * .12) + 14
        th = .9 + (y - HZ) * .011
        for _ in range(n):
            x = r.uniform(-20, W2 + 20)
            L = 5 + (y - HZ) * .2 * r.uniform(.5, 1.4)
            near = abs(x - SUNX) < 110 - (y - HZ) * .5
            (glint if near and r.random() < .85 else dash).append((x, y, L, th))
        k += 1; y = HZ + 3 * (1.15 ** k)
    o += rects_path(dash, K["hk-dash"], .75) + rects_path(glint, K["hk-glint"], .85)
    o += line(0, HZ, W2, HZ, INK, 1.4)
    return o

def clouds():
    """flat cloud bands in game units, each from its own (0,0): harbour.js sets them drifting"""
    out = []
    for i, (w, hgt) in enumerate(((150, 5), (110, 4), (190, 6), (90, 3.5), (130, 5))):
        rr = random.Random(40 + i); d = "M0 0"; x = 0
        while x < w:
            st = rr.uniform(14, 30)
            d += f" Q{F(x + st/2)} {F(-hgt - rr.uniform(0, hgt*.8))} {F(min(x + st, w))} {F(-hgt*.35)}"; x += st
        out.append(d + f" L{w} 0 Z")
    return out

# ================================================================ the quay and the life along it
def back():
    r = random.Random(9)
    o = ""
    wd = f"M476 {QB} V{GR+12} Q476 {GR} 492 {GR} H{W2} V{QB} Z"
    o += path(f"M476 {QB} Q1500 {QB+30} {W2} {QB} V{QB+34} Q1500 {QB+50} 476 {QB+30} Z", "#3a565e", None, op=.45)   # its reflection
    o += path(wd, C["quay"], None)
    cp = clip(f'<path d="{wd}"/>')
    inner = stone_courses(476, GR + 12, W2 - 476, QB - GR - 12, 17, C["quay"], 8, Hh)
    inner += rect(476, QB - 14, W2 - 476, 14, shade(C["quay"], .35), None, op=.9)                    # wet stone where the tide reaches
    inner += stipple(480, QB - 13, W2 - 480, 12, 260, C["cream"], 1.4, .8, seed=5)
    o += f"<g {cp}>{inner}</g>"
    o += rect(476, GR, W2 - 476, 12, C["stone"], INK, D) + "".join(line(x, GR, x, GR + 12, INK, Hh) for x in range(520, W2, 64))   # coping
    o += path(wd, "none", INK, O)
    for rx in (1010, 1690, 2120):                                                                       # mooring rings, rust under them
        o += circ(rx, GR + 32, 6, "none", INK, 3.2) + circ(rx, GR + 32, 6, "none", C["iron"], 1.6) + rust(rx, GR + 40, 2, 18, 4, rx)
    o += CLS("st-foam", rects_path([(x, QB + r.uniform(-1, 2), r.uniform(10, 30), 2) for x in range(500, W2, 48)], "#f6f1e6", .9))
    for kx in range(560, W2, 230):
        o += path(f"M{kx} {QB} q6 12 -2 22 M{kx+9} {QB} q-5 9 2 16", "none", C["weed"], 2.4)
    # bunting from the market's eave to the tavern
    a, b = (848, 300), (1100, 268)
    o += path(f"M{a[0]} {a[1]} Q{(a[0]+b[0])/2} {a[1]+60} {b[0]} {b[1]}", "none", INK, Hh)
    for i in range(1, 9):
        t = i / 9; x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * (a[0] + b[0]) / 2 + t * t * b[0]
        y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * (a[1] + 60) + t * t * b[1]
        o += poly([(x - 9, y), (x + 9, y), (x, y + 18)], C["stripe"] if i % 2 else C["flag2"], INK, Hh)
    # the lamp post between market and tavern
    lx = 1048
    o += rect(lx - 3, 364, 6, GR - 364, C["iron"], INK, D) + rect(lx - 8, GR - 8, 16, 8, C["iron"], INK, D)
    o += poly([(lx - 12, 360), (lx + 12, 360), (lx + 8, 334), (lx - 8, 334)], C["win"], INK, D) + line(lx - 2, 358, lx + 6, 338, C["winhi"], 1.2)
    o += poly([(lx - 12, 334), (lx, 322), (lx + 12, 334)], C["iron"], INK, D) + circ(lx, 319, 2.4, C["iron"], INK, Hh)
    # a coil of rope by the workshop
    o += ell(2190, GR - 4, 20, 6, C["rope"], INK, D) + ell(2190, GR - 7, 13, 3.6, "none", INK, Hh) + ell(2190, GR - 8, 6, 1.6, C["deep"], None)
    o += path(f"M2170 {GR-4} q-12 2 -20 6", "none", INK, D)
    return o

# ================================================================ docks
def barrel(x, y, s=1.0):
    b = path("M-16 0 C-20 -14 -20 -30 -16 -44 H16 C20 -30 20 -14 16 0 Z", C["wood"], None)
    b += path("M4 0 C6 -14 6 -30 4 -44 H16 C20 -30 20 -14 16 0 Z", C["wood2"], None)
    for yy in (-8, -36): b += line(-18, yy, 18, yy, C["iron"], 2.6)
    for xx in (-8, 0, 8): b += path(f"M{xx} 0 C{xx*1.15} -14 {xx*1.15} -30 {xx} -44", "none", INK, Hh * .7)
    b += path("M-16 0 C-20 -14 -20 -30 -16 -44 H16 C20 -30 20 -14 16 0 Z", "none", INK, D)
    b += ell(0, -44, 16, 4, shade(C["wood"], .1), INK, D)
    return tr(b, x, y, s)

def crate(x, y, w, h, col=None):
    col = col or C["crate"]
    s = rect(x, y - h, w, h, col, None) + rect(x + w - 6, y - h, 6, h, shade(col, .18), None)
    s += rect(x + 3, y - h + 3, w - 6, h - 6, "none", INK, Hh) + line(x + 3, y - h + 3, x + w - 3, y - 3, INK, Hh)
    s += rect(x, y - h, w, h, "none", INK, D)
    return s

def docks():
    o = ""
    piles = (60, 170, 280, 390)
    # the shadow of the deck on the water, then the piles and their reflections
    o += poly([(28, 472), (480, 472), (480, 500), (28, 506)], "#2f474e", None, op=.5)
    for px in piles:
        o += path(f"M{px-6} 604 " + " ".join(f"L{F(px + 4*math.sin(y*.3))} {y}" for y in range(612, 650, 6)) + f" L{px+6} 640 L{px+6} 604 Z", "#2f474e", None, op=.55)
    for i in range(len(piles) - 1):                                                                 # cross bracing
        a, b = piles[i], piles[i + 1]
        o += line(a + 6, 486, b - 6, 560, INK, 3.4) + line(a + 6, 486, b - 6, 560, C["wood2"], 1.6)
        o += line(b - 6, 486, a + 6, 560, INK, 3.4) + line(b - 6, 486, a + 6, 560, C["wood2"], 1.6)
    for px in piles:
        o += rect(px - 7, 470, 14, 134, C["wood"], None) + rect(px + 2, 470, 5, 134, C["wood2"], None)
        o += rect(px - 7, 584, 14, 20, shade(C["wood"], .4), None)                                     # wet and weedy at the waterline
        o += rect(px - 7, 470, 14, 134, "none", INK, D) + line(px - 7, 520, px + 7, 520, C["iron"], 2.2)
        o += path(f"M{px-6} 600 q-4 8 0 14 M{px+3} 600 q4 6 1 12", "none", C["weed"], 2)
        o += foam_blobs([(px, 603, 11, 2.6)], px)
    # the deck: a lit top seen from a little above, the plank ends along the front
    o += poly([(20, 452), (482, 452), (476, 444), (26, 444)], tint(C["wood"], .2), INK, D)
    o += rect(20, 452, 462, 20, C["wood"], None) + rect(20, 464, 462, 8, C["wood2"], None)
    o += "".join(line(x, 452, x, 472, INK, Hh) for x in range(44, 482, 24))
    o += rect(20, 452, 462, 20, "none", INK, D)
    # a rail at the far end, a net hung over it with floats
    o += rect(30, 404, 6, 48, C["wood"], INK, D) + rect(132, 404, 6, 48, C["wood"], INK, D) + rect(26, 400, 116, 6, C["wood"], INK, D)
    net = "M34 406 Q60 446 86 410 Q112 444 136 406"
    o += path(net + " L136 430 Q86 470 34 430 Z", "none", INK, Hh)
    for nx in range(42, 132, 10): o += line(nx, 408, nx + 4, 440, INK, Hh * .6)
    for fx in (52, 86, 118): o += circ(fx, 446 - (fx == 86) * 8, 4, C["cream"], INK, Hh)
    # barrels, a crate, a lobster pot, a bollard with a rope to the boat
    o += barrel(184, 452) + barrel(222, 452, .9) + crate(250, 452, 40, 30)
    o += path("M326 452 V430 Q346 410 366 430 V452 Z", "#c8b58e", INK, D) + "".join(line(x, 452, x, 426 + abs(x - 346) * .2, INK, Hh) for x in range(332, 364, 6))
    o += path("M326 438 Q346 432 366 438", "none", INK, Hh)
    o += rect(452, 432, 16, 20, C["iron"], INK, D) + ell(460, 432, 11, 4, C["iron"], INK, D)
    o += path("M468 444 Q470 500 300 556", "none", INK, D)                                               # the painter
    # a rod over the end of the pier, its line to a bobber
    o += line(46, 444, 6, 380, INK, 3) + line(46, 444, 6, 380, C["wood"], 1.4)
    o += path("M6 380 Q-2 470 14 560", "none", INK, Hh) + circ(14, 562, 4, C["stripe"], INK, Hh)
    # the post that holds the sign
    o += rect(261, 340, 6, 112, C["wood"], INK, D) + rect(240, 336, 48, 6, C["wood"], INK, D)
    # the rowboat, moored
    o += CLS("hboat", PL.tr(PL.rowboat(0, 0, False, False), 160, 572, 1.7))
    return o

def fish_crate():
    s = crate(300, 452, 52, 26)
    for i, (fx, fy) in enumerate(((310, 428), (324, 424), (336, 430))):
        s += path(f"M{fx-8} {fy} Q{fx} {fy-8} {fx+8} {fy} Q{fx} {fy+6} {fx-8} {fy} Z", "#c9d3d4", INK, Hh) + poly([(fx + 8, fy), (fx + 14, fy - 5), (fx + 14, fy + 5)], "#c9d3d4", INK, Hh)
        s += circ(fx - 4, fy - 1, .9, INK, None)
    return s

# ================================================================ market
def market():
    x0, x1, ex, ry, ax = 564, 844, 300, 216, 704
    o = ""
    gable = [(x0, GR), (x0, ex), (ax, ry), (x1, ex), (x1, GR)]
    o += poly(gable, C["market"], None)
    o += wall_courses(x0, x1, (312, 324, 336, 448, 460))
    o += poly([(580, 328), (828, 328), (828, 348), (580, 348)], shade(C["market"], .25), None)          # the awning's shadow on the wall
    o += rect(x0, GR - 16, x1 - x0, 16, C["stone"], INK, D)                                              # stone plinth
    o += poly(gable, "none", INK, O)
    o += path(f"M{x0-12} {ex+8} L{ax} {ry-8} L{x1+12} {ex+8}", "none", INK, 6.4) + path(f"M{x0-12} {ex+8} L{ax} {ry-8} L{x1+12} {ex+8}", "none", C["roof"], 3.6)   # bargeboards
    # the loft door, a hoist beam over it with a pulley and a rope
    o += rect(672, 236, 64, 58, C["wood2"], INK, D) + line(704, 236, 704, 294, INK, Hh) + line(672, 266, 736, 266, INK, Hh)
    o += rect(668, 294, 72, 5, C["trim"], INK, Hh)
    o += rect(696, 214, 76, 8, C["wood"], INK, D) + circ(766, 230, 6, C["wood2"], INK, D)
    o += line(763, 230, 763, 300, INK, Hh) + line(769, 230, 769, 276, INK, Hh) + path("M769 276 q0 7 -5 7 q-4 0 -4 -4", "none", INK, D)
    # the awning: a striped canopy with a scalloped valance, two poles
    o += rect(600, 328, 6, GR - 16 - 328, C["iron"], INK, D) + rect(802, 328, 6, GR - 16 - 328, C["iron"], INK, D)
    can = [(574, 330), (834, 330), (812, 282), (596, 282)]
    o += poly(can, C["awn"], None)
    cp = clip(f'<path d="{pts_d(can)}"/>')
    st = ""
    for i in range(10):
        if i % 2: continue
        t0, t1 = i / 10, (i + 1) / 10
        st += poly([(574 + 260 * t0, 330), (574 + 260 * t1, 330), (596 + 216 * t1, 282), (596 + 216 * t0, 282)], C["stripe"], None)
    o += f"<g {cp}>{st}</g>" + poly(can, "none", INK, D)
    val = f"M574 330 " + " ".join(f"Q{574 + 13 + 26*i} 346 {574 + 26*(i+1)} 330" for i in range(10)) + " Z"
    o += path(val, C["stripe"], INK, D)
    # the counter
    o += rect(592, 424, 224, GR - 16 - 424, C["wood"], None) + rect(592, 424, 224, 6, tint(C["wood"], .2), None)
    o += "".join(line(592, y, 816, y, INK, Hh) for y in (440, 452)) + rect(592, 424, 224, GR - 16 - 424, "none", INK, D)
    # a lamp hanging under the awning
    o += CLS("hlamp", line(616, 346, 616, 360, INK, D) + poly([(608, 360), (624, 360), (622, 378), (610, 378)], C["win"], INK, D) + rect(606, 356, 20, 4, C["iron"], INK, Hh))
    # the board out front: an A-frame slate (the game chalks on it)
    o += line(866, GR, 880, 390, INK, 2.6) + line(946, GR, 932, 390, INK, 2.6)
    o += rect(856, 392, 100, 52, C["deep"], INK, D) + rect(852, 388, 108, 60, "none", C["wood"], 3) + rect(850, 386, 112, 64, "none", INK, Hh)
    # the bracket that holds the sign above the ridge
    o += line(ax, ry - 8, ax, 150, INK, 3) + line(ax - 22, 152, ax + 22, 152, INK, 2.6)
    o += tufts_tuple(560, 850)
    return o

def tufts_tuple(x0, x1):
    return PL.tufts_on(lambda x: GR, x0, x1, 7, int(x0))

def goods():
    g = []
    g.append(crate(612, 424, 40, 30))
    g.append(path("M688 424 C680 410 684 392 692 388 L706 386 C714 392 718 410 710 424 Z", C["sack"], INK, D) + path("M690 392 Q700 396 708 390", "none", INK, Hh) + line(694, 388, 704, 386, INK, D))
    g.append(barrel(752, 424, .72))
    g.append(path("M776 424 L780 404 H812 L816 424 Z", "#c8a26a", INK, D) + "".join(line(x, 404, x - 1 if x < 796 else x + 1, 424, INK, Hh * .7) for x in range(784, 812, 6))
             + "".join(circ(784 + i * 7, 401 - (i % 2) * 3, 4.6, C["apple"], INK, Hh) for i in range(5)))
    return g

# ================================================================ tavern
def tavern():
    o = ""
    hx0, hx1 = 1096, 1276
    arch = f"M{hx0} {GR} V256 C{hx0} 176 {hx1} 176 {hx1} 256 V{GR} Z"
    o += path(arch, C["tavern"], None)
    o += wall_courses(hx0, hx1, (276, 290, 452, 464))
    o += path(arch, "none", INK, O)
    o += path(f"M{hx0-10} 258 C{hx0-10} 160 {hx1+10} 160 {hx1+10} 258", "none", INK, 12.6) + path(f"M{hx0-10} 258 C{hx0-10} 160 {hx1+10} 160 {hx1+10} 258", "none", C["tavern_roof"], 9)   # the vaulted roof's edge
    # the door: arched planks, iron straps, a ring, a step
    door = "M1148 476 V404 C1148 376 1224 376 1224 404 V476 Z"
    o += path(door, C["door"], None) + path("M1186 476 V384 C1206 386 1224 392 1224 404 V476 Z", shade(C["door"], .18), None)
    o += "".join(line(x, 384 if 1160 < x < 1212 else 396, x, 476, INK, Hh) for x in (1167, 1186, 1205))
    o += line(1150, 418, 1222, 418, C["iron"], 3) + line(1150, 456, 1222, 456, C["iron"], 3)
    o += path(door, "none", INK, D) + circ(1196, 436, 6, "none", INK, 2.4) + rect(1140, GR - 6, 92, 6, C["stone"], INK, Hh)
    # a plaque with an arrow over the door
    o += rect(1152, 186, 68, 26, C["trim"], INK, D, rx=3) + path("M1166 199 H1202 M1194 192 L1204 199 L1194 206", "none", INK, 2.2)
    # the hanging sign: a tankard
    o += line(hx0, 304, 1060, 304, INK, 3) + line(hx0, 296, 1078, 304, INK, Hh)
    sign = rect(1040, 316, 60, 44, C["tavern_roof"], INK, D, rx=4) + rect(1044, 320, 52, 36, "none", C["trim"], 1.2, rx=3)
    sign += path("M1058 328 H1078 V350 H1058 Z", C["trim"], INK, D) + path("M1078 332 Q1088 332 1088 339 Q1088 346 1078 346", "none", INK, D) + path("M1056 328 Q1068 320 1080 328", C["cream"], INK, Hh)
    o += CLS("hswing", line(1048, 304, 1048, 316, INK, D) + line(1092, 304, 1092, 316, INK, D) + sign)
    # the long wing: a planked roof, round windows, a chimney, a notice
    wx0, wx1 = 1276, 1732
    o += rect(wx0, 284, wx1 - wx0, GR - 284, shade(C["tavern"], .1), None)
    o += wall_courses(wx0, wx1, (300, 316, 432, 448, 464))
    o += rect(wx0, 284, wx1 - wx0, GR - 284, "none", INK, O)
    o += rect(wx0 - 4, 232, wx1 - wx0 + 12, 52, C["tavern_roof"], None) + rect(wx0 - 4, 264, wx1 - wx0 + 12, 20, shade(C["tavern_roof"], .2), None)
    o += "".join(line(x, 232, x, 284, INK, Hh * .8) for x in range(wx0 + 8, wx1, 36))
    o += rect(wx0 - 4, 232, wx1 - wx0 + 12, 52, "none", INK, O) + rect(wx0 - 12, 280, wx1 - wx0 + 28, 6, C["trim"], INK, D)
    for cx in (1348, 1448, 1548, 1648):
        o += circ(cx, 368, 24, C["trim"], INK, D) + circ(cx, 368, 17, C["win"], INK, D) + line(cx - 9, 376, cx + 7, 358, C["winhi"], 1.4)
        for a in range(0, 360, 60):
            o += circ(cx + 20.5 * math.cos(math.radians(a)), 368 + 20.5 * math.sin(math.radians(a)), 1.3, INK, None)
    o += rect(1648, 184, 26, 48, C["market"], INK, D) + rect(1644, 178, 34, 8, shade(C["market"], .2), INK, D) + line(1648, 200, 1674, 200, INK, Hh) + line(1648, 216, 1674, 216, INK, Hh)
    o += CLS("smoke", smoke(1661, 170, 70, -80, 120, 6, 18, "#b8b6b0", .7, seed=4, lift=.2))
    o += rect(1684, 390, 32, 40, C["cream"], INK, D) + "".join(line(1690, y, 1710 - (y % 3), y, INK, Hh * .7) for y in (400, 408, 416)) + circ(1700, 393, 1.6, C["stripe"], None)
    # the mast on the roof: a yard with its sail furled, shrouds, a flag
    mx = 1520
    o += line(mx - 160, 232, mx, 92, INK, Hh) + line(mx + 160, 232, mx, 92, INK, Hh)
    o += poly([(mx - 5, 232), (mx - 3, 72), (mx + 3, 72), (mx + 5, 232)], C["wood"], INK, D) + circ(mx, 68, 3.6, C["wood"], INK, Hh)
    o += PL.tube(f"M{mx-96} 112 L{mx+96} 112", C["wood"], 4, D)
    o += path(f"M{mx-90} 114 Q{mx-60} 136 {mx} 128 Q{mx+60} 136 {mx+90} 114 Z", C["cream"], INK, D)
    for gx in range(mx - 72, mx + 80, 24): o += line(gx, 114, gx + 2, 130, INK, Hh)
    o += CLS("hflag", poly([(mx + 2, 64), (mx + 40, 72), (mx + 2, 82)], C["stripe"], INK, D))
    # a wall lamp, a barrel with the cat on it, tufts by the door
    o += CLS("hlamp", line(1732, 304, 1758, 304, INK, 2.4) + line(1752, 304, 1752, 318, INK, D) + poly([(1744, 318), (1760, 318), (1757, 342), (1747, 342)], C["win"], INK, D))
    o += barrel(1252, GR, .9)
    cat = path("M1240 436 C1236 420 1242 408 1250 406 L1252 396 L1256 404 L1260 404 L1264 396 L1265 408 C1272 414 1272 428 1266 436 Z", C["deep"], None)
    cat += path("M1266 434 C1280 434 1284 424 1276 416", "none", C["deep"], 3.4) + circ(1253, 412, 1, "#e8c46e", None) + circ(1260, 412, 1, "#e8c46e", None)
    o += CLS("hcat", cat)
    o += PL.tufts_on(lambda x: GR, 1104, 1140, 3, 7) + PL.tufts_on(lambda x: GR, 1290, 1400, 4, 8)
    o += line(1186, 186, 1186, 150, INK, 3) + line(1164, 152, 1208, 152, INK, 2.6)              # the sign's bracket
    return o

def face(cx):
    s = circ(cx, 368, 17, C["lit"], INK, D)
    cp = clip(f'<circle cx="{cx}" cy="368" r="16"/>')
    fig = path(f"M{cx-14} 388 Q{cx-12} 372 {cx-2} 372 Q{cx+8} 372 {cx+10} 388 Z", C["deep"], None)
    fig += path(f"M{cx-8} 368 Q{cx-9} 356 {cx-2} 355 Q{cx+5} 356 {cx+5} 362 L{cx+7} 364 L{cx+4} 365 Q{cx+3} 370 {cx-3} 370 Z", C["deep"], None)
    fig += path(f"M{cx-10} 357 Q{cx-3} 349 {cx+4} 356 L{cx+9} 356 L{cx+4} 358 Z", C["deep"], None)
    s += f'<g {cp}>' + fig + "</g>"
    s += circ(cx, 368, 17, "none", INK, D)
    return s

# ================================================================ shipwright
def wright():
    o = ""
    # the slipway: a ramp of sleepers from the quay's edge down into the water; the hull sits level on stocks
    ry = lambda x: GR + (2210 - x) * .3
    o += poly([(1780, ry(1780)), (2210, GR), (2210, GR + 14), (1780, ry(1780) + 14)], C["wood2"], None)
    o += poly([(1780, ry(1780)), (2210, GR), (2204, GR - 8), (1774, ry(1774) - 8)], tint(C["wood"], .1), INK, D)
    for x in range(1800, 2200, 30):
        o += rect(x - 4, ry(x) - 8, 8, 22, C["wood"], INK, Hh)
    o += poly([(1780, ry(1780)), (2210, GR), (2210, GR + 14), (1780, ry(1780) + 14)], "none", INK, D)
    o += poly([(1770, ry(1770) + 14), (1960, ry(1960) + 14), (1960, ry(1960) + 40), (1770, 640)], "#2f474e", None, op=.45)
    hb = lambda x: 452 + (520 - 452) * math.sin(math.pi * (x - 1870) / 300) if 1870 <= x <= 2170 else 452
    for sx in (1904, 1964, 2024, 2084, 2140):                                                          # stocks
        o += rect(sx - 6, hb(sx) - 6, 12, ry(sx) - 8 - hb(sx) + 6, C["wood"], INK, D) + rect(sx - 12, ry(sx) - 14, 24, 6, C["wood2"], INK, Hh)
    hull = "M1870 452 C1902 526 2112 528 2170 470 L2182 430 H1858 Z"
    o += path(hull, C["hull"], None)
    cp = clip(f'<path d="{hull}"/>')
    inner = "".join(path(f"M1852 {440+k*11} C1912 {470+k*11} 2102 {470+k*9} 2192 {436+k*9}", "none", shade(C["hull"], .2), D * .9) for k in range(1, 8))
    inner += rect(2022, 420, 170, 34, "#f0e6d0", None)                                                  # aft, the planking isn't on yet
    o += f"<g {cp}>{inner}</g>"
    for rx in range(2032, 2182, 16):                                                                   # ribs showing
        rp = f"M{rx} 430 C{rx-2} 450 {rx-4} 470 {rx-10} {492 - (rx-2032)*.12}"
        o += path(rp, "none", INK, 5.4) + path(rp, "none", C["wood"], 3)
    o += path(hull, "none", INK, O) + line(1858, 430, 2182, 430, C["cream"], 3) + line(1858, 428, 2182, 428, INK, Hh)
    o += line(2022, 430, 2022, 330, INK, 4) + line(2022, 430, 2022, 330, C["wood"], 2) + line(2022, 346, 2082, 384, INK, D)   # a mast stepped, a stay
    o += line(1904, 470, 1932, 400, INK, 2.4) + line(1920, 470, 1948, 400, INK, 2.4)                  # a ladder against her
    for i in range(1, 6): o += line(1904 + i * 5.6, 470 - i * 14, 1920 + i * 5.6, 470 - i * 14, INK, 1.6)
    o += path(f"M1950 {ry(1950)-8} l12 0 l2 -16 l-16 0 Z", C["deep"], INK, D)                         # a pot of pitch
    o = tr(o, 16, 0)
    # the workshop: a curved roof, an arched window, ledged-and-braced doors, tools on the wall
    x0, x1 = 2220, 2540
    o += rect(x0, 276, x1 - x0, GR - 276, C["wright"], None) + rect(2472, 300, 68, GR - 300, shade(C["wright"], .16), None)
    o += wall_courses(x0, x1, (300, 314, 440, 456))
    o += rect(x0, 276, x1 - x0, GR - 276, "none", INK, O)
    roof = "M2200 280 C2240 220 2520 220 2560 280 Z"
    o += path(roof, C["roof"], None) + path("M2380 234 C2460 238 2530 252 2560 280 H2380 Z", shade(C["roof"], .2), None)
    o += path("M2232 262 C2280 236 2480 236 2528 262", "none", INK, Hh) + path(roof, "none", INK, O)
    o += path("M2274 398 V350 C2274 318 2330 318 2330 350 V398 Z", C["trim"], INK, D) + path("M2280 394 V352 C2280 326 2324 326 2324 352 V394 Z", C["win"], INK, D)
    o += line(2302, 330, 2302, 394, INK, D) + line(2280, 360, 2324, 360, INK, D) + line(2288, 384, 2298, 366, C["winhi"], 1.3)
    o += rect(2392, 364, 68, GR - 364, C["door"], None) + rect(2426, 364, 34, GR - 364, shade(C["door"], .18), None)
    o += "".join(line(x, 364, x, GR, INK, Hh) for x in (2409, 2426, 2443))
    o += line(2392, 384, 2460, 384, INK, D) + line(2392, 456, 2460, 456, INK, D) + line(2394, 454, 2424, 386, INK, D) + line(2428, 454, 2458, 386, INK, D)
    o += rect(2392, 364, 68, GR - 364, "none", INK, D) + circ(2444, 420, 2.6, C["iron"], None)
    o += rect(2350, 320, 52, 5, C["wood"], INK, D) + rect(2356, 306, 8, 14, C["iron"], INK, Hh) + rect(2384, 310, 6, 10, C["iron"], INK, Hh)   # a shelf of clamps
    o += path("M2484 340 L2524 340 L2524 352 L2490 360 Z", "#c9cdd0", INK, D) + rect(2470, 336, 16, 12, C["wood"], INK, D)    # a saw
    o += "".join(line(2490 + i * 5, 354 - i * .8, 2492 + i * 5, 358 - i * .8, INK, Hh) for i in range(7))
    o += line(2498, 384, 2498, 420, INK, 3) + line(2498, 384, 2498, 420, C["wood"], 1.4) + poly([(2490, 382), (2510, 380), (2508, 388), (2492, 390)], "#c9cdd0", INK, D)   # an adze
    # timber stacked by the door, a sawhorse with a plank on it
    for i in range(4):
        o += rect(2476 + (i % 2) * 6, GR - 12 - i * 10, 48, 10, C["wood"] if i % 2 else tint(C["wood"], .12), INK, D) + circ(2482 + (i % 2) * 6, GR - 7 - i * 10, 2.6, "none", INK, Hh)
    # the board by the slipway (the game chalks your hull on it), the sign's bracket on the roof
    o += line(1786, GR, 1786, 452, INK, 2.6) + line(1850, GR, 1850, 452, INK, 2.6)
    o += rect(1770, 396, 96, 56, C["deep"], INK, D) + rect(1766, 392, 104, 64, "none", C["wood"], 3) + rect(1764, 390, 108, 68, "none", INK, Hh)
    o += line(2380, 228, 2380, 176, INK, 3) + line(2358, 178, 2402, 178, INK, 2.6)
    o += PL.tufts_on(lambda x: GR, 2300, 2380, 3, 9)
    return o

def fit_crate(i):
    x = 2232 + i * 50
    return crate(x, GR, 42, 30, "#d7ba8e") + rect(x + 14, GR - 22, 14, 6, C["stripe"], INK, Hh)

# ================================================================ build
def swap_vars(svg):
    svg = re.sub(r'fill="(#a100[0-9a-f]{2})"', lambda m: f'style="fill:var(--{SENT[m.group(1)]})"', svg)
    return re.sub(r'stop-color="(#a100[0-9a-f]{2})"', lambda m: f'style="stop-color:var(--{SENT[m.group(1)]})"', svg)

HALF = lambda s: f'<g transform="scale(.5)">{s}</g>'
def build():
    reset()
    parts = dict(frame=frame(), back=back(), docks=docks(), market=market(), tavern=tavern(), wright=wright())
    over = dict(fish=fish_crate())
    for i, g in enumerate(goods()): over[f"good{i}"] = g
    for i, cx in enumerate((1348, 1448, 1548, 1648)): over[f"face{i}"] = face(cx)
    for i in range(3): over[f"crate{i}"] = fit_crate(i)
    defs = swap_vars("".join(DEFS).replace('id="', 'id="hb-').replace("url(#", "url(#hb-"))
    fix = lambda s: HALF(swap_vars(PL.compact(s.replace("url(#", "url(#hb-"))))
    bundle = {k: fix(v) for k, v in parts.items()}
    bundle["over"] = {k: fix(v) for k, v in over.items()}
    bundle["defs"] = defs
    bundle["clouds"] = clouds()
    js = ("/* Golden Shore: the harbour, drawn with the ware-style-assets skill (tools/ware/harbour.py).\n"
          "   GENERATED: don't edit; change tools/ware/harbour.py and run `py tools/ware/harbour.py`. */\n"
          '"use strict";\nconst HARBOURART=' + json.dumps(bundle, separators=(",", ":")) + ";\n")
    (HERE.parent.parent / "play" / "js" / "harbourart.js").write_text(js, encoding="utf-8")
    # a review copy with everything shown and the fair-day colours filled in
    fair = ":root{--hk-sky1:#86a9b4;--hk-sky2:#b2c4be;--hk-sky3:#e8d6b0;--hk-sky4:#f0cf9c;--hk-grain:#f6e5c8;--hk-grain2:#62808c;--hk-sun:#f5dc9a;--hk-far:#b6c6c1;--hk-far2:#a3b6b3;--hk-sea1:#8eabaf;--hk-sea2:#4e6f79;--hk-dash:#b7cdcf;--hk-glint:#f2dcae;--hk-cloud:#f5ead4}"
    cl = "".join(f'<path d="{d}" style="fill:var(--hk-cloud)" transform="translate({x} {y})"/>' for d, (x, y) in zip(bundle["clouds"], ((250, 64), (470, 34), (820, 80), (1040, 50), (1210, 86))))
    body = bundle["frame"] + cl + bundle["back"] + bundle["docks"] + bundle["market"] + bundle["tavern"] + bundle["wright"] + "".join(bundle["over"].values())
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" width="2560" height="640"><style>{fair}</style><defs>{defs}</defs><g stroke="none">{body}</g></svg>'
    (HERE / "out").mkdir(exist_ok=True)
    save(svg, HERE / "out" / "harbour.svg")
    print(f"wrote play/js/harbourart.js ({len(js)//1024} KB) and tools/ware/out/harbour.svg")

if __name__ == "__main__":
    build()
