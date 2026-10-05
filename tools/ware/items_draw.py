"""items_draw.py - the drawings for itemart.py, one function per item, after the research in item-notes.md.
Boxes: size 1 is 80 x 80, size 2 is 128 x 80, size 3 is 176 x 80 (drawing units; halved in the game).
Run: py tools/ware/itemart.py
"""
from itemart import *

# ================================================================ shared
@item("dagger", 1)
def _():
    # a sailor's sheath knife: straight single-edged blade, short bar guard, wooden grip with brass rivets, a lanyard
    s = R(path("M30 40 H66 L74 37 L66 31 H30 Z", M["steel"], INK, OL) + line(32, 34, 64, 34, "#ffffff", 1.2, op=.6)
          + path("M30 40 H66 L74 37", "none", shade(M["steel"], .25), 2)
          + rect(25, 26, 5, 18, M["brass"], INK, DT)
          + rect(6, 30, 19, 10, M["wood"], INK, OL, rx=3) + circ(11, 35, 1.4, M["brass"], INK, HR) + circ(19, 35, 1.4, M["brass"], INK, HR)
          + circ(6, 35, 2.2, M["paper"], INK, HR), -38, 40, 40)
    s += path("M21 62 q-10 2 -10 10 q4 4 10 -2", "none", M["tar"], 2.6)     # tarred lanyard loop at the butt
    return s

@item("pins", 1)
def _():
    # belaying pins: a fat turned handle, a collar, then a long thin shank; one with a line belayed on it
    def pin(x, y, deg):
        p = path("M0 -36 C-8 -36 -9 -22 -6 -12 L-7 -9 H7 L6 -12 C9 -22 8 -36 0 -36 Z", M["wood"], INK, OL)
        p += path("M0 -36 C5 -36 8 -22 6 -12 L7 -9 H3 C4 -16 4 -30 0 -36 Z", M["wood2"], None)
        p += rect(-7.5, -10, 15, 4, M["wood2"], INK, DT)
        p += path("M-3.6 -6 H3.6 L2.4 34 H-2.4 Z", tint(M["wood"], .15), INK, DT)
        p += line(-3, -30, -3, -16, "#ffffff", 1.2, op=.5)
        return f'<g transform="translate({x} {y}) rotate({deg})">{p}</g>'
    s = pin(28, 40, -20) + pin(54, 40, 18)
    s += rope_line("M44 22 C66 18 72 30 54 32 C36 34 38 46 58 46 C70 46 70 56 60 58", 3)
    return s

@item("cutlass", 2)
def _():
    # 1804 pattern naval cutlass: short broad curved blade, black iron figure-of-eight double-disc guard, ribbed iron grip
    s = blade(40, 50, 122, 18, 13, 10, curve=-.5)
    s += path("M78 37 l3 4 l3 -5", "none", INK, HR)                                               # a nick in the edge
    s += circ(36, 44, 10, M["iron"], INK, OL) + circ(31, 58, 8, M["iron"], INK, OL)               # the figure eight
    s += circ(36, 44, 4.5, shade(M["iron"], .25), INK, HR) + circ(31, 58, 3.5, shade(M["iron"], .25), INK, HR)
    s += grip(14, 66, 32, 55, 10, M["iron2"], 5)
    s += ell(12, 67, 4.5, 4, M["iron"], INK, DT)
    return s

@item("harpoon", 2)
def _():
    # a two-flued whaling iron: barbed arrow head, a long iron shank, socketed into an ash pole, the line spliced on
    s = rect(4, 37, 56, 7, "#dcc79c", INK, OL, rx=3)                                             # ash pole
    s += line(10, 40, 54, 40, "#f2e6c8", 1.2)
    s += path("M58 36 L66 38.5 L66 42.5 L58 45 Z", M["iron"], INK, DT)                            # socket
    s += rect(66, 38.6, 36, 3.8, M["iron"], INK, DT)                                              # shank
    s += path("M100 40.5 L106 28 L124 40.5 L106 53 Z", M["iron"], INK, OL)                        # the flued head
    s += path("M106 28 L110 40.5 L106 53", "none", INK, DT) + path("M101 34 L106 28 L108 36 Z", M["iron2"], None)
    s += rope_line("M70 40 C72 50 60 64 40 62 C24 60 22 70 34 74 C46 76 52 70 46 66", 3.2)        # the line
    return s

