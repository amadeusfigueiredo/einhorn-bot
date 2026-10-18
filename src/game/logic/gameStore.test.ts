import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { POPUPS } from '../data/popups'
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
        expect(game().phase).toBe('asking')

        game().answer(npc.question.correctIndex)
        const isLastNpc = i === stage.npcs!.length - 1
        const isLastStage = stageIndex === STAGES.length - 1

        expect(game().popup?.id).toBe('WIN')
        expect(game().phase).toBe(
          !isLastNpc ? 'correct' : isLastStage ? 'ending' : 'nextStage'
        )
        if (!isLastNpc) {
          expect(savedProgress()).toEqual({
            stageIndex,
            answeredIds: stage.npcs!.slice(0, i + 1).map((n) => n.id),
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
    expect(savedProgress()).toEqual({ stageIndex: 0, answeredIds: [] })
  })
})

describe('wrong answers', () => {
  it('shows TRY_AGAIN for its duration and saves nothing', () => {
    const { store, timers, savedProgress } = setup()
    const npc = STAGES[0].npcs![0]

    store.getState().interact({ kind: 'npc', id: npc.id })
    store.getState().answer((npc.question.correctIndex + 1) % 4)
    expect(store.getState().popup?.id).toBe('TRY_AGAIN')
    expect(savedProgress()).toBeNull()

    timers.advance(POPUPS.TRY_AGAIN.durationMs! - 1)
    expect(store.getState().popup).not.toBeNull()
    timers.advance(1)
    expect(store.getState()).toMatchObject({ popup: null, phase: 'exploring' })
  })

  it("an earlier popup's timer cannot cut a newer popup short", () => {
    const { store, timers } = setup()
    const [a, b] = STAGES[0].npcs!

    store.getState().interact({ kind: 'npc', id: a.id })
    store.getState().answer((a.question.correctIndex + 1) % 4) // 5s popup
    timers.advance(3000)
    store.getState().interact({ kind: 'npc', id: b.id })
    store.getState().answer(b.question.correctIndex) // WIN until t=7000

    timers.advance(2000) // t=5000: the stale TRY_AGAIN timer fires
    expect(store.getState().popup?.id).toBe('WIN')
    timers.advance(2000) // t=7000
    expect(store.getState().popup).toBeNull()
  })
})

describe('persistence', () => {
  it('restores the saved stage and answers', () => {
    const id = STAGES[4].npcs![0].id
    const { store } = setup({ stageIndex: 4, answeredIds: [id] })
    expect(store.getState().stageIndex).toBe(4)
    expect(store.getState().answered.has(id)).toBe(true)
  })

  it('jumping stages saves an empty answer list for the new stage', () => {
    const { store, savedProgress } = setup()
    store.getState().jumpToStage(7)
    expect(savedProgress()).toEqual({ stageIndex: 7, answeredIds: [] })
  })

  it('dispose cancels pending popup timers', () => {
    const { store, timers } = setup()
    const npc = STAGES[0].npcs![0]
    store.getState().interact({ kind: 'npc', id: npc.id })
    store.getState().answer(npc.question.correctIndex)
    expect(timers.pending()).toBe(1)
    store.getState().dispose()
    expect(timers.pending()).toBe(0)
  })
})
