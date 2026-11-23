"""Generate the tileable surround textures in assets/surrounds (needs numpy and Pillow).

park.webp  natural park grass: uneven color, clumps, blades, a few worn soil patches
turf.webp  all-weather synthetic turf: fine fibers, brushed grain, rubber infill, roll seams

Each tile covers TILE yards square and wraps seamlessly; view.js repeats it around the field.
"""
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'surrounds'
N, TILE = 768, 12  # pixels, yards


def periodic_noise(n, scale, seed, power=2.0):
    """Wrap-around noise: white noise filtered in frequency space, normalised to mean 0, std 1."""
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((n, n)))
    k = np.hypot(*np.meshgrid(np.fft.fftfreq(n), np.fft.fftfreq(n)))
    f *= np.exp(-(k * scale) ** power)
    a = np.real(np.fft.ifft2(f))
    return (a - a.mean()) / (a.std() + 1e-9)


def strokes(img, count, seed, length, width, colors, angle_spread, base_angle=0.0):
    """Draw short blade strokes that wrap across the tile edges."""
    rng = np.random.default_rng(seed)
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(count):
        x, y = rng.random(2) * N
        a = base_angle + rng.normal(0, angle_spread)
        L = length * (.5 + rng.random())
        dx, dy = np.cos(a) * L, np.sin(a) * L
        c = colors[rng.integers(len(colors))]
        alpha = int(rng.uniform(.35, .85) * 255)
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                x0, y0 = x + ox, y + oy
                if -L <= x0 <= N + L and -L <= y0 <= N + L:
                    d.line([(x0, y0), (x0 + dx, y0 + dy)], fill=(*c, alpha), width=width)


def park():
    broad = periodic_noise(N, 90, 1)
    mid = periodic_noise(N, 22, 2)
    fine = periodic_noise(N, 2.5, 3)
    dry = np.clip(periodic_noise(N, 60, 4) - .6, 0, None)  # sun-dried, yellower areas
    base = np.array([88, 138, 52], float)
    img = base + broad[..., None] * [9, 12, 6] + mid[..., None] * [6, 8, 4] + fine[..., None] * [7, 9, 5]
    img += dry[..., None] * [34, 22, -2]
    # Dark clover / lush clumps.
    clumps = np.clip(periodic_noise(N, 9, 5) - 1.4, 0, None)
    img -= clumps[..., None] * [26, 18, 16]
    # A few worn patches showing soil.
    worn = np.clip(periodic_noise(N, 40, 6) - 2.1, 0, 1)
    worn = np.clip(worn * 3, 0, 1)[..., None] * (0.6 + 0.4 * (fine[..., None] > 0))
    img = img * (1 - worn) + np.array([128, 108, 74]) * worn + fine[..., None] * 6 * worn
    im = Image.fromarray(img.clip(0, 255).astype('uint8')).convert('RGBA')
    blades = [(62, 104, 38), (74, 122, 44), (118, 160, 66), (140, 172, 80), (48, 86, 32)]
    strokes(im, 26000, 7, 7, 2, blades, 1.1, -np.pi / 2)
    strokes(im, 9000, 8, 5, 1, [(170, 196, 104), (150, 186, 92)], 1.0, -np.pi / 2)
    im = im.convert('RGB').filter(ImageFilter.GaussianBlur(.6))
    # Soft overall light variation so the repeat is less visible.
    a = np.asarray(im).astype(float) * (1 + .05 * broad[..., None])
    return Image.fromarray(a.clip(0, 255).astype('uint8'))


def turf():
    rng = np.random.default_rng(11)
    base = np.array([66, 124, 72], float)
    broad = periodic_noise(N, 70, 12)
    fiber = periodic_noise(N, 1.2, 13)
    # Brushed grain: noise stretched along the roll (pile laid one way).
    grain = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((N, N))) *
                                 np.exp(-((np.fft.fftfreq(N)[:, None] * 40) ** 2 +
                                          (np.fft.fftfreq(N)[None, :] * 2) ** 2))))
    grain = (grain - grain.mean()) / grain.std()
    img = base + broad[..., None] * [2, 3, 2] + fiber[..., None] * [6, 10, 6] + grain[..., None] * [5, 8, 5]
    # Turf is laid in rolls about 4 yards wide; seams show as faint darker lines.
    x = np.arange(N) / N * TILE
    seam = np.exp(-((x % 4) - 0) ** 2 / .002) + np.exp(-((x % 4) - 4) ** 2 / .002)
    img -= seam[None, :, None] * [10, 16, 10]
    # Alternate rolls catch the light slightly differently.
    roll = (np.floor(x / 4) % 2)[None, :, None]
    img += roll * [2, 4, 2]
    # Black rubber infill and a few lighter sand grains.
    speck = rng.random((N, N))
    img[speck < .05] = img[speck < .05] * .55 + np.array([20, 24, 22]) * .45
    img[speck > .992] = img[speck > .992] * .6 + np.array([170, 170, 150]) * .4
    im = Image.fromarray(img.clip(0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(.45))
    return im


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    park().save(OUT / 'park.webp', quality=82, method=6)
    turf().save(OUT / 'turf.webp', quality=82, method=6)
    for f in sorted(OUT.glob('*.webp')):
        print(f.name, f.stat().st_size // 1024, 'KB')
