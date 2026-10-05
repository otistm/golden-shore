"""the Ember's set: a privateer's guns, powder and fire (see item-notes.md)"""
from itemart import *

FIRE, FIRE2 = M["fire"], M["fire2"]

def flame(x, y, h, w=None, seed=0):
    """a flat cartoon flame standing on (x,y), height h: an outer orange tongue and a yellow core, ink edged"""
    w = w or h * .55
    d = f"M{x} {y} C{x-w*.6} {y} {x-w*.7} {y-h*.45} {x-w*.15} {y-h*.7} C{x-w*.1} {y-h*.45} {x+w*.05} {y-h*.5} {x} {y-h} C{x+w*.35} {y-h*.6} {x+w*.7} {y-h*.45} {x+w*.55} {y-h*.15} C{x+w*.5} {y} {x+w*.2} {y} {x} {y} Z"
    c = f"M{x} {y} C{x-w*.3} {y} {x-w*.35} {y-h*.3} {x-w*.05} {y-h*.5} C{x+w*.05} {y-h*.32} {x+w*.25} {y-h*.3} {x+w*.25} {y-h*.12} C{x+w*.22} {y} {x+w*.1} {y} {x} {y} Z"
    return path(d, FIRE, INK, DT) + path(c, FIRE2, None)

def spark(x, y, r=5):
    pts = []
    for i in range(10):
        a = math.pi * i / 5; rr = r if i % 2 == 0 else r * .4
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    return poly(pts, FIRE2, INK, HR)

def cask_standing(cx, by, w, h, hoop, wood=None, label=None):
    s = stave_barrel(cx, by, w, h, wood or M["wood"], (.18, .5, .82), hoop)
    s += ell(cx, by - h, w / 2, w * .12, shade(wood or M["wood"], .1), INK, DT)
    return s

def iron_ball(x, y, r, col=None):
    col = col or M["iron2"]
    return circ(x, y, r, col, INK, OL) + path(f"M{x-r*.55} {y-r*.35} q{r*.3} {-r*.4} {r*.7} {-r*.45}", "none", "#7d858b", 1.4)

def smoke_puff(x, y, r):
    return "".join(circ(x + dx * r, y + dy * r, r * rr, "#d8d2c6", INK, HR) for dx, dy, rr in ((0, 0, .7), (.6, -.3, .55), (1.1, .1, .45), (.4, .4, .5)))

def long_gun(x, y, L, col=None, k=1.0):
    """a cast gun barrel, breech at x, muzzle right: cascabel, reinforce rings stepping thinner, a muzzle swell; centre line y"""
    col = col or M["iron2"]
    r0, r1 = 11 * k, 7 * k
    s = circ(x - 4 * k, y, 4 * k, col, INK, DT) + rect(x - 2 * k, y - 2 * k, 4 * k, 4 * k, col, None)
    d = f"M{x} {y-r0} L{x+L*.38} {y-r0*.92} L{x+L*.38} {y-r0*.8} L{x+L*.7} {y-r1*1.05} L{x+L*.7} {y-r1} L{x+L*.92} {y-r1*.85} L{x+L} {y-r1*1.1} L{x+L} {y+r1*1.1} L{x+L*.92} {y+r1*.85} L{x+L*.7} {y+r1} L{x+L*.7} {y+r1*1.05} L{x+L*.38} {y+r0*.8} L{x+L*.38} {y+r0*.92} L{x} {y+r0} Z"
    s += path(d, col, INK, OL)
    s += path(f"M{x+4} {y-r0+2} L{x+L*.9} {y-r1+1.5}", "none", "#6d757b", 1.6)
    s += line(x + L * .38, y - r0 * .9, x + L * .38, y + r0 * .9, INK, DT) + line(x + L * .7, y - r1 * 1.04, x + L * .7, y + r1 * 1.04, INK, DT)
    return s

def swivel(x, y, col=None):
    """a swivel gun on its Y-yoke on a rail post at (x, y = rail top): barrel right, tiller left"""
    col = col or M["brass"]
    s = rect(x - 6, y, 12, 30, M["oak"], INK, OL)
    s += path(f"M{x} {y} V{y-8}", "none", INK, 4.4) + path(f"M{x-7} {y-20} Q{x-7} {y-8} {x} {y-8} Q{x+7} {y-8} {x+7} {y-20}", "none", INK, 5.4) + path(f"M{x-7} {y-20} Q{x-7} {y-8} {x} {y-8} Q{x+7} {y-8} {x+7} {y-20}", "none", M["iron"], 2.6)
    s += path(f"M{x-10} {y-26} L{x+26} {y-24} L{x+26} {y-16} L{x-10} {y-14} Z", col, INK, OL) + rect(x + 24, y - 25.5, 4, 11, shade(col, .2), INK, DT)
    s += circ(x, y - 20, 2.6, M["iron"], INK, HR)
    s += path(f"M{x-10} {y-20} L{x-26} {y-18} Q{x-32} {y-16} {x-30} {y-11}", "none", INK, 5) + path(f"M{x-10} {y-20} L{x-26} {y-18} Q{x-32} {y-16} {x-30} {y-11}", "none", M["iron"], 2.4)
    return s

