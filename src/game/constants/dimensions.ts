// Default/landscape design resolution - used on desktop, tablets, and any
// wide-ish viewport.
export const WIDTH = 1440
export const HEIGHT = 810

export const BASE_WIDTH = 1440
export const BASE_HEIGHT = 810
export const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT // 1.777...

// Portrait design resolution - used on tall/narrow viewports (phones held
// upright) so the game fills the screen vertically instead of being
// letterboxed as a short landscape strip. Being narrower than WIDTH also
// makes NPC portraits/player read noticeably bigger once the canvas is
// scaled down to the device's physical width.
export const PORTRAIT_WIDTH = 760
export const PORTRAIT_HEIGHT = 1350
