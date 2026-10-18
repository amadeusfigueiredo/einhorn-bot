/**
 * Canvas text and chips are drawn in canvas pixels, so on the narrow portrait
 * canvas (shown scaled down to a phone) they would shrink to unreadable. Scale
 * them up there so they land at a similar on-screen size on every device.
 */
const PORTRAIT_UI_SCALE = 1.7

export function uiScale(canvasWidth: number, canvasHeight: number): number {
  return canvasHeight > canvasWidth ? PORTRAIT_UI_SCALE : 1
}
