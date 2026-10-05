"""interiors.py - the insides of the market, tavern and shipwright, drawn with the ware-style-assets skill.

These rooms stretch to any screen, so each is drawn as seamless tiles (SVG pattern contents) that the
game repeats: drawn at 2x with the Cora Lee line weights and halved, so a tile's w and h are game pixels.
Writes play/js/interiorart.js (INTERIORART, generated: don't edit; run `py tools/ware/interiors.py`):
  market  awn (the awning's edge), wall (two shelves of stock, repeats down), table (the counter's planks)
  wright  beam (the roof beam), wall (a board wall hung with tools, repeats down), bench (the workbench)
  tavern  wall (the back bar: shelves, bottles, tankards, lamps between the seats; 720 wide = three seats),
          bar (the bar top and its panelled front with a brass rail), floor, and snippets: mug, tipped
Look:  writes tools/ware/out/interiors.svg (every tile repeated a few times)
"""
import sys, json, math, random
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "scripts"))
from ware import *
import places as PL
from places import F, O, D, Hh, rects_path

C = dict(
    plaster="#eed8be", plaster2="#e2c9ab", wood="#b98e64", wood2="#9a7350", woodlt="#d9b48a", woodlt2="#c49d72",
    crate="#d7ba8e", sack="#e6d8b8", glass="#7f9f8f", glass2="#5e7f73", amber="#b07a3e", jar="#b4c6ce",
    brick="#b5533c", cream="#f3e9d6", iron="#3d4247", steel="#c9cdd0", brass="#c9a35a", apple="#b5533c",
    cloth1="#5d6e7c", cloth2="#9dae8a", cloth3="#d8b05e", deep="#252220", rope="#c9b48a", sage="#dce3cb",
    board="#c8b08a", board2="#b39a73", mustard="#e7cf93", panel="#8e6a4b", panel2="#7a5a3e", bartop="#b98e64",
    floor="#b7a7a0", pewter="#a9b2b6", foam="#f6f1e6", candle="#f1e7d3", onion="#d9a96a",
)

def shelf(x0, x1, y, col=None):
    col = col or C["wood"]
    s = rect(x0, y, x1 - x0, 12, col, None) + rect(x0, y + 8, x1 - x0, 4, shade(col, .2), None) + rect(x0, y, x1 - x0, 12, "none", INK, D)
    for bx in (x0 + 30, x1 - 30):
        s += path(f"M{bx-4} {y+12} H{bx+4} V{y+20} L{bx-4} {y+36} Z", shade(col, .1), INK, D)
    return s

def crate(x, y, w, h, col=None, mark=True):
    col = col or C["crate"]
    s = rect(x, y - h, w, h, col, None) + rect(x + w - 8, y - h, 8, h, shade(col, .18), None)
    s += line(x, y - h * .5, x + w, y - h * .5, INK, Hh)
    if mark: s += line(x + w * .3, y - h * .82, x + w * .55, y - h * .62, C["brick"], 2) + line(x + w * .55, y - h * .82, x + w * .3, y - h * .62, C["brick"], 2)
    s += rect(x, y - h, w, h, "none", INK, D)
    return s

def sack(x, y, w, h):
    d = f"M{x} {y} C{x-4} {y-h*.5} {x+w*.15} {y-h*.9} {x+w*.3} {y-h} L{x+w*.7} {y-h} C{x+w*.85} {y-h*.9} {x+w+4} {y-h*.5} {x+w} {y} Z"
    s = path(d, C["sack"], None) + path(f"M{x+w*.62} {y} C{x+w*.8} {y-h*.5} {x+w*.75} {y-h*.85} {x+w*.7} {y-h} C{x+w*.85} {y-h*.9} {x+w+4} {y-h*.5} {x+w} {y} Z", shade(C["sack"], .14), None)
    s += path(d, "none", INK, D) + line(x + w * .3, y - h + 6, x + w * .7, y - h + 6, INK, 2.2)
    s += path(f"M{x+w*.28} {y-h} q-6 -10 2 -12 M{x+w*.72} {y-h} q6 -10 -2 -12", "none", INK, D)
    return s

