# AGENTS.md

## Overview
Vanilla HTML5 Canvas clone of Asteroids. No framework, no bundler, no dependencies, no package.json. All game logic lives in a single file: `game.js` (loaded via a plain `<script>` tag in `index.html`).

## Running
- Open `index.html` directly in a browser, or `npx serve .` then visit `http://localhost:3000`.
- There is **no build, test, lint, or typecheck step**. Verification is manual in the browser.

## Architecture
- `game.js` is one global scope, `'use strict'`, ES6 classes: `Bullet`, `Asteroid`, `Ship`, `Particle`.
- Entrypoint: `initGame()` then `requestAnimationFrame(loop)` at the bottom of the file. `loop` computes `dt` (clamped to 0.05s) and calls `update(dt)` then `draw()`.
- Game state globals: `state` is `'playing' | 'dead' | 'gameover'`; also `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`.
- Space is toroidal: positions wrap via `wrap(v, max)`.
- World size is hardcoded `W = 800`, `H = 600` in `game.js` and must stay in sync with the `<canvas width="800" height="600">` in `index.html`.
- Asteroid sizes 1/2/3 map through the parallel arrays `RADII`, `SPEEDS`, `POINTS` (index 0 unused).

## Conventions / gotchas
- Input uses a two-map pattern: `keys` (held) and `justPressed` (edge). One-shot actions read via `pressed(code)`, which consumes the edge. Use `pressed()` for single-fire events, `keys[...]` for continuous input.
- UI strings and README are in **Spanish** (e.g. `NIVEL`, `GAME OVER`, `PUNTAJE`); match that when adding player-facing text.
- Keep it dependency-free and single-file unless the user asks otherwise.
