import type { StoreApi } from 'zustand/vanilla'
import type { GameStoreState } from '../logic/gameStore'

export type WatchedGame = StoreApi<Pick<GameStoreState, 'stageIndex' | 'answered' | 'popup'>>

/**
 * Listens to the game and tells the practice what happened in each class: a right answer is one more name in the
 * class's list of answered, a wrong one is a "try again" popup (a new one each time). Returns the way to stop listening.
 */
export function watchPractice(game: WatchedGame, answer: (classIndex: number, kind: 'right' | 'wrong') => void): () => void {
  return game.subscribe((s, prev) => {
    if (s.stageIndex === prev.stageIndex && s.answered.size > prev.answered.size) answer(s.stageIndex, 'right')
    if (s.popup?.id === 'TRY_AGAIN' && s.popup.token !== prev.popup?.token) answer(s.stageIndex, 'wrong')
  })
}
