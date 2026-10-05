"""the Bulwark's set: a heavy galleon's armour, anchors and heavy weapons (see item-notes.md)"""
from itemart import *

def ball(x, y, r, col=None):
    col = col or M["iron2"]
    return circ(x, y, r, col, INK, OL) + path(f"M{x-r*.55} {y-r*.35} q{r*.3} {-r*.4} {r*.7} {-r*.45}", "none", "#7d858b", 1.4)

def planks(x0, y0, w, h, step, col, vertical=False, sw=HR):
    s = rect(x0, y0, w, h, col, None)
    if vertical:
        s += "".join(line(x, y0, x, y0 + h, INK, sw) for x in range(int(x0 + step), int(x0 + w), int(step)))
    else:
        s += "".join(line(x0, y, x0 + w, y, INK, sw) for y in range(int(y0 + step), int(y0 + h), int(step)))
    return s

def bolts(pts, r=1.5):
    return "".join(circ(x, y, r, M["iron"], INK, HR * .8) for x, y in pts)

@item("plating", 2)
def _():
    # copper sheathing on a hull section: rectangular plates nailed in overlapping courses like brickwork, verdigris, one plate lifting
    s = rect(4, 6, 120, 68, M["oak"], INK, OL)
    for r_ in range(4):
        y = 8 + r_ * 16
        off = 0 if r_ % 2 == 0 else -16
        for c in range(5):
            x = 6 + off + c * 32
            x0, x1 = max(6, x), min(122, x + 30)
            if x1 - x0 < 6: continue
            col = M["copper"] if (r_ + c) % 3 else "#8fa58a"
            s += rect(x0, y, x1 - x0, 15, col, INK, DT)
            s += "".join(circ(xx, y + 2.4, .9, INK, None) for xx in range(int(x0) + 3, int(x1), 5)) + "".join(circ(x0 + 2.4, yy, .9, INK, None) for yy in range(int(y) + 6, int(y) + 14, 5))
    s += path("M92 40 L104 40 L100 50 Z", "#d39a73", INK, DT) + path("M92 40 L104 40 L100 50 Z", "none", INK, DT)   # a corner bent back
    s += rect(4, 6, 120, 68, "none", INK, OL)
    return s

@item("ballast", 2)
def _():
    # iron ballast pigs stacked crosswise, rounded ends, one with the broad arrow cast in; shingle heaped around
    s = ""
    for (x, y, w) in ((14, 56, 70), (24, 42, 64), (18, 28, 58)):
        s += rect(x, y, w, 14, M["iron"], INK, OL, rx=6) + rect(x + 4, y + 9, w - 8, 4, shade(M["iron"], .3), None) + rect(x, y, w, 14, "none", INK, OL, rx=6)
        s += stipple(x + 4, y + 2, w - 8, 10, 10, "#8a5a3a", 1.8, .8, seed=x)
    s += path("M44 30 l4 6 l4 -6 M48 30 v9", "none", "#cfc6b6", 1.6)
    for i, (x, y, r) in enumerate(((94, 64, 8), (108, 66, 7), (100, 54, 6), (116, 58, 5), (86, 70, 5), (120, 70, 5), (110, 50, 4))):
        s += ell(x, y, r, r * .78, ("#b2aa9c", "#9e968a", "#c4bba9")[i % 3], INK, DT)
    return s

@item("anchor", 3)
def _():
    # an Admiralty-pattern bower anchor lying along: the shank, the crown with two arms and flat palms, the ring with puddening,
    # and the oak stock bound with iron hoops, set at right angles to the arms (so it shows broad here, the arms edge-on curving)
    s = rect(30, 37, 116, 7, M["iron"], INK, OL)                                                  # shank
    s += path("M146 40 Q150 12 132 8", "none", INK, 10.4) + path("M146 40 Q150 12 132 8", "none", M["iron"], 6.4)     # upper arm
    s += path("M146 40 Q150 68 132 72", "none", INK, 10.4) + path("M146 40 Q150 68 132 72", "none", M["iron"], 6.4)   # lower arm
    s += poly([(132, 8), (124, 4), (128, 16), (138, 14)], M["iron"], INK, DT) + poly([(132, 72), (124, 76), (128, 64), (138, 66)], M["iron"], INK, DT)   # palms
    s += circ(150, 40, 6, M["iron"], INK, DT)                                                      # crown
    s += rect(34, 4, 12, 72, M["oak"], INK, OL) + rect(34, 4, 5, 72, tint(M["oak"], .15), None) + rect(34, 4, 12, 72, "none", INK, OL)   # the stock
    for y in (10, 26, 54, 70): s += rect(32, y, 16, 3.6, M["iron"], INK, HR)
    s += circ(20, 40, 12, "none", INK, 6.4) + circ(20, 40, 12, "none", M["iron"], 3.6)              # the ring
    s += path("M14 30 A12 12 0 0 0 10 46", "none", INK, 7.6) + path("M14 30 A12 12 0 0 0 10 46", "none", M["rope"], 5, extra='stroke-dasharray="2 1.4"')   # puddening
    s += path("M8 40 Q0 44 4 56", "none", INK, 7) + path("M8 40 Q0 44 4 56", "none", "#5e4632", 4.6)   # the cable
    return s

