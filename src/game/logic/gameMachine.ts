import type { StageConfig, Question } from '../types'
import type { PopupId } from '../data/popups'
import { POPUPS } from '../data/popups'
import type { Progress } from '../utils/progressStorage'
import { answeredIn, idsBefore, isClassDone, missingClasses, nextIncomplete, questionIds, requiredAnswers, solvedFromSave } from './classProgress'

export { questionIds, requiredAnswers }

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
  /** The question this popup is about (right and wrong answers), so the screen can show the right answer. */
  question?: QuestionKey
}

export type GameState = {
  phase: Phase
  /** The class she is in now. She can go into any class at any time (see `ENTER_STAGE`). */
  stageIndex: number
  /**
   * Every question she has answered right, in any class (ids of NPCs/gates): the one list the whole school's progress
   * is worked out from (`logic/classProgress.ts`: which classes are finished, which are still to do).
   */
  solved: ReadonlySet<string>
  /** What she has answered in the class she is in now (a part of `solved`; kept here for the views). */
  answered: ReadonlySet<string>
  /** Is the class she is in finished? Then nobody asks a question: the unicorns greet her (she is visiting it). */
  visiting: boolean
  /** How many times she has gone into a class from the corridor (a change of class that is not a film of its own). */
  entries: number
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
  /** The teacher's lesson (the classes with the real classroom) is over: every question of the class counts as answered. */
  | { type: 'LESSON_DONE' }
  | { type: 'POPUP_EXPIRED'; token: number }
  | { type: 'RESTART' }
  /** After the ending: she goes on playing (to find the stickers she is missing) instead of starting over. */
  | { type: 'KEEP_PLAYING' }
  /** A grown-up starts the school over from class 1, whatever she is doing (the corner for grown-ups). */
  | { type: 'START_OVER' }
  | { type: 'JUMP_TO_STAGE'; stageIndex: number }
  /** She goes into a class from the corridor: any class she has opened (the frontier and the ones before it). */
  | { type: 'ENTER_STAGE'; stageIndex: number }
  /** The developers' jump (`?stage=5&left=1`): into this class, the classes before it finished, and the first `answered` of its questions already answered. */
  | { type: 'DEV_JUMP'; stageIndex: number; answered: number }

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

/** The state in class `stageIndex` with `solved` answered: what she has answered there, and whether it is finished. */
function inClass(state: GameState, stages: readonly StageConfig[], stageIndex: number, solved: ReadonlySet<string>): GameState {
  const stage = stages[stageIndex]
  return { ...state, stageIndex, solved, answered: answeredIn(solved, stage), visiting: isClassDone(solved, stage), activeQuestion: null }
}

export function createInitialState(
  stages: readonly StageConfig[],
  saved: Progress | null
): GameState {
  const stageIndex = clampStageIndex(saved?.stageIndex ?? 0, stages.length)
  const solved = saved ? solvedFromSave(saved, stages) : new Set<string>()
  const base: GameState = {
    phase: 'exploring',
    stageIndex,
    solved,
    answered: new Set(),
    visiting: false,
    entries: 0,
    activeQuestion: null,
    popup: null,
    popupCount: 0,
  }
  return inClass(base, stages, stageIndex, solved)
}

/** Is she in a class she has already finished (so nobody asks a question, they only greet her)? */
export function isVisiting(state: Pick<GameState, 'visiting'>): boolean {
  return state.visiting
}

export function findQuestion(
  stage: StageConfig,
  key: QuestionKey
): Question | undefined {
  const list = key.kind === 'gate' ? stage.gates ?? [] : stage.npcs ?? []
  return list.find((item) => item.id === key.id)?.question
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

function withPopup(state: GameState, id: PopupId, question?: QuestionKey): GameState {
  const token = state.popupCount + 1
  return { ...state, popup: question ? { id, token, question } : { id, token }, popupCount: token }
}

/** A right answer that is the last one of a class (or any right answer): the class is done, the school is done, or on to the next class. */
function rightAnswer(closed: GameState, stages: readonly StageConfig[], solved: ReadonlySet<string>, asked: QuestionKey): GameState {
  const here = inClass({ ...closed, solved }, stages, closed.stageIndex, solved)

  if (!here.visiting) {
    return withPopup({ ...here, phase: 'correct' }, 'WIN', asked)
  }

  // This class is finished. The whole school is finished when every class is: that is the ending.
  const left = missingClasses(solved, stages)
  if (left.length === 0) {
    return withPopup({ ...here, phase: 'ending' }, 'WIN', asked)
  }

  // The last class finished while others are still to do: it says so (and shows which), and stays where it is.
  if (closed.stageIndex === stages.length - 1) {
    return withPopup({ ...here, phase: 'correct' }, 'FINISH_ALL', asked)
  }

  // Otherwise on to the next class that is still to do (round to the beginning if need be).
  const nextIndex = nextIncomplete(solved, stages, closed.stageIndex)!
  return withPopup({ ...inClass(here, stages, nextIndex, solved), phase: 'nextStage' }, 'WIN', asked)
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
      // A feedback popup is on screen: wait until it closes.
      if (state.popup) return state
      if (!stage || !findQuestion(stage, event.key)) return state
      // In a finished class everybody has been answered: they greet her instead (and ask nothing).
      if (state.answered.has(event.key.id) && !isVisiting(state)) return state
      return { ...state, phase: 'talking', activeQuestion: event.key }
    }

    case 'BEGIN_ASKING': {
      if (state.phase !== 'talking') return state
      // The greeting in a finished class is all there is: no question follows.
      if (isVisiting(state)) return { ...state, phase: 'exploring', activeQuestion: null }
      return { ...state, phase: 'asking' }
    }

    case 'ANSWER': {
      if (state.phase !== 'asking' || !state.activeQuestion || !stage || isVisiting(state)) {
        return state
      }
      const question = findQuestion(stage, state.activeQuestion)
      const asked = state.activeQuestion
      const closed: GameState = { ...state, activeQuestion: null }

      if (!question || !isCorrectAnswer(question, event.choiceIndex)) {
        return withPopup({ ...closed, phase: 'wrong' }, 'TRY_AGAIN', asked)
      }

      const solved = new Set(state.solved).add(state.activeQuestion.id)
      return rightAnswer(closed, stages, solved, asked)
    }

    case 'LESSON_DONE': {
      if (state.phase !== 'exploring' || state.popup || !stage || isVisiting(state)) return state
      const keys = (stage.npcs ?? []).map((n) => ({ kind: 'npc' as const, id: n.id }))
      if (keys.length === 0) return state
      const solved = new Set(state.solved)
      for (const k of keys) solved.add(k.id)
      return rightAnswer({ ...state, activeQuestion: null }, stages, solved, keys[keys.length - 1])
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
      return { ...inClass(state, stages, 0, new Set()), phase: 'exploring', popup: null }
    }

    case 'KEEP_PLAYING': {
      if (state.phase !== 'ending' || state.popup?.id !== 'GAME_END') return state
      return { ...state, phase: 'exploring', popup: null, activeQuestion: null }
    }

    case 'START_OVER': {
      return { ...inClass(state, stages, 0, new Set()), phase: 'exploring', popup: null }
    }

    case 'JUMP_TO_STAGE': {
      const target = clampStageIndex(event.stageIndex, stages.length)
      if (target === state.stageIndex) return state
      // (The stage jumper of the developers: where she jumps to is where she has got to, the classes before it finished.)
      return { ...inClass(state, stages, target, new Set(idsBefore(stages, target))), phase: 'exploring' }
    }

    case 'DEV_JUMP': {
      const target = clampStageIndex(event.stageIndex, stages.length)
      const there = stages[target]
      // Never all of them: a class with every question answered but no "done" popup would be stuck.
      const count = Math.max(0, Math.min(Math.floor(event.answered), requiredAnswers(there) - 1))
      const solved = new Set([...idsBefore(stages, target), ...questionIds(there).slice(0, count)])
      return { ...inClass(state, stages, target, solved), phase: 'exploring', popup: null }
    }

    case 'ENTER_STAGE': {
      const target = clampStageIndex(event.stageIndex, stages.length)
      // Any class, at any time she is just walking about (not in the middle of a question).
      if (target === state.stageIndex) return state
      if (state.phase !== 'exploring' || state.popup) return state
      return { ...inClass(state, stages, target, state.solved), entries: state.entries + 1 }
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

/** What is saved: the class she is in and every question she has answered (the new kind of save: `version` 2). */
export function toProgress(state: GameState): Progress {
  return {
    stageIndex: state.stageIndex,
    answeredIds: Array.from(state.solved),
    version: 2,
  }
}
