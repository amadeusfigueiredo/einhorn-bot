/** Design pixels per 3D world unit. A unicorn's 150 px box is 1.5 units. */
export const UNIT = 100

export type Vec2 = { x: number; z: number }

/** Game-space point (design pixels, origin top-left) to the ground plane (origin centre). */
export function gameToWorld(x: number, y: number, width: number, height: number): Vec2 {
  return { x: (x - width / 2) / UNIT, z: (y - height / 2) / UNIT }
}

export function worldToGame(x: number, z: number, width: number, height: number) {
  return { x: x * UNIT + width / 2, y: z * UNIT + height / 2 }
}

/** Small deterministic PRNG so props land in the same place on every visit. */
export function seeded(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

/** Camera zoom (ortho) so the whole ground plus a margin fits the viewport. */
export function fitZoom(opts: {
  viewW: number
  viewH: number
  groundW: number
  groundH: number
  /** sin of the camera's elevation angle: ground depth shrinks by this. */
  sinElevation: number
  margin?: number
  /** Extra screen height above the ground (for a room's back wall and sky). */
  headroom?: number
}): number {
  const m = opts.margin ?? 1.0
  const needW = opts.groundW + m
  const needH = opts.groundH * opts.sinElevation + m + 1.4 + (opts.headroom ?? 0)
  return Math.min(opts.viewW / needW, opts.viewH / needH)
}
