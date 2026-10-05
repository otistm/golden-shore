"""
ware.py - drawing library for flat-color, clear-line game assets in the manner of Chris Ware.

Everything returns SVG *strings*. Compose strings, then wrap with svg_doc().
No <style>, no filters, no embedded images: output is portable, upload-safe, and
renders the same in browsers, cairosvg, and canvas drawImage().

Quick start
-----------
    import sys; sys.path.insert(0, "<skill>/scripts")
    from ware import *
    reset()                                  # clear gradients/clips from a previous asset
    W = Weights(final_px=1.0)                # asset will be drawn at 1:1 on screen
    body = rect(10, 10, 80, 60, PAL["ashen"]["bone"], INK, W.outline)
    svg = svg_doc(100, 80, body)             # transparent background
    save(svg, "out/box.svg"); render(svg, "out/box.png", scale=2)

Conventions
-----------
* Coordinates are SVG user units (y down). Author every asset at the size it will
  appear on screen (1 unit = 1 CSS px) and render PNGs at 2x for retina.
* Colors are hex strings. INK is the line color (warm near-black, never #000).
* Every helper takes fill/stroke/sw like: rect(x, y, w, h, fill, stroke, sw).
  stroke=None means no outline.
"""
import math, os, random, colorsys
from pathlib import Path

try:
    import numpy as np  # optional, only used by fit_curve
except Exception:  # pragma: no cover
    np = None

SKILL_DIR = Path(__file__).resolve().parent.parent
FONT_DIR = SKILL_DIR / "assets" / "fonts"

INK = "#1f1c1d"          # line color: warm near-black
PAPER = "#fbfaf6"        # page/gutter white (slightly warm)
DEFS = []                # gradients + clipPaths collected per document
_id = [0]


# =====================================================================
# document management
# =====================================================================
def reset():
    """Call at the start of every asset so defs from earlier assets don't leak in."""
    DEFS.clear()
    _id[0] = 0


def nid(p="i"):
    _id[0] += 1
    return f"{p}{_id[0]}"


def svg_doc(w, h, body, bg=None, title=None):
    """Wrap body in a complete SVG. bg=None -> transparent (sprites, icons)."""
    t = f"<title>{title}</title>" if title else ""
    back = f'<rect width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" '
            f'width="{f(w)}" height="{f(h)}">{t}<defs>{"".join(DEFS)}</defs>{back}{body}</svg>')


def out_dir(sub=""):
    """Writable output folder: $WARE_OUT, else ./ware_out in the current directory.
    (The installed skill folder is read-only - never write there.)"""
    p = Path(os.environ.get("WARE_OUT", Path.cwd() / "ware_out")) / sub
    p.mkdir(parents=True, exist_ok=True)
    return p


def save(svg, path):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(svg)
    return str(p)


def render(svg, png_path, scale=2.0, crop=None):
    """Rasterize with cairosvg. crop=(x,y,w,h) in SVG units -> zoomed review crop."""
    import cairosvg
    Path(png_path).parent.mkdir(parents=True, exist_ok=True)
    if crop:
        x, y, w, h = crop
        svg = svg.replace('viewBox="', 'data-old-viewBox="', 1)
        svg = svg.replace("<svg ", f'<svg viewBox="{f(x)} {f(y)} {f(w)} {f(h)}" ', 1)
        import re
        svg = re.sub(r'width="[^"]+" height="[^"]+"', f'width="{f(w)}" height="{f(h)}"', svg, count=1)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=png_path, output_width=int(w * scale))
    else:
        import re
        m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
        w = float(m.group(1)) if m else 512
        cairosvg.svg2png(bytestring=svg.encode(), write_to=png_path, output_width=int(w * scale))
    return png_path


def f(v):
    """Compact number formatting (keeps files small)."""
    return f"{v:.2f}".rstrip("0").rstrip(".") if isinstance(v, float) else str(v)


# =====================================================================
# line weights
# =====================================================================
class Weights:
    """
    Ware uses ~3 line weights and never varies them for expression.
    Weights are set by FINAL ON-SCREEN size: if an asset is authored at 2x the
    size it will be drawn, pass final_px=0.5 and the strokes double in source units.

      border  panel/card borders        (~2.0x outline)
      outline silhouettes, major forms  (the "one line")
      detail  seams, mullions, folds    (~0.6x outline)
      hair    rigging, wires, grain     (~0.4x outline)
    """
    def __init__(self, final_px=1.0, outline_px=2.0):
        k = outline_px / final_px
        self.outline = k
        self.detail = k * 0.6
        self.hair = k * 0.42
        self.border = k * 2.1


# =====================================================================
# primitives
# =====================================================================
def attrs(fill="none", stroke=INK, sw=2.0, op=None, extra=""):
    s = f'fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{f(float(sw))}" stroke-linejoin="round" stroke-linecap="round"'
    if op is not None:
        s += f' opacity="{f(float(op))}"'
    return s + (" " + extra if extra else "")


def path(d, fill="none", stroke=INK, sw=2.0, op=None, extra=""):
    return f'<path d="{d}" {attrs(fill, stroke, sw, op, extra)}/>'


def pts_d(pts, close=True):
    d = "M" + " L".join(f"{f(float(x))} {f(float(y))}" for x, y in pts)
    return d + ("Z" if close else "")


