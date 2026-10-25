import { describe, expect, it } from 'vitest'
import { amaraPose, REST_AMARA, type AmaraInput, type AmaraMood } from './amaraMotion'

const MOODS: AmaraMood[] = ['idle', 'wave', 'cheer', 'think', 'happy', 'sleep']
const pose = (over: Partial<AmaraInput> = {}) => amaraPose({ t: 1.234, walking: false, mood: 'idle', reduceMotion: false, ...over })
/** The pose over a few seconds, for what moves. */
const over = (f: (t: number) => number, seconds = 6) => Array.from({ length: seconds * 20 }, (_, i) => f(i / 20))
const range = (xs: number[]) => Math.max(...xs) - Math.min(...xs)

describe('amaraPose', () => {
  it('only gives numbers a body can use, in every mood and state', () => {
    for (const mood of MOODS) {
      for (const walking of [false, true]) {
        for (const reduceMotion of [false, true]) {
          for (const t of [0, 0.3, 1.7, 55.5]) {
            const p = amaraPose({ t, walking, mood, reduceMotion })
            for (const [key, value] of Object.entries(p)) expect(Number.isFinite(value), `${mood} ${key}`).toBe(true)
            expect(Object.keys(p).sort()).toEqual(Object.keys(REST_AMARA).sort())
          }
        }
      }
    }
  })

  it('is the same pose for the same time (nothing random)', () => {
    expect(pose({ t: 3.3 })).toEqual(pose({ t: 3.3 }))
  })

  it('she is never fully still: breathing, a little bounce and a head that moves, even standing', () => {
    expect(range(over((t) => pose({ t }).breathe))).toBeGreaterThan(0.02)
    expect(range(over((t) => pose({ t }).bounce))).toBeGreaterThan(0.005)
    expect(range(over((t) => pose({ t }).headY))).toBeGreaterThan(0.2)
  })

  it('walking swings the legs both ways, and the arms against them', () => {
    const swing = over((t) => pose({ t, walking: true }).legSwing)
    expect(Math.min(...swing)).toBeLessThan(-0.5)
    expect(Math.max(...swing)).toBeGreaterThan(0.5)
    const t = 0.1
    const p = pose({ t, walking: true })
    expect(Math.sign(p.armLX)).toBe(-Math.sign(p.legSwing))
    expect(Math.sign(p.armRX)).toBe(Math.sign(p.legSwing))
  })

  it('standing, her legs stay together', () => {
    for (const t of [0, 1, 2.5]) expect(pose({ t }).legSwing).toBe(0)
  })

  it('walking bounces more than standing; cheering bounces most', () => {
    const top = (input: Partial<AmaraInput>) => Math.max(...over((t) => pose({ t, ...input }).bounce))
    expect(top({ walking: true })).toBeGreaterThan(top({}) * 2)
    expect(top({ mood: 'cheer' })).toBeGreaterThan(top({ walking: true }) * 2)
  })

  it('waving lifts one arm high and swings it; the other hangs', () => {
    const p = pose({ mood: 'wave' })
    expect(Math.abs(p.armRZ)).toBeGreaterThan(2)
    expect(Math.abs(p.armLZ)).toBeLessThan(0.5)
    expect(range(over((t) => pose({ t, mood: 'wave' }).armRZ))).toBeGreaterThan(0.4)
  })

  it('cheering (and being happy) lifts both arms, to the two sides', () => {
    for (const mood of ['cheer', 'happy'] as const) {
      const p = pose({ mood })
      expect(Math.abs(p.armLZ)).toBeGreaterThan(2)
      expect(Math.abs(p.armRZ)).toBeGreaterThan(2)
      expect(Math.sign(p.armLZ)).toBe(-Math.sign(p.armRZ))
      expect(p.armLX).toBe(0)
      expect(p.armRX).toBe(0)
    }
  })

  it('thinking brings a hand up in front of her face and tilts the head', () => {
    const p = pose({ mood: 'think' })
    expect(p.armRX).toBeLessThan(-1.5)
    expect(p.headZ).toBeCloseTo(0.25, 5)
    expect(pose({ mood: 'think', walking: true }).armRX).toBeLessThan(-1.5)
  })

  it('asleep, her eyes are shut, her arms rest and she looks straight ahead', () => {
    const p = pose({ mood: 'sleep' })
    expect(p.eyeOpen).toBeLessThan(0.2)
    expect(p.headY).toBe(0)
    expect(p.armLX).toBe(0)
    expect(p.armRX).toBe(0)
  })

  it('looks around while she stands, and straight ahead while she walks', () => {
    expect(range(over((t) => pose({ t, walking: true }).headY))).toBe(0)
    expect(range(over((t) => pose({ t }).headY))).toBeGreaterThan(0.2)
  })

  it('blinks now and then: eyes open nearly all the time, shut for a moment', () => {
    const eyes = over((t) => pose({ t }).eyeOpen, 20)
    expect(Math.max(...eyes)).toBe(1)
    expect(Math.min(...eyes)).toBeLessThan(0.3)
    expect(eyes.filter((e) => e === 1).length / eyes.length).toBeGreaterThan(0.9)
  })

  it('two girls with different seeds do not blink together', () => {
    const a = over((t) => pose({ t, seed: 0 }).eyeOpen, 20)
    const b = over((t) => pose({ t, seed: 2 }).eyeOpen, 20)
    expect(a).not.toEqual(b)
  })

  describe('with reduced motion', () => {
    const calm = (input: Partial<AmaraInput> = {}) => over((t) => pose({ t, reduceMotion: true, ...input }).bounce)
    it('nothing bounces, sways, swings or blinks', () => {
      for (const mood of MOODS) {
        for (const walking of [false, true]) {
          const poses = over((t) => pose({ t, reduceMotion: true, mood, walking }).legSwing)
          expect(range(poses), `${mood} legs`).toBe(0)
          expect(range(calm({ mood, walking })), `${mood} bounce`).toBe(0)
          expect(range(over((t) => pose({ t, reduceMotion: true, mood, walking }).breathe)), `${mood} breath`).toBe(0)
          expect(range(over((t) => pose({ t, reduceMotion: true, mood, walking }).headY)), `${mood} look`).toBe(0)
          expect(range(over((t) => pose({ t, reduceMotion: true, mood, walking }).bunZ)), `${mood} bun`).toBe(0)
        }
      }
    })

    it('she still shows how she feels: arms up for a cheer, a hand at the chin for a thought, eyes shut asleep', () => {
      expect(Math.abs(pose({ mood: 'cheer', reduceMotion: true }).armLZ)).toBeGreaterThan(2)
      expect(pose({ mood: 'think', reduceMotion: true }).armRX).toBeLessThan(-1.5)
      expect(pose({ mood: 'sleep', reduceMotion: true }).eyeOpen).toBeLessThan(0.2)
      expect(pose({ mood: 'idle', reduceMotion: true }).eyeOpen).toBe(1)
    })
  })
})
