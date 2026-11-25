"""Recolour a logo's transparent PNG and SVG, e.g. a dark version for light backgrounds.

  python3 -I docs/logos/recolor.py docs/logos/our-lady-of-the-harbor \
    docs/logos/our-lady-of-the-harbor-dark feebff=141b26 00e0ff=00e0ff

reads BASE-transparent.png and BASE.svg and writes OUT-transparent.png and
OUT.svg. Every colour of the logo must be listed, mapped to itself if it stays,
with the logo's main colour first.
In the PNG, each pixel is a soft blend of the new colours, weighted by how close
it is to each old colour, so anti-aliased seams between colours stay smooth. Pixels within 2 px of
the edge take the colour of the solid pixels next to them. Alpha is unchanged.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter


def hex_rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def main(base, out, *pairs):
    mapping = [p.split("=") for p in pairs]
    old = np.array([hex_rgb(a) for a, _ in mapping], float)
    new = np.array([hex_rgb(b) for _, b in mapping], float)

    rgba = np.asarray(Image.open(base + "-transparent.png").convert("RGBA")).astype(float)
    rgb, alpha = rgba[..., :3], rgba[..., 3:]
    d2 = ((rgb[:, :, None, :] - old[None, None]) ** 2).sum(-1)
    w = np.exp(-(d2 - d2.min(-1, keepdims=True)) / (2 * 40.0 ** 2))
    w /= w.sum(-1, keepdims=True)
    recoloured = (w[..., None] * new[None, None]).sum(2)
    # Edge pixels (partly transparent) had the background unmixed out of them,
    # which skews their colour, so give each one the colour of the solid
    # pixels next to it instead.
    solid = alpha[..., 0] >= 250
    # interior = solid pixels at least 2 px from any see-through pixel
    opaque = np.asarray(Image.fromarray(solid.astype(np.uint8) * 255).filter(ImageFilter.MinFilter(5))) > 0
    nearest = d2.argmin(-1)
    edge = ~opaque & (alpha[..., 0] > 0)
    picked = np.full(nearest.shape, -1)
    for radius in (3, 5, 9, 15):
        for k in range(len(new)):
            near_k = np.asarray(Image.fromarray(((nearest == k) & opaque).astype(np.uint8) * 255)
                                .filter(ImageFilter.MaxFilter(radius))) > 0
            picked = np.where(edge & (picked < 0) & near_k, k, picked)
    # thin tips with no interior nearby fall back to the first (main) colour
    recoloured = np.where(edge[..., None], new[np.maximum(picked, 0)], recoloured)
    Image.fromarray(np.dstack([recoloured, alpha]).round().clip(0, 255).astype(np.uint8), "RGBA") \
        .save(out + "-transparent.png", optimize=True)

    svg = open(base + ".svg").read()
    for a, b in mapping:  # two passes via placeholders so swaps don't collide
        svg = svg.replace(f'fill="#{a.lstrip("#")}"', f'fill="@@{b.lstrip("#")}"')
    open(out + ".svg", "w").write(svg.replace('fill="@@', 'fill="#'))


if __name__ == "__main__":
    main(*sys.argv[1:])
