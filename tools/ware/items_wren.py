"""the Wren's set: a fast sloop's blades, pistols and sails (see item-notes.md)"""
from itemart import *

CAN, CAN2 = M["canvas"], M["canvas2"]
SPAR = "#d2a85c"

def seams(pts_from, pts_to, n):
    """cloth seams between two edges (lists of two points each)"""
    (a0, a1), (b0, b1) = pts_from, pts_to
    s = ""
    for i in range(1, n):
        t = i / n
        s += line(a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t, b0[0] + (b1[0] - b0[0]) * t, b0[1] + (b1[1] - b0[1]) * t, INK, HR * .8)
    return s

def spar(x0, y0, x1, y1, w=4, col=SPAR):
    return tube(f"M{x0} {y0} L{x1} {y1}", col, w, DT)

def pistol(x, y, k=1.0, hook=False, ribbon=None):
    """a sea-service flintlock pistol, muzzle right; (x,y) is the top of the grip; about 70k wide"""
    s = ""
    if hook: s += path("M14 -7 L44 -9 L44 -6 L16 -4 Z", M["steel"], INK, DT)                            # the belt hook
    s += rect(20, -6, 50, 6, M["iron"], INK, DT) + rect(66, -7, 4, 8, M["iron2"], INK, DT)             # barrel and muzzle
    s += line(24, -4.6, 62, -4.6, "#8c949a", 1)
    stock = "M20 -6 H42 V3 Q30 4 24 9 L12 27 Q6 33 0 27 L7 6 Q10 -5 20 -6 Z"
    s += path(stock, M["wood2"], INK, OL) + path("M20 -6 H42 V-2 H18 Z", tint(M["wood2"], .15), None)
    s += ell(2, 28, 6, 4.6, M["brass"], INK, DT)                                                     # butt cap
    s += path("M22 6 Q24 16 34 12 Q36 6 34 3", "none", INK, 4) + path("M22 6 Q24 16 34 12 Q36 6 34 3", "none", M["brass"], 2)   # trigger guard
    s += line(28, 4, 27, 10, INK, 2)                                                                 # trigger
    s += flint_lock(26, -9, .7)
    if ribbon: s += path("M2 24 q-6 6 -2 12 l6 -8 z", ribbon, INK, DT)
    return f'<g transform="translate({x} {y}) scale({k})">{s}</g>'

def hilt_smallsword(x, y, deg, k=1.0, knot=None):
    """a smallsword hilt at (x,y) pointing the blade along +x before rotation"""
    s = ell(0, 0, 4, 10, M["steel"], INK, DT) + ell(2, 0, 3, 8, shade(M["steel"], .15), None)               # shell guard
    s += path("M-2 -6 Q-12 -12 -22 -6", "none", INK, 4) + path("M-2 -6 Q-12 -12 -22 -6", "none", M["steel"], 1.8)   # knuckle bow
    s += line(0, 9, 0, 14, INK, 3) + circ(0, 15, 2, M["steel"], INK, HR)                                   # quillon
    s += grip(-4, 0, -20, 0, 6, M["steel2"], 5)
    s += circ(-23, 0, 4, M["steel"], INK, DT)
    if knot: s += path("M-12 -11 q-2 10 -6 16 l3 1 q2 -8 5 -14", knot, INK, HR)
    return f'<g transform="translate({x} {y}) rotate({deg}) scale({k})">{s}</g>'

# ---------------------------------------------------------------- sails and rigging
@item("sail", 1)
def _():
    # a spare sail furled into a long roll, lying across: canvas with seams, rope stops tied round it, the bolt rope and a cringle at the end
    roll = R(rect(10, 30, 60, 20, CAN, None, rx=10) + rect(10, 42, 60, 8, CAN2, None) + rect(24, 36, 12, 6, "#e3d8bc", INK, HR)
             + "".join(path(f"M{x} 30 q3 10 0 20", "none", INK, HR) for x in (22, 40, 56))
             + rect(10, 30, 60, 20, "none", INK, OL, rx=10)
             + ell(68, 40, 5, 10, CAN2, INK, DT) + path("M68 33 q-3 7 0 14 M68 36 q2 4 0 8", "none", INK, HR)
             + "".join(line(x, 28, x - 1, 52, INK, 4.6) + line(x, 28, x - 1, 52, M["rope"], 2.6) for x in (18, 34, 50, 62))
             + path("M10 40 q-6 4 -4 10", "none", INK, DT) + circ(5, 52, 3, "none", INK, DT), -35, 40, 40)
    return roll

