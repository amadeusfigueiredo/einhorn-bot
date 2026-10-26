// One sticker for every stage you finish, collected in the sticker album at
// the end. Pure data: the emoji stands for the world of that stage.
import type { WorldId } from './worlds'
import { WORLD_IDS } from './worlds'

export type Sticker = { world: WorldId; emoji: string }

const EMOJI: Record<WorldId, string> = {
  candyClassroom: '🍬',
  beach: '🏖️',
  moon: '🌙',
  treehouse: '🌳',
  underwater: '🐠',
  cloudCastle: '🏰',
  koalaForest: '🐨',
  hotSpring: '♨️',
  glowForest: '🍄',
  flowerMeadow: '🌼',
  shellStage: '🐚',
  aurora: '🌌',
  iceCreamStudio: '🍦',
  paintCanyon: '🎨',
  saturn: '🪐',
}

/** The sticker of each stage, in stage order. */
export const STICKERS: readonly Sticker[] = WORLD_IDS.map((world) => ({ world, emoji: EMOJI[world] }))

/** The sticker won by finishing the stage at `stageIndex` (none beyond the last). */
export function stickerFor(stageIndex: number): Sticker | null {
  return STICKERS[stageIndex] ?? null
}

/** The stickers of the first `finished` stages. */
export function collected(finished: number): readonly Sticker[] {
  return STICKERS.slice(0, Math.max(0, finished))
}
