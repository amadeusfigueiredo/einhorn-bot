import { describe, expect, it } from 'vitest'
import { pauseKeyAction, type PauseKeyContext, type PauseKeyEvent } from './pauseKeys'

const play: PauseKeyContext = { paused: false, filmPlaying: false, nameCardOpen: false, menuOpen: false }
const key = (k: string, over: Partial<PauseKeyEvent> = {}): PauseKeyEvent => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, target: null, ...over })
const el = (tagName: string, isContentEditable = false) => ({ tagName, isContentEditable }) as unknown as EventTarget

describe('pauseKeyAction', () => {
  it('P toggles the pause, in a stage and in a film, paused or not', () => {
    for (const ctx of [play, { ...play, paused: true }, { ...play, filmPlaying: true }, { ...play, filmPlaying: true, paused: true }]) {
      expect(pauseKeyAction(key('p'), ctx)).toBe('toggle')
      expect(pauseKeyAction(key('P'), ctx)).toBe('toggle')
    }
  })

  it('Escape pauses a stage, and goes on when it is paused', () => {
    expect(pauseKeyAction(key('Escape'), play)).toBe('pause')
    expect(pauseKeyAction(key('Escape'), { ...play, paused: true })).toBe('resume')
  })

  it('Escape belongs to a film (it skips it), paused or not', () => {
    expect(pauseKeyAction(key('Escape'), { ...play, filmPlaying: true })).toBeNull()
    expect(pauseKeyAction(key('Escape'), { ...play, filmPlaying: true, paused: true })).toBeNull()
  })

  it('Escape belongs to the name card and to an open menu', () => {
    expect(pauseKeyAction(key('Escape'), { ...play, nameCardOpen: true })).toBeNull()
    expect(pauseKeyAction(key('Escape'), { ...play, menuOpen: true })).toBeNull()
  })

  it('an open menu does not keep a paused game from going on with Escape', () => {
    expect(pauseKeyAction(key('Escape'), { ...play, paused: true, menuOpen: true })).toBe('resume')
  })

  it('other keys do nothing', () => {
    for (const k of ['a', 'e', 'Enter', ' ', 'ArrowUp', 'Tab']) expect(pauseKeyAction(key(k), play)).toBeNull()
  })

  it('leaves a key alone that someone else already handled, or that is a shortcut', () => {
    expect(pauseKeyAction(key('p', { defaultPrevented: true }), play)).toBeNull()
    expect(pauseKeyAction(key('p', { ctrlKey: true }), play)).toBeNull()
    expect(pauseKeyAction(key('p', { metaKey: true }), play)).toBeNull()
    expect(pauseKeyAction(key('p', { altKey: true }), play)).toBeNull()
  })

  it('never pauses while the child types (the name "Paula" has two p)', () => {
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) expect(pauseKeyAction(key('p', { target: el(tag) }), play)).toBeNull()
    expect(pauseKeyAction(key('p', { target: el('DIV', true) }), play)).toBeNull()
    expect(pauseKeyAction(key('p', { target: el('BUTTON') }), play)).toBe('toggle')
  })
})
