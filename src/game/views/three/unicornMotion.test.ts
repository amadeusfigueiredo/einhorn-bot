import { describe, it, expect } from 'vitest'
import type { Personality } from '../../data/unicornLooks'
import { REST, blink, encouragePose, happyPose, idlePose, sadPose, thinkPose, type Pose } from './unicornMotion'

const PERSONALITIES: Personality[] = ['bouncy', 'sleepy', 'curious', 'proud']
const times = Array.from({ length: 600 }, (_, i) => i * 0.05) // 0..30 s
const KEYS = Object.keys(REST) as (keyof Pose)[]

const finite = (p: Pose) => KEYS.every((k) => Number.isFinite(p[k]))
/** Every pose stays within what a plush unicorn could do. */
function sane(p: Pose, label: string) {
  expect(finite(p), label).toBe(true)
  expect(Math.abs(p.lift), `${label} lift`).toBeLessThan(0.7)
  expect(Math.abs(p.roll), `${label} roll`).toBeLessThan(0.5)
  expect(Math.abs(p.headPitch), `${label} headPitch`).toBeLessThan(1.2)
  expect(Math.abs(p.headYaw), `${label} headYaw`).toBeLessThan(1.2)
  expect(p.stretch, `${label} stretch`).toBeGreaterThan(0.85)
  expect(p.stretch, `${label} stretch`).toBeLessThan(1.15)
  expect(Math.abs(p.tail), `${label} tail`).toBeLessThan(1)
  expect(p.earsDown, `${label} ears`).toBeGreaterThanOrEqual(0)
  expect(p.earsDown, `${label} ears`).toBeLessThanOrEqual(1)
  expect(p.eyeOpen, `${label} eyes`).toBeGreaterThanOrEqual(0)
  expect(p.eyeOpen, `${label} eyes`).toBeLessThanOrEqual(1)
  expect(Math.abs(p.pawLift), `${label} paw`).toBeLessThan(1)
}

describe('REST', () => {
  it('stands still: nothing lifted, turned or squashed, ears up, eyes open', () => {
    expect(REST).toEqual({ lift: 0, spin: 0, roll: 0, headPitch: 0, headYaw: 0, stretch: 1, tail: 0, earsDown: 0, pawLift: 0, eyeOpen: 1 })
  })
})

