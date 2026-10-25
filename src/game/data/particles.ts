// The little things that drift through a classroom: sparkles, stars, snow,
// fireflies, bubbles, petals, leaves, confetti. Pure data; Scene3DView hands
// these numbers to drei's <Sparkles>.
export type ParticleKind = 'sparkles' | 'stars' | 'snow' | 'fireflies' | 'bubbles' | 'petals' | 'leaves' | 'confetti'

export type ParticleStyle = {
  count: number
  /** Pixel size of one particle. */
  size: number
  speed: number
  opacity: number
  /** How tall the drifting cloud is, in world units. */
  height: number
  /** A fixed colour, or the room's own sparkle colour when missing. */
  color?: string
}

export const PARTICLES: Record<ParticleKind, ParticleStyle> = {
  sparkles: { count: 48, size: 4, speed: 0.25, opacity: 0.8, height: 3 },
  stars: { count: 70, size: 3, speed: 0.08, opacity: 0.9, height: 3.4, color: '#fff4c2' },
  snow: { count: 90, size: 5, speed: 0.35, opacity: 0.85, height: 3.6, color: '#ffffff' },
  fireflies: { count: 26, size: 9, speed: 0.3, opacity: 0.95, height: 2.4, color: '#d9ff7a' },
  bubbles: { count: 34, size: 8, speed: 0.4, opacity: 0.6, height: 3.2, color: '#d6f5ff' },
  petals: { count: 36, size: 7, speed: 0.3, opacity: 0.85, height: 3, color: '#ffc2dd' },
  leaves: { count: 30, size: 7, speed: 0.3, opacity: 0.85, height: 3, color: '#c8e86a' },
  confetti: { count: 50, size: 6, speed: 0.45, opacity: 0.9, height: 3.2, color: '#ff9ed1' },
}

export const PARTICLE_KINDS = Object.keys(PARTICLES) as ParticleKind[]

/** A phone draws half as many. */
export function particleCount(style: ParticleStyle, mobile: boolean): number {
  return mobile ? Math.ceil(style.count / 2) : style.count
}
