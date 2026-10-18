import { describe, expect, it } from 'vitest'
import { typewriterDuration, typewriterSlice } from './typewriter'

describe('typewriterSlice', () => {
  it('reveals one character per interval', () => {
    expect(typewriterSlice('Hallo', 0, 30)).toBe('')
    expect(typewriterSlice('Hallo', 29, 30)).toBe('')
    expect(typewriterSlice('Hallo', 30, 30)).toBe('H')
    expect(typewriterSlice('Hallo', 95, 30)).toBe('Hal')
  })

  it('never reveals more than the whole text', () => {
    expect(typewriterSlice('Hi', 10_000, 30)).toBe('Hi')
    expect(typewriterSlice('Hi', Number.POSITIVE_INFINITY, 30)).toBe('Hi')
  })

  it('shows everything at once when the speed is zero', () => {
    expect(typewriterSlice('Hallo', 0, 0)).toBe('Hallo')
  })

  it('does not split emoji in half', () => {
    expect(typewriterSlice('a🦄b', 60, 30)).toBe('a🦄')
  })

  it('reports how long the whole line takes', () => {
    expect(typewriterDuration('Hallo', 30)).toBe(150)
    expect(typewriterDuration('a🦄', 30)).toBe(60)
  })
})
