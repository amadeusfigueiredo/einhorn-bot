import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { CLASSROOMS } from './classrooms'
import { collected, stickerFor, STICKERS } from './stickers'
import { WORLD_IDS } from './worlds'

describe('stickers', () => {
  it('there is one sticker for each of the 15 stages, all different', () => {
    expect(STICKERS).toHaveLength(15)
    expect(new Set(STICKERS.map((s) => s.emoji)).size).toBe(15)
    for (const s of STICKERS) expect(s.emoji.length).toBeGreaterThan(0)
  })

  it('each sticker is the world of its stage', () => {
    STAGES.forEach((stage, i) => expect(STICKERS[i].world).toBe(CLASSROOMS[stage.name].world))
    expect(STICKERS.map((s) => s.world)).toEqual([...WORLD_IDS])
  })

  it('stickerFor gives the sticker of a stage, and none beyond the school', () => {
    expect(stickerFor(0)).toBe(STICKERS[0])
    expect(stickerFor(14)).toBe(STICKERS[14])
    expect(stickerFor(15)).toBeNull()
    expect(stickerFor(-1)).toBeNull()
  })

  it('collected gives the first stickers, never more than there are', () => {
    expect(collected(0)).toEqual([])
    expect(collected(3)).toEqual(STICKERS.slice(0, 3))
    expect(collected(15)).toHaveLength(15)
    expect(collected(99)).toHaveLength(15)
    expect(collected(-4)).toEqual([])
  })
})
