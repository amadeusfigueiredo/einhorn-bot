import type { Hero } from '../player/heroSettings'

/** What decides whether the hero can dance now. */
export type DanceContext = {
  hero: Hero
  /** Only the 3D view draws the hero. */
  view: '2d' | '3d'
  paused: boolean
  /** A film, the intro or the start menu has the screen. */
  covered: boolean
  nameCardOpen: boolean
  /** A teacher is talking or asking: the question comes first. */
  worldPaused: boolean
  /** A friend's talk or a book is open. */
  busy: boolean
  /** A dropdown or list is open. */
  menuOpen: boolean
}

export type DanceKeyEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat' | 'defaultPrevented'> & { target: EventTarget | null }

/** Elements that use Space themselves (a button is pressed with it, a field takes it as a letter). */
function usesSpace(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null
  const tag = el?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || tag === 'a' || tag === 'summary' || !!el?.isContentEditable
}

/** Is this the Space bar, on its own, pressed freshly, while nothing else wants it? */
export function isDanceKey(e: DanceKeyEvent): boolean {
  return (e.key === ' ' || e.key === 'Spacebar') && !e.repeat && !e.defaultPrevented && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !usesSpace(e.target)
}

/** Can the hero (Amara or the unicorn) dance right now? Only in the 3D view, with nothing else in front of the game. */
export function canDance(c: DanceContext): boolean {
  return c.view === '3d' && !c.paused && !c.covered && !c.nameCardOpen && !c.worldPaused && !c.busy && !c.menuOpen
}
