import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { StorageLike } from '../utils/progressStorage'
import { EMPTY_PRACTICE, dayKey, parsePractice, withAnswer, withSeconds, type Practice } from './practiceModel'

export const PRACTICE_STORAGE_KEY = 'amaras-einhorn-schule:practice:v1'

export type PracticeState = Practice & {
  /** She played this many more seconds (today, by the clock given to the store). */
  addSeconds: (seconds: number) => void
  /** An answer in a class was right or wrong. */
  answer: (classIndex: number, kind: 'right' | 'wrong') => void
  /** Forget everything (the grown-up asked for a fresh start). */
  clear: () => void
}

function read(storage: StorageLike | null): Practice {
  try {
    const raw = storage?.getItem(PRACTICE_STORAGE_KEY)
    return (raw ? parsePractice(JSON.parse(raw)) : null) ?? EMPTY_PRACTICE
  } catch {
    return EMPTY_PRACTICE
  }
}

/** How she has played, kept on this device like her stickers (the clock is given so a test can choose the day). */
export function createPracticeStore(storage: StorageLike | null, now: () => Date = () => new Date()) {
  return createStore<PracticeState>((set, get) => {
    const keep = (next: Practice) => {
      set(next)
      try {
        storage?.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Remembering is a nicety; the game works without it.
      }
    }
    const current = (): Practice => {
      const { seconds, days, classes } = get()
      return { seconds, days, classes }
    }
    return {
      ...read(storage),
      addSeconds: (seconds) => keep(withSeconds(current(), seconds, dayKey(now()))),
      answer: (classIndex, kind) => keep(withAnswer(current(), classIndex, kind)),
      clear: () => keep(EMPTY_PRACTICE),
    }
  })
}

export const practiceStore = createPracticeStore(typeof window === 'undefined' ? null : window.localStorage)

export function usePractice(): Practice {
  const seconds = useStore(practiceStore, (s) => s.seconds)
  const days = useStore(practiceStore, (s) => s.days)
  const classes = useStore(practiceStore, (s) => s.classes)
  return { seconds, days, classes }
}