def smooth_d(pts, close=False, tension=0.5):
    """Catmull-Rom through points -> cubic bezier path (for cloth, hair, branches)."""
    n = len(pts)
    if n < 3:
        return pts_d(pts, close)
    P = pts + (pts[:3] if close else [])
    d = f"M{f(float(P[0][0]))} {f(float(P[0][1]))}"
    rng = range(n if close else n - 1)
    for i in rng:
        p0 = P[i - 1] if (i > 0 or close) else P[i]
        p1, p2 = P[i], P[(i + 1) % len(P)]
        p3 = P[(i + 2) % len(P)] if (i + 2 < len(P) or close) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d += f" C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(float(p2[0]))} {f(float(p2[1]))}"
    return d + ("Z" if close else "")


def poly(pts, fill="none", stroke=INK, sw=2.0, op=None, close=True, extra=""):
    return path(pts_d(pts, close), fill, stroke, sw, op, extra)


def rect(x, y, w, h, fill="none", stroke=INK, sw=2.0, op=None, rx=0, extra=""):
    r = f' rx="{f(float(rx))}"' if rx else ""
    return (f'<rect x="{f(float(x))}" y="{f(float(y))}" width="{f(float(w))}" height="{f(float(h))}"{r} '
            f'{attrs(fill, stroke, sw, op, extra)}/>')


def circ(cx, cy, r, fill="none", stroke=INK, sw=2.0, op=None, extra=""):
    return f'<circle cx="{f(float(cx))}" cy="{f(float(cy))}" r="{f(float(r))}" {attrs(fill, stroke, sw, op, extra)}/>'


def ell(cx, cy, rx, ry, fill="none", stroke=INK, sw=2.0, op=None, extra=""):
    return (f'<ellipse cx="{f(float(cx))}" cy="{f(float(cy))}" rx="{f(float(rx))}" ry="{f(float(ry))}" '
            f'{attrs(fill, stroke, sw, op, extra)}/>')


def line(x1, y1, x2, y2, stroke=INK, sw=2.0, op=None):
    return path(f"M{f(float(x1))} {f(float(y1))} L{f(float(x2))} {f(float(y2))}", "none", stroke, sw, op)


def g(content, extra=""):
    return f"<g {extra}>{content}</g>"


def tr(content, x=0, y=0, s=1.0, rot=0, sx=None):
    """Translate / scale / rotate a group. sx=-1 mirrors (flip a sprite to face left)."""
    t = f"translate({f(float(x))} {f(float(y))})"
    if rot:
        t += f" rotate({f(float(rot))})"
    if sx is not None:
        t += f" scale({f(float(sx * s))} {f(float(s))})"
    elif s != 1:
        t += f" scale({f(float(s))})"
    return f'<g transform="{t}">{content}</g>'


def lingrad(stops, x1=0, y1=0, x2=0, y2=1):
    """Linear gradient (objectBoundingBox). Ware only uses these for SKIES and LIGHT,
    and always with grain on top (see grain_rect)."""
    gid = nid("lg")
    s = "".join(f'<stop offset="{f(float(o))}" stop-color="{c}"/>' for o, c in stops)
    DEFS.append(f'<linearGradient id="{gid}" x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}">{s}</linearGradient>')
    return f"url(#{gid})"


def clip(shape_svg):
    """Returns an attribute string: g(content, clip(...))"""
    cid = nid("cp")
    DEFS.append(f'<clipPath id="{cid}">{shape_svg}</clipPath>')
    return f'clip-path="url(#{cid})"'


def tube(d, color, width, sw=1.6):
    """Outlined thick stroke along a path: handles, ropes, pipes, chains, staffs."""
    return path(d, "none", INK, width + 2 * sw) + path(d, "none", color, width)


def union_outline(shapes_d, fill, sw=2.0, stroke=INK):
    """Several overlapping shapes, one clean outer contour (head+neck+body, cloud lobes).
    Draws every shape stroked at 2*sw, then every shape filled with no stroke."""
    a = "".join(path(d, fill, stroke, sw * 2) for d in shapes_d)
    b = "".join(path(d, fill, None) for d in shapes_d)
    return a + b


# =====================================================================
# color
# =====================================================================
def _rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _hex(rgb):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v * 255))) for v in rgb)


def mix(a, b, t):
    A, B = _rgb(a), _rgb(b)
    return _hex(tuple(A[i] + (B[i] - A[i]) * t for i in range(3)))


def shade(c, amt=0.18, cool=0.03):
    """Flat shadow tone: darker, slightly desaturated, nudged toward blue-violet.
    Ware's shade planes are the same color family, never a gradient."""
    h, l, s = colorsys.rgb_to_hls(*_rgb(c))
    h = (h + (0.66 - h) * cool) % 1.0
    return _hex(colorsys.hls_to_rgb(h, max(0, l * (1 - amt)), s * (1 - amt * 0.3)))


def tint(c, amt=0.18):
    """Lit plane / rim: lighter and slightly warmer."""
    h, l, s = colorsys.rgb_to_hls(*_rgb(c))
    h = (h + (0.11 - h) * 0.04) % 1.0
    return _hex(colorsys.hls_to_rgb(h, min(1, l + (1 - l) * amt), s))


def desat(c, amt=0.4):
    h, l, s = colorsys.rgb_to_hls(*_rgb(c))
    return _hex(colorsys.hls_to_rgb(h, l, s * (1 - amt)))


def sat_of(c):
    return colorsys.rgb_to_hsv(*_rgb(c))[1]


