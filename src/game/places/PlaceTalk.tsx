import { useEffect, useRef } from 'react'
import { useTypewriter } from '../ui/useTypewriter'
import { useT } from '../i18n/useT'
import { isTypingTarget } from '../utils/typingTarget'

type Props = {
  /** Who is talking (their name), for the screen reader and the heading. */
  who: string
  /** What they say, with her name in it. */
  line: string
  /** What she can answer. */
  options: readonly string[]
  onChoose: (index: number) => void
  onClose: () => void
}

/**
 * A friend's talk: what they say (typed out) and what she can answer, as big buttons. 1, 2 or 3 picks an answer,
 * Escape leaves the talk. Page elements over the room, not part of the picture.
 */
export function PlaceTalk({ who, line, options, onChoose, onClose }: Props) {
  const { t } = useT()
  const { shown } = useTypewriter(line)
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    first.current?.focus({ preventScroll: true })
  }, [line])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e.target)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= options.length) {
        e.preventDefault()
        onChoose(n - 1)
      }
    }
    // In the capture phase, so that Escape closes the talk or the book and does not also pause the game (the pause keys leave a key that is already handled alone).
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [options.length, onChoose, onClose])

  return (
    <div className="place-talk" role="dialog" aria-label={t('places.talkLabel', { who })}>
      <button type="button" className="place-talk__close" onClick={onClose} aria-label={t('places.close')}>
        ×
      </button>
      <p className="place-talk__who">{who}</p>
      {/* Screen readers get the whole line at once instead of letter by letter. */}
      <p className="visually-hidden" aria-live="polite">
        {line}
      </p>
      <p className="place-talk__line" aria-hidden="true">
        {shown}
      </p>
      <div className="place-talk__options" role="group" aria-label={t('places.optionsLabel')}>
        {options.map((label, i) => (
          <button key={`${line}-${i}`} ref={i === 0 ? first : undefined} type="button" className="btn place-talk__option" onClick={() => onChoose(i)}>
            <span className="place-talk__key" aria-hidden="true">
              {i + 1}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
