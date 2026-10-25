/**
 * The pictures of the five books: for every page a little scene of drawn things on a sky, with the things named and
 * placed here (pure data, so a test can check that every page has one and that nothing is drawn outside the page) and
 * painted by `BookPicture.tsx`. The page is a square of 200 by 200; a thing's `x` and `y` are where its middle is.
 */
export const PAGE_SIZE = 200

export const PROP_KINDS = [
  'moon',
  'star',
  'faceStar',
  'shootingStar',
  'cloud',
  'koala',
  'capybara',
  'parrot',
  'bathtub',
  'bubble',
  'iceCream',
  'unicorn',
  'bunny',
  'heart',
  'flower',
  'donutTree',
  'girl',
  'zzz',
  'number',
] as const
export type PropKind = (typeof PROP_KINDS)[number]

export type Prop = {
  kind: PropKind
  x: number
  y: number
  /** How big, 1 being the size it is drawn at (about 100 across). */
  s?: number
  /** A colour, for the things that come in several (a flower, a bubble). */
  color?: string
  /** Asleep with its eyes shut (the koala), or looking up (the girl). */
  mood?: 'asleep' | 'up'
  /** Turned to face the other way. */
  flip?: boolean
  /** The digit of a number. */
  text?: string
}

export type Scene = {
  /** The sky, from the top to the bottom of the page. */
  sky: readonly [string, string]
  /** The ground: a hill of this colour, its top this far down the page (none for a sky only). */
  ground?: { color: string; y: number }
  /** Back to front: later things are drawn over earlier ones. */
  props: readonly Prop[]
}

const NIGHT = ['#2B2A6B', '#6B4FD8'] as const
const DAY = ['#BFE6FF', '#FFF1D6'] as const

