import type { LoaderImageAssets } from '../types'

export type PopupId = 'WIN' | 'TRY_AGAIN' | 'GAME_END'

export type PopupConfig = {
  id: PopupId
  imageKey: keyof LoaderImageAssets // The key used in the asset loader
  durationMs: number | null // Duration in ms, or null if it must be closed manually
  fallbackText: string // Text shown if image fails to load
}

export const POPUPS: Record<PopupId, PopupConfig> = {
  WIN: {
    id: 'WIN',
    imageKey: 'winPopup', // Image for correct answer
    durationMs: 4000, // 4 seconds - quick celebration, not a wait
    fallbackText: '✨ Richtig! Fantastisch, weiter so! ✨',
  },
  TRY_AGAIN: {
    id: 'TRY_AGAIN',
    imageKey: 'tryAgainPopup', // Image for incorrect answer
    durationMs: 5000, // 5 seconds
    fallbackText: '❌ Nicht ganz! Probier es gleich noch einmal. ❌',
  },
  GAME_END: {
    id: 'GAME_END',
    imageKey: 'gameEndPopup', // Image for completing the game
    durationMs: null, // Manual close required
    fallbackText: '🎉 SPIEL ENDE! Du hast die Einhornschule abgeschlossen! 🎉',
  },
}
