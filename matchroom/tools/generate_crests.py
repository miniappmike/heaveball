"""Regenerate matchroom/assets/crests/*.webp from the club logos in docs/logos.

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
from PIL import Image

root = Path(__file__).resolve().parents[2]
logos, out = root / "docs" / "logos", root / "matchroom" / "assets" / "crests"
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
