export type CropRect = { sx: number; sy: number; sw: number; sh: number }

/**
 * Source rectangle that fills a `boxW` x `boxH` box with the image without
 * distortion ("object-fit: cover"). Horizontal crops are centred; vertical
 * crops favour the top of the picture (`focalY`, 0 = top, 1 = bottom)
 * because the unicorn's face is usually in the upper part of a tall image.
 */
export function coverCrop(
  image: { width: number; height: number },
  boxW: number,
  boxH: number,
  focalY = 0.3
): CropRect {
  const scale = Math.max(boxW / image.width, boxH / image.height)
  const sw = boxW / scale
  const sh = boxH / scale
  return {
    sx: (image.width - sw) / 2,
    sy: (image.height - sh) * focalY,
    sw,
    sh,
  }
}
