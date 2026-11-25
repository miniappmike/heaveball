"""Make a transparent PNG and a traced SVG from a flat-color logo.

Usage: python3 -I docs/logos/make_variants.py input.png out_transparent.png out.svg "Club Name"
Needs only Pillow and numpy. Edit PALETTE to the logo's flat colours first
(white must stay first), and adjust the layer list in main() if the logo's
colours stack differently from the Southie Dockers boat.
"""
import sys
from collections import defaultdict

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PALETTE = {  # name: RGB, sampled from the logo
    "white": (255, 255, 255),
    "black": (31, 27, 21),
    "gray": (77, 80, 89),
    "blue": (1, 54, 165),
}


def background_mask(rgb):
    """True where a pixel is white-ish AND connected to the image border."""
    h, w, _ = rgb.shape
    whiteish = (rgb.min(axis=2) > 200).astype(np.uint8) * 255
    m = Image.fromarray(whiteish, "L").copy()  # fromarray images can be read-only
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if m.getpixel(xy) == 255:
            ImageDraw.floodfill(m, xy, 128)
    return np.asarray(m) == 128


def labels(rgb):
    names = list(PALETTE)
    cols = np.array([PALETTE[n] for n in names], float)
    d = ((rgb[:, :, None, :] - cols[None, None]) ** 2).sum(-1)
    return names, d.argmin(-1)


def transparent_png(rgb, bg):
    """Alpha 0 on the outside background, unmixed alpha on the anti-aliased rim."""
    names, lab = labels(rgb)
    cols = np.array([PALETTE[n] for n in names], float)
    # Rim = background pixels that are not pure white, plus foreground pixels touching background.
    bgimg = Image.fromarray(bg.astype(np.uint8) * 255)
    near_bg = np.asarray(bgimg.filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(bg, 0.0, 1.0)
    out = rgb.copy()
    rim = near_bg
    # For rim pixels, the foreground colour is the nearest non-white palette colour.
    fg_cols = cols[1:]
    d = ((rgb[:, :, None, :] - fg_cols[None, None]) ** 2).sum(-1)
    f = fg_cols[d.argmin(-1)]
    with np.errstate(divide="ignore", invalid="ignore"):
        a = ((255.0 - rgb) / np.maximum(255.0 - f, 1)).max(-1)
    a = np.clip(a, 0, 1)
    alpha = np.where(rim, a, alpha)
    out = np.where(rim[..., None], f, out)
    rgba = np.dstack([out, alpha * 255]).round().clip(0, 255).astype(np.uint8)
    return rgba


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


def main(src, out_png, out_svg, title):
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(float)
    h, w, _ = rgb.shape
    bg = background_mask(rgb)
    Image.fromarray(transparent_png(rgb, bg), "RGBA").save(out_png, optimize=True)

    names, lab = labels(rgb)
    is_ = lambda n: lab == names.index(n)
    fg = ~bg
    windows = is_("white") & fg          # enclosed whites stay white
    boat = (is_("black") | is_("gray") | windows) & fg
    layers = [
        ("#0136a5", is_("blue") & fg),
        ("#1f1b15", boat),
        ("#4d5059", is_("gray") & fg),
        ("#ffffff", windows),
    ]
    # crop to content with a small margin so the viewBox hugs the logo
    ys, xs = np.nonzero(fg)
    m = 8
    x0, y0 = max(xs.min() - m, 0), max(ys.min() - m, 0)
    x1, y1 = min(xs.max() + m, w), min(ys.max() + m, h)
    paths = []
    for colour, mask in layers:
        d = path_d(mask)
        if d:
            paths.append(f'<path fill="{colour}" fill-rule="evenodd" d="{d}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}">'
           f'<title>{title}</title>' + "".join(paths) + "</svg>\n")
    open(out_svg, "w").write(svg)
    print("svg bytes", len(svg), "viewBox", x0, y0, x1 - x0, y1 - y0)


if __name__ == "__main__":
    main(*sys.argv[1:5])
