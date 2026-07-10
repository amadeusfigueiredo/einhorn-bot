// The old size (image dimensions / 4) read as a small, easy-to-lose sprite.
// A bigger scale reads better on both desktop and small mobile screens.
const SIZE_DIVISOR = 3

export function computePlayerSize(image: { width: number; height: number }): {
  w: number
  h: number
} {
  return {
    w: Math.round(image.width / SIZE_DIVISOR),
    h: Math.round(image.height / SIZE_DIVISOR),
  }
}
