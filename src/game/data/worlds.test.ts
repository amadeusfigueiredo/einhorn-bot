import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { LANGUAGES } from '../i18n/languages'
import { CLASSROOMS } from './classrooms'
import { WORLD_IDS, WORLD_NAMES } from './worlds'

describe('worlds', () => {
  it('there are 15 of them, each with a name in every language', () => {
    expect(WORLD_IDS).toHaveLength(15)
    expect(new Set(WORLD_IDS).size).toBe(15)
    for (const id of WORLD_IDS) {
      for (const { code } of LANGUAGES) expect(WORLD_NAMES[id][code]?.trim().length, `${id} ${code}`).toBeGreaterThan(2)
    }
  })

  it('names are different in every world', () => {
    for (const { code } of LANGUAGES) {
      const names = WORLD_IDS.map((id) => WORLD_NAMES[id][code])
      expect(new Set(names).size, code).toBe(15)
    }
  })

  it('every stage is in its own world, in the order of the school', () => {
    const worlds = STAGES.map((s) => CLASSROOMS[s.name].world)
    expect(worlds).toEqual([...WORLD_IDS])
  })
})
