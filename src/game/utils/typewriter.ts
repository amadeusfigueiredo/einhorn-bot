/** How much of `text` is visible after `elapsedMs` of typing. */
export function typewriterSlice(
  text: string,
  elapsedMs: number,
  msPerChar: number
): string {
  if (msPerChar <= 0) return text
  const count = Math.floor(elapsedMs / msPerChar)
  // Spread so emoji (surrogate pairs) are never cut in half.
  return Array.from(text).slice(0, Math.max(0, count)).join('')
}

/** Time needed to type the whole text. */
export function typewriterDuration(text: string, msPerChar: number): number {
  return Array.from(text).length * msPerChar
}
