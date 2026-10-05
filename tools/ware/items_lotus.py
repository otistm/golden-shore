"""the Lotus's set: a Qing-era junk's food, medicine, venom and Chinese weapons (see item-notes.md)"""
from itemart import *

BLUE, PORC = "#4c6f8f", M["porcelain"]

def steam(x, y, n=2):
    return "".join(path(f"M{x + i*8} {y} q-4 -6 0 -12 q4 -6 0 -12", "none", INK, HR) for i in range(n))

def drop(x, y, r=3, col="#7fa05a"):
    return path(f"M{x} {y-r*2} Q{x+r} {y-r*.4} {x} {y+r*.6} Q{x-r} {y-r*.4} {x} {y-r*2} Z", col, INK, HR)

def fish_body(cx, cy, L, h, body, belly=None, face=1):
    """a side-view fish centred at (cx,cy), length L, depth h, head to the right when face=1"""
    x0, x1 = cx - L / 2, cx + L / 2
    if face < 0: x0, x1 = x1, x0
    d = f"M{x0} {cy} Q{cx} {cy-h} {x1} {cy} Q{cx} {cy+h} {x0} {cy} Z"
    s = path(d, body, INK, DT)
    if belly: s += path(f"M{x0 + (x1-x0)*.2} {cy+h*.15} Q{cx} {cy+h*.7} {x1 - (x1-x0)*.1} {cy+h*.1}", "none", belly, 2.4)
    return s

@item("lime", 1)
def _():
    # a bamboo basket of limes: weave shown near the rim only, limes heaped with a leaf, one cut in half
    s = path("M10 44 H70 L62 76 H18 Z", "#d9c08a", INK, OL)
    for x in range(16, 68, 8): s += line(x, 46, x + (x - 40) * -.12, 74, INK, HR * .8)
    s += rect(8, 42, 64, 7, "#c9ac70", INK, DT) + "".join(line(x, 42, x + 4, 49, INK, HR * .8) for x in range(10, 70, 6))
    for x, y in ((22, 38), (36, 34), (50, 37), (62, 40), (30, 26), (46, 24)): s += circ(x, y, 9, M["lime"], INK, DT) + circ(x - 3, y - 3, 2.4, "#d6dc94", None)
    s += path("M54 22 Q64 10 74 16 Q66 24 54 22 Z", M["green"], INK, DT) + line(56, 21, 70, 16, INK, HR)
    s += path("M60 44 a8 8 0 0 1 16 0 Z", "#e6e8b0", INK, DT) + "".join(line(68, 44, 68 + 6 * math.cos(math.radians(a_)), 44 - 6 * math.sin(math.radians(a_)), INK, .6) for a_ in (30, 90, 150))
    return s

@item("pump", 2)
def _():
    # a square-pallet chain pump (the dragon's backbone): a long wooden trough at an incline, an endless chain of small square paddles,
    # a sprocket drum at the top turned by a crank, water spilling from the top end
    s = path("M4 70 L104 24 L110 36 L10 80 Z", "#b8a07a", INK, OL)
    s += path("M4 70 L104 24", "none", INK, DT)
    for i in range(1, 12):
        t = i / 12; x = 4 + 100 * t; y = 70 - 46 * t
        s += rect(x - 2.5, y - 7, 5, 7, "#c9b48a", INK, HR)
    s += path("M10 80 L110 36", "none", INK, DT)
    s += circ(108, 26, 12, M["wood"], INK, OL) + "".join(line(108, 26, 108 + 12 * math.cos(math.radians(a_)), 26 + 12 * math.sin(math.radians(a_)), INK, HR) for a_ in range(0, 360, 45))
    s += path("M108 26 L122 12 L126 16", "none", INK, 3.4) + path("M108 26 L122 12 L126 16", "none", M["wood2"], 1.6)
    s += path("M98 32 Q94 44 98 56 Q100 62 96 68", "none", INK, 4) + path("M98 32 Q94 44 98 56 Q100 62 96 68", "none", "#8fb3c4", 2.4)
    return s

