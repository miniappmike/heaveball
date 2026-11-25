"""Make a transparent PNG and a traced SVG from a flat-color logo.

Needs only Pillow and numpy. The background colour is the median of the image's
edge pixels. Pass the logo's flat colours with --colors and say how to stack them
into SVG layers with --layer FILL=NAMES (drawn in order, NAMES joined by +).
The special name "holes" means background-coloured pixels enclosed by the
logo, such as the Dockers' windows.

  python3 -I docs/logos/make_variants.py docs/logos/southie-dockers.png \
    docs/logos/southie-dockers-transparent.png docs/logos/southie-dockers.svg \
    "Southie Dockers" --colors black=1f1b15,gray=4d5059,blue=0136a5 \
    --layer 0136a5=blue --layer 1f1b15=black+gray+holes \
    --layer 4d5059=gray --layer ffffff=holes

  python3 -I docs/logos/make_variants.py docs/logos/dorchester-dirts.png \
    docs/logos/dorchester-dirts-transparent.png docs/logos/dorchester-dirts.svg \
    "Dorchester Dirts" --colors brown=3a1003 --layer 3a1003=brown --clear-holes

--clear-holes makes enclosed background (the inside of the D) transparent too.
"""
import argparse
from collections import defaultdict

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BG_TOLERANCE = 55  # max per-channel difference from the background colour


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def background_mask(rgb, bgcol, include_enclosed=False):
    """True where a pixel is background-coloured and, unless include_enclosed,
    connected to the image border."""
    h, w, _ = rgb.shape
    near = np.abs(rgb - np.array(bgcol, float)).max(-1) < BG_TOLERANCE
    if include_enclosed:
        return near
    m = Image.fromarray(near.astype(np.uint8) * 255, "L").copy()  # fromarray images can be read-only
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if m.getpixel(xy) == 255:
            ImageDraw.floodfill(m, xy, 128)
    return np.asarray(m) == 128


def labels(rgb, palette):
    names = list(palette)
    cols = np.array([palette[n] for n in names], float)
    d = ((rgb[:, :, None, :] - cols[None, None]) ** 2).sum(-1)
    return names, d.argmin(-1)


