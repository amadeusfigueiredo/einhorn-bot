import { canDance, type DanceContext } from './danceKeys'
import { moveStore } from './moveStore'

/**
 * The one place that decides "can she dance now, and which hero": the Space bar and a click on her both ask it, so the
 * two can never disagree. The shell says what the situation is (`setDanceContext`); nothing is known before that
 * (a page with no game on it never dances).
 */
let situation: (() => DanceContext) | null = null

export function setDanceContext(read: (() => DanceContext) | null): void {
  situation = read
}

/** Starts one of the hero's moves when she can dance; says whether it did. */
export function tryDance(): boolean {
  const now = situation?.()
  if (!now || !canDance(now)) return false
  moveStore.getState().start(Math.random, now.hero)
  return true
}
