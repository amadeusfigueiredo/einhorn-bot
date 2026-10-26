// Texts that need a small decision on top of a plain lookup. They take the
// `t` function (from useT() or a bound translate), so React and canvas code
// share them.
import type { Difficulty, Subject } from '../types'
import type { MessageId, Vars } from './translate'

export type TFn = (id: MessageId, vars?: Vars) => string

/** "2 von 4", or "2 von 4 (5)" when the stage has more unicorns than needed. */
export function progressText(t: TFn, answered: number, required: number, total: number): string {
  return total === required
    ? t('progress.plain', { answered, required })
    : t('progress.extra', { answered, required, total })
}

export function subjectText(t: TFn, subject: Subject): string {
  return t(`subjects.${subject}`)
}

export function difficultyText(t: TFn, difficulty: Difficulty): string {
  return t(`difficulty.${difficulty}`)
}

export function nameButtonText(t: TFn, name: string | null): string {
  return name ?? t('nameButton.textEmpty')
}

export function nameButtonLabel(t: TFn, name: string | null): string {
  return name ? t('nameButton.labelNamed', { name }) : t('nameButton.labelEmpty')
}
