import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOOKS } from '../data/hangouts'
import { DOORS } from '../placeModel'
import { frameFor, project } from './frame2d'
import { DOOR_NEAR, doorNear, standFor, thingAt, thingsFor, type Thing2D } from './things2d'
import { CLASS_COUNT } from '../../hall/hallLayout'
import { walkBounds } from '../placeLayout'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('what she can tap in a place', () => {
  it('has a door for every door the model says, and nothing else is a door', () => {
    for (const place of ['yard', 'library', 'sports', 'pony', 'pool', 'dojo', 'dance'] as const) {
      const doors = thingsFor(place).filter((t) => t.id.startsWith('door:')).map((t) => t.id.slice(5))
      expect(doors.sort()).toEqual([...DOORS[place]].sort())
    }
  })

  it('the corridor has the fifteen class doors and the green door to the yard, each with its own use', () => {
    vi.stubGlobal('window', { location: { search: '?rooms=0' } })
    const hall = thingsFor('hall')
    expect(hall).toHaveLength(CLASS_COUNT + 1)
    expect(hall.filter((t) => t.use.type === 'classDoor').map((t) => (t.use as { index: number }).index)).toEqual(Array.from({ length: CLASS_COUNT }, (_, i) => i))
    expect(hall.find((t) => t.id === 'door:yard')!.use).toEqual({ type: 'go', to: 'yard' })
  })

  it('the corridor has the big door to the sports hall too, once the special rooms are open', () => {
    expect(thingsFor('hall').find((t) => t.id === 'door:sports')!.use).toEqual({ type: 'go', to: 'sports' })
    vi.stubGlobal('window', { location: { search: '?rooms=0' } })
    expect(thingsFor('hall').some((t) => t.id === 'door:sports')).toBe(false)
  })

  it('the library has its five books, the owl and the reading unicorn, and the things to play with', () => {
    const lib = thingsFor('library')
    expect(lib.filter((t) => t.use.type === 'book')).toHaveLength(BOOKS.length)
    expect(lib.filter((t) => t.use.type === 'talk').map((t) => t.id).sort()).toEqual(['owl', 'readingUnicorn'])
    for (const use of ['globe', 'lamp', 'aquarium', 'pad', 'board']) expect(lib.some((t) => t.use.type === use), use).toBe(true)
  })

  it('the yard has its two friends to talk with and the animals and play things that say their line', () => {
    const yard = thingsFor('yard')
    expect(yard.filter((t) => t.use.type === 'talk').map((t) => t.id).sort()).toEqual(['friendDay', 'friendPlay'])
    expect(yard.filter((t) => t.use.type === 'say').map((t) => t.id).sort()).toEqual(['capybara', 'koala', 'slide', 'swing'])
  })

  it('every thing has a unique id, a size, and somewhere to stand inside the room', () => {
    for (const place of ['yard', 'library', 'hall'] as const) {
      const b = walkBounds(place)
      const things = thingsFor(place)
      expect(new Set(things.map((t) => t.id)).size).toBe(things.length)
      for (const t of things) {
        expect(t.w, t.id).toBeGreaterThan(0)
        expect(t.h, t.id).toBeGreaterThan(0)
        for (const fromX of [b.minX, b.maxX]) {
          const s = standFor(t, fromX)
          expect(s.x, `${place} ${t.id}`).toBeGreaterThanOrEqual(b.minX - 2.5)
          expect(s.x, `${place} ${t.id}`).toBeLessThanOrEqual(b.maxX + 2.5)
        }
      }
    }
  })

  it('stands at a fixed spot, or beside the thing on the side she comes from', () => {
    const fixed = thingsFor('library').find((t) => t.id === 'globe')!
    expect(standFor(fixed, 0)).toEqual(standFor(fixed, 5))
    const friend = thingsFor('yard').find((t) => t.id === 'friendDay') as Thing2D
    expect(standFor(friend, friend.at.x - 5).x).toBeLessThan(friend.at.x)
    expect(standFor(friend, friend.at.x + 5).x).toBeGreaterThan(friend.at.x)
  })

  it('finds the thing under a tap, and nothing where there is nothing', () => {
    const f = frameFor('library', 1280, 720, 0)
    const globe = thingsFor('library').find((t) => t.id === 'globe')!
    const foot = project(f, globe.at.x, globe.at.z)
    expect(thingAt(thingsFor('library'), f, foot.x, foot.y - 60)?.id).toBe('globe')
    expect(thingAt(thingsFor('library'), f, 5, 5)).toBeNull()
  })

  it('a thing in front of another wins the tap where they overlap', () => {
    const f = frameFor('library', 1280, 720, 0)
    const back: Thing2D = { id: 'back', at: { x: 0, z: -1 }, w: 3, lift: 0, h: 9, stand: { x: 0, z: 0 }, use: { type: 'globe' } }
    const front: Thing2D = { id: 'front', at: { x: 0, z: 1 }, w: 1, lift: 0, h: 3, stand: { x: 0, z: 0 }, use: { type: 'globe' } }
    const p = project(f, 0, 1)
    expect(thingAt([back, front], f, p.x, p.y - 120)?.id).toBe('front')
    expect(thingAt([front, back], f, p.x, p.y - 120)?.id).toBe('front')
  })

  it('a book on the table is tapped above the floor, not at its foot', () => {
    const f = frameFor('library', 1280, 720, 0)
    const book = thingsFor('library').find((t) => t.id === 'book:2')!
    const foot = project(f, book.at.x, book.at.z)
    const unit = f.scale * 1
    expect(thingAt([book], f, foot.x, foot.y - (book.lift + book.h / 2) * unit)?.id).toBe('book:2')
    expect(thingAt([book], f, foot.x, foot.y + 30)).toBeNull()
  })

  it('knows which door she is at: within reach of where she stands to use it, and no other thing counts', () => {
    const lib = thingsFor('library')
    const door = lib.find((t) => t.id === 'door:yard')!
    const stand = standFor(door, 0)
    expect(doorNear(lib, stand)?.id).toBe('door:yard')
    expect(doorNear(lib, { x: stand.x + DOOR_NEAR - 0.1, z: stand.z })?.id).toBe('door:yard')
    expect(doorNear(lib, { x: stand.x + DOOR_NEAR + 1, z: stand.z })).toBeNull()
    // standing at the globe is not standing at a door
    expect(doorNear(lib, standFor(lib.find((t) => t.id === 'globe')!, 0))).toBeNull()
  })

  it('knows the class doors of the corridor too', () => {
    const hall = thingsFor('hall')
    const third = hall.find((t) => t.id === 'door:class:2')!
    expect(doorNear(hall, standFor(third, 0))).toBe(third)
  })
})
