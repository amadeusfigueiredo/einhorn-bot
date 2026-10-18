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

## Phase 1 (design system and 2D polish)

### Behavior
- The conversation now has a real `talking` step: touching a unicorn opens a
  typed greeting (any key or tap finishes it, `E`/`Enter`/`Space`/tap moves on)
  before the question. This is a deliberate gameplay change requested for
  Phase 1; the state machine's `TALK` and `BEGIN_ASKING` events were already
  separate, so only the store's `interact` (which used to fire both) changed.
- Playthrough regression (`scripts/e2e-playthrough.mjs`, all 15 stages, wrong
  answer, mid-game reload, ending, restart): stage label and saved progress
  match the Phase 0 baseline for all 141 comparable steps (0 diffs). The raw
  DOM snapshots differ only in how many `.choice` buttons were still on screen
  during the new fade-out animation, and in the new `talking` steps.
- Question text is no longer upper-cased and the question lives in an
  accessible dialog (focus moves into it, `A`-`D` pick an answer, Tab/focus
  ring in gold). The dev stage shortcuts (`1`/`2`) are ignored while a
  conversation or question is open so they can't collide with answering.
- Mute toggle (music and effects), remembered in `localStorage`. Effects are
  synthesised (no assets).

### Accessibility checks (run against the dev server with Playwright)
- Keyboard only: walk with arrows, `E` opens the greeting, `Enter` `Enter`
  reaches the question, focus is inside the dialog (`role=dialog`,
  `aria-modal`, `aria-labelledby`), `Tab` lands on a choice with a 3 px gold
  focus ring, `B` answers.
- `prefers-reduced-motion: reduce`: dialogue text appears instantly, the stage
  card shortens, sparkles are hidden, the player and NPCs stop bobbing and
  pulsing, canvas shake and Motion transforms are disabled.
- Contrast (WCAG ratios computed from the token values): moon on night-800
  14.1:1, secondary text 10.9:1, button label on rose 7.8:1, night on mint
  11.5:1, night on gold 12.5:1, lilac hint on night-800 7.6:1, gold focus
  ring on night-800 > 9:1. All above AA (4.5:1) and AAA for body text.
- Screen readers: the typed greeting is mirrored in an `aria-live` region in
  full, popups are `role=status`, the stage change is announced.

### Performance
Bundle (`pnpm build`, gzip in brackets):

| | JS | CSS |
| --- | --- | --- |
| Before (Phase 0 `main`) | 224.9 kB (72.3 kB) | 4.6 kB (1.6 kB) |
| After | 325.0 kB (108.2 kB) | 12.5 kB (3.3 kB) |

The +36 kB gzip is Motion (`LazyMotion` + `domAnimation` only, with the `m`
component) plus Zustand and the new UI. An all-CSS version of the transitions
would drop most of it; Motion was requested, so it stays. The unused
`styled-components` dependency was removed (it was never in the bundle).

Runtime (`scripts/perf.mjs`: dev server, headless Chromium, 4x CPU throttle,
8 s of walking; lower is better):

| | frames | avg frame | p95 frame | long tasks |
| --- | --- | --- | --- | --- |
| Before | 257 | 33.0 ms | 50.0 ms | 2 (101 ms) |
| After | 304 | 27.7 ms | 33.4 ms | 0 |

The canvas got cheaper despite the extra polish: the HUD pill (a
`shadowBlur`, the most expensive op in the frame) is rendered once per label
and blitted, NPC and player outlines no longer allocate gradients every frame,
and the game loop no longer restarts when a question opens. Re-renders: the
loop and sparkles live outside React; `GameCanvas` subscribes to `phase`,
`activeQuestion` and `popup` only, so walking causes no React renders.

### Open questions / things to check
- Music and image origins are unknown, and four images are screenshots of
  Google search results (see `CREDITS.md`).
- Typewriter speed (30 ms per letter) and the 1.9 s stage card are guesses for
  a six-year-old reader; both are one-line constants (`useTypewriter.ts`,
  `StageCard.tsx`).
- Sparkles on the canvas and DOM sparkles behind the win popup overlap a
  little; one of the two could go.
- Music cannot start before the first click/keypress (browser rule), so the
  loading screen is silent.
