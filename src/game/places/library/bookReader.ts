import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { BOOKS, type Book } from '../data/hangouts'
import { earnSticker } from '../../stickers/stickerStore'
import { registerBusy } from '../placeBusy'

/** Which book is open, and the page (0 to 2). */
export type Reading = { book: number; page: number }

export const PAGES = 3

export function bookById(id: number): Book | undefined {
  return BOOKS.find((b) => b.id === id)
}

/** Opens a book at its first page, or nothing for a book that is not there. */
export function openBook(id: number): Reading | null {
  return bookById(id) ? { book: id, page: 0 } : null
}

/** Turns the page by `by` (1 forward, -1 back), staying inside the book. */
export function turnPage(reading: Reading, by: 1 | -1): Reading {
  return { ...reading, page: Math.min(PAGES - 1, Math.max(0, reading.page + by)) }
}

export const isFirstPage = (r: Reading) => r.page === 0
export const isLastPage = (r: Reading) => r.page === PAGES - 1

export type ReaderState = {
  reading: Reading | null
  open: (id: number) => void
  next: () => void
  back: () => void
  /** Closes the book ("Zuklappen"). */
  close: () => void
}

export function createReaderStore() {
  return createStore<ReaderState>((set, get) => ({
    reading: null,
    open: (id) => set({ reading: openBook(id) }),
    next: () => {
      const r = get().reading
      if (!r) return
      const turned = turnPage(r, 1)
      set({ reading: turned })
      // Reaching the last page is reading the book (for the stickers).
      if (isLastPage(turned) && !isLastPage(r)) earnSticker('book', String(turned.book))
    },
    back: () => {
      const r = get().reading
      if (r) set({ reading: turnPage(r, -1) })
    },
    close: () => set({ reading: null }),
  }))
}

/** The one book that is open at a time. Not remembered. */
export const readerStore = createReaderStore()

export function useReading(): Reading | null {
  return useStore(readerStore, (s) => s.reading)
}

export function isReading(): boolean {
  return readerStore.getState().reading !== null
}

// An open book has the room.
registerBusy(isReading)
