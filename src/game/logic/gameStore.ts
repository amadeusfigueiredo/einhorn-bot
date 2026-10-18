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
  restart: () => void
  jumpToStage: (stageIndex: number) => void
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
  const pending = new Set<unknown>()

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
          const handle: unknown = timers.set(() => {
            pending.delete(handle)
            get().dispatch({ type: 'POPUP_EXPIRED', token })
          }, duration)
          pending.add(handle)
        }
      }

      if (
        next.stageIndex !== prev.stageIndex ||
        next.answered !== prev.answered
      ) {
        saveProgress(storage, toProgress(next))
      }
    },

    interact: (key) => get().dispatch({ type: 'TALK', key }),
    beginAsking: () => get().dispatch({ type: 'BEGIN_ASKING' }),
    answer: (choiceIndex) => get().dispatch({ type: 'ANSWER', choiceIndex }),
    restart: () => get().dispatch({ type: 'RESTART' }),
    jumpToStage: (stageIndex) =>
      get().dispatch({ type: 'JUMP_TO_STAGE', stageIndex }),
    dispose: () => {
      pending.forEach((handle) => timers.clear(handle))
      pending.clear()
    },
  }))
}
