/**
 * The drawing board of the library: what a drawing is, how it grows, and how it is painted. Pure (the canvas is given
 * to `paintStroke`), so a test can draw a whole picture. Places are fractions of the board (0 to 1 across, and 0 to 1 down its height) and
 * widths are fractions of its width, so the same drawing fits a board of any size.
 */
export type Point = readonly [number, number]

export type Stroke = {
  /** A colour of the palette, as written there (a stroke with the colour of the paper is the eraser). */
  color: string
  /** Fraction of the board's width. */
  width: number
  points: readonly Point[]
}

export const PAPER = '#FFFDF7'

export type ColourId = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'pink' | 'brown' | 'black' | 'eraser'
export type Colour = { id: ColourId; color: string }
/** The paints: eight colours and the paper's own (an eraser). */
export const COLOURS: readonly Colour[] = [
  { id: 'red', color: '#E8434F' },
  { id: 'orange', color: '#FF9A3D' },
  { id: 'yellow', color: '#FFD23F' },
  { id: 'green', color: '#4FBF6A' },
  { id: 'blue', color: '#3F8CE8' },
  { id: 'violet', color: '#8E5BD6' },
  { id: 'pink', color: '#FF7EC7' },
  { id: 'brown', color: '#8A5A33' },
  { id: 'black', color: '#2A1A52' },
  { id: 'eraser', color: PAPER },
]
export const ERASER: ColourId = 'eraser'

export type Brush = { id: 'thin' | 'medium' | 'thick'; width: number }
export const BRUSHES: readonly Brush[] = [
  { id: 'thin', width: 0.006 },
  { id: 'medium', width: 0.016 },
  { id: 'thick', width: 0.04 },
]

/** The most the paper holds: strokes, and points in all (a full page is a few hundred kilobytes of storage at most). */
export const MAX_STROKES = 300
export const MAX_POINTS = 15000
/** A point closer than this to the one before it is not kept. */
export const MIN_STEP = 0.002

/** The board is this much higher than wide. */
export const ASPECT = 2 / 3

/** How wide (pixels) the paper can be shown in a space `width` by `height`: as wide as fits, with its shape kept. */
export function fitPaper(width: number, height: number): number {
  return Math.max(1, Math.floor(Math.min(width, height / ASPECT)))
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const round3 = (n: number) => Math.round(n * 1000) / 1000

export function pointsIn(strokes: readonly Stroke[]): number {
  return strokes.reduce((n, s) => n + s.points.length, 0)
}

/** Can another stroke be started? */
export function hasRoom(strokes: readonly Stroke[]): boolean {
  return strokes.length < MAX_STROKES && pointsIn(strokes) < MAX_POINTS
}

/** A new stroke that is just a dot where the pen came down. */
export function startStroke(color: string, width: number, x: number, y: number): Stroke {
  return { color, width, points: [[round3(clamp01(x)), round3(clamp01(y))]] }
}

/**
 * The stroke with the pen moved on to (x, y), or the same stroke when the move is too small to matter or the stroke
 * is too long. `room` is how many points the whole page can still take.
 */
export function extendStroke(stroke: Stroke, x: number, y: number, room: number): Stroke {
  if (room <= 0) return stroke
  const nx = round3(clamp01(x))
  const ny = round3(clamp01(y))
  const last = stroke.points[stroke.points.length - 1]
  if (Math.hypot(nx - last[0], ny - last[1]) < MIN_STEP) return stroke
  return { ...stroke, points: [...stroke.points, [nx, ny]] }
}

/**
 * Paints a stroke, or only its last segment (`from` is where the segment starts: for a pen that is moving, the previous
 * point). A stroke of one point is a dot.
 */
export function paintStroke(g: CanvasRenderingContext2D, stroke: Stroke, size: number, from = 0): void {
  const { points } = stroke
  const high = size * ASPECT
  g.strokeStyle = stroke.color
  g.fillStyle = stroke.color
  g.lineWidth = Math.max(1, stroke.width * size)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  if (points.length === 1) {
    g.beginPath()
    g.arc(points[0][0] * size, points[0][1] * high, Math.max(0.5, (stroke.width * size) / 2), 0, Math.PI * 2)
    g.fill()
    return
  }
  g.beginPath()
  const start = Math.min(from, points.length - 2)
  g.moveTo(points[start][0] * size, points[start][1] * high)
  for (let i = start + 1; i < points.length; i++) g.lineTo(points[i][0] * size, points[i][1] * high)
  g.stroke()
}

/** The whole picture: the paper, then every stroke in turn (`size` is the board's width in pixels; its height is `ASPECT` times that). */
export function paintDrawing(g: CanvasRenderingContext2D, strokes: readonly Stroke[], size: number): void {
  g.fillStyle = PAPER
  g.fillRect(0, 0, size, size * ASPECT)
  for (const stroke of strokes) paintStroke(g, stroke, size)
}

function isPoint(value: unknown): value is Point {
  return Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)
}

/** What was saved, if it is a drawing we could have saved (a stroke that is not one is left out; too much is cut off). */
export function parseDrawing(value: unknown): Stroke[] | null {
  if (!Array.isArray(value)) return null
  const colours = new Set(COLOURS.map((c) => c.color))
  const strokes: Stroke[] = []
  let points = 0
  for (const raw of value) {
    const s = raw as Record<string, unknown> | null
    if (!s || typeof s.color !== 'string' || !colours.has(s.color) || typeof s.width !== 'number' || !(s.width > 0 && s.width <= 0.1)) continue
    if (!Array.isArray(s.points) || s.points.length === 0 || !s.points.every(isPoint)) continue
    if (strokes.length >= MAX_STROKES || points + s.points.length > MAX_POINTS) break
    points += s.points.length
    strokes.push({ color: s.color, width: s.width, points: s.points as Point[] })
  }
  return strokes
}
