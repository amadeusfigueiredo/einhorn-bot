/**
 * What the grown-ups' corner can tell about how she has played: how long, and for each class how many answers were
 * right at the first go and how many times she had to try again. Pure numbers (the store that keeps them is
 * `practiceStore.ts`), and nothing here is a score: the game itself never shows it to her.
 */
export type ClassPractice = { right: number; wrong: number }

export type Practice = {
  /** Seconds played in all. */
  seconds: number
  /** Seconds played on each of the latest days (`YYYY-MM-DD`, her own local days). */
  days: Readonly<Record<string, number>>
  /** By class (0-based, as a string): answers right and answers that were wrong. */
  classes: Readonly<Record<string, ClassPractice>>
}

export const EMPTY_PRACTICE: Practice = { seconds: 0, days: {}, classes: {} }

/** How many days are kept: older days are dropped (the total stays). */
export const DAYS_KEPT = 14

const count = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null)

/** What was saved, if it is what we saved (anything else, and a number that is not a count, is left out). */
export function parsePractice(value: unknown): Practice | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  const seconds = count(raw.seconds)
  if (seconds === null || typeof raw.days !== 'object' || raw.days === null || typeof raw.classes !== 'object' || raw.classes === null) return null
  const days: Record<string, number> = {}
  for (const [day, s] of Object.entries(raw.days)) {
    const n = count(s)
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && n !== null) days[day] = n
  }
  const classes: Record<string, ClassPractice> = {}
  for (const [index, entry] of Object.entries(raw.classes)) {
    const e = entry as Record<string, unknown> | null
    const right = count(e?.right)
    const wrong = count(e?.wrong)
    if (/^\d+$/.test(index) && right !== null && wrong !== null) classes[index] = { right, wrong }
  }
  return { seconds, days: keepLatest(days), classes }
}

function keepLatest(days: Record<string, number>): Record<string, number> {
  const latest = Object.keys(days).sort().slice(-DAYS_KEPT)
  return Object.fromEntries(latest.map((d) => [d, days[d]]))
}

/** The day a moment is on, in her own time zone: `2026-10-22`. */
export function dayKey(at: Date): string {
  const two = (n: number) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())}`
}

/** `seconds` more of playing, on the day `day`. */
export function withSeconds(p: Practice, seconds: number, day: string): Practice {
  if (!(seconds > 0)) return p
  const s = Math.floor(seconds)
  return { ...p, seconds: p.seconds + s, days: keepLatest({ ...p.days, [day]: (p.days[day] ?? 0) + s }) }
}

/** One more answer in a class: right, or wrong (she tries again). */
export function withAnswer(p: Practice, classIndex: number, kind: 'right' | 'wrong'): Practice {
  const key = String(classIndex)
  const before = p.classes[key] ?? { right: 0, wrong: 0 }
  return { ...p, classes: { ...p.classes, [key]: { ...before, [kind]: before[kind] + 1 } } }
}

/** How long she played on `day` (seconds). */
export function secondsOn(p: Practice, day: string): number {
  return p.days[day] ?? 0
}

/** Seconds as whole hours and minutes (a part of a minute counts as nothing, but any playing at all is at least a minute). */
export function duration(seconds: number): { hours: number; minutes: number } {
  const minutes = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 }
}

/** The share of her answers in a class that were right at the first go (0 to 1), or null when there are none. */
export function rightShare(c: ClassPractice | undefined): number | null {
  const total = c ? c.right + c.wrong : 0
  return c && total > 0 ? c.right / total : null
}
