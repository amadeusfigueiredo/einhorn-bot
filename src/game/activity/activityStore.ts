import { createStore } from 'zustand/vanilla'
import type { StickerEvent } from '../stickers/stickerData'
import type { createCreationsStore, Creation } from './creations'
import { addToTake, expected, guideStrike, isCreation, startGuide, type Guide, type Moment, type Take, type TakeRules } from './sequence'

/**
 * The way the xylophone teaches, for any activity: play freely at once; hear or watch it done (the thing lights up as it
 * goes); do it along with the glow (the next step glows, a right one moves on, a wrong one only sounds); make your own
 * (record it, keep it, play it back); and a sticker for each. One store runs the whole of it, and the activity only says
 * what its events are, how they sound and what its lessons are. The panel that shows it is `ui/ActivityPanel.tsx`.
 */
export type ActivityMode = 'free' | 'recording' | 'playing' | 'follow'

/** A lesson: the steps in order (the one to do glows), and the demonstration (what is heard or seen when she listens). */
export type Lesson<E> = { id: string; steps: readonly E[]; demo: readonly Moment<E>[] }

/** What the stickers are told: the kind of event, and which one, when it counts the different ones. */
export type Reward = readonly [StickerEvent, string?]
/** One reward, several (a lesson can win two kinds of sticker), or none. */
export type Rewards = Reward | readonly Reward[] | null | undefined

export type ActivityConfig<E> = {
  /** What her creations are kept under. */
  key: string
  lessons: readonly Lesson<E>[]
  take: TakeRules
  /** Are two events the same (default: the same value)? */
  same?: (a: E, b: E) => boolean
  /** Told when she does something herself (not when it is played to her). */
  onEvent?: (event: E) => Rewards
  /** Told when she has done a lesson through. */
  onLessonDone?: (lessonId: string) => Rewards
  /** Told when she has done a lesson as a challenge (nothing glowed unless she asked for help): `hints` is how often she asked. */
  onChallengeDone?: (lessonId: string, hints: number) => Rewards
  /** Told when a creation of hers (long enough to be one) has been played back to the end. */
  onCreationPlayed?: () => Rewards
}

export type ActivityDeps<E> = {
  /** Makes it happen: the sound, the move. */
  perform: (event: E) => void
  /** Milliseconds, only for the time between two events she does. */
  now: () => number
  timers: { set: (fn: () => void, ms: number) => unknown; clear: (handle: unknown) => void }
  earn: (type: StickerEvent, key?: string) => void
  /** Told when something new starts (a recording, a demonstration, a lesson done along, a tune played back): the surface starts afresh (a clean pony, a bare braid). */
  begin?: () => void
  /** Where her creations are kept (without it they are lost when the page closes). */
  creations?: ReturnType<typeof createCreationsStore>
}

export type ActivityState<E> = {
  /** The panel is open over the room (nobody walks about while it is). */
  open: boolean
  mode: ActivityMode
  /** The last thing she made, or the one she chose to play again. */
  take: Take<E>
  /** What she has made here, oldest first (up to three). */
  creations: Creation<E>[]
  /** The event that glows: the next one to do when she does a lesson along, or the one being played now. */
  lit: E | null
  /** The event that was just done, to show it pressed for a moment (`n` is new each time, so the same one twice shows twice). */
  struck: { event: E; n: number } | null
  /** The lesson she is doing, or hearing, and whether she has just done one through. */
  lesson: string | null
  finished: boolean
  /** She is doing a lesson as a challenge: nothing glows until she asks for help (`hint`), and how often she asked. */
  challenging: boolean
  hints: number
  /** How far she is in the lesson she does along or as a challenge (the steps done). */
  step: number
  openPanel: () => void
  close: () => void
  /** She does something: it happens; recording keeps it; doing a lesson along moves it on. */
  strike: (event: E) => void
  record: () => void
  /** Stops recording and keeps what she made when it is long enough to be a creation. */
  stopRecording: () => void
  /** Plays what she made last back. */
  playTake: () => void
  /** Chooses one of her creations and plays it. */
  playCreation: (id: string) => void
  /** Plays a lesson's demonstration, each thing lighting as it happens. */
  listen: (lessonId: string) => void
  /** She does a lesson along with the glow. */
  follow: (lessonId: string) => void
  /** The same lesson as a challenge: she has to find the way herself, and "show me the way" (`hint`) lights the next step for a moment. */
  challenge: (lessonId: string) => void
  hint: () => void
  /** Stops whatever is playing. */
  stop: () => void
}

/** How long a struck event shows pressed (ms), and how long after the last event of a demonstration the panel is free again. */
export const PRESSED_MS = 180
export const TAIL_MS = 700
/** How long the help of a challenge stays lit (ms). */
export const HINT_MS = 2500

