import { wearing, type UnicornLook } from '../data/unicornLooks'
import { lighten, mix } from './color'

/**
 * A plush unicorn in side view, drawn in code from the same `UnicornLook` the 3D unicorns are built from (coat, mane
 * stripes, horn, spots, glitter, accessories), so a unicorn is the same one in both views. Round shapes, soft colours,
 * one big shining eye. `x, y` is where its hooves stand and `size` is about its body length. It faces right unless
 * `facingLeft`. It breathes, sways its tail and blinks; with `reduceMotion` it holds still.
 */
export type Unicorn2DOptions = {
  /** Seconds, for the idle motion. */
  t?: number
  facingLeft?: boolean
  reduceMotion?: boolean
  /** Which seconds of the idle loop it is at when it first stands (so a row of unicorns does not breathe in step). */
  phase?: number
}

const INK = '#2a1a52'

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.45
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function leg(ctx: CanvasRenderingContext2D, x: number, top: number, s: number, coat: string, hoof: string) {
  const w = s * 0.08
  ctx.fillStyle = coat
  ctx.beginPath()
  ctx.roundRect(x - w / 2, top, w, -top - s * 0.05, w / 2)
  ctx.fill()
  ctx.fillStyle = hoof
  ctx.beginPath()
  ctx.roundRect(x - w * 0.6, -s * 0.07, w * 1.2, s * 0.07, w * 0.4)
  ctx.fill()
}

function drawHorn(ctx: CanvasRenderingContext2D, look: UnicornLook, hx: number, hy: number, s: number) {
  const len = s * 0.24 * look.hornLength
  const base = s * 0.05
  ctx.save()
  ctx.translate(hx, hy)
  ctx.rotate(0.38)
  const type = look.hornType ?? 'straight'
  if (type === 'curved') {
    ctx.strokeStyle = look.horn
    ctx.lineCap = 'round'
    ctx.lineWidth = base * 1.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-len * 0.45, -len * 0.55, len * 0.25, -len)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-base, 0)
    ctx.lineTo(0, -len)
    ctx.lineTo(base, 0)
    ctx.closePath()
    ctx.fillStyle = type === 'rainbow' ? '#ffd166' : look.horn
    ctx.fill()
    if (type === 'rainbow') {
      ;['#ff6b8b', '#7be07f', '#6fa8ff', '#c9a7ff'].forEach((c, i) => {
        ctx.strokeStyle = c
        ctx.lineWidth = base * 0.5
        ctx.beginPath()
        ctx.moveTo(-base * (0.8 - i * 0.18), -len * (0.15 + i * 0.2))
        ctx.lineTo(base * (0.8 - i * 0.18), -len * (0.15 + i * 0.2))
        ctx.stroke()
      })
    }
    if (type === 'curly') {
      ctx.strokeStyle = lighten(look.horn, 0.5)
      ctx.lineWidth = base * 0.45
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.moveTo(-base * (1 - i * 0.2), -len * (i / 5.2))
        ctx.lineTo(base * (1 - i * 0.2), -len * (i / 5.2) - base * 0.5)
        ctx.stroke()
      }
    }
    if (type === 'star') star(ctx, 0, -len - base, base * 1.5, '#fff3a0')
  }
  ctx.restore()
}

