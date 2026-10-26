import {
  WIDTH,
  HEIGHT,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  WIDE_WIDTH,
  WIDE_HEIGHT,
  WIDE_MIN_ASPECT,
} from '../constants/dimensions'

export type CanvasSize = { width: number; height: number }

/**
 * Picks the design resolution to render at for a given viewport. Taller-
 * than-wide viewports (a phone held upright) get the narrower portrait
 * resolution instead of being letterboxed inside the landscape one, and very
 * wide ones (a phone held sideways) get the extra-wide resolution.
 */
export function pickCanvasSize(
  viewportWidth: number,
  viewportHeight: number
): CanvasSize {
  const isPortrait = viewportHeight > viewportWidth
  if (isPortrait) return { width: PORTRAIT_WIDTH, height: PORTRAIT_HEIGHT }
  const isVeryWide =
    viewportHeight > 0 && viewportWidth / viewportHeight >= WIDE_MIN_ASPECT
  return isVeryWide
    ? { width: WIDE_WIDTH, height: WIDE_HEIGHT }
    : { width: WIDTH, height: HEIGHT }
}
