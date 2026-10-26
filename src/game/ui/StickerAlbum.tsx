import { useEffect, useRef } from 'react'
import { useT } from '../i18n/useT'
import { albumCount } from '../stickers/albumModel'
import { useStickers } from '../stickers/stickerStore'
import { useGame } from '../logic/gameStore.instance'
import { StickerGrid, type GoTarget } from './StickerGrid'

/**
 * The sticker album on the finale card: the same stickers, in the same look, as the sticker book in the menu (the ones
 * she has won in colour, the others waiting in grey with how to win them), and a count of all of them.
 */
export function StickerAlbum({ onClose, onGo }: { onClose: () => void; onGo?: (target: GoTarget) => void }) {
  const { t } = useT()
  const progress = useStickers()
  const solved = useGame((g) => g.solved)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { got, total } = albumCount(solved, progress)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="album" role="dialog" aria-modal="true" aria-labelledby="album-title">
      <h3 id="album-title" className="album__title">{t('album.title')}</h3>
      <p className="album__count">{t('album.count', { n: got, total })}</p>
      <div className="sticker-book__scroll album__scroll">
        <StickerGrid progress={progress} onGo={onGo} />
      </div>
      <button ref={closeRef} type="button" className="btn" onClick={onClose}>
        {t('album.close')}
      </button>
    </div>
  )
}
