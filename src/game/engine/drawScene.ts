import type {
  LoaderImageAssets,
  StageConfig,
  Player,
  PlayerMotion,
} from '../types'
import { drawGates } from '../renderer'
import { drawNPC } from '../engine/drawNPC'
import { drawHUD } from '../utils/drawHUD'
import { drawBackground } from '../utils/drawBackground'
import { drawPlayer } from '../utils/drawPlayer'
import { HEIGHT, WIDTH } from '../constants/dimensions'
import { roundRect } from '../utils/roundRect'
import { getNpcMaxDisplayWidth } from '../utils/npcDisplaySize'
import { drawParticles, type Particle } from './particles'
import { canvasTheme, withAlpha } from '../../styles/canvasTheme'
import { uiScale } from '../utils/uiScale'

export type DrawSceneOptions = {
  /** Elapsed seconds, drives idle/walk/hover/selected animations. */
  t: number
  motion?: PlayerMotion
  /** NPC currently under the mouse cursor (desktop hover only). */
  hoveredNpcId?: string | null
  canvasWidth?: number
  canvasHeight?: number
  /** Where to draw the player (eased); the logical position is `player`. */
  playerDisplay?: { x: number; y: number }
  particles?: readonly Particle[]
  reduceMotion?: boolean
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  player: Player,
  answered: ReadonlySet<string>,
  assets: LoaderImageAssets | undefined,
  options: DrawSceneOptions = { t: 0 }
) {
  const width = options.canvasWidth ?? WIDTH
  const height = options.canvasHeight ?? HEIGHT

  ctx.clearRect(0, 0, width, height)
  drawBackground(
    ctx,
    stage,
    (assets as LoaderImageAssets) ?? ({} as LoaderImageAssets),
    width,
    height
  )

  drawGates(ctx, stage.gates ?? [], answered)

  const cx = player.x + player.w / 2
  const cy = player.y + player.h / 2
  const nearNpc = (stage.npcs ?? []).find(
    (n) =>
      !answered.has(n.id) &&
      Math.hypot(cx - n.x, cy - n.y) <= (n.talkRadius ?? 80)
  )

  const npcMaxDisplayWidth = getNpcMaxDisplayWidth(width, height)

  for (const n of stage.npcs ?? []) {
    drawNPC(ctx, n.x, n.y, answered.has(n.id), assets, n, {
      t: options.t,
      isSelected: nearNpc?.id === n.id,
      isHovered: options.hoveredNpcId === n.id,
      maxDisplayWidth: npcMaxDisplayWidth,
      reduceMotion: options.reduceMotion,
    })
  }

  drawPlayer(
    ctx,
    { ...player, ...options.playerDisplay },
    assets as LoaderImageAssets,
    {
      t: options.t,
      moving: options.motion?.moving ?? false,
      facingLeft: options.motion?.facingLeft ?? false,
      reduceMotion: options.reduceMotion,
    }
  )

  drawParticles(ctx, options.particles ?? [])

  const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
  const req = stage.requiredToAdvance ?? total
  const hudLabel = `${stage.subject} · ${stage.difficulty}`
  const ui = uiScale(width, height)
  drawHUD(ctx, hudLabel, answered.size, req, total, ui)

  if (nearNpc) {
    drawTalkPrompt(ctx, nearNpc.x, nearNpc.y - 64 * ui, ui)
  }
}

const PROMPT_TEXT = 'E drücken oder tippen'

/** The little "talk to me" chip above a unicorn you're standing next to. */
function drawTalkPrompt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  ui: number
) {
  const theme = canvasTheme()
  ctx.save()
  ctx.font = `600 ${22 * ui}px ${theme.fontDisplay}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const boxW = ctx.measureText(PROMPT_TEXT).width + 40 * ui
  const boxH = 48 * ui
  ctx.shadowColor = withAlpha(theme.gold400, 0.6)
  ctx.shadowBlur = 16
  ctx.fillStyle = withAlpha(theme.night800, 0.9)
  roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, boxH / 2)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.lineWidth = 2
  ctx.strokeStyle = theme.gold400
  ctx.stroke()

  ctx.fillStyle = theme.moon50
  ctx.fillText(PROMPT_TEXT, cx, cy + 1)
  ctx.restore()
}
