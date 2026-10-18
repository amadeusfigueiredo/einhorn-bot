export type Size = { width: number; height: number }

/**
 * Largest size with the canvas's aspect ratio that fits inside the box.
 * Never scales above `maxScale` (1 = the canvas's own pixel size, so the
 * picture is never blown up and blurred on big screens).
 */
export function fitToBox(
  canvas: Size,
  box: Size,
  maxScale = 1
): Size {
  if (box.width <= 0 || box.height <= 0) return canvas
  const scale = Math.min(
    box.width / canvas.width,
    box.height / canvas.height,
    maxScale
  )
  return {
    width: Math.floor(canvas.width * scale),
    height: Math.floor(canvas.height * scale),
  }
}
