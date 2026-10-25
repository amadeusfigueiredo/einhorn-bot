import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { choose, startTalk, type TalkState } from './dialogModel'
import type { Dialog } from './data/hangouts'
import { emitPlaceEffect } from './placeEvents'
import { earnSticker } from '../stickers/stickerStore'
import { registerBusy } from './placeBusy'

export type TalkingState = {
  /** Who she is talking with and where the talk is, or null when nobody. */
  talk: { id: string; state: TalkState } | null
  open: (id: string, dialog: Dialog) => void
  /** She picks an answer: the talk goes on or ends, and what it made happen is told to the room. */
  choose: (index: number) => void
  close: () => void
}

export function createTalkStore() {
  return createStore<TalkingState>((set, get) => ({
    talk: null,
    open: (id, dialog) => {
      set({ talk: { id, state: startTalk(dialog) } })
      // Starting a talk is meeting a friend (for the stickers).
      earnSticker('talk', id)
    },
    choose: (index) => {
      const current = get().talk
      if (!current) return
      const chosen = choose(current.state, index)
      set({ talk: chosen.talk ? { id: current.id, state: chosen.talk } : null })
      if (chosen.effect) emitPlaceEffect(chosen.effect, chosen.book)
    },
    close: () => set({ talk: null }),
  }))
}

/** The one talk of the game: nobody walks about while she talks with a friend. Not remembered. */
export const talkStore = createTalkStore()

export function useTalk() {
  return useStore(talkStore, (s) => s.talk)
}

/** Non-React code (the room's loops and taps) asks this. */
export function isTalking(): boolean {
  return talkStore.getState().talk !== null
}

// A talk has the room.
registerBusy(isTalking)
