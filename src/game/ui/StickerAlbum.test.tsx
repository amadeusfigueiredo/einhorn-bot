// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { questionIds } from '../logic/classProgress'
import { gameStore } from '../logic/gameStore.instance'
import { STICKERS } from '../data/stickers'
import { WORLD_NAMES } from '../data/worlds'
import { PLAY_STICKERS } from '../stickers/stickerData'
import { stickerStore } from '../stickers/stickerStore'
import { StickerAlbum } from './StickerAlbum'
import { StickerBook } from './StickerBook'

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))
cleanupAfterEach()
const TOTAL = STICKERS.length + PLAY_STICKERS.length
beforeEach(() => stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false }))

/** The album with the first `n` classes finished. */
function renderAlbum(n: number, onClose: () => void = () => {}, lang: 'en' | 'de' | 'pt' = 'en') {
  gameStore.setState({ solved: new Set(STAGES.slice(0, n).flatMap(questionIds)) })
  return renderUI(<StickerAlbum onClose={onClose} />, lang)
}
function renderBook(n: number, lang: 'en' | 'de' | 'pt' = 'en') {
  gameStore.setState({ solved: new Set(STAGES.slice(0, n).flatMap(questionIds)) })
  return renderUI(<StickerBook />, lang)
}

describe('StickerAlbum (the finale card)', () => {
  it('is a dialog with a title and every sticker there is: the play ones and the one of every class', () => {
    const { container } = renderAlbum(STICKERS.length, () => {}, 'en')
    expect(screen.getByRole('dialog', { name: 'Your sticker album' })).toBeTruthy()
    expect(container.querySelectorAll('.sticker-book__sticker')).toHaveLength(TOTAL)
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Your sticker album', 'Play stickers', 'School stickers'])
  })

  it.each([0, 1, 7, 14, 15])('with %i finished classes that many class stickers are in colour', (n) => {
    const { container } = renderAlbum(n, () => {}, 'en')
    const school = [...container.querySelectorAll('.sticker-book__grid')][1].querySelectorAll('li.is-got')
    expect(school).toHaveLength(n)
    expect(screen.getByText(new RegExp(`^${n} of ${TOTAL} stickers`))).toBeTruthy()
  })

  it('shows the play stickers she has won too, in colour (it used to show only the classes)', () => {
    act(() => stickerStore.getState().earn('visitYard'))
    act(() => stickerStore.getState().earn('visitLibrary'))
    const { container } = renderAlbum(STICKERS.length, () => {}, 'en')
    const play = [...container.querySelectorAll('.sticker-book__grid')][0].querySelectorAll('li.is-got')
    expect([...play].map((li) => li.textContent)).toEqual([expect.stringContaining('Yard kid'), expect.stringContaining('Library mouse')])
    expect(screen.getByText(new RegExp(`^${STICKERS.length + 2} of ${TOTAL} stickers`))).toBeTruthy()
  })

  it('shows the ones she has not won in grey with how to win them, so she knows there is more to find', () => {
    const { container } = renderAlbum(STICKERS.length, () => {}, 'en')
    const kicker = [...container.querySelectorAll('.sticker-book__grid')][0].querySelectorAll('li')[2]
    expect(kicker.className).not.toContain('is-got')
    expect(kicker.textContent).toContain('Kick the unicorn ball 5 times.')
  })

  it('looks the same as the sticker book in the menu: the same stickers in the same look, won or not', () => {
    act(() => stickerStore.getState().earn('visitYard'))
    for (let i = 0; i < 3; i++) act(() => stickerStore.getState().earn('kick'))
    const album = renderAlbum(5, () => {}, 'en')
    const look = (li: Element) => `${li.className}|${[...li.children].filter((c) => c.tagName !== 'BUTTON').map((c) => c.outerHTML).join('')}`
    const fromAlbum = [...album.container.querySelectorAll('.sticker-book__sticker')].map(look)
    album.unmount()
    const book = renderBook(5, 'en')
    const fromBook = [...book.container.querySelectorAll('.sticker-book__sticker')].map(look)
    expect(fromAlbum).toHaveLength(TOTAL)
    expect(fromAlbum).toEqual(fromBook)
  })

  it('names each world in the chosen language and hides the emoji from screen readers', () => {
    for (const lang of ['de', 'pt', 'en'] as const) {
      const { container, unmount } = renderAlbum(15, () => {}, lang)
      const names = [...container.querySelectorAll('.sticker-book__grid')][1].querySelectorAll('.sticker-book__name')
      expect([...names].map((n) => n.textContent)).toEqual(STICKERS.map((s) => WORLD_NAMES[s.world][lang]))
      for (const e of container.querySelectorAll('.sticker-book__emoji')) expect(e.getAttribute('aria-hidden')).toBe('true')
      unmount()
    }
  })

  it('puts the keyboard on the close button, which closes it', () => {
    const onClose = vi.fn()
    renderAlbum(2, onClose, 'en')
    const close = screen.getByRole('button', { name: 'Close' })
    expect(document.activeElement).toBe(close)
    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
