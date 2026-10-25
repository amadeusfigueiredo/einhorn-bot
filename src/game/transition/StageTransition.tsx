import { useCallback, useEffect, useRef, useState } from 'react'
import { STAGES } from '../constants/stages'
import { CLASSROOMS } from '../data/classrooms'
import { WORLD_NAMES } from '../data/worlds'
import { useT } from '../i18n/useT'
import { difficultyText, subjectText } from '../i18n/phrases'
import { playSfx } from '../audio/sfx'
import { playVoice } from '../audio/voice'
import { usePaused } from '../pause/pauseStore'
import { Mascot } from '../ui/Mascot'
import { stickerFor } from '../data/stickers'
import { DONE_MS, REDUCED_MS } from './transitionModel'

/** "Stage complete!": three stars, the sticker won, and a button to the next class. */
function StageDoneCard({ from, onNext }: { from: number; onNext: () => void }) {
  const { t } = useT()
  const sticker = stickerFor(from)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    button.current?.focus()
    playSfx('sparkle')
    playVoice('cheer')
  }, [])
  return (
    <div className="transition__bg transition__bg--done" role="dialog" aria-modal="true" aria-labelledby="stage-done-title">
      <div className="transition__done">
        <Mascot pose="happy" size={120} />
        <h2 id="stage-done-title" className="transition__done-title">{t('feedback.stageDone')}</h2>
        <p className="transition__done-stars" aria-hidden="true">★ ★ ★</p>
        {sticker && (
          <p className="transition__sticker">
            <span className="transition__sticker-badge" aria-hidden="true">{sticker.emoji}</span>
            <span>{t('feedback.stageDoneSub')}</span>
          </p>
        )}
        <button ref={button} type="button" className="btn" onClick={(e) => { e.stopPropagation(); onNext() }}>
          {t('feedback.nextClass')} →
        </button>
      </div>
    </div>
  )
}

/**
 * The change to the next classroom. A finished stage starts with the "Stage
 * complete!" card, which waits for a tap. Then the 14 s film plays: Amara
 * leaves the old class through its door, walks the school corridor and
 * enters the next class through its own door; skippable at any moment. With
 * reduced motion only a still title card shows, briefly. The new world is
 * already there under the overlay; this only decides when it shows.
 */
export function StageTransition({ to, completed = false, onDone }: { from?: number | null; to: number; completed?: boolean; onDone: () => void }) {
  const { t, lang } = useT()
  // The 2D game has no film of the walk through the corridor: after the card a still title card shows, briefly (as with reduced motion in the 3D game).
  const reduced = true
  // A finished stage starts with a card that waits for a tap; then the walk begins.
  const [card, setCard] = useState(completed)
  const done = useRef(false)
  // The parent passes a fresh function on every render; keep the latest one in a ref so the timers are not restarted by it.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    onDoneRef.current()
  }, [])

  const paused = usePaused()

  // A pause holds the "Stage complete!" card; going on gives it its full time again.
  useEffect(() => {
    if (!card || paused) return
    const id = window.setTimeout(() => setCard(false), DONE_MS)
    return () => window.clearTimeout(id)
  }, [card, paused])

  // Reduced motion: no film, a still title card for a moment.
  useEffect(() => {
    if (card || !reduced || paused) return
    const id = window.setTimeout(finish, REDUCED_MS)
    return () => window.clearTimeout(id)
  }, [card, reduced, paused, finish])

  // Enter, Space and Escape skip too (the film listens for them itself).
  useEffect(() => {
    if (!card && !reduced) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        // On the card these keys mean "next class"; later they skip the walk.
        if (card) setCard(false)
        else finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, reduced, finish])

  const stage = STAGES[to]
  const room = CLASSROOMS[stage.name]

  return (
    <div className="transition" onPointerDown={() => (card ? setCard(false) : reduced ? finish() : undefined)}>
      {card && <StageDoneCard from={to - 1} onNext={() => setCard(false)} />}
      {!card && reduced && (
        <div className="transition__title" aria-hidden="true">
          <div className="transition__card">
            <div className="transition__card-stage">{t('stage.of', { n: to + 1, total: STAGES.length })}</div>
            <div className="transition__card-subject">{`${subjectText(t, stage.subject)} · ${difficultyText(t, stage.difficulty)}`}</div>
            <div className="transition__card-world">{WORLD_NAMES[room.world][lang]}</div>
          </div>
        </div>
      )}
    </div>
  )
}
