import { afterEach, describe, expect, it, vi } from 'vitest'
import { STAGES } from '../constants/stages'
import { POPUPS } from '../data/popups'
import { idsBefore } from './classProgress'
import { createGameStore } from './gameStore'
import { PROGRESS_STORAGE_KEY, type StorageLike } from '../utils/progressStorage'

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

/** Manual clock so popup timers fire exactly when the test says. */
function fakeTimers() {
  let now = 0
  let nextId = 1
  const queue = new Map<number, { at: number; fn: () => void }>()
  return {
    set: (fn: () => void, ms: number) => {
      const id = nextId++
      queue.set(id, { at: now + ms, fn })
      return id
    },
    clear: (handle: unknown) => void queue.delete(handle as number),
    advance(ms: number) {
      now += ms
      for (const [id, t] of [...queue]) {
        if (t.at <= now) {
          queue.delete(id)
          t.fn()
        }
      }
    },
    pending: () => queue.size,
  }
}

function setup(saved = null as Parameters<typeof createGameStore>[0]['saved']) {
  const storage = fakeStorage()
  const timers = fakeTimers()
  const store = createGameStore({ stages: STAGES, storage, saved, timers })
  const savedProgress = () =>
    JSON.parse(storage.data.get(PROGRESS_STORAGE_KEY) ?? 'null')
  return { store, timers, savedProgress }
}

describe('full playthrough', () => {
  it('plays every stage from the first NPC to the ending and restarts', () => {
    const { store, timers, savedProgress } = setup()
    const game = () => store.getState()

    STAGES.forEach((stage, stageIndex) => {
      expect(game().stageIndex).toBe(stageIndex)
      expect(game().answered.size).toBe(0)

      stage.npcs!.forEach((npc, i) => {
        game().interact({ kind: 'npc', id: npc.id })
        expect(game().phase).toBe('talking')
        game().beginAsking()
        expect(game().phase).toBe('asking')

        game().answer(npc.question.correctIndex)
        const isLastNpc = i === stage.npcs!.length - 1
        const isLastStage = stageIndex === STAGES.length - 1

        expect(game().popup?.id).toBe('WIN')
        expect(game().phase).toBe(
          !isLastNpc ? 'correct' : isLastStage ? 'ending' : 'nextStage'
        )
        if (!isLastNpc) {
          // what is saved is every answer so far: the classes finished before this one, and the ones given here
          expect(savedProgress()).toEqual({
            stageIndex,
            answeredIds: [...idsBefore(STAGES, stageIndex), ...stage.npcs!.slice(0, i + 1).map((n) => n.id)],
            version: 2,
          })
        }
        timers.advance(POPUPS.WIN.durationMs!)
      })
    })

    // After the last WIN popup the manual-close ending takes over.
    expect(game().phase).toBe('ending')
    expect(game().popup?.id).toBe('GAME_END')
    expect(game().stageIndex).toBe(STAGES.length - 1)
    expect(timers.pending()).toBe(0)

    game().restart()
    expect(game()).toMatchObject({
      phase: 'exploring',
      stageIndex: 0,
      popup: null,
    })
    expect(savedProgress()).toEqual({ stageIndex: 0, answeredIds: [], version: 2 })
  })
})

describe('wrong answers', () => {
  it('shows TRY_AGAIN for its duration and saves nothing', () => {
    const { store, timers, savedProgress } = setup()
    const npc = STAGES[0].npcs![0]

    store.getState().interact({ kind: 'npc', id: npc.id })
    store.getState().beginAsking()
    store.getState().answer((npc.question.correctIndex + 1) % 4)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
    expect(savedProgress()).toBeNull()

    timers.advance(POPUPS.TRY_AGAIN.durationMs! - 1)
    expect(store.getState().popup).not.toBeNull()
    timers.advance(1)
    expect(store.getState()).toMatchObject({ popup: null, phase: 'exploring' })
  })

  it('a second conversation cannot start while a popup is showing, and the popup keeps its full time', () => {
    const { store, timers } = setup()
    const [a, b] = STAGES[0].npcs!

    store.getState().interact({ kind: 'npc', id: a.id })
    store.getState().beginAsking()
    store.getState().answer((a.question.correctIndex + 1) % 4) // 5s popup
    timers.advance(3000)
    store.getState().interact({ kind: 'npc', id: b.id })
    expect(store.getState().phase).toBe('wrong')
    expect(store.getState().activeQuestion).toBeNull()

    timers.advance(1999) // t=4999
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
    timers.advance(1) // t=5000
    expect(store.getState().popup).toBeNull()

    store.getState().interact({ kind: 'npc', id: b.id })
    expect(store.getState().phase).toBe('talking')
  })
})

