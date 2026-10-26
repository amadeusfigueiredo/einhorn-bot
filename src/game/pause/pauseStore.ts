import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export type PauseState = {
  /** The game (or the film) stands still until the child goes on. */
  paused: boolean
  pause: () => void
  resume: () => void
  toggle: () => void
}

export function createPauseStore() {
  return createStore<PauseState>((set, get) => ({
    paused: false,
    pause: () => set({ paused: true }),
    resume: () => set({ paused: false }),
    toggle: () => set({ paused: !get().paused }),
  }))
}

/** The one pause of the game: stages and films share it. Not remembered: a new visit starts playing. */
export const pauseStore = createPauseStore()

export function usePaused(): boolean {
  return useStore(pauseStore, (s) => s.paused)
}

/** Non-React code (the game loops) asks this. */
export function isPaused(): boolean {
  return pauseStore.getState().paused
}