@item("jib", 1)
def _():
    # a jib on its stay: straight luff with hanks, clew aft, seams parallel to the leech, the sheet trailing to a block
    s = line(10, 4, 34, 76, INK, DT)                                                                    # the stay
    tri = [(12, 8), (34, 74), (72, 62)]
    s += path("M12 8 L34 74 L72 62 Q46 38 12 8 Z", CAN, None) + path("M40 50 L72 62 L34 74 Z", CAN2, None)
    for t in (.3, .5, .7):
        s += line(12 + 22 * t, 8 + 66 * t, 12 + 60 * t + 4, 8 + 54 * t + 2, INK, HR * .8)
    for t in (.12, .3, .48, .66, .84):
        s += circ(12 + 22 * t, 8 + 66 * t, 2.2, "none", INK, HR)                                         # hanks
    s += path("M12 8 L34 74 L72 62 Q46 38 12 8 Z", "none", INK, OL)
    s += path("M72 62 Q76 70 70 76", "none", INK, DT) + ell(70, 77, 3, 2.4, M["wood"], INK, HR)
    return s

@item("flyingjib", 1)
def _():
    # a small high flying jib set from the topmast to the very tip of the jib-boom, which has an iron cap
    s = spar(2, 70, 72, 52, 4.6) + rect(70, 49, 6, 7, M["iron"], INK, DT)
    s += path("M24 6 L74 50 Q48 46 32 54 Z", CAN, None) + path("M24 6 L74 50 Q60 48 50 49 Z", tint(CAN, .2), None)
    s += line(24, 6, 74, 50, INK, HR)
    for t in (.33, .66):
        s += line(24 + 8 * t, 6 + 48 * t, 24 + 50 * t, 6 + 44 * t, INK, HR * .8)
    s += path("M24 6 L74 50 Q48 46 32 54 Z", "none", INK, OL)
    s += path("M32 54 Q30 62 22 64", "none", INK, DT)
    return s

@item("mainsail", 3)
def _():
    # a sloop's gaff mainsail sheeted out: mast with hoops on the left, gaff angled up, boom along the foot, reef points, seams
    s = rect(10, 4, 7, 74, SPAR, INK, OL)
    sail = [(18, 14), (124, 6), (166, 60), (18, 66)]
    s += P(sail, CAN, 0, None) + P([(120, 7), (124, 6), (166, 60), (150, 62)], CAN2, 0, None)
    for i in range(1, 8):
        t = i / 8; x0 = 18 + 106 * t; y0 = 14 - 8 * t; x1 = 18 + 148 * t; y1 = 66 - 6 * t
        s += line(x0, y0, x1, y1, INK, HR * .8)
    s += path("M18 50 L163 56", "none", INK, HR)                                                         # the reef band
    for i in range(12):
        x = 26 + i * 11; y = 50 + (x - 18) / 145 * 6
        s += path(f"M{x} {y} l-1 5 M{x} {y} l1 -4", "none", INK, HR)
    s += P(sail, "none", OL)
    s += spar(16, 14, 128, 4, 4.4) + spar(14, 66, 170, 62, 5)                                           # gaff and boom
    for y in (22, 34, 46, 58): s += ell(13.5, y, 6, 2.4, "none", INK, DT)                                # mast hoops
    return s

@item("topsail", 2)
def _():
    # a square topsail on its yard, bellied: wider at the foot, reef band and points near the head, clewlines at the corners
    s = spar(8, 12, 120, 12, 5) + rect(60, 2, 8, 12, SPAR, INK, DT)
    sail = "M20 14 H108 Q118 44 120 70 Q64 78 8 70 Q10 44 20 14 Z"
    s += path(sail, CAN, None) + path("M86 14 H108 Q118 44 120 70 Q104 73 90 74 Q94 44 86 14 Z", CAN2, None)
    for x in (34, 50, 64, 78, 94): s += path(f"M{x} 15 Q{x + (x-64)*.18} 44 {x + (x-64)*.3} 74", "none", INK, HR * .8)
    s += path("M18 26 H110", "none", INK, HR) + rect(56, 24, 14, 6, "#e3d8bc", INK, HR)                     # a patched reef band
    for x in range(24, 108, 9): s += line(x, 26, x, 30, INK, HR)
    s += path(sail, "none", INK, OL)
    s += path("M8 70 Q2 54 10 40", "none", INK, DT) + path("M120 70 Q126 54 118 40", "none", INK, DT)
    return s

