import { STICKERS } from '../data/stickers'
import { missingClasses } from '../logic/classProgress'
import { STAGES } from '../constants/stages'
import { PLAY_STICKERS, type StickerEvent } from './stickerData'

/**
 * Where a sticker is to be found, so a child who is missing one is told where to go. Every play sticker counts one kind
 * of event, and each kind happens in one place: the yard (the games, the friends, the weather), the library (the books,
 * the xylophone, the easel ...), a classroom (the questions), or anywhere (a dance). Pure.
 */
export type Where = 'yard' | 'library' | 'pony' | 'pool' | 'dojo' | 'dance' | 'tech' | 'science' | 'class' | 'anywhere'

const WHERE: Record<StickerEvent, Where> = {
  visitYard: 'yard',
  kick: 'yard',
  bounce: 'yard',
  somersault: 'yard',
  slide: 'yard',
  swing: 'yard',
  splash: 'yard',
  rainbow: 'yard',
  dusk: 'yard',
  talk: 'yard',
  hug: 'yard',
  cheer: 'yard',
  visitLibrary: 'library',
  book: 'library',
  globe: 'library',
  lamp: 'library',
  aquarium: 'library',
  note: 'library',
  song: 'library',
  take: 'library',
  draw: 'library',
  paint: 'library',
  wash: 'pony',
  brush: 'pony',
  style: 'pony',
  groom: 'pony',
  groomTake: 'pony',
  show: 'pony',
  showGold: 'pony',
  companion: 'pony',
  ride: 'pony',
  napoleonDance: 'pony',
  moonwalk: 'pony',
  feed: 'pony',
  feedKind: 'pony',
  dinner: 'pony',
  dinnerGold: 'pony',
  gallop: 'pony',
  gallopKind: 'pony',
  race: 'pony',
  raceGold: 'pony',
  swim: 'pool',
  swimKind: 'pool',
  meet: 'pool',
  meetGold: 'pool',
  dojo: 'dojo',
  dojoKind: 'dojo',
  kataTake: 'dojo',
  belt: 'dojo',
  beltGold: 'dojo',
  groove: 'dance',
  grooveKind: 'dance',
  floorTake: 'dance',
  gala: 'dance',
  galaGold: 'dance',
  code: 'tech',
  codeKind: 'tech',
  techDay: 'tech',
  techDayGold: 'tech',
  discover: 'science',
  discoverKind: 'science',
  labDay: 'science',
  labDayGold: 'science',
  explore: 'library',
  exploreKind: 'library',
  expedition: 'library',
  expeditionGold: 'library',
  glow: 'library',
  glowKind: 'library',
  nightShow: 'library',
  nightShowGold: 'library',
  move: 'anywhere',
  answer: 'class',
  stage: 'class',
}

export function whereOf(event: StickerEvent): Where {
  return WHERE[event]
}

/** Where the play sticker `id` is won (anywhere for an id that is not there). */
export function whereIs(stickerId: string): Where {
  const sticker = PLAY_STICKERS.find((s) => s.id === stickerId)
  return sticker ? whereOf(sticker.rule.type) : 'anywhere'
}

/**
 * How much of the whole game she has done, 0 to 100: the classes finished and the stickers won, counted together (the
 * same things the sticker book counts, so a child who has every sticker and every class is at 100).
 */
export function completionPercent(solved: ReadonlySet<string>, playStickersWon: number): number {
  const classes = STAGES.length - missingClasses(solved, STAGES).length
  const total = STICKERS.length + PLAY_STICKERS.length
  return Math.round((100 * (classes + Math.min(playStickersWon, PLAY_STICKERS.length))) / total)
}
