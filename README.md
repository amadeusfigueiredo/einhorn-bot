# 🦄 Amaras Einhorn Schule

A browser-based unicorn adventure for kids: walk through 12 rainbow-themed
stages, meet unicorns, and answer their quiz questions (in German) to
progress. Built with React, TypeScript, and Canvas 2D rendering.

## Features

- **12 stages**, each with its own background, background music, and a
  handful of unicorn NPCs that ask a quiz question.
- **Answer questions to advance**: each stage defines how many correct
  answers are required before the next stage unlocks.
- **Multiple ways to play**:
  - Keyboard: arrow keys or WASD to move, `E`/`Enter` to talk to a nearby
    unicorn.
  - Click/tap: click or tap anywhere on the canvas to walk there; tap a
    unicorn directly to walk over and open its question automatically.
  - On-screen D-pad: touch-friendly movement controls in the corner of the
    canvas, for devices without a keyboard.
- **Mobile & tablet friendly**: the canvas scales to fit the screen and all
  controls are usable with touch.
- **Dev stage navigator**: jump directly to any stage while testing,
  available in the header next to the title.

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
| `pnpm lint`        | Run ESLint                                     |

## Project structure

```
src/
  App.tsx                     top-level layout (title bar + game canvas)
  components/StageSelector.tsx  dev stage-jump UI, shown next to the title
  game/
    GameCanvas.tsx             owns game state, input, and the <canvas>
    constants/stages.ts        the 12 stages: backgrounds, music, NPCs, questions
    constants/dimensions.ts    canvas resolution
    engine/                    per-frame update + draw logic
    hooks/                     input, audio, asset loading, stage navigation
    components/                SoundButton, MoveControls (D-pad)
    utils/                     collision, NPC layout, hit-testing, asset loader
public/assets/                 stage backgrounds, NPC portraits, music, popups
```

## Testing

Unit tests cover the pure game logic — movement and collision, click-to-move
arrival, NPC hit-testing, question resolution, and stage data integrity
(every question's answer index is in range, every stage's `nextStage` points
at a real stage, etc.):

```bash
pnpm test
```

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Vitest](https://vitest.dev/) for unit tests
- Canvas 2D API for rendering the game scene