# ---------------------------------------------------------------- guns
@item("cannon", 3)
def _():
    # a naval long gun on its truck carriage: cascabel, reinforce rings, muzzle swell; stepped red-ochre cheeks, four small trucks,
    # a quoin under the breech, the breeching rope through the cascabel
    s = path("M30 46 H118 V56 L112 62 H36 L30 56 Z", "#a84a32", INK, OL)
    s += path("M30 46 H54 V40 H76 V46", "#a84a32", INK, DT)                                        # stepped bracket
    s += circ(44, 66, 9, M["oak"], INK, OL) + circ(104, 66, 9, M["oak"], INK, OL) + circ(44, 66, 2.4, M["iron"], None) + circ(104, 66, 2.4, M["iron"], None)
    s += path("M36 46 L52 46 L52 40 Z", M["oak"], INK, DT)                                           # quoin
    s += long_gun(36, 34, 130)
    s += circ(84, 38, 5, M["iron"], INK, DT) + rect(78, 30, 12, 4, M["iron"], INK, HR)                 # trunnion and cap-square
    s += path("M32 34 Q16 40 6 30 M32 34 Q18 48 8 60", "none", INK, 4.4) + path("M32 34 Q16 40 6 30 M32 34 Q18 48 8 60", "none", M["rope"], 2.6)
    return s

@item("mortar", 3)
def _():
    # a sea mortar on its bed: a squat wide barrel at 45 degrees with trunnions at the breech, a timber bed bound with iron on a
    # round platform; a bomb with its fuse beside it
    s = ell(56, 70, 50, 7, M["oak2"], INK, OL)
    s += rect(20, 50, 72, 18, M["oak"], INK, OL) + "".join(rect(x, 50, 5, 18, M["iron"], INK, HR) for x in (28, 78))
    bar = R(path("M0 -16 H34 L38 -20 H46 V20 H38 L34 16 H0 Q-8 16 -8 0 Q-8 -16 0 -16 Z", M["iron2"], INK, OL) + path("M2 -14 H34 V-10 H2 Z", "#6d757b", None) + ell(46, 0, 4, 20, M["black"], INK, DT), -45, 0, 0)
    s += f'<g transform="translate(50 46)">{bar}</g>' + circ(50, 46, 6, M["iron"], INK, DT)
    s += iron_ball(140, 56, 16) + rect(137, 36, 6, 6, "#ddc79c", INK, DT) + spark(140, 32, 6)
    return s

@item("swivel", 1)
def _():
    # a swivel gun in its iron yoke on a rail post: a short bronze barrel, the yoke's pin in the post, a long tiller curling at its end
    return swivel(40, 46)

@item("twinswivel", 2)
def _():
    # two swivel guns on the rail, one iron and one bronze, a stanchion between them
    s = rect(2, 52, 124, 8, M["oak"], INK, OL)
    s += swivel(36, 46, M["iron"]) + swivel(96, 46, M["brass"]) + rect(63, 30, 4, 22, M["oak"], INK, DT)
    return s

@item("broadside", 3)
def _():
    # a ship's side with three gunports open, lids raised (red inside), muzzles run out, one firing a flat cloud of smoke
    s = rect(2, 8, 172, 68, "#d1a64e", INK, OL) + rect(2, 22, 172, 8, M["black"], INK, DT) + rect(2, 64, 172, 8, M["black"], INK, DT)
    for y in range(36, 64, 7): s += line(2, y, 174, y, INK, HR)
    for x in (24, 74, 124):
        s += rect(x, 36, 24, 22, M["black"], INK, OL)
        s += path(f"M{x} 36 L{x - 2} 18 H{x + 26} L{x + 24} 36 Z", M["red"], INK, DT) + line(x, 34, x + 24, 34, INK, HR)
        s += rect(x + 6, 42, 26, 10, M["iron2"], INK, DT) + rect(x + 30, 41, 4, 12, M["iron"], INK, DT)
    s += smoke_puff(166, 46, 14)
    return s

