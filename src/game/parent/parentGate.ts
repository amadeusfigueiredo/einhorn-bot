/**
 * The gate to the grown-ups' corner: a sum a six-year-old cannot do in her head, so that she does not open it by
 * accident while tapping around. It is not security (the corner holds nothing secret): it is a door that stays shut
 * for a small hand. Pure, with the random numbers given.
 */
export type Gate = { a: number; b: number; answer: number }

/** A multiplication of a number from 13 to 19 by one from 4 to 9. */
export function makeGate(random: () => number): Gate {
  const a = 13 + Math.floor(random() * 7)
  const b = 4 + Math.floor(random() * 6)
  return { a, b, answer: a * b }
}

/** Is what was typed the answer? (Spaces round it do not matter; anything else that is not the number does.) */
export function isRight(gate: Gate, typed: string): boolean {
  return /^\s*\d{1,4}\s*$/.test(typed) && Number(typed) === gate.answer
}
