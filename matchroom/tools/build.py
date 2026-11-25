"""Build matchroom/dist from matchroom/src and matchroom/assets.

src/      hand-edited page (index.html), engine (match.js) and renderer (view.js)
assets/   field textures (fields/*.webp), surround textures (surrounds/*.webp)
          and club crests and marks (crests/*.webp, marks/*.webp, from tools/generate_crests.py)
dist/     generated here; never edit by hand

The game scripts are inlined into dist/index.html so the page also runs in
previews that receive the HTML without its sibling files. The default field
texture is embedded too; the other fields load from dist/fields on first use.
Club crests and marks are small, so all of them are embedded.
"""
import base64
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
src, assets, dist = root / "src", root / "assets", root / "dist"
DEFAULT_FIELD = "park-red"
ANIMATION_REEL = "heaveball-latest-animation-preview.html"

if dist.exists():
    shutil.rmtree(dist)
(dist / "fields").mkdir(parents=True)
(dist / "surrounds").mkdir()
DEFAULT_SURROUND = DEFAULT_FIELD.split("-")[0]

for texture in sorted((assets / "fields").glob("*.webp")):
    shutil.copy2(texture, dist / "fields" / texture.name)

for texture in sorted((assets / "surrounds").glob("*.webp")):
    shutil.copy2(texture, dist / "surrounds" / texture.name)

def data_uri(path):
    return "data:image/webp;base64," + base64.b64encode(path.read_bytes()).decode()

embedded = {DEFAULT_FIELD: data_uri(assets / "fields" / f"{DEFAULT_FIELD}.webp")}
surrounds = {DEFAULT_SURROUND: data_uri(assets / "surrounds" / f"{DEFAULT_SURROUND}.webp")}
bundle = "const fieldImages=" + json.dumps(embedded) + ";\n"
bundle += "const surroundImages=" + json.dumps(surrounds) + ";\n"
crests = {path.stem: data_uri(path) for path in sorted((assets / "crests").glob("*.webp"))}
bundle += "const crestImages=" + json.dumps(crests) + ";\n"
marks = {path.stem: data_uri(path) for path in sorted((assets / "marks").glob("*.webp"))}
bundle += "const markImages=" + json.dumps(marks) + ";\n"
bundle += (src / "match.js").read_text() + "\n" + (src / "view.js").read_text()

html = (src / "index.html").read_text()
tags = '<script src="match.js"></script><script src="view.js"></script>'
assert tags in html, "src/index.html must load match.js then view.js"
html = html.replace(tags, '<script id="game">(()=>{\n' + bundle + '\n})();</script>')
(dist / "index.html").write_text(html)

handoff_path = root.parent / "heaveball-animation-preview-handoff.zip"
if not handoff_path.is_file():
    handoff_path = root / handoff_path.name  # Standalone Matchroom Site checkout.
with ZipFile(handoff_path) as handoff:
    (dist / ANIMATION_REEL).write_bytes(handoff.read(ANIMATION_REEL))

guide = (root / "summary.md").read_text().rstrip()
guide += f"\n\n## Build record\n\nBuilt {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC} from `src/` and `assets/`.\n"
(dist / "summary.md").write_text(guide)

size = sum(p.stat().st_size for p in dist.rglob("*") if p.is_file())
print(f"dist built: index.html {(dist / 'index.html').stat().st_size / 1024:.0f} KB, total {size / 1024:.0f} KB")