@item("bombard", 3)
def _():
    # an old bronze gun: mouldings, two cast dolphin handles on top, a coat of arms on the reinforce, on a sled carriage; green patina
    s = path("M14 58 H150 L156 70 H8 Z", M["oak"], INK, OL)
    s += long_gun(26, 42, 140, M["brass"], 1.2)
    s += stipple(40, 32, 110, 18, 30, "#7f9f86", 1.8, .9, seed=7)
    for x in (66, 92):
        s += path(f"M{x} 30 Q{x+2} 18 {x+10} 20 Q{x+14} 24 {x+8} 30", "none", INK, 5) + path(f"M{x} 30 Q{x+2} 18 {x+10} 20 Q{x+14} 24 {x+8} 30", "none", M["brass"], 2.6)
    s += path("M44 36 h12 v8 q-6 6 -12 0 Z", M["brass2"], INK, HR)
    return s

@item("crossfire", 2)
def _():
    # a gunner's quadrant: a long arm that goes into the muzzle, a quarter-circle scale with degree marks, a plumb bob swinging off true
    cx, cy, r = 70, 18, 52
    s = path(f"M{cx} {cy} L{cx} {cy+r} A{r} {r} 0 0 1 {cx-r} {cy} Z", "#e3c88a", INK, OL)
    for i in range(1, 9):
        a = math.radians(90 + i * 10)
        s += line(cx + r * math.cos(a), cy + r * math.sin(a), cx + (r - 6) * math.cos(a), cy + (r - 6) * math.sin(a), INK, HR)
    s += rect(cx - 2, cy - 6, 56, 8, "#d9b878", INK, OL) + rect(cx + 36, cy - 6, 18, 8, M["brass"], INK, DT)
    s += line(cx, cy, cx - 22, cy + 40, INK, HR) + path(f"M{cx-26} {cy+40} l4 -6 l4 6 l-4 6 Z", "#8d9196", INK, DT)
    return s

# ---------------------------------------------------------------- small arms and shot
@item("blunderbuss", 2)
def _():
    # a sea-service blunderbuss: a short brass barrel with a modest bell muzzle, a flintlock, a full walnut stock, a spring bayonet folded on top
    s = path("M4 50 Q6 38 20 36 L34 32 H96 V40 H38 Q30 42 26 48 L14 62 Q6 64 4 58 Z", M["wood2"], INK, OL)
    s += path("M34 31 H100 L122 26 L122 44 L100 39 H34 Z", M["brass"], INK, OL) + line(38, 33, 100, 33, "#f0d79a", 1.4)
    s += line(48, 27, 98, 27, INK, 3) + line(48, 27, 98, 27, M["steel"], 1.4) + rect(96, 25, 5, 5, M["iron"], INK, HR)
    s += path("M4 52 L14 62 Q8 66 3 60 Z", M["brass"], INK, DT)
    s += path("M30 44 Q32 54 42 50 Q44 44 42 42", "none", INK, 4) + path("M30 44 Q32 54 42 50 Q44 44 42 42", "none", M["brass"], 2)
    s += flint_lock(34, 29, .8)
    return s

@item("grenado", 1)
def _():
    # a cast-iron hand grenado: a hollow ball with a tapered wooden fuse plug in its fuse hole, a short length of match, a spark
    s = iron_ball(40, 48, 24)
    s += path("M35 26 L37 14 H43 L45 26 Z", "#ddc79c", INK, DT) + ell(40, 14, 3, 1.4, M["black"], None)
    s += path("M40 14 Q46 6 52 10", "none", INK, DT) + spark(53, 9, 7)
    return s

@item("hotshot", 2)
def _():
    # a glowing round shot gripped in long iron shot tongs, a wet clay wad below
    s = path("M4 30 L74 40 M4 50 L74 42", "none", INK, 6.4) + path("M4 30 L74 40 M4 50 L74 42", "none", M["iron"], 3.4)
    s += path("M72 40 Q84 20 100 26 M72 42 Q84 62 100 56", "none", INK, 6.4) + path("M72 40 Q84 20 100 26 M72 42 Q84 62 100 56", "none", M["iron"], 3.4)
    s += circ(100, 41, 15, FIRE, INK, OL) + circ(96, 37, 6, FIRE2, None)
    for a_ in (-30, 10, 50): s += path(f"M{100 + 20*math.cos(math.radians(a_))} {41 + 20*math.sin(math.radians(a_))} q3 -3 0 -6", "none", INK, HR)
    s += ell(100, 70, 14, 5, "#8d7d6a", INK, DT)
    return s

