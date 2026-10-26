import { describe, expect, it } from 'vitest'
import { shouldShowStartMenu } from './startModel'

describe('shouldShowStartMenu', () => {
  it('shows every time the game opens', () => {
    expect(shouldShowStartMenu('')).toBe(true)
    expect(shouldShowStartMenu('?view=3d&lang=de&hero=unicorn')).toBe(true)
  })

  it('?menu=0 (or off, false) goes straight into the game', () => {
    for (const v of ['0', 'off', 'false', 'OFF', 'False']) expect(shouldShowStartMenu(`?menu=${v}`), v).toBe(false)
  })

  it('?intro=0 means straight into the game too: the browser scripts use it', () => {
    expect(shouldShowStartMenu('?view=3d&intro=0&transition=0&e2e')).toBe(false)
  })

  it('?intro=1 asks for the intro, which comes after the menu: the menu still shows', () => {
    expect(shouldShowStartMenu('?intro=1')).toBe(true)
  })

  it('other values do not switch it off', () => {
    expect(shouldShowStartMenu('?menu=1')).toBe(true)
    expect(shouldShowStartMenu('?menu=yes&intro=maybe')).toBe(true)
  })
})