@item("fenders", 1)
def _():
    # a rope fender: a pear-shaped bundle of junk covered in a net of hitched rope, a rope eye on top, a frayed tail
    body = "M40 18 C56 18 62 34 60 50 C58 64 50 70 40 70 C30 70 22 64 20 50 C18 34 24 18 40 18 Z"
    s = path(body, M["rope"], None)
    s += path("M44 18 C58 20 62 34 60 50 C58 64 50 70 42 70 C52 60 54 34 44 18 Z", M["rope2"], None)
    for i in range(1, 7):
        y = 18 + i * 7.4
        s += path(f"M{22 - 2*math.sin(i)} {y} Q40 {y+5} {58 + 2*math.sin(i)} {y}", "none", INK, HR)
    for x in (30, 40, 50):
        s += path(f"M{x} 19 Q{x + (x-40)*.6} 44 {x} 69", "none", INK, HR)
    s += path(body, "none", INK, OL)
    s += rope_line("M33 19 C30 4 50 4 47 19", 3.4)
    s += path("M40 70 l-4 8 M40 70 l0 9 M40 70 l4 8", "none", M["rope2"], 2)
    return s

@item("pork", 1)
def _():
    # salt pork: a cut block (grey rind, a thick band of fat over marbled lean, coarse salt) on a cask head with the broad arrow
    s = ell(40, 66, 32, 7, M["wood"], INK, OL) + path("M8 66 V72 Q40 84 72 72 V66", M["wood2"], INK, DT)
    s += path("M36 70 l4 -6 l4 6 M40 64 v9", "none", M["tar"], 1.8)
    blk = [(14, 62), (17, 26), (66, 23), (68, 61)]
    s += P(blk, M["meat"], 0, None)
    s += path("M17 26 L66 23 L67 40 Q42 44 16 42 Z", M["fat"], None)                                # the fat
    s += P([(17, 26), (66, 23), (66, 28), (17, 31)], "#9c8670", 0, None)                           # rind
    s += path("M22 50 q8 -4 14 0 q-6 4 -14 0 Z M42 54 q10 -3 18 1 q-8 4 -18 -1 Z M30 58 q6 -2 10 0", M["fat"], None)   # marbling
    s += P([(54, 24), (66, 23), (68, 61), (56, 62)], "#000000", 0, None) if False else P([(55, 24), (66, 23), (68, 61), (57, 62)], shade(M["meat"], .18), 0, None)
    s += path("M55 24 L66 23 L67 40 Q60 41 56 41 Z", shade(M["fat"], .12), None)
    s += P(blk, "none", OL) + path("M16 42 Q42 44 67 40", "none", INK, HR)
    s += stipple(20, 26, 44, 6, 16, "#ffffff", 1.8, .95, seed=4)
    return s

@item("tar", 2)
def _():
    # a stave bucket bound with two hoops, a rope bail, tar running down; a tar mop leaning out
    s = rope_line("M30 26 Q52 2 74 26", 3.4)
    b = "M26 28 H78 L72 72 H32 Z"
    s += path(b, M["dark"], None) + path("M60 28 H78 L72 72 H58 Z", shade(M["dark"], .25), None)
    for x in (38, 48, 58):
        s += line(x, 28, x + (x - 52) * .1, 72, INK, HR)
    for y in (36, 64):
        w = (y - 28) / 44 * 6
        s += line(27 + w, y, 77 - w, y, INK, 5) + line(27 + w, y, 77 - w, y, M["iron"], 2.6)
    s += path(b, "none", INK, OL)
    s += ell(52, 28, 26, 5, M["tar"], INK, OL)
    s += path("M40 30 Q42 44 40 50 Q38 54 41 54 Q44 54 43 46 Z", M["tar"], INK, HR)                # a drip
    s += ell(44, 74, 10, 2.4, M["tar"], None)
    s += tube("M66 26 L112 6", "#dcc79c", 4.4, DT)                                                # the mop's handle
    s += path("M60 30 Q54 26 62 18 Q70 20 72 30 Q66 36 60 30 Z", M["tar"], INK, DT)
    return s

