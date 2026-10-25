import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

/** Who the child plays: Amara (her rainbow unicorn walks beside her) or the unicorn (Amara walks beside it). */
export type Hero = 'amara' | 'unicorn'

export const HERO_STORAGE_KEY = 'amaras-unicorn-dream-school:hero:v1'
export const DEFAULT_HERO: Hero = 'amara'

export function parseHero(value: string | null | undefined): Hero | null {
  const v = value?.toLowerCase()
  return v === 'amara' || v === 'unicorn' ? v : null
}

type HeroSettings = {
  hero: Hero
  setHero: (hero: Hero) => void
  toggleHero: () => void
}

type MiniStorage = Pick<Storage, 'getItem' | 'setItem'>

function readHero(storage: MiniStorage | null): Hero | null {
  try {
    return parseHero(storage?.getItem(HERO_STORAGE_KEY))
  } catch {
    return null
  }
}

/** The friend who is not played. */
export function companionOf(hero: Hero): Hero {
  return hero === 'amara' ? 'unicorn' : 'amara'
}

/**
 * Priority: `?hero=` in the address (for testing and links), then the saved choice, then Amara.
 * Only a choice made in the game is saved, not the address.
 */
export function createHeroSettings(storage: MiniStorage | null, search = '') {
  return createStore<HeroSettings>((set, get) => {
    const write = (hero: Hero) => {
      set({ hero })
      try {
        storage?.setItem(HERO_STORAGE_KEY, hero)
      } catch {
        // Persistence is a nicety; the choice still works without it.
      }
    }
    return {
      hero: parseHero(new URLSearchParams(search).get('hero')) ?? readHero(storage) ?? DEFAULT_HERO,
      setHero: write,
      toggleHero: () => write(companionOf(get().hero)),
    }
  })
}

export const heroSettings =
  typeof window === 'undefined' ? createHeroSettings(null) : createHeroSettings(window.localStorage, window.location.search)

export function useHero(): Hero {
  return useStore(heroSettings, (s) => s.hero)
}
