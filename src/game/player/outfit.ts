import { SWEATER_IDS, type SweaterId } from '../views/three/amara/amaraLook'
import type { Accessory, HornType, UnicornLook } from '../data/unicornLooks'

/**
 * What the child has chosen to wear, for the unicorn (a coat, a horn, one thing on it) and for Amara (a sweater). The
 * default is exactly what the game always had, so nothing changes until a child opens the wardrobe. Pure data and
 * functions; the choice is kept by `outfitSettings.ts` and chosen in the wardrobe (`ui/Wardrobe.tsx`).
 */
export type CoatId = 'white' | 'pink' | 'mint' | 'lilac' | 'sun' | 'sky'
export type TrimId = 'gold' | 'rose' | 'mint' | 'sky' | 'violet' | 'white'
export type Wearable = Exclude<Accessory, 'teacher' | 'backpack'>

export type Outfit = {
  sweater: SweaterId
  coat: CoatId
  horn: HornType
  accessory: Wearable
  trim: TrimId
}

export const COATS: Record<CoatId, string> = {
  white: '#ffffff',
  pink: '#FFD9EC',
  mint: '#D9FFF0',
  lilac: '#EADFFF',
  sun: '#FFF3C4',
  sky: '#D9EEFF',
}
export const TRIMS: Record<TrimId, string> = {
  gold: '#ffd166',
  rose: '#FF7EB6',
  mint: '#3FC9A6',
  sky: '#6FA8FF',
  violet: '#8E6BE0',
  white: '#FFFFFF',
}
export const COAT_IDS = Object.keys(COATS) as CoatId[]
export const TRIM_IDS = Object.keys(TRIMS) as TrimId[]
export const HORNS: readonly HornType[] = ['straight', 'curly', 'rainbow', 'curved', 'star']
/** What can be worn on the head or round the neck, with a picture for the button. */
export const WEARABLES: readonly { id: Wearable; icon: string }[] = [
  { id: 'none', icon: '🚫' },
  { id: 'bow', icon: '🎀' },
  { id: 'flowers', icon: '🌸' },
  { id: 'crown', icon: '👑' },
  { id: 'glasses', icon: '👓' },
  { id: 'sunglasses', icon: '🕶️' },
  { id: 'scarf', icon: '🧣' },
  { id: 'headphones', icon: '🎧' },
  { id: 'pearls', icon: '📿' },
  { id: 'helmet', icon: '⛑️' },
]

/** What the game always had: a white unicorn with a plain horn, nothing on it, and Amara in her rainbow sweater. */
export const DEFAULT_OUTFIT: Outfit = { sweater: 'rainbow', coat: 'white', horn: 'straight', accessory: 'none', trim: 'gold' }

const oneOf = <T extends string>(options: readonly T[], value: unknown): T | null => (typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : null)

/** What was saved, if it is what we saved; a field that is not one of the choices is the default's (so a choice taken out later does no harm). */
export function parseOutfit(value: unknown): Outfit | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  return {
    sweater: oneOf(SWEATER_IDS, raw.sweater) ?? DEFAULT_OUTFIT.sweater,
    coat: oneOf(COAT_IDS, raw.coat) ?? DEFAULT_OUTFIT.coat,
    horn: oneOf(HORNS, raw.horn) ?? DEFAULT_OUTFIT.horn,
    accessory: oneOf(
      WEARABLES.map((w) => w.id),
      raw.accessory
    ) ?? DEFAULT_OUTFIT.accessory,
    trim: oneOf(TRIM_IDS, raw.trim) ?? DEFAULT_OUTFIT.trim,
  }
}

/** Is this the outfit the game always had? */
export function isDefault(outfit: Outfit): boolean {
  return (Object.keys(DEFAULT_OUTFIT) as (keyof Outfit)[]).every((k) => outfit[k] === DEFAULT_OUTFIT[k])
}

/** The unicorn's look with the chosen coat, horn and accessory (the rainbow rings, the mane, the backpack and whatever the class adds stay). The same look back when nothing is changed. */
export function applyOutfit(look: UnicornLook, outfit: Outfit): UnicornLook {
  if (isDefault(outfit)) return look
  return { ...look, coat: COATS[outfit.coat], hornType: outfit.horn, accessory: outfit.accessory, accessoryColor: TRIMS[outfit.trim] }
}
