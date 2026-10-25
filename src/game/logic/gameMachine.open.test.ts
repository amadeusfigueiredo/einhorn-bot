import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { createGameStore } from './gameStore'
import { PROGRESS_STORAGE_KEY, type StorageLike } from '../utils/progressStorage'
import { doneFlags, idsBefore, missingClasses } from './classProgress'
import { createInitialState, isVisiting, questionIds, reduce, toProgress, type GameEvent, type GameState } from './gameMachine'

const run = (state: GameState, ...events: GameEvent[]) => events.reduce((s, e) => reduce(s, e, STAGES), state)
const npcs = (i: number) => STAGES[i].npcs ?? []
const right = (stageIndex: number, id: string) => [...(STAGES[stageIndex].gates ?? []), ...npcs(stageIndex)].find((x) => x.id === id)!.question.correctIndex
const answerOne = (state: GameState, id: string) =>
  run(state, { type: 'TALK', key: { kind: 'npc', id } }, { type: 'BEGIN_ASKING' }, { type: 'ANSWER', choiceIndex: right(state.stageIndex, id) })
const settle = (state: GameState) => (state.popup ? reduce(state, { type: 'POPUP_EXPIRED', token: state.popup.token }, STAGES) : state)
const enter = (state: GameState, stageIndex: number) => reduce(state, { type: 'ENTER_STAGE', stageIndex }, STAGES)

/** Plays the class she is in through to its end (every question right) and lets the popup go. */
function finishClass(state: GameState): GameState {
  let s = state
  for (const n of npcs(s.stageIndex)) if (!s.answered.has(n.id)) s = settle(answerOne(s, n.id))
  return s
}
/** A game in which exactly these classes (0-based) are finished, and she is in class `into`. */
function gameWith(done: number[], into: number): GameState {
  const solved = new Set(done.flatMap((i) => questionIds(STAGES[i])))
  return { ...createInitialState(STAGES, { stageIndex: into, answeredIds: [...solved], version: 2 }) }
}

describe('the game starts: the first class, or where the save says', () => {
  it('a new game: class 1, nothing answered, nothing solved, nobody visiting', () => {
    const s = createInitialState(STAGES, null)
    expect(s).toMatchObject({ stageIndex: 0, phase: 'exploring', visiting: false, entries: 0 })
    expect(s.solved.size).toBe(0)
    expect(s.answered.size).toBe(0)
  })

  it('a save of the new kind: the class she was in and everything she had answered, in any class', () => {
    const ids = [npcs(9)[0].id, ...questionIds(STAGES[1])]
    const s = createInitialState(STAGES, { stageIndex: 4, answeredIds: ids, version: 2 })
    expect(s.stageIndex).toBe(4)
    expect([...s.solved].sort()).toEqual([...ids].sort())
    expect(doneFlags(s.solved, STAGES).filter(Boolean)).toHaveLength(1)
    expect(s.answered.size).toBe(0)
  })

  it('an old save (the class she had got to, and what she had answered there) still opens: everything before that class is finished', () => {
    const s = createInitialState(STAGES, { stageIndex: 3, answeredIds: [npcs(3)[0].id] })
    expect(s.stageIndex).toBe(3)
    expect(doneFlags(s.solved, STAGES).slice(0, 3)).toEqual([true, true, true])
    expect(s.answered.has(npcs(3)[0].id)).toBe(true)
    expect(missingClasses(s.solved, STAGES)).toEqual(STAGES.map((_, i) => i).slice(3))
  })

  it('a save that says it is in a finished class opens it as a visit', () => {
    const s = createInitialState(STAGES, { stageIndex: 2, answeredIds: questionIds(STAGES[2]), version: 2 })
    expect(isVisiting(s)).toBe(true)
  })
})

