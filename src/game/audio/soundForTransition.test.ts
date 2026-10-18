import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { createInitialState, reduce, type GameEvent } from '../logic/gameMachine'
import { soundForTransition } from './soundForTransition'

const start = createInitialState(STAGES, null)
const npc = STAGES[0].npcs![0]

function step(state: typeof start, event: GameEvent) {
  return reduce(state, event, STAGES)
}

describe('soundForTransition', () => {
  it('plays nothing when nothing changed', () => {
    expect(soundForTransition(start, start)).toBeNull()
  })

  it('selects when a conversation opens', () => {
    const talking = step(start, { type: 'TALK', key: { kind: 'npc', id: npc.id } })
    expect(soundForTransition(start, talking)).toBe('select')
    expect(soundForTransition(talking, step(talking, { type: 'BEGIN_ASKING' }))).toBeNull()
  })

  it('chimes for right answers and boops for wrong ones', () => {
    let s = step(start, { type: 'TALK', key: { kind: 'npc', id: npc.id } })
    s = step(s, { type: 'BEGIN_ASKING' })
    const right = step(s, { type: 'ANSWER', choiceIndex: npc.question.correctIndex })
    const wrong = step(s, { type: 'ANSWER', choiceIndex: (npc.question.correctIndex + 1) % 4 })
    expect(soundForTransition(s, right)).toBe('correct')
    expect(soundForTransition(s, wrong)).toBe('wrong')
  })

  it('whooshes on a stage jump', () => {
    expect(
      soundForTransition(start, step(start, { type: 'JUMP_TO_STAGE', stageIndex: 3 }))
    ).toBe('stage')
  })
})
