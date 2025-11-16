import type { Player } from './update'
import type { LoaderImageAssets, StageConfig } from '../types'
import {
  drawBackground,
  drawGates,
  drawHUD,
  drawNPC,
  drawPlayer,
} from '../renderer'

const WIDTH = 960
const HEIGHT = 540

export function drawScene(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  player: Player,
  answered: Set<string>,
  assets: LoaderImageAssets | undefined
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  drawBackground(
    ctx,
    stage,
    (assets as LoaderImageAssets) ?? ({} as LoaderImageAssets),
    WIDTH,
    HEIGHT
  )

  drawGates(ctx, stage.gates ?? [], answered)

  for (const n of stage.npcs ?? []) {
    drawNPC(ctx, n.x, n.y, answered.has(n.id), stage, assets, WIDTH, HEIGHT, n)
  }

  drawPlayer(ctx, player, assets as LoaderImageAssets)

  const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
  const req = stage.requiredToAdvance ?? total
  drawHUD(ctx, stage.name, answered.size, req, total)

  const cx = player.x + player.w / 2
  const cy = player.y + player.h / 2
  const nearNpc = (stage.npcs ?? []).find(
    (n) =>
      !answered.has(n.id) &&
      Math.hypot(cx - n.x, cy - n.y) <= (n.talkRadius ?? 80)
  )
  // Assuming this code is inside your drawScene function, right after defining nearNpc:
  if (nearNpc) {
    // --- Helper Function (Required for Rounded Corners) ---
    // Define the roundRect function here for a clean copy-paste block
    function roundRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      if (w < 2 * r) r = w / 2
      if (h < 2 * r) r = h / 2
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    // 1. Define the text and set up font
    const text = 'Druck mal E'

    ctx.save()

    // 2. Set the Font and Centering Alignment
    ctx.font = '24px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

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

    // --- RAINBOW GRADIENT SETUP ---
    // Create a Linear Gradient across the box width (for a horizontal rainbow look)
    const gradient = ctx.createLinearGradient(boxX, 0, boxX + boxWidth, 0)
    gradient.addColorStop(0, '#FF00A0') // Hot Pink
    gradient.addColorStop(0.2, '#FFD700') // Gold
    gradient.addColorStop(0.4, '#ADFF2F') // Green-Yellow
    gradient.addColorStop(0.6, '#00FFFF') // Cyan
    gradient.addColorStop(0.8, '#5D3FD3') // Purple
    gradient.addColorStop(1, '#FF69B4') // Pink
    ctx.strokeStyle = gradient // Apply the gradient to the border

    // Dark grey background
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)'

    // Apply shadow to the box for depth
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
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