describe('persistence', () => {
  it('restores the saved stage and answers', () => {
    const id = STAGES[4].npcs![0].id
    const { store } = setup({ stageIndex: 4, answeredIds: [id] })
    expect(store.getState().stageIndex).toBe(4)
    expect(store.getState().answered.has(id)).toBe(true)
  })

  it('jumping stages saves the new stage, with the classes before it finished', () => {
    const { store, savedProgress } = setup()
    store.getState().jumpToStage(7)
    expect(savedProgress()).toEqual({ stageIndex: 7, answeredIds: idsBefore(STAGES, 7), version: 2 })
  })

  it('dispose cancels pending popup timers', () => {
    const { store, timers } = setup()
    const npc = STAGES[0].npcs![0]
    store.getState().interact({ kind: 'npc', id: npc.id })
    store.getState().beginAsking()
    store.getState().answer(npc.question.correctIndex)
    expect(timers.pending()).toBe(1)
    store.getState().dispose()
    expect(timers.pending()).toBe(0)
  })
})

describe('pausing', () => {
  // The real timers, on a clock the test turns by hand.
  const live = () => {
    vi.useFakeTimers()
    const store = createGameStore({ stages: STAGES, storage: fakeStorage(), saved: null })
    const npc = STAGES[0].npcs![0]
    store.getState().interact({ kind: 'npc', id: npc.id })
    store.getState().beginAsking()
    return { store, npc }
  }
  const wrong = (store: ReturnType<typeof live>['store'], npc: ReturnType<typeof live>['npc']) => store.getState().answer((npc.question.correctIndex + 1) % 4)
  afterEach(() => vi.useRealTimers())

  it('a popup stays while paused, however long the child is away', () => {
    const { store, npc } = live()
    wrong(store, npc)
    store.getState().setPaused(true)
    vi.advanceTimersByTime(60_000)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
  })

  it('and gets exactly the time it had left when the game goes on', () => {
    const { store, npc } = live()
    wrong(store, npc)
    const total = POPUPS.TRY_AGAIN.durationMs!
    vi.advanceTimersByTime(2000)
    store.getState().setPaused(true)
    vi.advanceTimersByTime(30_000)
    store.getState().setPaused(false)
    vi.advanceTimersByTime(total - 2000 - 1)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
    vi.advanceTimersByTime(1)
    expect(store.getState().popup).toBeNull()
  })

  it('pausing twice in a row, or going on without a pause, changes nothing', () => {
    const { store, npc } = live()
    wrong(store, npc)
    store.getState().setPaused(false)
    store.getState().setPaused(true)
    vi.advanceTimersByTime(1000)
    store.getState().setPaused(true)
    store.getState().setPaused(false)
    store.getState().setPaused(false)
    vi.advanceTimersByTime(POPUPS.TRY_AGAIN.durationMs! - 1)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
    vi.advanceTimersByTime(1)
    expect(store.getState().popup).toBeNull()
  })

  it('many pauses add up: only the time actually played counts', () => {
    const { store, npc } = live()
    wrong(store, npc)
    const total = POPUPS.TRY_AGAIN.durationMs!
    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(1000)
      store.getState().setPaused(true)
      vi.advanceTimersByTime(10_000)
      store.getState().setPaused(false)
    }
    vi.advanceTimersByTime(total - 4000 - 1)
    expect(store.getState().popup).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(store.getState().popup).toBeNull()
  })

  it('a popup that comes up while paused starts counting only when the game goes on', () => {
    const { store, npc } = live()
    store.getState().setPaused(true)
    wrong(store, npc)
    vi.advanceTimersByTime(60_000)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
    store.getState().setPaused(false)
    vi.advanceTimersByTime(POPUPS.TRY_AGAIN.durationMs! - 1)
    expect(store.getState().popup).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(store.getState().popup).toBeNull()
  })

  it('a popup that already ran out is not brought back by a pause', () => {
    const { store, npc } = live()
    wrong(store, npc)
    vi.advanceTimersByTime(POPUPS.TRY_AGAIN.durationMs!)
    expect(store.getState().popup).toBeNull()
    store.getState().setPaused(true)
    store.getState().setPaused(false)
    vi.advanceTimersByTime(60_000)
    expect(store.getState().popup).toBeNull()
  })

  it('dispose cancels what is waiting, paused or not, and ends the pause', () => {
    const { store, npc } = live()
    wrong(store, npc)
    store.getState().setPaused(true)
    store.getState().dispose()
    store.getState().setPaused(false)
    vi.advanceTimersByTime(60_000)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
  })
})

describe('starting over', () => {
  it('goes back to class 1 with nothing answered, and saves that', () => {
    const { store, savedProgress } = setup({ stageIndex: 4, answeredIds: [STAGES[4].npcs![0].id] })
    expect(store.getState().stageIndex).toBe(4)
    store.getState().startOver()
    expect(store.getState()).toMatchObject({ stageIndex: 0, phase: 'exploring' })
    expect(store.getState().answered.size).toBe(0)
    expect(savedProgress()).toEqual({ stageIndex: 0, answeredIds: [], version: 2 })
  })

  it('does nothing to a game that has only just begun', () => {
    const { store } = setup()
    const before = store.getState()
    store.getState().startOver()
    expect(store.getState()).toMatchObject({ stageIndex: 0, phase: 'exploring' })
    expect(store.getState().answered).toEqual(before.answered)
  })
})
