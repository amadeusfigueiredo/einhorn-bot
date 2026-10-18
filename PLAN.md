# Plan

## Phase 0: audit and restructure (done)
- Audit written to `NOTES.md`.
- TypeScript strict and Vitest were already in place; added `zustand`
  (small store with selector subscriptions, used for the state machine) and
  `playwright` (dev only, for the playthrough script).
- Game logic is a pure state machine in `src/game/logic/gameMachine.ts`
  (`exploring -> talking -> asking -> correct | wrong -> nextStage -> ending`),
  wrapped by a Zustand store (`gameStore.ts`) that owns the only side effects:
  popup timers and progress persistence. No React or canvas imports in either.
- Questions/stage content moved to `src/game/data/stageSpecs.ts`, popup config
  to `src/game/data/popups.ts`. `constants/stages.ts` only adds art + layout.
- `GameCanvas`, `useGameLoop` and `useStageController` now read the store;
  `useGameActions` is gone.
- 28 new unit tests, including a full 15-stage playthrough to the ending.
- Playwright playthrough before/after: traces identical (141 entries).

## Phase 1: design system and 2D polish (in progress)
See `DESIGN.md`.
