export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  /** Seconds lived and total lifetime. */
  age: number
  life: number
  size: number
  color: string
}

const GRAVITY = -40 // negative: sparkles drift *up* and slow, never fall

/** A burst of sparkles centred on a point. `rng` is injectable for tests. */
export function spawnSparkles(
  x: number,
  y: number,
  colors: readonly string[],
  count = 28,
  rng: () => number = Math.random
): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = rng() * Math.PI * 2
    const speed = 60 + rng() * 180
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      age: 0,
      life: 0.9 + rng() * 0.8,
      size: 3 + rng() * 5,
      color: colors[i % colors.length],
    }
  })
}

/** Advances particles in place and returns the survivors. */
export function stepParticles(particles: Particle[], dt: number): Particle[] {
  const alive: Particle[] = []
  for (const p of particles) {
    p.age += dt
    if (p.age >= p.life) continue
    // Drag + upward drift
    p.vx *= Math.exp(-2.2 * dt)
    p.vy = p.vy * Math.exp(-2.2 * dt) + GRAVITY * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    alive.push(p)
  }
  return alive
}

/** 0..1 opacity: quick fade-in, long fade-out. */
export function particleAlpha(p: Particle): number {
  const t = p.age / p.life
  return t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[]
) {
  if (particles.length === 0) return
  ctx.save()
  for (const p of particles) {
    ctx.globalAlpha = particleAlpha(p)
    ctx.fillStyle = p.color
    // Four-point star
    const r = p.size
    ctx.beginPath()
    ctx.moveTo(p.x, p.y - r)
    ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y)
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r)
    ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y)
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r)
    ctx.fill()
  }
  ctx.restore()
}
