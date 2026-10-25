import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '../../i18n/languages'
import { SEQUENCES } from '../../audio/sfx'
import { MOVE_IDS } from './amara/amaraMoves'
import {
  BODY_MIDDLE,
  NO_UNICORN_EXTRAS,
  UNICORN_MOVES,
  UNICORN_MOVE_IDS,
  drawUnicornMove,
  newUnicornBag,
  pivotShift,
  plantedLift,
  unicornMoveById,
  unicornMovePose,
  type UnicornMoveId,
  type UnicornMovePose,
} from './unicornMoves'

const keysOf = (p: UnicornMovePose) => Object.keys(p) as (keyof UnicornMovePose)[]

describe('the unicorn\'s twelve moves', () => {
  it('are twelve, one for each id, each id once', () => {
    expect(UNICORN_MOVES).toHaveLength(12)
    expect(UNICORN_MOVES.map((m) => m.id)).toEqual([...UNICORN_MOVE_IDS])
    expect(new Set(UNICORN_MOVE_IDS).size).toBe(12)
  })

  it('each have a name in every language, all different', () => {
    for (const m of UNICORN_MOVES) for (const l of LANGUAGES) expect(m.name[l.code].trim().length, `${m.id} ${l.code}`).toBeGreaterThan(0)
    expect(new Set(UNICORN_MOVES.map((m) => m.name.en)).size).toBe(12)
  })

  it('each have a sound that exists, and the sounds are mostly different', () => {
    for (const m of UNICORN_MOVES) expect(Object.keys(SEQUENCES), m.id).toContain(m.sound)
    expect(new Set(UNICORN_MOVES.map((m) => m.sound)).size).toBeGreaterThanOrEqual(10)
  })

  it('has the whinny and the hooves among its sounds, which Amara does not use', () => {
    const sounds = UNICORN_MOVES.map((m) => m.sound)
    expect(sounds).toContain('neigh')
    expect(sounds).toContain('clop')
  })

  it('last two to three and a bit seconds', () => {
    for (const m of UNICORN_MOVES) {
      expect(m.duration, m.id).toBeGreaterThanOrEqual(2)
      expect(m.duration, m.id).toBeLessThanOrEqual(3.5)
    }
  })

  it('give real numbers in a body-sized range at every moment (and a little outside it)', () => {
    for (const m of UNICORN_MOVES) {
      for (let t = -0.5; t <= m.duration + 0.5; t += 0.03) {
        const pose = m.pose(t)
        for (const key of keysOf(pose)) {
          const v = pose[key] as number
          expect(Number.isFinite(v), `${m.id} ${key} at ${t}`).toBe(true)
          const limit = key === 'spin' || key === 'flip' ? 14 : key === 'lift' ? 1 : key === 'stretch' ? 1.3 : key === 'glow' ? 3 : 2
          expect(Math.abs(v), `${m.id} ${key} at ${t}`).toBeLessThanOrEqual(limit)
        }
      }
    }
  })

  it('never sink the body into the ground by more than a hair', () => {
    for (const m of UNICORN_MOVES) for (let t = 0; t <= m.duration; t += 0.03) expect(m.pose(t).lift ?? 0, m.id).toBeGreaterThanOrEqual(-0.05)
  })

  it('really move: something changes during each one', () => {
    for (const m of UNICORN_MOVES) {
      const samples = Array.from({ length: 40 }, (_, i) => m.pose((i / 39) * m.duration))
      const moved = keysOf(Object.assign({}, ...samples)).filter((k) => new Set(samples.map((p) => (p[k] as number | undefined)?.toFixed(3))).size > 1)
      expect(moved.length, m.id).toBeGreaterThan(0)
    }
  })

  it('are all different from each other', () => {
    const signature = (id: UnicornMoveId) => JSON.stringify(unicornMoveById(id).pose(1.1))
    expect(new Set(UNICORN_MOVE_IDS.map(signature)).size).toBe(12)
  })

  it('share only the name twirl with Amara\'s moves', () => {
    const shared = UNICORN_MOVE_IDS.filter((id) => (MOVE_IDS as readonly string[]).includes(id))
    expect(shared.sort()).toEqual(['twirl'])
  })

  it('unicornMoveById finds each and says so when there is none', () => {
    for (const id of UNICORN_MOVE_IDS) expect(unicornMoveById(id).id).toBe(id)
    expect(() => unicornMoveById('nope' as UnicornMoveId)).toThrow(/no such unicorn move/)
  })

  it('the twirl turns two whole times and the rainbow one', () => {
    expect(unicornMoveById('twirl').pose(2.4).spin).toBeCloseTo(4 * Math.PI, 6)
    expect(unicornMoveById('rainbowSpin').pose(3.2).spin).toBeCloseTo(2 * Math.PI, 6)
  })

  it('the somersault goes once right round, forward, and ends where it began', () => {
    const m = unicornMoveById('somersault')
    expect(m.pose(0).flip ?? 0).toBeCloseTo(0, 9)
    expect(m.pose(m.duration).flip).toBeCloseTo(-2 * Math.PI, 6)
    expect(m.pose(m.duration).lift ?? 0).toBeCloseTo(0, 2)
    // And high up while it is upside down, so the back does not go through the ground.
    expect(m.pose(0.35 + 0.55).lift!).toBeGreaterThan(0.6)
  })

  it('the rear up puts the nose up, the front hooves forward and keeps the back hooves on the ground', () => {
    const m = unicornMoveById('rearUp')
    const top = m.pose(m.duration / 2)
    expect(top.roll!).toBeGreaterThan(0.8)
    expect(top.frontL!).toBeGreaterThan(0.5)
    expect(top.backL).toBeCloseTo(-top.roll!, 9)
    expect(top.lift!).toBeCloseTo(plantedLift(top.roll!), 9)
    expect(m.pose(0).roll!).toBeCloseTo(0, 9)
    expect(m.pose(m.duration).roll!).toBeCloseTo(0, 9)
  })

  it('the bow puts the head down and gets up again', () => {
    const m = unicornMoveById('bow')
    expect(m.pose(m.duration / 2).headPitch!).toBeLessThan(-0.9)
    expect(m.pose(0).headPitch!).toBeCloseTo(0, 9)
    expect(m.pose(m.duration).headPitch!).toBeCloseTo(0, 9)
  })

  it('the gallop swings the legs hard and the front pair against the back pair', () => {
    const m = unicornMoveById('gallop')
    let frontMax = 0
    for (let t = 0; t < m.duration; t += 0.02) {
      const p = m.pose(t)
      frontMax = Math.max(frontMax, Math.abs(p.frontL!))
      expect(p.backL!).toBeCloseTo(-p.frontL!, 9)
    }
    expect(frontMax).toBeGreaterThan(0.8)
  })

  it('the stomp lifts one front hoof at a time', () => {
    const m = unicornMoveById('stomp')
    let leftUp = false
    let rightUp = false
    for (let t = 0; t < m.duration; t += 0.02) {
      const p = m.pose(t)
      if (p.frontL! > 0.5) leftUp = true
      if (p.frontR! > 0.5) rightUp = true
      expect(Math.min(p.frontL!, p.frontR!), 'one hoof stays down').toBeLessThanOrEqual(0.0001)
    }
    expect(leftUp && rightUp).toBe(true)
  })

  it('the sparkle and the rainbow light the horn up', () => {
    expect(Math.max(...Array.from({ length: 50 }, (_, i) => unicornMoveById('sparkle').pose(i * 0.05).glow!))).toBeGreaterThan(1.2)
    expect(unicornMoveById('rainbowSpin').pose(1.6).glow!).toBeGreaterThan(1.5)
  })

  it('NO_UNICORN_EXTRAS is all zero', () => {
    expect(Object.values(NO_UNICORN_EXTRAS).every((v) => v === 0)).toBe(true)
  })
})

