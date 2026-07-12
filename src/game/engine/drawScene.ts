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

export type DrawSceneOptions = {
  /** Elapsed seconds, drives idle/walk/hover/selected animations. */
  t: number
  motion?: PlayerMotion
  /** NPC currently under the mouse cursor (desktop hover only). */
  hoveredNpcId?: string | null
  canvasWidth?: number
  canvasHeight?: number
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  player: Player,
  answered: Set<string>,
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
    })
  }

  drawPlayer(ctx, player, assets as LoaderImageAssets, {
    t: options.t,
    moving: options.motion?.moving ?? false,
    facingLeft: options.motion?.facingLeft ?? false,
  })

  const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
  const req = stage.requiredToAdvance ?? total
  const hudLabel = `${stage.subject} · ${stage.difficulty}`
  drawHUD(ctx, hudLabel, answered.size, req, total)

  if (nearNpc) {
    // --- Helper Function (Required for Rounded Corners) ---

    // 1. Define the text and set up font
    const text = '✨ Klicken oder E drücken ✨'

    ctx.save()

    // 2. Set the Font and Centering Alignment
    ctx.font =
      "600 22px 'Fredoka', 'Baloo 2', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"

    // Set text alignment and baseline for perfect centering
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const metrics = ctx.measureText(text)

    // 3. Define Box Dimensions with Increased Padding
    const padding = 16 // Increased Padding
    const borderRadius = 12
    const textHeight = 24 // Estimated font height

    // Box dimensions calculation
    const boxWidth = metrics.width + padding * 2
    const boxHeight = textHeight + padding * 2

    // Calculate the center point for the box (Above the NPC's head)
    const centerX = nearNpc.x
    const centerY = nearNpc.y - 64 // Position 64 pixels above the NPC center

    // Calculate top-left corner (where roundRect needs to start)
    const boxX = centerX - boxWidth / 2
    const boxY = centerY - boxHeight / 2

    // 4. Draw the Rounded Background Box with Rainbow Gradient
    ctx.beginPath()
    ctx.lineWidth = 4 // Thicker border

    // --- VIOLET/PINK GRADIENT BORDER ---
    const gradient = ctx.createLinearGradient(boxX, 0, boxX + boxWidth, 0)
    gradient.addColorStop(0, '#FF4FB8') // Hot Pink
    gradient.addColorStop(0.3, '#FFD166') // Gold
    gradient.addColorStop(0.6, '#C9A7FF') // Lavender
    gradient.addColorStop(1, '#8A5CF6') // Violet
    ctx.strokeStyle = gradient // Apply the gradient to the border

    // Soft violet background
    const fillGradient = ctx.createLinearGradient(boxX, 0, boxX + boxWidth, 0)
    fillGradient.addColorStop(0, 'rgba(109, 63, 201, 0.85)')
    fillGradient.addColorStop(1, 'rgba(255, 79, 184, 0.75)')
    ctx.fillStyle = fillGradient

    // Apply shadow to the box for depth
    ctx.shadowColor = 'rgba(74, 46, 110, 0.5)'
    ctx.shadowBlur = 10

    // Use the roundRect helper to define the box shape
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, borderRadius)

    ctx.fill()
    ctx.stroke() // Draw the rainbow border

    // 5. Draw the White Text (The content)
    // Clear shadow for the text itself to make it sharp
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    ctx.fillStyle = '#fff' // White text color

    // Draw text at the calculated CENTER point (centerX, centerY)
    ctx.fillText(text, centerX, centerY)

    ctx.restore()
  }
}
