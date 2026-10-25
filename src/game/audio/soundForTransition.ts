import type { GameState } from '../logic/gameMachine'
import type { Sfx } from './sfx'
import { pitchFor, type VoiceName } from './voice'

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

/** A voice, and how high it is spoken. */
export type VoiceCue = { name: VoiceName; pitch: number }

/**
 * The little girl's voice that goes with a state change (on top of the
 * chime): "yay!" for a right answer, a gentle "uh-oh" for a wrong one, and a
 * "hi!" when Amara starts talking with someone, pitched to that someone.
 * The ending has its own film, so it adds nothing here.
 */
export function voiceForTransition(prev: GameState, next: GameState): VoiceCue | null {
  if (next.popup && next.popup.token !== prev.popup?.token) {
    if (next.popup.id === 'GAME_END') return null
    return { name: next.popup.id === 'WIN' ? 'yay' : 'uhoh', pitch: 1 }
  }
  if (prev.phase !== 'talking' && next.phase === 'talking') {
    return { name: 'hello', pitch: pitchFor(next.activeQuestion?.id ?? '') }
  }
  return null
}
