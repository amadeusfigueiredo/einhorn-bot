// Landscape/desktop gets a modest bump over the old fixed 128px cap;
// portrait/mobile gets a much bigger one since a narrower canvas means less
// CSS downscaling to the device's physical width.
const LANDSCAPE_MAX_DISPLAY_WIDTH = 150
const PORTRAIT_MAX_DISPLAY_WIDTH = 210

export function getNpcMaxDisplayWidth(
  canvasWidth: number,
  canvasHeight: number
): number {
  const isPortrait = canvasHeight > canvasWidth
  return isPortrait ? PORTRAIT_MAX_DISPLAY_WIDTH : LANDSCAPE_MAX_DISPLAY_WIDTH
}

export type FigureSize = { w: number; h: number }

/**
 * Every unicorn (NPCs and the player) is drawn in the same square box, so
 * differently-shaped source pictures all read as the same size on screen.
 * Pictures are cropped to fit rather than stretched.
 */
export function getFigureSize(
  canvasWidth: number,
  canvasHeight: number
): FigureSize {
  const side = getNpcMaxDisplayWidth(canvasWidth, canvasHeight)
  return { w: side, h: side }
}
