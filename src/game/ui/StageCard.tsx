import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import type { Difficulty, StageConfig } from '../types'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'
import { playSfx } from '../audio/sfx'
import { usePaused } from '../pause/pauseStore'
import { useT } from '../i18n/useT'
import { subjectText } from '../i18n/phrases'
import { usePlayerName, fillName } from '../player/playerName'

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
  const { t, list } = useT()
  const wishes = list('personal.stageWish')
  const name = usePlayerName()

  const paused = usePaused()

  useEffect(() => {
    playSfx('stage')
  }, [])

  // A pause holds the card; going on gives it its full time again.
  useEffect(() => {
    if (paused) return
    const id = window.setTimeout(
      () => setVisible(false),
      prefersReducedMotion() ? 900 : 1900
    )
    return () => window.clearTimeout(id)
  }, [paused])

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
            {t('stage.of', { n: stageIndex + 1, total: totalStages })}
          </m.p>
          <m.p
            className="stage-card__subject"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {subjectText(t, stage.subject)}
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
          {name && (
            <m.p
              className="stage-card__wish"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {fillName(wishes[stageIndex % wishes.length], name)}
            </m.p>
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}
