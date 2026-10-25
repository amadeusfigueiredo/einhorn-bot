import { describe, it, expect } from 'vitest'
import de from '../../locales/de.json'
import pt from '../../locales/pt.json'
import en from '../../locales/en.json'
import { LANGUAGES } from './languages'

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }
const FILES: Record<string, Json> = { de: de as Json, pt: pt as Json, en: en as Json }

/** Every text in a file, by its dotted path ("hud.talkToMe", "greetings.Musik.0"). */
function flatten(value: Json, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }
  if (Array.isArray(value)) return Object.assign({}, ...value.map((v, i) => flatten(v, `${prefix}.${i}`)))
  if (value && typeof value === 'object') return Object.assign({}, ...Object.entries(value).map(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k)))
  return {}
}

const flat = Object.fromEntries(Object.entries(FILES).map(([lang, json]) => [lang, flatten(json)]))
const placeholders = (text: string) => [...text.matchAll(/\{[^}]*\}/g)].map((m) => m[0]).sort()

describe('locale files', () => {
  it('there is one file for every language of the game', () => {
    expect(Object.keys(FILES).sort()).toEqual(LANGUAGES.map((l) => l.code).sort())
  })

  it('every language has exactly the same texts as German', () => {
    const keys = Object.keys(flat.de).sort()
    for (const lang of ['pt', 'en']) {
      const other = Object.keys(flat[lang]).sort()
      expect(other.filter((k) => !keys.includes(k)), `${lang} has extra`).toEqual([])
      expect(keys.filter((k) => !other.includes(k)), `${lang} is missing`).toEqual([])
    }
  })

  it('no text is empty or a leftover note', () => {
    for (const [lang, texts] of Object.entries(flat)) {
      for (const [key, text] of Object.entries(texts)) {
        expect(text.trim().length, `${lang} ${key}`).toBeGreaterThan(0)
        expect(text, `${lang} ${key}`).not.toMatch(/\bTODO\b|FIXME|lorem ipsum|\bundefined\b|\[object/)
      }
    }
  })

  it('every {placeholder} is the same in every language, so a name or a number is never lost', () => {
    for (const key of Object.keys(flat.de)) {
      const want = placeholders(flat.de[key])
      for (const lang of ['pt', 'en']) expect(placeholders(flat[lang][key]), `${lang} ${key}`).toEqual(want)
    }
  })

  it('a language is not just a copy of German (the short words may match: names, "Name", "3D")', () => {
    for (const lang of ['pt', 'en']) {
      const same = Object.keys(flat.de).filter((k) => flat.de[k] === flat[lang][k] && flat.de[k].length > 14)
      expect(same.length / Object.keys(flat.de).length, `${lang} copies: ${same.slice(0, 3)}`).toBeLessThan(0.03)
    }
  })

  it('braces are balanced, so a template can never break the page', () => {
    for (const [lang, texts] of Object.entries(flat)) {
      for (const [key, text] of Object.entries(texts)) {
        const open = (text.match(/\{/g) ?? []).length
        const close = (text.match(/\}/g) ?? []).length
        expect(open, `${lang} ${key}`).toBe(close)
      }
    }
  })

  it('nothing in the files can inject markup (the game shows these as text)', () => {
    for (const [lang, texts] of Object.entries(flat)) {
      for (const [key, text] of Object.entries(texts)) expect(text, `${lang} ${key}`).not.toMatch(/<script|<iframe|javascript:|onerror=/i)
    }
  })

  it('the new redesign texts exist everywhere: HUD, intro, transition, feedback, album', () => {
    for (const key of ['hud.talkToMe', 'hud.menu', 'hud.progress', 'hud.stars', 'intro.skip', 'intro.label', 'film.skip', 'film.bye', 'film.knock', 'film.comeIn', 'film.done', 'transition.dingDong', 'feedback.answerIs', 'feedback.again', 'feedback.stageDone', 'feedback.nextClass', 'ending.album', 'album.title', 'album.close', 'album.count', 'mascot.label']) {
      for (const lang of Object.keys(flat)) expect(flat[lang][key], `${lang} ${key}`).toBeTruthy()
    }
  })

  it('short texts stay short for an early reader', () => {
    for (const lang of Object.keys(flat)) {
      for (const key of ['hud.talkToMe', 'feedback.again', 'feedback.nextClass', 'intro.skip', 'hud.menu']) expect(flat[lang][key].length, `${lang} ${key}`).toBeLessThan(30)
    }
  })

  it('there are more than 400 texts, in each language', () => {
    for (const lang of Object.keys(flat)) expect(Object.keys(flat[lang]).length).toBeGreaterThan(400)
  })
})