@item("spinnaker", 3)
def _():
    # studding sails: a square sail on its yard with a narrower stunsail set out beyond it on a boom, the boom's iron ring
    s = spar(30, 14, 140, 14, 5) + spar(134, 14, 172, 14, 3.4) + circ(138, 14, 4.4, "none", INK, 2.6)   # yard, stunsail boom, ring
    sail = "M40 16 H130 Q138 46 140 74 Q86 80 30 74 Q32 46 40 16 Z"
    s += path(sail, CAN, None) + path("M106 16 H130 Q138 46 140 74 Q124 77 112 78 Q116 46 106 16 Z", CAN2, None)
    for x in (56, 72, 86, 100, 116): s += path(f"M{x} 17 Q{x + (x-86)*.15} 46 {x + (x-86)*.25} 78", "none", INK, HR * .8)
    s += path(sail, "none", INK, OL)
    st = "M142 6 H170 L174 72 H144 Z"
    s += spar(140, 6, 172, 6, 2.6) + path(st, tint(CAN, .3), None) + path(st, "none", INK, DT)
    s += line(156, 7, 158, 72, INK, HR * .8)
    st2 = "M4 6 H30 L28 72 H2 Z"
    s += spar(2, 6, 34, 6, 2.6) + path(st2, tint(CAN, .3), None) + path(st2, "none", INK, DT) + line(16, 7, 15, 72, INK, HR * .8)
    return s

@item("crows", 2)
def _():
    # a fighting top: lower masthead, the D-shaped platform edge-on with its rail, futtock shrouds, the cap, the topmast; a gull
    s = rect(58, 44, 12, 34, SPAR, INK, OL)                                                         # lower mast
    s += rect(60, 2, 8, 40, SPAR, INK, DT)                                                          # topmast
    s += rect(54, 26, 20, 8, M["tar"], INK, DT)                                                     # the cap
    for x in (18, 36, 92, 110):
        s += line(x, 42, 64 + (x - 64) * .2, 76, INK, DT)                                           # futtock shrouds
    s += rect(10, 38, 108, 7, M["dark"], INK, OL)                                                   # the platform
    s += line(14, 26, 114, 26, INK, DT)
    for x in range(14, 116, 10): s += line(x, 26, x, 38, INK, HR)                                   # the rail
    s += line(64, 4, 14, 38, INK, HR) + line(64, 4, 114, 38, INK, HR)                              # topmast shrouds
    b = path("M-9 0 Q-2 -11 8 -2 L11 0 Z", M["paper"], INK, DT) + circ(7, -7, 3.6, M["paper"], INK, DT) + poly([(10.4, -7.6), (15, -6.6), (10.4, -5.6)], M["gold"], INK, HR)
    s += f'<g transform="translate(98 24)">{b}</g>'
    return s

@item("bowsprit", 2)
def _():
    # the bow: stem and cutwater, the bowsprit running out and up, gammoning lashings, the bobstay, the jib-boom beyond its cap
    s = path("M4 78 L4 40 Q8 28 22 26 L30 34 Q20 42 22 78 Z", M["dark"], INK, OL)                  # the bow
    s += path("M22 26 Q30 30 36 40 Q34 60 34 78 L22 78 Q20 42 30 34 Z", M["tar"], INK, DT)          # cutwater
    s += circ(26, 24, 5, M["brass"], INK, DT) + path("M26 19 q6 -4 8 2", "none", INK, DT)             # a scroll at the stem head
    s += spar(14, 40, 92, 18, 7) + spar(86, 22, 126, 10, 4.4)
    s += rect(84, 14, 9, 11, M["iron"], INK, DT)
    for x in (30, 36, 42):
        s += line(x, 30 + (x - 30) * -.1, x + 2, 48, INK, 3.6) + line(x, 30 + (x - 30) * -.1, x + 2, 48, M["tar"], 1.6)
    s += path("M88 22 Q66 50 34 66", "none", INK, 2.4) + path("M88 22 Q66 50 34 66", "none", M["iron"], 1, extra='stroke-dasharray="2 2"')   # bobstay chain
    s += line(124, 10, 108, 2, INK, HR)
    return s

@item("windvane", 1)
def _():
    # the masthead: the round truck, a spindle, a swallow-tailed bunting vane, and a feathered dog vane streaming off a stay
    s = rect(34, 40, 12, 38, SPAR, INK, OL) + ell(40, 40, 10, 4, SPAR, INK, DT)
    s += line(40, 40, 40, 6, INK, 2.4)
    s += path("M40 8 L72 12 L64 16 L72 20 L40 22 Z", M["red"], INK, DT) + line(44, 15, 62, 16, M["cream"], 1.4)
    s += path("M34 52 Q20 56 8 62", "none", INK, HR)
    for i, (x, y) in enumerate(((28, 54.5), (20, 57.7), (12, 60.8))):
        s += ell(x, y, 3, 2.4, "#c8a97a", INK, HR) + path(f"M{x} {y-2} l-3 -6 M{x} {y-2} l1 -7", "none", INK, HR)
    return s

