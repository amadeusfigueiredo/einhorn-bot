// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { questionIds } from '../logic/classProgress'
import { gameStore } from '../logic/gameStore.instance'
import { STICKERS } from '../data/stickers'
import { pauseStore } from '../pause/pauseStore'
import { PLAY_STICKERS } from '../stickers/stickerData'
import { placeStore } from '../places/placeStore'
import { stickerStore } from '../stickers/stickerStore'
import { StickerBook } from './StickerBook'
import { StickerButton } from './StickerButton'
import { StickerToast, TOAST_SECONDS } from './StickerToast'

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))
cleanupAfterEach()
const reset = () => {
  stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false })
  pauseStore.getState().resume()
}
beforeEach(reset)
afterEach(() => {
  reset()
  vi.useRealTimers()
})

/** The book with the first `n` classes finished. */
function renderBook(n: number, lang: 'en' | 'de' | 'pt' = 'en') {
  gameStore.setState({ solved: new Set(STAGES.slice(0, n).flatMap(questionIds)) })
  return renderUI(<StickerBook />, lang)
}

describe('StickerBook', () => {
  it('lists the sticker of every class and every play sticker, with a count of what is won', () => {
    renderBook(3, 'en')
    expect(screen.getByRole('dialog', { name: 'My sticker book' })).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(STICKERS.length + PLAY_STICKERS.length)
    expect(screen.getByText(new RegExp(`^3 of ${STICKERS.length + PLAY_STICKERS.length} stickers`))).toBeTruthy()
    // The ones for playing come first (the school ones are all waiting at the start).
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Play stickers', 'School stickers'])
  })

  it('counts the play stickers won as well as the classes', () => {
    act(() => stickerStore.getState().earn('visitYard'))
    act(() => stickerStore.getState().earn('visitLibrary'))
    renderBook(1, 'en')
    expect(screen.getByText(new RegExp(`^3 of ${STICKERS.length + PLAY_STICKERS.length} stickers`))).toBeTruthy()
  })

  it('shows a sticker not yet won in grey, with how to win it, and one won as got', () => {
    act(() => stickerStore.getState().earn('visitYard'))
    const { container } = renderBook(0, 'en')
    const play = [...container.querySelectorAll('.sticker-book__grid')][0]
    const items = [...play.querySelectorAll('li')]
    const yard = items[0]
    const library = items[1]
    expect(yard.className).toContain('is-got')
    expect(yard.textContent).toContain('Yard kid')
    expect(yard.textContent).toContain('Got it!')
    expect(library.className).not.toContain('is-got')
    expect(library.textContent).toContain('Go into the library.')
  })

  it('says how far she is for a sticker that takes several, and no further than it asks', () => {
    for (let i = 0; i < 3; i++) act(() => stickerStore.getState().earn('kick'))
    renderBook(0, 'en')
    expect(screen.getByText('Kick the unicorn ball 5 times. (3/5)')).toBeTruthy()
    expect(screen.getByText('Kick the ball 25 times. (3/25)')).toBeTruthy()
    for (let i = 0; i < 30; i++) act(() => stickerStore.getState().earn('kick'))
    expect(screen.queryByText(/\(33\/25\)/)).toBeNull()
  })

  it('names the class stickers won, in colour, and the others in grey', () => {
    const { container } = renderBook(2, 'en')
    const school = [...container.querySelectorAll('.sticker-book__grid')][1].querySelectorAll('li')
    expect([...school].filter((li) => li.className.includes('is-got'))).toHaveLength(2)
  })

  it.each([
    ['de', 'Mein Stickerbuch'],
    ['pt', 'Meu álbum de figurinhas'],
  ] as const)('speaks %s', (lang, title) => {
    renderBook(0, lang)
    expect(screen.getByRole('dialog', { name: title })).toBeTruthy()
  })

  it('puts the focus on the way back to the game', () => {
    renderBook(0, 'en')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Back to the game/ }))
  })

  it('the way back closes the book and lets the game go on', () => {
    pauseStore.getState().pause()
    stickerStore.getState().openBook()
    renderBook(0, 'en')
    fireEvent.click(screen.getByRole('button', { name: /Back to the game/ }))
    expect(stickerStore.getState().bookOpen).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
  })
})

