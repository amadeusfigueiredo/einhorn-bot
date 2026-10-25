import { useEffect, useRef } from 'react'
import { useT } from '../i18n/useT'
import { pauseStore } from '../pause/pauseStore'
import { albumCount } from '../stickers/albumModel'
import { completionPercent } from '../stickers/whereModel'
import { useGame } from '../logic/gameStore.instance'
import { goToClass, goToPlace } from '../todo/travel'
import { stickerStore, useStickers } from '../stickers/stickerStore'
import { StickerGrid, type GoTarget } from './StickerGrid'

/** "Go there" in the book: the book closes (the game goes on) and she goes to the place or the class. */
function goThere(target: GoTarget) {
  stickerStore.getState().closeBook()
  if (target.kind === 'class') goToClass(target.index)
  else goToPlace(target.where)
}

/**
 * The sticker book: the sticker of every class she has finished and the stickers for playing, the ones she has won in
 * colour and the others waiting in grey with how to win them, where to find them and a button to go there. A dialog the game waits behind (it takes the place of the
 * pause menu); Escape or P go back to the game.
 */
export function StickerBook() {
  const { t } = useT()
  const progress = useStickers()
  const solved = useGame((g) => g.solved)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
  }, [])
  const { got, total } = albumCount(solved, progress)
  const percent = completionPercent(solved, progress.got.length)

  return (
    <div className="scrim scrim--pause" role="dialog" aria-modal="true" aria-labelledby="sticker-book-title">
      <div className="card sticker-book">
        <h2 id="sticker-book-title" className="sticker-book__title">
          <span aria-hidden="true">📒</span> {t('stickers.title')}
        </h2>
        <p className="sticker-book__count">{t('stickers.count', { n: got, total })} · {t('stickers.percent', { n: percent })}</p>
        <div className="sticker-book__scroll">
          <StickerGrid progress={progress} onGo={goThere} />
        </div>
        <button
          ref={close}
          type="button"
          className="btn sticker-book__close"
          onClick={() => {
            stickerStore.getState().closeBook()
            pauseStore.getState().resume()
          }}
        >
          <span aria-hidden="true">▶️</span> {t('stickers.close')}
        </button>
      </div>
    </div>
  )
}