@item("puffer", 1)
def _():
    # an inflated pufferfish: a round sandy body with short spines, small fins, a beak mouth, big eye, dark spots, pale belly; one spine bent
    s = ""
    for i in range(18):
        a = math.radians(i * 20)
        x0, y0 = 38 + 24 * math.cos(a), 40 + 24 * math.sin(a)
        x1, y1 = 38 + 31 * math.cos(a + (.25 if i == 4 else 0)), 40 + 31 * math.sin(a + (.25 if i == 4 else 0))
        s += line(x0, y0, x1, y1, INK, 2)
    s += circ(38, 40, 25, "#d6b77a", INK, OL) + path("M16 48 Q38 70 60 48 Q38 60 16 48 Z", "#f0e2c0", None)
    for x, y in ((30, 28), (44, 26), (24, 40), (50, 38), (36, 36)): s += circ(x, y, 2.6, "#8a6a3e", None)
    s += circ(52, 32, 6, "#ffffff", INK, DT) + circ(53, 33, 2.6, INK, None)
    s += path("M62 40 L68 38 L68 44 Z", "#d6b77a", INK, DT) + path("M12 40 L4 32 L4 48 Z", "#d6b77a", INK, DT)
    s += path("M34 50 Q40 56 44 50 Z", "#c9a36a", INK, HR)
    return s

@item("galley", 2)
def _():
    # a junk's clay stove: a low brick-and-clay box with an arched firemouth, a round iron wok set in the top, a wooden lid, a clay chimney, steam
    s = rect(10, 36, 94, 40, "#c9a27a", INK, OL)
    for y in (46, 56, 66): s += line(10, y, 104, y, INK, HR * .8)
    s += path("M24 76 V60 Q36 48 48 60 V76 Z", M["black"], INK, DT) + "".join(circ(x, 72, 3, M["fire"], INK, HR) for x in (30, 36, 42))
    s += path("M40 36 Q60 48 80 36 Z", M["black"], INK, DT) + path("M44 34 Q60 22 76 34 Z", M["wood"], INK, DT) + rect(57, 24, 6, 5, M["wood2"], INK, HR)
    s += rect(88, 6, 14, 30, "#b48b62", INK, OL) + rect(86, 4, 18, 5, "#a07a54", INK, DT)
    s += steam(54, 22, 2)
    return s

@item("teapot", 1)
def _():
    # a Yixing clay teapot: a squat round red-brown body, a short straight spout, a C-shaped handle, a flat lid with a knob; incised marks
    s = path("M58 38 Q72 30 74 22 L78 24 Q76 38 62 48", "#9a5a3e", INK, OL)
    s += path("M20 40 Q4 40 6 54 Q8 64 22 60", "none", INK, 6.4) + path("M20 40 Q4 40 6 54 Q8 64 22 60", "none", "#9a5a3e", 3.4)
    s += path("M18 36 Q14 70 40 72 Q66 70 62 36 Z", "#9a5a3e", INK, OL) + path("M44 36 Q60 36 62 36 Q66 70 40 72 Q56 64 50 36 Z", "#7e4632", None)
    s += ell(40, 36, 22, 5, "#a8684a", INK, DT) + ell(40, 33, 14, 3.4, "#9a5a3e", INK, DT) + ell(40, 28, 4, 3.4, "#9a5a3e", INK, DT)
    s += path("M32 46 h6 M35 46 v8 M32 50 h6 M31 56 h8", "none", "#5e3424", 1.2)
    return s

@item("ginseng", 1)
def _():
    # a whole ginseng root like a little figure: a ringed neck, the main root forked into two legs, fine rootlets, a few leaves, a red thread
    s = path("M40 6 L40 18", "none", INK, DT) + path("M40 6 Q30 2 26 8 Q34 10 40 6 Z M40 6 Q50 0 56 6 Q48 10 40 6 Z", M["green"], INK, HR)
    body = "M36 18 H44 Q46 30 50 40 Q56 54 58 70 L52 72 Q48 58 42 52 Q38 60 32 72 L26 70 Q28 52 32 40 Q36 30 36 18 Z"
    s += path(body, "#e6d4ac", INK, OL)
    for y in (22, 26, 30): s += line(36.4, y, 43.6, y, INK, HR)
    s += path("M32 46 Q20 44 14 50 M50 46 Q62 42 68 48 M30 60 Q22 64 20 72 M54 62 Q62 66 64 74 M28 70 l-4 6 M56 72 l3 6", "none", INK, HR)
    s += rect(35, 32, 10, 3, M["red"], INK, HR)
    return s

@item("kelp", 1)
def _():
    # a parcel wrapped in dried kelp: broad flat wavy dark strips folded round, tied with a kelp strip, a white salt bloom
    s = path("M14 26 Q40 16 66 26 L70 62 Q40 74 10 62 Z", "#4a5440", INK, OL)
    s += path("M14 26 Q24 36 18 48 Q12 56 10 62 M66 26 Q58 40 64 52 Q70 58 70 62", "none", INK, DT)
    s += path("M14 26 Q40 34 66 26", "none", INK, DT) + path("M40 18 Q36 44 42 70", "none", "#2f3a2c", 5) + path("M40 18 Q36 44 42 70", "none", INK, HR)
    s += stipple(18, 30, 46, 30, 26, "#e9e6d6", 1.8, .9, seed=4)
    s += path("M28 20 Q34 8 44 12", "none", "#4a5440", 4) + path("M28 20 Q34 8 44 12", "none", INK, HR)
    return s

