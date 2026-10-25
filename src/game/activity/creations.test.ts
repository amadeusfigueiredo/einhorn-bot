import { describe, expect, it } from 'vitest'
import { CREATIONS_STORAGE_KEY, MAX_CREATIONS, createCreationsStore, type StorageLike } from './creations'

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial }
  const storage: StorageLike = { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
  return { storage, data }
}
const take = (n: number, event: string | number = 'x') => Array.from({ length: n }, (_, i) => ({ event, at: i }))

describe('her creations: up to three for each activity, kept on the device', () => {
  it('starts with nothing', () => {
    expect(createCreationsStore(null).getState().of('xylophone')).toEqual([])
  })

  it('dates a creation with the time it was made when nothing else says', () => {
    const before = Date.now()
    const c = createCreationsStore(null).getState().save('a', take(4))
    expect(c.at).toBeGreaterThanOrEqual(before)
    expect(c.at).toBeLessThanOrEqual(Date.now())
  })

  it('keeps what she makes, oldest first, each with its own id', () => {
    const store = createCreationsStore(null)
    const a = store.getState().save('xylophone', take(4), 100)
    const b = store.getState().save('xylophone', take(5), 200)
    expect(store.getState().of('xylophone')).toEqual([a, b])
    expect(a.id).not.toBe(b.id)
    expect(a).toMatchObject({ at: 100, take: take(4) })
  })

  it('keeps only the newest three: the oldest goes', () => {
    const store = createCreationsStore(null)
    for (let i = 1; i <= MAX_CREATIONS + 2; i++) store.getState().save('kata', take(i), i)
    expect(store.getState().of('kata').map((c) => c.take.length)).toEqual([3, 4, 5])
  })

  it('keeps each activity\'s own', () => {
    const store = createCreationsStore(null)
    store.getState().save('xylophone', take(4))
    store.getState().save('dance', take(6))
    expect(store.getState().of('xylophone')).toHaveLength(1)
    expect(store.getState().of('dance')[0].take).toHaveLength(6)
    expect(store.getState().of('nothing')).toEqual([])
  })

  it('writes them down on the device, and finds them there another day', () => {
    const { storage, data } = memory()
    createCreationsStore(storage).getState().save('xylophone', take(4, 2), 7)
    expect(JSON.parse(data[CREATIONS_STORAGE_KEY]).xylophone[0]).toMatchObject({ at: 7 })
    const again = createCreationsStore(storage)
    expect(again.getState().of('xylophone')[0].take).toEqual(take(4, 2))
  })

  it('finds no more than three of an old file with more, and ignores what is not a creation', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, at: i, take: take(4) }))
    const junk = [{ id: 1 }, null, 'x', { id: 'z', at: 1, take: [{ nope: true }] }]
    const { storage } = memory({ [CREATIONS_STORAGE_KEY]: JSON.stringify({ a: many, b: junk, c: 'not a list' }) })
    const store = createCreationsStore(storage)
    expect(store.getState().of('a').map((c) => c.id)).toEqual(['c2', 'c3', 'c4'])
    expect(store.getState().of('b')).toEqual([])
    expect(store.getState().of('c')).toEqual([])
  })

  it('starts empty from a file that is broken or the wrong shape', () => {
    for (const raw of ['{not json', 'null', '[1,2]', '"x"', '']) {
      expect(createCreationsStore(memory({ [CREATIONS_STORAGE_KEY]: raw }).storage).getState().of('a'), raw).toEqual([])
    }
  })

  it('goes on when the device will not keep it (private browsing, no room)', () => {
    const storage: StorageLike = { getItem: () => null, setItem: () => { throw new Error('full') } }
    const store = createCreationsStore(storage)
    expect(() => store.getState().save('a', take(4))).not.toThrow()
    expect(store.getState().of('a')).toHaveLength(1)
  })

  it('and goes on when the device will not even be asked', () => {
    const storage: StorageLike = { getItem: () => { throw new Error('no') }, setItem: () => {} }
    expect(createCreationsStore(storage).getState().of('a')).toEqual([])
  })
})
