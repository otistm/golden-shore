"""the legendary pieces: one of a kind, for any ship (see item-notes.md, Legendary)"""
from itemart import *

GILT = "#d9b24a"

@item("longtom", 3)
def _():
    # Long Tom: a long brass chase gun, its barrel near twice the usual length, mouldings and a dolphin, on a pivoting slide
    s = rect(20, 58, 140, 8, M["oak"], INK, OL) + circ(30, 70, 6, M["oak"], INK, DT) + circ(150, 70, 6, M["oak"], INK, DT)
    s += circ(14, 40, 5, M["brass"], INK, DT)
    s += path("M18 30 L70 32 L70 34 L120 35 L120 36 L166 37 L170 35 L170 45 L166 43 L120 44 L120 45 L70 46 L70 48 L18 50 Z", M["brass"], INK, OL)
    s += path("M22 32 L166 38", "none", "#f0d79a", 1.4) + line(70, 32, 70, 48, INK, DT) + line(120, 35, 120, 45, INK, DT)
    s += path("M84 34 Q86 24 94 25 Q98 28 92 34", "none", INK, 4.4) + path("M84 34 Q86 24 94 25 Q98 28 92 34", "none", M["brass"], 2.4)
    s += rect(40, 50, 26, 8, M["oak"], INK, DT) + stipple(30, 34, 120, 10, 14, "#7f9f86", 1.8, .9, seed=5)
    return s

@item("admsword", 2)
def _():
    # the Admiral's Sword: a presentation sword, a straight blued-and-gilt blade, a gilt stirrup hilt with a lion's-head pommel, ivory grip
    s = blade(40, 40, 124, 40, 8, 6, back=True)
    s += path("M48 37 h40", "none", "#3f5f7d", 3) + path("M52 37 l3 -2 l3 2 l3 -2 l3 2 M70 37 l3 -2 l3 2", "none", GILT, 1)
    s += path("M38 30 L42 50 M38 40 Q24 30 14 38", "none", INK, 5) + path("M38 30 L42 50 M38 40 Q24 30 14 38", "none", GILT, 2.6)
    s += grip(38, 40, 16, 40, 9, "#efe6cf", 5)
    s += path("M16 34 Q6 32 6 40 Q6 48 16 46 Z", GILT, INK, DT) + circ(9, 39, 1.2, INK, None) + path("M6 36 q-3 4 0 8", "none", INK, HR)
    s += path("M24 46 q-2 12 4 18 l3 -2 q-4 -6 -2 -14", GILT, INK, HR)
    return s

@item("seaclock", 1)
def _():
    # a marine chronometer: a brass bowl in gimbals inside a mahogany box, the white dial with Roman hours and a seconds dial, the lid up
    s = path("M8 30 L14 8 H66 L72 30 Z", "#6e3a26", INK, OL) + rect(18, 12, 44, 14, "#8a4a30", None)
    s += rect(6, 30, 68, 44, "#6e3a26", INK, OL) + rect(10, 34, 60, 36, "#8a4a30", INK, HR)
    s += circ(40, 52, 18, M["brass"], INK, DT) + circ(40, 52, 14, M["paper"], INK, DT)
    for i in range(12):
        a = math.radians(i * 30)
        s += line(40 + 12 * math.sin(a), 52 - 12 * math.cos(a), 40 + 10.4 * math.sin(a), 52 - 10.4 * math.cos(a), INK, HR)
    s += line(40, 52, 40, 43, INK, 1.6) + line(40, 52, 46, 55, INK, 1.2) + circ(40, 58, 3, "none", INK, .7) + circ(40, 52, 1.2, INK, None)
    s += circ(20, 40, 2, M["brass"], INK, HR) + circ(60, 40, 2, M["brass"], INK, HR)
    return s

@item("surgeon", 2)
def _():
    # a naval surgeon's chest open: brass-bound mahogany, a baize-lined tray with an amputation saw, a tourniquet, bottles and a bone saw
    s = path("M14 30 L20 6 H108 L114 30 Z", "#6e3a26", INK, OL)
    s += rect(10, 30, 108, 44, "#6e3a26", INK, OL) + rect(16, 34, 96, 26, "#3f5a46", INK, DT)
    s += path("M22 40 H58 L56 50 H24 Z", M["steel"], INK, DT) + path("M58 42 Q66 38 68 46 L58 48", "none", INK, 3) + "".join(line(26 + i * 4, 50, 27 + i * 4, 52, INK, HR) for i in range(8))
    for x, col in ((78, M["glass2"]), (88, "#b07a3e"), (98, "#7a4a6e")):
        s += rect(x, 38, 7, 18, col, INK, DT) + rect(x + 1.5, 35, 4, 4, M["wood"], INK, HR)
    s += path("M24 56 h30", "none", INK, 3) + path("M24 56 h30", "none", M["red"], 1.4)
    s += rect(10, 62, 108, 4, M["brass"], INK, HR) + rect(56, 64, 16, 8, M["brass"], INK, DT)
    return s

