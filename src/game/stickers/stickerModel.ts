import { PLAY_STICKERS, STICKER_EVENTS, type StickerEvent, type StickerRule } from './stickerData'

/** What has happened so far (this is what is remembered): how many times, which different ones, and which stickers are won. */
export type StickerProgress = {
  counts: Partial<Record<StickerEvent, number>>
  /** The different things she has done, for the rules that count those (the friends talked to, the books read). */
  seen: Partial<Record<StickerEvent, string[]>>
  /** The ids of the stickers won, in the order she won them. */
  got: string[]
}

export const EMPTY_PROGRESS: StickerProgress = { counts: {}, seen: {}, got: [] }

/** What a rule has counted so far. */
export function valueOf(progress: StickerProgress, rule: StickerRule): number {
  return rule.distinct ? (progress.seen[rule.type]?.length ?? 0) : (progress.counts[rule.type] ?? 0)
}

/**
 * Something happened: counts it (and remembers which one, when it says) and says which stickers that won. Pure: the
 * progress it was given is not changed.
 */
export function applyEvent(progress: StickerProgress, type: StickerEvent, key?: string): { progress: StickerProgress; won: string[] } {
  const seenBefore = progress.seen[type] ?? []
  const seen = key !== undefined && !seenBefore.includes(key) ? [...seenBefore, key] : seenBefore
  const next: StickerProgress = {
    counts: { ...progress.counts, [type]: (progress.counts[type] ?? 0) + 1 },
    seen: seen === seenBefore ? progress.seen : { ...progress.seen, [type]: seen },
    got: progress.got,
  }
  const won = PLAY_STICKERS.filter((s) => s.rule.type === type && !next.got.includes(s.id) && valueOf(next, s.rule) >= s.rule.need).map((s) => s.id)
  return { progress: won.length ? { ...next, got: [...next.got, ...won] } : next, won }
}

/** How many play stickers are won. */
export function wonCount(progress: StickerProgress): number {
  return PLAY_STICKERS.filter((s) => progress.got.includes(s.id)).length
}

const isEvent = (k: string): k is StickerEvent => (STICKER_EVENTS as readonly string[]).includes(k)

/** What was saved, if it is a progress this version understands (anything else is a fresh start). */
export function parseProgress(value: unknown): StickerProgress | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const { counts, seen, got } = v
  if (typeof counts !== 'object' || counts === null || typeof seen !== 'object' || seen === null || !Array.isArray(got)) return null
  const cleanCounts: StickerProgress['counts'] = {}
  for (const [k, n] of Object.entries(counts)) if (isEvent(k) && typeof n === 'number' && Number.isFinite(n) && n >= 0) cleanCounts[k] = Math.floor(n)
  const cleanSeen: StickerProgress['seen'] = {}
  for (const [k, list] of Object.entries(seen)) if (isEvent(k) && Array.isArray(list)) cleanSeen[k] = list.filter((x): x is string => typeof x === 'string').slice(0, 200)
  const known = new Set(PLAY_STICKERS.map((s) => s.id))
  const cleanGot = [...new Set(got.filter((x): x is string => typeof x === 'string' && known.has(x)))]
  return { counts: cleanCounts, seen: cleanSeen, got: cleanGot }
}
