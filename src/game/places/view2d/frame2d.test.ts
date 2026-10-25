import { describe, expect, it } from 'vitest'
import { AREAS, walkBounds } from '../placeLayout'
import { depthScale, figureSize, followX, frameFor, project, spanOf, unproject } from './frame2d'

describe('the 2D frame of a place', () => {
  it('shows the whole library and a stretch of the yard and the corridor, less on a phone held upright', () => {
    expect(spanOf('library', 1280, 720)).toBe(AREAS.library.halfW * 2)
    expect(spanOf('library', 390, 844)).toBe(AREAS.library.halfW * 2)
    expect(spanOf('yard', 1280, 720)).toBe(18)
    expect(spanOf('yard', 390, 844)).toBe(11)
    expect(spanOf('hall', 1280, 720)).toBe(15)
    expect(spanOf('hall', 390, 844)).toBe(9)
  })

  it('follows her, but stops at the ends of the room and never moves in the library', () => {
    expect(followX('library', 1280, 720, 5)).toBe(0)
    expect(followX('yard', 1280, 720, 3)).toBe(3)
    expect(followX('yard', 1280, 720, 99)).toBe(AREAS.yard.halfW - 9)
    expect(followX('hall', 1280, 720, -99)).toBe(-(AREAS.hall.halfW - 7.5))
  })

  it('puts the back wall at the top of the floor and the front edge at the bottom', () => {
    const f = frameFor('library', 1280, 720, 0)
    expect(project(f, 0, -AREAS.library.halfD).y).toBeCloseTo(f.horizon)
    expect(project(f, 0, AREAS.library.halfD).y).toBeCloseTo(f.bottom)
    expect(f.horizon).toBeGreaterThan(0)
    expect(f.bottom).toBeLessThan(f.H)
  })

  it('puts the middle of the room in the middle of the screen, and what is to the right to the right', () => {
    const f = frameFor('yard', 1280, 720, 4)
    expect(project(f, 4, 0).x).toBeCloseTo(640)
    expect(project(f, 6, 0).x).toBeGreaterThan(640)
    expect(project(f, 2, 0).x).toBeLessThan(640)
  })

  it('draws things further back smaller and nearer ones bigger', () => {
    const f = frameFor('library', 1280, 720, 0)
    expect(depthScale(f, -4)).toBeLessThan(depthScale(f, 0))
    expect(depthScale(f, 0)).toBeLessThan(depthScale(f, 4))
    expect(figureSize(f, -2)).toBeLessThan(figureSize(f, 3))
  })

  it('keeps a unicorn a sensible size: not tiny on a phone, not huge on a wide screen', () => {
    const phone = frameFor('library', 390, 844, 0)
    expect(figureSize(phone, 0)).toBeGreaterThanOrEqual(844 * 0.12)
    const wide = frameFor('yard', 1600, 500, 0)
    expect(figureSize(wide, 3, 8)).toBeLessThanOrEqual(500 * 0.34)
  })

  it('turns a tap on the screen back into the place on the floor she walks to', () => {
    const f = frameFor('library', 1280, 720, 0)
    for (const [x, z] of [[0, 0], [-3, 1], [4, -1], [2.5, 2.2]]) {
      const s = project(f, x, z)
      const w = unproject(f, s.x, s.y)
      expect(w.x).toBeCloseTo(x, 4)
      expect(w.z).toBeCloseTo(z, 4)
    }
  })

  it('a tap outside the room, or on the wall, is brought to where she can walk', () => {
    const f = frameFor('library', 1280, 720, 0)
    const b = walkBounds('library')
    const wall = unproject(f, 640, 5)
    expect(wall.z).toBe(b.minZ)
    const far = unproject(f, 5000, 5000)
    expect(far.x).toBe(b.maxX)
    expect(far.z).toBe(b.maxZ)
    expect(unproject(f, -5000, 300).x).toBe(b.minX)
  })
})