@item("ricebowl", 1)
def _():
    # a blue-and-white porcelain rice bowl on its foot ring, heaped rice, two plain wooden chopsticks across it, a chip on the rim
    s = path("M14 34 Q14 60 40 64 Q66 60 66 34 Z", PORC, INK, OL) + path("M14 40 Q40 46 66 40", "none", BLUE, 2.6) + path("M28 54 q4 -4 8 0 q4 4 8 0 q4 -4 8 0", "none", BLUE, 1.6)
    s += rect(30, 64, 20, 6, PORC, INK, DT)
    s += path("M14 34 Q20 18 40 16 Q60 18 66 34 Z", "#f7f4ea", INK, DT)
    for x, y in ((26, 28), (36, 22), (48, 24), (56, 30), (32, 32), (44, 30)): s += ell(x, y, 2, 1.2, "#e6e0cc", None)
    s += line(8, 22, 74, 30, INK, 3.6) + line(8, 22, 74, 30, "#dcc79c", 2) + line(10, 28, 76, 34, INK, 3.6) + line(10, 28, 76, 34, "#dcc79c", 2)
    s += path("M60 35 l3 -3 l2 3", "#d8d2c6", INK, HR)
    return s

@item("noodles", 2)
def _():
    # a two-handled clay pot of noodles with a bamboo ladle lifting a tangle of them, long cooking chopsticks, spring onion floating, steam
    s = path("M16 34 Q16 74 56 74 Q96 74 96 34 Z", M["clay"], INK, OL) + path("M70 34 H96 Q96 74 56 74 Q82 66 70 34 Z", M["clay2"], None)
    s += path("M16 40 q-10 0 -10 8 q0 6 10 6", "none", INK, 3.4) + path("M96 40 q10 0 10 8 q0 6 -10 6", "none", INK, 3.4)
    s += ell(56, 34, 40, 7, "#efe0b8", INK, OL)
    for x in range(26, 88, 8): s += path(f"M{x} 30 q4 6 8 0", "none", "#c9b07c", 1.4)
    for x, y in ((40, 33), (66, 35)): s += circ(x, y, 2.4, M["green"], INK, HR)
    s += path("M60 30 Q66 8 86 10 Q92 12 88 18 Q78 20 70 32", "none", INK, 2.4) + path("M74 14 q2 10 -2 16 M80 13 q2 10 -1 15", "none", "#efe0b8", 2.2)
    s += line(96, 4, 120, 46, INK, 3.4) + line(102, 2, 124, 44, INK, 3.4) + line(96, 4, 120, 46, "#dcc79c", 1.6) + line(102, 2, 124, 44, "#dcc79c", 1.6)
    s += steam(30, 26, 2)
    return s

@item("scorpion", 1)
def _():
    # a glass jar of rice wine with a scorpion in it, the lid tied with red cloth, a paper label
    s = path("M18 24 Q12 30 12 46 V68 Q12 76 22 76 H58 Q68 76 68 68 V46 Q68 30 62 24 Z", "#d9c79a", INK, OL)
    s += rect(14, 40, 52, 34, "#c9a45a", None, op=.55)
    sc = path("M40 58 Q30 58 30 52 Q30 46 40 46 Q50 46 50 52 Q50 58 40 58 Z", "#5e3b27", INK, DT)
    sc += path("M40 46 Q42 36 50 34 Q56 34 54 40", "none", INK, 3.4) + path("M40 46 Q42 36 50 34 Q56 34 54 40", "none", "#5e3b27", 1.8) + poly([(54, 40), (56, 44), (51, 42)], "#5e3b27", INK, HR)
    sc += path("M32 48 L22 42 L18 46 M30 54 L20 58", "none", INK, 1.6) + path("M48 54 l8 4 M46 57 l6 6 M34 57 l-6 6", "none", INK, 1.2)
    s += sc
    s += rect(18, 16, 44, 10, M["red"], INK, DT) + path("M18 22 q-6 4 -2 10 M62 22 q6 4 2 10", "none", INK, DT)
    s += rect(48, 50, 14, 20, M["paper"], INK, DT) + line(52, 54, 52, 66, INK, 1) + line(56, 54, 56, 62, INK, 1)
    return s

