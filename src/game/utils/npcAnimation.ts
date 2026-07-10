export type NpcAnimState = {
  scale: number
  glowAlpha: number
}

const SELECTED_FREQ_HZ = 1.5
const SELECTED_SCALE_AMPLITUDE = 0.05
const HOVER_SCALE = 1.1
const HOVER_GLOW = 0.9

/**
 * - Idle: no scale, no glow.
 * - Selected (player is in talk range and hasn't answered yet): a gentle
 *   "pick me!" pulse.
 * - Hovered (desktop mouse only): a snappier pop, like a button hover.
 * Hover always wins visually since it's the more immediate signal.
 */
export function computeNpcAnimation(params: {
  t: number
  isSelected: boolean
  isHovered: boolean
}): NpcAnimState {
  const { t, isSelected, isHovered } = params

  let scale = 1
  let glowAlpha = 0

  if (isSelected) {
    const pulse = Math.sin(t * SELECTED_FREQ_HZ * Math.PI * 2)
    scale = 1 + pulse * SELECTED_SCALE_AMPLITUDE
    glowAlpha = 0.5 + 0.5 * pulse
  }

  if (isHovered) {
    scale = Math.max(scale, HOVER_SCALE)
    glowAlpha = Math.max(glowAlpha, HOVER_GLOW)
  }

  return { scale, glowAlpha }
}
