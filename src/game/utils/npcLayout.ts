// Keeps NPCs off the HUD (top) and spread across the full canvas instead of
// clustered in one corner. Two vertical bands, alternated per stage, so
// consecutive stages don't all look like the same zig-zag.
const MARGIN_X = 130
const MARGIN_TOP = 170
const MARGIN_BOTTOM = 110
const ROW_BAND_TOP = 0.22
const ROW_BAND_BOTTOM = 0.72

// With exactly 4 NPCs the even-slot formula puts two of them near the
// horizontal center, right on top of the background art's big unicorn.
// Pin those to the four corners instead.
const CORNER_COL_LEFT = 0.1
const CORNER_COL_RIGHT = 0.9

export type NpcPosition = { x: number; y: number }

export function getNpcPosition(params: {
  index: number
  total: number
  stageSeed: number
  width: number
  height: number
}): NpcPosition {
  const { index, total, stageSeed, width, height } = params

  const usableWidth = Math.max(width - MARGIN_X * 2, 1)
  const usableHeight = Math.max(height - MARGIN_TOP - MARGIN_BOTTOM, 1)

  if (total === 4) {
    const isLeft = index % 2 === 0
    const isTopHalf = index < 2
    // Flip which pair sits on top per stage, just for a little variety.
    const onTop = stageSeed % 2 === 1 ? !isTopHalf : isTopHalf
    const x =
      MARGIN_X + usableWidth * (isLeft ? CORNER_COL_LEFT : CORNER_COL_RIGHT)
    const y =
      MARGIN_TOP + usableHeight * (onTop ? ROW_BAND_TOP : ROW_BAND_BOTTOM)
    return { x: Math.round(x), y: Math.round(y) }
  }

  const slot = total > 1 ? (index + 0.5) / total : 0.5
  const x = MARGIN_X + usableWidth * slot

  const rowPhase = (index + stageSeed) % 2
  const rowRatio = rowPhase === 0 ? ROW_BAND_TOP : ROW_BAND_BOTTOM
  const y = MARGIN_TOP + usableHeight * rowRatio

  return { x: Math.round(x), y: Math.round(y) }
}

export function getNpcPositions(params: {
  total: number
  stageSeed: number
  width: number
  height: number
}): NpcPosition[] {
  const { total, stageSeed, width, height } = params
  return Array.from({ length: total }, (_, index) =>
    getNpcPosition({ index, total, stageSeed, width, height })
  )
}