@item("fugu", 1)
def _():
    # a Chinese cleaver: a tall rectangular blade with a straight edge, a round wooden handle with a ferrule, venom on the edge
    s = path("M30 14 H72 V52 Q50 54 30 52 Z", M["steel"], INK, OL) + rect(30, 14, 42, 6, M["steel2"], None) + rect(30, 14, 42, 38, "none", INK, OL)
    s += line(32, 46, 70, 46, "#ffffff", 1.2, op=.6) + circ(64, 22, 2, "#ffffff", INK, HR)
    s += rect(22, 26, 8, 12, M["iron"], INK, DT) + rect(4, 27, 20, 10, "#dcc79c", INK, OL, rx=4)
    for x in (40, 52, 62): s += drop(x, 58, 2.6)
    return s

@item("darts", 1)
def _():
    # bamboo blowgun darts in a bamboo quiver with a cap: thin bamboo splinters with kapok tufts, dark-tipped points, one tip glistening
    s = rect(30, 34, 22, 42, "#d9c08a", INK, OL) + "".join(line(30, y, 52, y, INK, DT) for y in (48, 62)) + rect(28, 72, 26, 5, "#c9ac70", INK, DT)
    for x, top, lean in ((34, 10, -6), (40, 6, 0), (46, 12, 6)):
        s += line(x, 36, x + lean, top, INK, 1.8) + path(f"M{x - 4} 40 Q{x} 30 {x + 4} 40 Z", "#f0e9d6", INK, HR)
        s += line(x + lean, top, x + lean * .9, top + 5, M["black"], 2.4)
    s += drop(46, 8, 2, "#5e7f73")
    s += path("M56 34 Q66 30 68 40 Q64 44 56 40 Z", "#c9ac70", INK, DT)
    return s

@item("blowpipe", 2)
def _():
    # a long hardwood blowpipe: rattan bindings at intervals, a small sight bead near the muzzle, a dart sticking out of the mouthpiece
    s = rect(10, 36, 112, 8, "#6e4a30", INK, OL, rx=3) + line(14, 38, 118, 38, "#8a6040", 1.2)
    for x in (30, 56, 82, 104): s += rect(x, 35, 6, 10, "#d9c08a", INK, DT) + line(x + 3, 35, x + 3, 45, INK, HR)
    s += rect(108, 32, 4, 4, "#cfa75a", INK, HR)
    s += ell(10, 40, 4, 5, "#4e3420", INK, DT)
    s += line(10, 40, -2, 40, INK, 1.6) + path("M2 36 Q-2 40 2 44 Q6 40 2 36 Z", "#f0e9d6", INK, HR)
    s += line(4, 60, 60, 60, INK, 1.6) + path("M8 56 Q2 60 8 64 Q12 60 8 56 Z", "#f0e9d6", INK, HR) + line(60, 60, 64, 60, M["black"], 2.4)
    return s

@item("moray", 1)
def _():
    # a honeycomb moray rearing from a hole in a rock: thick flat body, a continuous dorsal fin, gaping jaw with needle teeth, small eye
    s = path("M4 78 Q6 56 22 54 Q44 52 60 62 Q72 70 76 78 Z", "#9e968a", INK, OL) + ell(34, 66, 12, 7, M["black"], INK, DT)
    body = "M28 66 Q20 44 30 28 Q40 12 58 12 Q66 12 68 18 L58 26 Q46 24 42 34 Q38 46 42 64 Z"
    s += path(body, "#b89a4a", INK, OL)
    s += path("M30 30 Q36 8 60 8", "none", INK, 4.4) + path("M30 30 Q36 8 60 8", "none", "#8a6a2e", 2.4)
    for x, y in ((34, 40), (38, 30), (44, 22), (36, 52), (52, 16)): s += circ(x, y, 2.6, "#6a5428", None)
    s += path("M68 18 L58 26 L74 28 Z", "#e8c9a0", INK, DT) + "".join(line(x, 25 + (x - 60) * .2, x + 1, 22 + (x - 60) * .2, "#ffffff", 1.2) for x in (62, 66, 70))
    s += circ(58, 15, 2, "#f4e8b0", INK, HR)
    return s