@item("figure8", 1)
def _():
    # a figure-eight stopper in a rope's end: two loops crossing once in the middle, a whipped tail below
    d1 = "M40 4 V20 C40 30 60 30 60 40 C60 52 40 52 40 40 C40 30 20 30 20 22 C20 12 40 12 40 24 V60"
    s = rope_line(d1, 6.4)
    s += rect(36, 60, 8, 8, "#7a5a3e", INK, DT) + "".join(line(36, y, 44, y, INK, HR) for y in (62, 64, 66))
    s += path("M37 68 l-2 6 M40 68 v7 M43 68 l2 6", "none", M["rope2"], 1.8)
    return s

@item("kite", 2)
def _():
    # a hoist of signal flags on a halyard: square flags in simple divisions and a pennant, toggled together; one curling
    s = path("M4 20 Q64 30 124 18", "none", INK, DT)
    flags = [("M10 22 h22 v20 h-22 Z", [("M10 22 h11 v10 h-11 Z", M["red"]), ("M21 32 h11 v10 h-11 Z", M["red"])], M["cream"]),
             ("M38 25 h22 v20 h-22 Z", [("M38 32 h22 v6 h-22 Z", M["blue"])], M["cream"]),
             ("M66 25 h22 v20 h-22 Z", [], M["gold"]),
             ("M94 23 h24 l-6 10 6 10 h-24 Z", [("M94 23 h8 v20 h-8 Z", M["blue"])], M["red"])]
    for d, parts, base in flags:
        s += path(d, base, None) + "".join(path(pd, c, None) for pd, c in parts) + path(d, "none", INK, DT)
    s += circ(77, 35, 5, M["red"], INK, HR)
    for x in (10, 38, 66, 94): s += line(x - 3, 23, x, 23, INK, 2)
    return s

@item("slipstream", 1)
def _():
    # a chip log: the quarter-circle log-chip with lead on its curve, a three-leg bridle, the knotted line off a hand reel
    s = path("M8 40 L36 40 A28 28 0 0 1 8 68 Z", "#ddc59a", INK, OL) + path("M36 40 A28 28 0 0 1 8 68", "none", M["iron"], 3.4) + path("M36 40 A28 28 0 0 1 8 68", "none", INK, HR)
    s += line(8, 40, 22, 30, INK, HR) + line(30, 44, 22, 30, INK, HR) + line(16, 56, 22, 30, INK, HR)
    s += path("M22 30 Q40 14 58 26", "none", INK, DT)
    for x, y in ((30, 22), (38, 19), (46, 19), (54, 23)): s += circ(x, y, 1.6, INK, None)
    s += rect(31, 17, 4, 6, M["red"], INK, HR)                                                          # the stray-line rag
    s += circ(62, 30, 12, "none", INK, 3.6) + circ(62, 30, 12, "none", M["wood"], 1.6) + circ(62, 30, 7, M["rope"], INK, DT)
    s += line(62, 18, 62, 6, INK, 3) + line(62, 42, 62, 74, INK, 3) + line(62, 42, 62, 74, M["wood"], 1.4)
    return s

@item("tailwind", 1)
def _():
    # a sea witch's wind cord: a pale cord in a gentle S with three knots, the first half-undone, a red thread at the end
    d = "M10 14 C30 6 50 24 40 38 C30 52 50 70 70 64"
    s = path(d, "none", INK, 5.6) + path(d, "none", "#f4ecd8", 3.2)
    for x, y, r in ((24, 12, 5), (40, 38, 6), (56, 64, 5.4)):
        s += ell(x, y, r, r * .8, "#f4ecd8", INK, DT) + path(f"M{x-r*.6} {y-1} q{r*.6} {r*.8} {r*1.2} 0", "none", INK, HR)
    s += path("M24 12 q4 -8 10 -4", "none", INK, HR)                                                   # the first knot, loosening
    s += line(70, 64, 76, 62, M["red"], 3.4) + circ(10, 14, 2, M["red"], None)
    return s

# ---------------------------------------------------------------- blades
@item("rapier", 1)
def _():
    # a smallsword: long thin triangular-section blade, a small shell guard, knuckle bow, wire-wrapped grip, a sword knot
    s = R(blade(28, 40, 78, 40, 4.6, 2.4, back=True) + hilt_smallsword(26, 40, 0, 1, M["red"]), -40, 40, 40)
    return s

