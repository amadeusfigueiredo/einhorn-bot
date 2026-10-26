import type { StageConfig } from '../types'
import { requiredAnswers } from './gameMachine'

/**
 * The developers' jump in the address: `?stage=5` goes into class 5 (the classes before it finished), `&answered=2` with
 * the first two of its questions already answered, or `&left=1` with only one left to answer (to see the end of a class
 * after one answer). Only where `devToolsEnabled` (the dev server, or `?dev`). Pure.
 */
export type DevJump = {
  /** The class, 1 to 15 as the children see it; missing means the class she is in. */
  stage?: number
  answered?: number
  left?: number
}

/** A whole number of at least `min` in the address, or undefined. */
function whole(value: string | null, min: number): number | undefined {
  if (value === null || !/^\d+$/.test(value.trim())) return undefined
  const n = Number(value)
  return n >= min ? n : undefined
}

/** What the address asks for, or null when it asks for nothing. `left` wins over `answered`. */
export function parseDevJump(search: string): DevJump | null {
  const q = new URLSearchParams(search)
  const stage = whole(q.get('stage') ?? q.get('class'), 1)
  const answered = whole(q.get('answered'), 0)
  const left = whole(q.get('left'), 1)
  if (stage === undefined && answered === undefined && left === undefined) return null
  return { ...(stage !== undefined && { stage }), ...(answered !== undefined && { answered }), ...(left !== undefined && { left }) }
}

/** The question to go to when she steps `delta` questions in a class (0-based, never the last answer: the game keeps one question open). */
export function stepQuestion(answered: number, required: number, delta: number): number {
  return Math.max(0, Math.min(answered + delta, required - 1))
}

/** The class to go to (zero-based) and how many questions of it are answered, for the game's `devJump`. The game keeps one question open at least. */
export function resolveDevJump(jump: DevJump, currentStageIndex: number, stages: readonly StageConfig[]): { stageIndex: number; answered: number } {
  const stageIndex = jump.stage === undefined ? currentStageIndex : Math.min(stages.length - 1, jump.stage - 1)
  const required = requiredAnswers(stages[stageIndex])
  const answered = jump.left !== undefined ? required - jump.left : (jump.answered ?? 0)
  return { stageIndex, answered: Math.max(0, Math.min(answered, required - 1)) }
}
