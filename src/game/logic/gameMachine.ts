import type { StageConfig, Question } from '../types'
import type { PopupId } from '../data/popups'
import { POPUPS } from '../data/popups'
import type { Progress } from '../utils/progressStorage'

/**
 * The game's explicit state machine. Everything in here is pure: no React,
 * no timers, no storage, no canvas. Views read `GameState` and dispatch
 * `GameEvent`s; side effects (timers, persistence) live in `gameStore.ts`.
 *
 *   exploring ──TALK──▶ talking ──BEGIN_ASKING──▶ asking
 *       ▲                                            │ ANSWER
 *       │                      ┌──── wrong ◀─────────┤
 *       │ POPUP_EXPIRED        │                     ▼
 *       ├──────────────────────┼──── correct ◀── (correct, stage not done)
 *       │                      └──── nextStage ◀─ (correct, stage done)
 *       │                                           ending ◀─ (correct, last stage done)
 *       └────────────────── RESTART ◀───────────────────┘
 *
 * `correct`, `wrong`, `nextStage` and `ending` are the "feedback" phases:
 * a timed popup is on screen but - exactly like the original game - the
 * player keeps moving behind it.
 */
export type Phase =
  | 'exploring'
  | 'talking'
  | 'asking'
  | 'correct'
  | 'wrong'
  | 'nextStage'
  | 'ending'

export type QuestionKey = { kind: 'gate' | 'npc'; id: string }

export type ActivePopup = {
  id: PopupId
  /** Identifies this particular popup so a stale expiry timer can't close a newer one. */
  token: number
}

export type GameState = {
  phase: Phase
  stageIndex: number
  /** Ids of NPCs/gates answered correctly in the *current* stage. */
  answered: ReadonlySet<string>
  /** The NPC/gate being talked to or asked about (talking + asking only). */
  activeQuestion: QuestionKey | null
  popup: ActivePopup | null
  /** Monotonic counter used to mint popup tokens. */
  popupCount: number
}

export type GameEvent =
  | { type: 'TALK'; key: QuestionKey }
  | { type: 'BEGIN_ASKING' }
  | { type: 'ANSWER'; choiceIndex: number }
  | { type: 'POPUP_EXPIRED'; token: number }
  | { type: 'RESTART' }
  | { type: 'JUMP_TO_STAGE'; stageIndex: number }

/** Phases in which the player can walk around and start a conversation. */
const INTERACTIVE_PHASES: ReadonlySet<Phase> = new Set([
  'exploring',
  'correct',
  'wrong',
  'nextStage',
])

export function clampStageIndex(index: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(index, total - 1))
}

export function createInitialState(
  stages: readonly StageConfig[],
  saved: Progress | null
): GameState {
  const stageIndex = clampStageIndex(saved?.stageIndex ?? 0, stages.length)
  // Saved answers only belong to the stage they were saved on.
  const answered =
    saved && clampStageIndex(saved.stageIndex, stages.length) === stageIndex
      ? saved.answeredIds
      : []
  return {
    phase: 'exploring',
    stageIndex,
    answered: new Set(answered),
    activeQuestion: null,
    popup: null,
    popupCount: 0,
  }
}

export function findQuestion(
  stage: StageConfig,
  key: QuestionKey
): Question | undefined {
  const list = key.kind === 'gate' ? stage.gates ?? [] : stage.npcs ?? []
  return list.find((item) => item.id === key.id)?.question
}

/** How many correct answers a stage needs before the next one unlocks. */
export function requiredAnswers(stage: StageConfig): number {
  const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
  return stage.requiredToAdvance ?? total
}

export function isStageComplete(
  stage: StageConfig,
  answered: ReadonlySet<string>
): boolean {
  return answered.size >= requiredAnswers(stage)
}

export function isCorrectAnswer(question: Question, choiceIndex: number) {
  return choiceIndex === question.correctIndex
}

function withPopup(state: GameState, id: PopupId): GameState {
  const token = state.popupCount + 1
  return { ...state, popup: { id, token }, popupCount: token }
}

export function reduce(
  state: GameState,
  event: GameEvent,
  stages: readonly StageConfig[]
): GameState {
  const stage = stages[state.stageIndex]

  switch (event.type) {
    case 'TALK': {
      if (!INTERACTIVE_PHASES.has(state.phase)) return state
      if (!stage || !findQuestion(stage, event.key)) return state
      if (state.answered.has(event.key.id)) return state
      return { ...state, phase: 'talking', activeQuestion: event.key }
    }

    case 'BEGIN_ASKING': {
      if (state.phase !== 'talking') return state
      return { ...state, phase: 'asking' }
    }

    case 'ANSWER': {
      if (state.phase !== 'asking' || !state.activeQuestion || !stage) {
        return state
      }
      const question = findQuestion(stage, state.activeQuestion)
      const closed: GameState = { ...state, activeQuestion: null }

      if (!question || !isCorrectAnswer(question, event.choiceIndex)) {
        return withPopup({ ...closed, phase: 'wrong' }, 'TRY_AGAIN')
      }

      const answered = new Set(state.answered).add(state.activeQuestion.id)
      const next: GameState = { ...closed, answered }

      if (!isStageComplete(stage, answered)) {
        return withPopup({ ...next, phase: 'correct' }, 'WIN')
      }

      if (state.stageIndex === stages.length - 1) {
        return withPopup({ ...next, phase: 'ending' }, 'WIN')
      }

      const nextIndex = stages.findIndex((s) => s.name === stage.nextStage)
      if (nextIndex < 0) {
        // Stage is complete but has nowhere to go: stay put, like before.
        return withPopup({ ...next, phase: 'correct' }, 'WIN')
      }
      return withPopup(
        {
          ...next,
          phase: 'nextStage',
          stageIndex: nextIndex,
          answered: new Set(),
        },
        'WIN'
      )
    }

    case 'POPUP_EXPIRED': {
      if (!state.popup || state.popup.token !== event.token) return state
      // The last stage's WIN popup hands over to the manual-close ending.
      if (state.phase === 'ending' && state.popup.id === 'WIN') {
        return withPopup(state, 'GAME_END')
      }
      const settled: Phase =
        state.phase === 'correct' ||
        state.phase === 'wrong' ||
        state.phase === 'nextStage'
          ? 'exploring'
          : state.phase
      return { ...state, popup: null, phase: settled }
    }

    case 'RESTART': {
      if (state.phase !== 'ending' || state.popup?.id !== 'GAME_END') {
        return state
      }
      return {
        ...state,
        phase: 'exploring',
        stageIndex: 0,
        answered: new Set(),
        activeQuestion: null,
        popup: null,
      }
    }

    case 'JUMP_TO_STAGE': {
      const target = clampStageIndex(event.stageIndex, stages.length)
      if (target === state.stageIndex) return state
      return {
        ...state,
        phase: 'exploring',
        stageIndex: target,
        answered: new Set(),
        activeQuestion: null,
      }
    }
  }
}

/** True when the world should freeze (a dialogue or question is open). */
export function isWorldPaused(phase: Phase): boolean {
  return phase === 'talking' || phase === 'asking'
}

/** The auto-expiry duration for the current popup, or null if it needs a click. */
export function popupDuration(popup: ActivePopup | null): number | null {
  return popup ? POPUPS[popup.id].durationMs : null
}

export function toProgress(state: GameState): Progress {
  return {
    stageIndex: state.stageIndex,
    answeredIds: Array.from(state.answered),
  }
}