@item("stiletto", 1)
def _():
    # a gunner's stiletto: a slender needle blade with a scale engraved, short crossguard with ball ends, turned grip, onion pommel
    b = path("M30 36 L74 40 L30 44 Z", M["steel2"], INK, OL) + line(32, 40, 70, 40, INK, HR)
    for i in range(6): b += line(36 + i * 6, 38.5, 36 + i * 6, 41.5, INK, HR)
    b += line(28, 30, 28, 50, INK, 4.2) + line(28, 30, 28, 50, M["iron"], 2) + circ(28, 29, 2.4, M["iron"], INK, HR) + circ(28, 51, 2.4, M["iron"], INK, HR)
    b += path("M27 37 Q20 34 12 38 L12 42 Q20 46 27 43 Z", M["dark"], INK, DT) + line(18, 36, 18, 44, INK, HR) + line(22, 36, 22, 44, INK, HR)
    b += path("M12 37 Q4 34 4 40 Q4 46 12 43 Z", M["iron"], INK, DT)
    return R(b, -40, 40, 40)

@item("twinblades", 2)
def _():
    # a mismatched pair of hangers crossed in a shallow X: short curved blades, brass shell guards, pale stag-horn grips
    def hanger(L):
        h = blade(30, 0, 30 + L, 0, 8, 6, curve=-.4)
        h += ell(28, 0, 3, 8, M["brass"], INK, DT) + path("M26 -5 Q16 -12 6 -6", "none", INK, 3.6) + path("M26 -5 Q16 -12 6 -6", "none", M["brass"], 1.6)
        h += grip(25, 0, 8, 0, 7, "#e2d6b8", 3) + ell(6, 0, 3, 3.4, M["brass"], INK, DT)
        return h
    s = f'<g transform="translate(10 52) rotate(-14)">{hanger(84)}</g>' + f'<g transform="translate(10 26) rotate(14)">{hanger(76)}</g>'
    return s

@item("swordcane", 1)
def _():
    # a malacca cane, its brass knob drawn up a little to show the blade at the joint; a tassel cord; a brass ferrule
    s = rect(36, 34, 9, 42, "#b98d5c", INK, OL, rx=3) + rect(36, 76, 9, 3, M["brass"], INK, DT)
    for y in (46, 60): s += line(36, y, 45, y + 1, INK, HR)
    s += path("M38 34 L40 16 L42 34 Z", M["steel"], INK, DT)                                          # the blade showing
    s += rect(36, 10, 9, 8, "#b98d5c", INK, DT)
    s += path("M34 10 Q34 0 44 0 Q56 0 56 8 Q56 12 50 12 L46 12 L46 10 Z", M["brass"], INK, OL)
    s += path("M36 14 Q28 18 30 28", "none", INK, DT) + path("M28 28 l-2 8 l4 0 l2 -8 Z", M["red"], INK, HR)
    return s

@item("sabre", 2)
def _():
    # a 1796-style light cavalry sabre: markedly curved broad blade widening to a hatchet point, a fuller, a stirrup hilt
    s = blade(34, 50, 124, 34, 11, 13, curve=-1.6)
    s += path("M40 48 Q80 32 116 34", "none", shade(M["steel"], .3), 1.6)                             # the fuller
    s += path("M32 46 L28 30 Q12 32 10 50", "none", INK, 5.4) + path("M32 46 L28 30 Q12 32 10 50", "none", M["iron"], 2.8)   # stirrup
    s += rect(30, 42, 6, 14, M["iron"], INK, DT)
    s += grip(30, 52, 12, 56, 9, M["black"], 6) + ell(10, 56, 4, 4.6, M["iron"], INK, DT)
    s += path("M16 58 q-4 10 2 16 l4 -2 q-4 -6 0 -12", M["leather"], INK, HR)                        # leather knot
    return s

@item("cutlass2", 2)
def _():
    # a briquet-style boarding sabre: short stout curved blade, a one-piece cast brass hilt with a ribbed grip; tally notches
    s = blade(36, 46, 120, 26, 13, 10, curve=-.8)
    s += path("M36 40 Q20 30 12 44", "none", INK, 6) + path("M36 40 Q20 30 12 44", "none", M["brass"], 3)   # knuckle bow
    s += path("M34 40 L40 38 L40 56 L34 54 Z", M["brass"], INK, DT)
    s += path("M34 44 L14 46 Q8 50 12 56 L34 54 Z", M["brass"], INK, OL)
    for x in (18, 22, 26, 30): s += line(x, 46, x, 55, INK, HR)
    s += line(20, 44, 21, 47, M["iron"], 1.6) + line(24, 44, 25, 47, M["iron"], 1.6) + line(28, 44, 29, 47, M["iron"], 1.6)
    return s

