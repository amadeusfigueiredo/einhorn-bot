import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { createInitialState, isVisiting, questionIds, reduce, type GameEvent, type GameState } from './gameMachine'

const run = (state: GameState, ...events: GameEvent[]) => events.reduce((s, e) => reduce(s, e, STAGES), state)
const npcs = (i: number) => STAGES[i].npcs ?? []
/** The class played the old way: every unicorn asked, every answer right. */
function oldWay(state: GameState): GameState {
  let s = state
  for (const n of npcs(s.stageIndex)) {
    s = run(s, { type: 'TALK', key: { kind: 'npc', id: n.id } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: n.question.correctIndex })
    if (s.popup) s = reduce(s, { type: 'POPUP_EXPIRED', token: s.popup.token }, STAGES)
  }
  return s
}

describe('the teacher\'s lesson is over (LESSON_DONE)', () => {
  it('finishes the class the way the last right answer does: every question answered, the win popup, on to the next class', () => {
    const start = createInitialState(STAGES, null)
    const s = run(start, { type: 'LESSON_DONE' })
    expect(s.popup?.id).toBe('WIN')
    expect(s.phase).toBe('nextStage')
    expect(s.stageIndex).toBe(1)
    expect([...s.solved].sort()).toEqual(questionIds(STAGES[0]).sort())
    expect(oldWay(createInitialState(STAGES, null)).solved).toEqual(s.solved)
  })

  it('keeps what she had solved in other classes', () => {
    const ids = questionIds(STAGES[3])
    const start = createInitialState(STAGES, { stageIndex: 4, answeredIds: ids, version: 2 })
    const s = run(start, { type: 'LESSON_DONE' })
    for (const id of ids) expect(s.solved.has(id)).toBe(true)
    for (const id of questionIds(STAGES[4])) expect(s.solved.has(id)).toBe(true)
  })

  it('does nothing while a talk, a question or a popup is open, or in a class she has already finished', () => {
    const start = createInitialState(STAGES, null)
    const talking = run(start, { type: 'TALK', key: { kind: 'npc', id: npcs(0)[0].id } })
    expect(run(talking, { type: 'LESSON_DONE' })).toBe(talking)
    const finished = run(start, { type: 'LESSON_DONE' })
    expect(run(finished, { type: 'LESSON_DONE' })).toBe(finished)
    const visiting = createInitialState(STAGES, { stageIndex: 0, answeredIds: questionIds(STAGES[0]), version: 2 })
    expect(isVisiting(visiting)).toBe(true)
    expect(run(visiting, { type: 'LESSON_DONE' })).toBe(visiting)
  })

  it('the last class that finishes with others still to do says so, and the whole school finishing is the ending', () => {
    const all = STAGES.flatMap(questionIds)
    const last = STAGES.length - 1
    const lastLeft = all.filter((id) => !questionIds(STAGES[last]).includes(id))
    const end = run(createInitialState(STAGES, { stageIndex: last, answeredIds: lastLeft, version: 2 }), { type: 'LESSON_DONE' })
    expect(end.phase).toBe('ending')
    const firstLeft = all.filter((id) => !questionIds(STAGES[last - 1]).includes(id) && !questionIds(STAGES[last]).includes(id))
    const unfinished = run(createInitialState(STAGES, { stageIndex: last, answeredIds: firstLeft, version: 2 }), { type: 'LESSON_DONE' })
    expect(unfinished.popup?.id).toBe('FINISH_ALL')
  })

  it('the store has a button for it', async () => {
    const { createGameStore } = await import('./gameStore')
    const store = createGameStore({ stages: STAGES, storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, saved: null })
    store.getState().lessonDone()
    expect(store.getState().stageIndex).toBe(1)
    store.getState().dispose()
  })
})
