import { describe, it, expect } from 'vitest'
import { createTransitionStore } from './transitionStore'

describe('transition store', () => {
  it('starts idle', () => {
    const s = createTransitionStore()
    expect(s.getState().active).toBe(false)
    expect(s.getState().to).toBeNull()
  })

  it('start puts the overlay on, going to that stage; finish takes it off', () => {
    const s = createTransitionStore()
    s.getState().start(4)
    expect(s.getState()).toMatchObject({ active: true, to: 4 })
    s.getState().finish()
    expect(s.getState()).toMatchObject({ active: false, to: null })
  })

  it('a new start while one is on just changes where it is going', () => {
    const s = createTransitionStore()
    s.getState().start(1)
    s.getState().start(2)
    expect(s.getState()).toMatchObject({ active: true, to: 2 })
  })

  it('finish when nothing is on is harmless', () => {
    const s = createTransitionStore()
    s.getState().finish()
    expect(s.getState().active).toBe(false)
  })
})
