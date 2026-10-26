import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))

import type { DanceContext } from './danceKeys'
import { setDanceContext, tryDance } from './danceGate'
import { moveStore } from './moveStore'

const open: DanceContext = { hero: 'amara', view: '3d', paused: false, covered: false, nameCardOpen: false, worldPaused: false, busy: false, menuOpen: false }
afterEach(() => {
  setDanceContext(null)
  moveStore.getState().cancel()
})

describe('tryDance: one answer for the Space bar and for a click on her', () => {
  it('starts a move of the hero in the situation when she can dance', () => {
    setDanceContext(() => open)
    expect(tryDance()).toBe(true)
    expect(moveStore.getState().current?.hero).toBe('amara')
    moveStore.getState().cancel()
    setDanceContext(() => ({ ...open, hero: 'unicorn' }))
    expect(tryDance()).toBe(true)
    expect(moveStore.getState().current?.hero).toBe('unicorn')
  })

  it.each([
    ['the game is paused', { paused: true }],
    ['a film has the screen', { covered: true }],
    ['the name card is open', { nameCardOpen: true }],
    ['a teacher is asking', { worldPaused: true }],
    ['a talk or a book is open', { busy: true }],
    ['a menu is open', { menuOpen: true }],
    ['it is the 2D view (it does not draw her)', { view: '2d' as const }],
  ])('does nothing when %s', (_why, over) => {
    setDanceContext(() => ({ ...open, ...over }))
    expect(tryDance()).toBe(false)
    expect(moveStore.getState().current).toBeNull()
  })

  it('does nothing when no game has said what the situation is', () => {
    expect(tryDance()).toBe(false)
    expect(moveStore.getState().current).toBeNull()
  })

  it('asks the situation at the moment of the click, so it is always the latest', () => {
    let paused = true
    setDanceContext(() => ({ ...open, paused }))
    expect(tryDance()).toBe(false)
    paused = false
    expect(tryDance()).toBe(true)
  })
})