def jar(x, y, w, h, col, lab=True):
    s = rect(x, y - h, w, h, col, None, rx=5) + rect(x + w * .62, y - h, w * .38, h, shade(col, .16), None, rx=4)
    s += rect(x + 3, y - h - 7, w - 6, 8, C["wood2"], INK, D, rx=2)
    if lab: s += rect(x + 4, y - h * .62, w - 8, h * .3, C["cream"], INK, Hh)
    s += line(x + 5, y - h + 6, x + 5, y - h * .7, "#ffffff", 1.6, op=.7) + rect(x, y - h, w, h, "none", INK, D, rx=5)
    return s

def bottle(x, y, h, col, lab=None):
    w = h * .32
    d = f"M{x} {y} V{y-h*.55} Q{x} {y-h*.7} {x+w*.3} {y-h*.75} V{y-h} H{x+w*.7} V{y-h*.75} Q{x+w} {y-h*.7} {x+w} {y-h*.55} V{y} Z"
    s = path(d, col, None) + rect(x + w * .62, y - h * .55, w * .38, h * .55, shade(col, .2), None)
    if lab: s += rect(x + 2, y - h * .45, w - 4, h * .22, lab, INK, Hh)
    s += rect(x + w * .28, y - h - 5, w * .44, 6, C["wood"], INK, Hh)
    s += line(x + 3, y - h * .5, x + 3, y - h * .15, "#ffffff", 1.4, op=.6) + path(d, "none", INK, D)
    return s

def barrel(x, y, s=1.0):
    return PL.tr(path("M-16 0 C-20 -14 -20 -30 -16 -44 H16 C20 -30 20 -14 16 0 Z", C["wood"], None)
                 + path("M4 0 C6 -14 6 -30 4 -44 H16 C20 -30 20 -14 16 0 Z", C["wood2"], None)
                 + line(-18, -8, 18, -8, C["iron"], 2.6) + line(-18, -36, 18, -36, C["iron"], 2.6)
                 + path("M-16 0 C-20 -14 -20 -30 -16 -44 H16 C20 -30 20 -14 16 0 Z", "none", INK, D)
                 + ell(0, -44, 16, 4, shade(C["wood"], .1), INK, D), x, y, s)

def lantern(x, y, s=1.0, lit=False):
    l = rect(-9, -30, 18, 24, C["deep"] if not lit else "#e8c46e", None) + line(-9, -18, 9, -18, INK, Hh)
    l += rect(-9, -30, 18, 24, "none", INK, D) + rect(-11, -6, 22, 6, C["iron"], INK, D) + poly([(-11, -30), (0, -40), (11, -30)], C["iron"], INK, D)
    l += circ(0, -43, 3, "none", INK, D) + line(-6, -28, -2, -10, "#6a8290" if not lit else "#fff4c8", 1.2)
    return PL.tr(l, x, y, s)

def wall_fill(w, h, col, seed, cracks=2):
    r = random.Random(seed)
    s = rect(0, 0, w, h, col, None)
    for _ in range(cracks):
        x, y = r.uniform(40, w - 40), r.uniform(20, h - 40)
        s += path(f"M{F(x)} {F(y)} l{F(r.uniform(-6,6))} 10 l{F(r.uniform(-4,8))} 8 l-3 9", "none", INK, Hh * .8)
    s += stipple(0, 0, w, h, int(w * h / 900), shade(col, .12), 1.6, .7, seed=seed)
    return s

# ================================================================ market
def m_awn():
    w, h = 176, 76
    s = rect(0, 0, w, 52, C["cream"], None)
    for i in range(0, 4, 2):
        s += rect(i * 44, 0, 44, 52, C["brick"], None)
    s += rect(0, 0, w, 6, shade(C["brick"], .3), None) + "".join(line(x, 0, x, 52, INK, D) for x in range(0, w + 1, 44))
    s += line(0, 2, w, 2, INK, 2.2) + line(0, 4, w, 4, C["iron"], 1.6) + line(0, 52, w, 52, INK, D)
    for i in range(4):
        x = i * 44
        s += path(f"M{x} 52 V60 Q{x+22} 84 {x+44} 60 V52 Z", C["brick"] if i % 2 == 0 else C["cream"], INK, D)
    s += "".join(line(x + 11, 6, x + 11, 50, INK, Hh * .6) for x in range(0, w, 22))
    return w, h, s