describe('any class, any time: going in from the corridor', () => {
  it('works for any class at all, whether the ones before it are finished or not, and nothing is lost', () => {
    const s = createInitialState(STAGES, null)
    for (const target of [1, 7, 14]) {
      const there = enter(s, target)
      expect(there.stageIndex).toBe(target)
      expect(there.solved).toBe(s.solved)
      expect(there.visiting).toBe(false)
    }
  })

  it('does nothing for the class she is in already, and keeps to the classes there are', () => {
    const s = gameWith([], 2)
    expect(enter(s, 2)).toBe(s)
    expect(enter(s, 99).stageIndex).toBe(STAGES.length - 1)
    expect(enter(s, -4).stageIndex).toBe(0)
  })

  it('does not work in the middle of a talk, a question or a popup (the question would be lost)', () => {
    const s = gameWith([], 3)
    const talking = run(s, { type: 'TALK', key: { kind: 'npc', id: npcs(3)[0].id } })
    expect(enter(talking, 1)).toBe(talking)
    const asking = reduce(talking, { type: 'BEGIN_ASKING' }, STAGES)
    expect(enter(asking, 1)).toBe(asking)
    const popup = answerOne(s, npcs(3)[0].id)
    expect(popup.popup).not.toBeNull()
    expect(enter(popup, 1)).toBe(popup)
  })

  it('counts the entries, so the game can tell a walk through a corridor door from a class that was finished', () => {
    const s = gameWith([], 4)
    const a = enter(s, 1)
    const b = enter(a, 4)
    expect([a.entries, b.entries]).toEqual([1, 2])
    expect(enter(s, 4).entries).toBe(0)
  })

  it('shows what she has answered in that class (a class she had half done is as she left it)', () => {
    let s = gameWith([], 4)
    const [first, second] = npcs(4).map((n) => n.id)
    s = settle(answerOne(s, first))
    const away = enter(s, 8)
    expect(away.answered.size).toBe(0)
    const back = enter(away, 4)
    expect([...back.answered]).toEqual([first])
    // the answered one is not asked again, the others are
    expect(reduce(back, { type: 'TALK', key: { kind: 'npc', id: first } }, STAGES)).toBe(back)
    expect(reduce(back, { type: 'TALK', key: { kind: 'npc', id: second } }, STAGES).phase).toBe('talking')
  })

  it('what she answered in one class stays when she goes to another and comes back: nothing is held back or lost', () => {
    let s = gameWith([], 6)
    const first = npcs(6)[0].id
    s = settle(answerOne(s, first))
    s = enter(enter(enter(s, 2), 0), 6)
    expect([...s.answered]).toEqual([first])
    expect(s.solved.has(first)).toBe(true)
  })
})

describe('a finished class she visits: nobody asks again', () => {
  const visit = (done: number[], target: number) => enter(gameWith(done, 0), target)

  it('is a visit, with every question of the class answered (so no unicorn has a "!" and none starts a question by itself)', () => {
    const s = visit([2, 5], 2)
    expect(isVisiting(s)).toBe(true)
    expect([...s.answered].sort()).toEqual(questionIds(STAGES[2]).sort())
  })

  it('every class of the school is a visit once it is finished', () => {
    for (let target = 0; target < STAGES.length; target++) {
      const s = enter(gameWith([target], (target + 1) % STAGES.length), target)
      expect(isVisiting(s), `class ${target + 1}`).toBe(true)
      expect(s.answered.size).toBe(questionIds(STAGES[target]).length)
    }
  })

  it('a class that is not finished is not a visit, and knows what is visiting by the state alone', () => {
    expect(isVisiting(visit([], 3))).toBe(false)
    expect(isVisiting({ visiting: true })).toBe(true)
    expect(isVisiting({ visiting: false })).toBe(false)
  })

  it('talking to a unicorn there is a greeting, not a question: the talk opens, and "continue" ends it', () => {
    let s = visit([2], 2)
    const id = npcs(2)[0].id
    s = reduce(s, { type: 'TALK', key: { kind: 'npc', id } }, STAGES)
    expect(s.phase).toBe('talking')
    expect(s.activeQuestion).toEqual({ kind: 'npc', id })
    s = reduce(s, { type: 'BEGIN_ASKING' }, STAGES)
    expect(s.phase).toBe('exploring')
    expect(s.activeQuestion).toBeNull()
  })

  it('never reaches the question, and never counts an answer', () => {
    let s = visit([2], 2)
    const id = npcs(2)[0].id
    s = run(s, { type: 'TALK', key: { kind: 'npc', id } }, { type: 'BEGIN_ASKING' })
    expect(reduce(s, { type: 'ANSWER', choiceIndex: right(2, id) }, STAGES)).toBe(s)
    const forced: GameState = { ...s, phase: 'asking', activeQuestion: { kind: 'npc', id } }
    expect(reduce(forced, { type: 'ANSWER', choiceIndex: right(2, id) }, STAGES)).toBe(forced)
    expect(reduce(forced, { type: 'ANSWER', choiceIndex: 99 }, STAGES)).toBe(forced)
  })

  it('every unicorn of the class greets her, one after another, and nothing changes', () => {
    let s = visit([1], 1)
    const solved = s.solved
    for (const n of npcs(1)) {
      s = reduce(s, { type: 'TALK', key: { kind: 'npc', id: n.id } }, STAGES)
      expect(s.phase).toBe('talking')
      s = reduce(s, { type: 'BEGIN_ASKING' }, STAGES)
      expect(s.phase).toBe('exploring')
    }
    expect(s.solved).toBe(solved)
    expect(s.popup).toBeNull()
  })

  it('a unicorn that is not in the class does not greet her', () => {
    const s = visit([2], 2)
    expect(reduce(s, { type: 'TALK', key: { kind: 'npc', id: 'nobody' } }, STAGES)).toBe(s)
  })
})