@item("hook", 1)
def _():
    # a four-tined boarding grapnel, shank up, tines curving up and out from the crown; three show; rope bent to the eye
    s = rope_line("M40 10 C40 0 58 2 60 10 C62 18 52 22 60 30 C66 36 74 34 76 28", 3.2)
    s += circ(40, 12, 5, "none", INK, 5.6) + circ(40, 12, 5, "none", M["iron"], 2.6)
    s += rect(37, 16, 6, 46, M["iron"], INK, DT)
    def tine(d, tip, col=M["iron"], w=4.6):
        return path(d, "none", INK, w + 4) + path(d, "none", col, w) + poly(tip, col, INK, DT)
    s += tine("M40 62 C20 66 10 56 12 40", [(12, 40), (8, 47), (17, 46)])
    s += tine("M40 62 C60 66 70 56 68 40", [(68, 40), (63, 46), (72, 47)])
    s += tine("M40 62 C34 72 26 70 26 58", [(26, 58), (22, 64), (30, 64)], M["iron2"], 4)          # one toward you
    s += circ(40, 62, 5, M["iron"], INK, DT)
    for y in (24, 30): s += line(36, y, 44, y + 2, M["rope2"], 2)
    return s

@item("net", 2)
def _():
    # a bark-tanned seine draped from its head rope: diamond mesh, cork floats along the top, sinkers at the foot, a fish caught
    top = [(6, 16), (40, 20), (86, 18), (122, 22)]
    foot = lambda x: 64 + 6 * math.sin(x / 14)
    topy = lambda x: 16 + x / 124 * 6
    s = path("M6 16 L122 22 L122 " + F(foot(122)) + " " + " ".join(f"L{x} {F(foot(x))}" for x in range(118, 4, -4)) + " Z", "#c79a73", None, op=.35)
    rows, cols = 6, 14
    node = lambda r, c: (8 + (c + (r % 2) * .5) * 8.4, topy(8 + c * 8.4) + (foot(8 + c * 8.4) - topy(8 + c * 8.4)) * r / rows)
    for r in range(rows):
        for c in range(cols):
            x0, y0 = node(r, c)
            for dc in ((0, 1) if r % 2 else (-1, 0)):
                if 0 <= c + dc < cols:
                    x1, y1 = node(r + 1, c + dc)
                    s += line(x0, y0, x1, y1, "#7a4e34", 1.1)
    s += path("M4 16 L40 20 L86 18 L124 22", "none", INK, 4.6) + path("M4 16 L40 20 L86 18 L124 22", "none", M["rope"], 2.4)
    for x in (14, 34, 56, 78, 100, 118):
        y = 16 + (x / 124) * 6
        s += ell(x, y, 6, 4, "#d8c39a", INK, DT)
    for x in range(14, 120, 16):
        s += circ(x, foot(x) + 2, 2.8, M["iron"], INK, HR)
    s += path("M60 44 Q70 36 80 44 Q70 52 60 44 Z", M["fish"], INK, DT) + poly([(80, 44), (86, 39), (86, 49)], M["fish"], INK, DT) + circ(64, 43, 1, INK, None)
    return s

