import { useEffect, useRef } from 'react'
import { useT } from '../../i18n/useT'
import { playSfx } from '../../audio/sfx'
import { isTypingTarget } from '../../utils/typingTarget'
import { BOOKS } from '../data/hangouts'
import { BookPicture } from './BookPicture'
import { BOOK_ART } from './bookArt'
import { PAGES, isFirstPage, isLastPage, readerStore, useReading } from './bookReader'

/**
 * An open book over the room: the picture on the left page, the text on the right, three pages. Weiter / Zurück turn
 * the page, Zuklappen (or Escape) closes the book; the arrow keys turn pages too. Page elements, not part of the picture.
 */
export function BookReader() {
  const reading = useReading()
  const { t, lang } = useT()
  const next = useRef<HTMLButtonElement>(null)

  const open = reading !== null
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e.target)) return
      const { next: forward, back, close } = readerStore.getState()
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') forward()
      else if (e.key === 'ArrowLeft') back()
      else return
      e.preventDefault()
    }
    // In the capture phase, so that Escape closes the talk or the book and does not also pause the game (the pause keys leave a key that is already handled alone).
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  // Turning a page keeps the keyboard on the button that turns it.
  const page = reading?.page
  useEffect(() => {
    next.current?.focus({ preventScroll: true })
  }, [page, open])

  if (!reading) return null
  const book = BOOKS.find((b) => b.id === reading.book)!
  const title = book.title[lang]
  const last = isLastPage(reading)
  const turn = (by: 'next' | 'back') => {
    playSfx('tick')
    readerStore.getState()[by]()
  }

  return (
    <div className="book-reader" role="dialog" aria-label={t('places.book', { title })} style={{ ['--book-color' as string]: book.color }}>
      <div className="book-reader__spread">
        <div className="book-reader__art" aria-hidden="true">
          <BookPicture scene={BOOK_ART[book.id][reading.page]} />
        </div>
        <div className="book-reader__text">
          <h2 className="book-reader__title">{title}</h2>
          <p className="book-reader__page-text">{book.pages[reading.page][lang]}</p>
          <p className="book-reader__count">{t('places.page', { n: reading.page + 1, total: PAGES })}</p>
        </div>
      </div>
      <div className="book-reader__buttons">
        <button type="button" className="btn book-reader__button" onClick={() => turn('back')} disabled={isFirstPage(reading)}>
          {t('places.back')}
        </button>
        {last ? (
          <button ref={next} type="button" className="btn book-reader__button" onClick={() => readerStore.getState().close()}>
            {t('places.closeBook')}
          </button>
        ) : (
          <button ref={next} type="button" className="btn book-reader__button" onClick={() => turn('next')}>
            {t('places.next')}
          </button>
        )}
        {!last && (
          <button type="button" className="book-reader__close" onClick={() => readerStore.getState().close()} aria-label={t('places.closeBook')}>
            ×
          </button>
        )}
      </div>
    </div>
  )
}