describe('finishing a class', () => {
  it('goes on to the next class that is still to do', () => {
    const s = finishClass(gameWith([], 0))
    expect(s.stageIndex).toBe(1)
    expect(s.visiting).toBe(false)
    expect(s.answered.size).toBe(0)
    expect(s.phase).toBe('exploring')
  })

  it('skips the classes that are done already, wherever they are', () => {
    const s = finishClass(gameWith([1, 2, 3], 0))
    expect(s.stageIndex).toBe(4)
  })

  it('a class she did in any order counts: finishing class 5 first, then class 2, leaves the rest to do', () => {
    let s = finishClass(enter(gameWith([], 0), 4))
    expect(missingClasses(s.solved, STAGES)).not.toContain(4)
    s = finishClass(enter(s, 1))
    expect(missingClasses(s.solved, STAGES)).toEqual(STAGES.map((_, i) => i).filter((i) => i !== 4 && i !== 1))
  })

  it('goes round to the beginning when the classes after it are done', () => {
    const all = STAGES.map((_, i) => i)
    const s = finishClass(gameWith(all.filter((i) => i > 5 || i === 2), 5))
    expect(s.stageIndex).toBe(0)
  })

  it('says "right!" and moves on in the same step: the next-stage popup, the next class is not a visit', () => {
    let s = gameWith([], 0)
    const ids = npcs(0).map((n) => n.id)
    for (const id of ids.slice(0, -1)) s = settle(answerOne(s, id))
    s = answerOne(s, ids[ids.length - 1])
    expect(s).toMatchObject({ phase: 'nextStage', stageIndex: 1, visiting: false })
    expect(s.popup?.id).toBe('WIN')
  })
})

describe('the last class (15) with other classes still to do: "you have to do all of them"', () => {
  it('says so instead of ending the game: the "class done, not the whole school" message, and she stays in the class', () => {
    const s = finishClass(gameWith([], STAGES.length - 1))
    // (the last answer's message is still up: finishClass lets it go, so look at the one before it)
    const last = STAGES.length - 1
    let t = gameWith([], last)
    const ids = npcs(last).map((n) => n.id)
    for (const id of ids.slice(0, -1)) t = settle(answerOne(t, id))
    t = answerOne(t, ids[ids.length - 1])
    expect(t.popup?.id).toBe('FINISH_ALL')
    expect(t).toMatchObject({ phase: 'correct', stageIndex: last, visiting: true })
    expect(missingClasses(t.solved, STAGES)).toEqual(STAGES.map((_, i) => i).filter((i) => i !== last))
    // and when it goes away she is walking about in the finished class, which greets her
    expect(settle(t)).toMatchObject({ phase: 'exploring', popup: null, stageIndex: last })
    expect(s.phase).toBe('exploring')
  })

  it('does not end the game, whatever she plays: no ending, no game-end card', () => {
    const s = finishClass(gameWith([0, 1, 2], STAGES.length - 1))
    expect(s.phase).toBe('exploring')
    expect(s.popup).toBeNull()
  })
})