# Palettes. The first six are measured from the reference set (median-of-patch samples);
# the rest are built with the same rules. See references/palettes.md for roles and usage.
PAL = {
    "chicago_afternoon": dict(sky="#8cb7b8", sky_pale="#c7d9d7", wall="#b58b91", wall_shade="#a97f74",
                              trim="#d5cba9", far="#7a8984", ground="#d3d8d6", fence="#706d65",
                              leaf="#9eb49a", leaf_rim="#a4c141", accent="#e0603f", deep="#151510"),
    "dusk_peach": dict(sky="#f6a479", sky_pale="#ffe3a2", wall="#b58b91", far="#aa8d89",
                       ground="#5d504f", leaf="#a6ce3a", accent="#257aa3", deep="#35302e"),
    "snow_evening": dict(sky="#8cb9cc", snow="#afd4e3", snow_hi="#cfe4ec", wall="#9b7d82", roof="#67656a",
                         cloud="#f2b8b0", lit="#f5d36f", trunk="#6b4f45", deep="#3b393b"),
    "school_morning": dict(sky="#fddea2", brick="#9e6a47", stone="#ada89e", ochre="#cf9c5c",
                           glass="#373639", slate="#617080", accent="#f6ca00", leaf="#af684c", deep="#242527"),
    "winter_city": dict(sky="#c9dae2", sky_hi="#e9eded", steel="#6a8191", slate="#3c4452",
                        stone="#9faaac", brick="#825f5f", grey="#988f8b", deep="#242527"),
    "rain_shop": dict(rain="#b3c7d0", wall="#534e4c", green="#4f754c", leaf="#6b8f77", leaf_hi="#adcaab",
                      accent="#f05a5a", accent2="#ee4d84", warn="#ffe68f", deep="#151515"),
    "sea_dusk": dict(sky_top="#6e8797", sky_mid="#a7b6b4", sky_low="#e8c6a2", horizon="#f1c098",
                     cloud="#d49e9a", sea="#5a7a80", sea_deep="#2f4a52", dash="#86a2a6", hull="#383a3f",
                     cream="#e8e0cb", buff="#d3ae6f", ochre="#cc9a52", lit="#ffd77a", foam="#f3efe4"),
    "night": dict(sky_top="#1d2c3a", sky_low="#3b5465", sea="#16232c", dash="#2c4250", star="#e9e4cf",
                  moon="#efe6c8", lit="#ffd77a", wall="#6a7079"),
    "interior_night": dict(wall="#bcc3b1", wall_shade="#a6ad9b", wood="#8f6d4c", floor="#3a3633",
                           lamp="#fff1b4", fabric="#7e9cb2", skin="#e4b48e", hair="#3a2d27"),
    # dark-fantasy palettes for souls-like work, same saturation rules
    "ashen": dict(sky="#7f939c", sky_pale="#c4c6b2", fog="#a9ada6", far="#66767d", stone="#8f887c",
                  stone_shade="#6d675e", bone="#d9cfb8", soot="#2a2826", rust="#8a4a32", moss="#6d7a55",
                  cloth="#5f5a52", blood="#6e2b2a", ember="#e08a3c", candle="#f2c66b", deep="#1a1817"),
    "ember_crypt": dict(wall="#4a3f3a", wall_shade="#362e2b", stone="#7a6e64", bone="#d6c8a8",
                        brass="#b08a4a", ember="#e3893a", glow="#f6c76a", smoke="#6d6762", deep="#141110"),
    "pale_cathedral": dict(sky="#c7cdc9", stone="#b9b2a2", stone_shade="#968f80", glass_red="#8e3b35",
                           glass_blue="#3f5f7d", gold="#c9a35a", moss="#7d876a", deep="#1d1b1a"),
    "bog_dusk": dict(sky="#9a8f86", sky_low="#d0a785", water="#4d5a52", reed="#7a7448", mud="#4a3d33",
                     lantern="#f0c060", rot="#5d6a3e", deep="#171612"),
}


# =====================================================================
# grain, stipple, gradients the Ware way
# =====================================================================
def dots(points, color, size=1.4, op=None):
    if not points:
        return ""
    d = "".join(f"M{f(float(x))} {f(float(y))}h{f(float(size))}v{f(float(size))}h-{f(float(size))}z" for x, y in points)
    o = f' opacity="{f(float(op))}"' if op is not None else ""
    return f'<path d="{d}" fill="{color}"{o}/>'


def stipple(x0, y0, w, h, n, color, size=1.4, op=None, dens=None, seed=1):
    """n random square dots in a box. dens(u, v) -> acceptance 0..1 (u, v in 0..1)."""
    rnd = random.Random(seed)
    pts, tries = [], 0
    while len(pts) < n and tries < n * 40:
        tries += 1
        u, v = rnd.random(), rnd.random()
        if dens is None or rnd.random() < dens(u, v):
            pts.append((x0 + u * w, y0 + v * h))
    return dots(pts, color, size, op)


def grain_rect(x, y, w, h, stops, grain=0.9, seed=3, vertical=True, size=1.3):
    """Ware sky: gradient + two layers of grain (light dots densest toward the light end,
    dark dots densest toward the dark end). grain scales dot count."""
    gx2, gy2 = (0, 1) if vertical else (1, 0)
    fill = lingrad(stops, 0, 0, gx2, gy2)
    area = w * h
    n = int(area / 260 * grain)
    lo, hi = stops[-1][1], stops[0][1]
    s = rect(x, y, w, h, fill, None)
    axis = (lambda u, v: v) if vertical else (lambda u, v: u)
    s += stipple(x, y, w, h, n, tint(lo, 0.35), size, 0.55, lambda u, v: axis(u, v) ** 2.2, seed)
    s += stipple(x, y, w, h, int(n * 0.55), shade(hi, 0.18), size, 0.45, lambda u, v: (1 - axis(u, v)) ** 3, seed + 1)
    return s


