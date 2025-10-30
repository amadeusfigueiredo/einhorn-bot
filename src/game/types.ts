export type Keys = Record<string, boolean>
export type SceneName =
  | 'stage1'
  | 'stage2'
  | 'stage3'
  | 'stage4'
  | 'stage5'
  | 'stage6'
  | 'stage7'

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
  stage1Npc1?: HTMLImageElement
  stage1Npc2?: HTMLImageElement
  stage1Npc3?: HTMLImageElement
  stage1Npc4?: HTMLImageElement
  stage2Npc1?: HTMLImageElement
  player1?: HTMLImageElement
}

export type LoaderAudioAssets = {
  stage1?: HTMLAudioElement
  stage2?: HTMLAudioElement
  stage3?: HTMLAudioElement
}
