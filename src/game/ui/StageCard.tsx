import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import type { Difficulty, StageConfig } from '../types'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'
import { playSfx } from '../audio/sfx'

const STARS: Record<Difficulty, number> = { leicht: 1, mittel: 2, schwer: 3 }

/** Soft title card shown while a new stage settles in. Key it by stage index. */
export function StageCard({
  stage,
  stageIndex,
  totalStages,
}: {
  stage: StageConfig
  stageIndex: number
  totalStages: number
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    playSfx('stage')
    const id = window.setTimeout(
      () => setVisible(false),
      prefersReducedMotion() ? 900 : 1900
    )
    return () => window.clearTimeout(id)
  }, [])

  const stars = STARS[stage.difficulty]

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className="stage-card"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.45, 0, 0.55, 1] }}
        >
          <m.p
            className="stage-card__stage"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Stufe {stageIndex + 1} von {totalStages}
          </m.p>
          <m.p
            className="stage-card__subject"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {stage.subject}
          </m.p>
          <m.p
            className="stage-card__stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {'★'.repeat(stars)}
            {'☆'.repeat(3 - stars)}
          </m.p>
        </m.div>
      )}
    </AnimatePresence>
  )
}
