import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { answeredIn, classesDoneShare, doneFlags, idsBefore, isClassDone, missingClasses, nextIncomplete, questionIds, requiredAnswers, solvedFromSave } from './classProgress'

const all = (i: number) => new Set(questionIds(STAGES[i]))
const union = (...sets: Set<string>[]) => new Set(sets.flatMap((s) => [...s]))

describe('which classes are finished, from the list of everything answered', () => {
  it('a class asks for its questions, and needs as many answers as it says', () => {
    expect(questionIds(STAGES[0])).toEqual(STAGES[0].npcs!.map((n) => n.id))
    expect(requiredAnswers(STAGES[0])).toBe(STAGES[0].requiredToAdvance ?? STAGES[0].npcs!.length)
    expect(requiredAnswers({ ...STAGES[0], requiredToAdvance: undefined })).toBe(STAGES[0].npcs!.length + (STAGES[0].gates ?? []).length)
  })

  it('a class with no gates and no unicorns asks nothing and needs nothing (it is done from the start)', () => {
    const bare = { ...STAGES[0], gates: undefined, npcs: undefined, requiredToAdvance: undefined }
    expect(questionIds(bare)).toEqual([])
    expect(requiredAnswers(bare)).toBe(0)
    expect(isClassDone(new Set(), bare)).toBe(true)
    const gated = { ...STAGES[0], gates: [{ id: 'g1' }, { id: 'g2' }] as never, npcs: undefined, requiredToAdvance: undefined }
    expect(questionIds(gated)).toEqual(['g1', 'g2'])
    expect(requiredAnswers(gated)).toBe(2)
  })

  it('what she has answered in a class is the part of the list that belongs to it', () => {
    const solved = union(all(0), new Set([STAGES[3].npcs![1].id]))
    expect([...answeredIn(solved, STAGES[0])].sort()).toEqual(questionIds(STAGES[0]).sort())
    expect([...answeredIn(solved, STAGES[3])]).toEqual([STAGES[3].npcs![1].id])
    expect(answeredIn(solved, STAGES[5]).size).toBe(0)
  })

  it('a class is finished when every answer it needs is there, in any order, and not before', () => {
    const ids = questionIds(STAGES[2])
    expect(isClassDone(new Set(), STAGES[2])).toBe(false)
    expect(isClassDone(new Set(ids.slice(0, ids.length - 1)), STAGES[2])).toBe(false)
    expect(isClassDone(new Set([...ids].reverse()), STAGES[2])).toBe(true)
  })

  it('knows each class on its own: finishing class 7 does not finish the ones before it', () => {
    const flags = doneFlags(all(6), STAGES)
    expect(flags[6]).toBe(true)
    expect(flags.filter(Boolean)).toHaveLength(1)
    expect(missingClasses(all(6), STAGES)).toEqual(STAGES.map((_, i) => i).filter((i) => i !== 6))
  })

  it('lists what is missing in order, and nothing when everything is done', () => {
    expect(missingClasses(new Set(), STAGES)).toEqual(STAGES.map((_, i) => i))
    expect(missingClasses(union(...STAGES.map((_, i) => all(i))), STAGES)).toEqual([])
  })

  it('the next class to do is the first unfinished one after this one, and goes round to the start', () => {
    const solved = union(all(0), all(1), all(14))
    expect(nextIncomplete(solved, STAGES, 1)).toBe(2)
    expect(nextIncomplete(solved, STAGES, 14)).toBe(2)
    expect(nextIncomplete(union(all(3)), STAGES, 3)).toBe(4)
    // one class left, and it is the one she is in: it comes round to itself
    const nearlyAll = union(...STAGES.map((_, i) => (i === 5 ? new Set<string>() : all(i))))
    expect(nextIncomplete(nearlyAll, STAGES, 5)).toBe(5)
    expect(nextIncomplete(nearlyAll, STAGES, 9)).toBe(5)
  })

  it('no next class when every one is done', () => {
    expect(nextIncomplete(union(...STAGES.map((_, i) => all(i))), STAGES, 14)).toBeNull()
  })

  it('knows what the classes before one ask', () => {
    expect(idsBefore(STAGES, 0)).toEqual([])
    expect(idsBefore(STAGES, 2)).toEqual([...questionIds(STAGES[0]), ...questionIds(STAGES[1])])
    expect(idsBefore(STAGES, -3)).toEqual([])
    expect(idsBefore(STAGES, 99)).toHaveLength(STAGES.flatMap(questionIds).length)
  })

  it('opens an old save: the class she had got to, everything before it finished, and what she had answered in it', () => {
    const own = [STAGES[3].npcs![0].id]
    const solved = solvedFromSave({ stageIndex: 3, answeredIds: own }, STAGES)
    expect(solved.size).toBe(idsBefore(STAGES, 3).length + 1)
    expect(solved.has(STAGES[1].npcs![2].id)).toBe(true)
    expect(solved.has(own[0])).toBe(true)
    expect(doneFlags(solved, STAGES).slice(0, 3)).toEqual([true, true, true])
    expect(doneFlags(solved, STAGES)[3]).toBe(false)
  })

  it('opens a new save as it says: the answers, only those, even from classes far apart', () => {
    const answeredIds = [STAGES[9].npcs![0].id, STAGES[1].npcs![0].id]
    expect([...solvedFromSave({ stageIndex: 4, answeredIds, version: 2 }, STAGES)].sort()).toEqual([...answeredIds].sort())
  })

  it('ignores answers that are not questions of any class, and a class number out of range', () => {
    expect(solvedFromSave({ stageIndex: 0, answeredIds: ['nonsense'], version: 2 }, STAGES).size).toBe(0)
    expect(solvedFromSave({ stageIndex: 0, answeredIds: ['nonsense'] }, STAGES).size).toBe(0)
    expect(solvedFromSave({ stageIndex: 99, answeredIds: [] }, STAGES).size).toBe(idsBefore(STAGES, STAGES.length - 1).length)
  })

  it('says how much of the classes is done, 0 to 1', () => {
    expect(classesDoneShare(new Set(), STAGES)).toBe(0)
    expect(classesDoneShare(all(0), STAGES)).toBeCloseTo(1 / STAGES.length)
    expect(classesDoneShare(union(...STAGES.map((_, i) => all(i))), STAGES)).toBe(1)
    expect(classesDoneShare(new Set(), [])).toBe(1)
  })
})
