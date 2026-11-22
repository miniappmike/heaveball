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

## Deployment and collaboration

The live Matchroom is published from GitHub Pages at <https://miniappmike.github.io/heaveball/>. The workflow in `.github/workflows/pages.yml` deploys `matchroom/dist` whenever it changes on `main`, usually within two minutes. It publishes `dist` exactly as committed and does not run `build.py`. The older chatgpt.site deployment changes only when someone republishes it manually.

Two AI agents work on this repository: ChatGPT/Codex and Claude. Both follow the same rules:

1. `main` is the single source of truth. What is on `main` is live.
2. Start every change from the latest `main`. The other agent may have changed files since you last read them.
3. Work on your own branch (`codex/...` or `claude/...`), never directly on `main`.
4. Run `python build.py` before committing, and commit the regenerated `dist` files.
5. Update `summary.md` with what changed.
6. Open a pull request into `main`. The owner reviews and merges it, and the merge triggers the deploy.

Merge one agent's pull request at a time. If both branches touch the same files, especially `dist/index.html` or the `match-*.js` and `view-*.js` bundles, rebase the second branch on the latest `main` and rebuild before merging. Note any renamed or restructured files in `summary.md`.