@item("rocket", 1)
def _():
    # a Congreve rocket: a sheet-iron case with a pointed iron nose cap, the guide stick clamped to its side by three iron clamps, flame at the base
    b = rect(26, 32, 38, 12, M["iron"], INK, OL) + path("M64 32 L78 38 L64 44 Z", M["iron2"], INK, OL)
    b += rect(-6, 44, 52, 4, "#ddc79c", INK, DT)
    for x in (30, 42, 54): b += rect(x, 31, 4, 18, M["iron2"], INK, HR)
    b += path("M26 34 Q16 30 12 38 Q16 44 26 42 Z", FIRE, INK, DT) + path("M26 36 Q20 35 18 38 Q20 41 26 40 Z", FIRE2, None)
    s = R(b, -34, 40, 40) + smoke_puff(14, 66, 8)
    return s

@item("brand", 1)
def _():
    # a branding iron: a long iron rod with a pale wooden handle, its head (the broad arrow) glowing, a wisp of smoke
    b = rect(52, 36, 24, 8, "#ddc79c", INK, OL, rx=3) + line(18, 40, 52, 40, INK, 5) + line(18, 40, 52, 40, M["iron"], 2.4)
    b += path("M8 32 L16 40 L8 48 M16 40 H22 M13 36 L16 40 L13 44", "none", INK, 6) + path("M8 32 L16 40 L8 48 M16 40 H22", "none", FIRE, 3)
    s = R(b, -40, 40, 40) + path("M14 62 q-4 -6 2 -10 q4 -4 0 -10", "none", INK, HR)
    return s

@item("cartridges", 1)
def _():
    # a bundle of paper musket cartridges tied with thread, ball ends tied off, one bitten open with powder spilling
    s = ""
    for i, (x, y, d) in enumerate(((16, 24, -10), (22, 34, -10), (28, 44, -10))):
        c = rect(0, 0, 44, 10, "#ece0c4", INK, DT, rx=3) + circ(6, 5, 4, "#8d9196", INK, HR) + path("M44 2 l5 -2 l-2 5 l2 5 l-5 -2", "#ece0c4", INK, HR)
        s += f'<g transform="translate({x} {y}) rotate({d})">{c}</g>'
    s += line(36, 18, 40, 58, INK, 2) + line(36, 18, 40, 58, M["red"], 1)
    open_ = rect(0, 0, 36, 10, "#ece0c4", INK, DT, rx=3) + circ(6, 5, 4, "#8d9196", INK, HR) + path("M36 0 l4 3 l-3 2 l4 3 l-5 2", "none", INK, HR)
    s += f'<g transform="translate(24 64) rotate(-6)">{open_}</g>' + stipple(62, 64, 12, 8, 10, M["black"], 1.6, .9, seed=1)
    return s

# ---------------------------------------------------------------- powder and fire
@item("keg", 1)
def _():
    # a gunpowder keg: a small cask bound with copper hoops (never iron), a bung, stencilled POWDER, a few grains spilled
    s = stave_barrel(40, 72, 40, 54, M["wood"], (.16, .5, .84), M["copper"])
    s += ell(40, 18, 20, 4.4, shade(M["wood"], .1), INK, DT) + rect(36, 13, 8, 5, M["dark"], INK, HR)
    s += path("M28 46 l3 -3 l3 3 l-3 3 Z", "none", M["tar"], 1.4) if False else ""
    s += path("M29 40 v8 M29 40 h3 q2 0 2 2 q0 2 -2 2 h-3 M37 40 q-3 0 -3 4 q0 4 3 4 q3 0 3 -4 q0 -4 -3 -4 M43 40 l2 8 l2 -6 l2 6 l2 -8", "none", M["tar"], 1.3)
    s += stipple(20, 72, 40, 4, 12, M["black"], 1.6, .9, seed=3)
    return s

@item("burstkeg", 2)
def _():
    # an infernal machine: a tarred powder cask on its side with iron hoops, slow match coiled from the bung, a chalk X, a spark
    s = path("M14 22 Q56 10 98 22 Q104 44 98 66 Q56 78 14 66 Q8 44 14 22 Z", M["tar"], None)
    for y in (32, 44, 56): s += path(f"M14 {y} Q56 {y - 12 + (y - 22) * .5} 98 {y}", "none", "#4a423c", 1)
    for x in (24, 40, 72, 88): s += path(f"M{x} {19 + abs(x-56)*.08} Q{x + (x-56)*.06} 44 {x} {69 - abs(x-56)*.08}", "none", INK, 5) + path(f"M{x} {19 + abs(x-56)*.08} Q{x + (x-56)*.06} 44 {x} {69 - abs(x-56)*.08}", "none", M["iron"], 2.6)
    s += path("M14 22 Q56 10 98 22 Q104 44 98 66 Q56 78 14 66 Q8 44 14 22 Z", "none", INK, OL)
    s += path("M50 36 l12 12 M62 36 l-12 12", "none", "#efe6cf", 2.4)
    s += rect(54, 12, 8, 6, M["dark"], INK, DT) + path("M58 12 Q70 0 86 8 Q100 16 112 8", "none", INK, 4) + path("M58 12 Q70 0 86 8 Q100 16 112 8", "none", M["rope"], 2) + spark(114, 7, 7)
    return s

