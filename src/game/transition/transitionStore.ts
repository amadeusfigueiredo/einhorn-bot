import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'

export type TransitionState = {
  /** The overlay is on screen: the world stands still under it. */
  active: boolean
  /** The stage (0-based) the school is walking from, and the one it is walking to. */
  from: number | null
  to: number | null
  /** It was a stage just finished (not a jump or a restart): start with the "Stage complete!" card. */
  completed: boolean
  start: (to: number, completed?: boolean, from?: number | null) => void
  finish: () => void
}

export function createTransitionStore(): StoreApi<TransitionState> {
  return createStore<TransitionState>((set) => ({
    active: false,
    from: null,
    to: null,
    completed: false,
    start: (to, completed = false, from = null) => set({ active: true, to, completed, from }),
    finish: () => set({ active: false, from: null, to: null, completed: false }),
  }))
}

export const transitionStore = createTransitionStore()

export function useTransition<T>(selector: (s: TransitionState) => T): T {
  return useStore(transitionStore, selector)
}

/** Non-React code (the game loops) asks this. */
export function isTransitioning(): boolean {
  return transitionStore.getState().active
}
