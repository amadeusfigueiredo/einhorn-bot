import { describe, expect, it } from 'vitest'
import type { Phase } from '../logic/gameMachine'
import { DOORS, SECTOR_PLACES, canLeaveClass, canTravel, isSector, type PlaceId } from './placeModel'

const PLACES: PlaceId[] = ['class', 'yard', 'library', 'hall', 'sports', 'pony', 'pool', 'dojo', 'dance', 'tech', 'science']
const PHASES: Phase[] = ['exploring', 'talking', 'asking', 'correct', 'wrong', 'nextStage', 'ending']

describe('the doors between the places', () => {
  it('the classroom has two doors: to the yard and to the school corridor', () => {
    expect([...DOORS.class].sort()).toEqual(['hall', 'yard'])
  })

  it('the corridor has the green door to the yard and the doors of the classes (which lead to a classroom)', () => {
    expect([...DOORS.hall].sort()).toEqual(['class', 'science', 'sports', 'tech', 'yard'])
  })

  it('there is no door from the yard to the corridor: the ways in are from a classroom and from the library', () => {
    expect(canTravel('yard', 'hall')).toBe(false)
    expect(canTravel('library', 'hall')).toBe(true)
  })

  it('the yard has two: back to the classroom, and to the library', () => {
    expect([...DOORS.yard].sort()).toEqual(['class', 'library'])
  })

  it('the library has two: to the yard, and to the corridor (one way: from the corridor she goes back by the green door to the yard)', () => {
    expect([...DOORS.library].sort()).toEqual(['hall', 'yard'])
    expect(canTravel('hall', 'library')).toBe(false)
  })

  it('the corridor is the way to the yard and the library from a classroom too: class, corridor, yard, library', () => {
    expect(canTravel('class', 'hall') && canTravel('hall', 'yard') && canTravel('yard', 'library')).toBe(true)
  })

  it('the tech room and the science room have a big door each in the corridor and one door back to it', () => {
    for (const room of ['tech', 'science'] as const) {
      expect(canTravel('hall', room)).toBe(true)
      expect(DOORS[room]).toEqual(['hall'])
      expect(canTravel('sports', room)).toBe(false)
    }
  })

  it('the sports hall has a door back to the corridor and one into each of its four rooms, each with one back', () => {
    expect([...DOORS.sports].sort()).toEqual(['dance', 'dojo', 'hall', 'pony', 'pool'])
    for (const room of ['pony', 'pool', 'dojo', 'dance'] as const) expect(DOORS[room]).toEqual(['sports'])
    expect(canTravel('hall', 'sports')).toBe(true)
    expect(canTravel('yard', 'sports')).toBe(false)
  })

  it('there is no way from the classroom to the library, or from the library to the classroom, without the yard', () => {
    expect(canTravel('class', 'library')).toBe(false)
    expect(canTravel('library', 'class')).toBe(false)
  })

  it('every door can be gone back through: whatever you can go to, you can come back from (the green door of the corridor to the yard is the one exception: from the yard she goes back to a classroom)', () => {
    for (const from of PLACES) {
      for (const to of DOORS[from]) {
        if (from === 'hall' && to === 'yard') continue
        if (from === 'library' && to === 'hall') continue
        expect(canTravel(to, from), `${to} to ${from}`).toBe(true)
      }
    }
    expect(canTravel('yard', 'class')).toBe(true)
  })

  it('no place has a door to itself', () => {
    for (const p of PLACES) expect(canTravel(p, p)).toBe(false)
  })

  it('every place can be reached from the classroom', () => {
    const seen = new Set<PlaceId>(['class'])
    const queue: PlaceId[] = ['class']
    while (queue.length) {
      for (const next of DOORS[queue.shift()!]) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    expect([...seen].sort()).toEqual([...PLACES].sort())
  })
})

describe('the rooms of the sports played with the shared framework', () => {
  it('are the pool, the dojo and the dance hall (the pony yard has its own code)', () => {
    expect([...SECTOR_PLACES]).toEqual(['pool', 'dojo', 'dance', 'tech', 'science'])
    for (const place of PLACES) expect(isSector(place), place).toBe(['pool', 'dojo', 'dance', 'tech', 'science'].includes(place))
  })
})

describe('canLeaveClass', () => {
  it('only while she is just walking about, with nothing on screen', () => {
    for (const phase of PHASES) {
      expect(canLeaveClass({ phase, hasPopup: false }), phase).toBe(phase === 'exploring')
    }
  })

  it('never while a popup is up (the question would be lost)', () => {
    for (const phase of PHASES) expect(canLeaveClass({ phase, hasPopup: true }), phase).toBe(false)
  })
})
