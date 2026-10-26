import { describe, it, expect } from 'vitest'
import { ANIMAL_TYPES, FAIRY_STAGES, STAGE_ANIMALS, animalsFor, say, type AnimalSpec } from './animals'
import { LANGUAGES } from '../i18n/languages'

const all = STAGE_ANIMALS.flatMap((s) => s)

describe('animal data', () => {
  it('there is a set of animals for each of the 15 stages', () => {
    expect(STAGE_ANIMALS).toHaveLength(15)
  })

  it('every stage has two to four animals', () => {
    STAGE_ANIMALS.forEach((s, i) => {
      expect(s.length, `stage ${i + 1}`).toBeGreaterThanOrEqual(2)
      expect(s.length, `stage ${i + 1}`).toBeLessThanOrEqual(4)
    })
  })

  it('the fairy only comes to stages 1, 6, 9, 13 and 15', () => {
    STAGE_ANIMALS.forEach((s, i) => {
      const has = s.some((a) => a.type === 'fairy')
      expect(has, `stage ${i + 1}`).toBe(FAIRY_STAGES.includes(i + 1))
    })
    expect(FAIRY_STAGES).toEqual([1, 6, 9, 13, 15])
  })

  it('ids are unique across the whole game', () => {
    expect(new Set(all.map((a) => a.id)).size).toBe(all.length)
  })

  it('every animal is a known kind, and nearly all kinds are used', () => {
    for (const a of all) expect(ANIMAL_TYPES, a.id).toContain(a.type)
    const used = new Set(all.map((a) => a.type))
    expect(used.size).toBeGreaterThanOrEqual(22)
  })

  it('every line is said in every language of the game, and none is empty', () => {
    for (const a of all) {
      for (const line of a.lines) {
        for (const { code } of LANGUAGES) expect(line[code]?.trim().length, `${a.id} ${code}`).toBeGreaterThan(0)
      }
    }
  })

  it('every stage has at least one animal that speaks, and several lines overall', () => {
    STAGE_ANIMALS.forEach((s, i) => {
      expect(s.some((a) => a.lines.length > 0), `stage ${i + 1}`).toBe(true)
    })
    expect(all.filter((a) => a.lines.length > 0).length).toBeGreaterThanOrEqual(40)
  })

  it('places lie along the edge (t between 0 and 1) and heights are sensible', () => {
    for (const a of all) {
      for (const p of [a.at, a.to].filter((x): x is NonNullable<typeof x> => !!x)) {
        expect(p.t, a.id).toBeGreaterThanOrEqual(0)
        expect(p.t, a.id).toBeLessThanOrEqual(1)
        expect(p.y ?? 0, a.id).toBeGreaterThanOrEqual(0)
        expect(p.y ?? 0, a.id).toBeLessThanOrEqual(3.2)
      }
    }
  })

  it('walkers, flyers and swimmers have somewhere to go, the others stay put', () => {
    const MOVERS = new Set(['wander', 'fly', 'swim', 'crawl', 'slide'])
    for (const a of all) {
      if (MOVERS.has(a.behavior)) expect(a.to, a.id).toBeDefined()
    }
  })

  it('swingers hang from high up, flyers fly in the air, the rest of the air animals are floating ones', () => {
    for (const a of all) {
      if (a.behavior === 'swing') expect(a.at.y ?? 0, a.id).toBeGreaterThanOrEqual(2.5)
      if (a.behavior === 'fly' || a.behavior === 'swim') expect(a.at.y ?? 0, a.id).toBeGreaterThanOrEqual(1.8)
      if (a.behavior === 'spaceFloat') expect(a.at.y ?? 0, a.id).toBeGreaterThan(1)
    }
  })

  it('helmets are for the animals in space', () => {
    const helmeted = STAGE_ANIMALS.flatMap((s, i) => s.filter((a) => a.outfit === 'helmet').map(() => i + 1))
    for (const stage of helmeted) expect([3, 15]).toContain(stage)
    expect(helmeted.length).toBeGreaterThanOrEqual(4)
  })

  it('animalsFor gives the stage, and nothing for a stage that has none', () => {
    expect(animalsFor(0)).toBe(STAGE_ANIMALS[0])
    expect(animalsFor(99)).toEqual([])
    expect(animalsFor(-1)).toEqual([])
  })
})

describe('say', () => {
  const line = { de: 'Hallo', pt: 'Olá', en: 'Hello' }
  it('picks the language', () => {
    expect(say(line, 'de')).toBe('Hallo')
    expect(say(line, 'pt')).toBe('Olá')
    expect(say(line, 'en')).toBe('Hello')
  })
  it('falls back to German when a language is missing', () => {
    expect(say({ de: 'Hallo' } as AnimalSpec['lines'][number], 'en')).toBe('Hallo')
  })
})
