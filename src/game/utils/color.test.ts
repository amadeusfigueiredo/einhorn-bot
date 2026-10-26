import { describe, it, expect } from 'vitest'
import { lighten, mix } from './color'

describe('lighten', () => {
  it('leaves a colour alone at 0 and makes it white at 1', () => {
    expect(lighten('#3cc9a5', 0)).toBe('#3cc9a5')
    expect(lighten('#3cc9a5', 1)).toBe('#ffffff')
  })

  it('moves each channel part of the way to white', () => {
    expect(lighten('#000000', 0.5)).toBe('#808080')
    expect(lighten('#ff0000', 0.5)).toBe('#ff8080')
  })
})

describe('mix', () => {
  it('is the first colour at 0 and the second at 1', () => {
    expect(mix('#102030', '#a0b0c0', 0)).toBe('#102030')
    expect(mix('#102030', '#a0b0c0', 1)).toBe('#a0b0c0')
  })

  it('goes part of the way in between, channel by channel', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#ff0000', '#0000ff', 0.5)).toBe('#800080')
  })

  it('always gives a valid colour, with leading zeros kept', () => {
    expect(mix('#000000', '#000001', 1)).toBe('#000001')
    for (const k of [0, 0.1, 0.33, 0.9, 1]) expect(mix('#12ab34', '#fe0098', k)).toMatch(/^#[0-9a-f]{6}$/)
  })
})