describe('the ending: only when every class is done', () => {
  it('the last class to be done, whichever it is, is the ending', () => {
    const all = STAGES.map((_, i) => i)
    for (const missing of [0, 6, 14]) {
      let s = gameWith(all.filter((i) => i !== missing), missing)
      const ids = npcs(missing).map((n) => n.id)
      for (const id of ids.slice(0, -1)) s = settle(answerOne(s, id))
      s = answerOne(s, ids[ids.length - 1])
      expect(s.phase, `class ${missing + 1}`).toBe('ending')
      expect(s.popup?.id).toBe('WIN')
      expect(missingClasses(s.solved, STAGES)).toEqual([])
      // the winning popup hands over to the ending card that waits for the child
      const end = reduce(s, { type: 'POPUP_EXPIRED', token: s.popup!.token }, STAGES)
      expect(end.popup?.id).toBe('GAME_END')
    }
  })

  it('"play again" is back at the first class with nothing solved', () => {
    const all = STAGES.map((_, i) => i)
    let s = gameWith(all.slice(0, -1), STAGES.length - 1)
    for (const n of npcs(STAGES.length - 1)) s = settle(answerOne(s, n.id))
    expect(s.phase).toBe('ending')
    expect(s.popup?.id).toBe('GAME_END')
    s = reduce(s, { type: 'RESTART' }, STAGES)
    expect(s).toMatchObject({ stageIndex: 0, phase: 'exploring', visiting: false, popup: null })
    expect(s.solved.size).toBe(0)
    expect(s.answered.size).toBe(0)
  })

  it('"start over" (the corner for grown-ups) forgets everything, wherever she is', () => {
    const s = reduce(enter(gameWith([0, 1, 2, 8], 8), 1), { type: 'START_OVER' }, STAGES)
    expect(s).toMatchObject({ stageIndex: 0, phase: 'exploring', visiting: false })
    expect(s.solved.size).toBe(0)
  })
})

describe('the developers\' jumps', () => {
  it('the stage jumper puts her in the class with the classes before it finished', () => {
    const s = reduce(gameWith([], 0), { type: 'JUMP_TO_STAGE', stageIndex: 6 }, STAGES)
    expect(s.stageIndex).toBe(6)
    expect([...s.solved].sort()).toEqual(idsBefore(STAGES, 6).sort())
    expect(missingClasses(s.solved, STAGES)).toEqual(STAGES.map((_, i) => i).filter((i) => i >= 6))
  })

  it('does nothing for the class she is in', () => {
    const s = gameWith([], 3)
    expect(reduce(s, { type: 'JUMP_TO_STAGE', stageIndex: 3 }, STAGES)).toBe(s)
  })
})