describe('blink', () => {
  it('eyes are open most of the time, and only dip briefly', () => {
    const values = times.map((t) => blink(t))
    const open = values.filter((v) => v === 1).length
    expect(open / values.length).toBeGreaterThan(0.9)
    expect(Math.min(...values)).toBeLessThan(0.4)
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0.1 - 1e-9)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('a blink comes every 3.6 seconds', () => {
    expect(blink(3.5)).toBeLessThan(0.5)
    expect(blink(3.5 + 3.6)).toBeCloseTo(blink(3.5), 6)
  })

  it('a different seed blinks at a different moment, so a herd is not in step', () => {
    const at = (seed: number) => times.filter((t) => blink(t, seed) < 0.5)
    expect(at(0)).not.toEqual(at(1))
    expect(at(1)).not.toEqual(at(2))
  })

  it('is the same every time for the same moment and seed', () => {
    expect(blink(12.34, 5)).toBe(blink(12.34, 5))
  })
})

describe('idlePose', () => {
  it.each(PERSONALITIES)('%s is gentle and finite for 30 seconds', (p) => {
    for (const t of times) sane(idlePose(p, t), `${p} at ${t}`)
  })

  it('every personality fills the time differently', () => {
    const sigs = PERSONALITIES.map((p) => JSON.stringify(times.slice(0, 60).map((t) => idlePose(p, t))))
    expect(new Set(sigs).size).toBe(4)
  })

  it('the bouncy one hops, the sleepy one nods off, the proud one holds its head high, the curious one looks around', () => {
    expect(Math.max(...times.map((t) => idlePose('bouncy', t).lift))).toBeGreaterThan(0.15)
    expect(Math.min(...times.map((t) => idlePose('sleepy', t).eyeOpen))).toBeLessThan(0.4)
    expect(Math.max(...times.map((t) => idlePose('sleepy', t).headPitch))).toBeLessThan(0)
    expect(Math.min(...times.map((t) => idlePose('proud', t).headPitch))).toBeGreaterThan(0.1)
    const yaws = times.map((t) => idlePose('curious', t).headYaw)
    expect(Math.min(...yaws)).toBeLessThan(-0.4)
    expect(Math.max(...yaws)).toBeGreaterThan(0.4)
  })

  it('never looks sad: ears are not flat unless it is sleepy', () => {
    for (const p of PERSONALITIES.filter((x) => x !== 'sleepy')) {
      expect(Math.max(...times.map((t) => idlePose(p, t).earsDown))).toBeLessThan(0.4)
    }
  })

  it('always breathes a little', () => {
    for (const p of PERSONALITIES) {
      const lifts = times.map((t) => idlePose(p, t).lift)
      expect(Math.max(...lifts) - Math.min(...lifts)).toBeGreaterThan(0.02)
    }
  })
})

describe('happyPose', () => {
  it.each([0, 1, 2])('variant %i is lively and within reason', (v) => {
    for (const t of times.filter((x) => x < 6)) sane(happyPose(t, v, 1), `variant ${v} at ${t}`)
  })

  it('the three happy dances are different, and the variant number wraps around', () => {
    const sig = (v: number) => JSON.stringify([0.2, 0.5, 1].map((t) => happyPose(t, v)))
    expect(new Set([sig(0), sig(1), sig(2)]).size).toBe(3)
    expect(sig(3)).toBe(sig(0))
    expect(sig(7)).toBe(sig(1))
  })

  it('hopping lifts the unicorn off the ground', () => {
    expect(Math.max(...times.filter((t) => t < 2).map((t) => happyPose(t, 0).lift))).toBeGreaterThan(0.4)
  })

  it('the twirl turns a full circle when the joy is big, and not when it is small', () => {
    expect(happyPose(1, 1, 1).spin).toBeCloseTo(Math.PI * 2, 5)
    expect(happyPose(1, 1, 0.45).spin).toBe(0)
  })

  it('a smaller joy is a smaller jump', () => {
    for (const v of [0, 1, 2]) {
      const big = Math.max(...times.filter((t) => t < 3).map((t) => happyPose(t, v, 1).lift))
      const small = Math.max(...times.filter((t) => t < 3).map((t) => happyPose(t, v, 0.45).lift))
      expect(small, `variant ${v}`).toBeLessThan(big)
    }
  })

  it('the tail wags', () => {
    const tails = times.slice(0, 40).map((t) => happyPose(t, 2).tail)
    expect(Math.max(...tails)).toBeGreaterThan(0.4)
    expect(Math.min(...tails)).toBeLessThan(-0.4)
  })
})

describe('sadPose', () => {
  it.each([0, 1, 2])('variant %i is gentle and settles in', (v) => {
    expect(sadPose(0, v).headPitch).toBeCloseTo(v === 2 ? 0 : 0, 6)
    for (const t of times.filter((x) => x < 6)) sane(sadPose(t, v), `variant ${v} at ${t}`)
  })

  it('droops the ears and lowers the head or the body', () => {
    expect(sadPose(1, 0).earsDown).toBe(1)
    expect(sadPose(1, 0).headPitch).toBeLessThan(-0.5)
    expect(sadPose(1, 1).lift).toBeLessThan(0)
    expect(sadPose(1, 1).stretch).toBeLessThan(1)
  })

  it('wraps its variants too', () => {
    expect(JSON.stringify(sadPose(1, 4))).toBe(JSON.stringify(sadPose(1, 1)))
  })
})

describe('thinkPose and encouragePose', () => {
  it('encouraging nods the head and wags the tail, bouncing a little', () => {
    const p = times.map((t) => encouragePose(t))
    for (const x of p) sane(x, 'encourage')
    expect(Math.max(...p.map((x) => x.headPitch))).toBeGreaterThan(0.1)
    expect(Math.min(...p.map((x) => x.headPitch))).toBeLessThan(-0.1)
    expect(Math.max(...p.map((x) => x.lift))).toBeGreaterThan(0.02)
  })

  it('thinking is calm for as long as you like', () => {
    for (const t of times) sane(thinkPose(t), `think at ${t}`)
  })

  it('thinking lifts a paw now and then, like a child tapping a foot', () => {
    expect(Math.max(...times.map((t) => thinkPose(t).pawLift))).toBeGreaterThan(0.1)
    expect(times.filter((t) => thinkPose(t).pawLift === 0).length).toBeGreaterThan(times.length / 2)
  })
})
