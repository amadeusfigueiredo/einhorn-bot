import type { AnimalType } from '../data/animals'
import { lighten, mix } from './color'

/**
 * The animals of the places in 2D: round, soft and friendly, one kind of body each (a koala's big grey ears, a capybara's
 * blunt snout, an owl's big eyes, a penguin's white belly, a parrot's red crown). Any other animal is a plain round critter
 * in its own colour. `x, y` is where its feet stand and `size` is about its height. They breathe a little; with
 * `reduceMotion` they are still.
 */
const BODY: Partial<Record<AnimalType, { body: string; belly: string }>> = {
  koala: { body: '#A9A9BC', belly: '#E8E8F2' },
  capybara: { body: '#B8845A', belly: '#D9B08A' },
  owl: { body: '#9A7050', belly: '#E8CFA8' },
  penguin: { body: '#2F3350', belly: '#FFFFFF' },
  parrot: { body: '#52C27A', belly: '#9BE3B0' },
  bunny: { body: '#F4E6EE', belly: '#FFFFFF' },
  frog: { body: '#6FCB6B', belly: '#C8F0B0' },
  hedgehog: { body: '#8A6A55', belly: '#E8CFB0' },
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

export function drawAnimal2D(ctx: CanvasRenderingContext2D, type: AnimalType, x: number, y: number, size: number, t = 0, reduceMotion = false): void {
  const palette = BODY[type] ?? { body: '#E8B5D4', belly: '#FFF0F7' }
  const s = size
  const breathe = reduceMotion ? 0 : Math.sin(t * 2.2) * 0.02
  ctx.save()
  ctx.translate(x, y)
  blob(ctx, 0, 0, s * 0.42, s * 0.06, 'rgba(60, 30, 90, 0.2)')
  ctx.scale(1, 1 + breathe)
  // body and belly
  blob(ctx, 0, -s * 0.3, s * 0.34, s * 0.3, palette.body)
  blob(ctx, 0, -s * 0.26, s * 0.2, s * 0.2, palette.belly)
  // feet
  blob(ctx, -s * 0.14, -s * 0.03, s * 0.09, s * 0.05, mix(palette.body, '#000000', 0.15))
  blob(ctx, s * 0.14, -s * 0.03, s * 0.09, s * 0.05, mix(palette.body, '#000000', 0.15))
  // head
  const hy = -s * 0.68
  blob(ctx, 0, hy, s * 0.27, s * 0.25, palette.body)
  if (type === 'koala') {
    blob(ctx, -s * 0.27, hy - s * 0.08, s * 0.12, s * 0.12, palette.body)
    blob(ctx, s * 0.27, hy - s * 0.08, s * 0.12, s * 0.12, palette.body)
    blob(ctx, -s * 0.27, hy - s * 0.08, s * 0.065, s * 0.065, lighten(palette.body, 0.5))
    blob(ctx, s * 0.27, hy - s * 0.08, s * 0.065, s * 0.065, lighten(palette.body, 0.5))
    blob(ctx, 0, hy + s * 0.05, s * 0.07, s * 0.09, '#3A3A4E')
  } else if (type === 'capybara') {
    blob(ctx, -s * 0.2, hy - s * 0.22, s * 0.05, s * 0.05, palette.body)
    blob(ctx, s * 0.2, hy - s * 0.22, s * 0.05, s * 0.05, palette.body)
    blob(ctx, 0, hy + s * 0.07, s * 0.15, s * 0.1, palette.belly)
    blob(ctx, -s * 0.05, hy + s * 0.06, s * 0.015, s * 0.015, '#3A2A24')
    blob(ctx, s * 0.05, hy + s * 0.06, s * 0.015, s * 0.015, '#3A2A24')
  } else if (type === 'owl') {
    blob(ctx, -s * 0.2, hy - s * 0.22, s * 0.06, s * 0.08, palette.body)
    blob(ctx, s * 0.2, hy - s * 0.22, s * 0.06, s * 0.08, palette.body)
    blob(ctx, -s * 0.11, hy - s * 0.02, s * 0.1, s * 0.1, '#FFFFFF')
    blob(ctx, s * 0.11, hy - s * 0.02, s * 0.1, s * 0.1, '#FFFFFF')
    blob(ctx, 0, hy + s * 0.07, s * 0.04, s * 0.05, '#F2B24C')
  } else if (type === 'penguin') {
    blob(ctx, 0, hy + s * 0.05, s * 0.2, s * 0.15, palette.belly)
    blob(ctx, 0, hy + s * 0.04, s * 0.05, s * 0.03, '#F2A23C')
  } else if (type === 'parrot') {
    blob(ctx, 0, hy - s * 0.2, s * 0.1, s * 0.07, '#FF6B6B')
    blob(ctx, 0, hy + s * 0.06, s * 0.06, s * 0.06, '#F2B24C')
  }
  // eyes (the owl has its own big ones)
  if (type !== 'owl') {
    blob(ctx, -s * 0.1, hy - s * 0.03, s * 0.035, s * 0.045, '#2A1A52')
    blob(ctx, s * 0.1, hy - s * 0.03, s * 0.035, s * 0.045, '#2A1A52')
    blob(ctx, -s * 0.09, hy - s * 0.045, s * 0.012, s * 0.012, '#FFFFFF')
    blob(ctx, s * 0.11, hy - s * 0.045, s * 0.012, s * 0.012, '#FFFFFF')
  } else {
    blob(ctx, -s * 0.11, hy - s * 0.02, s * 0.045, s * 0.055, '#2A1A52')
    blob(ctx, s * 0.11, hy - s * 0.02, s * 0.045, s * 0.055, '#2A1A52')
  }
  blob(ctx, -s * 0.17, hy + s * 0.05, s * 0.04, s * 0.025, 'rgba(255, 130, 170, 0.5)')
  blob(ctx, s * 0.17, hy + s * 0.05, s * 0.04, s * 0.025, 'rgba(255, 130, 170, 0.5)')
  ctx.restore()
}
