import { createStore, type StoreApi } from 'zustand/vanilla'
import type { StageConfig } from '../types'
import {
  createInitialState,
  reduce,
  toProgress,
  popupDuration,
  type GameEvent,
  type GameState,
  type QuestionKey,
} from './gameMachine'
import {
  saveProgress,
  type Progress,
  type StorageLike,
} from '../utils/progressStorage'

export type GameActions = {
  dispatch: (event: GameEvent) => void
  /** Start a conversation with an NPC (the greeting; the question comes next). */
  interact: (key: QuestionKey) => void
  /** Finish the greeting and show the question. */
  beginAsking: () => void
  answer: (choiceIndex: number) => void
  /** The teacher's lesson is over: the class counts as answered (see `LESSON_DONE`). */
  lessonDone: () => void
  restart: () => void
  /** After the ending: go on playing, to find the stickers she is missing. */
  keepPlaying: () => void
  /** Back to class 1 with nothing answered, from wherever she is (for the grown-ups' corner). */
  startOver: () => void
  jumpToStage: (stageIndex: number) => void
  /** The developers' jump into a class with the first `answered` of its questions already answered (see `logic/devJump.ts`). */
  devJump: (stageIndex: number, answered: number) => void
  /** Go into a class she has opened, from the corridor (see `ENTER_STAGE`). */
  enterStage: (stageIndex: number) => void
  /** Freezes the popup timers while paused and gives each its remaining time back on going on. */
  setPaused: (paused: boolean) => void
  /** Cancels pending popup timers (tests, hot reload). */
  dispose: () => void
}

export type GameStoreState = GameState & GameActions
export type GameStore = StoreApi<GameStoreState>

export type GameStoreOptions = {
  stages: readonly StageConfig[]
  storage: StorageLike | null | undefined
  saved: Progress | null
  /** Injectable for tests; defaults to the global timers. */
  timers?: {
    set: (fn: () => void, ms: number) => unknown
    clear: (handle: unknown) => void
  }
}

/**
 * Wraps the pure state machine in a Zustand store and owns the only side
 * effects the game has: popup expiry timers and progress persistence.
 */
export function createGameStore(options: GameStoreOptions): GameStore {
  const { stages, storage, saved } = options
  const timers = options.timers ?? {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  }
  /** The popup timers that are running: how to fire, and how long was left when they last started. */
  type Pending = { fire: () => void; left: number; startedAt: number; handle: unknown }
  const pending = new Set<Pending>()
  let paused = false
  const arm = (timer: Pending) => {
    timer.startedAt = Date.now()
    timer.handle = timers.set(timer.fire, timer.left)
  }

  return createStore<GameStoreState>((set, get) => ({
    ...createInitialState(stages, saved),

    dispatch: (event) => {
      const prev = get()
      const next = reduce(prev, event, stages)
      if (next === prev) return
      set(next)

      if (next.popup && next.popup.token !== prev.popup?.token) {
        const duration = popupDuration(next.popup)
        if (duration !== null) {
          const { token } = next.popup
          const timer: Pending = {
            fire: () => {
              pending.delete(timer)
              get().dispatch({ type: 'POPUP_EXPIRED', token })
            },
            left: duration,
            startedAt: 0,
            handle: undefined,
          }
          pending.add(timer)
          if (!paused) arm(timer)
        }
      }

      if (
        next.stageIndex !== prev.stageIndex ||
        next.solved !== prev.solved
      ) {
        saveProgress(storage, toProgress(next))
      }
    },

    interact: (key) => get().dispatch({ type: 'TALK', key }),
    beginAsking: () => get().dispatch({ type: 'BEGIN_ASKING' }),
    answer: (choiceIndex) => get().dispatch({ type: 'ANSWER', choiceIndex }),
    lessonDone: () => get().dispatch({ type: 'LESSON_DONE' }),
    restart: () => get().dispatch({ type: 'RESTART' }),
    keepPlaying: () => get().dispatch({ type: 'KEEP_PLAYING' }),
    startOver: () => get().dispatch({ type: 'START_OVER' }),
    jumpToStage: (stageIndex) =>
      get().dispatch({ type: 'JUMP_TO_STAGE', stageIndex }),
    devJump: (stageIndex, answered) =>
      get().dispatch({ type: 'DEV_JUMP', stageIndex, answered }),
    enterStage: (stageIndex) =>
      get().dispatch({ type: 'ENTER_STAGE', stageIndex }),
    setPaused: (next) => {
      if (next === paused) return
      paused = next
      pending.forEach((timer) => {
        if (next) {
          timers.clear(timer.handle)
          timer.left = Math.max(0, timer.left - (Date.now() - timer.startedAt))
        } else {
          arm(timer)
        }
      })
    },
    dispose: () => {
      pending.forEach((timer) => timers.clear(timer.handle))
      pending.clear()
      paused = false
    },
  }))
}
