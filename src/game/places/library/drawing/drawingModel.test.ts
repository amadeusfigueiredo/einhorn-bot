import { describe, expect, it } from 'vitest'
import { BRUSHES, COLOURS, ERASER, MAX_POINTS, MAX_STROKES, MIN_STEP, PAPER, extendStroke, fitPaper, hasRoom, paintDrawing, paintStroke, parseDrawing, pointsIn, startStroke, type Stroke } from './drawingModel'

type Call = { name: string; args: unknown[] }
/** A pretend canvas that writes down the drawing commands it is given. */
function recorder() {
  const calls: Call[] = []
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, name: string) => (...args: unknown[]) => void calls.push({ name, args }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D
  return { ctx, calls }
}

const line = (n: number): Stroke => ({ color: COLOURS[0].color, width: 0.01, points: Array.from({ length: n }, (_, i) => [i / Math.max(1, n), 0.5] as const) })

describe('the paints and brushes', () => {
  it('are eight colours and an eraser the colour of the paper, each of its own', () => {
    expect(COLOURS).toHaveLength(10)
    expect(new Set(COLOURS.map((c) => c.id)).size).toBe(10)
    expect(new Set(COLOURS.map((c) => c.color)).size).toBe(10)
    expect(COLOURS.find((c) => c.id === ERASER)!.color).toBe(PAPER)
    expect(COLOURS.filter((c) => c.color === PAPER)).toHaveLength(1)
  })

  it('has three brushes, each thicker than the one before', () => {
    expect(BRUSHES.map((b) => b.id)).toEqual(['thin', 'medium', 'thick'])
    expect(BRUSHES[0].width).toBeLessThan(BRUSHES[1].width)
    expect(BRUSHES[1].width).toBeLessThan(BRUSHES[2].width)
  })
})

describe('a stroke grows', () => {
  it('starts as a dot where the pen came down, kept inside the paper and rounded to three places', () => {
    expect(startStroke('#E8434F', 0.01, 0.123456, 0.987654).points).toEqual([[0.123, 0.988]])
    expect(startStroke('#E8434F', 0.01, -3, 7).points).toEqual([[0, 1]])
  })

  it('takes a point when the pen moves a little way, and not when it hardly moves', () => {
    const dot = startStroke('#E8434F', 0.01, 0.5, 0.5)
    expect(extendStroke(dot, 0.5 + MIN_STEP / 2, 0.5, 100)).toBe(dot)
    const longer = extendStroke(dot, 0.6, 0.5, 100)
    expect(longer.points).toEqual([[0.5, 0.5], [0.6, 0.5]])
    expect(dot.points).toHaveLength(1)
  })

  it('stops growing when the page has no room for more points', () => {
    const dot = startStroke('#E8434F', 0.01, 0.5, 0.5)
    expect(extendStroke(dot, 0.9, 0.9, 0)).toBe(dot)
    expect(extendStroke(dot, 0.9, 0.9, -5)).toBe(dot)
  })

  it('keeps the pen on the paper', () => {
    const dot = startStroke('#E8434F', 0.01, 0.5, 0.5)
    expect(extendStroke(dot, 5, -5, 100).points[1]).toEqual([1, 0])
  })
})

describe('how much the paper holds', () => {
  it('counts the points in all and says when there is no room for another stroke', () => {
    expect(pointsIn([])).toBe(0)
    expect(pointsIn([line(10), line(5)])).toBe(15)
    expect(hasRoom([])).toBe(true)
    expect(hasRoom(Array.from({ length: MAX_STROKES }, () => line(1)))).toBe(false)
    expect(hasRoom([line(MAX_POINTS)])).toBe(false)
    expect(hasRoom([line(MAX_POINTS - 1)])).toBe(true)
  })
})