export function createActivityStore<E>(config: ActivityConfig<E>, deps: ActivityDeps<E>) {
  const { perform, now, timers, earn, creations, begin } = deps
  const same = config.same ?? Object.is
  const tell = (rewards: Rewards) => {
    if (!rewards) return
    const list: readonly Reward[] = typeof rewards[0] === 'string' ? [rewards as Reward] : (rewards as readonly Reward[])
    for (const reward of list) earn(reward[0], reward[1])
  }
  let handles: unknown[] = []
  let counter = 0
  let t0 = 0
  let along: Guide<E> | null = null
  let alongId: string | null = null
  const later = (fn: () => void, ms: number) => void handles.push(timers.set(fn, ms))
  const clearAll = () => {
    for (const h of handles) timers.clear(h)
    handles = []
  }
  const saved = (): Creation<E>[] => creations?.getState().of<E>(config.key) ?? []

  return createStore<ActivityState<E>>((set, get) => {
    const ring = (event: E) => {
      perform(event)
      const n = ++counter
      set({ struck: { event, n } })
      later(() => {
        if (get().struck?.n === n) set({ struck: null })
      }, PRESSED_MS)
    }
    const schedule = (steps: readonly Moment<E>[], then: () => void) => {
      for (const step of steps) {
        later(() => {
          ring(step.event)
          set({ lit: step.event })
        }, step.at * 1000)
      }
      const end = steps.length ? steps[steps.length - 1].at * 1000 + TAIL_MS : 0
      later(() => {
        set({ mode: 'free', lit: null })
        then()
      }, end)
    }
    const halt = () => {
      clearAll()
      along = null
      alongId = null
      set({ mode: 'free', lit: null, struck: null, lesson: null, challenging: false, step: 0 })
    }
    const lessonOf = (id: string) => config.lessons.find((l) => l.id === id)
    const initial = saved()

    return {
      open: false,
      mode: 'free',
      take: initial.length ? initial[initial.length - 1].take : [],
      creations: initial,
      lit: null,
      struck: null,
      lesson: null,
      finished: false,
      challenging: false,
      hints: 0,
      step: 0,
      openPanel: () => set({ open: true, finished: false }),
      close: () => {
        halt()
        set({ open: false, finished: false })
      },
      strike: (event) => {
        ring(event)
        tell(config.onEvent?.(event))
        const { mode } = get()
        if (mode === 'recording') {
          const at = get().take.length === 0 ? 0 : (now() - t0) / 1000
          if (get().take.length === 0) t0 = now()
          set({ take: addToTake(get().take, event, at, config.take) })
        } else if (mode === 'follow' && along) {
          const step = guideStrike(along, event, same)
          along = step.guide
          if (step.done) {
            const id = alongId!
            const { challenging, hints } = get()
            along = null
            alongId = null
            set({ mode: 'free', lit: null, lesson: null, finished: true, challenging: false, step: 0 })
            tell(challenging ? config.onChallengeDone?.(id, hints) : config.onLessonDone?.(id))
          } else if (step.right) set({ lit: get().challenging ? null : along.steps[along.position], step: along.position })
        }
      },
      record: () => {
        halt()
        begin?.()
        set({ mode: 'recording', take: [], finished: false })
      },
      stopRecording: () => {
        if (get().mode !== 'recording') return
        set({ mode: 'free' })
        const { take } = get()
        if (creations && isCreation(take, config.take)) creations.getState().save(config.key, take)
        set({ creations: saved() })
      },
      playTake: () => {
        const { take } = get()
        if (!take.length) return
        halt()
        begin?.()
        set({ mode: 'playing', finished: false })
        schedule([...take], () => {
          if (isCreation(take, config.take)) tell(config.onCreationPlayed?.())
        })
      },
      playCreation: (id) => {
        const found = get().creations.find((c) => c.id === id)
        if (!found) return
        set({ take: found.take })
        get().playTake()
      },
      listen: (lessonId) => {
        const lesson = lessonOf(lessonId)
        if (!lesson) return
        halt()
        begin?.()
        set({ mode: 'playing', finished: false, lesson: lessonId })
        schedule(lesson.demo, () => set({ lesson: null }))
      },
      follow: (lessonId) => {
        const lesson = lessonOf(lessonId)
        if (!lesson) return
        halt()
        begin?.()
        along = startGuide(lesson.steps)
        alongId = lessonId
        set({ mode: 'follow', lit: expected(along) ?? null, lesson: lessonId, finished: false, step: 0 })
      },
      challenge: (lessonId) => {
        const lesson = lessonOf(lessonId)
        if (!lesson) return
        halt()
        begin?.()
        along = startGuide(lesson.steps)
        alongId = lessonId
        set({ mode: 'follow', lit: null, lesson: lessonId, finished: false, challenging: true, hints: 0, step: 0 })
      },
      hint: () => {
        const { challenging, mode } = get()
        if (!challenging || mode !== 'follow' || !along) return
        set({ lit: expected(along) ?? null, hints: get().hints + 1 })
        later(() => set({ lit: null }), HINT_MS)
      },
      stop: halt,
    }
  })
}
