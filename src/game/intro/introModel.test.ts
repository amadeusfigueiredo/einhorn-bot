import { describe, expect, it } from 'vitest'
import { shouldShowIntro } from './introModel'

describe('shouldShowIntro', () => {
  const first = { name: null, skipped: false, search: '', reducedMotion: false }

  it('plays on the very first visit', () => {
    expect(shouldShowIntro(first)).toBe(true)
  })

  it('does not play again once there is a name, or the child chose to play without one', () => {
    expect(shouldShowIntro({ ...first, name: 'Amara' })).toBe(false)
    expect(shouldShowIntro({ ...first, skipped: true })).toBe(false)
  })

  it('does not play with reduced motion, even on a first visit or when forced', () => {
    expect(shouldShowIntro({ ...first, reducedMotion: true })).toBe(false)
    expect(shouldShowIntro({ ...first, reducedMotion: true, search: '?intro=1' })).toBe(false)
  })

  it('?intro=0 (or off, false) never plays it; ?intro=1 plays it again for a returning child', () => {
    for (const v of ['0', 'off', 'false', 'OFF']) expect(shouldShowIntro({ ...first, search: `?intro=${v}` })).toBe(false)
    for (const v of ['1', 'on', 'true']) expect(shouldShowIntro({ ...first, name: 'Amara', search: `?intro=${v}` })).toBe(true)
  })

  it('other parts of the URL do not matter', () => {
    expect(shouldShowIntro({ ...first, search: '?view=3d&lang=pt' })).toBe(true)
    expect(shouldShowIntro({ ...first, name: 'X', search: '?view=3d' })).toBe(false)
  })

  it('"off" beats "on" being the default: ?intro=0 wins on a first visit', () => {
    expect(shouldShowIntro({ ...first, search: '?intro=0&lang=de' })).toBe(false)
  })
})
