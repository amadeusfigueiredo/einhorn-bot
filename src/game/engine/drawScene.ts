import type {
  LoaderImageAssets,
  StageConfig,
  Player,
  PlayerMotion,
} from '../types'
import { drawGates } from '../renderer'
import { lookForNpc, playerLookFor } from '../data/stageLooks'
import type { Outfit } from '../player/outfit'
import { drawNPC } from '../engine/drawNPC'
import { drawBackground } from '../utils/drawBackground'
import { drawPlayer } from '../utils/drawPlayer'
import { HEIGHT, WIDTH } from '../constants/dimensions'
import { roundRect } from '../utils/roundRect'
import { getFigureSize } from '../utils/npcDisplaySize'
import { drawParticles, type Particle } from './particles'
import { canvasTheme, withAlpha } from '../../styles/canvasTheme'
import { uiScale } from '../utils/uiScale'
import { translate, type MessageId, type Vars } from '../i18n/translate'
import type { Lang } from '../i18n/language'

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
  lang?: Lang
  /** What the child chose to dress her unicorn in (coat, horn, accessory). */
  outfit?: Outfit
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

  const figureSide = getFigureSize(width, height).w

  const stageIndex = Number(/^stage(\d+)$/.exec(stage.name ?? '')?.[1] ?? 0) - 1
  ;(stage.npcs ?? []).forEach((n, i) => {
    drawNPC(ctx, n.x, n.y, answered.has(n.id), assets, n, {
      t: options.t,
      isSelected: nearNpc?.id === n.id,
      isHovered: options.hoveredNpcId === n.id,
      figureSide,
      reduceMotion: options.reduceMotion,
      look: stageIndex >= 0 ? lookForNpc(stageIndex, i, n) : undefined,
      phase: i * 1.7,
    })
  })

  drawPlayer(
    ctx,
    { ...player, ...options.playerDisplay },
    assets as LoaderImageAssets,
    {
      t: options.t,
      moving: options.motion?.moving ?? false,
      facingLeft: options.motion?.facingLeft ?? false,
      reduceMotion: options.reduceMotion,
      look: stageIndex >= 0 ? playerLookFor(stageIndex, options.outfit) : undefined,
    }
  )

  drawParticles(ctx, options.particles ?? [])

  // (The stage's name and stars are not drawn in the picture: they are in the page's top bar, `ui/Hud.tsx`.)
  const lang = options.lang ?? 'de'
  const t = (id: MessageId, vars?: Vars) => translate(lang, id, vars)
  const ui = uiScale(width, height)

  if (nearNpc) {
    drawTalkPrompt(ctx, nearNpc.x, nearNpc.y - 64 * ui, ui, width, t('dialogue.talkChip'))
  }
}

/** The little "talk to me" chip above a unicorn you're standing next to. */
function drawTalkPrompt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  ui: number,
  canvasWidth: number,
  text: string
) {
  const theme = canvasTheme()
  ctx.save()
  ctx.font = `600 ${22 * ui}px ${theme.fontDisplay}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const boxW = ctx.measureText(text).width + 40 * ui
  const boxH = 48 * ui
  // Keep the chip fully on screen when the unicorn is near an edge.
  const margin = 8
  cx = Math.min(Math.max(cx, boxW / 2 + margin), canvasWidth - boxW / 2 - margin)
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
  ctx.fillText(text, cx, cy + 1)
  ctx.restore()
}
