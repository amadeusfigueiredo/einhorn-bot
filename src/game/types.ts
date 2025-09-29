export type Keys = Record<string, boolean>
export type SceneName = string

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
}

export type StageConfig = {
  name: SceneName
  bg?: 'park' | 'street' | 'school' | 'custom'
  requiredToAdvance?: number // default: all gates + all NPCs
  nextStage?: SceneName | null
  gates?: Gate[] // optional now
  npcs?: NPC[] // NEW
}

export type Assets = {
  unicorn?: HTMLImageElement
  backgrounds?: Record<string, HTMLImageElement>
}
