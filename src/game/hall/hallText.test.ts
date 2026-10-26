import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '../i18n/languages'
import { WORLD_IDS, WORLD_NAMES } from '../data/worlds'
import { LOCALES } from '../i18n/translate'
import { CLASS_COUNT, HALL_SECTIONS } from './hallLayout'
import { bannerText, className, doorSignText, saidInAll } from './hallText'

describe('the texts of the corridor', () => {
  it('names each class by its room, in each language', () => {
    for (let i = 0; i < CLASS_COUNT; i++) for (const l of LANGUAGES) expect(className(l.code, i)).toBe(WORLD_NAMES[WORLD_IDS[i]][l.code])
    expect(className('en', 0)).toBe('Candy Classroom')
    expect(className('de', 2)).toBe('Mondklasse')
    expect(className('pt', 14)).toBe(WORLD_NAMES.saturn.pt)
  })

  it('writes the sign of a door as "number · name", counting from 1', () => {
    expect(doorSignText('en', 0)).toBe('1 · Candy Classroom')
    expect(doorSignText('de', 14)).toBe(`15 · ${WORLD_NAMES.saturn.de}`)
    expect(doorSignText('pt', 2)).toBe('3 · Aula na lua')
  })

  it('writes the banner of a subject block with the numbers of its classes', () => {
    expect(bannerText('en', 0)).toBe('Maths · 1–3')
    expect(bannerText('en', 4)).toMatch(/· 13–15$/)
    for (let i = 0; i < HALL_SECTIONS.length; i++) for (const l of LANGUAGES) expect(bannerText(l.code, i)).toMatch(new RegExp(`· ${HALL_SECTIONS[i].classes[0] + 1}–${HALL_SECTIONS[i].classes[2] + 1}$`))
  })

  it('has the same texts in all three languages: every key of the corridor exists in each, with the same places to fill', () => {
    const keys = Object.keys(LOCALES.de.hall).sort()
    for (const l of LANGUAGES) expect(Object.keys(LOCALES[l.code].hall).sort(), l.code).toEqual(keys)
    for (const key of keys) {
      const slots = (v: unknown) => (typeof v === 'string' ? (v.match(/\{[^}]+\}/g) ?? []).sort().join(',') : '')
      const reference = slots((LOCALES.en.hall as Record<string, unknown>)[key])
      for (const l of LANGUAGES) expect(slots((LOCALES[l.code].hall as Record<string, unknown>)[key]), `${l.code} ${key}`).toBe(reference)
    }
  })

  it('says a line in all three languages at once, for what a thing says out loud', () => {
    const line = saidInAll('hall.doorSign', { n: 4, name: 'x' })
    expect(line).toEqual({ de: '4 · x', pt: '4 · x', en: '4 · x' })
    expect(Object.keys(saidInAll('hall.exitDoor')).sort()).toEqual(['de', 'en', 'pt'])
  })
})
