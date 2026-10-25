import type { LoaderImageAssets, NPC } from '../types'
import type { UnicornLook } from '../data/unicornLooks'
import { drawUnicorn2D } from '../utils/drawUnicorn2D'
import { lighten, mix } from '../utils/color'
import { roundRect } from '../utils/roundRect'
import { coverCrop } from '../utils/coverCrop'
import { computeNpcAnimation } from '../utils/npcAnimation'
import { canvasTheme, withAlpha } from '../../styles/canvasTheme'
import { isTeacher } from '../data/teachers'
import { TEACHER_LOOK } from '../data/unicornLooks'

export type NpcRenderAnim = {
  t: number
  isSelected: boolean
  isHovered: boolean
  /** Side of the square every portrait is drawn in (bigger on portrait/mobile canvases). */
  figureSide?: number
  reduceMotion?: boolean
  /** Who it is: when given the unicorn is drawn in code (as in the 3D view) instead of a picture. */
  look?: UnicornLook
  /** Seconds added to the idle motion, so a row of unicorns does not breathe in step. */
  phase?: number
}

const DEFAULT_FIGURE_SIDE = 128

/** A graduation cap in a gold disc: marks the stage's teacher (no text). */
function drawTeacherBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = TEACHER_LOOK.tieColor
  ctx.fill()
  ctx.lineWidth = Math.max(2, r * 0.12)
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.fillStyle = TEACHER_LOOK.accessoryColor
  // board
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.55)
  ctx.lineTo(r * 0.75, -r * 0.2)
  ctx.lineTo(0, r * 0.15)
  ctx.lineTo(-r * 0.75, -r * 0.2)
  ctx.closePath()
  ctx.fill()
  // band
  ctx.fillRect(-r * 0.38, -r * 0.05, r * 0.76, r * 0.45)
  // tassel
  ctx.fillRect(r * 0.5, -r * 0.2, r * 0.08, r * 0.55)
  ctx.restore()
}

export function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  answeredNpc: boolean,
  assets: LoaderImageAssets | undefined,
  npc: NPC,
  anim: NpcRenderAnim = { t: 0, isSelected: false, isHovered: false }
) {
  const { id, imageKey } = npc

  const assetFor = (key?: string | null) => {
    if (!key || !assets) return undefined
    return assets[key as keyof LoaderImageAssets] as
      | HTMLImageElement
      | undefined
  }

  const BORDER_RADIUS = 12
  const BORDER_WIDTH = 4
  let imgDrawn = false

  const theme = canvasTheme()
  const animated = answeredNpc
    ? { scale: 1, glowAlpha: 0 }
    : computeNpcAnimation({ t: anim.t, isSelected: anim.isSelected, isHovered: anim.isHovered })
  // Reduced motion: keep the glow (it marks who you can talk to) but stop the pulsing.
  const scale = anim.reduceMotion ? 1 : animated.scale
  const glowAlpha = anim.reduceMotion && animated.glowAlpha > 0 ? 0.8 : animated.glowAlpha

  const figureSide = anim.figureSide ?? DEFAULT_FIGURE_SIDE

  /** The framed box every unicorn stands in (the same for a picture and for a drawn one): glow, `paint` inside, outline, teacher badge. */
  const drawFramed = (paint: (w: number, h: number) => void) => {
    const displayW = figureSide
    const displayH = figureSide

    // Glow ring behind the portrait when selected/hovered
    if (glowAlpha > 0) {
      ctx.save()
      ctx.globalAlpha = 0.6 * glowAlpha
      ctx.shadowColor = theme.gold400
      ctx.shadowBlur = 26
      ctx.fillStyle = withAlpha(theme.gold400, 0.9)
      roundRect(
        ctx,
        x - (displayW / 2) * scale - 6,
        y - (displayH / 2) * scale - 6,
        displayW * scale + 12,
        displayH * scale + 12,
        BORDER_RADIUS + 6
      )
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.translate(-displayW / 2, -displayH / 2)

    ctx.save()
    ctx.beginPath()
    roundRect(ctx, 0, 0, displayW, displayH, BORDER_RADIUS)
    ctx.clip()
    paint(displayW, displayH)
    ctx.restore()

    ctx.save()
    // Answered unicorns settle into a quiet outline; open ones keep a moon-lit one.
    ctx.lineWidth = BORDER_WIDTH
    ctx.strokeStyle = answeredNpc
      ? withAlpha(theme.moon300, 0.35)
      : withAlpha(theme.moon50, 0.85)
    roundRect(ctx, 0, 0, displayW, displayH, BORDER_RADIUS)
    ctx.stroke()
    ctx.restore()

    if (isTeacher(npc)) drawTeacherBadge(ctx, displayW - 6, 6, displayW * 0.17)

    ctx.restore()

    imgDrawn = true
  }

  const drawImageWithBorder = (img: HTMLImageElement) =>
    // Same box for every unicorn: crop the picture to fit, never stretch it.
    drawFramed((w, h) => {
      const crop = coverCrop(img, w, h)
      ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h)
    })

  // 0) a look: the unicorn drawn in code, the same one as in the 3D view, on a soft backdrop of its own colours.
  if (anim.look) {
    const look = anim.look
    drawFramed((w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, lighten(mix(look.mane[0] ?? look.coat, '#ffffff', 0.55), 0.2))
      g.addColorStop(1, lighten(look.coat, 0.35))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      // a soft floor under its hooves
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.fillRect(0, h * 0.86, w, h * 0.14)
      drawUnicorn2D(ctx, look, w * 0.47, h * 0.9, w * 0.78, { t: anim.t, phase: anim.phase, reduceMotion: anim.reduceMotion })
    })
    return
  }

  // 1) preferred: npc.imageKey -> assets[npc.imageKey]
  if (imageKey) {
    const img = assetFor(imageKey)
    if (img) drawImageWithBorder(img)
  }

  // 2) fallback: id like "stage7-npc3" -> "stage7Npc3"
  if (!imgDrawn && id) {
    const m = /^stage(\d+)-npc(\d+)$/i.exec(id)
    if (m) {
      const img = assetFor(`stage${m[1]}Npc${m[2]}`)
      if (img) drawImageWithBorder(img)
    }
  }

  // 3) final fallback: placeholder
  if (!imgDrawn) {
    const r = 26 * (figureSide / DEFAULT_FIGURE_SIDE)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = answeredNpc ? theme.moon300 : theme.moon50
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(0, -r - 8)
    ctx.lineTo(10, -r + 8)
    ctx.lineTo(-10, -r + 8)
    ctx.closePath()
    ctx.fillStyle = answeredNpc ? theme.dusk600 : theme.rose400
    ctx.fill()
    ctx.restore()
  }
}
