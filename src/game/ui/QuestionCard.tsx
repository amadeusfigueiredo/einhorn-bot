import { useEffect, useRef } from 'react'
import { m } from 'framer-motion'
import { isTypingTarget } from '../utils/typingTarget'

type QuestionCardProps = {
  /** A small personal lead-in above the question, e.g. "Amara, weißt du das?" */
  kicker?: string
  prompt: string
  choices: string[]
  onPick: (index: number) => void
  /** A picture for the question, drawn with emoji (the candies of the first lesson). */
  visual?: string
  /** The answer she tried that was not it: it is marked softly (she can try again). */
  wrongPick?: number
}

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

export function QuestionCard({ kicker, prompt, choices, onPick, visual, wrongPick = -1 }: QuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Move focus into the dialog so keyboard users land on it, and let the
  // letter keys pick an answer.
  useEffect(() => {
    cardRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      const index = LETTERS.indexOf(e.key.toLowerCase())
      if (index >= 0 && index < choices.length) {
        e.preventDefault()
        onPick(index)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [choices.length, onPick])

  return (
    <m.div
      className="scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <m.div
        ref={cardRef}
        className="question"
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
          {visual && (
            <p className="question__visual" aria-hidden="true">
              {visual}
            </p>
          )}
        </div>
        <ul className="question__choices">
          {choices.map((choice, i) => (
            <li key={choice}>
              <button
                type="button"
                className={i === wrongPick ? 'choice is-tried' : 'choice'}
                onClick={() => onPick(i)}
              >
                <span className="choice__letter" aria-hidden="true">
                  {LETTERS[i].toUpperCase()}
                </span>
                <span>{choice}</span>
              </button>
            </li>
          ))}
        </ul>
      </m.div>
    </m.div>
  )
}
