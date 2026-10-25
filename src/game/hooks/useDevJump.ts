import { useEffect } from 'react'
import { STAGES } from '../constants/stages'
import { gameStore } from '../logic/gameStore.instance'
import { parseDevJump, resolveDevJump } from '../logic/devJump'
import { devToolsEnabled } from '../utils/devTools'

/** Once, when the page opens: does what the address asks for (`?stage=5&left=1`, see `logic/devJump.ts`), for the developers only. */
export function useDevJump(search: string = window.location.search) {
  useEffect(() => {
    if (!devToolsEnabled(search)) return
    const jump = parseDevJump(search)
    if (!jump) return
    const { stageIndex, answered } = resolveDevJump(jump, gameStore.getState().stageIndex, STAGES)
    gameStore.getState().devJump(stageIndex, answered)
    // (the search is read once, when the page opens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