@item("krakenink", 1)
def _():
    # Kraken's Ink: a stoneware jar sealed with wax, black ink weeping from under the seal, a tentacle tip curled round it, a tag
    s = path("M22 26 Q12 40 16 62 Q20 74 40 74 Q60 74 64 62 Q68 40 58 26 Z", "#6d6a5c", INK, OL)
    s += rect(26, 16, 28, 12, "#8f2f26", INK, DT) + path("M26 26 q4 6 8 2 q4 6 8 0 q4 6 12 -2", "#8f2f26", INK, HR)
    s += path("M36 28 q-2 10 0 18 q2 4 3 0 q1 -8 -1 -18", M["black"], None)
    s += path("M64 70 Q76 60 70 44 Q64 34 56 40 Q52 46 58 48 Q64 48 64 54 Q64 62 54 66", "none", INK, 6) + path("M64 70 Q76 60 70 44 Q64 34 56 40 Q52 46 58 48 Q64 48 64 54 Q64 62 54 66", "none", "#9a6f86", 3.4)
    for (x, y) in ((68, 50), (66, 60)): s += circ(x, y, 1.2, "#efe6cf", None)
    s += path("M20 34 q-10 4 -10 14", "none", INK, HR) + rect(4, 46, 12, 14, M["paper"], INK, DT)
    return s

@item("astrolabe", 1)
def _():
    # a mariner's astrolabe: a heavy open brass wheel with four spokes, a degree scale on the rim, a sighting rule (alidade) across, a ring to hang it
    s = circ(40, 10, 5, "none", INK, 4) + circ(40, 10, 5, "none", M["brass"], 2) + rect(37, 14, 6, 6, M["brass"], INK, DT)
    s += circ(40, 46, 28, "none", INK, 11) + circ(40, 46, 28, "none", M["brass"], 7)
    for i in range(36): 
        a = math.radians(i * 10)
        s += line(40 + 26 * math.cos(a), 46 + 26 * math.sin(a), 40 + 30 * math.cos(a), 46 + 30 * math.sin(a), INK, .6)
    s += line(12, 46, 68, 46, INK, 5) + line(12, 46, 68, 46, M["brass2"], 2.6) + line(40, 18, 40, 74, INK, 5) + line(40, 18, 40, 74, M["brass2"], 2.6)
    s += R(rect(14, 43, 52, 6, M["brass"], INK, DT) + rect(18, 39, 4, 14, M["brass"], INK, HR) + rect(58, 39, 4, 14, M["brass"], INK, HR), -30, 40, 46)
    s += circ(40, 46, 3.4, M["brass2"], INK, DT)
    return s

@item("liveoak", 2)
def _():
    # live oak planking: curved, dense planks of live oak (the "old ironsides" timber), its tight grain, copper bolts, a cannonball bounced off
    s = ""
    for i, y in enumerate((14, 30, 46)):
        s += path(f"M8 {y} Q64 {y-6} 120 {y} V{y+16} Q64 {y+10} 8 {y+16} Z", "#7a5838" if i % 2 else "#8a6440", INK, OL)
        for k in range(3): s += path(f"M14 {y+4+k*4} Q64 {y-2+k*4} 114 {y+4+k*4}", "none", "#5e4228", .8)
        s += "".join(circ(x, y + 8 - (8 if 30 < x < 98 else 0) * .3, 2.2, M["copper"], INK, HR) for x in (22, 64, 106))
    s += path("M100 70 Q108 62 116 70", "none", INK, HR) + circ(108, 72, 6, M["iron2"], INK, DT) + path("M86 36 l4 -2 l2 4", "none", INK, HR)
    return s

@item("infernal", 2)
def _():
    # an infernal machine (a "torpedo" of 1804): a copper-cased powder keg with a brass clockwork lock on top, a lanyard to the trigger, a float ring
    s = path("M14 26 Q60 16 106 26 Q112 44 106 62 Q60 72 14 62 Q8 44 14 26 Z", M["copper"], None)
    for y in (34, 44, 54): s += path(f"M14 {y} Q60 {y - 10 + (y - 26) * .5} 106 {y}", "none", M["copper2"], 1.2)
    s += "".join(circ(x, 44, 1.2, INK, None) for x in range(20, 106, 10))
    s += path("M14 26 Q60 16 106 26 Q112 44 106 62 Q60 72 14 62 Q8 44 14 26 Z", "none", INK, OL)
    s += rect(48, 8, 26, 14, M["brass"], INK, OL) + circ(61, 15, 5, M["paper"], INK, DT) + line(61, 15, 61, 11.5, INK, 1) + line(61, 15, 64, 16, INK, 1)
    s += path("M74 14 Q92 6 104 14 Q114 22 120 18", "none", INK, DT) + circ(121, 18, 3, "none", INK, DT)
    s += ell(60, 74, 34, 4, "none", INK, 4) + ell(60, 74, 34, 4, "none", "#c9b48a", 2)
    return s
