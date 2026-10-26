import type { Lang } from '../i18n/languages'

/**
 * The numbers behind the HUD, with no React: which of the 15 progress dots is
 * done, which one we are in, which stars are lit, and which unicorn the "talk
 * to me" hint belongs to. Pure, so it is tested without a screen.
 */
export type DotState = 'done' | 'current' | 'todo'

export type Dot = {
  /** 0-based stage number. */
  index: number
  state: DotState
  /** The first dot of a new subject: drawn with a gap before it. */
  startsGroup: boolean
}

/** One dot per stage; the gaps fall where the subject changes (5 groups of 3). */
export function progressDots(stageIndex: number, subjects: readonly string[]): Dot[] {
  return subjects.map((subject, index) => ({
    index,
    state: index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'todo',
    startsGroup: index > 0 && subjects[index - 1] !== subject,
  }))
}

/** `required` stars, the first `earned` of them lit. */
export function starStates(earned: number, required: number): boolean[] {
  return Array.from({ length: Math.max(0, required) }, (_, i) => i < earned)
}

/** The second language shown small under the first: German and Portuguese share a screen, English gets German. */
export function otherLang(lang: Lang): Lang {
  return lang === 'de' ? 'pt' : 'de'
}

/** The first unicorn that has not been asked yet: the one to talk to next. */
export function nextNpcId(npcs: readonly { id: string }[] | undefined, answered: ReadonlySet<string>): string | null {
  return (npcs ?? []).find((n) => !answered.has(n.id))?.id ?? null
}

/** Which unicorn wears the hint: the one beside Amara, else the next one in line. */
export function hintTarget(nearId: string | null, nextId: string | null): string | null {
  return nearId ?? nextId
}
