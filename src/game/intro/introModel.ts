/**
 * When the intro film plays. Pure, so the first-visit rules are tested without
 * a screen. (The film itself is timed in film/filmData.ts.)
 */

export type IntroInput = {
  /** The name saved on this device, if any. */
  name: string | null
  /** The child chose to play without a name once. */
  skipped: boolean
  /** The URL's query string: `?intro=0` never shows it, `?intro=1` always does. */
  search: string
  reducedMotion: boolean
}

/**
 * Shown on the first visit only (no name and not skipped yet); never with
 * reduced motion, never when the URL says `intro=0`; `intro=1` plays it
 * again for a parent who wants to see it.
 */
export function shouldShowIntro(input: IntroInput): boolean {
  const flag = new URLSearchParams(input.search).get('intro')?.toLowerCase()
  if (flag === '0' || flag === 'off' || flag === 'false') return false
  if (input.reducedMotion) return false
  if (flag === '1' || flag === 'on' || flag === 'true') return true
  return input.name === null && !input.skipped
}