def m_wall():
    w, h = 528, 336
    s = wall_fill(w, h, C["plaster"], 3)
    # row 1, on a shelf at y=150
    y = 150
    s += line(40, 0, 40, 10, INK, D) + path("M28 10 Q40 30 52 10", "none", INK, Hh)                      # a string of onions from a nail
    for i, (ox, oy) in enumerate(((36, 26), (44, 40), (34, 54), (46, 68))):
        s += ell(ox, oy, 7, 8, C["onion"], INK, Hh) + line(ox, oy - 8, ox + 1, oy - 12, INK, Hh)
    s += crate(70, y, 64, 56) + sack(146, y, 48, 62) + jar(208, y, 30, 40, C["jar"]) + jar(244, y, 30, 34, C["glass"])
    s += barrel(300, y, .95)
    for i, (cx, col) in enumerate(((356, C["cloth1"]), (384, C["cloth2"]), (370, C["cloth3"]))):          # bolts of cloth, end on
        cy = y - 14 - (28 if i == 2 else 0)
        s += circ(cx, cy, 14, col, INK, D) + circ(cx, cy, 5, shade(col, .2), INK, Hh) + path(f"M{cx-10} {cy+9} Q{cx} {cy+16} {cx+10} {cy+9}", "none", INK, Hh)
    s += lantern(428, y, 1.05)
    s += path(f"M452 {y} L456 {y-26} H504 L508 {y} Z", "#c8a26a", INK, D) + "".join(line(x, y - 26, x, y, INK, Hh * .7) for x in range(462, 504, 8))
    s += "".join(circ(462 + i * 9, y - 30 - (i % 2) * 4, 6, C["apple"], INK, Hh) for i in range(5)) + line(470, y - 36, 472, y - 41, INK, Hh)
    s += shelf(10, w - 10, y)
    # row 2, on a shelf at y=318
    y = 318
    s += circ(56, y - 24, 24, C["rope"], INK, D) + circ(56, y - 24, 15, "none", INK, Hh) + circ(56, y - 24, 7, C["deep"], INK, Hh)
    s += path(f"M80 {y-20} q10 6 6 20", "none", INK, D)
    s += bottle(98, y, 52, C["glass2"], C["cream"]) + bottle(118, y, 46, C["amber"], C["cream"]) + bottle(138, y, 56, C["glass"])
    s += rect(166, y - 30, 56, 30, C["woodlt"], INK, D) + "".join(rect(172 + i * 10, y - 46, 6, 16, C["candle"], INK, Hh) + line(175 + i * 10, y - 46, 175 + i * 10, y - 51, INK, Hh) for i in range(5))
    s += crate(236, y, 48, 40, C["woodlt"], False) + crate(240, y - 40, 40, 30, C["crate"])
    for i in range(4):                                                                           # spice jars
        s += jar(300 + i * 18, y, 14, 22, (C["brick"], C["cloth3"], C["cloth2"], C["onion"])[i], False)
    # a set of scales
    s += rect(396, y - 6, 52, 6, C["brass"], INK, D) + line(422, y - 6, 422, y - 56, INK, 2.6) + line(398, y - 54, 446, y - 54, INK, 2)
    for px in (400, 444):
        s += line(px, y - 54, px - 8, y - 30, INK, Hh) + line(px, y - 54, px + 8, y - 30, INK, Hh) + path(f"M{px-12} {y-30} Q{px} {y-22} {px+12} {y-30} Z", C["brass"], INK, D)
    for i, (bx, col) in enumerate(((460, C["cloth1"]), (474, C["brick"]), (486, C["cloth2"]))):          # ledgers
        s += PL.tr(rect(0, -50, 12, 50, col, INK, D) + line(2, -40, 10, -40, C["cream"], 1.2), bx, y, rot=(-8 if i == 2 else 0))
    s += shelf(10, w - 10, y)
    return w, h, s

