import { isPaused } from '../pause/pauseStore'
import { profileStore } from '../player/playerName'
import { isStartMenuOpen } from '../start/startStore'
import { isTravelling } from './placeStore'

/** The yard and the library stand still while the game is paused, a door is opening, the start menu is up or the name is being asked. */
export function worldRunning(): boolean {
  return !isPaused() && !isTravelling() && !isStartMenuOpen() && !profileStore.getState().modalOpen
}