def speckle_floor(x, y, w, h, color="#e9e2d0", density=1.0, seed=31, size=1.3):
    """Dark floors/pavement in Ware carry sparse light specks (grit, snow, dust)."""
    return stipple(x, y, w, h, int(w * h / 190 * density), color, size, 0.8, seed=seed)


def litter(x0, x1, y, n=8, seed=4, colors=("#e9e2d0", "#c9a95a", "#8a8378")):
    """Tiny ground debris: dots, a paper sliver, a can. Ware's sidewalks always have it."""
    rnd = random.Random(seed)
    s = ""
    for i in range(n):
        x = rnd.uniform(x0, x1)
        k = rnd.random()
        c = rnd.choice(colors)
        if k < 0.6:
            s += circ(x, y + rnd.uniform(-2, 2), rnd.uniform(0.7, 1.4), c, INK, 0.6)
        elif k < 0.85:
            s += poly([(x, y), (x + 5, y - 1), (x + 6, y + 1.5), (x + 1, y + 2)], c, INK, 0.7)
        else:
            s += rect(x, y - 2, 3.4, 2.2, c, INK, 0.7, rx=0.8)
    return s


# =====================================================================
# Ware's signature edges and natural forms
# =====================================================================
def serrated_blob(cx, cy, rx, ry, teeth=40, depth=0.07, seed=0, wob=0.05, rot=0):
    """Closed blob with a fine sawtooth edge (tree crowns, foam, cumulus, bursts)."""
    rnd = random.Random(seed)
    pts, n = [], teeth * 2
    ph = rnd.random() * 6.28
    for i in range(n):
        a = 2 * math.pi * i / n
        r = 1 + wob * math.sin(3 * a + ph) + wob * 0.6 * math.sin(5 * a + ph * 2)
        r *= (1 + depth) if i % 2 == 0 else 1
        x, y = rx * r * math.cos(a), ry * r * math.sin(a)
        ca, sa = math.cos(rot), math.sin(rot)
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts_d(pts)


def serrated_top(x0, x1, ytop, ybot, tooth=4.0, amp=3.0, seed=0):
    """Strip with sawtooth top edge (grass line, hedge top). Keep amp SMALL on long runs:
    a long regular zigzag reads as teeth or lace (see review checklist)."""
    rnd = random.Random(seed)
    yt = ytop if callable(ytop) else (lambda x: ytop)
    yb = ybot if callable(ybot) else (lambda x: ybot)
    pts, x, i = [], x0, 0
    while x <= x1:
        pts.append((x, yt(x) - (amp if i % 2 == 0 else 0) - rnd.random() * amp * 0.3))
        x += tooth * (0.8 + rnd.random() * 0.4)
        i += 1
    pts += [(x1, yt(x1)), (x1, yb(x1)), (x0, yb(x0))]
    return pts_d(pts)


def crown(lobes, body, rim, sw=2.0, sun=(1, -1), seed=0, teeth_per_100=95, depth=0.035):
    """Ware tree crown / bush: serrated outline, flat body color, and a lighter RIM band
    on the sun side (the yellow-green halo on his trees). lobes = [(cx, cy, rx, ry), ...]."""
    outs = []
    for i, (cx, cy, rx, ry) in enumerate(lobes):
        teeth = max(12, int((rx + ry) * teeth_per_100 / 100))
        outs.append(serrated_blob(cx, cy, rx, ry, teeth, depth, seed + i, 0.05))
    s = union_outline(outs, rim, sw)
    cp = clip("".join(f'<path d="{d}"/>' for d in outs))
    inner = ""
    for i, (cx, cy, rx, ry) in enumerate(lobes):
        k = 0.09
        teeth = max(12, int((rx + ry) * teeth_per_100 / 100))
        inner += path(serrated_blob(cx - sun[0] * rx * k, cy - sun[1] * ry * k, rx * 0.95, ry * 0.95,
                                    teeth, depth, seed + i + 50, 0.06), body, None)
    return s + g(inner, cp)


