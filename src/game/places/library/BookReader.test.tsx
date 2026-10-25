// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../../test/ui'
import { BOOKS } from '../data/hangouts'
import { readerStore } from './bookReader'
import { BOOK_ART } from './bookArt'
import { BookReader } from './BookReader'

cleanupAfterEach()
vi.mock('../../audio/sfx', () => ({ playSfx: vi.fn() }))
afterEach(() => act(() => readerStore.getState().close()))

const open = (id: number) => act(() => readerStore.getState().open(id))

describe('BookReader', () => {
  it('shows nothing while no book is open', () => {
    const { container } = renderUI(<BookReader />, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('shows the open book: its picture on the left, its text on the right, and its title', () => {
    renderUI(<BookReader />, 'en')
    open(0)
    expect(screen.getByRole('dialog', { name: 'Book: The Moon Koala' })).toBeTruthy()
    expect(screen.getByText(BOOKS[0].pages[0].en)).toBeTruthy()
    expect(screen.getByText('Page 1 of 3')).toBeTruthy()
    // The left page is a drawing (the words are on the right): the koala's page has a koala on the moon.
    const art = document.querySelector('.book-reader__art svg')!
    expect(art.getAttribute('aria-hidden')).toBe('true')
    expect([...art.querySelectorAll('[data-kind]')].map((g) => g.getAttribute('data-kind'))).toEqual(BOOK_ART[0][0].props.map((p) => p.kind))
    expect(screen.getByRole('heading', { name: 'The Moon Koala' })).toBeTruthy()
  })

  it.each([
    ['en', 'Next', 'Back', 'Close the book'],
    ['de', 'Weiter', 'Zurück', 'Zuklappen'],
    ['pt', 'Próxima', 'Voltar', 'Fechar o livro'],
  ] as const)('has its buttons in %s: %s, %s, %s', (lang, next, back, close) => {
    renderUI(<BookReader />, lang)
    open(1)
    expect(screen.getByRole('button', { name: next })).toBeTruthy()
    expect(screen.getByRole('button', { name: back })).toBeTruthy()
    act(() => void screen.getByRole('button', { name: next }).click())
    act(() => void screen.getByRole('button', { name: next }).click())
    expect(screen.getByRole('button', { name: close })).toBeTruthy()
  })

  it('reads in her language', () => {
    renderUI(<BookReader />, 'de')
    open(3)
    expect(screen.getByText(BOOKS[3].pages[0].de)).toBeTruthy()
    expect(screen.getByRole('heading', { name: BOOKS[3].title.de })).toBeTruthy()
  })

  it('turns the pages with the buttons: three pages, the picture and the text change, Back is off on the first page', () => {
    renderUI(<BookReader />, 'en')
    open(2)
    const back = screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement
    expect(back.disabled).toBe(true)
    act(() => void screen.getByRole('button', { name: 'Next' }).click())
    expect(screen.getByText(BOOKS[2].pages[1].en)).toBeTruthy()
    expect([...document.querySelectorAll('.book-reader__art [data-kind]')].map((g) => g.getAttribute('data-kind'))).toEqual(BOOK_ART[2][1].props.map((p) => p.kind))
    expect(back.disabled).toBe(false)
    act(() => void screen.getByRole('button', { name: 'Next' }).click())
    expect(screen.getByText(BOOKS[2].pages[2].en)).toBeTruthy()
    expect(screen.getByText('Page 3 of 3')).toBeTruthy()
    act(() => void back.click())
    expect(screen.getByText(BOOKS[2].pages[1].en)).toBeTruthy()
  })

  it('on the last page the button closes the book; the little × closes it on the other pages', () => {
    renderUI(<BookReader />, 'en')
    open(0)
    act(() => void screen.getByRole('button', { name: 'Close the book' }).click())
    expect(readerStore.getState().reading).toBeNull()
    open(0)
    act(() => void screen.getByRole('button', { name: 'Next' }).click())
    act(() => void screen.getByRole('button', { name: 'Next' }).click())
    expect(screen.queryByText('×')).toBeNull()
    expect(screen.getByRole('button', { name: 'Close the book' })).toBeTruthy()
    act(() => void screen.getByRole('button', { name: 'Close the book' }).click())
    expect(readerStore.getState().reading).toBeNull()
  })

  it('turns pages and closes with the keys: arrows and Escape', () => {
    renderUI(<BookReader />, 'en')
    open(4)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(readerStore.getState().reading?.page).toBe(1)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(readerStore.getState().reading?.page).toBe(0)
    fireEvent.keyDown(window, { key: 'x' })
    expect(readerStore.getState().reading?.page).toBe(0)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(readerStore.getState().reading).toBeNull()
  })

  it('handles Escape before the pause keys see it, and says so (so Escape does not also pause the game)', () => {
    renderUI(<BookReader />, 'en')
    open(4)
    const seen: boolean[] = []
    const later = (e: KeyboardEvent) => seen.push(e.defaultPrevented)
    window.addEventListener('keydown', later)
    fireEvent.keyDown(window, { key: 'Escape' })
    window.removeEventListener('keydown', later)
    expect(seen).toEqual([true])
  })

  it('ignores held keys and keys typed in a field', () => {
    renderUI(<BookReader />, 'en')
    open(4)
    fireEvent.keyDown(window, { key: 'ArrowRight', repeat: true })
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    input.remove()
    expect(readerStore.getState().reading?.page).toBe(0)
  })

  it('does not listen for keys while no book is open', () => {
    renderUI(<BookReader />, 'en')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(readerStore.getState().reading).toBeNull()
  })

  it('keeps the keyboard on the button that turns the page', () => {
    renderUI(<BookReader />, 'en')
    open(0)
    expect(document.activeElement?.textContent).toBe('Next')
    act(() => void screen.getByRole('button', { name: 'Next' }).click())
    expect(document.activeElement?.textContent).toBe('Next')
  })

  it('every book can be opened and read to the end', () => {
    renderUI(<BookReader />, 'en')
    for (const book of BOOKS) {
      open(book.id)
      for (let p = 0; p < 3; p++) {
        expect(screen.getByText(book.pages[p].en)).toBeTruthy()
        if (p < 2) act(() => void screen.getByRole('button', { name: 'Next' }).click())
      }
      act(() => void screen.getByRole('button', { name: 'Close the book' }).click())
    }
  })
})
