import { useEffect, useRef, type ReactNode } from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { isTypingTarget } from '../utils/typingTarget'
import type { ActivityState } from './activityStore'

/** The words of a panel, written by the activity in the language of the game. */
export type ActivityLabels = {
  title: string
  icon: string
  close: string
  /** What the status line says when nothing is going on, while she records, while she does a lesson along, while she listens, and when she has just done one. */
  hint: string
  recording: string
  follow: string
  listening: string
  done: string
  record: string
  stop: string
  /** "My tune": plays what she made last. */
  playMine: string
  stopLesson: string
  /** The name of the list of lessons (for a screen reader). */
  lessons: string
  /** "Listen to X" and "Play X along", for a screen reader. */
  listen: (lesson: string) => string
  along: (lesson: string) => string
  /** A panel of challenges: "Do X as a challenge" for a screen reader (each lesson then has a challenge button instead of the one to do it along), and the button that shows the way. */
  challenge?: (lesson: string) => string
  showWay?: string
  /** The picture on the button that shows a lesson done (default an ear) and on the one that does it along (default the piano keys). */
  listenIcon?: string
  alongIcon?: string
  /** "Play my creation n" (shown as a small numbered button when she has made more than one). */
  creation: (n: number) => string
}

type Props<E> = {
  store: StoreApi<ActivityState<E>>
  labels: ActivityLabels
  /** The lessons to list, with the name each is called in this language. */
  lessons: readonly { id: string; name: string }[]
  /** Which event a key of the keyboard makes, or null (the keys 1 to 8 of the xylophone). */
  keyToEvent?: (key: string) => E | null
  /** Show the record button and her creations (default; a panel of challenges has none). */
  creating?: boolean
  /** An extra class for the panel of this activity. */
  className?: string
  /** What she plays on: the bars, the pony, the dance floor. Gets what the store knows, and what to call to do something. */
  children: (surface: { lit: E | null; struck: E | null; strike: (event: E) => void; first: React.RefObject<HTMLButtonElement | null>; lesson: string | null; challenging: boolean; hints: number; step: number }) => ReactNode
}

/**
 * The panel of an activity with the xylophone's way of teaching (see `activityStore.ts`): what she plays on (the
 * surface, given by the activity), a line that says what is going on, record / stop / play my creation, and the lessons
 * with a button to hear or see each and one to do it along with the glow. Page elements over the room, not part of the
 * picture. Escape closes it.
 */
export function ActivityPanel<E>({ store, labels, lessons, keyToEvent, creating = true, className, children }: Props<E>) {
  const open = useStore(store, (s) => s.open)
  const mode = useStore(store, (s) => s.mode)
  const lit = useStore(store, (s) => s.lit)
  const struck = useStore(store, (s) => s.struck)
  const take = useStore(store, (s) => s.take)
  const creations = useStore(store, (s) => s.creations)
  const finished = useStore(store, (s) => s.finished)
  const activeLesson = useStore(store, (s) => s.lesson)
  const challenging = useStore(store, (s) => s.challenging)
  const hints = useStore(store, (s) => s.hints)
  const step = useStore(store, (s) => s.step)
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    first.current?.focus({ preventScroll: true })
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      const { strike, close } = store.getState()
      if (e.key === 'Escape') close()
      else {
        const event = keyToEvent?.(e.key) ?? null
        if (event === null) return
        strike(event)
      }
      e.preventDefault()
    }
    // In the capture phase, like the book and the talk, so that Escape closes the panel and does not also pause the game.
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open, store, keyToEvent])

  if (!open) return null
  const { strike, close, record, stopRecording, playTake, playCreation, listen, follow, challenge, hint, stop } = store.getState()
  const status = mode === 'recording' ? labels.recording : mode === 'follow' ? labels.follow : mode === 'playing' ? labels.listening : finished ? labels.done : labels.hint

  return (
    <div className={className ? `activity-panel ${className}` : 'activity-panel'} role="dialog" aria-label={labels.title}>
      <div className="activity-panel__head">
        <h2 className="activity-panel__title">
          <span aria-hidden="true">{labels.icon}</span> {labels.title}
        </h2>
        <button type="button" className="activity-panel__close" onClick={close} aria-label={labels.close}>
          ×
        </button>
      </div>
      {children({ lit, struck: struck?.event ?? null, strike, first, lesson: activeLesson, challenging, hints, step })}
      <p className="activity-panel__status" role="status">{status}</p>
      <div className="activity-panel__row">
        {creating && (mode === 'recording' ? (
          <button type="button" className="btn activity-panel__button is-recording" onClick={stopRecording}>
            <span aria-hidden="true">⏹️</span> {labels.stop}
          </button>
        ) : (
          <button type="button" className="btn activity-panel__button" onClick={record}>
            <span aria-hidden="true">🔴</span> {labels.record}
          </button>
        ))}
        {creating && (
          <button type="button" className="btn activity-panel__button" onClick={playTake} disabled={take.length === 0 || mode === 'recording'}>
            <span aria-hidden="true">▶️</span> {labels.playMine}
          </button>
        )}
        {challenging && labels.showWay && (
          <button type="button" className="btn activity-panel__button activity-panel__way" onClick={hint}>
            <span aria-hidden="true">💡</span> {labels.showWay}
          </button>
        )}
        {/* Once she has made more than one, a small numbered button for each (up to three are kept). */}
        {creating && creations.length > 1 &&
          creations.map((c, i) => (
            <button key={c.id} type="button" className="btn activity-panel__button activity-panel__creation" onClick={() => playCreation(c.id)} disabled={mode === 'recording'} aria-label={labels.creation(i + 1)}>
              {i + 1}
            </button>
          ))}
        {(mode === 'playing' || mode === 'follow') && (
          <button type="button" className="btn activity-panel__button" onClick={stop}>
            <span aria-hidden="true">⏹️</span> {labels.stopLesson}
          </button>
        )}
      </div>
      <ul className="activity-panel__lessons" aria-label={labels.lessons}>
        {lessons.map((lesson) => (
          <li key={lesson.id} className="activity-panel__lesson">
            <span className="activity-panel__lesson-name">{lesson.name}</span>
            <button type="button" className="activity-panel__mini" onClick={() => listen(lesson.id)} aria-label={labels.listen(lesson.name)}>
              <span aria-hidden="true">{labels.listenIcon ?? '👂'}</span>
            </button>
            {labels.challenge ? (
              <button type="button" className="activity-panel__mini" onClick={() => challenge(lesson.id)} aria-label={labels.challenge(lesson.name)}>
                <span aria-hidden="true">🏆</span>
              </button>
            ) : (
              <button type="button" className="activity-panel__mini" onClick={() => follow(lesson.id)} aria-label={labels.along(lesson.name)}>
                <span aria-hidden="true">{labels.alongIcon ?? '🎹'}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