@item("figure", 1)
def _():
    # a carved lion figurehead leaning out from the stem: a big scalloped mane, a muzzle with an open mouth, a crown, a paw forward
    s = path("M6 78 Q4 56 16 44 L28 52 Q18 62 20 78 Z", M["dark"], INK, OL)                      # the stem
    s += path("M18 50 Q22 62 40 62 Q50 60 52 52 L46 46 Z", "#c9963c", INK, DT)                       # the body below
    s += path(serrated_blob(36, 34, 20, 20, 16, .16, 3, .05), "#b98a3a", INK, OL)                    # the mane
    for a_ in range(0, 360, 45):
        x, y = 36 + 13 * math.cos(math.radians(a_)), 34 + 13 * math.sin(math.radians(a_))
        s += path(f"M{x:.1f} {y:.1f} q3 -3 5 0", "none", INK, HR)
    s += path("M40 24 Q54 22 62 30 Q70 32 70 40 Q66 46 60 44 Q56 50 46 48 Q38 44 40 24 Z", "#e0b252", INK, OL)   # the face
    s += circ(52, 30, 1.8, INK, None) + path("M48 27 q4 -3 8 0", "none", INK, HR)
    s += path("M60 44 Q64 42 68 44 Q64 46 60 44 Z", M["red"], INK, HR) + circ(69, 35, 2.2, M["dark"], None)   # mouth, nose
    s += path("M24 14 l2 -6 l4 4 l4 -6 l4 6 l4 -4 l2 6 Z", M["gold"], INK, DT)                         # crown
    s += path("M46 52 L62 60 Q66 62 64 66 L46 60 Z", "#e0b252", INK, DT)                              # a paw forward
    s += circ(67, 38, 1.4, "#efe6cf", None)                                                          # a chip of paint on the nose
    return s

@item("chain", 2)
def _():
    # chain shot: two iron balls, each with a cast eye, joined by a short slack chain of heavy links, one link twisted
    s = ""
    pts = [(34, 44), (46, 52), (58, 55), (70, 55), (82, 52), (94, 44)]
    for i, (x, y) in enumerate(pts):
        if i % 2: s += ell(x, y, 6.5, 3.4, "none", INK, 5) + ell(x, y, 6.5, 3.4, "none", M["iron"], 2.4)
        else: s += ell(x, y, 3, 6, "none", INK, 5) + ell(x, y, 3, 6, "none", M["iron"], 2.4)
    s += ball(20, 38, 16) + ball(108, 38, 16)
    s += circ(31, 42, 3.4, "none", INK, 2.6) + circ(97, 42, 3.4, "none", INK, 2.6)
    return s

@item("bulkhead", 2)
def _():
    # a section of internal bulkhead: painted tongue-and-groove planks under a deck beam with a hanging knee, a small door with strap hinges
    s = planks(6, 18, 116, 58, 9, "#d9b46a", vertical=True)
    s += rect(4, 6, 120, 12, M["dark"], INK, OL) + path("M100 18 L118 18 L118 38 Q106 22 100 18 Z", M["dark"], INK, DT)   # beam and knee
    s += rect(40, 30, 32, 46, "#c9a35c", INK, OL) + "".join(line(x, 30, x, 76, INK, HR) for x in (48, 56, 64))
    for y in (36, 64): s += path(f"M40 {y} H58 L60 {y+2} L58 {y+4} H40 Z", M["iron"], INK, HR)
    s += circ(66, 54, 2.2, M["iron"], INK, HR) + path("M20 30 q0 6 4 6", "none", INK, 2.2)              # latch, a lantern hook
    s += path("M88 46 v10 M88 46 q5 0 5 4 q0 4 -5 4 M96 46 v10 h5", "none", M["red2"], 1.6)            # a stencilled number
    s += rect(6, 18, 116, 58, "none", INK, OL)
    return s