def m_table():
    w, h = 264, 112
    return plank_tile(w, h, C["woodlt"], 2, 9)

def plank_tile(w, h, col, rows, seed, nails=True):
    r = random.Random(seed)
    s = rect(0, 0, w, h, col, None)
    ph = h / rows
    for i in range(rows):
        y0 = i * ph
        s += rect(0, y0 + ph - 6, w, 6, shade(col, .1), None)
        bx = (w * .3 + i * w * .45) % w
        s += line(bx, y0, bx, y0 + ph, INK, D)
        if nails:
            s += circ(bx - 6, y0 + 8, 1.4, INK, None) + circ(bx - 6, y0 + ph - 10, 1.4, INK, None) + circ(bx + 6, y0 + 8, 1.4, INK, None) + circ(bx + 6, y0 + ph - 10, 1.4, INK, None)
        for g in range(2):                                                                          # grain
            gy = y0 + ph * (.3 + g * .35); gx = r.uniform(10, w * .5)
            s += path(f"M{F(gx)} {F(gy)} q{F(w*.12)} -3 {F(w*.25)} 0 t{F(w*.25)} 0", "none", shade(col, .3), Hh)
        if r.random() < .7:
            kx = r.uniform(20, w - 20); ky = y0 + ph * .5
            s += ell(kx, ky, 5, 2.4, "none", shade(col, .35), Hh) + ell(kx, ky, 2, 1, shade(col, .35), None)
        s += line(0, y0, w, y0, INK, D)
    return w, h, s

# ================================================================ shipwright
def w_beam():
    w, h = 240, 64
    s = rect(0, 0, w, 40, C["wood2"], None) + rect(0, 30, w, 10, shade(C["wood2"], .2), None) + rect(0, 0, w, 40, "none", INK, D)
    for x in (30, 150):
        s += rect(x, 40, 24, 22, C["wood2"], INK, D) + rect(x + 16, 40, 8, 22, shade(C["wood2"], .2), None) + rect(x, 40, 24, 22, "none", INK, D)
        s += circ(x + 12, 20, 2, INK, None)
    s += path("M90 40 Q100 58 110 40", "none", INK, Hh) + line(100, 49, 100, 62, INK, Hh) + path("M100 62 q0 5 -4 5 q-3 0 -3 -3", "none", INK, D)   # a hook on a line
    return w, h, s

