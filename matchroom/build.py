"""Build the static matchroom assets and refresh the linked build summary."""
import base64
import re
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent
dist = root / "dist"
page = dist / "index.html"
html = page.read_text()
for prefix in ("match", "view"):
    source, = dist.glob(f"{prefix}-*.js")
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:10]
    name = f"{prefix}-{digest}.js"
    html = html.replace(source.name, name)
    source.rename(dist / name)
# Embedded previews may receive the entry HTML without its sibling resources.
bundle = "\n".join(next(dist.glob(f"{prefix}-*.js")).read_text() for prefix in ("match", "view"))
texture = base64.b64encode((dist / "dirt.png").read_bytes()).decode()
import json
field_images = {p.stem: base64.b64encode(p.read_bytes()).decode() for p in (dist / "fields").glob("*.jpg")}
bundle = bundle.replace("'fields/'+template.id+'.jpg'", "'data:image/jpeg;base64,'+fieldImages[template.id]")
bundle = "const fieldImages=" + json.dumps(field_images) + ";\n" + bundle
bundle = bundle.replace('"dirt.png"', '"data:image/png;base64,' + texture + '"')
inline = '<script id="embedded-game">(()=>{\n' + bundle + '\n})();</script>'
html = re.sub(r'<script id="embedded-game">.*?</script>', '', html, flags=re.S)
html = html.replace('<script src=', inline + '<script src=', 1)
page.write_text(html)
assets = sorted(p.name for p in dist.glob("*.js"))
summary_path = root / "summary.md"
scope = summary_path.read_text().split("\n## Build record\n")[0].rstrip()
summary = scope + "\n\n## Build record\n\n"
summary += f"Built {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC}.\n\n"
summary += "\n".join("- " + name for name in assets) + "\n"
(root / "summary.md").write_text(summary)
(dist / "summary.md").write_text(summary)

subprocess.run(["pandoc", str(summary_path), "--from=gfm", "--to=docx", "-o", str(dist / "summary.docx")], check=True)
