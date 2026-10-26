export type PauseKeyContext = {
  paused: boolean
  /** A film is on screen: Escape belongs to it (it skips), and only P pauses it. */
  filmPlaying: boolean
  /** The name card is open: Escape belongs to it. */
  nameCardOpen: boolean
  /** A dropdown or list is open: Escape closes that first. */
  menuOpen: boolean
}

export type PauseKeyEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'defaultPrevented'> & { target: EventTarget | null }

export type PauseKeyAction = 'toggle' | 'pause' | 'resume' | null

function isTyping(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null
  const tag = el?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || !!el?.isContentEditable
}

/**
 * What a key does to the pause. P toggles it anywhere (but never while the
 * child types a name). Escape pauses a stage, and goes on when paused in one;
 * it leaves films (which it skips), the name card and open menus alone.
 */
export function pauseKeyAction(e: PauseKeyEvent, ctx: PauseKeyContext): PauseKeyAction {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return null
  if (e.key === 'p' || e.key === 'P') return 'toggle'
  if (e.key === 'Escape') {
    if (ctx.filmPlaying || ctx.nameCardOpen) return null
    if (ctx.paused) return 'resume'
    return ctx.menuOpen ? null : 'pause'
  }
  return null
}
