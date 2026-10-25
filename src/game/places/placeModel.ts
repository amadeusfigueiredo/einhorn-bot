import type { Phase } from '../logic/gameMachine'

/** Where Amara can be: in a classroom, in the school corridor, or in one of the two places of free play. */
export type PlaceId = 'class' | 'yard' | 'library' | 'hall' | 'sports' | 'pony' | 'pool' | 'dojo' | 'dance' | 'tech' | 'science'

/**
 * Where each door of a place leads. A classroom has a door to the yard and one to the school corridor; the corridor has
 * one green door to the yard and the doors of the classes (which lead to the class they are the door of); the library
 * is reached from the yard, and has a lilac door of its own into the corridor (one way: from the corridor she goes
 * back by the green door to the yard).
 */
export const DOORS: Record<PlaceId, readonly PlaceId[]> = {
  class: ['yard', 'hall'],
  yard: ['class', 'library'],
  library: ['yard', 'hall'],
  hall: ['yard', 'class', 'sports', 'tech', 'science'],
  // The sports hall: one big door back to the corridor (its four archways lead to the sports, which come one by one).
  sports: ['hall', 'pony', 'pool', 'dojo', 'dance'],
  // The pony yard, the first sport: one door back to the sports hall.
  pony: ['sports'],
  // The pool, the dojo and the dance hall: each one door back to the sports hall.
  pool: ['sports'],
  dojo: ['sports'],
  dance: ['sports'],
  // The technology room and the science room: big doors of their own in the corridor, one door back to it each.
  tech: ['hall'],
  science: ['hall'],
}

/** The rooms of the sports that are played in with the shared framework (the pony yard has its own code). */
export const SECTOR_PLACES = ['pool', 'dojo', 'dance', 'tech', 'science'] as const
export type SectorPlace = (typeof SECTOR_PLACES)[number]

export function isSector(place: PlaceId): place is SectorPlace {
  return (SECTOR_PLACES as readonly string[]).includes(place)
}

export function canTravel(from: PlaceId, to: PlaceId): boolean {
  return DOORS[from].includes(to)
}

/**
 * The classroom's door only works while she is just walking about: not in the middle of a talk, a question or a
 * popup (the question would be lost), not while a film or the menu is up.
 */
export function canLeaveClass(game: { phase: Phase; hasPopup: boolean }): boolean {
  return game.phase === 'exploring' && !game.hasPopup
}
