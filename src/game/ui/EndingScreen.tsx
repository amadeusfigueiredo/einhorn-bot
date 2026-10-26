import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { useT } from '../i18n/useT'
import { usePlayerName, fillName } from '../player/playerName'
import { SparkleBurst } from './SparkleBurst'
import { Mascot } from './Mascot'
import { StickerAlbum } from './StickerAlbum'
import { useGame } from '../logic/gameStore.instance'
import { completionPercent } from '../stickers/whereModel'
import { useStickers } from '../stickers/stickerStore'
import { goToClass, goToPlace } from '../todo/travel'
import type { GoTarget } from './StickerGrid'

type EndingScreenProps = {
  onRestart: () => void
  /** "Keep playing for 100 %": the card goes away and the game goes on, to find the stickers she is missing. */
  onKeepPlaying?: () => void
}

const STARS = 5

/**
 * The finale: the mascot with a crown and a trophy, "You did it, {name}!", how much of the whole game she has done, play
 * again, keep playing (while there is more to find: stickers she is missing) and the sticker album.
 */
export function EndingScreen({ onRestart, onKeepPlaying }: EndingScreenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { t } = useT()
  const name = usePlayerName()
  const [album, setAlbum] = useState(false)
  const solved = useGame((g) => g.solved)
  const percent = completionPercent(solved, useStickers().got.length)
  // Going somewhere from the album (a sticker's hint) goes on with the game first.
  const goThere = (target: GoTarget) => {
    onKeepPlaying?.()
    if (target.kind === 'class') goToClass(target.index)
    else goToPlace(target.where)
  }

  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  return (
    <m.div
      className="scrim scrim--popup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SparkleBurst count={48} />
      <m.div
        className={album ? 'card ending ending--album' : 'card ending'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ending-title"
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {album ? (
          <StickerAlbum onClose={() => setAlbum(false)} onGo={onKeepPlaying ? goThere : undefined} />
        ) : (
          <>
            <ul className="ending__stars" aria-hidden="true">
              {Array.from({ length: STARS }, (_, i) => (
                <m.li
                  key={i}
                  initial={{ opacity: 0, scale: 0.2, rotate: -40 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
                >
                  ★
                </m.li>
              ))}
            </ul>
            <Mascot pose="proud" size={170} className="ending__mascot" />
            <h2 id="ending-title" className="ending__title">
              {fillName(t(name ? 'ending.titleNamed' : 'ending.title'), name)}
            </h2>
            <p className="ending__text">{fillName(t(name ? 'ending.textNamed' : 'ending.text'), name)}</p>
            {percent < 100 && <p className="ending__percent">{t('ending.more', { n: percent })}</p>}
            <div className="ending__actions">
              <button ref={buttonRef} type="button" className="btn" onClick={onRestart}>
                {t('ending.button')}
              </button>
              {onKeepPlaying && percent < 100 && (
                <button type="button" className="btn ending__keep" onClick={onKeepPlaying}>
                  {t('ending.keepPlaying')}
                </button>
              )}
              <button type="button" className="ending__album" onClick={() => setAlbum(true)}>
                {t('ending.album')}
              </button>
            </div>
          </>
        )}
      </m.div>
    </m.div>
  )
}
