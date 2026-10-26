import { createStore } from 'zustand/vanilla'

export type HallState = {
  /** She is asked to walk to this class's door (the "Go" button of "What is left?"); `key` is new each time. */
  walkTo: { index: number; key: number } | null
  /** Ask her to walk to the door of class `index` (0-based). */
  goTo: (index: number) => void
}

export function createHallStore() {
  let key = 0
  return createStore<HallState>((set) => ({
    walkTo: null,
    goTo: (index) => set({ walkTo: { index, key: ++key } }),
  }))
}

/** The one corridor of the game: the request to walk to a door. Not remembered. */
export const hallStore = createHallStore()
