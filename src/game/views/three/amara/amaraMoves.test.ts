import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '../../../i18n/languages'
import { SEQUENCES } from '../../../audio/sfx'
import { AMARA_MOVES, HOLD_IDS, MOVE_FADE, MOVE_IDS, NO_EXTRAS, drawMove, holdPose, moveById, movePose, moveWeight, newBag, type MoveId, type MovePose } from './amaraMoves'

const keysOf = (p: MovePose) => Object.keys(p) as (keyof MovePose)[]

describe('the twenty moves', () => {
  it('are twenty, one for each id, each id once', () => {
    expect(MOVE_IDS).toHaveLength(20)
    expect(AMARA_MOVES).toHaveLength(20)
    expect(AMARA_MOVES.map((m) => m.id)).toEqual([...MOVE_IDS])
    expect(new Set(MOVE_IDS).size).toBe(20)
  })

  it('each have a name in every language, all different', () => {
    for (const m of AMARA_MOVES) for (const l of LANGUAGES) expect(m.name[l.code].trim().length, `${m.id} ${l.code}`).toBeGreaterThan(0)
    expect(new Set(AMARA_MOVES.map((m) => m.name.en)).size).toBe(20)
  })

  it('each have a sound of their own kind that exists', () => {
    for (const m of AMARA_MOVES) expect(Object.keys(SEQUENCES), m.id).toContain(m.sound)
  })

  it('use at least a dozen different sounds (each move sounds like itself)', () => {
    expect(new Set(AMARA_MOVES.map((m) => m.sound)).size).toBeGreaterThanOrEqual(14)
  })

  it('last a couple of seconds to three and a bit: long enough to enjoy, short enough not to wait', () => {
    for (const m of AMARA_MOVES) {
      expect(m.duration, m.id).toBeGreaterThanOrEqual(2)
      expect(m.duration, m.id).toBeLessThanOrEqual(3.5)
    }
  })

  it('give real numbers, in a body-sized range, at every moment (and a little outside it)', () => {
    for (const m of AMARA_MOVES) {
      for (let t = -0.5; t <= m.duration + 0.5; t += 0.03) {
        const pose = m.pose(t)
        for (const key of keysOf(pose)) {
          const v = pose[key] as number
          expect(Number.isFinite(v), `${m.id} ${key} at ${t}`).toBe(true)
          const limit = key === 'spin' ? 14 : key === 'bounce' ? 0.5 : key === 'shiftX' ? 0.4 : key === 'breathe' ? 1.2 : 3.3
          expect(Math.abs(v), `${m.id} ${key} at ${t}`).toBeLessThanOrEqual(limit)
        }
      }
    }
  })

  it('never lift a limb into the body: arms stay on their own side (no armLZ below -0.6, no armRZ above 0.6)', () => {
    for (const m of AMARA_MOVES) {
      for (let t = 0; t <= m.duration; t += 0.03) {
        const p = m.pose(t)
        expect(p.armLZ ?? 0, `${m.id} armLZ`).toBeGreaterThanOrEqual(-0.6)
        expect(p.armRZ ?? 0, `${m.id} armRZ`).toBeLessThanOrEqual(0.6)
      }
    }
  })

  it('really move: something changes during each one', () => {
    for (const m of AMARA_MOVES) {
      const samples = Array.from({ length: 40 }, (_, i) => m.pose((i / 39) * m.duration))
      const moved = new Set(samples.flatMap((p) => keysOf(p)).filter((k) => new Set(samples.map((p) => (p[k] as number | undefined)?.toFixed(3))).size > 1))
      expect(moved.size, m.id).toBeGreaterThan(0)
    }
  })

  it('are all different from each other (no two have the same arms and body at the same moment)', () => {
    const signature = (id: MoveId) => JSON.stringify(moveById(id).pose(1.1))
    expect(new Set(MOVE_IDS.map(signature)).size).toBe(20)
  })

  it('moveById finds each and says so when there is none', () => {
    for (const id of MOVE_IDS) expect(moveById(id).id).toBe(id)
    expect(() => moveById('nope' as MoveId)).toThrow(/no such move/)
  })

  it('the twirl turns two whole times', () => {
    const t = moveById('twirl')
    expect(t.pose(t.duration).spin).toBeCloseTo(4 * Math.PI, 6)
    expect(t.pose(0).spin).toBeCloseTo(0, 9)
  })

  it('the robot holds each pose a little while (stiff: the arms jump between four poses)', () => {
    const robot = moveById('robot')
    const poses = new Set(Array.from({ length: 300 }, (_, i) => JSON.stringify(robot.pose((i / 300) * robot.duration))))
    expect(poses.size).toBeLessThanOrEqual(4 * 2)
  })

  it('the heart holds both hands above her head', () => {
    const heart = moveById('heartHands').pose(1)
    expect(heart.armLZ).toBeGreaterThan(2.7)
    expect(heart.armRZ).toBeLessThan(-2.7)
  })

  it('the stretch goes up and comes back down', () => {
    const stretch = moveById('yawnStretch')
    expect(stretch.pose(stretch.duration / 2).armLZ!).toBeGreaterThan(2.4)
    expect(stretch.pose(0).armLZ!).toBeCloseTo(0.12, 2)
    expect(stretch.pose(stretch.duration).armLZ!).toBeCloseTo(0.12, 2)
  })

  it('NO_EXTRAS is all zero', () => {
    expect(Object.values(NO_EXTRAS).every((v) => v === 0)).toBe(true)
  })
})

