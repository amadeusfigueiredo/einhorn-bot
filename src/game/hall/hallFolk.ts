import type { AnimalSpec, Line } from '../data/animals'
import { NPC_LOOKS, TEACHER_LOOK, type UnicornLook } from '../data/unicornLooks'
import { FRIEND_LOOKS } from '../places/data/friendLooks'
import { YARD_THINGS } from '../places/data/hangouts'
import type { PlacedAnimal } from '../views/three/animals/layoutAnimals'
import { HALL, HALL_BENCH, benchX, sectionGaps } from './hallLayout'

/** The walkers were placed when the first class door stood at -24.8: they keep their places along the classes however long the corridor is. */
const SHIFT = HALL.startX + 24.8

/**
 * Who is about in the corridor: unicorn children walking up and down, a teacher with glasses, two children tossing a
 * ball, a koala reading on a bench, a penguin and a capybara, and a parrot that flies along it. There are no questions
 * here: a tap on any of them gets a short friendly line. Pure numbers (the scene is in `HallLife.tsx`), so a test can
 * walk through a whole minute.
 */
const L = (de: string, pt: string, en: string): Line => ({ de, pt, en })

/** The friendly lines of the yard are used again where the same friends are met: the capybara says what it says there. */
const yardLine = (id: 'koala' | 'capybara'): Line => YARD_THINGS.find((t) => t.id === id)!.say!

/** A unicorn who walks to and fro along the wall, and stops for a moment at each end. */
export type HallWalker = {
  id: string
  look: UnicornLook
  /** Size relative to the hero (children a little smaller, the teacher a little taller). */
  size: number
  from: number
  to: number
  z: number
  /** Metres per second. */
  speed: number
  /** How long it stands at each end (seconds). */
  pause: number
  /** Seconds added to the clock so they do not all start at the same end. */
  phase: number
  lines: readonly Line[]
}

/** The teacher: their own colours, with round glasses, a bow tie and a graduation cap. */
const TEACHER: UnicornLook = { ...NPC_LOOKS[1], accessory: 'teacher', accessoryColor: TEACHER_LOOK.accessoryColor }

export const HALL_WALKERS: readonly HallWalker[] = [
  {
    id: 'hall-walker-pink',
    look: FRIEND_LOOKS.friendDay,
    size: 0.85,
    from: -26 + SHIFT,
    to: -19 + SHIFT,
    z: 1.9,
    speed: 0.9,
    pause: 1.4,
    phase: 0,
    lines: [L('Hallo! Wohin gehst du?', 'Oi! Aonde você vai?', 'Hi! Where are you going?'), L('Ich suche meine Klasse!', 'Estou procurando minha sala!', 'I am looking for my class!')],
  },
  {
    id: 'hall-walker-mint',
    look: FRIEND_LOOKS.friendPlay,
    size: 0.8,
    from: -13 + SHIFT,
    to: -4 + SHIFT,
    z: 2.2,
    speed: 0.8,
    pause: 1.8,
    phase: 5,
    lines: [L('Heute lernen wir was Tolles!', 'Hoje vamos aprender algo legal!', 'Today we are learning something great!'), L('Viel Spaß in der Schule!', 'Divirta-se na escola!', 'Have fun at school!')],
  },
  {
    id: 'hall-teacher',
    look: TEACHER,
    size: 1.0,
    from: 4 + SHIFT,
    to: 12 + SHIFT,
    z: 0.9,
    speed: 0.7,
    pause: 2.2,
    phase: 3,
    lines: [L('Schön langsam im Flur, bitte!', 'Devagar no corredor, por favor!', 'Nice and slow in the corridor, please!'), L('Gut gemacht heute!', 'Muito bem hoje!', 'Well done today!')],
  },
  {
    id: 'hall-walker-lilac',
    look: NPC_LOOKS[7],
    size: 0.85,
    from: 19 + SHIFT,
    to: 27 + SHIFT,
    z: 2.0,
    speed: 0.85,
    pause: 1.2,
    phase: 8,
    lines: [L('Die letzte Klasse ist die schönste!', 'A última sala é a mais bonita!', 'The last class is the prettiest!'), L('Hast du schon Sterne gesammelt?', 'Você já juntou estrelas?', 'Have you collected stars yet?')],
  },
]

/** Where a walker is `t` seconds in, which way it faces and whether its legs go. */
export function walkerAt(w: HallWalker, t: number): { x: number; facingLeft: boolean; walking: boolean } {
  const dir = Math.sign(w.to - w.from) || 1
  const way = Math.abs(w.to - w.from)
  const go = way / w.speed
  const cycle = 2 * (go + w.pause)
  const u = (((t + w.phase) % cycle) + cycle) % cycle
  if (u < go) return { x: w.from + dir * u * w.speed, facingLeft: dir < 0, walking: true }
  if (u < go + w.pause) return { x: w.to, facingLeft: dir < 0, walking: false }
  if (u < 2 * go + w.pause) return { x: w.to - dir * (u - go - w.pause) * w.speed, facingLeft: dir > 0, walking: true }
  return { x: w.from, facingLeft: dir > 0, walking: false }
}

/** Where the walker is: walking about, or (with reduced motion) standing in the middle of its way. */
export function walkerPlace(w: HallWalker, t: number, still: boolean): { x: number; facingLeft: boolean; walking: boolean } {
  return still ? { x: (w.from + w.to) / 2, facingLeft: false, walking: false } : walkerAt(w, t)
}

