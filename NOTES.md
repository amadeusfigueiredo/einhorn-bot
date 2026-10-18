# Notes

Findings from working on `feat/restructure-and-polish`. Anything that looks
wrong or risky in the original code goes here instead of being silently
changed (see `CLAUDE.md`).

## Phase 0 audit (state of `main` before the refactor)

### Structure
- Vite + React 19 + TypeScript (strict already on) + styled-components
  (declared, **unused**: every component styles itself with inline `style`
  objects or `index.css`). Vitest was already set up (174 tests, mostly
  for pure helpers in `src/game/utils` and `src/game/engine/update.ts`).
- Canvas 2D renderer (`engine/drawScene.ts` and friends), React overlays for
  questions and popups, plain hooks for input, audio and the game loop.
- 15 stages x 4 NPCs. `constants/stages.ts` (771 lines) mixes pure content
  (all questions) with the layout builder. `types.ts` has a duplicate `Npc`
  type next to `NPC`, and `LoaderImageAssets` lists every key by hand.

### Where logic and rendering are mixed
- `GameCanvas.tsx` owns *all* game state through a mix of `useState`
  (`questionKey`, `activePopupConfig`), refs (`answeredRef`, `playerRef`, ...)
  and the stage index living one level up in `useStageController`.
- `useGameActions.ts` is the real "game logic" (answer checking, completion,
  stage advance, game end) but it is a React hook full of `setTimeout`s, `any`
  casts and `localStorage` writes, so none of it was unit-testable.
- Progress is saved from two places (`useGameActions` on a correct answer,
  and a `useEffect` in `GameCanvas` on stage change).
- Popup timing (4 s win, 5 s try-again) is driven by un-cancelled
  `setTimeout`s.

### Risks found (behavior kept as-is unless noted in the refactor section)
1. **Popups only block the pointer, not the keyboard.** While the WIN /
   TRY_AGAIN popup is up, the game loop keeps running: you can still walk and
   press `E` next to another NPC and open a question *behind* the popup.
2. **Stale popup timers.** Each popup schedules its own `setTimeout` that
   clears whatever popup is current when it fires, so a quick second answer
   can have its popup cut short by the first answer's timer. Timers are never
   cancelled on unmount either.
3. **Game loop effect is re-created** on every `stage`/`questionKey`/canvas
   change (cheap, but it restarts the `performance.now()` clock so idle
   animations jump).
4. `drawScene` creates 2-3 `CanvasGradient`s per NPC and for the HUD **every
   frame**, and uses `shadowBlur` on the HUD each frame (the most expensive
   canvas op in the frame).
5. All 15 stages' background images plus every portrait are preloaded
   up-front (about 1.5 MB of PNG in `public/assets`), and there is no
   loading indicator.
6. `package.json` declares `styled-components` but nothing imports it.
7. `CLAUDE.md` says `npm run ...`, the repo is pnpm.

### Deliberate behavior differences after the Phase 0 refactor
The playthrough trace (see below) is identical before and after. These are
the only edge cases where the new state machine behaves differently, all of
them fixes for the risks above:
- **Stale popup timers** (risk 2): every popup has a token and an expiry only
  closes the popup it was scheduled for.
- **Dev stage jump while a question is open**: `1`/`2`/the stage buttons used
  to leave the old question "open" with no overlay, which froze the world
  forever (the loop pauses while a question key is set). Jumping now resets to
  `exploring`.
- **Ending is modal**: once the last stage is done you can no longer start a
  new conversation behind the "game over" popup.
- The game loop is no longer torn down and restarted when a question opens or
  closes, so the animation clock keeps running (risk 3, partially).

Kept as-is on purpose: feedback popups (correct / wrong / next stage) still
don't block movement or conversations behind them (risk 1).

### How the Phase 0 trace was produced
`scripts/e2e-playthrough.mjs` drives the real game with Playwright against
`vite` (answers a wrong choice once, then plays all 15 stages by tapping NPCs,
reloads mid-game to check persistence, closes the ending popup) and writes a
timing-independent JSON trace of stage label, `localStorage` progress, popup
text and overlay state after every step. `diff baseline.json after.json` was
empty. `playwright` is a dev dependency only for this script.