@item("breastplate", 1)
def _():
    # a cuirass front: a curved plate with a medial ridge, turned edges at neck and arms, leather straps with brass buckles, a proof dent
    plate = "M18 20 Q24 16 30 20 Q40 26 50 20 Q56 16 62 20 Q66 40 62 58 Q52 72 40 74 Q28 72 18 58 Q14 40 18 20 Z"
    s = path(plate, M["steel"], None) + path("M40 22 Q50 26 58 20 Q66 40 62 58 Q52 72 40 74 Z", M["steel2"], None)
    s += line(40, 24, 40, 72, INK, DT)
    s += path(plate, "none", INK, OL) + path("M30 20 Q40 28 50 20", "none", INK, 4)
    s += rect(18, 8, 8, 14, M["leather"], INK, DT) + rect(54, 8, 8, 14, M["leather"], INK, DT)
    s += rect(19, 10, 6, 4, M["brass"], INK, HR) + rect(55, 10, 6, 4, M["brass"], INK, HR)
    s += "".join(circ(x, 62 + abs(x - 40) * -.3 + 4, 1.2, M["brass"], None) for x in (26, 33, 40, 47, 54))
    s += circ(30, 42, 2.6, M["steel2"], INK, HR)                                                       # the proof mark
    return s

@item("pavise", 2)
def _():
    # a pavise (an old armoury piece): a tall standing shield, its prop behind, painted with a device, a raised spine
    s = line(84, 10, 112, 76, INK, 4) + line(84, 10, 112, 76, M["wood"], 2)                              # the prop
    sh = "M30 6 H96 L98 70 Q64 78 28 70 Z"
    s += path(sh, M["blue"], None) + path("M64 6 H96 L98 70 Q82 74 64 75 Z", shade(M["blue"], .15), None)
    s += rect(56, 6, 16, 70, "#d9c9a0", None) + line(64, 8, 64, 74, INK, HR)
    s += path("M40 28 l6 -8 l6 8 l-6 8 Z M78 28 l6 -8 l6 8 l-6 8 Z", "#d9c9a0", INK, HR)
    s += path(sh, "none", INK, OL) + path("M30 6 H96", "none", INK, OL)
    s += rect(24, 72, 80, 4, M["dark"], INK, DT)
    return s

@item("chainmail", 1)
def _():
    # a mail shirt on a peg: short sleeves, a dagged hem, rings shown sparsely near the edges, a patch of broken rings
    shirt = "M24 10 H56 L72 22 L64 32 L58 28 V70 L52 66 L46 70 L40 66 L34 70 L28 66 L22 70 V28 L16 32 L8 22 Z"
    s = path(shirt, "#8c9399", None) + path("M48 10 H56 L72 22 L64 32 L58 28 V70 L52 66 L48 68 Z", shade("#8c9399", .18), None)
    for (x0, y0, n, dx, dy) in ((26, 14, 6, 5, 0), (26, 60, 6, 5, 0), (12, 22, 3, 4, 3)):
        s += "".join(circ(x0 + i * dx, y0 + i * dy, 1.8, "none", INK, .7) for i in range(n))
    s += path(shirt, "none", INK, OL) + path("M32 10 Q40 18 48 10", "none", INK, DT)
    s += rect(36, 2, 8, 10, M["wood"], INK, DT) + "".join(circ(x, 54, 1.4, "#a0603e", None) for x in (40, 44, 48))
    return s

