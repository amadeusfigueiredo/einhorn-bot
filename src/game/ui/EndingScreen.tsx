import { useEffect, useRef } from 'react'
import { m } from 'framer-motion'
import { ENDING_BUTTON, ENDING_TEXT, ENDING_TITLE } from '../data/feedback'
import { SparkleBurst } from './SparkleBurst'

type EndingScreenProps = {
  imageSrc?: string
  onRestart: () => void
}

const STARS = 5

export function EndingScreen({ imageSrc, onRestart }: EndingScreenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

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
        className="card ending"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ending-title"
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
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
        {imageSrc && <img className="ending__image" src={imageSrc} alt="" />}
        <h2 id="ending-title" className="ending__title">
          {ENDING_TITLE}
        </h2>
        <p className="ending__text">{ENDING_TEXT}</p>
        <button
          ref={buttonRef}
          type="button"
          className="btn"
          onClick={onRestart}
        >
          {ENDING_BUTTON}
        </button>
      </m.div>
    </m.div>
  )
}
