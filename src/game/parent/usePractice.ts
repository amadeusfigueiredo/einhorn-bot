import { useEffect } from 'react'
import { gameStore } from '../logic/gameStore.instance'
import { introStore } from '../intro/introStore'
import { isPaused } from '../pause/pauseStore'
import { isStartMenuOpen } from '../start/startStore'
import { practiceStore } from './practiceStore'
import { watchPractice } from './watchPractice'

/** How often the play time is counted (seconds). */
export const TICK_SECONDS = 5

/** Is she playing now? Not while the tab is hidden, the game is paused, the start menu is up or the intro film runs. */
export function isPlaying(state: { visible: boolean; paused: boolean; startOpen: boolean; introActive: boolean }): boolean {
  return state.visible && !state.paused && !state.startOpen && !state.introActive
}

/** While the game is on: what she answers is counted per class, and the time she plays is added up. */
export function usePracticeWatch() {
  useEffect(() => watchPractice(gameStore, (index, kind) => practiceStore.getState().answer(index, kind)), [])
  useEffect(() => {
    const timer = window.setInterval(() => {
      const playing = isPlaying({ visible: document.visibilityState !== 'hidden', paused: isPaused(), startOpen: isStartMenuOpen(), introActive: introStore.getState().active })
      if (playing) practiceStore.getState().addSeconds(TICK_SECONDS)
    }, TICK_SECONDS * 1000)
    return () => window.clearInterval(timer)
  }, [])
}