def bare_tree(x, y, height, seed=0, depth=6, spread=0.68, color="#6b4f45", sw=1.6, lean=0.0,
              twig_color=None, min_w=1.1):
    """Leafless winter/dead tree: tapered filled branches with one clean outline; the
    finest twigs become plain ink lines (as in Ware's winter scenes)."""
    rnd = random.Random(seed)
    shapes, twigs = [], []
    twig_color = twig_color or INK

    def branch(x0, y0, ang, length, w0, d):
        bend = rnd.uniform(-0.18, 0.18)
        xm = x0 + math.cos(ang + bend) * length * 0.5
        ym = y0 + math.sin(ang + bend) * length * 0.5
        x1, y1 = x0 + math.cos(ang) * length, y0 + math.sin(ang) * length
        w1 = w0 * rnd.uniform(0.55, 0.68)
        if w0 < min_w:
            twigs.append(f"M{f(x0)} {f(y0)} Q{f(xm)} {f(ym)} {f(x1)} {f(y1)}")
        else:
            nx, ny = -math.sin(ang), math.cos(ang)
            wm = (w0 + w1) / 2
            shapes.append(pts_d([(x0 + nx * w0 / 2, y0 + ny * w0 / 2), (xm + nx * wm / 2, ym + ny * wm / 2),
                                 (x1 + nx * w1 / 2, y1 + ny * w1 / 2), (x1 - nx * w1 / 2, y1 - ny * w1 / 2),
                                 (xm - nx * wm / 2, ym - ny * wm / 2), (x0 - nx * w0 / 2, y0 - ny * w0 / 2)]))
        if d == 0 or length < 2.5:
            return
        n = 2 if rnd.random() < 0.72 else 3
        main = rnd.randrange(n)
        for i in range(n):
            if i == main:
                a = ang + rnd.uniform(-spread * 0.35, spread * 0.35)
                L = length * rnd.uniform(0.78, 0.9)
            else:
                a = ang + rnd.choice((-1, 1)) * rnd.uniform(spread * 0.55, spread * 1.25)
                L = length * rnd.uniform(0.6, 0.8)
            a = a + (-math.pi / 2 - a) * 0.12 * (d / depth)   # gentle upward tendency, like real crowns
            branch(x1, y1, a, L, w1, d - 1)

    trunk_w = height * 0.075
    branch(x, y, -math.pi / 2 + lean, height * 0.36, trunk_w, depth)
    flare = poly([(x - trunk_w * 0.9, y), (x - trunk_w * 0.45, y - height * 0.06),
                  (x + trunk_w * 0.45, y - height * 0.06), (x + trunk_w * 0.9, y)], color, None)
    out = union_outline(shapes + [pts_d([(x - trunk_w * 0.9, y), (x - trunk_w * 0.45, y - height * 0.06),
                                         (x + trunk_w * 0.45, y - height * 0.06), (x + trunk_w * 0.9, y)])],
                        color, sw * 0.75)
    tw = "".join(path(d, "none", twig_color, max(0.55, sw * 0.42)) for d in twigs)
    return tw + out + flare


def grass_tufts(x0, x1, y, n=10, seed=2, color="#6d7a55", h=6, sw=1.0):
    rnd = random.Random(seed)
    s = ""
    for _ in range(n):
        x = rnd.uniform(x0, x1)
        hh = h * rnd.uniform(0.6, 1.2)
        s += path(f"M{f(x-3)} {f(y)} L{f(x-1)} {f(y-hh*0.7)} L{f(x+0.5)} {f(y)} L{f(x+2)} {f(y-hh)} L{f(x+3.5)} {f(y)}",
                  color, INK, sw)
    return s


def flat_cloud(x0, x1, yb, hgt, color, seed=1):
    """Ware's dusk cloud: a long flat band, flat bottom, low mounds on top, NO outline."""
    r = random.Random(seed)
    d, x = f"M{f(x0)} {f(yb)}", x0
    while x < x1:
        step = r.uniform(30, 70)
        d += f" Q{f(x + step / 2)} {f(yb - hgt - r.uniform(0, hgt * 0.8))} {f(min(x + step, x1))} {f(yb - hgt * 0.35)}"
        x += step
    return path(d + f" L{f(x1)} {f(yb)} Z", color, None)


def cumulus(cx, cy, rx, ry, color="#f4f2ea", sw=1.6, seed=11, shadow=None):
    """Outlined puffy cloud (top-down or side). shadow=(dx, dy, color) for aerial views."""
    d = serrated_blob(cx, cy, rx, ry, int((rx + ry) * 0.55), 0.06, seed, 0.12)
    s = ""
    if shadow:
        s += tr(path(d, shadow[2], None, op=0.55), shadow[0], shadow[1])
    return s + path(d, color, INK, sw) + path(serrated_blob(cx - rx * 0.15, cy - ry * 0.15, rx * 0.5, ry * 0.42,
                                                           int(rx * 0.4) + 8, 0.07, seed + 1, 0.1), tint(color, 0.6), None)


def smoke(x, y, dx, dy, length, r0=6, r1=22, color="#a8aca8", op=0.78, seed=5, lift=0.25):
    """Chimney/funnel smoke: overlapping flat circles, no outline, group opacity, thinning
    and breaking up downwind. (A single outlined ribbon reads as a flag - don't.)"""
    rnd = random.Random(seed)
    n = max(8, int(length / 9))
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    s = ""
    for i in range(n):
        t = i / (n - 1)
        if t > 0.7 and i % 3 == 0:
            continue
        cx = x + ux * length * t
        cy = y + uy * length * t - math.sin(t * 1.5) * length * lift
        r = r0 + (r1 - r0) * t
        s += circ(cx + rnd.uniform(-1, 1), cy + rnd.uniform(-2, 2), r * rnd.uniform(0.85, 1.1), color, None)
    return f'<g opacity="{f(op)}">{s}</g>'


def crescent(cx, cy, r, color="#efe6c8", fat=0.85):
    """True crescent path (never a disk covered by a sky-colored disk)."""
    return path(f"M{f(cx)} {f(cy - r)} A{f(r)} {f(r)} 0 1 0 {f(cx + r)} {f(cy + r * 0.35)} "
                f"A{f(r * fat)} {f(r * fat)} 0 1 1 {f(cx)} {f(cy - r)} Z", color, None)


def stars(x, y, w, h, n, seed=7, color="#e9e4cf", size=1.3, fade_to_horizon=0.6):
    return stipple(x, y, w, h, n, color, size, 0.9, lambda u, v: 1 - v * fade_to_horizon, seed)