@item("boathook", 1)
def _():
    # a boathook head on its pole: a straight spike and a backward-curving hook on a socket, whipping at the socket
    b = rect(4, 37, 44, 7, "#dcc79c", INK, OL, rx=3)
    b += path("M46 36 L56 38 L56 43 L46 45 Z", M["iron"], INK, DT)
    b += path("M56 39 L76 40.5 L56 42 Z", M["iron"], INK, DT)                                         # the spike
    b += path("M56 39 Q64 26 54 22", "none", INK, 5.6) + path("M56 39 Q64 26 54 22", "none", M["iron"], 2.8) + poly([(54, 22), (50, 26), (56, 27)], M["iron"], INK, HR)
    for x in (38, 41, 44): b += line(x, 37, x, 44, M["tar"], 1.6)
    return R(b, -40, 40, 40)

@item("lastword", 1)
def _():
    # a midshipman's dirk: straight narrow double-edged blade with an engraved motto, small cross with ball ends, ivory grip, brass lion pommel
    b = path("M32 37 H70 L78 40 L70 43 H32 Z", M["steel"], INK, OL) + line(34, 40, 72, 40, shade(M["steel"], .3), 1)
    b += path("M38 39 l2 -1 l2 1 l2 -1 l2 1 M50 39 l2 -1 l2 1 l2 -1 M60 39 l2 -1 l2 1", "none", INK, .7)  # engraving
    b += line(30, 30, 30, 50, INK, 4) + line(30, 30, 30, 50, M["brass"], 2) + circ(30, 29, 2.4, M["brass"], INK, HR) + circ(30, 51, 2.4, M["brass"], INK, HR)
    b += path("M29 36 Q20 34 12 36 L12 44 Q20 46 29 44 Z", "#efe6cf", INK, DT) + "".join(line(x, 35.5, x + 1, 44.5, INK, HR * .7) for x in (16, 20, 24))
    b += path("M12 35 Q2 34 2 40 Q2 46 12 45 Z", M["brass"], INK, DT) + circ(6, 39, 1, INK, None)
    return R(b, -40, 40, 40)

# ---------------------------------------------------------------- firearms
@item("quickdraw", 1)
def _():
    # a short sea-service belt pistol: the long steel belt hook clearly drawn; walnut stock, brass butt cap, flintlock
    return pistol(5, 30, 1.0, hook=True)

@item("flintlock", 2)
def _():
    # a sea-service musketoon: a long barrel held by pins, a full stock, the lock (flint in a scrap of leather), brass guard and butt plate, ramrod
    s = rect(36, 30, 88, 6, M["iron"], INK, DT) + rect(120, 29, 5, 8, M["iron2"], INK, DT)
    s += path("M4 50 Q6 36 22 34 L36 30 H104 V38 H40 Q30 40 26 46 L14 62 Q6 64 4 58 Z", M["wood2"], INK, OL)
    s += path("M36 30 H104 V33 H36 Z", tint(M["wood2"], .15), None)
    s += line(40, 41, 104, 41, INK, 3) + line(40, 41, 104, 41, M["wood"], 1.4)                        # the ramrod
    s += path("M4 52 L14 62 Q8 66 3 60 Z", M["brass"], INK, DT)                                       # butt plate
    for x in (64, 88): s += circ(x, 35, 1.3, M["brass"], None)
    s += path("M32 42 Q34 52 44 48 Q46 42 44 40", "none", INK, 4) + path("M32 42 Q34 52 44 48 Q46 42 44 40", "none", M["brass"], 2) + line(37, 40, 36, 46, INK, 2)
    s += flint_lock(36, 27, .85)
    s += rect(34, 15.5, 4, 3, M["leather"], None)
    return s

@item("pistols", 2)
def _():
    # a brace of pistols, one above the other, joined at the butts by a ribbon tied in a knot
    s = pistol(46, 18, .95) + pistol(30, 44, .95)
    s += path("M40 42 Q34 48 30 66 L36 68 Q38 54 46 46 Z", M["red"], INK, DT) + circ(38, 52, 4, M["red"], INK, DT)
    s += path("M34 56 l-8 12 l5 1 l6 -10", M["red"], INK, HR)
    return s

# ---------------------------------------------------------------- the rest
@item("eel", 1)
def _():
    # an electric eel coiled in an S: long round body, flat broad head, no dorsal fin, a long ribbon fin along the belly; a shock
    d = "M14 22 C30 8 60 12 60 30 C60 46 22 40 22 56 C22 70 50 72 70 64"
    s = path(d, "none", INK, 13.4) + path(d, "none", "#6a6a4a", 10) + path(d, "none", "#d9a24a", 3, extra='transform="translate(0 3.5)"')
    s += path("M24 46 C22 58 40 72 70 68", "none", INK, HR, extra='stroke-dasharray="2 2"')            # the ribbon fin
    s += path("M10 16 Q4 22 10 28 Q18 28 18 22 Z", "#6a6a4a", INK, DT) + circ(10, 20, 1.2, M["paper"], None)
    for x0, y0 in ((50, 6), (66, 22), (6, 40)):
        s += path(f"M{x0} {y0} l4 -3 l-1 5 l4 -3", "none", M["gold"], 2) + path(f"M{x0} {y0} l4 -3 l-1 5 l4 -3", "none", INK, .8)
    return s

