import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '../i18n/languages'

const LANGS = LANGUAGES.map((l) => l.code)
import { walkBounds } from '../places/placeLayout'
import { GIGGLE_EVERY, giggleIn, isChild, HALL_BALL, HALL_WALKERS, FLIGHT, ballAt, folkLines, hallAnimals, inPicture, kidHop, walkerAt, walkerPlace } from './hallFolk'
import { HALL, HALL_BENCH, benchX, sectionGaps } from './hallLayout'

const times = Array.from({ length: 2400 }, (_, i) => i * 0.1) // four minutes

describe('the walkers of the corridor', () => {
  it('walk to and fro between their two ends and stand a moment at each', () => {
    for (const w of HALL_WALKERS) {
      const xs = times.map((t) => walkerAt(w, t).x)
      const lo = Math.min(w.from, w.to)
      const hi = Math.max(w.from, w.to)
      expect(Math.min(...xs)).toBeLessThanOrEqual(lo + 0.2)
      expect(Math.max(...xs)).toBeGreaterThanOrEqual(hi - 0.2)
      for (const x of xs) {
        expect(x).toBeGreaterThanOrEqual(lo - 1e-9)
        expect(x).toBeLessThanOrEqual(hi + 1e-9)
      }
      expect(times.some((t) => !walkerAt(w, t).walking)).toBe(true)
      expect(times.some((t) => walkerAt(w, t).walking)).toBe(true)
    }
  })

  it('go at their own speed and never jump', () => {
    for (const w of HALL_WALKERS) {
      let before = walkerAt(w, 0).x
      for (let t = 0.05; t < 240; t += 0.05) {
        const x = walkerAt(w, t).x
        expect(Math.abs(x - before) / 0.05, w.id).toBeLessThanOrEqual(w.speed + 1e-6)
        before = x
      }
    }
  })

  it('face the way they go, and stand still while they stand', () => {
    for (const w of HALL_WALKERS) {
      for (let t = 0; t < 120; t += 0.05) {
        const a = walkerAt(w, t)
        const b = walkerAt(w, t + 0.01)
        if (a.walking && b.walking) expect(b.x > a.x, `${w.id} ${t}`).toBe(!a.facingLeft)
        if (!a.walking && !b.walking) expect(b.x).toBe(a.x)
      }
    }
  })

  it('also work when one walks from the right to the left, and when the way is nothing', () => {
    const base = HALL_WALKERS[0]
    const back = { ...base, from: base.to, to: base.from, phase: 0 }
    expect(walkerAt(back, 0).facingLeft).toBe(true)
    expect(walkerAt(back, 0).x).toBe(base.to)
    const none = { ...base, from: 3, to: 3 }
    expect(Number.isFinite(walkerAt(none, 5).x)).toBe(true)
    expect(walkerAt(base, -5).x).toBeGreaterThanOrEqual(Math.min(base.from, base.to))
  })

  it('stand in the middle of their way, still, with reduced motion', () => {
    for (const w of HALL_WALKERS) {
      expect(walkerPlace(w, 12.3, true)).toEqual({ x: (w.from + w.to) / 2, facingLeft: false, walking: false })
      expect(walkerPlace(w, 12.3, false)).toEqual(walkerAt(w, 12.3))
    }
  })

  it('keep to their own stretch of the corridor, inside the walls and in front of the doors', () => {
    const b = walkBounds('hall')
    const sorted = [...HALL_WALKERS].sort((p, q) => Math.min(p.from, p.to) - Math.min(q.from, q.to))
    sorted.forEach((w, i) => {
      for (const x of [w.from, w.to]) {
        expect(x).toBeGreaterThanOrEqual(b.minX)
        expect(x).toBeLessThanOrEqual(b.maxX)
      }
      expect(w.z).toBeGreaterThan(HALL.wallZ + 3)
      expect(w.z).toBeLessThanOrEqual(b.maxZ)
      if (i > 0) expect(Math.min(w.from, w.to), w.id).toBeGreaterThan(Math.max(sorted[i - 1].from, sorted[i - 1].to))
    })
  })

  it('include a teacher with glasses, a bow tie and a cap', () => {
    const teacher = HALL_WALKERS.find((w) => w.id === 'hall-teacher')!
    expect(teacher.look.accessory).toBe('teacher')
    expect(teacher.size).toBeGreaterThan(HALL_WALKERS[0].size)
  })
})

describe('the ball', () => {
  it('goes to and fro between the two children, up in an arc, and rests in their hands', () => {
    const seen = times.map((t) => ballAt(t))
    expect(Math.min(...seen.map((b) => b.along))).toBeLessThan(0.01)
    expect(Math.max(...seen.map((b) => b.along))).toBeGreaterThan(0.99)
    expect(Math.min(...seen.map((b) => b.height))).toBeCloseTo(HALL_BALL.hold, 2)
    expect(Math.max(...seen.map((b) => b.height))).toBeCloseTo(HALL_BALL.hold + HALL_BALL.arc, 1)
    expect(ballAt(0.1 * HALL_BALL.toss).toward).toBe(1)
    expect(ballAt(1.1 * HALL_BALL.toss).toward).toBe(-1)
    expect(ballAt(-0.5 * HALL_BALL.toss).along).toBeGreaterThanOrEqual(0)
  })

  it('is thrown from one child and caught by the other: each child hops as it throws and as it catches', () => {
    const hopsOf = (side: 0 | 1) => times.filter((t) => kidHop(side, t) > 0.1).length
    expect(hopsOf(0)).toBeGreaterThan(0)
    expect(hopsOf(1)).toBeGreaterThan(0)
    // the first child hops when the ball leaves them (the start of a round), the second when it arrives
    expect(kidHop(0, 0)).toBeGreaterThan(0.2)
    expect(kidHop(1, 0)).toBe(0)
    expect(kidHop(1, HALL_BALL.toss)).toBeGreaterThan(0.2)
    expect(kidHop(0, HALL_BALL.toss)).toBe(0)
    for (const t of times) {
      for (const side of [0, 1] as const) {
        expect(kidHop(side, t)).toBeGreaterThanOrEqual(0)
        expect(kidHop(side, t)).toBeLessThanOrEqual(0.28 + 1e-9)
      }
    }
    expect(kidHop(0, -3)).toBeGreaterThanOrEqual(0)
  })

  it('has its children inside the corridor, and a line for each', () => {
    expect(HALL_BALL.x - HALL_BALL.gap).toBeGreaterThan(-HALL.halfW)
    expect(HALL_BALL.x + HALL_BALL.gap).toBeLessThan(HALL.halfW)
    expect(HALL_BALL.looks).toHaveLength(2)
    expect(HALL_BALL.lines.every((l) => l.length >= 2)).toBe(true)
  })
})

