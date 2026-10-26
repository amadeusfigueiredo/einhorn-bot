import { describe, expect, it } from 'vitest'
import { drawFrom, newBagOf } from './moveBag'

const IDS = ['a', 'b', 'c', 'd'] as const

describe('a bag of moves', () => {
  it('starts full with nothing done last', () => {
    expect(newBagOf(IDS)).toEqual({ left: IDS, last: null })
  })

  it('draws the one the random number points at and takes it out of the bag', () => {
    const draw = drawFrom(IDS, newBagOf(IDS), () => 0.5)
    expect(draw.id).toBe('c')
    expect(draw.bag).toEqual({ left: ['a', 'b', 'd'], last: 'c' })
  })

  it('never reads past the end when the random number is 1', () => {
    expect(drawFrom(IDS, newBagOf(IDS), () => 1).id).toBe('d')
  })

  it('does every move once, then fills up again', () => {
    let bag = newBagOf(IDS)
    const round: string[] = []
    for (let i = 0; i < IDS.length; i++) {
      const draw = drawFrom(IDS, bag, () => 0)
      round.push(draw.id)
      bag = draw.bag
    }
    expect([...round].sort()).toEqual([...IDS])
    expect(drawFrom(IDS, bag, () => 0).id).toBeDefined()
  })

  it('does not begin a new round with the move that ended the last one', () => {
    for (let r = 0; r < 4; r++) {
      const random = () => r / 4
      const draw = drawFrom(IDS, { left: [], last: 'b' }, random)
      expect(draw.id).not.toBe('b')
      // The one set aside is back in the bag for the round after.
      expect(draw.bag.left).toContain('b')
    }
  })

  it('fills the bag from the full list when it is empty and nothing was done last', () => {
    const draw = drawFrom(IDS, { left: [], last: null }, () => 0)
    expect(draw.id).toBe('a')
    expect(draw.bag.left).toEqual(['b', 'c', 'd'])
  })
})