@item("petard", 1)
def _():
    # a petard: a bell-shaped bronze pot of powder, its mouth flat against a thick oak board with iron hooks at the corners, the fuse lit
    s = rect(8, 46, 64, 12, M["oak"], INK, OL) + "".join(path(f"M{x} 58 v8 q0 4 4 4", "none", INK, 3) for x in (12, 64))
    s += path("M20 46 Q20 22 34 16 H46 Q60 22 60 46 Z", M["brass"], INK, OL) + path("M44 16 Q60 22 60 46 H48 Q50 24 44 16 Z", M["brass2"], None)
    s += path("M24 34 H56 M22 40 H58", "none", INK, HR)
    s += rect(36, 10, 8, 7, M["brass2"], INK, DT) + path("M40 10 Q44 2 50 4", "none", INK, DT) + spark(51, 4, 5)
    return s

@item("flare", 1)
def _():
    # a blue light: a squat paper case of slow composition bound with twine to a short wooden handle, burning blue-white at the top
    s = rect(36, 44, 8, 34, "#ddc79c", INK, OL)
    s += rect(28, 22, 24, 26, "#e6d7b6", INK, OL) + "".join(line(28, y, 52, y, INK, HR) for y in (40, 43))
    s += path("M40 22 C30 22 28 10 36 4 C36 10 42 10 40 2 C48 6 52 14 46 22 Z", "#cfdde8", INK, DT) + path("M40 22 C36 22 35 16 38 12 C40 16 44 16 44 20 Z", "#ffffff", None)
    s += circ(54, 8, 4, "#d8d2c6", None) + circ(60, 4, 3, "#d8d2c6", None)
    return s

@item("firepot", 2)
def _():
    # stinkpots: round-bellied earthenware fire pots stopped with rag, slung in cord nets, fuses sticking from the mouths, one smoking
    def pot(cx, by, r, lit):
        p = path(f"M{cx-r*.35} {by-r*1.9} Q{cx-r*1.1} {by-r*1.5} {cx-r} {by-r*.8} Q{cx-r*.9} {by} {cx} {by} Q{cx+r*.9} {by} {cx+r} {by-r*.8} Q{cx+r*1.1} {by-r*1.5} {cx+r*.35} {by-r*1.9} Z", M["clay"], INK, OL)
        p += path(f"M{cx+r*.2} {by-r*1.85} Q{cx+r*1} {by-r*1.5} {cx+r*.95} {by-r*.8} Q{cx+r*.85} {by-r*.1} {cx+r*.3} {by-r*.05} Q{cx+r*.6} {by-r*.9} {cx+r*.2} {by-r*1.85} Z", M["clay2"], None)
        p += path(f"M{cx-r*.9} {by-r*1.2} Q{cx} {by-r*.9} {cx+r*.9} {by-r*1.2} M{cx-r*.95} {by-r*.6} Q{cx} {by-r*.3} {cx+r*.95} {by-r*.6}", "none", INK, HR)
        p += rect(cx - r * .4, by - r * 2.1, r * .8, r * .3, "#e6d7b6", INK, HR)
        p += path(f"M{cx-r*.1} {by-r*2.1} l-{r*.2} -{r*.4} M{cx+r*.15} {by-r*2.1} l{r*.25} -{r*.45}", "none", INK, DT)
        if lit: p += spark(cx + r * .45, by - r * 2.6, 5) + path(f"M{cx+r*.45} {by-r*2.8} q-4 -4 1 -8", "none", INK, HR)
        return p
    return pot(42, 76, 23, True) + pot(98, 76, 17, False)

@item("greekfire", 2)
def _():
    # a carcass: an oval incendiary shell of pitched canvas over iron ribs, vent holes jetting flame, a drip of burning pitch
    s = ell(60, 46, 38, 26, M["tar"], INK, OL)
    for dx in (-24, 0, 24): s += path(f"M{60+dx} 20 Q{60+dx*1.5} 46 {60+dx} 72", "none", "#5e666c", 2)
    s += ell(60, 46, 38, 26, "none", INK, OL)
    for (x, y, a_) in ((36, 34, -120), (70, 26, -70), (90, 48, -10)):
        s += circ(x, y, 3.6, M["black"], INK, HR)
        s += R(flame(x, y - 2, 16, 10), a_ + 90, x, y)
    s += path("M54 72 q2 6 0 10 q-3 -4 0 -10", FIRE, INK, HR)
    return s