describe('painting', () => {
  it('fits the paper into a space, keeping its shape: as wide as fits across, or as high as fits down', () => {
    expect(fitPaper(900, 900)).toBe(900)
    expect(fitPaper(600, 1000)).toBe(600)
    expect(fitPaper(1000, 300)).toBe(450)
    expect(fitPaper(1000.7, 2000)).toBe(1000)
    expect(fitPaper(0, 0)).toBe(1)
  })

  it('paints the paper first and then every stroke in the colour and the thickness of its brush', () => {
    const { ctx, calls } = recorder()
    paintDrawing(ctx, [line(4), { ...line(3), color: COLOURS[4].color, width: 0.04 }], 960)
    const names = calls.map((c) => c.name)
    expect(names[0]).toBe('fillRect')
    expect(names.filter((n) => n === 'stroke')).toHaveLength(2)
    expect(calls.find((c) => c.name === 'fillRect')!.args).toEqual([0, 0, 960, 640])
  })

  it('a stroke of one point is a dot, as wide as the brush', () => {
    const { ctx, calls } = recorder()
    paintStroke(ctx, startStroke(COLOURS[1].color, 0.04, 0.5, 0.5), 960)
    const arc = calls.find((c) => c.name === 'arc')!
    expect(arc.args.slice(0, 3)).toEqual([480, 320, 0.04 * 960 / 2])
    expect(calls.some((c) => c.name === 'fill')).toBe(true)
    expect(calls.some((c) => c.name === 'stroke')).toBe(false)
  })

  it('a thin dot is still seen', () => {
    const { ctx, calls } = recorder()
    paintStroke(ctx, startStroke(COLOURS[1].color, 0.0001, 0.5, 0.5), 960)
    expect(calls.find((c) => c.name === 'arc')!.args[2]).toBeGreaterThanOrEqual(0.5)
  })

  it('goes from point to point, a fraction of the width across and of the height down', () => {
    const { ctx, calls } = recorder()
    paintStroke(ctx, { color: '#E8434F', width: 0.01, points: [[0, 0], [0.5, 1], [1, 0.5]] }, 960)
    expect(calls.filter((c) => c.name === 'moveTo').map((c) => c.args)).toEqual([[0, 0]])
    expect(calls.filter((c) => c.name === 'lineTo').map((c) => c.args)).toEqual([[480, 640], [960, 320]])
  })

  it('can paint only the last bit of a stroke that is being drawn', () => {
    const { ctx, calls } = recorder()
    paintStroke(ctx, { color: '#E8434F', width: 0.01, points: [[0, 0], [0.5, 0.5], [1, 1]] }, 960, 1)
    expect(calls.filter((c) => c.name === 'moveTo').map((c) => c.args)).toEqual([[480, 320]])
    expect(calls.filter((c) => c.name === 'lineTo')).toHaveLength(1)
    const { ctx: c2, calls: calls2 } = recorder()
    paintStroke(c2, { color: '#E8434F', width: 0.01, points: [[0, 0], [1, 1]] }, 960, 9)
    expect(calls2.filter((c) => c.name === 'lineTo')).toHaveLength(1)
  })
})

describe('reading what was saved', () => {
  const good: Stroke[] = [line(3), { ...line(2), color: COLOURS[5].color }]

  it('gives back a drawing that was written', () => {
    expect(parseDrawing(JSON.parse(JSON.stringify(good)))).toEqual(good)
    expect(parseDrawing([])).toEqual([])
  })

  it('refuses what is not a list', () => {
    for (const bad of [null, 'x', 3, {}, undefined]) expect(parseDrawing(bad), String(bad)).toBeNull()
  })

  it('leaves out a stroke that is not one and keeps the rest', () => {
    const rubbish = [
      null,
      'x',
      { color: '#123456', width: 0.01, points: [[0.1, 0.1]] },
      { color: COLOURS[0].color, width: 'thick', points: [[0.1, 0.1]] },
      { color: COLOURS[0].color, width: 5, points: [[0.1, 0.1]] },
      { color: COLOURS[0].color, width: 0.01, points: [] },
      { color: COLOURS[0].color, width: 0.01, points: [[2, 0.1]] },
      { color: COLOURS[0].color, width: 0.01, points: [[0.1]] },
      { color: COLOURS[0].color, width: 0.01, points: 'x' },
      good[0],
    ]
    expect(parseDrawing(rubbish)).toEqual([good[0]])
  })

  it('cuts off what is more than the paper holds', () => {
    const many = Array.from({ length: MAX_STROKES + 20 }, () => line(2))
    expect(parseDrawing(many)).toHaveLength(MAX_STROKES)
    const long = [line(MAX_POINTS - 5), line(10), line(2)]
    expect(parseDrawing(long)).toEqual([long[0]])
  })
})
