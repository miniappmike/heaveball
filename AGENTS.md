# Agent instructions

Read [`matchroom/README.md`](matchroom/README.md) for the shared rules between Codex and Claude, and [`docs/codex-handoff-restructure.md`](docs/codex-handoff-restructure.md) for the 2026-11-23 layout change.

- Edit Matchroom source in `matchroom/src/` and textures in `matchroom/assets/`. Never edit `matchroom/dist/` by hand.
- Run `python3 matchroom/tools/build.py` and commit the regenerated `dist/` with your change. CI fails the deploy if `dist/` does not match a fresh build.
- Update `matchroom/summary.md` with what changed.
- Sport documents and reference images live in `docs/`.