@item("compass", 1)
def _():
    # a boxed mariner's compass seen from above: oak box, brass bowl, a card of 32 points with a fleur-de-lis north, a lubber line
    s = rect(6, 6, 68, 68, M["dark"], INK, OL, rx=4) + rect(10, 10, 60, 60, "none", INK, HR, rx=3)
    s += circ(40, 40, 28, M["brass"], INK, OL) + circ(40, 40, 24, M["paper"], INK, DT)
    card = ""
    for i in range(32):
        a = math.radians(i * 11.25)
        r1 = 21 if i % 4 == 0 else 18 if i % 2 == 0 else 15
        if i % 4 == 0:
            card += poly([(40 + r1 * math.sin(a), 40 - r1 * math.cos(a)), (40 + 3.4 * math.sin(a + 1.57), 40 - 3.4 * math.cos(a + 1.57)), (40 + 3.4 * math.sin(a - 1.57), 40 - 3.4 * math.cos(a - 1.57))], INK if i % 8 == 0 else M["steel2"], None)
        else:
            card += line(40 + 22.5 * math.sin(a), 40 - 22.5 * math.cos(a), 40 + r1 * math.sin(a), 40 - r1 * math.cos(a), INK, HR)
    card += path("M40 15 Q36 19 38 22 L40 20 L42 22 Q44 19 40 15 Z", M["red"], INK, HR)        # the fleur-de-lis
    s += R(card, 12, 40, 40) + circ(40, 40, 2.4, M["brass"], INK, HR)
    s += line(40, 12, 40, 18, INK, 2)                                                           # lubber line
    return s

@item("chest", 1)
def _():
    # an iron-strapped oak strongbox, lid a little open, a hasp and padlock, rope beckets, gold showing at the gap
    s = rect(10, 36, 60, 36, M["dark"], INK, OL)
    s += rect(54, 36, 16, 36, shade(M["dark"], .2), None)
    s += path("M10 30 Q40 18 70 30 L70 34 H10 Z", M["dark"], INK, OL)                              # the lid, lifted
    for x in range(16, 70, 10): s += coin(x, 34, 4.4)
    s += coin(48, 31.5, 4)
    for x in (16, 64):
        s += rect(x - 3, 36, 6, 36, M["iron"], INK, DT) + rect(x - 3, 23 + abs(x - 40) * .08, 6, 9, M["iron"], INK, DT)
    s += rect(10, 52, 60, 5, M["iron"], INK, DT)
    s += rect(35, 38, 10, 14, M["iron"], INK, DT) + path("M37 52 V58 Q40 62 43 58 V52", "none", INK, 2.4) + rect(34, 56, 12, 10, M["iron2"], INK, DT)
    s += path("M10 46 q-8 2 -6 10 q6 2 6 -4", "none", INK, 5) + path("M10 46 q-8 2 -6 10 q6 2 6 -4", "none", M["rope"], 2.8)
    s += path("M70 46 q8 2 6 10 q-6 2 -6 -4", "none", INK, 5) + path("M70 46 q8 2 6 10 q-6 2 -6 -4", "none", M["rope"], 2.8)
    s += rect(10, 36, 60, 36, "none", INK, OL)
    return s

@item("spyglass", 1)
def _():
    # a two-draw telescope laid across: leather-covered main barrel, brass draws, brass eyepiece and objective, a twine lanyard
    s = R(rect(6, 33, 38, 14, M["leather"], INK, OL, rx=2) + rect(6, 33, 38, 4, tint(M["leather"], .15), None)
          + rect(2, 32, 6, 16, M["brass"], INK, DT) + rect(43, 34, 4, 12, M["brass"], INK, DT)
          + rect(46, 35.5, 16, 9, M["brass"], INK, DT) + rect(61, 36.5, 3, 7, M["brass2"], INK, HR)
          + rect(63, 37, 10, 6, M["brass"], INK, DT) + rect(72, 37.5, 4, 5, M["brass2"], INK, DT)
          + line(52, 37, 58, 37, "#fff3c4", 1.2)
          + "".join(line(x, 33, x + 1, 47, INK, HR) for x in (22, 24, 26)), -30, 40, 40)
    s += path("M30 48 q-6 14 4 22", "none", INK, HR)
    return s

if __name__ == "__main__":
    import items_wren, items_bulwark, items_ember, items_lotus  # noqa: F401  (each ship's set registers itself)
    build()
