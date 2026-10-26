# 🦄 Amaras Einhorn Schule (2D)

A browser-based unicorn adventure for kids: walk through 15 rainbow-themed
stages, meet unicorns, and answer their quiz questions (in German, Portuguese
or English) to progress. Built with React, TypeScript and Canvas 2D.

This repo is the **2D-only** version of the game. The 3D version (three.js,
films, real classrooms, special rooms) lives in the
[`unicorn-school-3d`](../unicorn-school-3d) repo; this repo is made from it
with everything that needs three.js left out (see `NOTES.md`).

## Features

- **15 stages**, each with its own background, music and four unicorns that
  ask a quiz question; **3 languages** (German, Portuguese, English), chosen
  on the start menu.
- **Open classes**: any class can be entered at any time; the "What is left?"
  button lists the classes still to do, and the game ends when all 15 are done.
- **Ways to play**: arrow keys or WASD and `E`/`Enter`; click or tap to walk
  there; an on-screen D-pad on phones. `P` or `Escape` pauses.
- **Stickers, wardrobe, pause menu, parent corner**, number questions typed in
  a box, and the yard, the library and the corridor drawn in 2D.
- **Mobile & tablet friendly**; respects `prefers-reduced-motion`.

## Getting started

This project uses [pnpm](https://pnpm.io/) (see `.tool-versions` for the
exact Node/pnpm versions used).

```bash
pnpm install
pnpm dev
```

Then open the printed local URL in your browser.

## Scripts

| Command           | What it does                                  |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Start the Vite dev server with hot reload      |
| `pnpm build`       | Type-check and build a production bundle       |
| `pnpm preview`     | Preview the production build locally           |
| `pnpm test`        | Run the unit test suite once (Vitest)          |
| `pnpm test:watch`  | Run the unit test suite in watch mode          |
| `pnpm test:coverage` | Run the tests and report what is not covered |
| `pnpm lint`        | Run ESLint                                     |

## Project structure

```
src/
  App.tsx                      layout: title bar, the game, the start menu
  game/GameShell.tsx           input, assets, audio and the HTML overlay around the 2D view
  game/logic, stores, data/    pure game state, questions, dialogue, stage config
  game/views/                  Canvas2DView (classroom), Canvas2DPlaceView (yard, library, corridor)
  game/engine, utils/draw*     the 2D drawing
  game/i18n, ui, stickers, ... text in 3 languages, HUD, popups, stickers, pause, wardrobe
public/assets/                 stage backgrounds, NPC portraits, music, popups
```

## Testing

Vitest, with Testing Library and jsdom for the React parts. Aim: 100 % coverage
of what is in this repo (`pnpm test:coverage`).

```bash
pnpm test
```

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Vitest](https://vitest.dev/) for unit tests
- Canvas 2D API for rendering the game scene
