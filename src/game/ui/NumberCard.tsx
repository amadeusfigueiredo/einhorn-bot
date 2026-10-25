import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { useT } from '../i18n/useT'
import { typeKey } from '../logic/numberAnswer'
import { isTypingTarget } from '../utils/typingTarget'

type NumberCardProps = {
  /** A small personal lead-in above the question. */
  kicker?: string
  prompt: string
  /** The number was typed and sent. */
  onSubmit: (typed: string) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'] as const

/**
 * A question whose answer is a number that is typed, on a number pad (touch) or with the digit keys (Backspace erases,
 * Enter sends). The same dialog as the question card, and the same question: the game only hears which answer it was.
 */
export function NumberCard({ kicker, prompt, onSubmit }: NumberCardProps) {
  const { t } = useT()
  const [typed, setTyped] = useState('')
  const typedRef = useRef(typed)
  typedRef.current = typed
  const cardRef = useRef<HTMLDivElement>(null)

  const press = (key: string) => {
    if (key === 'ok') {
      if (typedRef.current !== '') onSubmit(typedRef.current)
      return
    }
    setTyped((now) => typeKey(now, key))
  }
  const pressRef = useRef(press)
  pressRef.current = press

  useEffect(() => {
    cardRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      // (A focused button takes Enter itself: it sends only when the focus is not on a key of the pad.)
      const onButton = e.target instanceof HTMLButtonElement
      if (/^\d$/.test(e.key)) pressRef.current(e.key)
      else if (e.key === 'Backspace') pressRef.current('back')
      else if (e.key === 'Enter' && !onButton) pressRef.current('ok')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <m.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <m.div
        ref={cardRef}
        className="question question--number"
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-prompt"
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="question__head">
          {kicker && <p className="question__kicker">{kicker}</p>}
          <h2 id="question-prompt" className="question__prompt">
            {prompt}
          </h2>
        </div>
        <output className="number-card__display" aria-label={t('numberCard.display')} aria-live="polite">
          {typed === '' ? <span className="number-card__hint">{t('numberCard.hint')}</span> : typed}
        </output>
        <div className="number-card__pad">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={key === 'ok' ? 'number-card__key number-card__key--ok' : 'number-card__key'}
              aria-label={key === 'back' ? t('numberCard.erase') : key === 'ok' ? t('numberCard.ok') : key}
              disabled={key === 'ok' && typed === ''}
              onClick={() => press(key)}
            >
              <span aria-hidden="true">{key === 'back' ? '⌫' : key === 'ok' ? '✔' : key}</span>
            </button>
          ))}
        </div>
      </m.div>
    </m.div>
  )
}
