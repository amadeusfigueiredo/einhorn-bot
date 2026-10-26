import { describe, expect, it } from 'vitest'
import { translate } from '../../i18n/translate'
import { AREAS } from '../placeLayout'
import { ARCH_X, SPORT_KEYS, SPORTS } from './sportsData'

describe('the four sports of the sports hall', () => {
  it('are a pony yard, a pool, a dojo and a dance hall, each with its own colour', () => {
    expect(SPORTS.map((s) => s.id)).toEqual(['pony', 'pool', 'dojo', 'dance'])
    expect(new Set(SPORTS.map((s) => s.color)).size).toBe(4)
  })
  it('have a name in every language', () => {
    for (const lang of ['en', 'de', 'pt'] as const) for (const key of SPORT_KEYS) expect(translate(lang, key)).not.toBe(key)
    expect(SPORT_KEYS.map((k) => translate('de', k))).toEqual(['Ponyhof', 'Schwimmbad', 'Dojo', 'Tanzsaal'])
  })
  it('have an archway each inside the hall, in order and not touching, right of the door to the corridor', () => {
    expect(ARCH_X).toHaveLength(SPORTS.length)
    for (let i = 1; i < ARCH_X.length; i++) expect(ARCH_X[i] - ARCH_X[i - 1]).toBeGreaterThan(2.5)
    expect(Math.abs(ARCH_X[3])).toBeLessThan(AREAS.sports.halfW)
    expect(ARCH_X[0]).toBeGreaterThan(-7.6 + 1.5)
  })
})