describe('the fade of a move', () => {
  it('is nothing before and after, and full in the middle', () => {
    expect(moveWeight(-1, 2)).toBe(0)
    expect(moveWeight(0, 2)).toBe(0)
    expect(moveWeight(2, 2)).toBe(0)
    expect(moveWeight(3, 2)).toBe(0)
    expect(moveWeight(1, 2)).toBe(1)
  })

  it('eases in and out over MOVE_FADE seconds, smoothly', () => {
    expect(moveWeight(MOVE_FADE / 2, 2)).toBeGreaterThan(0)
    expect(moveWeight(MOVE_FADE / 2, 2)).toBeLessThan(1)
    expect(moveWeight(MOVE_FADE, 2)).toBe(1)
    expect(moveWeight(2 - MOVE_FADE / 2, 2)).toBeCloseTo(moveWeight(MOVE_FADE / 2, 2), 9)
    let last = 0
    for (let t = 0; t <= MOVE_FADE; t += 0.01) {
      const w = moveWeight(t, 2)
      expect(w).toBeGreaterThanOrEqual(last)
      last = w
    }
  })
})

describe('moves with reduced motion', () => {
  it('hold still: no spin, lean, step, bounce or leg swing, and the same pose at any moment', () => {
    for (const m of AMARA_MOVES) {
      const a = movePose(m, 0.3, true)
      const b = movePose(m, 1.7, true)
      expect(a).toEqual(b)
      for (const key of ['spin', 'roll', 'pitch', 'shiftX', 'legL', 'legR', 'legSwing', 'bounce', 'bunZ'] as const) expect(a[key], `${m.id} ${key}`).toBe(0)
    }
  })

  it('keep the arms of the move (the calm version still reads as the move)', () => {
    const wave = movePose(moveById('bigWave'), 0, true)
    expect(wave.armLZ).toBeGreaterThan(2)
    expect(wave.armRZ).toBeLessThan(-2)
  })

  it('are the real move when motion is allowed', () => {
    const m = moveById('shimmy')
    expect(movePose(m, 0.5, false)).toEqual(m.pose(0.5))
  })
})

describe('drawing a move', () => {
  const seeded = (seed: number) => {
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296
      return s / 4294967296
    }
  }

  it('starts with every move in the bag and none done', () => {
    expect(newBag()).toEqual({ left: MOVE_IDS, last: null })
  })

  it('does all twenty before one comes round again, in any order', () => {
    for (const seed of [1, 7, 42]) {
      const random = seeded(seed)
      let bag = newBag()
      const done: MoveId[] = []
      for (let i = 0; i < 20; i++) {
        const draw = drawMove(bag, random)
        done.push(draw.id)
        bag = draw.bag
      }
      expect(new Set(done).size).toBe(20)
    }
  })

  it('never does the same one twice in a row, even where the bag is filled again', () => {
    const random = seeded(99)
    let bag = newBag()
    let last: MoveId | null = null
    for (let i = 0; i < 400; i++) {
      const draw = drawMove(bag, random)
      expect(draw.id).not.toBe(last)
      last = draw.id
      bag = draw.bag
    }
  })

  it('does every move in each round of twenty, round after round', () => {
    const random = seeded(5)
    let bag = newBag()
    const all: MoveId[] = []
    for (let i = 0; i < 60; i++) {
      const draw = drawMove(bag, random)
      all.push(draw.id)
      bag = draw.bag
    }
    for (let round = 0; round < 3; round++) expect(new Set(all.slice(round * 20, round * 20 + 20)).size).toBe(20)
  })

  it('picks by the random number: low gives the first left, high the last', () => {
    expect(drawMove(newBag(), () => 0).id).toBe(MOVE_IDS[0])
    expect(drawMove(newBag(), () => 0.999999).id).toBe(MOVE_IDS[19])
    expect(drawMove(newBag(), () => 1).id).toBe(MOVE_IDS[19])
  })

  it('takes the drawn move out of the bag', () => {
    const draw = drawMove(newBag(), () => 0)
    expect(draw.bag.left).toHaveLength(19)
    expect(draw.bag.left).not.toContain(draw.id)
    expect(draw.bag.last).toBe(draw.id)
  })

  it('refills an empty bag without the last move for the first draw, and puts it back for later', () => {
    const draw = drawMove({ left: [], last: 'robot' }, () => 0)
    expect(draw.id).not.toBe('robot')
    expect(draw.bag.left).toContain('robot')
    expect(draw.bag.left).toHaveLength(19)
  })

  it('refills an empty bag with no last move too', () => {
    const draw = drawMove({ left: [], last: null }, () => 0)
    expect(draw.id).toBe(MOVE_IDS[0])
    expect(draw.bag.left).toHaveLength(19)
  })
})

describe('holds (a pose kept up while something asks)', () => {
  it('there is one: sitting', () => {
    expect([...HOLD_IDS]).toEqual(['sit'])
  })

  it('sitting has both legs out in front, the hands on the ropes, and nothing wild', () => {
    for (let t = 0; t < 6; t += 0.1) {
      const p = holdPose('sit', t, false)
      expect(p.legL).toBeGreaterThan(0.9)
      expect(p.legR).toBeGreaterThan(0.9)
      expect(p.legL).toBe(p.legR)
      expect(p.armLX).toBeLessThan(-0.3)
      expect(p.armRX).toBeLessThan(-0.3)
      expect(p.armLZ).toBeGreaterThan(0)
      expect(p.armRZ).toBeLessThan(0)
      expect(p.legL).toBeLessThan(1.7)
    }
  })

  it('pumps the legs as the swing goes, and keeps them still with reduced motion', () => {
    const legs = Array.from({ length: 60 }, (_, i) => holdPose('sit', i * 0.1, false).legL as number)
    expect(Math.max(...legs) - Math.min(...legs)).toBeGreaterThan(0.4)
    const calm = Array.from({ length: 60 }, (_, i) => holdPose('sit', i * 0.1, true).legL)
    expect(new Set(calm).size).toBe(1)
  })
})
