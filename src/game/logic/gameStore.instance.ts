import { useStore } from 'zustand'
import { STAGES } from '../constants/stages'
import { loadProgress } from '../utils/progressStorage'
import { pauseStore } from '../pause/pauseStore'
import {
  createGameStore,
  type GameStoreState,
} from './gameStore'

const storage = typeof window === 'undefined' ? null : window.localStorage

/**
 * The one live game. Question content does not depend on the canvas size,
 * so the default (landscape) stage list is enough for the state machine;
 * only the renderer needs the size-specific NPC positions.
 */
export const gameStore = createGameStore({
  stages: STAGES,
  storage,
  saved: loadProgress(storage),
})

// A pause freezes the popup timers ("Almost!" must not vanish while the child is away).
pauseStore.subscribe((state, prev) => {
  if (state.paused !== prev.paused) gameStore.getState().setPaused(state.paused)
})

export function useGame<T>(selector: (state: GameStoreState) => T): T {
  return useStore(gameStore, selector)
}