describe('what is saved', () => {
  it('is the class she is in and everything she has answered, in any class, in the new kind of save', () => {
    let s = gameWith([], 4)
    const first = npcs(4)[0].id
    s = settle(answerOne(s, first))
    expect(toProgress(s)).toEqual({ stageIndex: 4, answeredIds: [first], version: 2 })
    // another class she did: it is in the save too
    const other = enter(s, 9)
    expect(toProgress(other)).toEqual({ stageIndex: 9, answeredIds: [first], version: 2 })
  })

  it('survives a reload: the classes she did are done again, in any order', () => {
    const data = new Map<string, string>()
    const storage: StorageLike = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
    const timers = { set: () => 0, clear: () => {} }
    const store = createGameStore({ stages: STAGES, storage, saved: null, timers })
    store.getState().enterStage(7)
    for (const n of npcs(7)) {
      store.getState().interact({ kind: 'npc', id: n.id })
      store.getState().beginAsking()
      store.getState().answer(right(7, n.id))
      const popup = store.getState().popup
      if (popup) store.getState().dispatch({ type: 'POPUP_EXPIRED', token: popup.token })
    }
    expect(doneFlags(store.getState().solved, STAGES)[7]).toBe(true)
    const saved = JSON.parse(data.get(PROGRESS_STORAGE_KEY)!)
    expect(saved.version).toBe(2)
    const again = createGameStore({ stages: STAGES, storage, saved, timers })
    expect(doneFlags(again.getState().solved, STAGES)[7]).toBe(true)
    expect(doneFlags(again.getState().solved, STAGES).filter(Boolean)).toHaveLength(1)
  })

  it('saves when she goes into another class (where she is is saved), and not when nothing changed', () => {
    const data = new Map<string, string>()
    let writes = 0
    const storage: StorageLike = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void (writes++, data.set(k, v)), removeItem: (k) => void data.delete(k) }
    const store = createGameStore({ stages: STAGES, storage, saved: null, timers: { set: () => 0, clear: () => {} } })
    store.getState().enterStage(3)
    expect(JSON.parse(data.get(PROGRESS_STORAGE_KEY)!).stageIndex).toBe(3)
    const before = writes
    store.getState().enterStage(3)
    expect(writes).toBe(before)
  })
})

describe('"keep playing" after the ending', () => {
  const ended = () => {
    const all = STAGES.map((_, i) => i)
    let s = gameWith(all.slice(0, -1), STAGES.length - 1)
    for (const n of npcs(STAGES.length - 1)) s = settle(answerOne(s, n.id))
    return s
  }

  it('closes the ending card and goes on playing in the class she is in, with everything still done', () => {
    const s = ended()
    expect(s.popup?.id).toBe('GAME_END')
    const on = reduce(s, { type: 'KEEP_PLAYING' }, STAGES)
    expect(on).toMatchObject({ phase: 'exploring', popup: null, activeQuestion: null, stageIndex: STAGES.length - 1, visiting: true })
    expect(missingClasses(on.solved, STAGES)).toEqual([])
    // she can go into any class (all finished: she only visits) and talk to the unicorns
    expect(enter(on, 3).visiting).toBe(true)
  })

  it('only works on the ending card (not before the game is won, not while the winning message is still up)', () => {
    const start = createInitialState(STAGES, null)
    expect(reduce(start, { type: 'KEEP_PLAYING' }, STAGES)).toBe(start)
    const winning = answerOne(gameWith(STAGES.map((_, i) => i).slice(0, -1), STAGES.length - 1), npcs(STAGES.length - 1)[0].id)
    expect(reduce(winning, { type: 'KEEP_PLAYING' }, STAGES)).toBe(winning)
    const last = (() => {
      let s = gameWith(STAGES.map((_, i) => i).slice(0, -1), STAGES.length - 1)
      const ids = npcs(STAGES.length - 1).map((n) => n.id)
      for (const id of ids.slice(0, -1)) s = settle(answerOne(s, id))
      return answerOne(s, ids[ids.length - 1])
    })()
    expect(last.popup?.id).toBe('WIN')
    expect(reduce(last, { type: 'KEEP_PLAYING' }, STAGES)).toBe(last)
  })

  it('the store has a keepPlaying action for the finale card', () => {
    const store = createGameStore({ stages: STAGES, storage: null, saved: { stageIndex: STAGES.length - 1, answeredIds: STAGES.flatMap(questionIds).slice(0, -1), version: 2 }, timers: { set: () => 0, clear: () => {} } })
    const last = npcs(STAGES.length - 1).at(-1)!
    store.getState().interact({ kind: 'npc', id: last.id })
    store.getState().beginAsking()
    store.getState().answer(right(STAGES.length - 1, last.id))
    store.getState().dispatch({ type: 'POPUP_EXPIRED', token: store.getState().popup!.token })
    expect(store.getState().popup?.id).toBe('GAME_END')
    store.getState().keepPlaying()
    expect(store.getState()).toMatchObject({ phase: 'exploring', popup: null })
  })
})
