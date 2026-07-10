export const CONFETTI_COLORS = [
  '#FF4FB8',
  '#FFD166',
  '#8A5CF6',
  '#C9A7FF',
  '#7BE0D6',
  '#FF8AD4',
]

export type ConfettiPiece = {
  left: number // 0-100, percent across the burst area
  color: string
  delaySeconds: number
  durationSeconds: number
  rotationDeg: number
  driftPx: number // horizontal sway as it falls
}

/**
 * Generates a burst of confetti pieces. `rng` is injectable so this stays
 * deterministic in tests instead of depending on Math.random.
 */
export function generateConfetti(
  count: number,
  rng: () => number = Math.random
): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: rng() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delaySeconds: rng() * 0.4,
    durationSeconds: 1.6 + rng() * 1.2,
    rotationDeg: rng() * 360,
    driftPx: (rng() - 0.5) * 60,
  }))
}
