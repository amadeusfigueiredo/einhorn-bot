import { describe, it, expect } from 'vitest'
import { createIntroStore, introStore, isIntroPlaying } from './introStore'

describe('intro store', () => {
  it('starts as it is told', () => {
    expect(createIntroStore(true).getState().active).toBe(true)
    expect(createIntroStore(false).getState().active).toBe(false)
  })

  it('finish ends it, and ending it twice is harmless', () => {
    const s = createIntroStore(true)
    s.getState().finish()
    expect(s.getState().active).toBe(false)
    s.getState().finish()
    expect(s.getState().active).toBe(false)
  })

  it('tells listeners when it ends', () => {
    const s = createIntroStore(true)
    const seen: boolean[] = []
    s.subscribe((st) => seen.push(st.active))
    s.getState().finish()
    expect(seen).toEqual([false])
  })

  it('start plays it again (from the menu), and finish ends it again', () => {
    const s = createIntroStore(false)
    s.getState().start()
    expect(s.getState().active).toBe(true)
    s.getState().finish()
    expect(s.getState().active).toBe(false)
  })

  it('isIntroPlaying tells the game loops whether the world should stand still', () => {
    introStore.setState({ active: true })
    expect(isIntroPlaying()).toBe(true)
    introStore.setState({ active: false })
    expect(isIntroPlaying()).toBe(false)
  })
})
