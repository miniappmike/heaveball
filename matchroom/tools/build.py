"""Build matchroom/dist from matchroom/src and matchroom/assets.

src/      hand-edited page (index.html), engine (match.js) and renderer (view.js)
assets/   field textures (fields/*.webp)
dist/     generated here; never edit by hand

The game scripts are inlined into dist/index.html so the page also runs in
previews that receive the HTML without its sibling files. The default field
texture is embedded too; the other fields load from dist/fields on first use.
"""
import base64
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src, assets, dist = root / "src", root / "assets", root / "dist"
DEFAULT_FIELD = "park-red"

if dist.exists():
    shutil.rmtree(dist)
(dist / "fields").mkdir(parents=True)

for texture in sorted((assets / "fields").glob("*.webp")):
    shutil.copy2(texture, dist / "fields" / texture.name)

embedded = {DEFAULT_FIELD: "data:image/webp;base64," + base64.b64encode(
    (assets / "fields" / f"{DEFAULT_FIELD}.webp").read_bytes()).decode()}
bundle = "const fieldImages=" + json.dumps(embedded) + ";\n"
bundle += (src / "match.js").read_text() + "\n" + (src / "view.js").read_text()

html = (src / "index.html").read_text()
tags = '<script src="match.js"></script><script src="view.js"></script>'
assert tags in html, "src/index.html must load match.js then view.js"
html = html.replace(tags, '<script id="game">(()=>{\n' + bundle + '\n})();</script>')
(dist / "index.html").write_text(html)

guide = (root / "summary.md").read_text().rstrip()
guide += f"\n\n## Build record\n\nBuilt {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC} from `src/` and `assets/`.\n"
(dist / "summary.md").write_text(guide)

size = sum(p.stat().st_size for p in dist.rglob("*") if p.is_file())
print(f"dist built: index.html {(dist / 'index.html').stat().st_size / 1024:.0f} KB, total {size / 1024:.0f} KB")
