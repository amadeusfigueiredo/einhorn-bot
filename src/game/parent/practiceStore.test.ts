import { describe, expect, it } from 'vitest'
import type { StorageLike } from '../utils/progressStorage'
import { PRACTICE_STORAGE_KEY, createPracticeStore } from './practiceStore'

function memory(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] }
}
const day = (d: number) => () => new Date(2026, 9, d, 12)

describe('the practice store', () => {
  it('starts empty and counts the play time on the day it is', () => {
    const store = createPracticeStore(memory(), day(22))
    expect(store.getState().seconds).toBe(0)
    store.getState().addSeconds(5)
    store.getState().addSeconds(5)
    expect(store.getState().seconds).toBe(10)
    expect(store.getState().days).toEqual({ '2026-10-22': 10 })
  })

  it('counts answers by class', () => {
    const store = createPracticeStore(memory(), day(22))
    store.getState().answer(3, 'right')
    store.getState().answer(3, 'wrong')
    expect(store.getState().classes).toEqual({ '3': { right: 1, wrong: 1 } })
  })

  it('remembers, so a new store on the same storage has it all', () => {
    const storage = memory()
    const first = createPracticeStore(storage, day(22))
    first.getState().addSeconds(30)
    first.getState().answer(0, 'right')
    const second = createPracticeStore(storage, day(23))
    expect(second.getState().seconds).toBe(30)
    expect(second.getState().classes).toEqual({ '0': { right: 1, wrong: 0 } })
    second.getState().addSeconds(5)
    expect(second.getState().days).toEqual({ '2026-10-22': 30, '2026-10-23': 5 })
  })

  it('forgets everything when cleared, and the storage with it', () => {
    const storage = memory()
    const store = createPracticeStore(storage, day(22))
    store.getState().addSeconds(30)
    store.getState().clear()
    expect(store.getState().seconds).toBe(0)
    expect(createPracticeStore(storage).getState().seconds).toBe(0)
  })

  it('starts empty when what was saved is rubbish, or cannot be read, and goes on when it cannot be written', () => {
    for (const bad of ['not json', '{"seconds":"x"}', 'null']) {
      expect(createPracticeStore(memory({ [PRACTICE_STORAGE_KEY]: bad })).getState().seconds, bad).toBe(0)
    }
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('no')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {},
    }
    const store = createPracticeStore(broken, day(22))
    store.getState().addSeconds(5)
    expect(store.getState().seconds).toBe(5)
    expect(createPracticeStore(null).getState().seconds).toBe(0)
  })
})
