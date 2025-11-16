import type { LoaderImageAssets } from '../types'

// Define the structure for a single popup configuration
export type PopupConfig = {
  id: 'WIN' | 'TRY_AGAIN' | 'GAME_END'
  imageKey: keyof LoaderImageAssets // The key used in the asset loader
  durationMs: number | null // Duration in ms, or null if it must be closed manually
  fallbackText: string // Text shown if image fails to load
}

// Map of all popup configurations
export const POPUP_CONFIGS: Record<PopupConfig['id'], PopupConfig> = {
  WIN: {
    id: 'WIN',
    imageKey: 'winPopup', // Image for correct answer
    durationMs: 5000, // 5 seconds
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
