import type { MoveTarget, Keys, Player, PlayerMotion, StageConfig } from '../types'
import { updateGame } from '../engine/update'
import { computePlayerSize } from '../utils/playerSize'
import { getStartPosition } from '../utils/npcLayout'

/**
 * The walking part of the game, independent of how it is drawn. Positions are
 * in "design pixels" (the same space as `NPC.x/y`); the player's top-left is
 * `player.x/y` and its centre is `playerCenter`. Both the canvas and the 3D
 * view step and read this one object.
 */
export type World = {
  player: Player
  motionRef: { current: PlayerMotion }
  moveTargetRef: { current: MoveTarget | null }
}

export function createWorld(canvasWidth: number, canvasHeight: number): World {
  const { w, h } = computePlayerSize(canvasWidth, canvasHeight)
  const start = getStartPosition(canvasWidth, canvasHeight)
  return {
    player: { x: start.x - w / 2, y: start.y - h / 2, w, h, speed: 210 },
    motionRef: { current: { moving: false, facingLeft: false } },
    moveTargetRef: { current: null },
  }
}

export function resizeWorld(world: World, canvasWidth: number, canvasHeight: number) {
  const { w, h } = computePlayerSize(canvasWidth, canvasHeight)
  world.player.w = w
  world.player.h = h
}

export function playerCenter(player: Player): { x: number; y: number } {
  return { x: player.x + player.w / 2, y: player.y + player.h / 2 }
}

export type StepInput = {
  dt: number
  keys: Keys
  stage: StageConfig
  answered: ReadonlySet<string>
  visiting?: boolean
  onTrigger: (kind: 'gate' | 'npc', id: string) => void
  canvasWidth: number
  canvasHeight: number
}

/** Advance the walking simulation by `dt` seconds. */
export function stepWorld(world: World, input: StepInput) {
  updateGame({
    ...input,
    player: world.player,
    moveTargetRef: world.moveTargetRef,
    motionRef: world.motionRef,
  })
}