def w_wall():
    w, h = 600, 300
    s = rect(0, 0, w, h, C["board"], None)
    for x in range(0, w, 50):
        s += line(x, 0, x, h, INK, Hh) + circ(x + 8, 12, 1.2, INK, None) + circ(x + 8, h - 12, 1.2, INK, None)
    s += stipple(0, 0, w, h, 120, C["board2"], 1.6, .8, seed=4)
    # row 1: pegs along y=30
    s += rect(10, 22, w - 20, 8, C["wood2"], INK, D)
    # a hand saw
    s += path("M34 38 H96 L92 66 L40 76 Z", C["steel"], INK, D) + "".join(line(42 + i * 6, 73 - i * 1.1, 44 + i * 6, 78 - i * 1.1, INK, Hh) for i in range(8))
    s += path("M18 34 H40 V52 Q30 58 22 52 Z", C["wood"], INK, D) + ell(29, 44, 4, 5, C["board"], INK, Hh)
    # mallets
    for mx, sc in ((128, 1), (162, .85)):
        s += PL.tr(rect(-3, 0, 6, 50, C["wood"], INK, D) + rect(-14, 50, 28, 20, C["woodlt"], INK, D) + rect(6, 50, 8, 20, shade(C["woodlt"], .15), None) + rect(-14, 50, 28, 20, "none", INK, D), mx, 30, sc)
    # a brace and bit
    s += path("M206 34 V50 H224 V76 H206 V92", "none", INK, 4.4) + path("M206 34 V50 H224 V76 H206 V92", "none", C["iron"], 2.2)
    s += ell(206, 34, 6, 4, C["wood"], INK, D) + rect(219, 58, 10, 12, C["wood"], INK, D) + line(206, 92, 206, 112, INK, 2)
    # the builder's half-model of a hull, on a board: the shape of a ship before she's built
    s += rect(256, 40, 150, 70, C["woodlt"], INK, D) + rect(262, 46, 138, 58, "none", INK, Hh)
    s += path("M272 62 H392 C388 82 360 96 330 96 C300 96 278 84 272 62 Z", C["wood2"], None)
    for k in range(1, 4): s += path(f"M{272+k*3} {62+k*8} C{300} {70+k*9} {360} {70+k*9} {392-k*5} {62+k*8}", "none", shade(C["wood2"], .3), Hh)
    s += path("M272 62 H392 C388 82 360 96 330 96 C300 96 278 84 272 62 Z", "none", INK, D) + line(272, 62, 392, 62, C["cream"], 2)
    s += rect(318, 98, 24, 7, C["cream"], INK, Hh)
    # a coil of rope on a peg, a plane, chisels in a rack
    s += line(436, 30, 436, 40, INK, D) + circ(436, 64, 22, "none", INK, 7) + circ(436, 64, 22, "none", C["rope"], 4.6) + circ(436, 64, 13, "none", INK, 5) + circ(436, 64, 13, "none", C["rope"], 3)
    s += path("M478 64 H536 L530 46 H484 Z", C["wood"], INK, D) + path("M498 46 Q506 32 516 46", C["wood"], INK, D) + rect(506, 56, 8, 8, C["steel"], INK, Hh)
    s += rect(476, 84, 110, 8, C["wood2"], INK, D)
    for i in range(6):
        cx = 488 + i * 16
        s += rect(cx - 3, 92, 6, 18, C["wood"], INK, Hh) + poly([(cx - 2, 110), (cx + 2, 110), (cx + 1, 126), (cx - 1, 126)], C["steel"], INK, Hh)
    # row 2: pegs along y=180
    s += rect(10, 172, w - 20, 8, C["wood2"], INK, D)
    s += path("M30 186 L110 186 L104 196 L36 196 Z", C["wood"], INK, D) + path("M30 186 Q70 236 110 186", "none", INK, Hh) + line(70, 196, 70, 230, INK, D)   # a bow saw
    s += path("M70 230 L44 196 M70 230 L96 196", "none", INK, Hh)
    for i, ln in enumerate((60, 48, 70)):                                                             # augers
        ax = 140 + i * 18
        s += line(ax, 180, ax, 180 + ln, INK, 3.2) + line(ax, 180, ax, 180 + ln, C["iron"], 1.4) + rect(ax - 8, 180, 16, 6, C["wood"], INK, Hh)
        s += path(f"M{ax-3} {180+ln-12} l6 4 l-6 4 l6 4", "none", INK, Hh)
    s += lantern(226, 230, 1.1)
    s += line(226, 180, 226, 186, INK, D)
    # an adze and a caulking mallet with irons
    s += line(276, 186, 276, 262, INK, 4.4) + line(276, 186, 276, 262, C["wood"], 2.4) + path("M262 182 Q276 176 300 186 L298 194 Q280 188 266 190 Z", C["steel"], INK, D)
    s += rect(320, 184, 12, 60, C["wood"], INK, D) + rect(312, 244, 28, 18, C["wood2"], INK, D) + line(318, 248, 334, 248, C["iron"], 2)
    for i in range(4):
        s += line(360 + i * 12, 184, 360 + i * 12, 236, INK, 2.8) + line(360 + i * 12, 184, 360 + i * 12, 236, C["steel"], 1.2) + rect(356 + i * 12, 228, 8, 10, C["steel"], INK, Hh)
    # a calendar from a chandler, days crossed off, and a pot of nails
    s += rect(428, 190, 62, 74, C["cream"], INK, D) + rect(428, 190, 62, 18, C["brick"], INK, D) + line(440, 199, 478, 199, C["cream"], 1.6)
    for i in range(4):
        for j in range(5):
            cx_, cy_ = 436 + j * 11, 216 + i * 11
            s += rect(cx_, cy_, 8, 8, "none", INK, Hh * .6)
            if i * 5 + j < 12: s += line(cx_, cy_, cx_ + 8, cy_ + 8, C["brick"], .9) + line(cx_ + 8, cy_, cx_, cy_ + 8, C["brick"], .9)
    s += rect(512, 214, 40, 46, C["iron"], INK, D) + ell(532, 214, 20, 5, C["deep"], INK, D) + "".join(line(522 + i * 6, 212, 520 + i * 7, 200, INK, Hh) for i in range(4))
    s += rect(500, 260, 64, 8, C["wood2"], INK, D)
    return w, h, s

