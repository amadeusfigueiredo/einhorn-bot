import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { createInitialState, reduce, type GameEvent } from '../logic/gameMachine'
import { soundForTransition, voiceForTransition } from './soundForTransition'
import { pitchFor } from './voice'

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

describe('voiceForTransition', () => {
  const talk = (id: string) => step(start, { type: 'TALK', key: { kind: 'npc', id } })

  it('says nothing when nothing changed', () => {
    expect(voiceForTransition(start, start)).toBeNull()
  })

  it('says "hi!" when a conversation opens, in the voice of that unicorn', () => {
    const talking = talk(npc.id)
    expect(voiceForTransition(start, talking)).toEqual({ name: 'hello', pitch: pitchFor(npc.id) })
    // Every unicorn keeps its own voice, every time.
    expect(voiceForTransition(start, talk(npc.id))!.pitch).toBe(voiceForTransition(start, talking)!.pitch)
    const other = STAGES[0].npcs!.find((n) => pitchFor(n.id) !== pitchFor(npc.id))
    expect(other).toBeDefined()
    expect(voiceForTransition(start, talk(other!.id))!.pitch).not.toBe(pitchFor(npc.id))
  })

  it('says nothing while the talk goes on to the question', () => {
    const talking = talk(npc.id)
    expect(voiceForTransition(talking, step(talking, { type: 'BEGIN_ASKING' }))).toBeNull()
  })

  it('cheers "yay!" for a right answer and says a gentle "uh-oh" for a wrong one', () => {
    let s = talk(npc.id)
    s = step(s, { type: 'BEGIN_ASKING' })
    const right = step(s, { type: 'ANSWER', choiceIndex: npc.question.correctIndex })
    const wrong = step(s, { type: 'ANSWER', choiceIndex: (npc.question.correctIndex + 1) % 4 })
    expect(voiceForTransition(s, right)).toEqual({ name: 'yay', pitch: 1 })
    expect(voiceForTransition(s, wrong)).toEqual({ name: 'uhoh', pitch: 1 })
  })

  it('leaves the stage jump to the stage card', () => {
    expect(voiceForTransition(start, step(start, { type: 'JUMP_TO_STAGE', stageIndex: 3 }))).toBeNull()
  })

  it('leaves the ending to its own film', () => {
    const ending = { ...start, popup: { id: 'GAME_END', token: 99 } } as unknown as typeof start
    expect(soundForTransition(start, ending)).toBe('fanfare')
    expect(voiceForTransition(start, ending)).toBeNull()
  })

  it('a popup that is already showing does not speak again', () => {
    let s = talk(npc.id)
    s = step(s, { type: 'BEGIN_ASKING' })
    const right = step(s, { type: 'ANSWER', choiceIndex: npc.question.correctIndex })
    expect(voiceForTransition(right, { ...right })).toBeNull()
  })
})