@item("bastion", 3)
def _():
    # a ship-of-the-line's side as a wall: planking, yellow strakes with black wales (the Nelson chequer), two closed gunports
    # with red-edged lids, the channel with deadeyes above, and a ball lodged in the oak
    s = planks(4, 10, 168, 66, 7, "#d1a64e")
    for y in (26, 54): s += rect(4, y, 168, 9, M["black"], INK, DT)
    for x in (40, 110):
        s += rect(x, 36, 26, 18, M["black"], INK, OL) + rect(x + 1, 37, 24, 2.4, M["red"], None)
        s += line(x + 4, 36, x + 4, 32, INK, 2) + line(x + 22, 36, x + 22, 32, INK, 2)
    s += rect(2, 6, 172, 6, M["dark"], INK, DT)
    for x in (24, 80, 140): s += circ(x, 4, 4, M["dark"], INK, DT) + line(x, 8, x, 26, INK, DT)
    s += circ(92, 64, 6, M["iron2"], INK, DT) + path("M86 58 l-4 -4 M98 58 l4 -4 M92 70 v5", "none", INK, HR)
    s += rect(4, 10, 168, 66, "none", INK, OL)
    return s

@item("tortoise", 2)
def _():
    # a hawksbill turtle's shell side-on: a domed carapace of overlapping scutes in two mottled tones, a serrated rear edge, a trade tag
    dome = "M10 62 Q22 14 64 12 Q104 14 116 52 L120 62 L114 60 L116 66 L108 62 Z"
    s = path(dome, "#a8743a", None)
    for (d, c) in (("M30 24 Q46 16 60 18 L58 38 Q40 40 30 24 Z", "#5e3b27"), ("M66 18 Q86 18 98 28 L84 44 Q70 40 66 18 Z", "#5e3b27"),
                   ("M20 48 Q28 36 40 40 L42 58 Q28 60 20 48 Z", "#7a4e34"), ("M50 44 Q66 44 76 48 L74 62 Q58 62 50 44 Z", "#7a4e34"), ("M86 50 Q98 44 108 52 L104 62 Q92 62 86 50 Z", "#5e3b27")):
        s += path(d, c, INK, HR)
    s += path(dome, "none", INK, OL) + line(8, 62, 114, 62, INK, OL)
    s += path("M18 58 q0 10 6 12", "none", INK, DT) + rect(20, 68, 16, 10, M["paper"], INK, DT) + line(23, 73, 33, 73, INK, HR)
    return s

@item("fortress", 3)
def _():
    # a floating battery: a low heavy hull with no masts, a sloping bomb-proof roof of planks, a row of gunports with muzzles out,
    # an anchor cable down, wet hides draped on the roof
    s = path("M10 50 L166 50 L160 72 Q88 80 16 72 Z", M["tar"], INK, OL)
    s += path("M18 50 L40 22 H138 L160 50 Z", "#9e968a", None)
    for i in range(1, 6): s += line(18 + i * 4.4, 50 - i * 5.6, 160 - i * 4.4, 50 - i * 5.6, INK, HR)
    s += path("M18 50 L40 22 H138 L160 50 Z", "none", INK, OL)
    s += path("M70 22 Q74 36 66 48 L86 48 Q92 34 88 22 Z", "#8a6a4a", INK, DT)                    # a wet hide
    for x in range(26, 160, 22):
        s += rect(x, 55, 12, 9, M["black"], INK, DT) + rect(x + 2, 57.5, 13, 4, M["iron"], INK, HR)
    s += path("M14 62 Q6 70 8 78", "none", INK, DT)
    return s

@item("ram", 3)
def _():
    # a battering ram: a long oak log with an iron head and iron bands, slung from chains on a beam for the boarders to swing
    s = line(20, 4, 156, 4, INK, 6) + line(20, 4, 156, 4, M["dark"], 3.6)
    for x in (44, 120): s += path(f"M{x} 6 L{x - 6} 36", "none", INK, 2.4, extra='stroke-dasharray="3 2"')
    s += rect(10, 36, 136, 22, M["oak"], INK, OL, rx=10) + rect(14, 38, 128, 6, tint(M["oak"], .15), None, rx=3)
    s += ell(14, 47, 5, 10, "#b39069", INK, DT) + ell(14, 47, 2, 4, "none", INK, HR)
    for x in (36, 72, 108): s += rect(x, 34, 6, 26, M["iron"], INK, DT)
    s += path("M144 34 L166 40 L172 47 L166 54 L144 60 Z", M["iron"], INK, OL) + bolts([(150, 40), (150, 54), (160, 47)])
    s += rect(10, 36, 136, 22, "none", INK, OL, rx=10)
    return s

