import { describe, expect, it } from 'vitest'
import {
  loadProgress,
  saveProgress,
  clearProgress,
  PROGRESS_STORAGE_KEY,
  type StorageLike,
} from './progressStorage'

function makeFakeStorage(): StorageLike {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

describe('loadProgress', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadProgress(makeFakeStorage())).toBeNull()
  })

  it('returns null when storage is missing entirely', () => {
    expect(loadProgress(null)).toBeNull()
    expect(loadProgress(undefined)).toBeNull()
  })

  it('returns null for malformed JSON instead of throwing', () => {
    const storage = makeFakeStorage()
    storage.setItem(PROGRESS_STORAGE_KEY, '{not json')
    expect(loadProgress(storage)).toBeNull()
  })

  it('returns null when the shape is wrong', () => {
    const storage = makeFakeStorage()
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
    expect(loadProgress(storage)).toBeNull()

    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ stageIndex: '2', answeredIds: [] })
    )
    expect(loadProgress(storage)).toBeNull()

    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ stageIndex: 2, answeredIds: [1, 2] })
    )
    expect(loadProgress(storage)).toBeNull()
  })
})

describe('saveProgress + loadProgress round trip', () => {
  it('reads back exactly what was saved', () => {
    const storage = makeFakeStorage()
    const progress = { stageIndex: 3, answeredIds: ['npcA', 'npcB'] }
    saveProgress(storage, progress)
    expect(loadProgress(storage)).toEqual(progress)
  })

  it('overwrites the previous save', () => {
    const storage = makeFakeStorage()
    saveProgress(storage, { stageIndex: 1, answeredIds: ['a'] })
    saveProgress(storage, { stageIndex: 2, answeredIds: [] })
    expect(loadProgress(storage)).toEqual({ stageIndex: 2, answeredIds: [] })
  })

  it('does not throw when storage is missing', () => {
    expect(() => saveProgress(null, { stageIndex: 0, answeredIds: [] })).not.toThrow()
  })

  it('does not throw when the underlying storage throws (e.g. quota exceeded)', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    }
    expect(() => saveProgress(storage, { stageIndex: 0, answeredIds: [] })).not.toThrow()
  })
})

describe('clearProgress', () => {
  it('removes a saved progress entry', () => {
    const storage = makeFakeStorage()
    saveProgress(storage, { stageIndex: 5, answeredIds: ['x'] })
    clearProgress(storage)
    expect(loadProgress(storage)).toBeNull()
  })

  it('does not throw when storage is missing', () => {
    expect(() => clearProgress(null)).not.toThrow()
  })
})