def w_bench():
    w, h = 300, 88
    w_, h_, s = plank_tile(w, h, C["woodlt2"], 2, 13, False)
    for x in (60, 210):
        s += circ(x, 22, 4, C["deep"], INK, Hh)                                                     # dog holes
    r = random.Random(6)
    for _ in range(5):                                                                              # shavings
        x, y = r.uniform(20, w - 20), r.uniform(10, h - 10)
        s += path(f"M{F(x)} {F(y)} q6 -6 10 0 q-4 6 -8 2", "none", INK, Hh) + path(f"M{F(x)} {F(y)} q6 -6 10 0 q-4 6 -8 2", "none", C["cream"], .8)
    return w, h, s

# ================================================================ tavern (game units 1x; drawn 2x)
def t_wall():
    w, h = 1440, 524                   # 720 x 262 game: three seats, wall from the ceiling to the bar top
    s = wall_fill(w, 184, C["mustard"], 7, 3)
    s += rect(0, 184, w, h - 184, shade(C["mustard"], .08), None)
    # wainscot below the lower shelf
    s += rect(0, 328, w, h - 328, C["panel"], None)
    for x in range(0, w, 120):
        s += rect(x + 12, 344, 96, h - 360, C["panel2"], INK, Hh) + line(x, 328, x, h, INK, D)
    s += line(0, 328, w, 328, INK, D)
    r = random.Random(11)
    # the upper shelf at y=184: bottles of every sort, a ship in a bottle, and tankards on hooks beneath
    for seat in range(3):
        x0 = seat * 480
        items = ""
        bx = x0 + 70
        while bx < x0 + 440:
            k = r.random()
            if k < .55:
                hh = r.uniform(36, 56); col = r.choice((C["glass"], C["glass2"], C["amber"], "#7a4a6e"))
                items += bottle(bx, 184, hh, col, r.choice((None, C["cream"], C["cream"]))); bx += hh * .32 + r.uniform(6, 14)
            elif k < .75:
                items += jar(bx, 184, 26, 30, r.choice((C["jar"], C["glass"])), True); bx += 34
            else:
                items += barrel(bx + 20, 184, .7); bx += 44
        s += items
        for i in range(4):                                                                     # tankards on hooks
            tx = x0 + 120 + i * 70
            s += line(tx, 196, tx, 204, INK, D) + PL.tr(mug(False, True), tx, 236, .62)
        s += shelf(x0 + 20, x0 + 460, 184, C["wood2"])
    # a ship in a bottle on the middle seat's shelf: the telling detail
    sx = 480 + 200
    s += path(f"M{sx} 180 H{sx+90} Q{sx+104} 180 {sx+104} 166 Q{sx+104} 152 {sx+90} 152 H{sx} Z", "#cfdcd6", INK, D, op=.95)
    s += path(f"M{sx+104} 162 H{sx+120} V170 H{sx+104}", C["wood"], INK, D)
    s += path(f"M{sx+16} 176 H{sx+74} L{sx+68} 170 H{sx+22} Z", C["wood2"], INK, Hh) + line(sx + 45, 170, sx + 45, 154, INK, Hh)
    s += poly([(sx + 34, 168), (sx + 45, 156), (sx + 45, 168)], C["cream"], INK, Hh * .8) + poly([(sx + 47, 168), (sx + 47, 158), (sx + 58, 168)], C["cream"], INK, Hh * .8)
    s += line(sx + 8, 158, sx + 80, 158, "#ffffff", 1.4, op=.6)
    # the lower shelf at y=328: casks with taps, jars
    for seat in range(3):
        x0 = seat * 480
        s += PL.tr(ell(0, 0, 30, 30, C["wood"], INK, D) + ell(0, 0, 22, 22, shade(C["wood"], .12), INK, Hh) + rect(-4, 22, 8, 12, C["brass"], INK, D)
                   + line(-30, -12, 30, -12, C["iron"], 2) + line(-30, 12, 30, 12, C["iron"], 2), x0 + 140, 290)
        s += PL.tr(ell(0, 0, 30, 30, C["wood"], INK, D) + ell(0, 0, 22, 22, shade(C["wood"], .12), INK, Hh) + rect(-4, 22, 8, 12, C["brass"], INK, D), x0 + 340, 290)
        s += jar(x0 + 220, 324, 30, 36, C["glass"]) + jar(x0 + 258, 324, 26, 30, C["jar"])
        s += shelf(x0 + 20, x0 + 460, 324, C["wood2"])
    # lamps hanging between the seats (seats sit 20..260, 260..500; so lamps at x=20, 260, 500 game)
    for lx in (40, 520, 1000):
        s += line(lx, 0, lx, 40, INK, D) + lantern(lx, 84, 1.1, True)
    # a mounted fish over the middle of each set, a framed chart on the left
    s += path("M1180 54 Q1210 30 1260 46 L1280 36 L1278 64 L1260 56 Q1210 76 1180 54 Z", "#9fb3b6", INK, D) + rect(1170, 40, 120, 34, "none", C["wood"], 0) + circ(1194, 50, 2, INK, None)
    s += rect(1166, 30, 124, 52, "none", INK, Hh)
    s += rect(200, 34, 90, 64, C["cream"], INK, D) + rect(196, 30, 98, 72, "none", C["wood"], 3.4) + rect(194, 28, 102, 76, "none", INK, Hh)
    s += path("M210 80 Q230 50 250 70 Q262 80 280 52", "none", INK, Hh, extra='stroke-dasharray="3 3"') + path("M212 60 q10 -6 18 2 q6 8 -4 12 z", "#c9cfa2", INK, Hh)
    return w, h, s

