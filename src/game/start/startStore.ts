import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { shouldShowStartMenu } from './startModel'

export type StartState = {
  /** The start menu is on screen: the game waits behind it, drawn by nobody. */
  active: boolean
  /** Back to the menu (from the pause menu). */
  open: () => void
  close: () => void
}

export function createStartStore(initialActive: boolean): StoreApi<StartState> {
  return createStore<StartState>((set) => ({
    active: initialActive,
    open: () => set({ active: true }),
    close: () => set({ active: false }),
  }))
}

export const startStore = createStartStore(typeof window !== 'undefined' && shouldShowStartMenu(window.location.search))

export function useStartActive(): boolean {
  return useStore(startStore, (s) => s.active)
}

/** Non-React code (the game loops) asks this: the world stands still while the menu is up. */
export function isStartMenuOpen(): boolean {
  return startStore.getState().active
}
