import { afterEach, describe, expect, it } from 'vitest'
import { createPauseStore, isPaused, pauseStore } from './pauseStore'

afterEach(() => pauseStore.getState().resume())

describe('the pause', () => {
  it('starts playing', () => {
    expect(createPauseStore().getState().paused).toBe(false)
  })

  it('pause and resume set it, and doing either twice changes nothing more', () => {
    const s = createPauseStore()
    s.getState().pause()
    s.getState().pause()
    expect(s.getState().paused).toBe(true)
    s.getState().resume()
    s.getState().resume()
    expect(s.getState().paused).toBe(false)
  })

  it('toggle flips it each time', () => {
    const s = createPauseStore()
    s.getState().toggle()
    expect(s.getState().paused).toBe(true)
    s.getState().toggle()
    expect(s.getState().paused).toBe(false)
  })

  it('every store is its own: a test store does not pause the game', () => {
    createPauseStore().getState().pause()
    expect(isPaused()).toBe(false)
  })

  it('the game loops ask isPaused() about the one shared pause', () => {
    expect(isPaused()).toBe(false)
    pauseStore.getState().pause()
    expect(isPaused()).toBe(true)
  })
})