function drawAccessories(ctx: CanvasRenderingContext2D, look: UnicornLook, s: number, head: { x: number; y: number }) {
  const bow = wearing(look, 'bow')
  if (bow) {
    ellipse(ctx, head.x - s * 0.1, head.y - s * 0.13, s * 0.06, s * 0.035, bow, -0.5)
    ellipse(ctx, head.x - s * 0.02, head.y - s * 0.16, s * 0.06, s * 0.035, bow, 0.5)
    ellipse(ctx, head.x - s * 0.06, head.y - s * 0.145, s * 0.025, s * 0.025, lighten(bow, 0.4))
  }
  const crown = wearing(look, 'crown')
  if (crown) {
    ctx.fillStyle = crown
    ctx.beginPath()
    const cx = head.x - s * 0.02
    const cy = head.y - s * 0.14
    ctx.moveTo(cx - s * 0.08, cy)
    ctx.lineTo(cx - s * 0.08, cy - s * 0.07)
    ctx.lineTo(cx - s * 0.04, cy - s * 0.03)
    ctx.lineTo(cx, cy - s * 0.08)
    ctx.lineTo(cx + s * 0.04, cy - s * 0.03)
    ctx.lineTo(cx + s * 0.08, cy - s * 0.07)
    ctx.lineTo(cx + s * 0.08, cy)
    ctx.closePath()
    ctx.fill()
  }
  const teacher = wearing(look, 'teacher')
  if (teacher) {
    // A graduation cap: a flat board over a band, with a tassel.
    ctx.fillStyle = teacher
    ctx.beginPath()
    ctx.moveTo(head.x - s * 0.02, head.y - s * 0.2)
    ctx.lineTo(head.x + s * 0.1, head.y - s * 0.15)
    ctx.lineTo(head.x - s * 0.02, head.y - s * 0.1)
    ctx.lineTo(head.x - s * 0.14, head.y - s * 0.15)
    ctx.closePath()
    ctx.fill()
    ctx.fillRect(head.x - s * 0.08, head.y - s * 0.14, s * 0.12, s * 0.05)
    ctx.fillRect(head.x + s * 0.09, head.y - s * 0.16, s * 0.012, s * 0.08)
  }
  const helmet = wearing(look, 'helmet')
  if (helmet) {
    ctx.fillStyle = helmet
    ctx.beginPath()
    ctx.arc(head.x - s * 0.02, head.y - s * 0.07, s * 0.15, Math.PI, 0)
    ctx.fill()
  }
  const phones = wearing(look, 'headphones')
  if (phones) {
    ctx.strokeStyle = phones
    ctx.lineWidth = s * 0.03
    ctx.beginPath()
    ctx.arc(head.x - s * 0.02, head.y - s * 0.02, s * 0.15, Math.PI * 1.05, Math.PI * 1.95)
    ctx.stroke()
    ellipse(ctx, head.x - s * 0.15, head.y, s * 0.04, s * 0.06, phones)
  }
  const flowers = wearing(look, 'flowers')
  if (flowers) for (let i = 0; i < 3; i++) ellipse(ctx, head.x - s * (0.12 - i * 0.07), head.y - s * (0.12 + (i % 2) * 0.03), s * 0.035, s * 0.035, i === 1 ? '#fff3a0' : flowers)
  const scarf = wearing(look, 'scarf')
  if (scarf) {
    ctx.strokeStyle = scarf
    ctx.lineWidth = s * 0.07
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(head.x - s * 0.16, head.y + s * 0.14)
    ctx.lineTo(head.x - s * 0.03, head.y + s * 0.2)
    ctx.stroke()
  }
  const pearls = wearing(look, 'pearls')
  if (pearls) for (let i = 0; i < 5; i++) ellipse(ctx, head.x - s * (0.16 - i * 0.03), head.y + s * (0.13 + Math.sin((i / 4) * Math.PI) * 0.04), s * 0.016, s * 0.016, pearls)
  // Glasses go over the eye.
  const glasses = wearing(look, 'glasses')
  const sun = wearing(look, 'sunglasses')
  const ex = head.x + s * 0.06
  const ey = head.y + s * 0.0
  if (glasses || (teacher && !sun)) {
    ctx.strokeStyle = glasses ?? INK
    ctx.lineWidth = s * 0.014
    ctx.beginPath()
    ctx.arc(ex, ey, s * 0.055, 0, Math.PI * 2)
    ctx.stroke()
  }
  if (sun) {
    ctx.fillStyle = sun
    ctx.beginPath()
    ctx.roundRect(ex - s * 0.07, ey - s * 0.045, s * 0.14, s * 0.09, s * 0.04)
    ctx.fill()
  }
}

