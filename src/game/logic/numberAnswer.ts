import type { Question } from '../types'

/** The most digits that can be typed (the answers are small numbers). */
export const MAX_DIGITS = 4

/** Is this text a whole number, as the answers of the number questions are written? */
export function isWhole(text: string): boolean {
  return /^\d{1,4}$/.test(text.trim())
}

/**
 * Is the question asked by typing a number? Only when it says so and every answer it has is a number, so that what is
 * typed can be matched against them (a question whose answers are words stays a question to pick from).
 */
export function asksForNumber(question: Pick<Question, 'kind'> | undefined, choices: readonly string[]): boolean {
  return question?.kind === 'number' && choices.length > 0 && choices.every(isWhole)
}

/**
 * Which answer a typed number is: the one with that value. A number that is not among the answers is a wrong answer
 * (the first answer that is not the right one), so the game's rules stay as they are: one right answer, anything else wrong.
 */
export function choiceForNumber(typed: string, choices: readonly string[], correctIndex: number): number {
  const value = Number(typed.trim())
  const found = choices.findIndex((c) => Number(c.trim()) === value)
  if (isWhole(typed) && found >= 0) return found
  return correctIndex === 0 ? 1 : 0
}

/** What is typed after a key: digits are added (up to `MAX_DIGITS`, no leading zeros), 'back' takes the last one off. */
export function typeKey(typed: string, key: string): string {
  if (key === 'back') return typed.slice(0, -1)
  if (!/^\d$/.test(key) || typed.length >= MAX_DIGITS) return typed
  return typed === '0' ? key : typed + key
}