/** The two children who toss a ball: where they stand, how far apart, and the looks they have. */
export const HALL_BALL = {
  x: -0.5 + SHIFT,
  z: 1.6,
  gap: 2.2,
  size: 0.75,
  looks: [NPC_LOOKS[2], NPC_LOOKS[5]] as const,
  ids: ['hall-kid-pink', 'hall-kid-orange'] as const,
  /** Seconds the ball takes to go from one child to the other. */
  toss: 1.1,
  /** How high it flies above the height it is thrown from. */
  arc: 0.9,
  /** Where the ball is held, above the floor. */
  hold: 0.75,
  lines: [
    [L('Fang!', 'Pega!', 'Catch!'), L('Spielst du mit?', 'Quer brincar?', 'Do you want to play?')],
    [L('Wirf zurück!', 'Joga de volta!', 'Throw it back!'), L('Juhu, gefangen!', 'Eba, peguei!', 'Yay, caught it!')],
  ] as const,
} as const

/** The ball `t` seconds in: how far along from the first child to the second (0 to 1, back and forth) and how high. */
export function ballAt(t: number): { along: number; height: number; toward: 1 | -1 } {
  const p = (((t / HALL_BALL.toss) % 2) + 2) % 2
  const toward = p < 1 ? 1 : -1
  const s = p < 1 ? p : 2 - p
  return { along: s, height: HALL_BALL.hold + HALL_BALL.arc * 4 * s * (1 - s), toward }
}

/** How high child `side` (0: first, 1: second) hops `t` seconds in: a hop as the ball is thrown and one as it is caught. */
export function kidHop(side: 0 | 1, t: number): number {
  const p = (((t / HALL_BALL.toss) % 2) + 2) % 2
  const mine = side === 0 ? p : (p + 1) % 2
  // Near 0 the ball leaves this child, near 2 (= 0) it arrives.
  const d = Math.min(mine, 2 - mine)
  const bump = Math.max(0, 1 - d / 0.3)
  return 0.28 * bump * bump
}

/** The parrot flies along the whole corridor above the children's heads, near the wall. */
export const FLIGHT = { y: 3.7, z: -1.2 } as const

/** The animals of the corridor. Ids are their own so the sounds and the speech timers are not shared with a classroom. */
export function hallAnimals(): PlacedAnimal[] {
  const gaps = sectionGaps()
  const koala: AnimalSpec = {
    id: 'hall-koala',
    type: 'koala',
    behavior: 'read',
    holds: 'book',
    at: { edge: 'back', t: 0.5 },
    lines: [L('Psst … ich lese gerade!', 'Psiu … estou lendo!', 'Shh … I am reading!'), yardLine('koala')],
  }
  const penguin: AnimalSpec = {
    id: 'hall-penguin',
    type: 'penguin',
    behavior: 'wander',
    at: { edge: 'front', t: 0.5 },
    lines: [L('Brr … hier drin ist es schön warm!', 'Brr … aqui dentro é quentinho!', 'Brr … it is nice and warm in here!')],
  }
  const capybara: AnimalSpec = {
    id: 'hall-capybara',
    type: 'capybara',
    behavior: 'nod',
    outfit: 'sunglasses',
    at: { edge: 'front', t: 0.5 },
    lines: [yardLine('capybara'), L('Sooo entspannt …', 'Que relaxante …', 'So relaxed …')],
  }
  const parrot: AnimalSpec = {
    id: 'hall-parrot',
    type: 'parrot',
    behavior: 'cruise',
    at: { edge: 'back', t: 0.5 },
    lines: [L('Hallo, hallo!', 'Olá, olá!', 'Hello, hello!'), L('Guten Morgen, Schule!', 'Bom dia, escola!', 'Good morning, school!')],
  }
  return [
    { spec: koala, from: [benchX(), HALL_BENCH.seat, HALL_BENCH.z], to: null, yaw: -Math.PI / 2 },
    { spec: penguin, from: [gaps[3] + 0.9, 0, 1.2], to: [gaps[3] + 2.1, 0, 1.2], yaw: Math.PI / 2 },
    { spec: capybara, from: [gaps[3] - 0.9, 0, 1.6], to: null, yaw: -0.9 },
    { spec: parrot, from: [-HALL.halfW + 3, FLIGHT.y, FLIGHT.z], to: [HALL.halfW - 3, FLIGHT.y, FLIGHT.z], yaw: 0 },
  ]
}

/** Everything that can be tapped, by id, with what it may say. */
export function folkLines(): Record<string, readonly Line[]> {
  return {
    ...Object.fromEntries(HALL_WALKERS.map((w) => [w.id, w.lines])),
    [HALL_BALL.ids[0]]: HALL_BALL.lines[0],
    [HALL_BALL.ids[1]]: HALL_BALL.lines[1],
    ...Object.fromEntries(hallAnimals().map((a) => [a.spec.id, a.spec.lines])),
  }
}

/** How long (seconds, fewest and most) it is between one giggle and the next while children are about. */
export const GIGGLE_EVERY = [9, 18] as const

/** Seconds until the next giggle; `random` gives 0 up to but not including 1. */
export function giggleIn(random: () => number): number {
  return GIGGLE_EVERY[0] + random() * (GIGGLE_EVERY[1] - GIGGLE_EVERY[0])
}

/** Is the one who walks or stands here a child (the teacher and the animals do not giggle)? */
export function isChild(id: string): boolean {
  return id !== 'hall-teacher' && (HALL_WALKERS.some((w) => w.id === id) || (HALL_BALL.ids as readonly string[]).includes(id))
}

/** Is something at `x` within the picture (centred on `focus`, `span` either side, a little extra so it is there before it slides in)? */
export function inPicture(x: number, focus: number, span: number, margin = 2): boolean {
  return Math.abs(x - focus) <= span + margin
}