@item("shieldbash", 2)
def _():
    # a Highland targe: a round wooden shield faced in leather, brass nails in circles, an iron boss with a spike, a dent in the boss
    s = circ(64, 40, 34, M["leather"], INK, OL) + path("M64 6 A34 34 0 0 1 64 74 A28 34 0 0 0 64 6 Z", M["leather2"], None)
    for r_, n in ((28, 20), (20, 14), (12, 8)):
        s += "".join(circ(64 + r_ * math.cos(2 * math.pi * i / n), 40 + r_ * math.sin(2 * math.pi * i / n), 1.6, M["brass"], INK, .6) for i in range(n))
    s += circ(64, 40, 34, "none", INK, OL) + circ(64, 40, 8, M["iron"], INK, DT) + path("M64 40 L86 30", "none", INK, 4) + path("M64 40 L86 30", "none", M["iron"], 2)
    s += path("M60 36 q3 2 6 0", "none", INK, HR)
    return s

@item("gauntlet", 1)
def _():
    # an articulated plate gauntlet, fist clenched, side view: flared cuff, overlapping lames over the back of the hand, knuckle plates
    s = path("M10 50 L30 36 L34 66 L12 72 Z", M["steel"], INK, OL) + path("M10 50 L30 36 L32 50 L12 60 Z", M["steel2"], None)
    s += path("M30 36 Q44 26 58 30 Q72 34 72 48 Q72 62 58 64 L34 66 Z", M["steel"], INK, OL)
    for x in (38, 44, 50): s += path(f"M{x} {31 - (x-38)*.2} Q{x+2} 48 {x} 64", "none", INK, DT)
    for y in (40, 48, 56): s += path(f"M58 {y} Q70 {y-2} 72 {y+3}", "none", INK, DT)
    s += path("M58 64 Q52 70 44 66", "#c8a77c", INK, DT)                                               # the leather glove showing
    s += bolts([(20, 50), (24, 62)], 1.3) + path("M64 40 l3 2 M62 52 l3 1", "none", INK, HR)
    return s

@item("crusher", 3)
def _():
    # a boarding bridge: a heavy planked gangway with side ropes, an iron spike at its tip biting down, splinters where it bites
    s = path("M8 30 L150 46 L150 56 L8 40 Z", M["oak"], INK, OL)
    for x in range(22, 150, 16): s += line(x, 31.6 + (x - 8) * .113, x, 41.6 + (x - 8) * .113, INK, HR)
    s += path("M8 30 L150 46", "none", INK, OL)
    for x in (30, 70, 110): s += line(x, 32 + (x - 8) * .113, x, 14 + (x - 8) * .113, INK, 2.4)
    s += path("M30 14 Q70 26 110 26 Q130 28 146 36", "none", INK, DT)
    s += path("M144 46 L162 48 L156 78 Z", M["iron"], INK, OL) + bolts([(150, 50), (156, 52)])
    s += path("M150 74 l-8 4 M160 72 l8 3 M154 70 l-2 8", "none", INK, HR) + line(130, 76, 172, 76, INK, DT)
    return s

@item("carronade", 3)
def _():
    # a carronade on its slide: a short stubby barrel with a cupped muzzle and no trunnions, a lug beneath bolted to the bed,
    # the slide pivoting at the front on a bolt, trucks at the back, the elevating screw sticking up behind the breech
    s = rect(10, 56, 156, 10, M["oak"], INK, OL) + rect(10, 66, 156, 4, M["oak2"], INK, DT)
    s += circ(20, 72, 5, M["oak"], INK, DT) + circ(156, 74, 4, M["iron"], INK, DT)
    s += rect(40, 44, 76, 12, M["oak"], INK, OL)                                                   # the bed
    bar = "M30 30 Q30 18 44 18 L118 24 L128 20 L132 22 L132 40 L128 42 L118 38 L44 44 Q30 44 30 32 Z"
    s += path(bar, M["iron2"], INK, OL) + path("M44 18 L118 24 L118 28 L44 24 Z", "#6d757b", None)
    s += path("M118 24 L128 20 L132 22 L132 40 L128 42 L118 38 Z", M["iron"], INK, DT)
    s += circ(24, 31, 4, M["iron2"], INK, DT)                                                       # cascabel
    s += path("M70 42 L74 48 L86 48 L88 42", M["iron"], INK, DT) + circ(80, 47, 2, INK, None)          # the lug
    s += line(36, 44, 36, 14, INK, 3) + line(28, 14, 44, 14, INK, 3)                                # elevating screw
    return s

