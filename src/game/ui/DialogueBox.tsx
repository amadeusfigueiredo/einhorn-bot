import { useEffect } from 'react'
import { m } from 'framer-motion'
import { useTypewriter } from './useTypewriter'
import { NEXT_LINE_HINT } from '../data/feedback'
import { SPEAKER_NAME } from '../data/dialogue'

type DialogueBoxProps = {
  text: string
  portraitSrc?: string
  /** Called when the player is done reading and moves on to the question. */
  onContinue: () => void
}

const CONTINUE_KEYS = new Set(['e', 'enter', ' '])

export function DialogueBox({ text, portraitSrc, onContinue }: DialogueBoxProps) {
  const { shown, done, finish } = useTypewriter(text)

  const advance = () => (done ? onContinue() : finish())

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // `repeat` ignores the E press that opened this very conversation.
      if (e.repeat || !CONTINUE_KEYS.has(e.key.toLowerCase())) return
      e.preventDefault()
      if (done) onContinue()
      else finish()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [done, finish, onContinue])

  return (
    <m.div
      className="dialogue"
      role="dialog"
      aria-label={SPEAKER_NAME}
      onClick={advance}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {portraitSrc && (
        <img className="dialogue__portrait" src={portraitSrc} alt="" />
      )}
      <div>
        <p className="dialogue__speaker">{SPEAKER_NAME}</p>
        {/* Screen readers get the whole line at once instead of letter by letter. */}
        <p className="visually-hidden" aria-live="polite">
          {text}
        </p>
        <p className="dialogue__text" aria-hidden="true">
          {shown}
        </p>
      </div>
      <p className="dialogue__next" aria-hidden="true">
        {done ? NEXT_LINE_HINT : '…'}
      </p>
    </m.div>
  )
}