def mug(tipped=False, hook=False, k=1):
    """a pewter tankard, 24 x 28 (times k), with a head of foam unless it's empty"""
    d, hh = D / k, Hh / k
    s = rect(-12, -28, 24, 28, C["pewter"], None, rx=3) + rect(4, -28, 8, 28, shade(C["pewter"], .2), None, rx=2)
    s += line(-12, -22, 12, -22, INK, hh) + line(-12, -6, 12, -6, INK, hh)
    s += path("M12 -22 C22 -22 22 -8 12 -8", "none", INK, 2.2 * 2 / k) + path("M12 -22 C22 -22 22 -8 12 -8", "none", C["pewter"], 2.2 / k)
    s += rect(-12, -28, 24, 28, "none", INK, d, rx=3) + line(-8, -24, -8, -10, "#ffffff", 1.6 / k, op=.6)
    if not tipped and not hook:
        s += path("M-13 -28 Q-12 -36 -4 -34 Q0 -40 6 -34 Q13 -36 13 -28 Z", C["foam"], INK, d)
    return PL.tr(s, 0, 0, k) if k != 1 else s

def t_bar():
    w, h = 480, 276                       # 240 x 138 game: the bar top (262-278) and front (278-400)
    s = rect(0, 0, w, 32, C["bartop"], None) + rect(0, 0, w, 8, tint(C["bartop"], .2), None) + rect(0, 24, w, 8, shade(C["bartop"], .2), None)
    s += path("M0 14 q120 -4 240 0 t240 0", "none", shade(C["bartop"], .3), Hh) + rect(0, 0, w, 32, "none", INK, D)
    s += ell(150, 12, 14, 3.6, "none", shade(C["bartop"], .35), Hh)                               # a ring from a wet glass
    s += rect(0, 32, w, h - 32, C["panel"], None)
    for x in (0, 240):
        s += rect(x + 22, 50, 196, 140, C["panel2"], None) + rect(x + 22, 50, 196, 10, shade(C["panel2"], .25), None)
        s += rect(x + 22, 50, 196, 140, "none", INK, D) + rect(x + 34, 62, 172, 116, "none", INK, Hh)
        s += line(x, 32, x, h, INK, D)
    s += rect(0, 206, w, 14, C["panel2"], INK, D)
    s += line(0, 236, w, 236, INK, 7.6) + line(0, 236, w, 236, C["brass"], 4.2) + line(0, 234, w, 234, "#f1dc9e", 1)   # the brass foot rail
    for x in (120, 360):
        s += path(f"M{x} 236 L{x-10} 206", "none", INK, 4) + path(f"M{x} 236 L{x-10} 206", "none", C["brass"], 2)
    s += rect(0, h - 16, w, 16, shade(C["panel"], .3), None) + line(0, h - 16, w, h - 16, INK, D) + line(0, h, w, h, INK, D)
    return w, h, s