def transparent_png(rgb, bg, palette):
    """Alpha 0 on the background, unmixed alpha on the anti-aliased rim.
    palette's first entry is the background colour."""
    cols = np.array(list(palette.values()), float)
    bgcol = cols[0]
    near_bg = np.asarray(Image.fromarray(bg.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(bg, 0.0, 1.0)
    # On the rim, the foreground colour is the nearest non-background palette colour.
    fg_cols = cols[1:]
    d = ((rgb[:, :, None, :] - fg_cols[None, None]) ** 2).sum(-1)
    f = fg_cols[d.argmin(-1)]
    a = (np.abs(rgb - bgcol) / np.maximum(np.abs(f - bgcol), 1)).max(-1)
    alpha = np.where(near_bg, np.clip(a, 0, 1), alpha)
    out = np.where(near_bg[..., None], f, rgb)
    return np.dstack([out, alpha * 255]).round().clip(0, 255).astype(np.uint8)


# ---------- marching-squares tracer ----------

def contours(mask_float, level=0.5):
    """Closed contour loops of a soft mask (values 0..1), as lists of (x, y)."""
    v = np.pad(mask_float, 1)  # zero border closes every loop
    h, w = v.shape
    a, b = v[:-1, :-1], v[:-1, 1:]
    c, d = v[1:, 1:], v[1:, :-1]
    case = ((a > level) * 8 + (b > level) * 4 + (c > level) * 2 + (d > level) * 1)
    ys, xs = np.nonzero((case != 0) & (case != 15))

    def pt(key):
        kind, y, x = key
        if kind == "h":  # between (y,x) and (y,x+1)
            p, q = v[y, x], v[y, x + 1]
            t = (level - p) / (q - p) if q != p else 0.5
            return (x + t - 1, y - 1)
        p, q = v[y, x], v[y + 1, x]
        t = (level - p) / (q - p) if q != p else 0.5
        return (x - 1, y + t - 1)

    T = lambda y, x: ("h", y, x)
    B = lambda y, x: ("h", y + 1, x)
    L = lambda y, x: ("v", y, x)
    R = lambda y, x: ("v", y, x + 1)
    table = {
        1: [(L, B)], 2: [(B, R)], 3: [(L, R)], 4: [(T, R)], 6: [(T, B)],
        7: [(L, T)], 8: [(L, T)], 9: [(T, B)], 11: [(T, R)], 12: [(L, R)],
        13: [(B, R)], 14: [(L, B)],
    }
    adj = defaultdict(list)
    for y, x in zip(ys.tolist(), xs.tolist()):
        k = int(case[y, x])
        if k in (5, 10):
            centre = (v[y, x] + v[y, x + 1] + v[y + 1, x] + v[y + 1, x + 1]) / 4 > level
            if (k == 5) == centre:
                segs = [(L, T), (B, R)]
            else:
                segs = [(L, B), (T, R)]
        else:
            segs = table[k]
        for e1, e2 in segs:
            k1, k2 = e1(y, x), e2(y, x)
            adj[k1].append(k2)
            adj[k2].append(k1)
    seen, loops = set(), []
    for start in adj:
        if start in seen:
            continue
        loop, prev, cur = [], None, start
        while cur not in seen:
            seen.add(cur)
            loop.append(pt(cur))
            nxt = [n for n in adj[cur] if n != prev and n not in seen]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
        if len(loop) >= 8:
            loops.append(loop)
    return loops


def rdp(points, eps):
    pts = np.asarray(points, float)
    if len(pts) < 3:
        return pts
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        p, q = pts[i], pts[j]
        seg = q - p
        n = np.hypot(*seg)
        sub = pts[i + 1:j]
        if n == 0:
            dist = np.hypot(*(sub - p).T)
        else:
            dist = np.abs(seg[0] * (sub[:, 1] - p[1]) - seg[1] * (sub[:, 0] - p[0])) / n
        k = dist.argmax()
        if dist[k] > eps:
            m = i + 1 + k
            keep[m] = True
            stack += [(i, m), (m, j)]
    return pts[keep]


def path_d(mask, eps=0.6, min_area=30):
    soft = np.asarray(
        Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),
        float) / 255
    parts = []
    for loop in contours(soft):
        # split the loop in half so RDP has two anchors, then simplify
        half = len(loop) // 2
        s = np.vstack([rdp(loop[:half + 1], eps)[:-1], rdp(loop[half:] + loop[:1], eps)[:-1]])
        x, y = s[:, 0], s[:, 1]
        area = abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1))) / 2
        if area < min_area:
            continue
        pts = " ".join(f"{px:.1f} {py:.1f}" for px, py in s)
        parts.append("M" + pts.replace(" ", ",", 1) + "Z")
    return "".join(parts).replace(".0 ", " ").replace(".0Z", "Z").replace(".0,", ",")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("out_png")
    ap.add_argument("out_svg")
    ap.add_argument("title")
    ap.add_argument("--colors", required=True, help="name=hex,name=hex")
    ap.add_argument("--layer", action="append", required=True, help="FILL=name+name (repeatable)")
    ap.add_argument("--clear-holes", action="store_true")
    args = ap.parse_args()

    rgb = np.asarray(Image.open(args.src).convert("RGB")).astype(float)
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bgcol = tuple(int(v) for v in np.median(border, axis=0))
    palette = {"bg": bgcol}
    for item in args.colors.split(","):
        name, hx = item.split("=")
        palette[name.strip()] = hex_rgb(hx)

    outside = background_mask(rgb, bgcol)
    bg = background_mask(rgb, bgcol, include_enclosed=True) if args.clear_holes else outside
    Image.fromarray(transparent_png(rgb, bg, palette), "RGBA").save(args.out_png, optimize=True)

    names, lab = labels(rgb, palette)
    fg = ~outside
    masks = {n: (lab == names.index(n)) & fg for n in names if n != "bg"}
    masks["holes"] = (lab == names.index("bg")) & fg
    ys, xs = np.nonzero(~bg)
    m = 8
    x0, y0 = max(xs.min() - m, 0), max(ys.min() - m, 0)
    x1, y1 = min(xs.max() + m, w), min(ys.max() + m, h)
    paths = []
    for spec in args.layer:
        fill, parts = spec.split("=")
        mask = np.zeros_like(fg)
        for n in parts.split("+"):
            mask |= masks[n]
        d = path_d(mask)
        if d:
            paths.append(f'<path fill="#{fill.lstrip("#")}" fill-rule="evenodd" d="{d}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}">'
           f'<title>{args.title}</title>' + "".join(paths) + "</svg>\n")
    open(args.out_svg, "w").write(svg)
    print("svg bytes", len(svg), "viewBox", x0, y0, x1 - x0, y1 - y0)


if __name__ == "__main__":
    main()
