import { afterEach, describe, expect, it } from 'vitest'
import { SAY_SECONDS, createSayStore, sayStore } from './sayStore'

const line = { de: 'Blub', pt: 'Blub', en: 'Blub' }

afterEach(() => sayStore.getState().clear())

describe('what a thing says', () => {
  it('says nothing at first', () => {
    expect(createSayStore().getState().saying).toBeNull()
  })

  it('says a line, and the same line said again is a new one (a new key)', () => {
    const s = createSayStore()
    s.getState().say(line)
    const first = s.getState().saying!
    expect(first.text).toBe(line)
    s.getState().say(line)
    expect(s.getState().saying!.key).toBeGreaterThan(first.key)
  })

  it('can be cleared', () => {
    const s = createSayStore()
    s.getState().say(line)
    s.getState().clear()
    expect(s.getState().saying).toBeNull()
  })

  it('stays up a few seconds', () => {
    expect(SAY_SECONDS).toBeGreaterThan(1)
    expect(SAY_SECONDS).toBeLessThan(6)
  })
})