@item("seasnake", 1)
def _():
    # a banded sea krait in an S: a round body banded slate and black, a small head, and the flattened paddle tail that marks it
    d = "M14 16 C34 4 58 14 50 30 C42 46 18 40 20 56 C22 70 46 70 58 62"
    s = path(d, "none", INK, 11) + path(d, "none", "#8ea0b0", 7.6) + path(d, "none", M["black"], 7.6, extra='stroke-dasharray="5 6"')
    s += path("M58 62 Q66 56 74 60 Q72 70 62 70 Z", "#8ea0b0", INK, DT) + path("M64 60 l2 8 M69 59 l1 8", "none", M["black"], 2.4)
    s += ell(12, 17, 6, 4.4, "#8ea0b0", INK, DT) + circ(10, 16, 1.2, INK, None) + path("M6 18 l-4 1 M6 18 l-4 3", "none", M["red"], 1)
    return s

@item("jellyfish", 2)
def _():
    # a wide brown-glazed jar of salted jellyfish: the translucent bell leaning over the rim, its tentacles trailing down the side
    s = path("M14 34 Q8 52 18 70 Q40 78 64 70 Q74 52 68 34 Z", "#7a4a2e", INK, OL) + path("M50 34 H68 Q74 52 64 70 Q56 73 52 74 Q60 54 50 34 Z", "#5e3824", None)
    s += rect(10, 28, 62, 8, "#8a5634", INK, DT)
    s += path("M40 30 Q42 10 66 10 Q90 10 92 30 Q66 26 40 30 Z", "#e6cfe0", INK, OL) + path("M48 26 Q66 18 86 26", "none", "#c9aec4", 2)
    for i, x in enumerate((70, 78, 86, 94)):
        s += path(f"M{x} 30 Q{x + 6} 46 {x + 2} 56 Q{x - 2} 66 {x + 6} {74 - i*2}", "none", INK, 2.6) + path(f"M{x} 30 Q{x + 6} 46 {x + 2} 56 Q{x - 2} 66 {x + 6} {74 - i*2}", "none", "#e6cfe0", 1.2)
    s += rect(102, 56, 18, 18, "#8a5634", INK, DT) + rect(100, 52, 22, 5, "#7a4a2e", INK, HR)
    return s

@item("glowcap", 1)
def _():
    # lingzhi: two fan-shaped glossy bracket caps with concentric growth bands, stalks set off-centre, a pale edge
    s = ""
    for cx, cy, rx, ry, st in ((36, 34, 28, 16, (34, 46, 30, 76)), (56, 52, 18, 10, (54, 60, 52, 76))):
        s += path(f"M{st[0]} {st[1]} Q{st[0]-4} {st[1]+16} {st[2]} {st[3]}", "none", INK, 7) + path(f"M{st[0]} {st[1]} Q{st[0]-4} {st[1]+16} {st[2]} {st[3]}", "none", "#7a3a24", 4)
        s += path(f"M{cx-rx} {cy+ry*.5} Q{cx-rx} {cy-ry} {cx} {cy-ry} Q{cx+rx} {cy-ry} {cx+rx} {cy+ry*.4} Q{cx} {cy+ry*.9} {cx-rx} {cy+ry*.5} Z", "#9a3e24", INK, OL)
        for k in (.75, .5):
            s += path(f"M{cx-rx*k} {cy+ry*.45*k} Q{cx-rx*k} {cy-ry*k} {cx} {cy-ry*k} Q{cx+rx*k} {cy-ry*k} {cx+rx*k} {cy+ry*.35*k}", "none", "#c26a3a", 1.6)
        s += path(f"M{cx-rx} {cy+ry*.5} Q{cx} {cy+ry*.9} {cx+rx} {cy+ry*.4}", "none", "#e6b47a", 2.4)
    return s

@item("miasma", 2)
def _():
    # a bronze tripod censer: a round bowl on three legs, two upright loop handles, a pierced lid, grey-green smoke rising in ribbons
    s = line(36, 60, 30, 76, INK, 4.4) + line(76, 60, 82, 76, INK, 4.4) + line(56, 62, 56, 76, INK, 4.4)
    s += path("M24 40 Q24 66 56 66 Q88 66 88 40 Z", "#7a6a3e", INK, OL) + stipple(30, 44, 52, 18, 16, "#7f9f86", 2, .9, seed=2)
    for x in (30, 82): s += path(f"M{x} 40 V28 Q{x + (6 if x < 56 else -6)} 24 {x + (12 if x < 56 else -12)} 28 V40", "none", INK, 4.4) + path(f"M{x} 40 V28 Q{x + (6 if x < 56 else -6)} 24 {x + (12 if x < 56 else -12)} 28 V40", "none", "#8c7a48", 2.2)
    s += path("M34 40 Q56 26 78 40 Z", "#8c7a48", INK, DT) + "".join(circ(x, 36, 1.6, M["black"], None) for x in (46, 56, 66))
    for i, x in enumerate((50, 62)):
        d = f"M{x} 30 Q{x - 10} 20 {x + 2} 14 Q{x + 14} 8 {x + 4} 0"
        s += path(d, "none", INK, 5) + path(d, "none", "#a9b8a2", 3)
    return s