describe('where the body turns', () => {
  it('a body not turned has not moved', () => {
    expect(pivotShift(0)).toEqual({ x: 0, y: 0 })
  })

  it('turned upside down it is carried up by the height of its middle twice over, so it turns about the middle', () => {
    const upside = pivotShift(Math.PI)
    expect(upside.y).toBeCloseTo(2 * BODY_MIDDLE, 9)
    expect(upside.x).toBeCloseTo(0, 9)
  })

  it('keeps the middle of the body where it was, whatever the angle', () => {
    for (const a of [-3, -1.2, 0.4, 2, 5]) {
      const { x, y } = pivotShift(a)
      // The middle point (0, BODY_MIDDLE) turned about the feet, then carried by the shift.
      const turnedX = -BODY_MIDDLE * Math.sin(a) + x
      const turnedY = BODY_MIDDLE * Math.cos(a) + y
      expect(turnedX).toBeCloseTo(0, 9)
      expect(turnedY).toBeCloseTo(BODY_MIDDLE, 9)
    }
  })

  it('a body tipped nose up is lifted just enough that the back hooves are on the ground', () => {
    expect(plantedLift(0)).toBe(0)
    for (const roll of [0.3, 0.6, 0.9]) {
      // The back hip, tipped by `roll`, then the leg turned back by `roll` hangs straight down 0.4: its foot is at hip height - 0.4.
      const hipY = 0.34 * Math.sin(-roll) * -1 // (the hip is behind the middle, at x = -0.34)
      const turnedHipY = -0.34 * Math.sin(roll) + 0.4 * Math.cos(roll)
      expect(hipY).toBeCloseTo(0.34 * Math.sin(roll), 9)
      expect(turnedHipY + plantedLift(roll) - 0.4).toBeCloseTo(0, 9)
    }
  })
})

