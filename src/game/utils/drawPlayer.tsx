import type { LoaderImageAssets } from '../types'
import { roundRect } from './roundRect'
import { computePlayerBob, computePlayerGlow } from './playerAnimation'

export type PlayerRenderAnim = {
  t: number
  moving: boolean
  facingLeft: boolean
}

const RAINBOW_STOPS: [number, string][] = [
  [0, '#FF00A0'],
  [0.25, '#FFD700'],
  [0.5, '#00FFFF'],
  [0.75, '#5D3FD3'],
  [1, '#FF69B4'],
]

function rainbowGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number
) {
  const gradient = ctx.createLinearGradient(x0, 0, x1, 0)
  for (const [stop, color] of RAINBOW_STOPS) gradient.addColorStop(stop, color)
  return gradient
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; w: number; h: number },
  assets: LoaderImageAssets | undefined,
  anim: PlayerRenderAnim = { t: 0, moving: false, facingLeft: false }
) {
  const BORDER_RADIUS = 12
  const BORDER_WIDTH = 4

  const bob = computePlayerBob(anim.t, anim.moving)
  const glowAlpha = computePlayerGlow(anim.t)
  const centerX = p.x + p.w / 2
  const centerY = p.y + p.h / 2

  // --- Soft ground shadow (grounds the hop, adds depth) ---
  ctx.save()
  const shadowSquash = Math.max(0.7, 1 - Math.abs(bob.offsetY) * 0.03)
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#2a1a45'
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

  // --- Pulsing rainbow glow behind the sprite ---
  ctx.save()
  ctx.globalAlpha = 0.35 * glowAlpha
  ctx.shadowColor = '#c9a7ff'
  ctx.shadowBlur = 18
  ctx.fillStyle = rainbowGradient(ctx, p.x, p.x + p.w)
  roundRect(ctx, p.x - 4, p.y - 4, p.w + 8, p.h + 8, BORDER_RADIUS + 4)
  ctx.fill()
  ctx.restore()

  // --- Bob / squash-stretch / facing transform ---
  ctx.save()
  ctx.translate(centerX, centerY + bob.offsetY)
  ctx.scale(anim.facingLeft ? -bob.scaleX : bob.scaleX, bob.scaleY)
  ctx.translate(-p.w / 2, -p.h / 2)

  if (!assets?.player1) {
    ctx.fillStyle = '#f0f8ff'
    roundRect(ctx, 0, 0, p.w, p.h, BORDER_RADIUS)
    ctx.fill()
    ctx.restore()
    return
  }

  ctx.save()
  ctx.beginPath()
  roundRect(ctx, 0, 0, p.w, p.h, BORDER_RADIUS)
  ctx.clip()
  ctx.drawImage(assets.player1, 0, 0, p.w, p.h)
  ctx.restore()

  ctx.lineWidth = BORDER_WIDTH
  ctx.strokeStyle = rainbowGradient(ctx, 0, p.w)
  roundRect(ctx, 0, 0, p.w, p.h, BORDER_RADIUS)
  ctx.stroke()

  ctx.restore()
}