/** What each page of each book looks like, by the book's id and the page (0 to 2): the left page of the open book. */
export const BOOK_ART: Record<number, readonly [Scene, Scene, Scene]> = {
  // The Moon Koala
  0: [
    { sky: NIGHT, ground: { color: '#C9CDE0', y: 150 }, props: [{ kind: 'moon', x: 150, y: 45, s: 1.1 }, { kind: 'star', x: 35, y: 35, s: 0.5 }, { kind: 'star', x: 85, y: 70, s: 0.35 }, { kind: 'koala', x: 85, y: 125 }] },
    { sky: NIGHT, ground: { color: '#C9CDE0', y: 165 }, props: [{ kind: 'number', x: 45, y: 80, text: '1', s: 1.1 }, { kind: 'star', x: 45, y: 40, s: 0.7 }, { kind: 'star', x: 100, y: 35, s: 0.7 }, { kind: 'number', x: 100, y: 80, text: '2', s: 1.1 }, { kind: 'star', x: 155, y: 40, s: 0.7 }, { kind: 'number', x: 155, y: 80, text: '3', s: 1.1 }, { kind: 'koala', x: 100, y: 130, s: 0.9 }] },
    { sky: NIGHT, ground: { color: '#C9CDE0', y: 140 }, props: [{ kind: 'moon', x: 55, y: 45, s: 0.8 }, { kind: 'star', x: 150, y: 40, s: 0.5 }, { kind: 'koala', x: 100, y: 135, mood: 'asleep', s: 0.95 }, { kind: 'zzz', x: 150, y: 90, s: 1 }] },
  ],
  // Capybara Takes a Bath
  1: [
    { sky: DAY, ground: { color: '#9ED8A8', y: 140 }, props: [{ kind: 'cloud', x: 45, y: 35, s: 0.7 }, { kind: 'capybara', x: 100, y: 105, s: 0.95 }, { kind: 'bathtub', x: 100, y: 140, s: 1.15 }, { kind: 'bubble', x: 55, y: 85, s: 0.7 }, { kind: 'bubble', x: 150, y: 70, s: 0.5 }] },
    { sky: DAY, ground: { color: '#9ED8A8', y: 140 }, props: [{ kind: 'capybara', x: 100, y: 105, s: 0.95 }, { kind: 'bathtub', x: 100, y: 140, s: 1.15 }, { kind: 'parrot', x: 112, y: 55, s: 0.75 }, { kind: 'bubble', x: 40, y: 90, s: 0.6 }] },
    { sky: DAY, ground: { color: '#9ED8A8', y: 140 }, props: [{ kind: 'cloud', x: 150, y: 35, s: 0.6 }, { kind: 'capybara', x: 100, y: 105, s: 0.95, mood: 'asleep' }, { kind: 'bathtub', x: 100, y: 140, s: 1.15 }, { kind: 'parrot', x: 112, y: 55, s: 0.75 }, { kind: 'bubble', x: 45, y: 80, s: 0.8 }, { kind: 'bubble', x: 160, y: 95, s: 0.6 }, { kind: 'bubble', x: 30, y: 115, s: 0.45 }] },
  ],
  // The Ice-Cream Unicorn
  2: [
    { sky: ['#FFE3F1', '#FFF8E7'], ground: { color: '#FFD1E6', y: 155 }, props: [{ kind: 'cloud', x: 150, y: 35, s: 0.7 }, { kind: 'unicorn', x: 62, y: 120, s: 0.8 }, { kind: 'iceCream', x: 148, y: 110, s: 1.15 }] },
    { sky: ['#FFE3F1', '#FFF8E7'], ground: { color: '#FFD1E6', y: 160 }, props: [{ kind: 'iceCream', x: 100, y: 95, s: 1.2 }, { kind: 'unicorn', x: 45, y: 135, s: 0.6 }, { kind: 'koala', x: 105, y: 150, s: 0.45 }, { kind: 'bunny', x: 160, y: 140, s: 0.6 }] },
    { sky: ['#FFE3F1', '#FFF8E7'], ground: { color: '#FFD1E6', y: 160 }, props: [{ kind: 'heart', x: 45, y: 50, s: 0.8, color: '#FF6B9A' }, { kind: 'heart', x: 155, y: 45, s: 0.6, color: '#FF8FC0' }, { kind: 'iceCream', x: 70, y: 115, s: 0.95 }, { kind: 'iceCream', x: 135, y: 115, s: 0.95 }, { kind: 'heart', x: 100, y: 30, s: 0.5, color: '#FFB3D4' }] },
  ],
  // Amara and the Stars
  3: [
    { sky: NIGHT, ground: { color: '#3C3A7A', y: 165 }, props: [{ kind: 'star', x: 40, y: 40, s: 0.6 }, { kind: 'star', x: 100, y: 25, s: 0.45 }, { kind: 'star', x: 160, y: 50, s: 0.7 }, { kind: 'star', x: 130, y: 85, s: 0.35 }, { kind: 'moon', x: 55, y: 90, s: 0.5 }, { kind: 'girl', x: 100, y: 130, mood: 'up', s: 0.9 }] },
    { sky: NIGHT, ground: { color: '#3C3A7A', y: 165 }, props: [{ kind: 'faceStar', x: 125, y: 70, s: 1 }, { kind: 'star', x: 35, y: 35, s: 0.4 }, { kind: 'star', x: 60, y: 90, s: 0.3 }, { kind: 'girl', x: 55, y: 135, mood: 'up', s: 0.8 }] },
    { sky: NIGHT, ground: { color: '#3C3A7A', y: 165 }, props: [{ kind: 'shootingStar', x: 120, y: 55, s: 1.1 }, { kind: 'star', x: 40, y: 40, s: 0.5 }, { kind: 'star', x: 165, y: 105, s: 0.4 }, { kind: 'star', x: 30, y: 95, s: 0.3 }, { kind: 'girl', x: 70, y: 135, mood: 'up', s: 0.8 }] },
  ],
  // The Rainbow Garden
  4: [
    { sky: DAY, ground: { color: '#8CE99A', y: 120 }, props: [{ kind: 'cloud', x: 55, y: 35, s: 0.7 }, { kind: 'flower', x: 50, y: 135, color: '#FF8FC0', s: 0.9 }, { kind: 'flower', x: 105, y: 150, color: '#FFE066', s: 1 }, { kind: 'flower', x: 155, y: 135, color: '#FF8FC0', s: 0.85 }] },
    { sky: DAY, ground: { color: '#8CE99A', y: 125 }, props: [{ kind: 'flower', x: 25, y: 150, color: '#FF6B6B', s: 0.7 }, { kind: 'flower', x: 63, y: 155, color: '#FFE066', s: 0.7 }, { kind: 'flower', x: 100, y: 150, color: '#8CE99A', s: 0.7 }, { kind: 'flower', x: 137, y: 155, color: '#74C0FC', s: 0.7 }, { kind: 'flower', x: 175, y: 150, color: '#9775FA', s: 0.7 }] },
    { sky: DAY, ground: { color: '#8CE99A', y: 130 }, props: [{ kind: 'donutTree', x: 100, y: 105, s: 1.15 }, { kind: 'flower', x: 35, y: 155, color: '#FF8FC0', s: 0.7 }, { kind: 'flower', x: 165, y: 155, color: '#74C0FC', s: 0.7 }] },
  ],
}
