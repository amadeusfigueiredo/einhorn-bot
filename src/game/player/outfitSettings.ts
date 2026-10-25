import { useMemo } from 'react'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { PLAYER_LOOK, type UnicornLook } from '../data/unicornLooks'
import { DEFAULT_OUTFIT, applyOutfit, parseOutfit, type Outfit } from './outfit'

export const OUTFIT_STORAGE_KEY = 'amaras-unicorn-dream-school:outfit:v1'

type MiniStorage = Pick<Storage, 'getItem' | 'setItem'>

export type OutfitSettings = Outfit & {
  /** Change some of the choices. */
  choose: (change: Partial<Outfit>) => void
  /** Back to what the game always had. */
  reset: () => void
}

function read(storage: MiniStorage | null): Outfit {
  try {
    const raw = storage?.getItem(OUTFIT_STORAGE_KEY)
    return (raw ? parseOutfit(JSON.parse(raw)) : null) ?? DEFAULT_OUTFIT
  } catch {
    return DEFAULT_OUTFIT
  }
}

/** What she wears is remembered, like her hero and her name. */
export function createOutfitSettings(storage: MiniStorage | null) {
  return createStore<OutfitSettings>((set, get) => {
    const keep = (next: Outfit) => {
      set(next)
      try {
        storage?.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Remembering is a nicety; the choice still works without it.
      }
    }
    const current = (): Outfit => {
      const { sweater, coat, horn, accessory, trim } = get()
      return { sweater, coat, horn, accessory, trim }
    }
    return {
      ...read(storage),
      choose: (change) => keep({ ...current(), ...change }),
      reset: () => keep(DEFAULT_OUTFIT),
    }
  })
}

export const outfitSettings = createOutfitSettings(typeof window === 'undefined' ? null : window.localStorage)

/** What she wears now (the parts of the store that are choices). */
export function useOutfit(): Outfit {
  const sweater = useStore(outfitSettings, (s) => s.sweater)
  const coat = useStore(outfitSettings, (s) => s.coat)
  const horn = useStore(outfitSettings, (s) => s.horn)
  const accessory = useStore(outfitSettings, (s) => s.accessory)
  const trim = useStore(outfitSettings, (s) => s.trim)
  return useMemo(() => ({ sweater, coat, horn, accessory, trim }), [sweater, coat, horn, accessory, trim])
}

/** Amara's unicorn as the child has dressed it, with no class gear (for the films that are not in a class). */
export function useOutfitLook(): UnicornLook {
  const outfit = useOutfit()
  return useMemo(() => applyOutfit(PLAYER_LOOK, outfit), [outfit])
}

