# Heaveball Matchroom

This directory is the source for the live [Heaveball Matchroom](https://heaveball-matchroom.hardyburl128.chatgpt.site/). 

## Source layout

- `src/index.html` is the Matchroom page: layout, styles, accessibility structure and the How to play guide.
- `src/match.js` is the autonomous match engine: rules, player generation, strategies, ball physics, movement, contact, scoring, statistics and restarts.
- `src/view.js` renders the field, markings, players and call popups, and connects the engine to the pregame screen, playback controls, play log, scouting, halftime screen and box scores.
- `assets/fields/*.webp` are the field textures. Field markings are not part of the textures; `view.js` draws them as vector paths so they stay sharp.
- `tools/build.py` generates `dist/` from `src/` and `assets/`.
- `tools/generate_fields.py` regenerates the field textures (needs `numpy` and `Pillow`). It samples colors from the original artwork in `tools/field-palettes/`.
- `dist/` is generated. Never edit it by hand. It holds `index.html` with the game inlined and the default field embedded, the other field textures in `dist/fields/`, and `summary.md` with a build record.
- `summary.md` is the authoritative contributor guide.
- `.openai/hosting.json` declares the static Sites output directory and the existing Matchroom project.

## Run locally

No package installation is required. From this directory:

```bash
python3 tools/build.py
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`.

## Build a release

The build needs only Python 3:

```bash
python3 tools/build.py
```

Run the gameplay checks appropriate to a change before publishing. Every release should update `summary.md`, rebuild `dist`, commit the exact deployed files, and keep the public repository synchronized with the live Matchroom.

## Deployment and collaboration

The live Matchroom is published from GitHub Pages at <https://miniappmike.github.io/heaveball/>. The workflow in `.github/workflows/pages.yml` deploys `matchroom/dist` whenever it changes on `main`, usually within two minutes. It rebuilds `dist` from `src/` and `assets/`, stops if the result differs from the committed `dist`, and then publishes `dist` exactly as committed. The [GPT test site](https://heaveball-matchroom.hardyburl128.chatgpt.site/) runs the latest Codex Matchroom PR build for review. When Codex opens or updates a Matchroom PR, publish its built files there and include the test URL in the handoff. The owner can test that build before merging it to GitHub Pages.

Two AI agents work on this repository: ChatGPT/Codex and Claude. Both follow the same rules:

1. `main` is the single source of truth. What is on `main` is live.
2. Start every change from the latest `main`. The other agent may have changed files since you last read them.
3. Work on your own branch (`codex/...` or `claude/...`), never directly on `main`.
4. Edit `src/` and `assets/`, run `python3 tools/build.py` before committing, and commit the regenerated `dist` files.
5. Update `summary.md` with what changed.
6. Open a pull request into `main`. The owner reviews and merges it, and the merge triggers the deploy.

Merge one agent's pull request at a time. If both branches touch the same files, especially `src/match.js`, `src/view.js` or `src/index.html`, rebase the second branch on the latest `main` and rebuild before merging. Note any renamed or restructured files in `summary.md`.
