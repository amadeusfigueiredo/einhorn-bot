import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { Localized } from '../i18n/languages'

export type SayState = {
  /** What a thing says out loud now (a globe, a lamp, a fish tank), or null. `key` changes with every new line, so the same line said twice is a new one. */
  saying: { text: Localized; key: number } | null
  say: (text: Localized) => void
  clear: () => void
}

/** How long a line stays up (seconds). */
export const SAY_SECONDS = 2.6

export function createSayStore() {
  let key = 0
  return createStore<SayState>((set) => ({
    saying: null,
    say: (text) => set({ saying: { text, key: ++key } }),
    clear: () => set({ saying: null }),
  }))
}

/** The one line that is up at a time. Not remembered. */
export const sayStore = createSayStore()

export function useSaying() {
  return useStore(sayStore, (s) => s.saying)
}