@item("broadaxe", 2)
def _():
    # a naval boarding axe: short ash handle, a broad flat blade on one side, a long curved spike on the other, langets down the handle
    s = rect(6, 37, 92, 8, "#dcc79c", INK, OL, rx=3)
    s += rect(72, 35, 30, 12, M["iron"], INK, DT)                                                    # langets
    s += path("M94 30 L104 30 L106 8 Q118 14 124 10 L124 68 Q114 58 106 62 L104 50 L94 50 Z", M["iron"], INK, OL)
    s += path("M94 30 L104 30 L106 8 Q118 14 124 10 L124 20 Q116 22 106 22 Z", "#6d757b", None)
    s += path("M98 30 Q92 20 82 14", "none", INK, 7) + path("M98 30 Q92 20 82 14", "none", M["iron"], 4)  # spike
    s += path("M110 34 l3 5 l3 -5 M113 34 v8", "none", "#cfc6b6", 1.4)
    return s

@item("halberd", 3)
def _():
    # a sergeant's halberd: a long ash shaft, an axe blade and a back spike on the head, a long top spike, langets, an iron butt shoe, a cloth strip
    s = rect(4, 38, 140, 6, "#dcc79c", INK, OL, rx=2) + rect(2, 37, 8, 8, M["iron"], INK, DT)
    s += rect(128, 36, 26, 10, M["iron"], INK, DT)
    s += path("M140 30 L176 41 L140 52 Z", M["iron"], INK, OL) if False else path("M146 37 L174 41 L146 45 Z", M["iron"], INK, OL)
    s += path("M140 36 Q138 18 152 12 L156 36 Z", M["iron"], INK, OL)                               # the axe blade
    s += path("M144 46 Q138 58 128 62 L148 46 Z", M["iron"], INK, DT)                               # the back spike
    s += path("M126 44 q-2 10 -8 16 l4 2 q4 -6 6 -16", M["red"], INK, HR)
    return s

@item("maul", 3)
def _():
    # a shipwright's top maul: long ash handle with a tarred-twine grip, an iron head with a square flat face and a long tapered pein
    s = rect(6, 37, 128, 7, "#dcc79c", INK, OL, rx=3)
    s += rect(10, 36, 26, 9, M["tar"], INK, DT) + "".join(line(x, 36, x + 2, 45, "#5e5246", 1) for x in range(12, 36, 4))
    s += rect(130, 22, 18, 38, M["iron"], INK, OL) + rect(126, 18, 26, 6, M["iron"], INK, DT) + rect(126, 58, 26, 6, M["iron"], INK, DT)
    s += path("M148 30 L172 38 L172 44 L148 52 Z", M["iron"], INK, OL)                              # the pein
    s += path("M130 22 L148 22 L148 30 L130 30 Z", "#6d757b", None)
    return s

@item("grapeshot", 2)
def _():
    # a grape stand: a wooden base disc, a spindle with a top ring, iron balls in tiers inside a canvas bag laced with cord; one ball loose
    s = ell(48, 70, 30, 6, M["wood"], INK, OL)
    bag = "M22 68 Q16 40 26 20 Q48 8 70 20 Q80 40 74 68 Z"
    s += path(bag, "#cfc6b0", None)
    for (x, y) in ((32, 60), (48, 62), (64, 60), (30, 44), (48, 46), (66, 44), (36, 28), (52, 26), (62, 30)):
        s += circ(x, y, 7, M["iron2"], INK, DT)
    s += path(bag, "none", INK, OL)
    for y in (36, 52): s += path(f"M22 {y} Q48 {y+8} 74 {y}", "none", INK, 2) + path(f"M22 {y} Q48 {y+8} 74 {y}", "none", M["rope"], 1)
    for x in (34, 48, 62): s += line(x, 16, x - 2, 68, M["rope"], 1.4)
    s += line(48, 18, 48, 6, INK, 3) + circ(48, 5, 3, "none", INK, 2)
    s += ball(104, 64, 9)
    return s

