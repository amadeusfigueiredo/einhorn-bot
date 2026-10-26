import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { doneFlags } from './classProgress'
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
    expect(s.popup).toEqual({ id: 'WIN', token: 1, question: npcKey(0, 0) })
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

  it('ignores an expiry that carries another popup\'s token', () => {
    const afterWrong = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: wrongChoice(0, 0),
    })
    expect(afterWrong.popup).toEqual({ id: 'TRY_AGAIN', token: 1, question: npcKey(0, 0) })
    expect(run(afterWrong, { type: 'POPUP_EXPIRED', token: 99 })).toBe(afterWrong)
  })

  it('does not start a conversation behind a feedback popup', () => {
    const feedback = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: correctChoice(0, 0),
    })
    expect(feedback.popup).not.toBeNull()
    expect(run(feedback, { type: 'TALK', key: npcKey(0, 1) })).toBe(feedback)
  })

  it('allows talking again once the feedback popup has closed', () => {
    const feedback = run(ask(initial(), 0), {
      type: 'ANSWER',
      choiceIndex: wrongChoice(0, 0),
    })
    const closed = run(feedback, { type: 'POPUP_EXPIRED', token: feedback.popup!.token })
    expect(run(closed, { type: 'TALK', key: npcKey(0, 0) }).phase).toBe('talking')
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
  // The last class with three of its four questions answered and every other class finished: one answer from the end.
  const lastStageState = (): GameState => run(initial(), { type: 'DEV_JUMP', stageIndex: last, answered: 3 })

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

  describe('START_OVER (a grown-up starts the school over)', () => {
    it('goes back to class 1 with nothing answered, from the middle of a question', () => {
      const deep = run(initial(), { type: 'JUMP_TO_STAGE', stageIndex: 4 })
      const asking = ask(deep, 0)
      expect(asking.phase).toBe('asking')
      const over = run(asking, { type: 'START_OVER' })
      expect(over).toMatchObject({ phase: 'exploring', stageIndex: 0, visiting: false, activeQuestion: null, popup: null })
      expect(over.solved.size).toBe(0)
      expect(over.answered.size).toBe(0)
    })

    it('works while she visits a finished class, and after the ending, and wipes a popup that is up', () => {
      const far = run(initial(), { type: 'JUMP_TO_STAGE', stageIndex: 3 })
      const visiting = run(far, { type: 'ENTER_STAGE', stageIndex: 1 })
      expect(visiting.visiting).toBe(true)
      expect(run(visiting, { type: 'START_OVER' })).toMatchObject({ stageIndex: 0, visiting: false })
      const ended = run(ask(lastStageState(), 3), { type: 'ANSWER', choiceIndex: correctChoice(last, 3) })
      expect(ended.popup).not.toBeNull()
      expect(run(ended, { type: 'START_OVER' })).toMatchObject({ phase: 'exploring', stageIndex: 0, popup: null })
    })

    it('keeps the count of entries (the corridor walk), and the first class still asks its questions', () => {
      const entered = { ...run(initial(), { type: 'JUMP_TO_STAGE', stageIndex: 2 }), entries: 4 }
      const over = run(entered, { type: 'START_OVER' })
      expect(over.entries).toBe(4)
      expect(run(over, { type: 'TALK', key: npcKey(0, 0) }).phase).toBe('talking')
    })
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

describe('DEV_JUMP (the developers\' jump: into a class with some questions already answered)', () => {
  const dev = (stageIndex: number, answered: number) => run(initial(), { type: 'DEV_JUMP', stageIndex, answered })

  it('goes into the class, with the classes before it finished and its first questions answered', () => {
    const s = dev(4, 2)
    expect(s).toMatchObject({ stageIndex: 4, phase: 'exploring', activeQuestion: null, popup: null, visiting: false })
    // the classes before it are finished, as the stage jumper has always meant it
    expect(doneFlags(s.solved, STAGES).slice(0, 4)).toEqual([true, true, true, true])
    expect([...s.answered]).toEqual(STAGES[4].npcs!.slice(0, 2).map((n) => n.id))
  })

  it('works for the class she is already in too (the stage jumper does nothing there)', () => {
    const answered = run(initial(), { type: 'TALK', key: npcKey(0, 0) }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: correctChoice(0, 0) })
    expect(answered.answered.size).toBe(1)
    const s = run(answered, { type: 'DEV_JUMP', stageIndex: 0, answered: 3 })
    expect(s.answered.size).toBe(3)
    expect(run(answered, { type: 'DEV_JUMP', stageIndex: 0, answered: 0 }).answered.size).toBe(0)
  })

  it('with one question left, answering it finishes the class and goes on to the next one', () => {
    const left = requiredAnswers(STAGES[2]) - 1
    const s = dev(2, left)
    const last = STAGES[2].npcs![left]
    const done = run(s, { type: 'TALK', key: { kind: 'npc', id: last.id } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: last.question.correctIndex })
    expect(done).toMatchObject({ phase: 'nextStage', stageIndex: 3 })
    expect(done.answered.size).toBe(0)
  })

  it('on the last class the last answer is the ending', () => {
    const last = STAGES.length - 1
    const left = requiredAnswers(STAGES[last]) - 1
    const s = dev(last, left)
    const q = STAGES[last].npcs![left]
    expect(run(s, { type: 'TALK', key: { kind: 'npc', id: q.id } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: q.question.correctIndex }).phase).toBe('ending')
  })

  it('never answers them all (the class would be finished and nothing would say so), and never a negative number', () => {
    expect(dev(1, 99).answered.size).toBe(requiredAnswers(STAGES[1]) - 1)
    expect(dev(1, -5).answered.size).toBe(0)
    expect(dev(1, 1.9).answered.size).toBe(1)
  })

  it('keeps to the classes there are', () => {
    expect(dev(99, 0).stageIndex).toBe(STAGES.length - 1)
    expect(dev(-3, 0).stageIndex).toBe(0)
  })

  it('closes whatever is open: a question, a popup, a visit to a finished class', () => {
    const asking = run(initial(), { type: 'TALK', key: npcKey(0, 0) }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: wrongChoice(0, 0) })
    expect(asking.popup).not.toBeNull()
    const s = run(asking, { type: 'DEV_JUMP', stageIndex: 6, answered: 1 })
    expect(s).toMatchObject({ popup: null, activeQuestion: null, phase: 'exploring', stageIndex: 6 })
  })
})

describe('popups remember which question they are about', () => {
  it('a wrong answer carries the question, so the screen can show the right answer', () => {
    const s = run(ask(initial(), 1), { type: 'ANSWER', choiceIndex: wrongChoice(0, 1) })
    expect(s.popup?.id).toBe('TRY_AGAIN')
    expect(s.popup?.question).toEqual(npcKey(0, 1))
    const q = findQuestion(STAGES[0], s.popup!.question!)
    expect(q?.correctIndex).toBe(correctChoice(0, 1))
  })

  it('every right answer carries its question too, also the one that finishes a stage and the one that ends the game', () => {
    let s = initial()
    for (let i = 0; i < 4; i++) {
      s = run(ask(s, i), { type: 'ANSWER', choiceIndex: correctChoice(0, i) })
      expect(s.popup?.question).toEqual(npcKey(0, i))
      s = run(s, { type: 'POPUP_EXPIRED', token: s.popup!.token })
    }
    expect(s.stageIndex).toBe(1)
    const last = run(createInitialState(STAGES, { stageIndex: STAGES.length - 1, answeredIds: STAGES[STAGES.length - 1].npcs!.slice(0, 3).map((n) => n.id) }), {
      type: 'TALK',
      key: npcKey(STAGES.length - 1, 3),
    }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: correctChoice(STAGES.length - 1, 3) })
    expect(last.phase).toBe('ending')
    expect(last.popup?.question).toEqual(npcKey(STAGES.length - 1, 3))
  })

  it('the question is only a note: it changes nothing about what happens next', () => {
    const a = run(ask(initial(), 0), { type: 'ANSWER', choiceIndex: correctChoice(0, 0) })
    expect(a.phase).toBe('correct')
    const gone = run(a, { type: 'POPUP_EXPIRED', token: a.popup!.token })
    expect(gone.popup).toBeNull()
    expect(gone.phase).toBe('exploring')
  })
})
