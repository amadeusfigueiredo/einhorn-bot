import { describe, expect, it } from 'vitest'
import { DAYS_KEPT, EMPTY_PRACTICE, dayKey, duration, parsePractice, rightShare, secondsOn, withAnswer, withSeconds } from './practiceModel'

describe('the practice numbers', () => {
  it('start at nothing', () => {
    expect(EMPTY_PRACTICE).toEqual({ seconds: 0, days: {}, classes: {} })
    expect(secondsOn(EMPTY_PRACTICE, '2026-10-22')).toBe(0)
  })

  it('add seconds to the total and to the day, and only whole seconds', () => {
    const a = withSeconds(EMPTY_PRACTICE, 5, '2026-10-22')
    const b = withSeconds(a, 7.9, '2026-10-22')
    const c = withSeconds(b, 5, '2026-10-23')
    expect(c.seconds).toBe(17)
    expect(secondsOn(c, '2026-10-22')).toBe(12)
    expect(secondsOn(c, '2026-10-23')).toBe(5)
    expect(EMPTY_PRACTICE.seconds).toBe(0)
  })

  it('ignore no time, negative time and what is not a number', () => {
    for (const s of [0, -3, NaN]) expect(withSeconds(EMPTY_PRACTICE, s, '2026-10-22')).toBe(EMPTY_PRACTICE)
  })

  it('keep only the latest days (the total keeps everything)', () => {
    let p = EMPTY_PRACTICE
    for (let d = 1; d <= DAYS_KEPT + 6; d++) p = withSeconds(p, 10, `2026-09-${String(d).padStart(2, '0')}`)
    expect(Object.keys(p.days)).toHaveLength(DAYS_KEPT)
    expect(p.days['2026-09-01']).toBeUndefined()
    expect(p.days[`2026-09-${DAYS_KEPT + 6}`]).toBe(10)
    expect(p.seconds).toBe((DAYS_KEPT + 6) * 10)
  })

  it('count right and wrong answers by class', () => {
    let p = withAnswer(EMPTY_PRACTICE, 2, 'right')
    p = withAnswer(p, 2, 'right')
    p = withAnswer(p, 2, 'wrong')
    p = withAnswer(p, 0, 'wrong')
    expect(p.classes).toEqual({ '2': { right: 2, wrong: 1 }, '0': { right: 0, wrong: 1 } })
    expect(EMPTY_PRACTICE.classes).toEqual({})
  })

  it('tell what share was right, and nothing when nothing was answered', () => {
    expect(rightShare(undefined)).toBeNull()
    expect(rightShare({ right: 0, wrong: 0 })).toBeNull()
    expect(rightShare({ right: 3, wrong: 1 })).toBe(0.75)
  })

  it('write seconds as hours and minutes, any playing at all being at least a minute', () => {
    expect(duration(0)).toEqual({ hours: 0, minutes: 0 })
    expect(duration(10)).toEqual({ hours: 0, minutes: 1 })
    expect(duration(20 * 60)).toEqual({ hours: 0, minutes: 20 })
    expect(duration(3600)).toEqual({ hours: 1, minutes: 0 })
    expect(duration(4980)).toEqual({ hours: 1, minutes: 23 })
  })

  it('name a day by the local date', () => {
    expect(dayKey(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02')
    expect(dayKey(new Date(2026, 0, 31, 0, 0))).toBe('2026-01-31')
  })
})

describe('reading what was saved', () => {
  const good = { seconds: 100, days: { '2026-10-22': 60 }, classes: { '0': { right: 2, wrong: 1 } } }

  it('gives back what was written', () => {
    expect(parsePractice(good)).toEqual(good)
  })

  it('refuses what is not the right shape', () => {
    for (const bad of [null, 'x', 3, [], {}, { seconds: -1, days: {}, classes: {} }, { seconds: 'a', days: {}, classes: {} }, { seconds: 1, days: null, classes: {} }, { seconds: 1, days: {}, classes: null }]) {
      expect(parsePractice(bad), JSON.stringify(bad)).toBeNull()
    }
  })

  it('leaves out single entries that are wrong and keeps the rest', () => {
    const p = parsePractice({
      seconds: 5.7,
      days: { '2026-10-22': 10, today: 5, '2026-10-21': -1, '2026-10-20': 'x' },
      classes: { '0': { right: 1, wrong: 2 }, x: { right: 1, wrong: 1 }, '1': { right: -1, wrong: 0 }, '2': null, '3': { right: 'a', wrong: 1 } },
    })
    expect(p).toEqual({ seconds: 5, days: { '2026-10-22': 10 }, classes: { '0': { right: 1, wrong: 2 } } })
  })

  it('keeps only the latest days of a long list', () => {
    const days = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`2026-08-${String(i + 1).padStart(2, '0')}`, 1]))
    expect(Object.keys(parsePractice({ seconds: 0, days, classes: {} })!.days)).toHaveLength(DAYS_KEPT)
  })
})