@item("rum", 2)
def _():
    # a cask on its side on a chocked cradle: bulging staves, hoops, a bung, a spigot in the head, RUM and the broad arrow, a drip
    body = "M20 16 Q64 4 108 16 Q114 40 108 64 Q64 76 20 64 Q14 40 20 16 Z"
    s = rect(26, 66, 76, 8, M["wood2"], INK, DT) + poly([(26, 66), (36, 56), (40, 66)], M["wood2"], INK, DT) + poly([(102, 66), (92, 56), (88, 66)], M["wood2"], INK, DT)
    s += path(body, M["wood"], None) + path("M20 52 Q64 64 108 52 Q110 58 108 64 Q64 76 20 64 Z", shade(M["wood"], .18), None)
    for y in (24, 34, 44, 56): s += path(f"M20 {y} Q64 {y - 10 + (y - 16) * .4} 108 {y}", "none", INK, HR)
    for x in (30, 44, 84, 98):
        s += path(f"M{x} {12 + abs(x-64)*.08} Q{x + (x-64)*.06} 40 {x} {68 - abs(x-64)*.08}", "none", INK, 5.4) + path(f"M{x} {12 + abs(x-64)*.08} Q{x + (x-64)*.06} 40 {x} {68 - abs(x-64)*.08}", "none", M["iron"], 3)
    s += path(body, "none", INK, OL)
    s += rect(60, 8, 8, 5, M["dark"], INK, DT)
    s += ell(110, 40, 6, 22, shade(M["wood"], .1), INK, DT) + rect(114, 38, 10, 5, M["brass"], INK, DT) + path("M122 43 q1 4 -1 7 q-2 -3 1 -7", "#8a5a2a", INK, HR)
    s += path("M52 34 v12 M52 34 q3 0 3 3 q0 3 -3 3 l4 6 M58 34 v9 q0 3 3 3 q3 0 3 -3 v-9 M68 46 v-12 l4 7 l4 -7 v12", "none", M["tar"], 1.6)
    return s

@item("grog", 2)
def _():
    # a brass-bound grog tub with a spigot, a dented tin mug, and a lime: told apart from the rum cask by its tub shape and brass
    tub = "M14 22 H72 L68 74 H18 Z"
    s = path(tub, M["oak"], None) + path("M54 22 H72 L68 74 H52 Z", shade(M["oak"], .2), None)
    for x in (26, 38, 50, 62): s += line(x, 22, x + (x - 43) * .06, 74, INK, HR)
    for y in (30, 50, 66):
        w = (y - 22) / 52 * 4
        s += line(15 + w, y, 71 - w, y, INK, 6) + line(15 + w, y, 71 - w, y, M["brass"], 3.4)
    s += path(tub, "none", INK, OL) + ell(43, 22, 29, 5, M["oak"], INK, OL)
    s += rect(30, 54, 10, 6, M["brass"], INK, DT) + path("M32 60 h6 v6 h-6 Z", M["brass2"], INK, HR)
    cup = "M84 44 H104 L102 72 H86 Z"
    s += path(cup, "#a9b2b6", INK, OL) + path("M104 48 Q114 52 102 64", "none", INK, 4) + path("M104 48 Q114 52 102 64", "none", "#a9b2b6", 2)
    s += path("M92 44 l3 5 l3 -5", "none", INK, HR)                                                        # the dent
    s += ell(116, 70, 8, 6, M["lime"], INK, DT) + path("M110 67 Q116 64 122 67", "none", INK, HR)
    return s

