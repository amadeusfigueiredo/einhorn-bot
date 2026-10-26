import { afterEach, describe, expect, it, vi } from 'vitest'
import { heroSettings } from '../player/heroSettings'
import { MOVE_IDS, moveById, type MoveId } from '../views/three/amara/amaraMoves'
import { UNICORN_MOVE_IDS, unicornMoveById, type UnicornMoveId } from '../views/three/unicornMoves'
import { createMoveStore, moveName, moveStore } from './moveStore'

const played = vi.hoisted(() => ({ names: [] as string[] }))
vi.mock('../audio/sfx', () => ({ playSfx: (n: string) => void played.names.push(n) }))

afterEach(() => {
  moveStore.getState().cancel()
  heroSettings.getState().setHero('amara')
  played.names.length = 0
})

describe('the move store', () => {
  it('has no move at first', () => {
    expect(createMoveStore().getState().current).toBeNull()
  })

  it('starts one of Amara\'s moves at random with its sound, and says which', () => {
    const s = createMoveStore()
    const id = s.getState().start(() => 0, 'amara') as MoveId
    expect(id).toBe(MOVE_IDS[0])
    expect(s.getState().current).toMatchObject({ hero: 'amara', id })
    expect(played.names).toEqual([moveById(id).sound])
  })

  it('starts one of the unicorn\'s moves when the unicorn is the one asked', () => {
    const s = createMoveStore()
    const id = s.getState().start(() => 0, 'unicorn') as UnicornMoveId
    expect(id).toBe(UNICORN_MOVE_IDS[0])
    expect(s.getState().current).toMatchObject({ hero: 'unicorn', id })
    expect(played.names).toEqual([unicornMoveById(id).sound])
  })

  it('asks the game who is played when it is not told', () => {
    const s = createMoveStore()
    heroSettings.getState().setHero('unicorn')
    s.getState().start()
    expect(s.getState().current?.hero).toBe('unicorn')
    heroSettings.getState().setHero('amara')
    s.getState().start()
    expect(s.getState().current?.hero).toBe('amara')
  })

  it('gives every move its own key, so the same move twice is two moves', () => {
    const s = createMoveStore()
    s.getState().start(() => 0, 'amara')
    const first = s.getState().current!.key
    s.getState().start(() => 0, 'amara')
    expect(s.getState().current!.key).toBeGreaterThan(first)
  })

  it('never does the same move twice in a row, and does all twenty before one repeats', () => {
    const s = createMoveStore()
    const seen: string[] = []
    for (let i = 0; i < 20; i++) seen.push(s.getState().start(Math.random, 'amara'))
    expect(new Set(seen).size).toBe(20)
    let last = seen[19]
    for (let i = 0; i < 60; i++) {
      const id = s.getState().start(Math.random, 'amara')
      expect(id).not.toBe(last)
      last = id
    }
  })

  it('does the same for the unicorn: all twelve before one repeats, never the same twice in a row', () => {
    const s = createMoveStore()
    const seen: string[] = []
    for (let i = 0; i < UNICORN_MOVE_IDS.length; i++) seen.push(s.getState().start(Math.random, 'unicorn'))
    expect(new Set(seen).size).toBe(UNICORN_MOVE_IDS.length)
    let last = seen[seen.length - 1]
    for (let i = 0; i < 60; i++) {
      const id = s.getState().start(Math.random, 'unicorn')
      expect(id).not.toBe(last)
      last = id
    }
  })

  it('keeps a bag for each hero, so one hero\'s round does not use up the other\'s', () => {
    const s = createMoveStore()
    s.getState().start(() => 0, 'amara')
    expect(s.getState().unicornBag.left).toHaveLength(UNICORN_MOVE_IDS.length)
    s.getState().start(() => 0, 'unicorn')
    expect(s.getState().bag.left).toHaveLength(MOVE_IDS.length - 1)
  })

  it('finishes the move with the right key, and leaves a newer move alone', () => {
    const s = createMoveStore()
    s.getState().start(() => 0)
    const old = s.getState().current!.key
    s.getState().start(() => 0)
    s.getState().finish(old)
    expect(s.getState().current).not.toBeNull()
    s.getState().finish(s.getState().current!.key)
    expect(s.getState().current).toBeNull()
  })

  it('can be cancelled', () => {
    const s = createMoveStore()
    s.getState().start()
    s.getState().cancel()
    expect(s.getState().current).toBeNull()
  })

  it('plays the sound of every move it starts', () => {
    const s = createMoveStore()
    for (let i = 0; i < 20; i++) s.getState().start(Math.random, 'amara')
    expect(played.names).toHaveLength(20)
    expect(new Set(played.names).size).toBeGreaterThanOrEqual(14)
  })
})

describe('moveName', () => {
  it('names each hero\'s move in the language asked', () => {
    expect(moveName({ hero: 'amara', id: 'twirl', key: 1 }, 'en')).toBe('Twirl')
    expect(moveName({ hero: 'unicorn', id: 'rearUp', key: 2 }, 'de')).toBe('Aufbäumen')
    expect(moveName({ hero: 'unicorn', id: 'rearUp', key: 2 }, 'pt')).toBe('Empinar')
  })
})