describe('the unicorn moves with reduced motion', () => {
  it('hold still: no spin, flip, lean, hop or step, and the same pose at any moment', () => {
    for (const m of UNICORN_MOVES) {
      const a = unicornMovePose(m, 0.3, true)
      const b = unicornMovePose(m, 1.7, true)
      expect(a).toEqual(b)
      for (const key of ['spin', 'roll', 'lift', 'tail', 'flip', 'tilt', 'frontL', 'frontR', 'backL', 'backR'] as const) expect(a[key], `${m.id} ${key}`).toBe(0)
      expect(a.stretch, m.id).toBe(1)
    }
  })

  it('keep the head of the move (the calm version still reads as the move)', () => {
    expect(unicornMovePose(unicornMoveById('bow'), 0, true).headPitch!).toBeLessThan(-0.5)
    expect(unicornMovePose(unicornMoveById('lookAround'), 0, true).headYaw).toBeDefined()
  })

  it('are the real move when motion is allowed', () => {
    const m = unicornMoveById('wiggle')
    expect(unicornMovePose(m, 0.5, false)).toEqual(m.pose(0.5))
  })
})

describe('drawing a unicorn move', () => {
  const seeded = (seed: number) => {
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296
      return s / 4294967296
    }
  }

  it('starts with a full bag and does all twelve before one repeats, never the same twice in a row', () => {
    expect(newUnicornBag()).toEqual({ left: UNICORN_MOVE_IDS, last: null })
    const random = seeded(7)
    let bag = newUnicornBag()
    let last: string | null = null
    const round: string[] = []
    for (let i = 0; i < 60; i++) {
      const draw = drawUnicornMove(bag, random)
      expect(draw.id).not.toBe(last)
      if (i % 12 === 0) round.length = 0
      round.push(draw.id)
      if (i % 12 === 11) expect(new Set(round).size).toBe(12)
      last = draw.id
      bag = draw.bag
    }
  })
})
