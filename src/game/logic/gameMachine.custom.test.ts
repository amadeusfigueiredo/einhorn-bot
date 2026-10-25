import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { POPUPS } from '../data/popups'
import type { Gate, StageConfig } from '../types'
import {
  createInitialState,
  findQuestion,
  isStageComplete,
  popupDuration,
  reduce,
  requiredAnswers,
  type GameEvent,
  type GameState,
} from './gameMachine'

// Small made-up stages, to reach the corners the 15 real ones never do: gates, a stage with nowhere to go, a stage that needs fewer answers.
const npc = (id: string) => ({ ...STAGES[0].npcs![0], id })
const base = STAGES[0]
const gateOf = (id: string): Gate => ({ id, area: { x: 0, y: 0, w: 10, h: 10 }, question: base.npcs![0].question })

function stage(over: Partial<StageConfig>): StageConfig {
  return { ...base, gates: [], npcs: [], requiredToAdvance: undefined, ...over }
}
const run = (stages: readonly StageConfig[], state: GameState, ...events: GameEvent[]) => events.reduce((s, e) => reduce(s, e, stages), state)
const right = base.npcs![0].question.correctIndex

describe('questions in gates and unicorns', () => {
  const s = stage({ gates: [gateOf('g1')], npcs: [npc('n1')] })

  it('finds the question of a gate or of a unicorn, each in its own list', () => {
    expect(findQuestion(s, { kind: 'gate', id: 'g1' })).toBeDefined()
    expect(findQuestion(s, { kind: 'npc', id: 'n1' })).toBeDefined()
    expect(findQuestion(s, { kind: 'npc', id: 'g1' })).toBeUndefined()
    expect(findQuestion(s, { kind: 'gate', id: 'n1' })).toBeUndefined()
    expect(findQuestion(s, { kind: 'npc', id: 'nobody' })).toBeUndefined()
  })

  it('a stage with neither gates nor unicorns has no questions', () => {
    const empty = { ...s, gates: undefined, npcs: undefined }
    expect(findQuestion(empty, { kind: 'gate', id: 'g1' })).toBeUndefined()
    expect(findQuestion(empty, { kind: 'npc', id: 'n1' })).toBeUndefined()
    expect(requiredAnswers(empty)).toBe(0)
  })

  it('needs every gate and every unicorn, unless the stage says fewer', () => {
    expect(requiredAnswers(s)).toBe(2)
    expect(requiredAnswers({ ...s, requiredToAdvance: 1 })).toBe(1)
    expect(requiredAnswers({ ...s, requiredToAdvance: 0 })).toBe(0)
  })

  it('is complete once enough are answered', () => {
    expect(isStageComplete(s, new Set())).toBe(false)
    expect(isStageComplete(s, new Set(['g1']))).toBe(false)
    expect(isStageComplete(s, new Set(['g1', 'n1']))).toBe(true)
    expect(isStageComplete({ ...s, requiredToAdvance: 1 }, new Set(['n1']))).toBe(true)
  })

  it('a gate can be talked to and answered like a unicorn', () => {
    const stages = [s]
    const start = createInitialState(stages, null)
    const asking = run(stages, start, { type: 'TALK', key: { kind: 'gate', id: 'g1' } }, { type: 'BEGIN_ASKING' })
    expect(asking.phase).toBe('asking')
    const answered = run(stages, asking, { type: 'ANSWER', choiceIndex: right })
    expect(answered.answered.has('g1')).toBe(true)
    expect(answered.phase).toBe('correct')
  })
})