@item("toxinsac", 1)
def _():
    # a swollen bladder pouch tied with cord at the neck, sickly green showing through, a drop of venom at the neck
    s = path("M34 20 Q16 30 16 50 Q16 72 40 72 Q64 72 64 50 Q64 30 46 20 Z", "#d9c79a", INK, OL)
    s += path("M24 46 Q24 64 40 64 Q56 64 56 46 Q40 54 24 46 Z", "#9db07a", None, op=.8)
    s += path("M34 20 Q40 14 46 20 L44 10 H36 Z", "#d9c79a", INK, DT) + rect(32, 14, 16, 4, M["rope"], INK, HR) + path("M48 16 q8 -2 10 6", "none", INK, DT)
    s += line(28, 30, 30, 44, "#ffffff", 1.4, op=.6) + drop(50, 28, 2.6)
    return s

@item("guandao", 3)
def _():
    # a guandao: a long red-lacquered shaft, a broad curved single-edged blade with a notch and spike on its back, a brass dragon head
    # where blade meets shaft, a red tassel, a pointed iron butt spike
    s = rect(10, 40, 110, 7, "#8e2f26", INK, OL, rx=2) + path("M10 40 L2 43.5 L10 47 Z", M["iron"], INK, DT)
    s += path("M126 34 Q150 30 162 12 Q170 6 172 10 Q168 34 150 48 L126 50 Z", M["steel"], INK, OL)
    s += path("M126 34 Q150 30 162 12 L158 26 L148 30 L144 36 Z", M["steel2"], None)
    s += path("M126 34 Q150 30 162 12 Q170 6 172 10 Q168 34 150 48 L126 50 Z", "none", INK, OL)
    s += path("M146 31 l4 -8 l2 6", "none", INK, DT)                                                   # the back notch and spike
    s += path("M114 36 Q120 32 128 34 L128 50 Q120 54 114 50 Z", M["brass"], INK, DT) + circ(122, 40, 1.6, INK, None) + path("M116 48 q4 2 8 0", "none", INK, HR)
    s += path("M114 48 Q110 58 112 68 L118 68 Q118 58 118 48 Z", M["red"], INK, DT) + "".join(line(x, 66, x, 72, M["red"], 1.6) for x in (112, 115, 118))
    return s

@item("chakram", 1)
def _():
    # a chakram: a flat steel ring seen a little inclined, a sharpened outer edge, a band of brass inlay, a nick in the edge
    s = ell(40, 40, 32, 28, M["steel"], INK, OL) + ell(40, 40, 22, 18, "none", INK, DT)
    s += ell(40, 40, 27, 23, "none", M["brass"], 3) + "".join(circ(40 + 27 * math.cos(math.radians(a_)), 40 + 23 * math.sin(math.radians(a_)), 1.2, INK, None) for a_ in range(0, 360, 30))
    s += ell(40, 40, 18, 14, "#00000000", INK, DT) + ell(40, 40, 32, 28, "none", INK, OL)
    s += path("M66 24 l4 -2 l-1 4", "#f3ead6", INK, HR)
    return s

@item("dragonkite", 2)
def _():
    # a centipede dragon kite: a paper dragon head with eyes, horns and whiskers, then a chain of round paper discs on a bamboo spine,
    # each with a feather out each side; the string down to a reel
    s = path("M30 34 Q50 20 70 32 Q90 46 110 34", "none", INK, DT)
    for i, (x, y) in enumerate(((44, 26), (58, 26), (72, 34), (86, 40), (100, 38), (114, 30))):
        s += line(x, y - 14, x, y + 14, INK, 1.4)
        s += circ(x, y, 7 - i * .5, (M["red"], M["gold"], M["cream"])[i % 3], INK, DT)
        s += path(f"M{x} {y - 14} l-3 -4 M{x} {y + 14} l-3 4", "none", INK, 1)
    s += path("M10 30 Q14 14 30 18 Q40 22 38 34 Q34 44 22 44 Q10 42 10 30 Z", M["red"], INK, OL)
    s += circ(26, 28, 4.4, "#ffffff", INK, DT) + circ(27, 28, 2, INK, None) + path("M24 18 L20 6 M30 18 L32 6", "none", INK, DT)
    s += path("M14 40 Q6 48 2 44 M18 42 Q12 54 6 54", "none", INK, HR) + path("M16 36 h10", "none", M["gold"], 2.4)
    s += path("M30 44 Q34 60 50 70", "none", INK, HR) + circ(54, 72, 6, M["wood"], INK, DT) + line(48, 72, 60, 72, INK, DT)
    return s

