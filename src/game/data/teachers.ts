import type { NPC } from '../types'
import type { NpcContent } from './stageSpecs'

/**
 * The teacher of a stage: the unicorn with the hardest question, marked in
 * stageSpecs.ts with `role: 'teacher'`. Dressed differently in both views.
 */
export function isTeacher(npc: Pick<NPC | NpcContent, 'role'>): boolean {
  return npc.role === 'teacher'
}
