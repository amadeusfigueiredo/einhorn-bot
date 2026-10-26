import { describe, expect, it } from 'vitest'
import { createStartStore, isStartMenuOpen, startStore } from './startStore'

describe('start store', () => {
  it('starts as it is told: open, or closed', () => {
    expect(createStartStore(true).getState().active).toBe(true)
    expect(createStartStore(false).getState().active).toBe(false)
  })

  it('closing and opening it again (from the pause menu) work, twice over', () => {
    const s = createStartStore(true)
    s.getState().close()
    s.getState().close()
    expect(s.getState().active).toBe(false)
    s.getState().open()
    s.getState().open()
    expect(s.getState().active).toBe(true)
  })

  it('is closed in the tests of the game (test/setup.ts), and the loops ask isStartMenuOpen()', () => {
    expect(isStartMenuOpen()).toBe(false)
    startStore.getState().open()
    expect(isStartMenuOpen()).toBe(true)
    startStore.getState().close()
    expect(isStartMenuOpen()).toBe(false)
  })
})
