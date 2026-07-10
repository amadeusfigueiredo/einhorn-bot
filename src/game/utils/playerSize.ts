import { getNpcMaxDisplayWidth } from './npcDisplaySize'

// The player reads as "the odd one out" if it doesn't match the NPCs it
// stands next to, so it's capped to the exact same size as them (bigger on
// portrait/mobile, same as everyone else).
export function computePlayerSize(
  image: { width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
): {
  w: number
  h: number
} {
  const cap = getNpcMaxDisplayWidth(canvasWidth, canvasHeight)
  const w = Math.min(cap, image.width)
  const h = Math.round((image.height / image.width) * w)
  return { w, h }
}