@item("jollyboat", 3)
def _():
    # a ship's jolly boat: clinker strakes, a square transom with its rudder, a sharp stem, cream topsides, a dark sheer strake, oars and a boathook up
    hull = "M14 30 Q90 38 160 26 L164 40 Q156 66 130 72 L44 72 Q22 68 14 30 Z"
    s = path(hull, M["cream"], None)
    s += path("M14 30 Q90 38 160 26 L161 32 Q90 44 15 36 Z", M["tar"], None)                         # the sheer strake
    for k in (1, 2, 3, 4): s += path(f"M{16 + k*2} {36 + k*8} Q90 {44 + k*8} {162 - k*2} {32 + k*8}", "none", INK, HR)
    s += path("M30 56 Q90 64 150 54 L148 62 Q120 74 50 72 Q34 66 30 56 Z", M["tar"], None)
    s += path(hull, "none", INK, OL)
    s += path("M160 26 L172 30 L168 66 L160 62", M["wood"], INK, DT) + line(166, 32, 166, 62, INK, HR)   # rudder
    s += line(12, 28, 8, 20, INK, 3)                                                                   # the stem head
    for x in (60, 92, 124):
        s += line(x, 34, x + 20, 4, INK, 4) + line(x, 34, x + 20, 4, "#e6d7b4", 2)                      # oars up
    s += line(40, 32, 26, 2, INK, 3) + path("M26 2 q-6 2 -4 8", "none", INK, 2.6)                      # a boathook
    return s

@item("windlass", 2)
def _():
    # a sloop's windlass: a many-sided barrel between two bitts, handspike holes, one handspike in mid-heave, a pawl, the cable round it
    s = rect(10, 20, 14, 56, M["oak"], INK, OL) + rect(104, 20, 14, 56, M["oak"], INK, OL)
    s += rect(8, 16, 18, 6, M["oak"], INK, DT) + rect(102, 16, 18, 6, M["oak"], INK, DT)
    s += rect(24, 38, 80, 24, M["wood"], INK, OL)
    for y in (44, 50, 56): s += line(24, y, 104, y, INK, HR)
    for x in (36, 56, 76, 96): s += rect(x - 2.5, 40, 5, 5, M["black"], None)
    s += rect(60, 24, 8, 52, M["oak"], INK, DT) + path("M60 36 L54 40 L60 42 Z", M["iron"], INK, HR)     # the pawl bitt and pawl
    s += path("M32 62 Q40 72 50 62 Q58 72 66 62", "none", INK, 7) + path("M32 62 Q40 72 50 62 Q58 72 66 62", "none", "#6b4a32", 4.6)   # cable turns
    s += tube("M86 42 L106 4", "#dcc79c", 4.4, DT)                                                    # a handspike
    return s

@item("sandglass", 1)
def _():
    # a ship's half-hour glass: two bulbs joined at the waist, between round end plates on four turned pillars; sand falling
    s = ell(40, 10, 26, 5, M["wood"], INK, OL) + rect(14, 8, 52, 5, M["wood"], INK, DT)
    s += ell(40, 72, 26, 5, M["wood"], INK, OL) + rect(14, 66, 52, 5, M["wood"], INK, DT)
    s += path("M26 14 Q24 32 38 40 Q24 48 26 66 H54 Q56 48 42 40 Q56 32 54 14 Z", "#e6efeb", INK, DT)
    s += path("M30 22 Q32 32 39 38 Q48 32 50 22 Z", "#d6b77a", None)
    s += path("M28 66 Q30 56 40 54 Q50 56 52 66 Z", "#d6b77a", None) + line(40, 40, 40, 56, "#c4a060", 1.2)
    s += line(30, 20, 32, 30, "#ffffff", 1.4)
    for x in (18, 62): s += rect(x - 2.5, 13, 5, 53, M["wood2"], INK, DT) + ell(x, 26, 3.4, 2, M["wood2"], INK, HR) + ell(x, 54, 3.4, 2, M["wood2"], INK, HR)
    return s

@item("duelglove", 1)
def _():
    # a buff leather gauntlet glove, fingers up, a flared stiff cuff with a darker band and fringe; a crease, a seam
    hand = "M24 40 V18 Q24 12 28 12 Q32 12 32 18 V36 V10 Q32 4 36 4 Q40 4 40 10 V34 V12 Q40 6 44 6 Q48 6 48 12 V36 V18 Q48 13 52 13 Q56 13 56 18 V46 Q60 40 64 36 Q68 34 70 38 L58 58 H28 Q22 52 24 40 Z"
    s = path(hand, "#d8b98c", None) + path("M48 36 V18 Q48 13 52 13 Q56 13 56 18 V46 Q60 40 64 36 Q68 34 70 38 L58 58 H48 Z", shade("#d8b98c", .15), None)
    for x in (32, 40, 48): s += line(x, 34, x, 40, INK, HR)
    s += path(hand, "none", INK, OL)
    s += path("M26 58 H60 L68 78 H18 Z", M["leather"], INK, OL) + rect(22, 64, 42, 5, M["leather2"], None)
    for x in range(22, 68, 5): s += line(x, 78, x - 1, 80, INK, HR)
    s += path("M34 48 q6 3 12 0", "none", INK, HR)
    return s
