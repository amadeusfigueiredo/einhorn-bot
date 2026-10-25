import { m } from 'framer-motion'
import type { PopupConfig } from '../data/popups'
import { pickLine } from '../data/feedback'
import { useT } from '../i18n/useT'
import { usePlayerName, fillName } from '../player/playerName'
import { SparkleBurst } from './SparkleBurst'
import { Mascot } from './Mascot'

type FeedbackPopupProps = {
  config: PopupConfig
  /** Used to vary the line shown; stable while this popup is open. */
  seed: number
  /** For a wrong answer: the text of the right one, shown kindly. */
  answer?: string | null
  /** The "Try again" button: close the message now. */
  onDismiss?: () => void
  /** For "class done, but not the whole school": how many classes are still to do, and the button that shows which. */
  left?: number
  onShowLeft?: () => void
}

/**
 * "Right!" (mint, the mascot jumps, confetti, a star) and "Almost!" (lavender,
 * the mascot thinks, the right answer, a Try-again button). Never red, never sad.
 */
export function FeedbackPopup({ config, seed, answer, onDismiss, left = 0, onShowLeft }: FeedbackPopupProps) {
  const { t, list } = useT()
  const name = usePlayerName()
  // "Class done, but the school is not finished" is a happy message too, with a different title and what to do next.
  const isFinish = config.id === 'FINISH_ALL'
  const isWin = config.id === 'WIN' || isFinish
  const title = t(isFinish ? 'feedback.finishAllTitle' : isWin ? 'feedback.winTitle' : 'feedback.wrongTitle')
  const lines = isWin
    ? list(name ? 'feedback.winLinesNamed' : 'feedback.winLines')
    : list(name ? 'feedback.wrongHintsNamed' : 'feedback.wrongHints')
  const line = isFinish ? t(left === 1 ? 'feedback.finishAllText1' : 'feedback.finishAllText', { n: left }) : fillName(pickLine(lines, seed), name)

  return (
    <m.div
      className="scrim scrim--popup scrim--feedback"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {isWin && <SparkleBurst count={36} />}
      <m.div
        className={`popup ${isWin ? 'popup--win' : 'popup--wrong'}`}
        role="status"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <Mascot pose={isWin ? 'happy' : 'think'} size={130} className="popup__mascot" />
        <h2 className="popup__title">{title}</h2>
        <p className="popup__text">{line}</p>
        {isWin && !isFinish && <p className="popup__star">★ {t('feedback.plusStar')}</p>}
        {isFinish && onShowLeft && (
          <button type="button" className="btn popup__button" onClick={onShowLeft}>
            {t('feedback.showMe')}
          </button>
        )}
        {!isWin && answer && <p className="popup__answer">{t('feedback.answerIs', { answer })}</p>}
        {!isWin && onDismiss && (
          <button type="button" className="btn popup__button" onClick={onDismiss}>
            {t('feedback.again')}
          </button>
        )}
      </m.div>
    </m.div>
  )
}
