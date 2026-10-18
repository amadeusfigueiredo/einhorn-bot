import { m } from 'framer-motion'
import type { PopupConfig } from '../data/popups'
import {
  WIN_TITLE,
  WIN_LINES,
  WRONG_TITLE,
  WRONG_HINTS,
  pickLine,
} from '../data/feedback'
import { SparkleBurst } from './SparkleBurst'

type FeedbackPopupProps = {
  config: PopupConfig
  /** Used to vary the line shown; stable while this popup is open. */
  seed: number
  imageSrc?: string
}

export function FeedbackPopup({ config, seed, imageSrc }: FeedbackPopupProps) {
  const isWin = config.id === 'WIN'
  const title = isWin ? WIN_TITLE : WRONG_TITLE
  const line = isWin ? pickLine(WIN_LINES, seed) : pickLine(WRONG_HINTS, seed)

  return (
    <m.div
      className="scrim scrim--popup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {isWin && <SparkleBurst />}
      <m.div
        className={`popup ${isWin ? 'popup--win' : 'popup--wrong'}`}
        role="status"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        {imageSrc && <img className="popup__image" src={imageSrc} alt="" />}
        <h2 className="popup__title">{title}</h2>
        <p className="popup__text">{line}</p>
      </m.div>
    </m.div>
  )
}
