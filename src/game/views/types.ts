import type { RefObject } from 'react'
import type { Keys, LoaderImageAssets, StageConfig } from '../types'
import type { World } from '../logic/world'

/** What the shell hands to whichever renderer is active. */
export type ViewProps = {
  stage: StageConfig
  stageIndex: number
  canvasWidth: number
  canvasHeight: number
  keysRef: RefObject<Keys>
  world: World
  assetsRef: RefObject<LoaderImageAssets | null>
  onTrigger: (kind: 'gate' | 'npc', id: string) => void
}
