import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { stickerStore } from '../../stickers/stickerStore'
import { BOOKS } from '../data/hangouts'
import { PAGES, bookById, createReaderStore, isFirstPage, isLastPage, isReading, openBook, readerStore, turnPage } from './bookReader'

const clear = () => stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false })
beforeEach(clear)
afterEach(() => readerStore.getState().close())

describe('reading a book', () => {
  it('finds the books by id, and not the ones that are not there', () => {
    for (const b of BOOKS) expect(bookById(b.id)).toBe(b)
    expect(bookById(99)).toBeUndefined()
  })

  it('opens at the first page, and nothing for a book that is not there', () => {
    expect(openBook(2)).toEqual({ book: 2, page: 0 })
    expect(openBook(-1)).toBeNull()
  })

  it('turns pages forward and back and stops at both ends', () => {
    let r = openBook(0)!
    expect(isFirstPage(r)).toBe(true)
    r = turnPage(r, -1)
    expect(r.page).toBe(0)
    r = turnPage(turnPage(r, 1), 1)
    expect(r.page).toBe(PAGES - 1)
    expect(isLastPage(r)).toBe(true)
    expect(turnPage(r, 1).page).toBe(PAGES - 1)
    expect(turnPage(r, -1).page).toBe(PAGES - 2)
  })

  it('has three pages, as the design says', () => {
    expect(PAGES).toBe(3)
    for (const b of BOOKS) expect(b.pages).toHaveLength(PAGES)
  })
})

describe('the reader store', () => {
  it('has no book open at first', () => {
    expect(createReaderStore().getState().reading).toBeNull()
  })

  it('opens a book, turns its pages and closes it', () => {
    const s = createReaderStore()
    s.getState().open(3)
    expect(s.getState().reading).toEqual({ book: 3, page: 0 })
    s.getState().next()
    s.getState().next()
    s.getState().next()
    expect(s.getState().reading).toEqual({ book: 3, page: 2 })
    s.getState().back()
    expect(s.getState().reading).toEqual({ book: 3, page: 1 })
    s.getState().close()
    expect(s.getState().reading).toBeNull()
  })

  it('opening a book that is not there leaves nothing open', () => {
    const s = createReaderStore()
    s.getState().open(0)
    s.getState().open(42)
    expect(s.getState().reading).toBeNull()
  })

  it('turning a page with no book open does nothing', () => {
    const s = createReaderStore()
    s.getState().next()
    s.getState().back()
    expect(s.getState().reading).toBeNull()
  })

  it('the shared one says whether a book is open', () => {
    expect(isReading()).toBe(false)
    readerStore.getState().open(1)
    expect(isReading()).toBe(true)
  })
})

describe('reading a book is told to the stickers', () => {
  it('when the last page is reached, with the book it was, and not before', () => {
    const s = createReaderStore()
    s.getState().open(3)
    s.getState().next()
    expect(stickerStore.getState().counts.book).toBeUndefined()
    s.getState().next()
    expect(stickerStore.getState().counts.book).toBe(1)
    expect(stickerStore.getState().seen.book).toEqual(['3'])
  })

  it('once for each time she gets there, not again for a press on the last page, and again after going back and forth', () => {
    const s = createReaderStore()
    s.getState().open(1)
    s.getState().next()
    s.getState().next()
    s.getState().next()
    expect(stickerStore.getState().counts.book).toBe(1)
    s.getState().back()
    s.getState().next()
    expect(stickerStore.getState().counts.book).toBe(2)
    expect(stickerStore.getState().seen.book).toEqual(['1'])
  })

  it('five different books win the big bookworm', () => {
    const s = createReaderStore()
    for (const b of BOOKS) {
      s.getState().open(b.id)
      s.getState().next()
      s.getState().next()
    }
    expect(stickerStore.getState().got).toEqual(expect.arrayContaining(['reader', 'readerPro']))
  })

  it('turning a page with no book open tells nothing', () => {
    createReaderStore().getState().next()
    expect(stickerStore.getState().counts.book).toBeUndefined()
  })
})