@item("fireship", 3)
def _():
    # a fire ship: an ordinary-looking small ship, sails set, its gunports fallen open with flame inside, grapnels at the yardarms, her boat towed astern
    s = path("M30 56 H142 L150 46 L154 48 L146 70 Q90 76 36 70 Z", M["dark"], INK, OL) + rect(30, 56, 116, 4, M["tar"], None)
    for x in (52, 76, 100, 124):
        s += rect(x, 61, 10, 7, "#3a2a22", INK, HR) + flame(x + 5, 68, 10, 8)
    for mx, h in ((70, 46), (110, 50)):
        s += line(mx, 56, mx, 56 - h, INK, 3) + path(f"M{mx-18} {60-h} H{mx+18} L{mx+16} {50-h*.4} H{mx-16} Z", M["canvas"], INK, DT)
        s += line(mx - 20, 59 - h, mx + 20, 59 - h, INK, DT) + path(f"M{mx+20} {59-h} q4 4 0 6 M{mx-20} {59-h} q-4 4 0 6", "none", INK, HR)
    s += path("M30 62 Q20 64 16 66", "none", INK, HR) + path("M2 64 H16 L14 70 H4 Z", M["wood"], INK, DT)
    return s

@item("hellburner", 3)
def _():
    # the hellburner, cut away: an ordinary hull holding a brick-built chamber packed with powder kegs, stones and scrap heaped on top,
    # a slow match running aft
    s = path("M8 30 H168 L160 66 Q88 78 16 66 Z", M["dark"], INK, OL)
    s += rect(40, 34, 92, 30, "#b5533c", INK, DT)
    for y in (40, 46, 52, 58):
        off = 0 if y % 12 else 6
        s += line(40, y, 132, y, INK, HR) + "".join(line(x + off, y - 6, x + off, y, INK, HR) for x in range(46, 132, 12))
    s += rect(48, 40, 76, 20, "#3a2a22", INK, DT)
    for x in (58, 78, 98, 116): s += ell(x, 50, 8, 9, M["tar"], INK, DT) + line(x - 7, 46, x + 7, 46, M["iron"], 1.4)
    for x, y, r in ((52, 30, 6), (66, 28, 7), (82, 30, 5), (96, 28, 7), (112, 29, 6), (124, 30, 5)): s += ell(x, y, r, r * .7, "#9e968a", INK, DT)
    s += path("M132 52 Q146 50 150 40 Q152 30 160 28", "none", INK, DT, extra='stroke-dasharray="4 2"') + spark(161, 27, 5)
    return s

@item("coalpan", 2)
def _():
    # an iron brazier of bars on three legs, coals glowing in it with a few flames, a poker leaning against it, ash below
    s = line(40, 52, 30, 76, INK, 4) + line(88, 52, 98, 76, INK, 4) + line(64, 54, 64, 76, INK, 4)
    s += path("M26 30 H102 L92 54 H36 Z", M["iron"], INK, OL)
    for x in range(36, 96, 10): s += line(x, 32, x + (x - 64) * -.15, 52, INK, DT)
    for x, y in ((40, 30), (52, 26), (64, 28), (76, 25), (88, 29)): s += circ(x, y, 7, FIRE, INK, DT) + circ(x - 2, y - 2, 2.4, FIRE2, None)
    s += flame(56, 22, 16) + flame(76, 20, 12)
    s += line(108, 76, 120, 8, INK, 4) + line(108, 76, 120, 8, M["iron"], 2) + ell(64, 77, 24, 2.4, "#b8b2aa", None)
    return s

@item("linstock", 1)
def _():
    # a linstock standing upright: a wooden staff with an iron-shod foot, a forked iron head shaped like a beast's jaws holding the slow match,
    # the match wound down the staff, one end smouldering
    s = rect(37, 22, 6, 52, "#ddc79c", INK, OL) + path("M37 74 L40 80 L43 74 Z", M["iron"], INK, DT)
    s += path("M40 22 Q28 20 26 10 Q30 6 34 12", "none", INK, 5) + path("M40 22 Q28 20 26 10 Q30 6 34 12", "none", M["iron"], 2.4)
    s += path("M40 22 Q52 20 54 10 Q50 6 46 12", "none", INK, 5) + path("M40 22 Q52 20 54 10 Q50 6 46 12", "none", M["iron"], 2.4)
    s += path("M26 8 Q20 16 30 30 Q46 36 34 44 Q24 52 44 58", "none", INK, 4) + path("M26 8 Q20 16 30 30 Q46 36 34 44 Q24 52 44 58", "none", M["rope"], 2.2)
    s += circ(26, 7, 3, FIRE, INK, HR) + path("M26 4 q-4 -4 0 -8", "none", INK, HR)
    return s