@item("heavyshot", 1)
def _():
    # a 32-pound round shot sitting in a rope garland ring, a faint casting seam, the broad arrow stamped on it
    s = ell(40, 66, 30, 8, "none", INK, 9.4) + ell(40, 66, 30, 8, "none", M["rope"], 6.4, extra='stroke-dasharray="3 2"')
    s += ball(40, 40, 26)
    s += path("M14 42 Q40 50 66 42", "none", "#5e666c", 1.2)
    s += path("M36 30 l4 -6 l4 6 M40 24 v12", "none", "#9aa2a6", 2)
    return s

@item("capstan", 2)
def _():
    # a capstan: a waisted barrel with whelps, a broad drumhead with square bar holes, two bars run through wide, a pawl ring at the base
    s = path("M44 74 L50 34 H78 L84 74 Z", M["oak"], INK, OL)
    for x in (54, 64, 74): s += path(f"M{x} 34 Q{x + (x-64)*.4} 54 {x + (x-64)*.6} 74", "none", INK, DT)
    s += rect(36, 68, 56, 8, M["iron"], INK, DT) + "".join(rect(x, 64, 5, 5, M["iron"], INK, HR) for x in (40, 62, 84))
    s += rect(36, 20, 56, 14, M["oak"], INK, OL) + rect(36, 16, 56, 5, M["oak2"], INK, DT)
    for x in (44, 58, 72, 84): s += rect(x - 3, 24, 6, 6, M["black"], None)
    s += tube("M2 28 L44 26", "#dcc79c", 4.4, DT) + tube("M84 26 L126 28", "#dcc79c", 4.4, DT)
    s += path("M50 48 Q64 56 78 48", "none", INK, 6) + path("M50 48 Q64 56 78 48", "none", "#6b4a32", 3.6)
    return s

@item("drydock", 2)
def _():
    # a caulking kit: the long-headed caulking mallet with iron bands and a slot, three caulking irons of different widths, a twist of oakum
    s = rect(6, 20, 54, 16, M["black"], INK, OL, rx=3) + rect(10, 20, 4, 16, M["iron"], INK, HR) + rect(52, 20, 4, 16, M["iron"], INK, HR) + rect(28, 26, 12, 4, "#5a5048", None)
    s += rect(30, 36, 8, 34, M["wood"], INK, DT)
    for i, (x, w) in enumerate(((72, 10), (88, 7), (102, 5))):
        s += rect(x, 14, 6, 24, M["wood"], INK, DT) + path(f"M{x-1} 38 H{x+7} L{x+3+w/2} 66 H{x+3-w/2} Z", M["iron"], INK, DT)
        s += path(f"M{x+1} 46 l2 6", "none", M["tar"], 2)
    s += path("M60 70 Q72 62 84 70 Q96 76 110 68 Q118 64 122 70 Q110 80 92 76 Q74 80 60 70 Z", "#b0905e", INK, DT)
    s += path("M66 70 Q80 66 94 72 M98 72 Q108 68 116 70", "none", INK, HR)
    return s

@item("oak", 2)
def _():
    # squared oak baulks stacked, one with its end grain toward you (rings and a crack, the broad arrow), adze marks, a curved compass timber on top
    s = rect(6, 50, 116, 24, M["oak"], INK, OL) + rect(6, 36, 92, 16, M["oak"], INK, OL)
    for (x, y) in ((24, 58), (60, 62), (90, 56), (30, 42), (70, 44)): s += path(f"M{x} {y} q4 -2 8 0", "none", INK, HR)
    s += rect(98, 26, 26, 26, "#b39069", INK, OL)
    for r_ in (4, 8, 11): s += circ(111, 39, r_, "none", INK, HR * .8)
    s += path("M111 39 L120 30", "none", INK, DT) + path("M104 46 l4 -6 l4 6 M108 40 v9", "none", M["tar"], 1.4)
    s += path("M14 34 Q20 10 52 8 L54 18 Q30 20 26 36 Z", M["oak"], INK, OL)                        # the compass timber
    return s

@item("ironbound", 3)
def _():
    # a heavy hull in elevation from the rail to below the waterline: curved planking, diagonal iron straps with bolts, copper below, barnacles
    hull = "M6 10 H170 Q172 50 150 74 H26 Q6 52 6 10 Z"
    s = path(hull, M["oak"], None)
    for y in (20, 30, 40): s += path(f"M8 {y} H168", "none", INK, HR)
    s += path("M14 50 H162 Q156 66 150 74 H26 Q16 62 14 50 Z", M["copper"], None)
    s += path("M14 50 H162", "none", INK, DT)
    for x in (30, 66, 102, 138):
        s += path(f"M{x} 10 L{x+20} 48", "none", INK, 7) + path(f"M{x} 10 L{x+20} 48", "none", M["iron"], 4.4)
        s += bolts([(x + 4, 18), (x + 10, 29), (x + 16, 40)])
    s += stipple(30, 60, 110, 10, 30, "#efe6cf", 1.8, .9, seed=5)
    s += path(hull, "none", INK, OL)
    return s

