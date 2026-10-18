import { getFigureSize } from './npcDisplaySize'

// The player reads as "the odd one out" if it doesn't match the NPCs it
// stands next to, so it gets exactly the same box as them (bigger on
// portrait/mobile, same as everyone else).
export function computePlayerSize(
  canvasWidth: number,
  canvasHeight: number
): { w: number; h: number } {
  return getFigureSize(canvasWidth, canvasHeight)
}
