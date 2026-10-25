// How every unicorn looks and behaves while it waits. Pure data: the 3D view
// reads these, nothing else decides who gets which hat.

export type Accessory =
  | 'none'
  | 'bow'
  | 'glasses'
  | 'flowers'
  | 'crown'
  | 'scarf'
  | 'teacher'
  | 'sunglasses'
  | 'helmet'
  | 'pearls'
  | 'headphones'
  | 'backpack'

/** The five horns: a plain cone, a corkscrew, four colour bands, a crescent, a short horn with a star on top. */
export type HornType = 'straight' | 'curly' | 'rainbow' | 'curved' | 'star'

/** One more thing a unicorn wears, on top of its main `accessory`. */
export type WornAccessory = { type: Exclude<Accessory, 'none'>; color: string }

/** How a unicorn passes the time while the player is busy elsewhere. */
export type Personality = 'bouncy' | 'sleepy' | 'curious' | 'proud'

export type UnicornLook = {
  coat: string
  /** Mane and tail stripes, front to back. */
  mane: readonly string[]
  horn: string
  hooves: readonly string[]
  /** Coloured rings around the body (the player's rainbow). */
  stripes?: readonly string[]
  accessory: Accessory
  accessoryColor: string
  personality: Personality
  /** Body size relative to the others (1 = normal). */
  build: number
  /** Horn length relative to normal. */
  hornLength: number
  /** Which horn (a plain cone when missing). */
  hornType?: HornType
  /** Round patches on the flanks. */
  spots?: string
  /** Little glitter stars scattered over the body. */
  glitter?: string
  /** Small multicoloured paint dots on the body. */
  paintSpots?: boolean
  /** Anything worn besides `accessory` (a helmet and a crown, a backpack ...). */
  extras?: readonly WornAccessory[]
}

/** The colour of `type` if this unicorn wears it (as its main accessory or as an extra), else undefined. */
export function wearing(look: UnicornLook, type: Exclude<Accessory, 'none'>): string | undefined {
  if (look.accessory === type) return look.accessoryColor
  return look.extras?.find((a) => a.type === type)?.color
}

/** Seven rainbow stripes, red to violet (kept soft to match the palette). */
export const RAINBOW = [
  '#ff6b8b',
  '#ff9f5a',
  '#ffd166',
  '#7be07f',
  '#7be0d6',
  '#6fa8ff',
  '#c9a7ff',
] as const

/** Amara's unicorn: always with her backpack (the `extras` are there, so stages can add to them). */
export const PLAYER_LOOK: UnicornLook & { extras: readonly WornAccessory[] } = {
  coat: '#ffffff',
  mane: RAINBOW,
  stripes: RAINBOW,
  horn: '#ffd166',
  hooves: RAINBOW,
  accessory: 'none',
  accessoryColor: '#ffd166',
  personality: 'bouncy',
  build: 1,
  hornLength: 1.15,
  hornType: 'straight',
  extras: [{ type: 'backpack', color: '#ff7ec7' }],
}

/** Eight distinct teachers; four of them appear together in every stage. */
export const NPC_LOOKS: readonly UnicornLook[] = [
  { coat: '#f0e4ff', mane: ['#8e6be0', '#c9a7ff', '#6a4cba'], horn: '#ffd166', hooves: ['#8e6be0'], accessory: 'bow', accessoryColor: '#ff7ec7', personality: 'curious', build: 1, hornLength: 1 },
  { coat: '#d9fff9', mane: ['#2fa8a0', '#7be0d6'], horn: '#fff4e1', hooves: ['#2fa8a0'], accessory: 'glasses', accessoryColor: '#2a1a52', personality: 'sleepy', build: 1.08, hornLength: 0.85 },
  { coat: '#ffe6f3', mane: ['#ff7ec7', '#ffb3df', '#ff4fae'], horn: '#ffd166', hooves: ['#ff7ec7'], accessory: 'flowers', accessoryColor: '#fff4e1', personality: 'bouncy', build: 0.94, hornLength: 1.1 },
  { coat: '#fff6d6', mane: ['#f0a63c', '#ffd166'], horn: '#ff7ec7', hooves: ['#f0a63c'], accessory: 'crown', accessoryColor: '#ffd166', personality: 'proud', build: 1.05, hornLength: 1.2 },
  { coat: '#dff1ff', mane: ['#4f8fe0', '#8ec3ff', '#2f5fb0'], horn: '#c9a7ff', hooves: ['#4f8fe0'], accessory: 'scarf', accessoryColor: '#ff6b8b', personality: 'proud', build: 1, hornLength: 0.95 },
  { coat: '#ffeedd', mane: ['#e07a4f', '#ffb27a'], horn: '#7be0d6', hooves: ['#e07a4f'], accessory: 'bow', accessoryColor: '#7be0d6', personality: 'bouncy', build: 0.92, hornLength: 1 },
  { coat: '#e9ffe6', mane: ['#4fae6a', '#a7e8b0', '#2f7a48'], horn: '#ffd166', hooves: ['#4fae6a'], accessory: 'glasses', accessoryColor: '#ff7ec7', personality: 'curious', build: 1.06, hornLength: 1.05 },
  { coat: '#f6e6ff', mane: ['#b04fe0', '#ff7ec7', '#6fa8ff'], horn: '#fff4e1', hooves: ['#b04fe0'], accessory: 'flowers', accessoryColor: '#ffd166', personality: 'sleepy', build: 1, hornLength: 0.9 },
]

/**
 * What the teacher wears on top of their own colours: round glasses, a bow
 * tie, a graduation cap and a pointer. Data, so the outfit can change later
 * (lab goggles in the lab …).
 */
export const TEACHER_LOOK = {
  /** Cap, glasses frame and pointer. */
  accessoryColor: '#2a2238',
  /** Bow tie and the cap's tassel. */
  tieColor: '#ffd166',
} as const
