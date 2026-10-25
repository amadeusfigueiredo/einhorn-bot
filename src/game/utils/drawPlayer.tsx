import type { LoaderImageAssets } from '../types'
import type { UnicornLook } from '../data/unicornLooks'
import { drawUnicorn2D } from './drawUnicorn2D'
import { roundRect } from './roundRect'
import { coverCrop } from './coverCrop'
import { computePlayerBob, computePlayerGlow } from './playerAnimation'
import { canvasTheme, withAlpha } from '../../styles/canvasTheme'

export type PlayerRenderAnim = {
  t: number
  moving: boolean
  facingLeft: boolean
  reduceMotion?: boolean
  /** Who she is: when given, the unicorn is drawn in code (as in the 3D view) instead of the picture. */
  look?: UnicornLook
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; w: number; h: number },
  assets: LoaderImageAssets | undefined,
  anim: PlayerRenderAnim = { t: 0, moving: false, facingLeft: false }
) {
  const BORDER_RADIUS = 12
  const BORDER_WIDTH = 4

  const theme = canvasTheme()
  const bob = anim.reduceMotion
    ? { offsetY: 0, scaleX: 1, scaleY: 1 }
    : computePlayerBob(anim.t, anim.moving)
  const glowAlpha = anim.reduceMotion ? 0.8 : computePlayerGlow(anim.t)
  const centerX = p.x + p.w / 2
  const centerY = p.y + p.h / 2

  // --- Soft ground shadow (grounds the hop, adds depth) ---
  ctx.save()
  const shadowSquash = Math.max(0.7, 1 - Math.abs(bob.offsetY) * 0.03)
  ctx.globalAlpha = 0.22
  ctx.fillStyle = theme.night950
  ctx.beginPath()
  ctx.ellipse(
    centerX,
    p.y + p.h - 2,
    (p.w / 2) * shadowSquash,
    p.h * 0.14,
    0,
    0,
    Math.PI * 2
  )
  ctx.fill()
  ctx.restore()

  // --- A look: the unicorn drawn in code, hopping and squashing like the picture did ---
  if (anim.look) {
    ctx.save()
    ctx.translate(centerX, p.y + p.h + bob.offsetY)
    ctx.scale(bob.scaleX, bob.scaleY)
    drawUnicorn2D(ctx, anim.look, 0, 0, p.w * 1.3, { t: anim.t, facingLeft: anim.facingLeft, reduceMotion: anim.reduceMotion })
    ctx.restore()
    return
  }

  // --- Soft moonlight glow behind the sprite ---
  ctx.save()
  ctx.globalAlpha = 0.4 * glowAlpha
  ctx.shadowColor = theme.lilac300
  ctx.shadowBlur = 22
  ctx.fillStyle = withAlpha(theme.lilac300, 0.9)
  roundRect(ctx, p.x - 4, p.y - 4, p.w + 8, p.h + 8, BORDER_RADIUS + 4)
  ctx.fill()
  ctx.restore()

  // --- Bob / squash-stretch / facing transform ---
  ctx.save()
  ctx.translate(centerX, centerY + bob.offsetY)
  ctx.scale(anim.facingLeft ? -bob.scaleX : bob.scaleX, bob.scaleY)
  ctx.translate(-p.w / 2, -p.h / 2)

  if (!assets?.player1) {
    ctx.fillStyle = theme.moon50
    roundRect(ctx, 0, 0, p.w, p.h, BORDER_RADIUS)
    ctx.fill()
    ctx.restore()
    return
  }

  ctx.save()
  ctx.beginPath()
  roundRect(ctx, 0, 0, p.w, p.h, BORDER_RADIUS)
  ctx.clip()
  const crop = coverCrop(assets.player1, p.w, p.h)
  ctx.drawImage(assets.player1, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, p.w, p.h)
  ctx.restore()

  ctx.lineWidth = BORDER_WIDTH
  ctx.strokeStyle = withAlpha(theme.moon50, 0.9)
  roundRect(ctx, 0, 0, p.w, p.h, BORDER_RADIUS)
  ctx.stroke()

  ctx.restore()
}
