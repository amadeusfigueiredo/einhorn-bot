import { STAGES } from '../constants/stages'
import { STICKERS } from '../data/stickers'
import { doneFlags } from '../logic/classProgress'
import { WORLD_NAMES } from '../data/worlds'
import type { Localized } from '../i18n/languages'
import { PLAY_STICKERS } from './stickerData'
import { valueOf, type StickerProgress } from './stickerModel'
import { whereOf, type Where } from './whereModel'

/**
 * Every sticker there is, as the sticker book and the end of the game show it: the sticker of each class (won by
 * finishing it) and the play stickers (won by doing things). One list for the book in the menu, the album on the finale
 * card and the film's album, so the three can never disagree about what there is or what she has won.
 */
export type AlbumSticker = {
  id: string
  emoji: string
  name: Localized
  got: boolean
  /** Which kind: a class's, or one for playing. */
  kind: 'school' | 'play'
  /** How to win it and how far she is (play stickers only). */
  how?: Localized
  have?: number
  need?: number
  /** Where to find it: a play sticker's place, and a class sticker's class (0-based). */
  where?: Where
  classIndex?: number
}

/** The sticker of every class, in class order; a class's is won when the class is finished (in any order). */
export function schoolStickers(solved: ReadonlySet<string>): AlbumSticker[] {
  const done = doneFlags(solved, STAGES)
  return STICKERS.map((s, i) => ({ id: s.world, emoji: s.emoji, name: WORLD_NAMES[s.world], got: done[i], kind: 'school' as const, where: 'class' as const, classIndex: i }))
}

/** Every play sticker, with how far she is on the way to it. */
export function playStickers(progress: StickerProgress): AlbumSticker[] {
  return PLAY_STICKERS.map((s) => ({
    id: s.id,
    emoji: s.emoji,
    name: s.name,
    got: progress.got.includes(s.id),
    kind: 'play' as const,
    how: s.how,
    have: Math.min(valueOf(progress, s.rule), s.rule.need),
    need: s.rule.need,
    where: whereOf(s.rule.type),
  }))
}

export const TOTAL_STICKERS = STICKERS.length + PLAY_STICKERS.length

/** How many she has won, and how many there are. */
export function albumCount(solved: ReadonlySet<string>, progress: StickerProgress): { got: number; total: number } {
  const got = schoolStickers(solved).filter((s) => s.got).length + playStickers(progress).filter((s) => s.got).length
  return { got, total: TOTAL_STICKERS }
}

/** The stickers she has won, the classes' first (in class order) and then the play ones in the order of the book: what the film's album flies in. */
export function earnedStickers(solved: ReadonlySet<string>, progress: StickerProgress): AlbumSticker[] {
  return [...schoolStickers(solved), ...playStickers(progress)].filter((s) => s.got)
}