def sea(w, h, hz, top="#5a7a80", bottom="#2f4a52", dash="#86a2a6", glint=None, seed=21, density=1.0):
    """Flat sea below horizon hz: gradient body + rows of horizontal dashes whose spacing,
    length and thickness grow toward the viewer (Ware perspective without vanishing lines)."""
    rnd = random.Random(seed)
    o = rect(0, hz, w, h - hz, lingrad([(0, top), (1, bottom)]), None)
    k, y = 0, hz + 3.0
    while y < h + 10:
        n = int((int(w / 19) - (y - hz) * 0.12 + 8) * density)
        th = 0.8 + (y - hz) * 0.012
        for _ in range(max(2, n)):
            x = rnd.uniform(-20, w + 20)
            L = 4 + (y - hz) * 0.22 * rnd.uniform(0.5, 1.4)
            col = glint if (glint and y < hz + 40 and rnd.random() < 0.2) else dash
            o += rect(x, y, L, th, col, None, op=0.75)
        k += 1
        y = hz + 3 * (1.16 ** k)
    return o + line(0, hz, w, hz, INK, 1.2)


def reflection_column(x, y0, n=9, color="#ffd77a", w0=6, seed=1):
    """Vertical streak of a light on water (lit window, moon)."""
    rnd = random.Random(seed)
    s = ""
    for i in range(n):
        yy = y0 + 6 + i * 9 + i * i * 0.8
        wd = w0 + i * 1.5
        s += rect(x - wd / 2 + rnd.uniform(-3, 3), yy, wd, 2.2, color, None, op=max(0.15, 0.85 - i * 0.08))
    return s


def foam_dashes(x0, x1, y, seed=3, color="#f3efe4", gap=(4, 22), length=(10, 46)):
    """Waterline foam as BROKEN short dashes (a continuous serrated strip reads as teeth)."""
    rnd = random.Random(seed)
    s, x = "", x0
    while x < x1:
        L = rnd.uniform(*length)
        s += rect(x, y, L * 0.6, 1.8, color, None, op=0.9)
        x += L + rnd.uniform(*gap)
    return s


# =====================================================================
# architecture (elevation views - Ware draws buildings like blueprints)
# =====================================================================
def bricks(x, y, w, h, course=6.0, brick=18.0, base="#9e6a47", mortar=None, sw=0.7, seed=5, vary=0.12):
    """Running-bond brick field (clip it to the wall shape). Thin dark coursing lines on a
    flat base; a few bricks a shade off for life."""
    rnd = random.Random(seed)
    mortar = mortar or shade(base, 0.35)
    s = rect(x, y, w, h, base, None)
    rows = int(h / course) + 1
    for r in range(rows):
        yy = y + r * course
        off = 0 if r % 2 == 0 else brick / 2
        bx = x - off
        while bx < x + w:
            if rnd.random() < vary:
                s += rect(bx + 0.4, yy + 0.4, brick - 0.8, course - 0.8, shade(base, rnd.uniform(0.06, 0.14)), None)
            bx += brick
        s += line(x, yy, x + w, yy, mortar, sw)
        bx = x - off
        while bx < x + w:
            if bx > x:
                s += line(bx, yy, bx, yy + course, mortar, sw)
            bx += brick
    return s


def stone_courses(x, y, w, h, course=14.0, base="#8d8a83", seed=8, sw=1.0):
    """Ashlar/rubble stone for dark-fantasy walls: irregular block lengths, a few cracks."""
    rnd = random.Random(seed)
    mortar = shade(base, 0.38)
    s = rect(x, y, w, h, base, None)
    yy = y
    while yy < y + h:
        ch = course * rnd.uniform(0.85, 1.15)
        bx = x - rnd.uniform(0, 20)
        while bx < x + w:
            bw = course * rnd.uniform(1.4, 2.8)
            if rnd.random() < 0.18:
                s += rect(bx + 0.6, yy + 0.6, bw - 1.2, ch - 1.2, shade(base, rnd.uniform(0.05, 0.15)), None)
            if bx > x:
                s += line(bx, yy, bx, yy + ch, mortar, sw)
            if rnd.random() < 0.06:
                cx = bx + bw * 0.5
                s += path(f"M{f(cx)} {f(yy+1)} l{f(rnd.uniform(-3,3))} {f(ch*0.4)} l{f(rnd.uniform(-3,3))} {f(ch*0.4)}",
                          "none", mortar, sw * 0.8)
            bx += bw
        yy += ch
        s += line(x, yy, x + w, yy, mortar, sw)
    return s


def window(x, y, w, h, cols=2, rows=2, frame="#d5cba9", glass="#373639", lit=None, sw=1.6,
           sill=True, lintel=True, arch=False, reflect="#6a8290"):
    """Elevation window: frame, mullions, dark glass with one light diagonal reflection
    per pane (or flat warm fill if lit). arch=True gives a round head (greystones, chapels)."""
    s = ""
    if lintel:
        s += rect(x - 4, y - 6, w + 8, 6, frame, INK, sw * 0.8)
    if arch:
        r = w / 2
        d = f"M{f(x)} {f(y + h)} L{f(x)} {f(y + r)} A{f(r)} {f(r)} 0 0 1 {f(x + w)} {f(y + r)} L{f(x + w)} {f(y + h)} Z"
        s += path(d, frame, INK, sw)
        inset = 3
        d2 = (f"M{f(x + inset)} {f(y + h - inset)} L{f(x + inset)} {f(y + r)} A{f(r - inset)} {f(r - inset)} 0 0 1 "
              f"{f(x + w - inset)} {f(y + r)} L{f(x + w - inset)} {f(y + h - inset)} Z")
        s += path(d2, lit or glass, INK, sw * 0.7)
        s += line(x + w / 2, y + inset, x + w / 2, y + h - inset, frame, sw * 1.4)
        s += line(x + inset, y + r + (h - r) * 0.45, x + w - inset, y + r + (h - r) * 0.45, frame, sw * 1.4)
    else:
        s += rect(x, y, w, h, frame, INK, sw)
        inset = 2.5
        pw = (w - inset * 2) / cols
        ph = (h - inset * 2) / rows
        for c in range(cols):
            for r in range(rows):
                px, py = x + inset + c * pw + 1, y + inset + r * ph + 1
                s += rect(px, py, pw - 2, ph - 2, lit or glass, INK, sw * 0.6)
                if not lit:
                    s += line(px + pw * 0.2, py + ph * 0.85 - 2, px + pw * 0.7, py + ph * 0.25, reflect, sw * 0.8)
    if sill:
        s += rect(x - 3, y + h, w + 6, 4, frame, INK, sw * 0.8)
    return s


