import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { playSfx } from '../audio/sfx'
import type { Lang } from '../i18n/languages'
import { heroSettings, type Hero } from '../player/heroSettings'
import { drawMove, moveById, newBag, type MoveBag, type MoveId } from '../views/three/amara/amaraMoves'
import { drawUnicornMove, newUnicornBag, unicornMoveById, type UnicornMoveBag, type UnicornMoveId } from '../views/three/unicornMoves'

/** A move being done: one of Amara's twenty or one of the unicorn's twelve. `key` is new for every move. */
export type Dancing = { hero: 'amara'; id: MoveId; key: number } | { hero: 'unicorn'; id: UnicornMoveId; key: number }

export type MoveState = {
  /** The move being done, or null. `key` is new for every move, so the same move twice in a row is two moves. */
  current: Dancing | null
  /** What each hero has not done yet in this round. */
  bag: MoveBag
  unicornBag: UnicornMoveBag
  /**
   * The hero (the one being played) starts a move chosen at random (never the same twice in a row, all of them before
   * one repeats), with its sound. Returns which.
   */
  start: (random?: () => number, hero?: Hero) => MoveId | UnicornMoveId
  /** The move with this key is over (a later move is not touched). */
  finish: (key: number) => void
  cancel: () => void
}

export function createMoveStore() {
  let key = 0
  return createStore<MoveState>((set, get) => ({
    current: null,
    bag: newBag(),
    unicornBag: newUnicornBag(),
    start: (random = Math.random, hero = heroSettings.getState().hero) => {
      if (hero === 'amara') {
        const draw = drawMove(get().bag, random)
        set({ current: { hero, id: draw.id, key: ++key }, bag: draw.bag })
        playSfx(moveById(draw.id).sound)
        return draw.id
      }
      const draw = drawUnicornMove(get().unicornBag, random)
      set({ current: { hero, id: draw.id, key: ++key }, unicornBag: draw.bag })
      playSfx(unicornMoveById(draw.id).sound)
      return draw.id
    },
    finish: (k) => {
      if (get().current?.key === k) set({ current: null })
    },
    cancel: () => set({ current: null }),
  }))
}

/** The one move at a time. Not remembered. */
export const moveStore = createMoveStore()

export function useMove(): Dancing | null {
  return useStore(moveStore, (s) => s.current)
}

/** What the move is called, in this language. */
export function moveName(move: Dancing, lang: Lang): string {
  return (move.hero === 'amara' ? moveById(move.id) : unicornMoveById(move.id)).name[lang]
}
