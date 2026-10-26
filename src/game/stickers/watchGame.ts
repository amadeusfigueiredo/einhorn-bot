import type { StoreApi } from 'zustand/vanilla'
import type { GameStoreState } from '../logic/gameStore'
import type { MoveState } from '../moves/moveStore'
import type { PlaceState } from '../places/placeStore'
import { STAGES } from '../constants/stages'
import { doneFlags } from '../logic/classProgress'
import type { StickerEvent } from './stickerData'

/** Did the answers that were just added finish a class? */
function newlyDone(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  const was = doneFlags(before, STAGES)
  return doneFlags(after, STAGES).some((done, i) => done && !was[i])
}

export type Watched = {
  game: StoreApi<Pick<GameStoreState, 'stageIndex' | 'solved' | 'answered'>>
  moves: StoreApi<Pick<MoveState, 'current'>>
  places: StoreApi<Pick<PlaceState, 'place'>>
}

/**
 * Listens to what the game does and tells the stickers: a right answer, a class finished, a dance, a visit to the yard
 * or the library. (What happens inside a room, like a kick, a book read to its last page or a talk with a friend, is told
 * by the room itself: those stores load with the rooms, not with the first page.) Returns the way to stop listening.
 */
export function watchGame({ game, moves, places }: Watched, earn: (type: StickerEvent, key?: string) => void): () => void {
  const stops = [
    // A right answer is one more name among the solved ones; a class is done when the last of its answers is there.
    // (Going into a class from the corridor changes the class but solves nothing, and gives no answer.)
    game.subscribe((s, prev) => {
      if (s.solved.size > prev.solved.size) {
        earn('answer')
        if (newlyDone(prev.solved, s.solved)) earn('stage')
      }
    }),
    moves.subscribe((s, prev) => {
      if (s.current && s.current.key !== prev.current?.key) earn('move', `${s.current.hero}:${s.current.id}`)
    }),
    places.subscribe((s, prev) => {
      if (s.place === prev.place) return
      if (s.place === 'yard') earn('visitYard')
      else if (s.place === 'library') earn('visitLibrary')
    }),
  ]
  return () => stops.forEach((stop) => stop())
}
