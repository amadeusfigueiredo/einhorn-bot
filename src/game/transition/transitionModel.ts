/**
 * The change from one classroom to the next as numbers, with no React: how long
 * the "Stage complete!" card waits, how long the still title card of reduced
 * motion lasts, and when a change of stage deserves the whole show. (The 14 s
 * film itself is timed in film/filmData.ts.) Tested without a screen.
 */

/** The "Stage complete!" card waits this long for a tap before the walk begins. */
export const DONE_MS = 3500
/** With reduced motion only the title card is shown, shorter and still. */
export const REDUCED_MS = 1400

/** `?transition=0` (or off, false) switches the show off, for tests and scripts. */
export function transitionsEnabled(search: string): boolean {
  const flag = new URLSearchParams(search).get('transition')?.toLowerCase()
  return !(flag === '0' || flag === 'off' || flag === 'false')
}

/** Only a real change of stage (not the first one shown) gets the show. */
export function shouldTransition(prev: number | null, next: number): boolean {
  return prev !== null && prev !== next
}
