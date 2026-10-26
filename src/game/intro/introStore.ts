import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { profileStore } from '../player/playerName'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'
import { shouldShowIntro } from './introModel'

export type IntroState = {
  /** The intro is on screen (and the name card waits behind it). */
  active: boolean
  /** Play it again (from the menu). */
  start: () => void
  finish: () => void
}

export function createIntroStore(initialActive: boolean): StoreApi<IntroState> {
  return createStore<IntroState>((set) => ({
    active: initialActive,
    start: () => set({ active: true }),
    finish: () => set({ active: false }),
  }))
}

function initial(): boolean {
  if (typeof window === 'undefined') return false
  const { name, skipped } = profileStore.getState()
  return shouldShowIntro({ name, skipped, search: window.location.search, reducedMotion: prefersReducedMotion() })
}

export const introStore = createIntroStore(initial())

export function useIntroActive(): boolean {
  return useStore(introStore, (s) => s.active)
}

/** Non-React code (the game loops) asks this: the world stands still while the intro plays. */
export function isIntroPlaying(): boolean {
  return introStore.getState().active
}