describe('StickerButton', () => {
  it('opens the book and holds the game', () => {
    renderUI(<StickerButton />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Sticker book' }))
    expect(stickerStore.getState().bookOpen).toBe(true)
    expect(pauseStore.getState().paused).toBe(true)
  })

  it.each([
    ['de', 'Stickerbuch'],
    ['pt', 'Álbum de figurinhas'],
  ] as const)('has its name in %s', (lang, name) => {
    renderUI(<StickerButton />, lang)
    expect(screen.getByRole('button', { name })).toBeTruthy()
  })
})

describe('StickerToast', () => {
  it('shows nothing when nothing is won', () => {
    const { container } = renderUI(<StickerToast />, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('says "New sticker!" with the name of the one just won, politely', () => {
    renderUI(<StickerToast />, 'en')
    act(() => stickerStore.getState().earn('visitYard'))
    const status = screen.getByRole('status')
    expect(status.textContent).toContain('New sticker!')
    expect(status.textContent).toContain('Yard kid')
  })

  it('says it in German and Portuguese', () => {
    renderUI(<StickerToast />, 'de')
    act(() => stickerStore.getState().earn('visitYard'))
    expect(screen.getByRole('status').textContent).toContain('Neuer Sticker!')
  })

  it('goes after a few seconds, and the next one comes', () => {
    vi.useFakeTimers()
    renderUI(<StickerToast />, 'en')
    act(() => stickerStore.getState().earn('visitYard'))
    act(() => stickerStore.getState().earn('visitLibrary'))
    expect(screen.getByRole('status').textContent).toContain('Yard kid')
    act(() => void vi.advanceTimersByTime(TOAST_SECONDS * 1000 - 100))
    expect(screen.getByRole('status').textContent).toContain('Yard kid')
    act(() => void vi.advanceTimersByTime(200))
    expect(screen.getByRole('status').textContent).toContain('Library mouse')
    act(() => void vi.advanceTimersByTime(TOAST_SECONDS * 1000 + 100))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows nothing for an id that is not a sticker (and does not break)', () => {
    const { container } = renderUI(<StickerToast />, 'en')
    act(() => stickerStore.setState({ toasts: ['gone'] }))
    expect(container.firstChild).toBeNull()
  })

  it('stops its timer when it goes away', () => {
    vi.useFakeTimers()
    const view = renderUI(<StickerToast />, 'en')
    act(() => stickerStore.getState().earn('visitYard'))
    view.unmount()
    act(() => void vi.advanceTimersByTime(TOAST_SECONDS * 1000 * 2))
    expect(stickerStore.getState().toasts).toEqual(['yard'])
  })
})

describe('StickerBook: hints and "Go there"', () => {
  it('says how much of the whole game is done next to the count', () => {
    renderBook(0)
    expect(screen.getByText(/^0 of \d+ stickers · 0 % of the game done$/)).toBeTruthy()
    act(() => stickerStore.getState().earn('visitYard'))
    renderBook(15)
    expect(screen.getAllByText(/ % of the game done$/).length).toBeGreaterThan(0)
  })

  it('a missing sticker says where it is, and "Go there" closes the book, lets the game go on and takes her there', () => {
    placeStore.setState({ place: 'class', from: 'class', trip: null })
    pauseStore.getState().pause()
    stickerStore.getState().openBook()
    renderBook(0)
    fireEvent.click(screen.getByRole('button', { name: /^Go there: Library mouse/ }))
    expect(stickerStore.getState().bookOpen).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
    expect(placeStore.getState().trip).toEqual({ from: 'class', to: 'library' })
  })

  it('the hint of a class sticker takes her into that class', () => {
    placeStore.setState({ place: 'class', from: 'class', trip: null })
    gameStore.setState({ stageIndex: 0 })
    renderBook(0)
    fireEvent.click(screen.getByRole('button', { name: /^Go there: Beach School/ }))
    expect(gameStore.getState().stageIndex).toBe(1)
  })
})

