import { afterEach, describe, it, expect, vi } from 'vitest'
import { STAGES } from '../constants/stages'
import { LANGUAGES } from './languages'
import { LOCALES, translate, translateList, questionText } from './translate'

type Tree = { [k: string]: unknown }

/** Every leaf as `dotted.id -> value` (strings and string lists). */
function leaves(tree: Tree, prefix = ''): Map<string, string | readonly string[]> {
  const out = new Map<string, string | readonly string[]>()
  for (const [k, v] of Object.entries(tree)) {
    const id = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string' || Array.isArray(v)) out.set(id, v as string | string[])
    else for (const [kk, vv] of leaves(v as Tree, id)) out.set(kk, vv)
  }
  return out
}

/** `{n}`, `{name}` and the optional `{, name}` all count by their name. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(?:, )?(\w+)\}/g)].map((m) => m[1]).sort()
}

const source = leaves(LOCALES.de as Tree)
const allQuestions = STAGES.flatMap((s) => (s.npcs ?? []).map((n) => n.question))

describe('locale files', () => {
  it('every language has exactly the ids of de.json', () => {
    for (const { code } of LANGUAGES) {
      expect([...leaves(LOCALES[code] as Tree).keys()].sort()).toEqual([...source.keys()].sort())
    }
  })

  it('every message keeps the same placeholders', () => {
    for (const { code } of LANGUAGES) {
      const other = leaves(LOCALES[code] as Tree)
      for (const [id, de] of source) {
        const a = [de].flat().map(placeholders)
        const b = [other.get(id)!].flat().map(placeholders)
        // Lists: every line of every language uses the same set (lines vary).
        expect(new Set(b.flat()), `${code} ${id}`).toEqual(new Set(a.flat()))
      }
    }
  })

  it('lists have the same length in every language', () => {
    for (const { code } of LANGUAGES) {
      const other = leaves(LOCALES[code] as Tree)
      for (const [id, de] of source) {
        if (Array.isArray(de)) expect((other.get(id) as readonly string[]).length, `${code} ${id}`).toBe(de.length)
      }
    }
  })

  it('every question in stageSpecs has text and the same number of choices in every language', () => {
    for (const { code } of LANGUAGES) {
      for (const q of allQuestions) {
        const t = questionText(code, q.id)
        expect(t, `${code} ${q.id}`).not.toBeNull()
        expect(t!.prompt.length).toBeGreaterThan(5)
        expect(t!.choices).toHaveLength(4)
        expect(q.correctIndex).toBeLessThan(t!.choices.length)
      }
    }
  })
})

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'stage.of', { n: 3, total: 15 })).toBe('Stage 3 of 15')
    expect(translate('de', 'progress.extra', { answered: 2, required: 4, total: 5 })).toBe('2 von 4 (5)')
    expect(translate('pt', 'nameButton.labelNamed', { name: 'Amara' })).toBe('Mudar o nome: agora Amara')
  })

  it('returns lists', () => {
    expect(translateList('pt', 'greetings.Mathematik').length).toBeGreaterThan(0)
    expect(translateList('en', 'feedback.winLines')[0]).toBe('You did really well.')
  })

  it('an unknown question id has no text', () => {
    expect(questionText('de', 'nope')).toBeNull()
  })
})

describe('translate: what is not there', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('leaves a placeholder alone when it is not given a value, and fills the ones it has', () => {
    expect(translate('en', 'stage.of', { n: 3 })).toBe('Stage 3 of {total}')
    expect(translate('en', 'stage.of', {})).toBe('Stage {n} of {total}')
  })

  it('a missing id is an error while developing, so a typo shows at once', () => {
    expect(() => translate('en', 'no.such.id' as never)).toThrow('Missing translation: no.such.id')
    expect(() => translateList('en', 'no.such.list' as never)).toThrow('Missing translation: no.such.list')
  })

  it('a text asked for as a list, or a list asked for as a text, is missing too', () => {
    expect(() => translate('en', 'greetings.Mathematik' as never)).toThrow('Missing translation')
    expect(() => translateList('en', 'stage.of' as never)).toThrow('Missing translation')
  })

  it('in the shipped game a missing id shows as the id itself instead of breaking the screen', () => {
    vi.stubEnv('DEV', false)
    expect(translate('en', 'no.such.id' as never)).toBe('no.such.id')
    expect(translateList('en', 'no.such.list' as never)).toEqual(['no.such.list'])
  })
})
