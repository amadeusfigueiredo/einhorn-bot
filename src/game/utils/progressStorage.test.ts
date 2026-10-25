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

  it.each(['null', '5', '"text"', 'true'])('returns null for stored %s: it is JSON, but not a progress record', (raw) => {
    const storage = makeFakeStorage()
    storage.setItem(PROGRESS_STORAGE_KEY, raw)
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

describe('the version of a save', () => {
  const put = (value: unknown) => {
    const storage = makeFakeStorage()
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(value))
    return storage
  }

  it('a save of the new kind says its version, and an old one has none: both open', () => {
    expect(loadProgress(put({ stageIndex: 3, answeredIds: ['a'], version: 2 }))).toEqual({ stageIndex: 3, answeredIds: ['a'], version: 2 })
    expect(loadProgress(put({ stageIndex: 3, answeredIds: ['a'] }))).toEqual({ stageIndex: 3, answeredIds: ['a'] })
  })

  it('a version that is not a number is not a save', () => {
    expect(loadProgress(put({ stageIndex: 3, answeredIds: [], version: '2' }))).toBeNull()
    expect(loadProgress(put({ stageIndex: 3, answeredIds: [], version: null }))).toBeNull()
  })

  it('the new kind survives a round trip with its version', () => {
    const storage = makeFakeStorage()
    saveProgress(storage, { stageIndex: 6, answeredIds: ['x', 'y'], version: 2 })
    expect(loadProgress(storage)).toEqual({ stageIndex: 6, answeredIds: ['x', 'y'], version: 2 })
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