def t_floor():
    w, h = 480, 104
    return plank_tile(w, h, C["floor"], 2, 21)

# ================================================================ build
def tile(fn):
    w, h, s = fn()
    s = PL.compact(s)
    return dict(w=w // 2, h=h // 2, s=f'<g transform="scale(.5)">{s}</g>')

def build():
    reset()
    out = dict(
        market=dict(awn=tile(m_awn), wall=tile(m_wall), table=tile(m_table)),
        wright=dict(beam=tile(w_beam), wall=tile(w_wall), bench=tile(w_bench)),
        tavern=dict(wall=tile(t_wall), bar=tile(t_bar), floor=tile(t_floor),
                    mug=f'<g transform="scale(.5)">{mug(k=2)}</g>', tipped=f'<g transform="scale(.5)">{PL.tr(mug(True, k=2), 0, 0, rot=-80)}</g>'),
    )
    assert not DEFS, "tiles must not use gradients or clips (pattern ids would clash)"
    js = ("/* Golden Shore: the insides of the market, tavern and shipwright, drawn with the ware-style-assets skill\n"
          "   (tools/ware/interiors.py). GENERATED: don't edit; change interiors.py and run `py tools/ware/interiors.py`. */\n"
          '"use strict";\nconst INTERIORART=' + json.dumps(out, separators=(",", ":")) + ";\n")
    (HERE.parent.parent / "play" / "js" / "interiorart.js").write_text(js, encoding="utf-8")
    # review sheet: each tile repeated
    pats, rows, y = "", "", 0
    for room, tiles in out.items():
        for k, t in tiles.items():
            if not isinstance(t, dict): continue
            pid = f"{room}-{k}"
            pats += f'<pattern id="{pid}" width="{t["w"]}" height="{t["h"]}" patternUnits="userSpaceOnUse" patternTransform="translate(0 {y})"><g stroke="none">{t["s"]}</g></pattern>'
            hh = t["h"] * (2 if k in ("wall",) else 2)
            rows += f'<rect x="0" y="{y}" width="1200" height="{hh}" fill="url(#{pid})"/><text x="6" y="{y+14}" font-size="12" font-family="sans-serif">{pid}</text>'
            y += hh + 16
    rows += f'<g transform="translate(40 {y+40}) scale(2)">{out["tavern"]["mug"]}</g><g transform="translate(120 {y+40}) scale(2)">{out["tavern"]["tipped"]}</g>'
    y += 80
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 {y}" width="1200" height="{y}"><defs>{pats}</defs><rect width="1200" height="{y}" fill="#fff"/>{rows}</svg>'
    save(svg, HERE / "out" / "interiors.svg")
    print(f"wrote play/js/interiorart.js ({len(js)//1024} KB) and tools/ware/out/interiors.svg")

if __name__ == "__main__":
    build()