describe('where a finished class goes on to', () => {
  it('the next class that is still to do, whatever the stage says its next one is (the order is hers to choose)', () => {
    const alone = stage({ npcs: [npc('only')] })
    const stages = [alone, stage({ npcs: [npc('other')] })]
    const start = createInitialState(stages, null)
    const done = run(stages, start, { type: 'TALK', key: { kind: 'npc', id: 'only' } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: right })
    expect(done.stageIndex).toBe(1)
    expect(done.phase).toBe('nextStage')
    expect(done.popup?.id).toBe('WIN')
    expect(done.solved.has('only')).toBe(true)
  })

  it('a stage with a next stage moves on and starts it with nothing answered', () => {
    const a = stage({ name: 'A' as never, npcs: [npc('a1')] })
    const b = stage({ name: 'B' as never, npcs: [npc('b1')] })
    const stages = [a, b]
    const done = run(stages, createInitialState(stages, null), { type: 'TALK', key: { kind: 'npc', id: 'a1' } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: right })
    expect(done.stageIndex).toBe(1)
    expect(done.phase).toBe('nextStage')
    expect(done.answered.size).toBe(0)
  })

  it('the last stage ends the game', () => {
    const last = stage({ npcs: [npc('z')] })
    const done = run([last], createInitialState([last], null), { type: 'TALK', key: { kind: 'npc', id: 'z' } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: right })
    expect(done.phase).toBe('ending')
  })
})

describe('popups closing', () => {
  const s = stage({ npcs: [npc('n1'), npc('n2')] })
  const stages = [s]
  const answeredOne = () => run(stages, createInitialState(stages, null), { type: 'TALK', key: { kind: 'npc', id: 'n1' } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: right })

  it('the popup closes and the child is exploring again, but only for its own token', () => {
    const s1 = answeredOne()
    const stale = reduce(s1, { type: 'POPUP_EXPIRED', token: s1.popup!.token + 7 }, stages)
    expect(stale).toBe(s1)
    const closed = reduce(s1, { type: 'POPUP_EXPIRED', token: s1.popup!.token }, stages)
    expect(closed.popup).toBeNull()
    expect(closed.phase).toBe('exploring')
  })

  it('an expiry with no popup up changes nothing', () => {
    const start = createInitialState(stages, null)
    expect(reduce(start, { type: 'POPUP_EXPIRED', token: 1 }, stages)).toBe(start)
  })

  it('a wrong-answer popup closing also sends the child back to exploring', () => {
    const wrong = run(stages, createInitialState(stages, null), { type: 'TALK', key: { kind: 'npc', id: 'n1' } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: (right + 1) % 4 })
    expect(wrong.phase).toBe('wrong')
    expect(reduce(wrong, { type: 'POPUP_EXPIRED', token: wrong.popup!.token }, stages).phase).toBe('exploring')
  })

  it("the last stage's cheer hands over to the finale card, which has to be closed by hand", () => {
    const only = stage({ npcs: [npc('z')] })
    const win = run([only], createInitialState([only], null), { type: 'TALK', key: { kind: 'npc', id: 'z' } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: right })
    const finale = reduce(win, { type: 'POPUP_EXPIRED', token: win.popup!.token }, [only])
    expect(finale.phase).toBe('ending')
    expect(finale.popup?.id).toBe('GAME_END')
    expect(popupDuration(finale.popup)).toBeNull()
  })

  it('a closing popup does not interrupt a talk in progress', () => {
    const s1 = answeredOne()
    const talking = run(stages, s1, { type: 'TALK', key: { kind: 'npc', id: 'n2' } })
    // (a popup is still up, so the talk waits; once it closes, the talk can start)
    expect(talking.phase).toBe('correct')
    const closed = reduce(s1, { type: 'POPUP_EXPIRED', token: s1.popup!.token }, stages)
    expect(run(stages, closed, { type: 'TALK', key: { kind: 'npc', id: 'n2' } }).phase).toBe('talking')
  })
})

describe('popupDuration', () => {
  it('is nothing without a popup, and the length the popup is configured with', () => {
    expect(popupDuration(null)).toBeNull()
    expect(popupDuration({ id: 'WIN', token: 1 })).toBe(POPUPS.WIN.durationMs)
    expect(popupDuration({ id: 'TRY_AGAIN', token: 2 })).toBe(POPUPS.TRY_AGAIN.durationMs)
    expect(popupDuration({ id: 'GAME_END', token: 3 })).toBeNull()
  })
})