@item("keel", 2)
def _():
    # a keel timber with an angled scarf joint and its clinched bolts, a false keel beneath, floor timbers rising in a row above
    s = ""
    for x in range(12, 124, 14): s += path(f"M{x} 40 Q{x+2} 20 {x+10} 10", "none", INK, 7) + path(f"M{x} 40 Q{x+2} 20 {x+10} 10", "none", M["oak2"], 4.4)
    s += rect(4, 40, 120, 18, M["oak"], INK, OL)
    s += path("M60 40 L72 40 L66 58 L54 58 Z", "#b39069", INK, DT)                                   # the scarf
    s += bolts([(58, 44), (64, 50), (70, 44), (62, 54)])
    s += rect(4, 58, 120, 10, M["copper"], INK, DT) + "".join(line(x, 58, x, 68, INK, HR) for x in range(20, 124, 20))
    return s

@item("lastline", 2)
def _():
    # boarding netting: a high net of tarred rope with a big diamond mesh, stretched between spars above the rail, a cutlass stuck through it
    s = rect(4, 66, 120, 10, M["oak"], INK, OL)
    s += rect(8, 6, 5, 62, M["dark"], INK, DT) + rect(115, 6, 5, 62, M["dark"], INK, DT) + line(10, 8, 118, 8, INK, 2.6)
    for i in range(-6, 14):
        x = i * 10
        s += line(max(12, x), 8 + max(0, 12 - x) * 1, min(116, x + 58), 66 - max(0, x + 58 - 116), M["tar"], 1.6)
        s += line(min(116, x + 58), 8 + max(0, x + 58 - 116), max(12, x), 66 - max(0, 12 - x), M["tar"], 1.6)
    s += f'<g transform="rotate(-24 70 36)">' + path("M60 36 L106 30 L102 36 L60 40 Z", M["steel"], INK, DT) + circ(56, 38, 5, M["iron"], INK, DT) + rect(40, 35, 14, 6, M["iron2"], INK, DT) + "</g>"
    return s

@item("counterweight", 1)
def _():
    # a deep-sea sounding lead: a tapered lead weight, a rope eye on top, tallow in the hollow base with sand stuck in it; the marked line
    s = path("M40 6 Q40 2 44 4 L44 10", "none", INK, DT) + rope_line("M40 2 Q36 -4 30 2 Q26 10 34 14", 3)
    s += path("M32 16 H48 L56 70 H24 Z", "#8d9196", INK, OL) + path("M44 16 H48 L56 70 H48 Z", shade("#8d9196", .2), None)
    s += circ(40, 14, 5, "none", INK, 3)
    s += ell(40, 70, 16, 4, "#e9dcae", INK, DT) + stipple(28, 68, 24, 4, 10, "#b8a477", 1.6, .9, seed=2)
    s += rect(20, 30, 8, 4, M["red"], INK, HR) + line(28, 32, 32, 32, INK, HR)
    return s

@item("standard", 1)
def _():
    # an ensign on its staff: a brick field with a cream canton device, a gilded truck on the staff, the fly tattered and shot through
    s = line(14, 6, 14, 78, INK, 5) + line(14, 6, 14, 78, M["wood"], 2.6) + circ(14, 5, 4, M["gold"], INK, DT)
    flag = "M16 10 Q40 6 56 12 Q66 16 74 12 L70 20 L74 26 L68 30 L72 38 Q60 42 46 38 Q30 34 16 38 Z"
    s += path(flag, M["red"], None) + path("M16 10 Q28 8 38 9 L38 24 Q26 24 16 25 Z", M["cream"], None)
    s += circ(27, 16.5, 4.4, M["blue"], INK, HR) + circ(27, 16.5, 1.6, M["cream"], None)
    s += path(flag, "none", INK, OL) + circ(56, 26, 2.2, "#d3b48a", INK, HR)
    return s
