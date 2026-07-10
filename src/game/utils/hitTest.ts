import type { NPC } from '../types'

const DEFAULT_HIT_HALF_SIZE = 72

/**
 * Finds the (unanswered) NPC whose clickable portrait contains the given
 * point, matching the ~128px square drawn by drawNPC.
 */
export function findNpcAtPoint(
  npcs: NPC[],
  x: number,
  y: number,
  answered: Set<string>,
  hitHalfSize = DEFAULT_HIT_HALF_SIZE
): NPC | undefined {
  return npcs.find((npc) => {
    if (answered.has(npc.id)) return false
    return (
      Math.abs(x - npc.x) <= hitHalfSize && Math.abs(y - npc.y) <= hitHalfSize
    )
  })
}
