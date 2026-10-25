import { describe, expect, it } from 'vitest'
import { BOOKS } from '../data/hangouts'
import { BOOK_ART, PAGE_SIZE, PROP_KINDS } from './bookArt'

const HEX = /^#[0-9A-Fa-f]{6}$/

describe('the pictures of the books', () => {
  it('has three scenes for every book, and no scene for a book that is not there', () => {
    expect(Object.keys(BOOK_ART).map(Number).sort()).toEqual(BOOKS.map((b) => b.id))
    for (const b of BOOKS) expect(BOOK_ART[b.id], `book ${b.id}`).toHaveLength(3)
  })

  it('has real colours for the sky and the ground', () => {
    for (const [id, scenes] of Object.entries(BOOK_ART)) {
      scenes.forEach((s, i) => {
        expect(s.sky[0], `book ${id} page ${i}`).toMatch(HEX)
        expect(s.sky[1], `book ${id} page ${i}`).toMatch(HEX)
        if (s.ground) expect(s.ground.color).toMatch(HEX)
      })
    }
  })

  it('has a ground whose top is on the page', () => {
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) if (s.ground) expect(s.ground.y).toBeGreaterThan(80)
  })

  it('only draws kinds of things that can be drawn', () => {
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) for (const p of s.props) expect(PROP_KINDS).toContain(p.kind)
  })

  it('puts the middle of every thing on the page, with room round the edge', () => {
    for (const [id, scenes] of Object.entries(BOOK_ART)) {
      scenes.forEach((s, i) => {
        for (const p of s.props) {
          expect(p.x, `book ${id} page ${i} ${p.kind}`).toBeGreaterThanOrEqual(15)
          expect(p.x, `book ${id} page ${i} ${p.kind}`).toBeLessThanOrEqual(PAGE_SIZE - 15)
          expect(p.y, `book ${id} page ${i} ${p.kind}`).toBeGreaterThanOrEqual(15)
          expect(p.y, `book ${id} page ${i} ${p.kind}`).toBeLessThanOrEqual(PAGE_SIZE - 20)
        }
      })
    }
  })

  it('keeps every thing a sensible size', () => {
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) for (const p of s.props) expect(p.s ?? 1).toBeGreaterThanOrEqual(0.3)
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) for (const p of s.props) expect(p.s ?? 1).toBeLessThanOrEqual(1.3)
  })

  it('has no page that is empty, and at most a handful of things so a child can read it', () => {
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) {
      expect(s.props.length).toBeGreaterThanOrEqual(2)
      expect(s.props.length).toBeLessThanOrEqual(8)
    }
  })

  it('tells what the text tells: the koala is on the moon, the capybara in a bath with a parrot, the unicorn with a big ice cream, Amara looks at the stars, the garden has a doughnut tree', () => {
    const kinds = (book: number, page: number) => BOOK_ART[book][page].props.map((p) => p.kind)
    expect(kinds(0, 0)).toEqual(expect.arrayContaining(['koala', 'moon']))
    expect(kinds(1, 0)).toEqual(expect.arrayContaining(['capybara', 'bathtub']))
    expect(kinds(1, 1)).toContain('parrot')
    expect(kinds(2, 0)).toEqual(expect.arrayContaining(['unicorn', 'iceCream']))
    expect(kinds(2, 1)).toEqual(expect.arrayContaining(['unicorn', 'koala', 'bunny', 'iceCream']))
    expect(kinds(3, 0)).toEqual(expect.arrayContaining(['girl', 'star']))
    expect(kinds(3, 1)).toContain('faceStar')
    expect(kinds(3, 2)).toContain('shootingStar')
    expect(kinds(4, 2)).toContain('donutTree')
  })

  it('counts 1, 2, 3 under three stars on the second page of the koala', () => {
    const numbers = BOOK_ART[0][1].props.filter((p) => p.kind === 'number')
    expect(numbers.map((n) => n.text)).toEqual(['1', '2', '3'])
    const stars = BOOK_ART[0][1].props.filter((p) => p.kind === 'star')
    expect(stars).toHaveLength(3)
    numbers.forEach((n, i) => {
      expect(Math.abs(n.x - stars[i].x)).toBeLessThan(5)
      expect(n.y).toBeGreaterThan(stars[i].y + 20)
    })
  })

  it('shows the koala asleep on the last page and the capybara asleep on the last page of its book', () => {
    expect(BOOK_ART[0][2].props.find((p) => p.kind === 'koala')!.mood).toBe('asleep')
    expect(BOOK_ART[1][2].props.find((p) => p.kind === 'capybara')!.mood).toBe('asleep')
  })

  it('shows the five colours of the rainbow garden, one flower each, on its second page', () => {
    const flowers = BOOK_ART[4][1].props.filter((p) => p.kind === 'flower')
    expect(new Set(flowers.map((f) => f.color)).size).toBe(5)
  })

  it('does not put one thing exactly over another (the same kind at the same place)', () => {
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) {
      const seen = new Set(s.props.map((p) => `${p.kind}@${p.x},${p.y}`))
      expect(seen.size).toBe(s.props.length)
    }
  })
})
