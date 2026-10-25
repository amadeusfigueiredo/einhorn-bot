import { describe, expect, it } from 'vitest'
import { canDance, isDanceKey, type DanceContext, type DanceKeyEvent } from './danceKeys'

const key = (over: Partial<DanceKeyEvent> = {}): DanceKeyEvent => ({ key: ' ', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, defaultPrevented: false, target: null, ...over })
const ctx = (over: Partial<DanceContext> = {}): DanceContext => ({ hero: 'amara', view: '3d', paused: false, covered: false, nameCardOpen: false, worldPaused: false, busy: false, menuOpen: false, ...over })

describe('isDanceKey', () => {
  it('is the Space bar pressed on its own', () => {
    expect(isDanceKey(key())).toBe(true)
    expect(isDanceKey(key({ key: 'Spacebar' }))).toBe(true)
  })

  it('is not another key', () => {
    for (const k of ['a', 'Enter', 'Escape', 'ArrowUp', 'p']) expect(isDanceKey(key({ key: k }))).toBe(false)
  })

  it('is not a held Space, a key that was already handled, or Space with another key', () => {
    expect(isDanceKey(key({ repeat: true }))).toBe(false)
    expect(isDanceKey(key({ defaultPrevented: true }))).toBe(false)
    for (const mod of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey'] as const) expect(isDanceKey(key({ [mod]: true }))).toBe(false)
  })

  it('is not a Space that a button, a link, a field or a list uses itself', () => {
    for (const tagName of ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY']) expect(isDanceKey(key({ target: { tagName } as unknown as EventTarget })), tagName).toBe(false)
    expect(isDanceKey(key({ target: { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget }))).toBe(false)
    expect(isDanceKey(key({ target: { tagName: 'DIV' } as unknown as EventTarget }))).toBe(true)
    expect(isDanceKey(key({ target: { tagName: 'BODY' } as unknown as EventTarget }))).toBe(true)
  })
})

describe('canDance', () => {
  it('is yes for Amara in the 3D view with nothing in the way', () => {
    expect(canDance(ctx())).toBe(true)
  })

  it('is yes for the unicorn hero too', () => {
    expect(canDance(ctx({ hero: 'unicorn' }))).toBe(true)
  })

  it.each([
    ['the 2D view is up (the hero is not drawn)', { view: '2d' }],
    ['the game is paused', { paused: true }],
    ['a film or the menu covers the game', { covered: true }],
    ['her name is being asked', { nameCardOpen: true }],
    ['a teacher talks or asks', { worldPaused: true }],
    ['a friend talks or a book is open', { busy: true }],
    ['a dropdown is open', { menuOpen: true }],
  ] as const)('is no when %s', (_why, over) => {
    expect(canDance(ctx(over as Partial<DanceContext>))).toBe(false)
  })
})
