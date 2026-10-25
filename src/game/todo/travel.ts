import { hallStore } from '../hall/hallStore'
import { gameStore } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { placeStore } from '../places/placeStore'
import type { Where } from '../stickers/whereModel'
import { todoStore } from './todoStore'

/**
 * "Go there": from the list of what is left, and from the hint of a sticker she is missing. In the corridor she walks to
 * the door; in a classroom she goes straight into the other one; in the yard or the library she steps through the nearest
 * door and comes out in the class. Closes whatever list was open and lets the game go on.
 */
export function goToClass(index: number): void {
  todoStore.getState().closeList()
  pauseStore.getState().resume()
  const { place } = placeStore.getState()
  if (place === 'hall') hallStore.getState().goTo(index)
  else if (place === 'class') gameStore.getState().enterStage(index)
  else placeStore.getState().jump('class', index)
}

/** The same for a place of free play: the yard or the library. */
export function goToPlace(to: Exclude<Where, 'class' | 'anywhere'>): void {
  todoStore.getState().closeList()
  pauseStore.getState().resume()
  placeStore.getState().jump(to)
}
