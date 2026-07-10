import { WIDTH, HEIGHT, PORTRAIT_WIDTH, PORTRAIT_HEIGHT } from '../constants/dimensions'

export type CanvasSize = { width: number; height: number }

/**
 * Picks the design resolution to render at for a given viewport. Taller-
 * than-wide viewports (a phone held upright) get the narrower portrait
 * resolution instead of being letterboxed inside the landscape one.
 */
export function pickCanvasSize(
  viewportWidth: number,
  viewportHeight: number
): CanvasSize {
  const isPortrait = viewportHeight > viewportWidth
  return isPortrait
    ? { width: PORTRAIT_WIDTH, height: PORTRAIT_HEIGHT }
    : { width: WIDTH, height: HEIGHT }
}