describe('the animals of the corridor', () => {
  const animals = hallAnimals()

  it('are a koala reading on the bench, a penguin, a capybara and a parrot', () => {
    expect(animals.map((a) => a.spec.type)).toEqual(['koala', 'penguin', 'capybara', 'parrot'])
    const koala = animals[0]
    expect(koala.spec.behavior).toBe('read')
    expect(koala.spec.holds).toBe('book')
    expect(koala.from[0]).toBe(benchX())
    expect(koala.from[1]).toBe(HALL_BENCH.seat)
    expect(koala.from[2]).toBe(HALL_BENCH.z)
  })

  it('have ids of their own, so no sound or speech timer is shared with a classroom', () => {
    const ids = animals.map((a) => a.spec.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id.startsWith('hall-')).toBe(true)
  })

  it('put the penguin and the capybara together in the last gap, away from the teacher', () => {
    const gap = sectionGaps()[3]
    const [, penguin, capybara] = animals
    expect(Math.abs(penguin.from[0] - gap)).toBeLessThan(2)
    expect(Math.abs(capybara.from[0] - gap)).toBeLessThan(2)
    const teacher = HALL_WALKERS.find((w) => w.id === 'hall-teacher')!
    expect(Math.min(penguin.from[0], capybara.from[0])).toBeGreaterThan(Math.max(teacher.from, teacher.to))
  })

  it('send the parrot the whole length of the corridor, above everyone, near the wall', () => {
    const parrot = animals[3]
    expect(parrot.spec.behavior).toBe('cruise')
    expect(parrot.from[0]).toBeLessThan(-HALL.halfW + 5)
    expect(parrot.to![0]).toBeGreaterThan(HALL.halfW - 5)
    expect(parrot.from[1]).toBe(FLIGHT.y)
    expect(FLIGHT.y).toBeGreaterThan(3)
    expect(FLIGHT.z).toBeLessThan(0)
  })
})

describe('what they say', () => {
  const lines = folkLines()

  it('has a friendly line, in every language, for each one that can be tapped', () => {
    const ids = [...HALL_WALKERS.map((w) => w.id), ...HALL_BALL.ids, ...hallAnimals().map((a) => a.spec.id)]
    expect(Object.keys(lines).sort()).toEqual([...ids].sort())
    for (const id of ids) {
      expect(lines[id].length, id).toBeGreaterThan(0)
      for (const line of lines[id]) for (const lang of LANGS) expect(line[lang]?.trim().length, `${id} ${lang}`).toBeGreaterThan(0)
    }
  })

  it('is short enough for a bubble over a head', () => {
    for (const ls of Object.values(lines)) for (const l of ls) for (const lang of LANGS) expect(l[lang].length, l[lang]).toBeLessThanOrEqual(45)
  })

  it('is the same words as the yard where the same friends are met', () => {
    const capybara = lines['hall-capybara'][0]
    expect(capybara.en).toBe('Bath time! Splish, splash!')
    expect(lines['hall-koala'][1].en).toBe('I am taking a break … zzz')
  })
})

describe('what is near the picture', () => {
  it('is what is within its reach either side, and a little more', () => {
    expect(inPicture(10, 10, 5)).toBe(true)
    expect(inPicture(16.9, 10, 5)).toBe(true)
    expect(inPicture(17.1, 10, 5)).toBe(false)
    expect(inPicture(2.9, 10, 5)).toBe(false)
    expect(inPicture(25, 10, 5, 10)).toBe(true)
    expect(inPicture(-30, 0, 10, 7)).toBe(false)
  })
})

describe('the giggles', () => {
  it('come a while apart, never too soon and never too late', () => {
    expect(giggleIn(() => 0)).toBe(GIGGLE_EVERY[0])
    expect(giggleIn(() => 0.999999)).toBeCloseTo(GIGGLE_EVERY[1], 3)
    expect(giggleIn(() => 0.5)).toBeCloseTo((GIGGLE_EVERY[0] + GIGGLE_EVERY[1]) / 2, 9)
  })

  it('are the children\'s: the walking and ball-playing children, not the teacher or the animals', () => {
    for (const w of HALL_WALKERS) expect(isChild(w.id)).toBe(w.id !== 'hall-teacher')
    for (const id of HALL_BALL.ids) expect(isChild(id)).toBe(true)
    for (const a of hallAnimals()) expect(isChild(a.spec.id)).toBe(false)
    expect(isChild('nobody')).toBe(false)
  })
})
