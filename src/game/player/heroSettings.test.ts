import { describe, expect, it } from 'vitest'
import { companionOf, createHeroSettings, DEFAULT_HERO, HERO_STORAGE_KEY, parseHero } from './heroSettings'

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) }
}

describe('parseHero', () => {
  it('knows Amara and the unicorn, in any case, and nothing else', () => {
    expect(parseHero('amara')).toBe('amara')
    expect(parseHero('UNICORN')).toBe('unicorn')
    for (const v of ['', 'Amara2', 'horse', null, undefined]) expect(parseHero(v)).toBeNull()
  })
})

describe('companionOf', () => {
  it('is the other one', () => {
    expect(companionOf('amara')).toBe('unicorn')
    expect(companionOf('unicorn')).toBe('amara')
  })
})

describe('hero settings', () => {
  it('a new player plays Amara', () => {
    expect(DEFAULT_HERO).toBe('amara')
    expect(createHeroSettings(fakeStorage()).getState().hero).toBe('amara')
  })

  it('remembers the choice for the next visit', () => {
    const storage = fakeStorage()
    createHeroSettings(storage).getState().setHero('unicorn')
    expect(storage.data[HERO_STORAGE_KEY]).toBe('unicorn')
    expect(createHeroSettings(storage).getState().hero).toBe('unicorn')
  })

  it('toggling switches to the other one each time', () => {
    const s = createHeroSettings(fakeStorage())
    s.getState().toggleHero()
    expect(s.getState().hero).toBe('unicorn')
    s.getState().toggleHero()
    expect(s.getState().hero).toBe('amara')
  })

  it('the address wins over what was saved (for links and testing), but is not itself saved', () => {
    const storage = fakeStorage({ [HERO_STORAGE_KEY]: 'amara' })
    const s = createHeroSettings(storage, '?view=3d&hero=unicorn')
    expect(s.getState().hero).toBe('unicorn')
    expect(storage.data[HERO_STORAGE_KEY]).toBe('amara')
  })

  it('a nonsense address or a nonsense saved value falls back to the next best', () => {
    expect(createHeroSettings(fakeStorage({ [HERO_STORAGE_KEY]: 'unicorn' }), '?hero=cat').getState().hero).toBe('unicorn')
    expect(createHeroSettings(fakeStorage({ [HERO_STORAGE_KEY]: 'horse' })).getState().hero).toBe('amara')
  })

  it('still works when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const s = createHeroSettings(broken)
    expect(s.getState().hero).toBe('amara')
    s.getState().setHero('unicorn')
    expect(s.getState().hero).toBe('unicorn')
  })

  it('works without any storage', () => {
    const s = createHeroSettings(null)
    s.getState().toggleHero()
    expect(s.getState().hero).toBe('unicorn')
  })
})