def rivet_row(x0, x1, y, step=9, r=1.9, fill="#4a4d53", stroke="#1f2124", sw=0.8):
    s, x = "", x0
    while x <= x1:
        s += circ(x, y, r, fill, stroke, sw)
        x += step
    return s


def railing(x0, x1, ybase, hgt=8, step=9, sw=1.1):
    s = line(x0, ybase - hgt, x1, ybase - hgt, INK, sw) + line(x0, ybase - hgt / 2, x1, ybase - hgt / 2, INK, sw * 0.7)
    x = x0
    while x <= x1 + 0.1:
        s += line(x, ybase, x, ybase - hgt, INK, sw * 0.9)
        x += step
    return s


def fence(x0, x1, y_top, y_bot, color="#706d65", board=6, sw=1.0):
    """Board fence: flat color, vertical board lines (Chicago alley fences)."""
    s = rect(x0, y_top, x1 - x0, y_bot - y_top, color, INK, sw * 1.2)
    x = x0 + board
    while x < x1:
        s += line(x, y_top, x, y_bot, shade(color, 0.3), sw * 0.7)
        x += board
    return s


def wrap_x(content, w, h):
    """Make a layer tile seamlessly: draws content at x-w, x, x+w and clips to [0, w].
    Anything crossing the right edge reappears on the left (and vice versa).
    Wrap ONLY the pieces that cross (or may cross) the edges: grass rows, fences, clouds,
    random scatter near the borders. Full-width rects/grain/specks and objects placed well
    inside the tile don't need it, and wrapping them triples their file size.
    Pattern: svg_doc(w, h, base + inner + wrap_x(edge_items, w, h))"""
    cp = clip(f'<rect x="0" y="0" width="{f(float(w))}" height="{f(float(h))}"/>')
    return g(tr(content, -w) + content + tr(content, w), cp)


def silhouette_skyline(w, base_y, color, seed=3, min_h=20, max_h=90, min_w=24, max_w=80, spires=0.0):
    """Far background: flat, OUTLINE-FREE blocks in an atmospheric tint (Ware's distant
    city). spires>0 adds gothic spires/towers for dark fantasy."""
    rnd = random.Random(seed)
    s, x = "", -10
    while x < w + 10:
        bw = rnd.uniform(min_w, max_w)
        bh = rnd.uniform(min_h, max_h)
        s += rect(x, base_y - bh, bw + 1, bh + 1, color, None)
        if rnd.random() < spires:
            sx = x + bw * rnd.uniform(0.3, 0.7)
            sh = bh * rnd.uniform(0.5, 1.2)
            s += poly([(sx - bw * 0.12, base_y - bh), (sx, base_y - bh - sh), (sx + bw * 0.12, base_y - bh)], color, None)
        x += bw
    return s


# =====================================================================
# comics grammar: panels, insets, links, lettering
# =====================================================================
def panel(x, y, w, h, inner, bg="#ffffff", border=4.2):
    """Clipped panel with thick ink border. inner is drawn in panel-local coords."""
    cp = clip(f'<rect x="{f(float(x))}" y="{f(float(y))}" width="{f(float(w))}" height="{f(float(h))}"/>')
    return (f'<g {cp}>' + rect(x, y, w, h, bg, None) +
            f'<g transform="translate({f(float(x))} {f(float(y))})">{inner}</g></g>' +
            rect(x, y, w, h, "none", INK, border))


def grid(x, y, w, rows, gutter=10):
    """Panel rects for a page. rows = [(height, [col_weights...]), ...] -> [[(x,y,w,h), ...], ...]"""
    out, yy = [], y
    for h, cols in rows:
        tot = sum(cols)
        avail = w - gutter * (len(cols) - 1)
        xx, row = x, []
        for c in cols:
            cw = avail * c / tot
            row.append((xx, yy, cw, h))
            xx += cw + gutter
        out.append(row)
        yy += h + gutter
    return out


def inset_circle(cx, cy, r, inner, bg="#edf5f7", sw=2.2):
    """Round inset (memory, detail, zoom). inner drawn centered on (0,0)."""
    cp = clip(f'<circle cx="{f(float(cx))}" cy="{f(float(cy))}" r="{f(float(r))}"/>')
    return (circ(cx, cy, r, bg, None) + f'<g {cp}><g transform="translate({f(float(cx))} {f(float(cy))})">{inner}</g></g>'
            + circ(cx, cy, r, "none", INK, sw))


def link(points, sw=1.6, end_ring=None, junctions=()):
    """Diagram connector: straight segments; optional ring around the target (x, y, r);
    junction dots where branches meet."""
    s = poly(points, "none", INK, sw, close=False)
    if end_ring:
        s += circ(*end_ring, "none", INK, sw)
    for jx, jy in junctions:
        s += circ(jx, jy, sw * 2.6, INK, None)
    return s


