import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import {
  createInitialState,
  findQuestion,
  isStageComplete,
  reduce,
  requiredAnswers,
  type GameEvent,
  type GameState,
} from './gameMachine'

const initial = () => createInitialState(STAGES, null)

function run(state: GameState, ...events: GameEvent[]): GameState {
  return events.reduce((s, e) => reduce(s, e, STAGES), state)
}

function npcKey(stageIndex: number, npcIndex: number) {
  return { kind: 'npc' as const, id: STAGES[stageIndex].npcs![npcIndex].id }
}

function correctChoice(stageIndex: number, npcIndex: number) {
  return STAGES[stageIndex].npcs![npcIndex].question.correctIndex
}

function wrongChoice(stageIndex: number, npcIndex: number) {
  return (correctChoice(stageIndex, npcIndex) + 1) % 4
}

function ask(state: GameState, npcIndex: number): GameState {
  return run(
    state,
    { type: 'TALK', key: npcKey(state.stageIndex, npcIndex) },
    { type: 'BEGIN_ASKING' }
  )
}

describe('createInitialState', () => {
  it('starts exploring stage 1 with nothing answered', () => {
    const s = initial()
    expect(s).toMatchObject({
      phase: 'exploring',
      stageIndex: 0,
      activeQuestion: null,
      popup: null,
    })
    expect(s.answered.size).toBe(0)
  })

  it('restores saved progress, clamping an out-of-range stage', () => {
    const ids = [STAGES[3].npcs![0].id]
    const s = createInitialState(STAGES, { stageIndex: 3, answeredIds: ids })
    expect(s.stageIndex).toBe(3)
    expect([...s.answered]).toEqual(ids)

    const clamped = createInitialState(STAGES, {
      stageIndex: 999,
      answeredIds: ['whatever'],
    })
    expect(clamped.stageIndex).toBe(STAGES.length - 1)
  })
})

describe('talking and asking', () => {
  it('goes exploring -> talking -> asking for a known NPC', () => {
    const key = npcKey(0, 0)
    const talking = run(initial(), { type: 'TALK', key })
    expect(talking.phase).toBe('talking')
    expect(talking.activeQuestion).toEqual(key)
    expect(run(talking, { type: 'BEGIN_ASKING' }).phase).toBe('asking')
  })

  it('ignores unknown NPCs and NPCs from another stage', () => {
    const s = initial()
    expect(run(s, { type: 'TALK', key: { kind: 'npc', id: 'nope' } })).toBe(s)
    expect(run(s, { type: 'TALK', key: npcKey(1, 0) })).toBe(s)
  })

  it('ignores BEGIN_ASKING / ANSWER outside their phase', () => {
    const s = initial()
    expect(run(s, { type: 'BEGIN_ASKING' })).toBe(s)
    expect(run(s, { type: 'ANSWER', choiceIndex: 0 })).toBe(s)
  })

  it('does not reopen an NPC that was already answered', () => {
    const answered = run(
      ask(initial(), 0),
      { type: 'ANSWER', choiceIndex: correctChoice(0, 0) },
      { type: 'POPUP_EXPIRED', token: 1 }
    )
    expect(run(answered, { type: 'TALK', key: npcKey(0, 0) })).toBe(answered)
  })

  it('cannot start a second conversation while one is open', () => {
    const asking = ask(initial(), 0)
    expect(run(asking, { type: 'TALK', key: npcKey(0, 1) })).toBe(asking)
  })
})

describe('answering', () => {
  it('a correct answer records progress and shows the WIN popup', () => {
    const s = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: correctChoice(0, 0),
    })
    expect(s.phase).toBe('correct')
    expect(s.popup).toEqual({ id: 'WIN', token: 1 })
    expect(s.answered.has(STAGES[0].npcs![0].id)).toBe(true)
    expect(s.activeQuestion).toBeNull()
  })

  it('a wrong answer shows TRY_AGAIN and records nothing', () => {
    const s = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: wrongChoice(0, 0),
    })
    expect(s.phase).toBe('wrong')
    expect(s.popup?.id).toBe('TRY_AGAIN')
    expect(s.answered.size).toBe(0)
  })

  it('lets the same NPC be tried again after a wrong answer', () => {
    const wrong = run(
      ask(initial(), 0),
      { type: 'ANSWER', choiceIndex: wrongChoice(0, 0) },
      { type: 'POPUP_EXPIRED', token: 1 }
    )
    expect(wrong.phase).toBe('exploring')
    expect(ask(wrong, 0).phase).toBe('asking')
  })

  it('does not mutate the previous state', () => {
    const before = ask(initial(), 0)
    const frozenAnswered = new Set(before.answered)
    run(before, { type: 'ANSWER', choiceIndex: correctChoice(0, 0) })
    expect(before.answered).toEqual(frozenAnswered)
    expect(before.phase).toBe('asking')
  })
})

