import { useEffect } from 'react'
import { gameStore } from '../logic/gameStore.instance'
import { moveStore } from '../moves/moveStore'
import { placeStore } from '../places/placeStore'
import { earnSticker } from './stickerStore'
import { watchGame } from './watchGame'

/** While the game is on, what the child does wins stickers (see `watchGame`). */
export function useStickerWatch() {
  useEffect(() => watchGame({ game: gameStore, moves: moveStore, places: placeStore }, earnSticker), [])
}
