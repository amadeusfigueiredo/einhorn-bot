import type { GameState } from '../logic/gameMachine'
import type { Sfx } from './sfx'

/**
 * Which sound effect (if any) a state change deserves. Pure, so the game's
 * soundtrack of events is testable without an AudioContext.
 */
export function soundForTransition(
  prev: GameState,
  next: GameState
): Sfx | null {
  if (next.popup && next.popup.token !== prev.popup?.token) {
    if (next.popup.id === 'GAME_END') return 'fanfare'
    // The stage-advance win gets the correct chime; the stage whoosh is
    // played by the stage card as it appears.
    return next.popup.id === 'WIN' ? 'correct' : 'wrong'
  }
  if (next.stageIndex !== prev.stageIndex) return 'stage'
  if (prev.phase !== 'talking' && next.phase === 'talking') return 'select'
  return null
}