describe('popups', () => {
  it('expiry returns the feedback phases to exploring', () => {
    const s = run(
      ask(initial(), 0),
      { type: 'ANSWER', choiceIndex: correctChoice(0, 0) },
      { type: 'POPUP_EXPIRED', token: 1 }
    )
    expect(s.phase).toBe('exploring')
    expect(s.popup).toBeNull()
  })

  it('ignores an expiry for a popup that has already been replaced', () => {
    const afterWrong = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: wrongChoice(0, 0),
    })
    const afterSecond = run(
      afterWrong,
      { type: 'TALK', key: npcKey(0, 1) },
      { type: 'BEGIN_ASKING' },
      { type: 'ANSWER', choiceIndex: correctChoice(0, 1) }
    )
    expect(afterSecond.popup).toEqual({ id: 'WIN', token: 2 })
    // The first popup's timer fires late: must not close the new popup.
    expect(run(afterSecond, { type: 'POPUP_EXPIRED', token: 1 })).toBe(
      afterSecond
    )
  })

  it('keeps the world interactive behind a feedback popup (as before)', () => {
    const feedback = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: correctChoice(0, 0),
    })
    expect(run(feedback, { type: 'TALK', key: npcKey(0, 1) }).phase).toBe(
      'talking'
    )
  })
})

describe('stage completion', () => {
  function answerWholeStage(state: GameState): GameState {
    let s = state
    const stage = STAGES[s.stageIndex]
    const stageIndex = s.stageIndex
    for (let i = 0; i < requiredAnswers(stage); i++) {
      s = ask(s, i)
      s = run(s, { type: 'ANSWER', choiceIndex: correctChoice(stageIndex, i) })
      if (i < requiredAnswers(stage) - 1) {
        s = run(s, { type: 'POPUP_EXPIRED', token: s.popup!.token })
      }
    }
    return s
  }

  it('advances to the next stage with a fresh answer set', () => {
    const s = answerWholeStage(initial())
    expect(s.phase).toBe('nextStage')
    expect(s.stageIndex).toBe(1)
    expect(s.answered.size).toBe(0)
    expect(s.popup?.id).toBe('WIN')
  })

  it('only needs requiredToAdvance answers, not every NPC', () => {
    const stage = { ...STAGES[0], requiredToAdvance: 1 }
    expect(isStageComplete(stage, new Set(['a']))).toBe(true)
    expect(isStageComplete(stage, new Set())).toBe(false)
  })

  it('finds questions by kind and id', () => {
    const npc = STAGES[0].npcs![0]
    expect(findQuestion(STAGES[0], { kind: 'npc', id: npc.id })).toBe(
      npc.question
    )
    expect(findQuestion(STAGES[0], { kind: 'gate', id: npc.id })).toBeUndefined()
  })
})

describe('ending', () => {
  const last = STAGES.length - 1
  const lastStageState = (): GameState => ({
    ...initial(),
    stageIndex: last,
    answered: new Set(
      STAGES[last].npcs!.slice(0, 3).map((n) => n.id)
    ),
  })

  it('shows WIN then GAME_END after the final stage, and RESTART starts over', () => {
    const s0 = lastStageState()
    const s1 = run(ask(s0, 3), {
      type: 'ANSWER',
      choiceIndex: correctChoice(last, 3),
    })
    expect(s1.phase).toBe('ending')
    expect(s1.popup?.id).toBe('WIN')

    const s2 = run(s1, { type: 'POPUP_EXPIRED', token: s1.popup!.token })
    expect(s2.phase).toBe('ending')
    expect(s2.popup?.id).toBe('GAME_END')

    const s3 = run(s2, { type: 'RESTART' })
    expect(s3).toMatchObject({
      phase: 'exploring',
      stageIndex: 0,
      popup: null,
    })
    expect(s3.answered.size).toBe(0)
  })

  it('cannot RESTART before the GAME_END popup is showing', () => {
    const s1 = run(ask(lastStageState(), 3), {
      type: 'ANSWER',
      choiceIndex: correctChoice(last, 3),
    })
    expect(run(s1, { type: 'RESTART' })).toBe(s1)
  })

  it('does not open new conversations once the game is over', () => {
    const ended = run(ask(lastStageState(), 3), {
      type: 'ANSWER',
      choiceIndex: correctChoice(last, 3),
    })
    expect(run(ended, { type: 'TALK', key: npcKey(last, 0) })).toBe(ended)
  })
})

describe('JUMP_TO_STAGE', () => {
  it('clears answers and any open question', () => {
    const asking = ask(initial(), 0)
    const jumped = run(asking, { type: 'JUMP_TO_STAGE', stageIndex: 5 })
    expect(jumped).toMatchObject({
      phase: 'exploring',
      stageIndex: 5,
      activeQuestion: null,
    })
    expect(jumped.answered.size).toBe(0)
  })

  it('clamps out-of-range targets and ignores jumping to the current stage', () => {
    const s = initial()
    expect(run(s, { type: 'JUMP_TO_STAGE', stageIndex: 0 })).toBe(s)
    expect(run(s, { type: 'JUMP_TO_STAGE', stageIndex: -4 })).toBe(s)
    expect(run(s, { type: 'JUMP_TO_STAGE', stageIndex: 99 }).stageIndex).toBe(
      STAGES.length - 1
    )
  })
})
