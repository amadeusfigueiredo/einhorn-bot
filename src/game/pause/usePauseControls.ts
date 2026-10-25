import { useEffect } from 'react'
import { pauseStore } from './pauseStore'
import { pauseKeyAction } from './pauseKeys'

/**
 * Pause keys (P; Escape in a stage) and the automatic pause when the tab
 * goes into the background, so a child who comes back finds the game waiting.
 */
export function usePauseControls({ filmPlaying, nameCardOpen }: { filmPlaying: boolean; nameCardOpen: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { paused, toggle, pause, resume } = pauseStore.getState()
      const action = pauseKeyAction(e, {
        paused,
        filmPlaying,
        nameCardOpen,
        menuOpen: !!document.querySelector('[aria-expanded="true"]'),
      })
      if (!action) return
      e.preventDefault()
      if (action === 'toggle') toggle()
      else if (action === 'pause') pause()
      else resume()
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden') pauseStore.getState().pause()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [filmPlaying, nameCardOpen])
}