@item("powderhorn", 1)
def _():
    # a cow-horn powder flask: creamy horn curving, a wooden plug in the wide end, a stopper at the spout, a strap, a scratched ship on it
    s = path("M14 30 Q40 18 66 30 Q70 36 64 40 Q44 34 22 46 Z", "#e9dcbf", None)
    s += path("M14 30 Q12 40 22 46 L24 30 Z", M["dark"], INK, DT)
    s += path("M14 30 Q40 18 66 30 Q70 36 64 40 Q44 34 22 46", "none", INK, OL) + path("M58 30 Q64 30 66 32 L66 38 Q62 36 58 36 Z", "#9e8a6a", None)
    s += rect(64, 30, 8, 7, M["brass"], INK, DT)
    s += path("M18 38 Q30 60 50 58 Q66 56 68 36", "none", INK, DT)
    s += path("M34 32 h12 l-2 3 h-8 z M40 32 v-6 l5 5", "none", INK, .8)
    return s

@item("ramrod", 1)
def _():
    # a naval rammer and sponge: a long staff, a fat wooden rammer head at one end, a woolly sheepskin sponge at the other, dripping
    b = rect(16, 38, 48, 5, "#ddc79c", INK, DT)
    b += rect(62, 33, 14, 15, M["wood2"], INK, OL) + rect(60, 36, 3, 9, M["iron"], INK, HR)
    b += path(serrated_blob(10, 40.5, 9, 8, 14, .2, 2, .1), "#efe6cf", INK, DT) + rect(17, 36, 3, 9, M["iron"], INK, HR)
    s = R(b, -40, 40, 40) + path("M22 66 q-1 5 0 8 q2 -4 0 -8", "#a9c3cf", INK, HR)
    return s

@item("tinderbox", 1)
def _():
    # a round tin tinderbox with its lid off (a candle socket on the lid), char cloth inside, a flint shard and a C-shaped fire steel, a spark
    s = ell(32, 52, 24, 8, "#a9b2b6", INK, OL) + rect(8, 52, 48, 16, "#a9b2b6", None) + ell(32, 68, 24, 8, "#a9b2b6", INK, OL)
    s += path("M8 52 V68 M56 52 V68", "none", INK, OL) + ell(32, 52, 20, 6, M["black"], None)
    s += ell(62, 26, 14, 5, "#a9b2b6", INK, DT) + rect(58, 14, 8, 12, "#a9b2b6", INK, DT)
    s += path("M50 44 L60 38 L66 46 L56 50 Z", "#d6cfbe", INK, DT)
    s += path("M68 66 Q78 60 72 52 L64 52", "none", INK, 5) + path("M68 66 Q78 60 72 52 L64 52", "none", M["iron"], 2.6)
    s += spark(62, 34, 5)
    return s

@item("furnace", 2)
def _():
    # a portable shot furnace: a brick oven with an iron firedoor below, a sloping grate of glowing shot, a stovepipe chimney, tongs on a hook
    s = rect(20, 22, 76, 54, "#b5533c", INK, OL)
    for y in (32, 42, 52, 62):
        off = 0 if y % 20 else 8
        s += line(20, y, 96, y, INK, HR) + "".join(line(x + off, y - 10, x + off, y, INK, HR) for x in range(28, 96, 16))
    s += rect(36, 56, 26, 16, M["iron"], INK, DT) + circ(56, 64, 2, INK, None) + rect(40, 60, 18, 4, FIRE, None)
    s += path("M28 46 L88 30 L88 38 L28 54 Z", M["black"], INK, DT)
    for i, x in enumerate((36, 50, 64, 78)): s += circ(x, 46 - (x - 28) * .27, 5, FIRE, INK, HR)
    s += rect(80, 2, 10, 22, M["iron"], INK, DT) + circ(85, 2, 4, "#d8d2c6", None)
    s += line(100, 26, 104, 26, INK, 2.4) + path("M102 26 L98 64 M102 26 L108 64", "none", INK, 2.6)
    return s

