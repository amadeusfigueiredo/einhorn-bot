import { describe, expect, it } from 'vitest'
import { addToTake, expected, guideStrike, isCreation, progressOf, startGuide, takeLength, type Take, type TakeRules } from './sequence'

const RULES: TakeRules = { maxEvents: 64, maxSeconds: 40, minEvents: 4 }

describe('a take (what she made)', () => {
  it('starts with the first event at 0 whatever the time was', () => {
    expect(addToTake([], 3, 5, RULES)).toEqual([{ event: 3, at: 0 }])
  })

  it('adds each event at its own time, keeping the order', () => {
    let t: Take<number> = []
    t = addToTake(t, 0, 0, RULES)
    t = addToTake(t, 2, 0.5, RULES)
    t = addToTake(t, 4, 1.25, RULES)
    expect(t).toEqual([
      { event: 0, at: 0 },
      { event: 2, at: 0.5 },
      { event: 4, at: 1.25 },
    ])
  })

  it('does not change the take it was given', () => {
    const t: Take<number> = [{ event: 0, at: 0 }]
    addToTake(t, 1, 1, RULES)
    expect(t).toHaveLength(1)
  })

  it('stops keeping events at the limit of events and of seconds', () => {
    let t: Take<number> = []
    for (let i = 0; i < RULES.maxEvents + 10; i++) t = addToTake(t, i % 8, i * 0.1, RULES)
    expect(t).toHaveLength(RULES.maxEvents)
    expect(addToTake([{ event: 0, at: 0 }], 1, RULES.maxSeconds + 1, RULES)).toHaveLength(1)
    expect(addToTake([{ event: 0, at: 0 }], 1, RULES.maxSeconds, RULES)).toHaveLength(2)
  })

  it('lasts until its last event, and nothing without events', () => {
    expect(takeLength([])).toBe(0)
    expect(takeLength([{ event: 0, at: 0 }])).toBe(0)
    expect(takeLength([{ event: 0, at: 0 }, { event: 1, at: 2.5 }])).toBe(2.5)
  })

  it('is a creation of her own from the minimum up, whatever the activity says that is', () => {
    const take = (n: number): Take<string> => Array.from({ length: n }, (_, i) => ({ event: 'step', at: i }))
    expect(isCreation(take(RULES.minEvents - 1), RULES)).toBe(false)
    expect(isCreation(take(RULES.minEvents), RULES)).toBe(true)
    expect(isCreation([], RULES)).toBe(false)
    expect(isCreation(take(2), { ...RULES, minEvents: 2 })).toBe(true)
  })

  it('works with any kind of event: a dance step is a word, not a number', () => {
    const t = addToTake(addToTake([], 'twirl', 0, RULES), 'hop', 1, RULES)
    expect(t.map((m) => m.event)).toEqual(['twirl', 'hop'])
  })
})

describe('a lesson done along with the glow', () => {
  const steps = [0, 1, 2, 3, 3, 2]

  it('begins with the first step to do', () => {
    const g = startGuide(steps)
    expect(g.position).toBe(0)
    expect(expected(g)).toBe(0)
    expect(progressOf(g)).toBe(0)
  })

  it('a right step moves on to the next', () => {
    const r = guideStrike(startGuide(steps), 0)
    expect(r.right).toBe(true)
    expect(r.done).toBe(false)
    expect(r.guide.position).toBe(1)
    expect(expected(r.guide)).toBe(1)
    expect(progressOf(r.guide)).toBeCloseTo(1 / 6)
  })

  it('a wrong step stays where it was, and is not done (nothing is punished)', () => {
    const g = startGuide(steps)
    const r = guideStrike(g, 5)
    expect(r.right).toBe(false)
    expect(r.done).toBe(false)
    expect(r.guide).toBe(g)
  })

  it('does not change the one it was given', () => {
    const g = startGuide(steps)
    guideStrike(g, 0)
    expect(g.position).toBe(0)
  })

  it('goes right through: the last right step is done, and then there is no next step', () => {
    let g = startGuide(steps)
    let last = { done: false }
    for (const s of steps) {
      const r = guideStrike(g, s)
      expect(r.right).toBe(true)
      g = r.guide
      last = r
    }
    expect(last.done).toBe(true)
    expect(expected(g)).toBeUndefined()
    expect(progressOf(g)).toBe(1)
  })

  it('a step after the end is wrong, never done again', () => {
    let g = startGuide(steps)
    for (const s of steps) g = guideStrike(g, s).guide
    const r = guideStrike(g, 0)
    expect(r.right).toBe(false)
    expect(r.done).toBe(false)
  })

  it('a child who does a wrong step now and then still gets to the end', () => {
    let g = startGuide(steps)
    let done = false
    for (const s of steps) {
      g = guideStrike(g, (s + 1) % 8).guide
      const r = guideStrike(g, s)
      g = r.guide
      done = r.done
    }
    expect(done).toBe(true)
  })

  it('works with steps that are words, and with its own idea of "the same"', () => {
    const dance = ['twirl', 'hop', 'clap']
    expect(guideStrike(startGuide(dance), 'twirl').right).toBe(true)
    expect(guideStrike(startGuide(dance), 'hop').right).toBe(false)
    const loose = guideStrike(startGuide(dance), 'TWIRL', (a, b) => a.toLowerCase() === b.toLowerCase())
    expect(loose.right).toBe(true)
  })

  it('a lesson with no steps is done already', () => {
    expect(progressOf(startGuide([]))).toBe(1)
    expect(guideStrike(startGuide<number>([]), 0).right).toBe(false)
  })
})
