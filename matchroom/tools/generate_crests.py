"""Regenerate matchroom/assets/crests/*.webp and marks/*.webp from the club logos in docs/logos.

Marks are the large logos shown without a background (pregame matchup, score
card, canvas score bar): each transparent logo cropped to its artwork, at most
300 px on its long side. Logos whose outer edge is mostly dark would vanish on
the dark site, so they get a thin light keyline around their outline.

Crests are the small round versions used on the field (and nowhere a mark fits):

The Matchroom shows crests in round badges, so each crest is fitted to a circle:
the smallest circle around the logo's artwork is centred on a square canvas and
scaled to fill it (192 px). Wide marks such as the Routers' UC then fill the badge
as fully as round ones. The badge is light, so a club whose logo is light-on-dark
uses its dark variant instead.

Needs numpy and Pillow. Run from the repository root:

  python3 matchroom/tools/generate_crests.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[2]
logos, out = root / "docs" / "logos", root / "matchroom" / "assets" / "crests"
marks = root / "matchroom" / "assets" / "marks"
MARK_SIZE, KEYLINE, KEYLINE_COLOR, DARK_EDGE = 300, 0.016, (233, 238, 235), 0.3
SIZE, MARGIN = 192, 0.02

# club id -> transparent logo file (without -transparent.png)
SOURCES = {
    "dorchester-dirts": "dorchester-dirts",
    "southie-dockers": "southie-dockers",
    "roxbury-iron": "roxbury-iron",
    "our-lady-of-the-harbor": "our-lady-of-the-harbor-dark",
    "muddy-river-hens": "muddy-river-hens",
    "charlestown-beacons": "charlestown-beacons",
    "st-anthonys-knights": "st-anthonys-knights",
    "copley-stacks": "copley-stacks",
    "uphams-corner-routers": "uphams-corner-routers",
    "brighton-hill": "brighton-hill",
}

out.mkdir(parents=True, exist_ok=True)
for club, source in SOURCES.items():
    logo = Image.open(logos / f"{source}-transparent.png").convert("RGBA")
    alpha = np.asarray(logo.getchannel("A")) > 8
    ys, xs = np.nonzero(alpha)
    pts = np.stack([xs, ys], 1).astype(float)
    # Smallest enclosing circle (Badoiu-Clarkson): step toward the farthest point.
    c = pts.mean(0)
    for i in range(1, 2000):
        far = pts[np.argmax(((pts - c) ** 2).sum(1))]
        c += (far - c) / (i + 1)
    r = np.sqrt(((pts - c) ** 2).sum(1)).max() * (1 + MARGIN)
    box = tuple(int(round(v)) for v in (c[0] - r, c[1] - r, c[0] + r, c[1] + r))
    side = box[2] - box[0]
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(logo, (-box[0], -box[1]))  # pastes with any out-of-image area left transparent
    crest = square.resize((SIZE, SIZE), Image.LANCZOS)
    crest.save(out / f"{club}.webp", "WEBP", quality=90, method=6)
    print(f"{club}: {(out / f'{club}.webp').stat().st_size / 1024:.1f} KB")


def needs_keyline(logo):
    """True when most of the logo's outermost few pixels are dark (relative luminance under 0.05)."""
    a = logo.getchannel("A").point(lambda v: 255 if v > 200 else 0)
    band = (np.asarray(a) > 0) & ~(np.asarray(a.filter(ImageFilter.MinFilter(9))) > 0)
    rgb = np.asarray(logo)[..., :3][band] / 255
    lin = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return np.mean(lin @ [0.2126, 0.7152, 0.0722] < 0.05) > DARK_EDGE


marks.mkdir(parents=True, exist_ok=True)
for club in SOURCES:
    # Marks use the club's real logo; only the round crest swaps in a dark variant.
    logo = Image.open(logos / f"{club}-transparent.png").convert("RGBA")
    box = logo.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    pad = round(max(box[2] - box[0], box[3] - box[1]) * (KEYLINE + 0.01))
    art = Image.new("RGBA", (box[2] - box[0] + 2 * pad, box[3] - box[1] + 2 * pad), (0, 0, 0, 0))
    art.paste(logo.crop(box), (pad, pad))
    keyline = needs_keyline(logo)
    if keyline:
        width = max(3, round(max(art.size) * KEYLINE)) | 1
        ring = art.getchannel("A").filter(ImageFilter.MaxFilter(width)).filter(ImageFilter.GaussianBlur(1))
        under = Image.new("RGBA", art.size, KEYLINE_COLOR + (0,))
        under.putalpha(ring)
        art = Image.alpha_composite(under, art)
    scale = MARK_SIZE / max(art.size)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
    art.save(marks / f"{club}.webp", "WEBP", quality=88, method=6)
    print(f"mark {club}: {art.width}x{art.height}{' keyline' if keyline else ''}, {(marks / f'{club}.webp').stat().st_size / 1024:.1f} KB")
