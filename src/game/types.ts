export type Keys = Record<string, boolean>
export type SceneName =
  | 'stage1'
  | 'stage2'
  | 'stage3'
  | 'stage4'
  | 'stage5'
  | 'stage6'
  | 'stage7'
  | 'stage8'
  | 'stage9'
  | 'stage10'
  | 'stage11'
  | 'stage12'

export type Rect = { x: number; y: number; w: number; h: number }

export type Question = {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
}

export type Gate = {
  id: string
  area: Rect
  question: Question
}

export type NPC = {
  id: string
  x: number
  y: number
  r?: number // draw radius (default 26)
  talkRadius?: number // distance to allow talking (default 80)
  question: Question
  imageKey?: string
}

export type StageConfig = {
  name: SceneName
  background?:
  | 'stage1Background'
  | 'stage2Background'
  | 'stage3Background'
  | 'stage4Background'
  | 'stage5Background'
  | 'stage6Background'
  | 'stage7Background'
  | 'stage8Background'
  | 'stage9Background'
  | 'stage10Background'
  | 'stage11Background'
  | 'stage12Background'

  requiredToAdvance?: number // default: all gates + all NPCs
  nextStage?: SceneName | null
  gates?: Gate[] // optional now
  npcs?: NPC[] // NEW
}

export type Npc = {
  id: string
  x: number
  y: number
  question: {
    id: string
    prompt: string
    choices: string[]
    correctIndex: number
  }
}

export type LoaderImageAssets = {
  stage1Background?: HTMLImageElement
  stage2Background?: HTMLImageElement
  stage3Background?: HTMLImageElement
  stage4Background?: HTMLImageElement
  stage5Background?: HTMLImageElement
  stage6Background?: HTMLImageElement
  stage7Background?: HTMLImageElement
  stage8Background?: HTMLImageElement
  stage9Background?: HTMLImageElement
  stage10Background?: HTMLImageElement
  stage11Background?: HTMLImageElement
  stage12Background?: HTMLImageElement
  winPopup?: HTMLImageElement
  tryAgainPopup?: HTMLImageElement
  gameEndPopup?: HTMLImageElement
  stage1Npc1?: HTMLImageElement
  stage1Npc2?: HTMLImageElement
  stage1Npc3?: HTMLImageElement
  stage1Npc4?: HTMLImageElement
  stage2Npc1?: HTMLImageElement
  stage2Npc2?: HTMLImageElement
  stage2Npc3?: HTMLImageElement
  stage3Npc1?: HTMLImageElement
  stage3Npc2?: HTMLImageElement
  stage3Npc3?: HTMLImageElement
  stage4Npc1?: HTMLImageElement
  stage4Npc2?: HTMLImageElement
  stage4Npc3?: HTMLImageElement
  stage5Npc1?: HTMLImageElement
  stage5Npc2?: HTMLImageElement
  stage5Npc3?: HTMLImageElement
  stage6Npc1?: HTMLImageElement
  stage6Npc2?: HTMLImageElement
  stage6Npc3?: HTMLImageElement
  stage7Npc1?: HTMLImageElement
  stage7Npc2?: HTMLImageElement
  stage7Npc3?: HTMLImageElement
  stage8Npc1?: HTMLImageElement
  stage8Npc2?: HTMLImageElement
  stage8Npc3?: HTMLImageElement
  stage9Npc1?: HTMLImageElement
  stage9Npc2?: HTMLImageElement
  stage9Npc3?: HTMLImageElement
  stage10Npc1?: HTMLImageElement
  stage10Npc2?: HTMLImageElement
  stage10Npc3?: HTMLImageElement
  stage11Npc1?: HTMLImageElement
  stage11Npc2?: HTMLImageElement
  stage11Npc3?: HTMLImageElement
  stage12Npc1?: HTMLImageElement
  stage12Npc2?: HTMLImageElement
  stage12Npc3?: HTMLImageElement
  player1?: HTMLImageElement
}

export type LoaderAudioAssets = {
  stage1?: HTMLAudioElement
  stage2?: HTMLAudioElement
  stage3?: HTMLAudioElement
}

export type Player = {
  x: number
  y: number
  w: number
  h: number
  speed: number
}

export type MoveTarget = {
  x: number
  y: number
  /** How close the player must get before this counts as "arrived". */
  radius?: number
  /** Called once, when the player arrives (e.g. open an NPC's question). */
  onArrive?: () => void
}

export type PlayerMotion = {
  moving: boolean
  facingLeft: boolean
}

export type UpdateParams = {
  dt: number
  keys: Keys
  player: Player
  stage: StageConfig
  answered: Set<string>
  onTrigger: (kind: 'gate' | 'npc', id: string) => void
  /** Click/tap-to-move target. Any manual key input cancels it. */
  moveTargetRef?: { current: MoveTarget | null }
  /** Updated in place each frame so the renderer can animate the sprite. */
  motionRef?: { current: PlayerMotion }
  /** Canvas bounds to clamp movement to. Defaults to the landscape design size. */
  canvasWidth?: number
  canvasHeight?: number
}
