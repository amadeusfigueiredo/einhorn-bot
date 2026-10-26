import type { StageConfig } from '../types'

/**
 * Which classes are finished, worked out from one list: every question she has answered right, in any class (the
 * `solved` set of the game). A class is finished when all it needs are in it. She can go into any class at any time,
 * in any order, and the school knows what is still to do. Pure, no React, no storage.
 */

/** The ids of everything in a stage that asks a question. */
export function questionIds(stage: StageConfig): string[] {
  return [...(stage.gates ?? []), ...(stage.npcs ?? [])].map((item) => item.id)
}

/** How many correct answers a class needs to be finished. */
export function requiredAnswers(stage: StageConfig): number {
  const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
  return stage.requiredToAdvance ?? total
}

/** What she has answered in this class (a part of the solved ones). */
export function answeredIn(solved: ReadonlySet<string>, stage: StageConfig): Set<string> {
  return new Set(questionIds(stage).filter((id) => solved.has(id)))
}

/** Has she answered all this class needs? */
export function isClassDone(solved: ReadonlySet<string>, stage: StageConfig): boolean {
  return answeredIn(solved, stage).size >= requiredAnswers(stage)
}

/** For each class, is it finished? */
export function doneFlags(solved: ReadonlySet<string>, stages: readonly StageConfig[]): boolean[] {
  return stages.map((stage) => isClassDone(solved, stage))
}

/** The classes still to do, in order (0-based). */
export function missingClasses(solved: ReadonlySet<string>, stages: readonly StageConfig[]): number[] {
  return doneFlags(solved, stages).flatMap((done, i) => (done ? [] : [i]))
}

/** The first class after `from` that is not finished, going on round to the beginning, or null when every class is. */
export function nextIncomplete(solved: ReadonlySet<string>, stages: readonly StageConfig[], from: number): number | null {
  const flags = doneFlags(solved, stages)
  for (let step = 1; step <= flags.length; step++) {
    const i = (from + step) % flags.length
    if (!flags[i]) return i
  }
  return null
}

/** Everything the classes before `index` ask: what a developer's jump counts as already answered. */
export function idsBefore(stages: readonly StageConfig[], index: number): string[] {
  return stages.slice(0, Math.max(0, index)).flatMap(questionIds)
}

/** What is solved when she opens a save: the new kind lists everything; the old kind said which class she had got to and what she had answered in it, and everything before it was finished. */
export function solvedFromSave(saved: { stageIndex: number; answeredIds: readonly string[]; version?: number }, stages: readonly StageConfig[]): Set<string> {
  const known = new Set(stages.flatMap(questionIds))
  const own = saved.answeredIds.filter((id) => known.has(id))
  if (saved.version === 2) return new Set(own)
  return new Set([...idsBefore(stages, Math.min(saved.stageIndex, stages.length - 1)), ...own])
}

/** How much of the game's classes is done, 0 to 1. */
export function classesDoneShare(solved: ReadonlySet<string>, stages: readonly StageConfig[]): number {
  return stages.length === 0 ? 1 : doneFlags(solved, stages).filter(Boolean).length / stages.length
}