@item("stillwater", 2)
def _():
    # a wide stoneware water jar with a rolled rim, a flat still surface, a floating lotus leaf and one bud, a single ripple ring
    s = path("M16 26 Q8 50 20 72 H92 Q104 50 96 26 Z", "#5e3b27", INK, OL) + path("M74 26 H96 Q104 50 92 72 H80 Q90 50 74 26 Z", "#4a2e1e", None)
    s += ell(56, 26, 42, 7, "#6d8a98", INK, OL) + ell(56, 22, 46, 5, "none", INK, DT)
    s += ell(44, 26, 14, 4, M["green"], INK, DT) + line(44, 26, 52, 24, INK, HR)
    s += path("M70 24 Q66 12 72 6 Q78 12 74 24 Z", "#e6b8a2", INK, DT) + line(72, 24, 72, 28, INK, HR)
    s += ell(84, 27, 6, 1.6, "none", "#f2f4f0", 1)
    return s

@item("lacquer", 2)
def _():
    # a Qing tengpai: a round convex shield of coiled rattan with a double rim, painted with a tiger's face; a dao laid beside it
    s = circ(48, 40, 34, "#d9c08a", INK, OL) + circ(48, 40, 30, "none", INK, DT)
    for r_ in (31, 32.5): s += circ(48, 40, r_, "none", "#a8915c", .8)
    s += circ(48, 40, 26, M["gold"], None)
    s += ell(36, 34, 7, 5, PORC, INK, DT) + ell(60, 34, 7, 5, PORC, INK, DT) + circ(37, 34, 2.6, INK, None) + circ(59, 34, 2.6, INK, None)
    s += path("M40 24 h16 M48 20 v8 M42 28 h12", "none", INK, 2)                                     # 王 on the brow
    s += path("M44 44 h8 l-4 5 Z", INK, None) + path("M34 52 Q48 62 62 52 Q48 56 34 52 Z", M["red"], INK, DT)
    s += path("M38 52 l2 6 l2 -5 M58 52 l-2 6 l-2 -5", "#ffffff", INK, HR)
    s += path("M24 46 l-6 -2 M24 50 l-6 2 M72 46 l6 -2 M72 50 l6 2", "none", INK, HR)
    s += blade(98, 70, 124, 10, 7, 6, curve=-.3) + rect(94, 70, 8, 8, M["brass"], INK, DT)
    return s

@item("clam", 2)
def _():
    # a giant clam half open: two heavy valves with deep radial ribs and a zigzag lip, the mottled mantle showing between, a pearl
    s = path("M12 60 Q16 76 64 78 Q112 76 116 60 L104 52 L92 62 L80 52 L68 62 L56 52 L44 62 L32 52 L20 62 Z", "#efe6cf", INK, OL)
    s += path("M14 46 Q20 10 64 6 Q108 10 114 46 L102 54 L90 44 L78 54 L66 44 L54 54 L42 44 L30 54 Z", "#efe6cf", INK, OL)
    for x in (30, 46, 64, 82, 98): s += path(f"M64 8 Q{x} 26 {x} 50", "none", INK, HR) + path(f"M64 76 Q{x} 70 {x} 60", "none", INK, HR)
    s += path("M20 58 L32 52 L44 62 L56 52 L68 62 L80 52 L92 62 L104 52 L112 58 Q66 50 20 58 Z", "#7f9fb3", None)
    s += stipple(26, 52, 80, 8, 14, "#c7d7e2", 2, .9, seed=3) + circ(64, 54, 4, "#f8f4ec", INK, HR)
    return s

@item("abacus", 1)
def _():
    # a suanpan: a dark wood frame, a dividing beam, two beads above and five below on each rod, round double-cone beads, a few moved
    s = rect(6, 8, 68, 64, M["dark"], INK, OL) + rect(12, 14, 56, 52, "#e9dcbf", INK, DT) + rect(12, 28, 56, 4, M["dark"], INK, DT)
    for i in range(7):
        x = 16 + i * 8
        s += line(x, 14, x, 66, INK, HR)
        up = (i in (2, 5))
        for j in range(2): s += path(f"M{x-3.4} {(17 + j*5) if not up else (20 + j*5)} l3.4 -2.2 l3.4 2.2 l-3.4 2.2 Z", M["black"], None)
        for j in range(5):
            y = 37 + j * 5 + (6 if j >= (3 if i in (1, 4) else 5) else 0)
            s += path(f"M{x-3.4} {y} l3.4 -2.2 l3.4 2.2 l-3.4 2.2 Z", M["black"], None)
    for x, y in ((6, 8), (66, 8), (6, 64), (66, 64)): s += rect(x, y, 8, 8, M["brass"], INK, HR)
    return s

