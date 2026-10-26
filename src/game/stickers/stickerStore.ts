import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { playSfx } from '../audio/sfx'
import type { StorageLike } from '../utils/progressStorage'
import type { StickerEvent } from './stickerData'
import { applyEvent, EMPTY_PROGRESS, parseProgress, type StickerProgress } from './stickerModel'

export const STICKER_STORAGE_KEY = 'amaras-einhorn-schule:stickers:v1'

export type StickerState = StickerProgress & {
  /** Stickers just won, told to the child one after another. */
  toasts: string[]
  /** The sticker book is open (the game waits behind it). */
  bookOpen: boolean
  /** Something happened (a kick, a book read): counts it and tells about any sticker it won. */
  earn: (type: StickerEvent, key?: string) => void
  /** The sticker on show has been shown: the next one comes. */
  nextToast: () => void
  openBook: () => void
  closeBook: () => void
}

function read(storage: StorageLike | null): StickerProgress {
  try {
    const raw = storage?.getItem(STICKER_STORAGE_KEY)
    return (raw ? parseProgress(JSON.parse(raw)) : null) ?? EMPTY_PROGRESS
  } catch {
    return EMPTY_PROGRESS
  }
}

/** The stickers she has won are remembered, like her name and her hero. */
export function createStickerStore(storage: StorageLike | null) {
  return createStore<StickerState>((set, get) => ({
    ...read(storage),
    toasts: [],
    bookOpen: false,
    earn: (type, key) => {
      const { counts, seen, got } = get()
      const result = applyEvent({ counts, seen, got }, type, key)
      set({ ...result.progress, toasts: result.won.length ? [...get().toasts, ...result.won] : get().toasts })
      try {
        storage?.setItem(STICKER_STORAGE_KEY, JSON.stringify(result.progress))
      } catch {
        // Remembering is a nicety; the stickers still work without it.
      }
      if (result.won.length) playSfx('tada')
    },
    nextToast: () => set({ toasts: get().toasts.slice(1) }),
    openBook: () => set({ bookOpen: true }),
    closeBook: () => set({ bookOpen: false }),
  }))
}

export const stickerStore = createStickerStore(typeof window === 'undefined' ? null : window.localStorage)

/** Anywhere in the game: this happened (a kick, a book read, a dance). */
export function earnSticker(type: StickerEvent, key?: string) {
  stickerStore.getState().earn(type, key)
}

export function useStickers(): StickerProgress {
  const counts = useStore(stickerStore, (s) => s.counts)
  const seen = useStore(stickerStore, (s) => s.seen)
  const got = useStore(stickerStore, (s) => s.got)
  return { counts, seen, got }
}

export function useStickerToast(): string | null {
  return useStore(stickerStore, (s) => s.toasts[0] ?? null)
}

export function useBookOpen(): boolean {
  return useStore(stickerStore, (s) => s.bookOpen)
}
