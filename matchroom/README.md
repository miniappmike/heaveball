# Heaveball Matchroom

This directory is the source for the live [Heaveball Matchroom](https://heaveball-matchroom.hardyburl128.chatgpt.site/). The checked-in files match Sites Version 43, commit `4f7011f473272dd028a5c156434a31e2491b584f`.

## Source layout

- `dist/index.html` contains the Matchroom page, styles, accessibility structure, and an embedded copy of the game for static previews.
- `dist/match-*.js` is the autonomous match engine: rules, player generation, strategies, ball physics, movement, contact, scoring, statistics, and restarts.
- `dist/view-*.js` renders the field and connects the engine to the pregame handbook, playback controls, play logs, scouting, halftime screen, and box scores.
- `dist/dirt.png` is the field texture used for the no-possession strips.
- `summary.md` is the authoritative contributor guide. `dist/summary.md` and `dist/summary.docx` are its generated release copies.
- `build.py` hashes the JavaScript filenames, refreshes the embedded bundle, regenerates the guide copies, and records the build.
- `.openai/hosting.json` declares the static Sites output directory and the existing Matchroom project.

## Run locally

No package installation is required. From this directory:

```bash
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`.

## Build a release

The build requires Python 3 and Pandoc:

```bash
python build.py
```

Run the gameplay checks appropriate to a change before publishing. Every release should update `summary.md`, regenerate both guide formats, commit the exact deployed source, and keep the public repository synchronized with the live Matchroom.
