export type PopupId = 'WIN' | 'TRY_AGAIN' | 'FINISH_ALL' | 'GAME_END'

export type PopupConfig = {
  id: PopupId
  /** Duration in ms, or null if it must be closed manually. */
  durationMs: number | null
}

export const POPUPS: Record<PopupId, PopupConfig> = {
  // "Right!": a quick celebration, not a wait.
  WIN: { id: 'WIN', durationMs: 1600 },
  // "Almost!": long enough to read the right answer; a button closes it sooner.
  TRY_AGAIN: { id: 'TRY_AGAIN', durationMs: 5000 },
  // "This class is done, but not the whole school": long enough to read and to tap "Show me".
  FINISH_ALL: { id: 'FINISH_ALL', durationMs: 7000 },
  // The ending stays until the child chooses.
  GAME_END: { id: 'GAME_END', durationMs: null },
}
