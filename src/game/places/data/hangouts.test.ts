import { describe, expect, it } from 'vitest'
import { LANGUAGES, type Localized } from '../../i18n/languages'
import { BOOKS, FRIEND_DAY, FRIEND_PLAY, LIBRARY_THINGS, OWL_LIBRARIAN, READING_UNICORN, YARD_THINGS, type Dialog } from './hangouts'

const CODES = LANGUAGES.map((l) => l.code)
const DIALOGS: Record<string, Dialog> = { FRIEND_DAY, FRIEND_PLAY, OWL_LIBRARIAN, READING_UNICORN }

/** Every language has a real text, and a sentence is not just the German one copied (a short word may be the same in two languages: Okay, Koala). */
function expectTranslated(text: Localized, what: string) {
  for (const code of CODES) {
    expect(text[code]?.trim().length, `${what} (${code})`).toBeGreaterThan(0)
  }
  if (text.de.length > 14) expect(text.en, `${what}: English differs from German`).not.toBe(text.de)
}

describe.each(Object.entries(DIALOGS))('the talk %s', (name, dialog) => {
  it('starts at "start" and every option leads somewhere that exists', () => {
    expect(dialog.start).toBeDefined()
    for (const [id, node] of Object.entries(dialog)) {
      expect(node.options.length, `${name}.${id}`).toBeGreaterThan(0)
      for (const o of node.options) if (o.next) expect(dialog[o.next], `${name}.${id} -> ${o.next}`).toBeDefined()
    }
  })

  it('has no node that cannot be reached, and every path ends', () => {
    const seen = new Set<string>()
    const walk = (id: string, trail: string[]) => {
      expect(trail, `${name}: a loop at ${id}`).not.toContain(id)
      seen.add(id)
      for (const o of dialog[id].options) if (o.next) walk(o.next, [...trail, id])
    }
    walk('start', [])
    expect([...seen].sort()).toEqual(Object.keys(dialog).sort())
  })

  it('is said in every language, with the same {name} in each', () => {
    for (const [id, node] of Object.entries(dialog)) {
      expectTranslated(node.text, `${name}.${id}`)
      const hasName = CODES.map((c) => node.text[c].includes('{name}'))
      expect(new Set(hasName).size, `${name}.${id}: {name} in some languages only`).toBe(1)
      node.options.forEach((o, i) => expectTranslated(o.label, `${name}.${id}.option${i}`))
    }
  })

  it('points to a book that is there when it glows one', () => {
    for (const node of Object.values(dialog)) {
      for (const o of node.options) {
        if (o.book !== undefined) expect(BOOKS.some((b) => b.id === o.book)).toBe(true)
        if (o.effect === 'highlightBook' && o.book !== undefined) expect(o.book).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('the things of the yard and the library', () => {
  it.each([
    ['yard', YARD_THINGS],
    ['library', LIBRARY_THINGS],
  ] as const)('the %s: each has a name in every language, and a line or a talk (or is the books)', (_place, things) => {
    const ids = things.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const thing of things) {
      expectTranslated(thing.label, thing.id)
      if (thing.say) expectTranslated(thing.say, `${thing.id}.say`)
      expect(Boolean(thing.say) || Boolean(thing.dialog) || thing.id === 'books', thing.id).toBe(true)
      expect(thing.say && thing.dialog, `${thing.id}: both a line and a talk`).toBeFalsy()
    }
  })

  it('the yard has the swing, the slide, two friends and the two animals, as the design says', () => {
    expect(YARD_THINGS.map((t) => t.id)).toEqual(['swing', 'slide', 'friendDay', 'friendPlay', 'koala', 'capybara'])
  })

  it('the library has the books, the owl, the reading unicorn, the globe, the star lamp and the aquarium', () => {
    expect(LIBRARY_THINGS.map((t) => t.id)).toEqual(['books', 'owl', 'readingUnicorn', 'globe', 'starLamp', 'aquarium'])
  })
})

describe('the books', () => {
  it('are five, each with three pages and a title in every language', () => {
    expect(BOOKS).toHaveLength(5)
    expect(BOOKS.map((b) => b.id)).toEqual([0, 1, 2, 3, 4])
    for (const b of BOOKS) {
      expect(b.pages).toHaveLength(3)
      expect(b.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expectTranslated(b.title, `book ${b.id}`)
      b.pages.forEach((p, i) => expectTranslated(p, `book ${b.id} page ${i}`))
    }
  })

  it('have different colours, so they can be told apart on the shelf', () => {
    expect(new Set(BOOKS.map((b) => b.color)).size).toBe(BOOKS.length)
  })
})
