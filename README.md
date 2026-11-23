# Heaveball

Heaveball is a fictional eight-a-side sport centered on a shared scoring ring. This repository contains the rules, coaching material, player-generation specifications and visual references in [`docs/`](docs), and the browser Matchroom simulation in [`matchroom/`](matchroom/README.md).

## Matchroom source

The complete source for the live [Heaveball Matchroom](https://heaveball-matchroom.hardyburl128.chatgpt.site/) is available in [`matchroom/`](matchroom/README.md). Hand-edited source lives in `matchroom/src/`, field textures in `matchroom/assets/`, build tools in `matchroom/tools/`, and the generated site in `matchroom/dist/`.

The Matchroom is intentionally buildless at runtime: the deployed game is ordinary HTML and JavaScript, so its gameplay logic can be read directly in the repository.