def arrow(x0, y0, x1, y1, sw=1.6, head=7):
    a = math.atan2(y1 - y0, x1 - x0)
    p1 = (x1 - math.cos(a - 0.45) * head, y1 - math.sin(a - 0.45) * head)
    p2 = (x1 - math.cos(a + 0.45) * head, y1 - math.sin(a + 0.45) * head)
    return line(x0, y0, x1, y1, INK, sw) + poly([p1, (x1, y1), p2], INK, INK, sw * 0.6)


def balloon(x, y, w, h, tail=(0, 18), sw=1.4, fill="#ffffff", squiggle=True):
    """Ware's small rectangular balloon with a wavy tail (a voice from off-panel)."""
    s = rect(x, y, w, h, fill, INK, sw, rx=2)
    tx, ty = x + w * 0.5, y + h
    if squiggle:
        d = f"M{f(tx)} {f(ty)} c 3 4 -3 6 0 9 c 3 3 -3 6 0 {f(tail[1] - 9)}"
    else:
        d = f"M{f(tx)} {f(ty)} l {f(tail[0])} {f(tail[1])}"
    return s + path(d, "none", INK, sw * 0.9)


# =====================================================================
# lettering -> paths (fonts are bundled; text survives any renderer)
# =====================================================================
_fonts = {}
FONTS = {"label": "Oswald", "hand": "PatrickHand", "title": "IMFellSC"}


def _font(name, wght=None):
    from fontTools.ttLib import TTFont
    k = (name, wght)
    if k not in _fonts:
        ft = TTFont(str(FONT_DIR / f"{name}.ttf"))
        gs = ft.getGlyphSet(location={"wght": wght}) if (wght and "fvar" in ft) else ft.getGlyphSet()
        _fonts[k] = (ft, gs, ft.getBestCmap(), ft["head"].unitsPerEm)
    return _fonts[k]


def _glyph(cmap, c):
    return cmap.get(ord(c)) or cmap.get(ord("?")) or ".notdef"


def text_width(name, t, size, sp=0, wght=None):
    ft, gs, cmap, upm = _font(name, wght)
    return sum(gs[_glyph(cmap, c)].width * size / upm + sp for c in t) - sp


def text_d(name, t, x, y, size, sp=0, anchor="start", wght=None, jitter=0, seed=0):
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    ft, gs, cmap, upm = _font(name, wght)
    s = size / upm
    tw = text_width(name, t, size, sp, wght)
    if anchor == "middle":
        x -= tw / 2
    elif anchor == "end":
        x -= tw
    rnd = random.Random(seed)
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}")
    cx = x
    for c in t:
        gn = _glyph(cmap, c)
        dy = (rnd.random() - 0.5) * 2 * jitter
        rot = (rnd.random() - 0.5) * jitter * 0.03
        tp = TransformPen(pen, (s * math.cos(rot), s * math.sin(rot), s * math.sin(rot), -s * math.cos(rot), cx, y + dy))
        gs[gn].draw(tp)
        cx += gs[gn].width * s + sp
    return pen.getCommands()


def text(name, t, x, y, size, fill=INK, sp=0, anchor="start", wght=None, op=None, jitter=0, seed=0,
         stroke=None, sw=0):
    """Lettering as outlined paths. name: 'Oswald' (labels/signage/SFX, wght 200-700),
    'PatrickHand' (handwriting), 'IMFellSC' (period/dark-fantasy titles)."""
    return path(text_d(name, t, x, y, size, sp, anchor, wght, jitter, seed), fill, stroke, sw, op)


def sfx(t, x, y, size=20, fill="#f4efe2", anchor="start", jitter=1.4, seed=5, wght=600, sp=1.0):
    """Sound effect lettering (KLATG, CHNGK, HMMMM): condensed caps, small, often white,
    sitting INSIDE the panel near the source, sometimes running off the edge."""
    return text("Oswald", t, x, y, size, fill, sp, anchor, wght, jitter=jitter, seed=seed)


# =====================================================================
# small finishing touches
# =====================================================================
def highlight_sliver(x, y, w, h, color="#ffffff", op=0.85):
    """Flat white specular sliver on glossy objects (glass, metal, lipstick case)."""
    return path(f"M{f(x)} {f(y + h)} L{f(x + w * 0.35)} {f(y)} L{f(x + w)} {f(y)} L{f(x + w * 0.65)} {f(y + h)} Z",
                color, None, op=op)


def cast_shadow(cx, cy, rx, ry, color="#1f1c1d", op=0.22):
    """Flat ground shadow under sprites/props (one ellipse, no blur)."""
    return ell(cx, cy, rx, ry, color, None, op=op)


def rust_streaks(x, y, n=4, length=40, spread=10, seed=1, color="#86573f", op=0.8):
    """Weathering that runs straight down from a fixture (hawsepipe, bolt, gutter)."""
    rnd = random.Random(seed)
    s = ""
    for _ in range(n):
        dx = rnd.uniform(-spread, spread)
        L = length * rnd.uniform(0.5, 1.1)
        s += path(f"M{f(x+dx-1.6)} {f(y)} L{f(x+dx+1.6)} {f(y)} L{f(x+dx+0.4)} {f(y+L)} Z", color, None, op=op)
    return s


def fit_curve(xs, ys, deg=2):
    """Polynomial through points -> callable (e.g. a hull sheer line, a sagging roof)."""
    c = np.polyfit(xs, ys, deg)
    return lambda x: float(np.polyval(c, x))