export function drawUnicorn2D(ctx: CanvasRenderingContext2D, look: UnicornLook, x: number, y: number, size: number, opts: Unicorn2DOptions = {}): void {
  const s = size
  const t = opts.reduceMotion ? 0 : (opts.t ?? 0) + (opts.phase ?? 0)
  const breathe = Math.sin(t * 2) * 0.012
  const sway = Math.sin(t * 1.6) * 0.07
  const blink = !opts.reduceMotion && t % 4.2 > 4.05
  const body = { rx: s * 0.34 * Math.sqrt(look.build), ry: s * 0.21 * look.build }
  const bodyY = -s * 0.4
  const coat = look.coat
  const shade = mix(coat, '#7a5aa8', 0.22)
  const mane = look.mane.length ? look.mane : ['#c9a7ff']
  const hoof = (i: number) => look.hooves[i % look.hooves.length]

  ctx.save()
  ctx.translate(x, y)
  if (opts.facingLeft) ctx.scale(-1, 1)

  // Soft shadow on the ground.
  ellipse(ctx, 0, 0, s * 0.42, s * 0.05, 'rgba(60, 30, 90, 0.2)')

  ctx.save()
  ctx.scale(1, 1 + breathe)

  // Tail: stripes of the mane colours, swaying.
  ctx.lineCap = 'round'
  mane.slice(0, 4).forEach((c, i) => {
    ctx.strokeStyle = c
    ctx.lineWidth = s * 0.075
    ctx.beginPath()
    ctx.moveTo(-body.rx * 0.9, bodyY - s * 0.03)
    ctx.bezierCurveTo(-body.rx - s * 0.22, bodyY - s * (0.12 - i * 0.045), -body.rx - s * (0.18 + sway), bodyY + s * (0.16 + i * 0.03), -body.rx - s * (0.08 + sway), bodyY + s * (0.28 + i * 0.02))
    ctx.stroke()
  })

  // Far legs, then body, then near legs.
  leg(ctx, -body.rx * 0.55, bodyY + body.ry * 0.5, s, shade, hoof(1))
  leg(ctx, body.rx * 0.5, bodyY + body.ry * 0.5, s, shade, hoof(3))
  ellipse(ctx, 0, bodyY, body.rx, body.ry, coat)
  if (look.stripes) {
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(0, bodyY, body.rx, body.ry, 0, 0, Math.PI * 2)
    ctx.clip()
    look.stripes.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.globalAlpha = 0.8
      ctx.fillRect(-body.rx + (i * 2 * body.rx) / look.stripes!.length, bodyY - body.ry, (2 * body.rx) / look.stripes!.length + 1, body.ry * 2)
    })
    ctx.restore()
  }
  if (look.spots) {
    ellipse(ctx, -body.rx * 0.3, bodyY - body.ry * 0.1, s * 0.07, s * 0.06, look.spots)
    ellipse(ctx, body.rx * 0.25, bodyY + body.ry * 0.2, s * 0.05, s * 0.045, look.spots)
  }
  if (look.paintSpots) ['#ff7eb6', '#6fa8ff', '#ffd166', '#7be07f'].forEach((c, i) => ellipse(ctx, -body.rx * 0.5 + i * body.rx * 0.3, bodyY + (i % 2 ? 0.08 : -0.06) * s, s * 0.03, s * 0.03, c))
  if (look.glitter) for (let i = 0; i < 4; i++) star(ctx, -body.rx * 0.5 + i * body.rx * 0.32, bodyY + (i % 2 ? 0.07 : -0.07) * s, s * 0.022, look.glitter)
  leg(ctx, -body.rx * 0.3, bodyY + body.ry * 0.6, s, coat, hoof(0))
  leg(ctx, body.rx * 0.72, bodyY + body.ry * 0.6, s, coat, hoof(2))

  if (wearing(look, 'backpack')) {
    const bp = wearing(look, 'backpack')!
    ctx.fillStyle = bp
    ctx.beginPath()
    ctx.roundRect(-body.rx * 0.45, bodyY - body.ry * 1.05, s * 0.2, s * 0.2, s * 0.05)
    ctx.fill()
    ellipse(ctx, -body.rx * 0.45 + s * 0.1, bodyY - body.ry * 0.7, s * 0.04, s * 0.03, lighten(bp, 0.4))
  }

  // Neck and head.
  const head = { x: body.rx * 0.95, y: bodyY - s * 0.38 }
  ellipse(ctx, body.rx * 0.72, bodyY - s * 0.18, s * 0.12, s * 0.22, coat, 0.35)
  ellipse(ctx, head.x, head.y, s * 0.17, s * 0.15, coat)
  ellipse(ctx, head.x + s * 0.13, head.y + s * 0.05, s * 0.095, s * 0.075, lighten(coat, 0.25))
  ellipse(ctx, head.x + s * 0.17, head.y + s * 0.04, s * 0.012, s * 0.012, INK)
  // Ear, cheek, eye.
  ellipse(ctx, head.x - s * 0.06, head.y - s * 0.13, s * 0.035, s * 0.065, shade, -0.25)
  ellipse(ctx, head.x + s * 0.03, head.y + s * 0.07, s * 0.04, s * 0.025, 'rgba(255, 130, 170, 0.55)')
  if (blink) {
    ctx.strokeStyle = INK
    ctx.lineWidth = s * 0.012
    ctx.beginPath()
    ctx.moveTo(head.x + s * 0.03, head.y)
    ctx.lineTo(head.x + s * 0.09, head.y)
    ctx.stroke()
  } else {
    ellipse(ctx, head.x + s * 0.06, head.y, s * 0.032, s * 0.04, INK)
    ellipse(ctx, head.x + s * 0.07, head.y - s * 0.015, s * 0.012, s * 0.012, '#ffffff')
  }

  // Mane: tufts from the forehead down the neck, then a forelock.
  mane.forEach((c, i) => {
    const k = i / Math.max(1, mane.length - 1)
    ellipse(ctx, head.x - s * 0.08 - k * s * 0.1, head.y - s * 0.08 + k * s * 0.22, s * 0.07, s * 0.05, c, 0.9)
  })
  ellipse(ctx, head.x + s * 0.02, head.y - s * 0.14, s * 0.06, s * 0.04, mane[0], -0.4)
  drawHorn(ctx, look, head.x + s * 0.06, head.y - s * 0.12, s)
  drawAccessories(ctx, look, s, head)
  ctx.restore()
  ctx.restore()
}