@item("kindling", 1)
def _():
    # a bundle of split kindling sticks tied with twine, a wad of tarred oakum tucked in, one stick charred at the tip
    s = ""
    for i, (x0, x1, top) in enumerate(((22, 30, 10), (30, 36, 6), (36, 42, 14), (42, 48, 4), (48, 54, 12), (54, 60, 8))):
        s += path(f"M{x0} 74 L{x0 + 2} {top} L{x1} {top + 2} L{x1 + 1} 74 Z", "#dcc79c" if i % 2 else "#e6d6b0", INK, DT)
    s += path("M42 4 L48 4 L48 10 L43 12 Z", M["black"], None)
    s += rect(18, 40, 46, 6, M["rope"], INK, DT) + rect(18, 56, 46, 6, M["rope"], INK, DT)
    s += path("M30 30 Q36 20 44 26 Q50 32 42 36 Q34 38 30 30 Z", M["tar"], INK, DT)
    return s

@item("gunwale", 2)
def _():
    # a shot garland: a heavy oak rail along the gunwale with scooped hollows, round shot sitting in them, bolted brackets; one hollow empty
    s = rect(4, 44, 120, 16, M["oak"], INK, OL) + rect(4, 60, 120, 6, M["oak2"], INK, DT)
    for x in (16, 112): s += path(f"M{x-6} 66 h12 l-4 10 h-4 Z", M["iron"], INK, DT)
    for i, x in enumerate(range(18, 120, 18)):
        s += path(f"M{x-8} 44 Q{x} 52 {x+8} 44", M["oak2"], INK, DT)
        if i != 3: s += circ(x, 38, 8.6, M["iron2"], INK, OL) + path(f"M{x-5} 35 q2 -3 6 -3", "none", "#7d858b", 1.2)
    return s

@item("magazine", 2)
def _():
    # the powder magazine: kegs with copper hoops racked on a stand, a glazed light-room window glowing with its lantern, a POWDER sign, felt slippers
    s = rect(4, 4, 120, 72, "#cdb79a", INK, OL)
    s += rect(86, 10, 32, 26, M["oak"], INK, DT) + rect(90, 14, 24, 18, "#f2d27a", INK, DT) + line(102, 14, 102, 32, INK, HR) + line(90, 23, 114, 23, INK, HR)
    s += rect(8, 60, 76, 6, M["oak"], INK, DT)
    for x in (20, 46, 72): s += stave_barrel(x, 60, 22, 30, M["wood"], (.2, .8), M["copper"]) + ell(x, 30, 11, 3, shade(M["wood"], .1), INK, HR)
    s += rect(14, 12, 46, 12, M["cream"], INK, DT) + path("M18 15 v6 M18 15 h3 q2 0 2 1.5 q0 1.5 -2 1.5 h-3 M28 15 q-2 0 -2 3 q0 3 2 3 q2 0 2 -3 q0 -3 -2 -3 M33 15 l1.5 6 l1.5 -4 l1.5 4 l1.5 -6 M42 15 v6 h2 q3 0 3 -3 q0 -3 -3 -3 Z M50 15 h-3 v6 h3 M47 18 h2 M52 21 v-6 h2 q2 0 2 1.5 q0 1.5 -2 1.5 h-2 l3 3", "none", INK, .9)
    s += path("M92 72 q0 -6 8 -6 h6 q4 0 4 6 Z M108 72 q0 -6 8 -6 h4 q2 0 2 6 Z", "#8d7d6a", INK, DT)
    return s

@item("phoenix", 2)
def _():
    # a carved phoenix figurehead: an arched neck and open beak, wings swept back flat along the trailboard, carved flames at its base
    s = path("M4 76 Q8 50 26 40 L40 52 Q24 60 22 76 Z", M["dark"], INK, OL)
    s += path("M26 40 Q34 22 52 18 Q62 16 70 22 Q74 26 70 30 Q60 30 56 36 Q50 48 40 52 Z", M["gold"], INK, OL)
    s += path("M70 22 L82 24 L70 28 Z", "#c9963c", INK, DT) + circ(62, 22, 1.8, INK, None)
    for i in range(5):
        y = 34 + i * 6
        s += path(f"M40 {y} Q{80 + i * 8} {y - 10 + i * 3} {120 - i * 6} {y + 4}", "none", INK, 4.4) + path(f"M40 {y} Q{80 + i * 8} {y - 10 + i * 3} {120 - i * 6} {y + 4}", "none", M["gold"], 2.4)
    for x in (30, 44, 58): s += path(f"M{x} 76 C{x-6} 66 {x+4} 60 {x+2} 52 C{x+8} 60 {x+12} 66 {x+6} 76 Z", M["red"], INK, DT)
    s += path("M34 54 l2 -3", "none", M["black"], 1.6)
    return s