@item("koi", 2)
def _():
    # a big blue-and-white porcelain fish bowl with a wave band, slate water, two goldfish at the surface, one tail breaking it
    s = path("M14 30 Q12 70 64 74 Q116 70 114 30 Z", PORC, INK, OL)
    s += path("M18 40 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t12 0", "none", BLUE, 2) + path("M28 58 Q46 50 64 58 Q82 66 100 58", "none", BLUE, 1.6)
    s += ell(64, 30, 50, 8, "#6d8a98", INK, OL)
    s += fish_body(48, 30, 22, 6, "#e0883a") + poly([(37, 30), (32, 26), (32, 34)], "#e0883a", INK, HR)
    s += path("M82 28 Q90 18 98 22 Q92 26 90 32 Z", "#e0883a", INK, DT)
    s += ell(64, 22, 54, 4, "none", INK, DT)
    return s

@item("jade", 1)
def _():
    # a jade bi: a flat disc with a central hole and a grain pattern of raised dots, hung from a red cord with a Chinese knot and a tassel
    s = line(40, 2, 40, 14, M["red"], 2.4)
    s += circ(40, 36, 22, "#8fb39a", INK, OL) + circ(40, 36, 7, "#f3ead6", INK, DT)
    for r_ in (12, 17):
        n = int(r_ * .9)
        s += "".join(circ(40 + r_ * math.cos(2 * math.pi * i / n), 36 + r_ * math.sin(2 * math.pi * i / n), 1, "#6d9a7e", None) for i in range(n))
    s += path("M34 14 h12 l-6 8 Z", M["red"], INK, HR) + path("M40 58 l-4 4 l4 4 l4 -4 Z", M["red"], INK, HR)
    s += path("M36 66 H44 L46 78 H34 Z", M["red"], INK, DT) + "".join(line(x, 70, x, 78, INK, HR) for x in (37, 40, 43))
    return s

@item("nettle", 1)
def _():
    # a herb ball: a cloth bundle tied at the top with string, nettle leaves with serrated edges poking out, a green stain seeping
    s = path("M40 30 Q14 32 16 54 Q18 74 40 74 Q62 74 64 54 Q66 32 40 30 Z", "#e6d8b6", INK, OL)
    s += path("M30 56 Q40 50 48 60 Q44 68 34 66 Z", "#b6c48a", None, op=.8)
    s += path("M34 30 Q36 22 32 16 M46 30 Q44 22 48 16", "none", INK, DT) + rect(33, 26, 14, 5, M["rope"], INK, HR)
    for x, y, a_ in ((28, 14, -30), (40, 8, 0), (52, 14, 30)):
        lf = path("M0 0 L-4 -4 L-2 -6 L-5 -10 L-1 -12 L0 -18 L1 -12 L5 -10 L2 -6 L4 -4 Z", M["green"], INK, HR) + line(0, 0, 0, -16, INK, .6)
        s += f'<g transform="translate({x} {y+10}) rotate({a_})">{lf}</g>'
    s += path("M24 44 q6 -8 14 -4", "none", INK, HR)
    return s

@item("moongate", 2)
def _():
    # a moon gate: a section of whitewashed garden wall under grey tile coping, a round opening with a stone surround, bamboo beyond, a stepping stone
    s = rect(4, 18, 120, 58, "#f1ebdc", INK, OL)
    s += path("M0 18 L8 8 H120 L128 18 Z", "#6d7a86", INK, OL) + "".join(path(f"M{x} 9 v8", "none", INK, HR) for x in range(14, 120, 8))
    s += circ(64, 48, 26, "#d8c9a6", INK, OL) + circ(64, 48, 21, "#c9dcc9", INK, DT)
    for x in (54, 66, 76):
        s += line(x, 70, x + 2, 30, INK, 3.4) + line(x, 70, x + 2, 30, M["green"], 1.8)
        s += path(f"M{x+1} 40 l8 -4 M{x+2} 34 l-7 -3 M{x} 54 l8 -2", "none", M["green"], 2)
    s += rect(4, 18, 120, 58, "none", INK, OL) + ell(64, 78, 14, 3, "#b8b2aa", INK, DT)
    return s
