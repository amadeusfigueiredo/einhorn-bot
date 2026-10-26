import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { STICKERS } from '../data/stickers'
import { questionIds } from '../logic/classProgress'
import { WORLD_NAMES } from '../data/worlds'
import { PLAY_STICKERS } from './stickerData'
import { EMPTY_PROGRESS } from './stickerModel'
import { TOTAL_STICKERS, albumCount, earnedStickers, playStickers, schoolStickers } from './albumModel'

/** The first `n` classes are finished. */
const first = (n: number) => new Set(STAGES.slice(0, n).flatMap(questionIds))
const progress = (got: string[], counts: Record<string, number> = {}) => ({ ...EMPTY_PROGRESS, got, counts: counts as never })

describe('the album: every sticker there is', () => {
  it('has the sticker of each of the 15 classes and every play sticker, and no two are the same', () => {
    expect(TOTAL_STICKERS).toBe(STICKERS.length + PLAY_STICKERS.length)
    const all = [...schoolStickers(first(0)), ...playStickers(EMPTY_PROGRESS)]
    expect(all).toHaveLength(TOTAL_STICKERS)
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length)
  })

  it('a class sticker is won when its class is finished, in any order: finishing class 5 alone wins the fifth one only', () => {
    const only = new Set(questionIds(STAGES[4]))
    expect(schoolStickers(only).map((x) => x.got)).toEqual(STAGES.map((_, i) => i === 4))
    expect(schoolStickers(only)[4]).toMatchObject({ kind: 'school', where: 'class', classIndex: 4 })
  })

  it('the class stickers are won in class order, one for every class she has finished', () => {
    for (const n of [0, 1, 7, 15]) {
      const got = schoolStickers(first(n)).map((s) => s.got)
      expect(got.filter(Boolean)).toHaveLength(n)
      expect(got.slice(0, n).every(Boolean)).toBe(true)
    }
    expect(schoolStickers(first(1))[0]).toMatchObject({ id: STICKERS[0].world, name: WORLD_NAMES[STICKERS[0].world], kind: 'school' })
    expect(schoolStickers(first(1))[0].how).toBeUndefined()
  })

  it('a play sticker is won when its id is in the won list, and says how to win it and how far she is', () => {
    const kicker = PLAY_STICKERS.find((s) => s.id === 'kicker')!
    const none = playStickers(EMPTY_PROGRESS).find((s) => s.id === 'kicker')!
    expect(none).toMatchObject({ got: false, kind: 'play', how: kicker.how, have: 0, need: kicker.rule.need })
    const part = playStickers(progress([], { kick: 3 })).find((s) => s.id === 'kicker')!
    expect(part).toMatchObject({ got: false, have: 3 })
    const done = playStickers(progress(['kicker'], { kick: 99 })).find((s) => s.id === 'kicker')!
    expect(done).toMatchObject({ got: true, have: kicker.rule.need })
  })

  it('a play sticker says where it is to be found', () => {
    const byId = (id: string) => playStickers(EMPTY_PROGRESS).find((s) => s.id === id)!
    expect(byId('kicker').where).toBe('yard')
    expect(byId('reader').where).toBe('library')
    expect(byId('thinker').where).toBe('class')
    expect(byId('dancer').where).toBe('anywhere')
  })

  it('counts what she has won out of everything', () => {
    expect(albumCount(first(0), EMPTY_PROGRESS)).toEqual({ got: 0, total: TOTAL_STICKERS })
    expect(albumCount(first(3), progress(['kicker', 'yard']))).toEqual({ got: 5, total: TOTAL_STICKERS })
    expect(albumCount(first(15), progress(PLAY_STICKERS.map((s) => s.id)))).toEqual({ got: TOTAL_STICKERS, total: TOTAL_STICKERS })
  })

  it('the earned ones are the classes first, then the play ones in the order of the book, and only the ones she has', () => {
    const earned = earnedStickers(first(2), progress(['library', 'yard']))
    expect(earned.map((s) => s.id)).toEqual([STICKERS[0].world, STICKERS[1].world, ...PLAY_STICKERS.filter((s) => ['yard', 'library'].includes(s.id)).map((s) => s.id)])
    expect(earnedStickers(first(0), EMPTY_PROGRESS)).toEqual([])
    expect(earnedStickers(first(15), progress(PLAY_STICKERS.map((s) => s.id)))).toHaveLength(TOTAL_STICKERS)
  })
})
