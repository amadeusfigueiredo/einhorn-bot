/** How tall Amara is at size 1, in world units: from her shoes to the top of her bun. */
/** How high her hips are above her feet at height `AMARA_HEIGHT` (where the legs hang from). */
export const AMARA_HIP = 0.45
export const AMARA_HEIGHT = 1.63

/**
 * How tall Amara is drawn next to the unicorns, as a multiple of the unicorn size of the room (a unicorn at size 1
 * is about 1.9 tall to the tip of its horn): she is a girl beside ponies, a little taller than their backs, and the child must find her at a glance.
 */
export const AMARA_FIGURE_SCALE = 2.1

/**
 * The films light her much brighter than the game does (strong lights, no tone mapping), which washed her
 * pastels out next to the white unicorn: in a film her lit colours are multiplied by this grey.
 */
export const FILM_TINT = '#c2c2c2'

/**
 * Amara's look, from the design sheet: light-brown hair with a little bun and
 * a pink clip, big brown eyes, rosy cheeks, a fluffy pastel rainbow sweater
 * with a white unicorn on the chest, lilac collar and cuffs, blue jeans, pink
 * shoes with yellow straps.
 */
export const AMARA_COLORS = {
  skin: '#FFE1CF',
  cheek: '#FFB1C4',
  hair: '#B98A5E',
  hairLight: '#D9B48A',
  eye: '#5A3A26',
  highlight: '#FFFFFF',
  mouth: '#C2577A',
  teeth: '#FFFFFF',
  collar: '#B79CFF',
  jeans: '#4D7CC7',
  shoe: '#F29CC4',
  strap: '#FFD84D',
  clip: '#FF7EB6',
  sweater: '#FFC9E0',
} as const

/** The tie-dye of a sweater: a soft blob of colour at a place on the canvas. */
export type SweaterBlob = readonly [number, number, string]

/** Where the eight blobs of tie-dye lie on the canvas (the colours are the sweater's own, see `SWEATERS`). */
export const SWEATER_SPOTS: readonly (readonly [number, number])[] = [
  [60, 60],
  [200, 40],
  [330, 90],
  [460, 50],
  [120, 190],
  [280, 200],
  [420, 200],
  [500, 140],
]

export type SweaterId = 'rainbow' | 'sunset' | 'ocean' | 'forest' | 'candy' | 'night'

/** The sweaters she can wear: the colour of the wool and the eight colours of the tie-dye (the first is the one from the design sheet). */
export const SWEATERS: Record<SweaterId, { base: string; blobs: readonly string[] }> = {
  rainbow: { base: '#FFC9E0', blobs: ['#9ED8FF', '#FFB3D4', '#C9B5FF', '#B5F2D9', '#C9B5FF', '#9ED8FF', '#FFB3D4', '#FFF3A0'] },
  sunset: { base: '#FFD9B0', blobs: ['#FF9E7E', '#FFD166', '#FF7EB6', '#FFB347', '#FF7EB6', '#FFD166', '#FF9E7E', '#FFF3A0'] },
  ocean: { base: '#BFE6FF', blobs: ['#5AC2E0', '#8EC5FF', '#B5F2D9', '#6FA8FF', '#B5F2D9', '#5AC2E0', '#8EC5FF', '#FFFFFF'] },
  forest: { base: '#D2F0C4', blobs: ['#7BE07F', '#B5F2D9', '#FFF3A0', '#5FBF6A', '#FFF3A0', '#7BE07F', '#B5F2D9', '#FFFFFF'] },
  candy: { base: '#FFE0F0', blobs: ['#FF7EC7', '#B5F2D9', '#FFF3A0', '#C9B5FF', '#FF7EC7', '#9ED8FF', '#FFB3D4', '#FFFFFF'] },
  night: { base: '#C9B5FF', blobs: ['#6B4FD8', '#9ED8FF', '#FF9EF0', '#8E6BE0', '#FFF3A0', '#6B4FD8', '#9ED8FF', '#FF9EF0'] },
}
export const SWEATER_IDS = Object.keys(SWEATERS) as SweaterId[]

/** The tie-dye of the sweater of the design sheet, as blobs (a place and a colour each). */
export const SWEATER_BLOBS: readonly SweaterBlob[] = SWEATER_SPOTS.map(([x, y], i) => [x, y, SWEATERS.rainbow.blobs[i]])
