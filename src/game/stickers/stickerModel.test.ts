import { describe, expect, it } from 'vitest'
import { PLAY_STICKERS } from './stickerData'
import { EMPTY_PROGRESS, applyEvent, parseProgress, valueOf, wonCount, type StickerProgress } from './stickerModel'

const times = (progress: StickerProgress, type: Parameters<typeof applyEvent>[1], n: number, key?: (i: number) => string) => {
  let p = progress
  const won: string[] = []
  for (let i = 0; i < n; i++) {
    const r = applyEvent(p, type, key?.(i))
    p = r.progress
    won.push(...r.won)
  }
  return { progress: p, won }
}

describe('applyEvent', () => {
  it('counts what happened', () => {
    const r = applyEvent(EMPTY_PROGRESS, 'kick')
    expect(r.progress.counts.kick).toBe(1)
    expect(applyEvent(r.progress, 'kick').progress.counts.kick).toBe(2)
  })

  it('does not change the progress it was given', () => {
    const before = JSON.stringify(EMPTY_PROGRESS)
    applyEvent(EMPTY_PROGRESS, 'talk', 'owl')
    expect(JSON.stringify(EMPTY_PROGRESS)).toBe(before)
  })

  it('wins a sticker when the count reaches what it asks for, not before', () => {
    const four = times(EMPTY_PROGRESS, 'kick', 4)
    expect(four.won).toEqual([])
    const five = applyEvent(four.progress, 'kick')
    expect(five.won).toEqual(['kicker'])
    expect(five.progress.got).toEqual(['kicker'])
  })

  it('wins the next one up the ladder later, and each only once', () => {
    const all = times(EMPTY_PROGRESS, 'kick', 40)
    expect(all.won).toEqual(['kicker', 'kickerPro'])
    expect(all.progress.got).toEqual(['kicker', 'kickerPro'])
  })

  it('can win two at once (the first thing she ever does can be both)', () => {
    const r = applyEvent(EMPTY_PROGRESS, 'talk', 'owl')
    expect(r.won).toEqual(['hello'])
    const jump = times(EMPTY_PROGRESS, 'stage', 5)
    expect(jump.won).toEqual(['firstStage', 'fiveStages'])
  })

  it('counts different things for the rules that ask for different ones: the same friend twice is one friend', () => {
    const ids = ['friendDay', 'friendDay', 'friendPlay', 'owl', 'readingUnicorn', 'koala']
    const r = times(EMPTY_PROGRESS, 'talk', ids.length, (i) => ids[i])
    expect(valueOf(r.progress, { type: 'talk', need: 6, distinct: true })).toBe(5)
    expect(r.won).toEqual(['hello'])
    const more = applyEvent(r.progress, 'talk', 'capybara')
    expect(more.won).toEqual(['chatterbox'])
  })

  it('counts every time for a rule that does not ask for different ones, even with a key', () => {
    const r = times(EMPTY_PROGRESS, 'book', 3, () => 'same')
    expect(valueOf(r.progress, { type: 'book', need: 3 })).toBe(3)
    expect(valueOf(r.progress, { type: 'book', need: 3, distinct: true })).toBe(1)
  })

  it('does not count different things when it is not told which', () => {
    const r = applyEvent(EMPTY_PROGRESS, 'talk')
    expect(valueOf(r.progress, { type: 'talk', need: 1, distinct: true })).toBe(0)
  })

  it('reading all five books wins the big bookworm, only if they are five different ones', () => {
    const same = times(EMPTY_PROGRESS, 'book', 5, () => '1')
    expect(same.progress.got).toEqual(['reader'])
    const five = times(EMPTY_PROGRESS, 'book', 5, (i) => String(i))
    expect(five.progress.got).toEqual(['reader', 'readerPro'])
  })

  it('twelve different dances win the dance star, and one dance the dancer', () => {
    const r = times(EMPTY_PROGRESS, 'move', 12, (i) => `unicorn:m${i}`)
    expect(r.won).toEqual(['dancer', 'danceStar'])
  })

  it('an event that no sticker asks about only counts', () => {
    const r = applyEvent({ ...EMPTY_PROGRESS, got: ['yard'] }, 'visitYard')
    expect(r.won).toEqual([])
    expect(r.progress.got).toEqual(['yard'])
  })

  it('a sticker already won is not won again', () => {
    const first = applyEvent(EMPTY_PROGRESS, 'globe')
    expect(applyEvent(first.progress, 'globe').won).toEqual([])
  })

  it('every play sticker can be won by doing what it says', () => {
    for (const s of PLAY_STICKERS) {
      const r = times(EMPTY_PROGRESS, s.rule.type, s.rule.need, (i) => `k${i}`)
      expect(r.progress.got, s.id).toContain(s.id)
    }
  })
})

describe('wonCount', () => {
  it('counts the stickers won, and none that are not there any more', () => {
    expect(wonCount(EMPTY_PROGRESS)).toBe(0)
    expect(wonCount({ ...EMPTY_PROGRESS, got: ['yard', 'library', 'gone'] })).toBe(2)
  })
})

describe('parseProgress', () => {
  const ok = { counts: { kick: 3 }, seen: { talk: ['owl'] }, got: ['yard'] }

  it('reads what applyEvent made', () => {
    const made = times(EMPTY_PROGRESS, 'talk', 2, (i) => ['owl', 'koala'][i]).progress
    expect(parseProgress(JSON.parse(JSON.stringify(made)))).toEqual(made)
  })

  it('reads good progress as it is', () => {
    expect(parseProgress(ok)).toEqual(ok)
  })

  it.each([null, undefined, 3, 'x', [], { counts: {}, seen: {} }, { counts: null, seen: {}, got: [] }, { counts: {}, seen: null, got: [] }, { counts: {}, seen: {}, got: 'yard' }])('is a fresh start for %j', (bad) => {
    expect(parseProgress(bad)).toBeNull()
  })

  it('drops what it does not understand and keeps the rest', () => {
    const p = parseProgress({
      counts: { kick: 3.9, hover: 2, bounce: -1, talk: 'many', slide: Infinity, swing: 2 },
      seen: { talk: ['owl', 7, 'koala'], nope: ['x'], book: 'nope' },
      got: ['yard', 'yard', 'gone', 5, 'library'],
    })
    expect(p).toEqual({ counts: { kick: 3, swing: 2 }, seen: { talk: ['owl', 'koala'] }, got: ['yard', 'library'] })
  })

  it('does not keep a huge list of what was seen', () => {
    const many = Array.from({ length: 500 }, (_, i) => `f${i}`)
    expect(parseProgress({ counts: {}, seen: { talk: many }, got: [] })!.seen.talk).toHaveLength(200)
  })
})
