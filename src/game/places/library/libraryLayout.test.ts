import { describe, expect, it } from 'vitest'
import { arrivalAt } from '../placeLayout'
import { LIBRARY_HALF, LIBRARY_SPOTS, STAND_AT, bookSlot, inLibrary, libraryObstacles } from './libraryLayout'

describe('the library layout', () => {
  it('has everything inside the room, and a place to stand to use each thing, inside where she can walk', () => {
    for (const { id, x, z } of libraryObstacles()) {
      expect(Math.abs(x), id).toBeLessThan(LIBRARY_HALF.halfW)
      expect(Math.abs(z), id).toBeLessThan(LIBRARY_HALF.halfD)
    }
    for (const [id, spot] of Object.entries(STAND_AT)) expect(inLibrary(spot), `stand at ${id}`).toBe(true)
  })

  it('stands each thing apart from the others: no two overlap', () => {
    const things = libraryObstacles()
    for (let i = 0; i < things.length; i++) {
      for (let j = i + 1; j < things.length; j++) {
        const a = things[i]
        const b = things[j]
        expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id} and ${b.id}`).toBeGreaterThanOrEqual(a.r + b.r - 0.2)
      }
    }
  })

  it('does not put a stand-at spot on top of another thing', () => {
    for (const [id, spot] of Object.entries(STAND_AT)) {
      for (const o of libraryObstacles()) {
        if (o.id === id) continue
        expect(Math.hypot(spot.x - o.x, spot.z - o.z), `stand at ${id} vs ${o.id}`).toBeGreaterThan(o.r * 0.7)
      }
    }
  })

  it('keeps things off the shelf along the back wall, and the arrival spot free', () => {
    const a = arrivalAt('library', 'yard')
    for (const o of libraryObstacles()) expect(Math.hypot(a.x - o.x, a.z - o.z), `arrival vs ${o.id}`).toBeGreaterThan(o.r * 0.6)
    for (const s of Object.values(LIBRARY_SPOTS)) expect(s.z).toBeGreaterThan(-2.3)
  })

  it('has room for both doors: nothing stands over the door to the yard or the door to the corridor, and she can arrive at either', () => {
    for (const from of ['yard', 'hall'] as const) {
      const a = arrivalAt('library', from)
      for (const o of libraryObstacles().filter((o) => !o.id.startsWith('door:'))) expect(Math.hypot(a.x - o.x, a.z - o.z), `arrival from ${from} vs ${o.id}`).toBeGreaterThan(o.r * 0.6)
    }
    const doors = libraryObstacles().filter((o) => o.id.startsWith('door:'))
    expect(doors.map((d) => d.id).sort()).toEqual(['door:hall', 'door:yard'])
    for (const d of doors) {
      for (const o of libraryObstacles().filter((o) => !o.id.startsWith('door:'))) expect(Math.hypot(d.x - o.x, d.z - o.z), `${d.id} vs ${o.id}`).toBeGreaterThan(o.r)
    }
  })

  it('stands the five books in a fan over the table: in a row, the middle one furthest back, each leaning away from the middle', () => {
    const slots = Array.from({ length: 5 }, (_, i) => bookSlot(i))
    expect(slots.map((s) => s.x)).toEqual([...slots.map((s) => s.x)].sort((a, b) => a - b))
    expect(slots[2].z).toBeLessThan(slots[0].z)
    expect(slots[2].yaw).toBeCloseTo(0, 9)
    expect(slots[0].yaw).toBeGreaterThan(0)
    expect(slots[4].yaw).toBeLessThan(0)
    expect(Math.abs(slots[0].x)).toBeLessThan(LIBRARY_SPOTS.table.x + 1)
  })

  it('stands a single book in the middle', () => {
    expect(bookSlot(0, 1)).toEqual({ x: 0, z: -0.18, yaw: -0 })
  })

  it('knows what is inside the walking area', () => {
    expect(inLibrary({ x: 0, z: 0 })).toBe(true)
    expect(inLibrary({ x: 7, z: 0 })).toBe(false)
    expect(inLibrary({ x: 0, z: -3 })).toBe(false)
    expect(inLibrary({ x: 6.4, z: 0 }, 0.5)).toBe(false)
  })
})
