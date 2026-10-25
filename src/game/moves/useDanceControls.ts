import { useEffect } from 'react'
import { isDanceKey, type DanceContext } from './danceKeys'
import { setDanceContext, tryDance } from './danceGate'

/**
 * Space makes the hero (Amara or the unicorn) do one of its moves, when it can (see `canDance`); a click on her does the
 * same (the figure asks `tryDance`). `context` is read at the moment of the key or the click, so it is always the latest.
 */
export function useDanceControls(context: () => DanceContext) {
  useEffect(() => {
    setDanceContext(context)
    const onKey = (e: KeyboardEvent) => {
      if (!isDanceKey(e) || !tryDance()) return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      setDanceContext(null)
    }
  }, [context])
}
