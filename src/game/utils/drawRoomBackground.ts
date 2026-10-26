import type { DecorId, FloorKind, RoomSpec, WindowView, Zone } from '../data/classrooms'
import { lighten, mix } from './color'

/**
 * The room of a stage drawn in code, for the 2D view: the stages that have no background picture of their own use it.
 * It reads the same `RoomSpec` as the 3D classroom (colours, floor, window view, what stands where), so a stage looks
 * like itself in both views. Soft, round and pastel like the rest; no pictures, nothing random (a stage always looks the same).
 */

/** What shape a piece of decor is drawn as. Anything not listed is a soft blob. */
type Shape = 'ball' | 'stem' | 'box' | 'star' | 'arch'

const SHAPES: Partial<Record<DecorId, Shape>> = {
  donut: 'ball', rollDonut: 'ball', bouncyBall: 'ball', balloon: 'ball', planetSmall: 'ball', planetRinged: 'ball', planetMobile: 'ball', earth: 'ball', moon: 'ball', bubble: 'ball', iceCream: 'ball', globe: 'ball', seaShell: 'ball', clam: 'ball', glowMushroom: 'ball', mushroom: 'ball', crater: 'ball',
  lollipop: 'stem', starLollipop: 'stem', funnyFlower: 'stem', sunFlower: 'stem', roseBush: 'stem', rosePot: 'stem', plantPot: 'stem', palm: 'stem', bigTree: 'stem', eucalyptus: 'stem', lantern: 'stem', glowPlant: 'stem', seaweed: 'stem', coral: 'stem', musicStand: 'stem', easel: 'stem', umbrella: 'stem', telescope: 'stem', surfboard: 'stem', lilyPad: 'stem',
  chalkboard: 'box', frame: 'box', bookshelf: 'box', desk: 'box', piano: 'box', drum: 'box', aquarium: 'box', castle: 'box', igloo: 'box', lighthouse: 'box', stoneTower: 'box', donutTower: 'box', cake: 'box', cupcake: 'box', macaronStool: 'box', sculpture: 'box', cliff: 'box', abacus: 'box', numberBlocks: 'box', letterBlocks: 'box', geoShapes: 'box', flaskSet: 'box', beaker: 'box', paintPots: 'box', book: 'box', awning: 'box', sandcastle: 'box', snowman: 'box', pool: 'box', ufo: 'box', rocket: 'box',
  starField: 'star', comet: 'star', noteFloat: 'star', petal: 'star', feather: 'star', crystal: 'star', spotlight: 'star', bird: 'star', steam: 'star', floatingIsland: 'arch',
  rainbowArch: 'arch', rainbowCloud: 'arch', cloud: 'arch', waterfall: 'arch', paintFall: 'arch', aurora: 'arch',
}

/** A soft shape's colour: the accent for most things, with the room's sparkle and floor colours for variety. */
const tint = (room: RoomSpec, i: number) => [room.palette.accent, room.palette.sparkle, room.palette.floorAlt, lighten(room.palette.accent, 0.35)][i % 4]

/** Where on the screen a zone's pieces go: `horizon` is where the wall meets the floor. The same zone always gives the same slots. */
function slots(zone: Zone, count: number, w: number, h: number, horizon: number): { x: number; y: number; s: number }[] {
  const spread = (n: number, from: number, to: number) => Array.from({ length: n }, (_, i) => from + ((i + 0.5) / n) * (to - from))
  const unit = Math.min(w, h)
  switch (zone) {
    case 'backWall': return spread(count, 0.3, 0.7).map((x) => ({ x: x * w, y: horizon - unit * 0.12, s: unit * 0.13 }))
    case 'leftWall': return spread(count, 0.04, 0.2).map((x) => ({ x: x * w, y: horizon - unit * 0.06, s: unit * 0.1 }))
    case 'rightWall': return spread(count, 0.8, 0.96).map((x) => ({ x: x * w, y: horizon - unit * 0.06, s: unit * 0.1 }))
    case 'cornersBack': return [0.1, 0.9].slice(0, Math.max(1, count)).map((x) => ({ x: x * w, y: horizon + unit * 0.03, s: unit * 0.09 }))
    case 'cornersFront': return [0.07, 0.93].slice(0, Math.max(1, count)).map((x) => ({ x: x * w, y: h - unit * 0.1, s: unit * 0.12 }))
    case 'frontEdge': return spread(count, 0.2, 0.8).map((x) => ({ x: x * w, y: h - unit * 0.05, s: unit * 0.07 }))
    case 'sky': return spread(count, 0.12, 0.88).map((x, i) => ({ x: x * w, y: horizon * (0.16 + 0.1 * (i % 3)), s: unit * 0.05 }))
  }
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.45
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
}

/** One piece of decor, standing with its foot at (x, y), `s` big. */
function drawProp(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, s: number, color: string, soft: string) {
  ctx.save()
  // The little shadow it stands in.
  if (shape !== 'star') blob(ctx, x, y, s * 0.75, s * 0.18, 'rgba(60, 30, 90, 0.14)')
  if (shape === 'ball') {
    blob(ctx, x, y - s * 0.7, s * 0.7, s * 0.7, color)
    blob(ctx, x - s * 0.25, y - s * 0.95, s * 0.22, s * 0.16, soft)
  } else if (shape === 'stem') {
    ctx.strokeStyle = mix(color, '#2f7a4f', 0.55)
    ctx.lineWidth = Math.max(2, s * 0.1)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y - s * 1.2)
    ctx.stroke()
    blob(ctx, x, y - s * 1.4, s * 0.5, s * 0.5, color)
    blob(ctx, x, y - s * 1.4, s * 0.2, s * 0.2, soft)
  } else if (shape === 'box') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x - s * 0.6, y - s * 1.3, s * 1.2, s * 1.3, s * 0.2)
    ctx.fill()
    ctx.fillStyle = soft
    ctx.beginPath()
    ctx.roundRect(x - s * 0.45, y - s * 1.15, s * 0.9, s * 0.45, s * 0.14)
    ctx.fill()
  } else if (shape === 'star') {
    starPath(ctx, x, y, s)
    ctx.fillStyle = color
    ctx.fill()
  } else {
    // arch: a soft band, like a rainbow or a cloud over the wall
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 0 ? color : i === 1 ? soft : lighten(color, 0.5)
      ctx.lineWidth = s * 0.28
      ctx.beginPath()
      ctx.arc(x, y - s * 0.4, s * (1.15 - i * 0.28), Math.PI, 0)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** What shows through a window: a view of the world outside, inside the box (x, y, w, h). */
function drawView(ctx: CanvasRenderingContext2D, view: WindowView, room: RoomSpec, x: number, y: number, w: number, h: number) {
  const p = room.palette
  const night = room.time === 'night'
  const sky = ctx.createLinearGradient(0, y, 0, y + h)
  const top = view === 'underwater' ? '#7fd0e8' : night ? '#150f3a' : room.time === 'sunset' ? '#ff9e7a' : '#9ad8ff'
  sky.addColorStop(0, top)
  sky.addColorStop(1, view === 'underwater' ? '#2a7fb8' : night ? '#3a2a7a' : room.time === 'sunset' ? '#ffd9a0' : '#e8f7ff')
  ctx.fillStyle = sky
  ctx.fillRect(x, y, w, h)
  const cloud = (cx: number, cy: number, r: number) => {
    blob(ctx, cx, cy, r, r * 0.55, 'rgba(255,255,255,0.9)')
    blob(ctx, cx + r * 0.6, cy + r * 0.1, r * 0.7, r * 0.45, 'rgba(255,255,255,0.9)')
  }
  const hill = (cy: number, color: string) => blob(ctx, x + w * 0.5, cy, w * 0.75, h * 0.35, color)
  switch (view) {
    case 'stars':
    case 'moon':
      for (let i = 0; i < 9; i++) {
        starPath(ctx, x + ((i * 37) % 100) * (w / 100), y + ((i * 53) % 70) * (h / 100), Math.max(2, w * 0.04))
        ctx.fillStyle = p.sparkle
        ctx.fill()
      }
      if (view === 'moon') blob(ctx, x + w * 0.7, y + h * 0.3, w * 0.16, w * 0.16, '#fff6d8')
      break
    case 'clouds':
    case 'rainbow':
      cloud(x + w * 0.3, y + h * 0.35, w * 0.16)
      cloud(x + w * 0.7, y + h * 0.6, w * 0.13)
      if (view === 'rainbow') {
        ;['#ff7e9e', '#ffd166', '#6ee7c8', '#8ec5ff'].forEach((c, i) => {
          ctx.strokeStyle = c
          ctx.lineWidth = w * 0.05
          ctx.beginPath()
          ctx.arc(x + w / 2, y + h * 0.95, w * (0.42 - i * 0.06), Math.PI, 0)
          ctx.stroke()
        })
      }
      break
    case 'sea':
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = mix('#3a9ad6', '#8ec5ff', i / 3)
        ctx.fillRect(x, y + h * (0.55 + i * 0.15), w, h)
      }
      blob(ctx, x + w * 0.3, y + h * 0.4, w * 0.12, w * 0.12, '#fff3a0')
      break
    case 'meadow':
    case 'forest':
      hill(y + h * 0.95, '#a8e6a0')
      hill(y + h * 1.1, '#7fd08a')
      if (view === 'forest') for (let i = 0; i < 3; i++) blob(ctx, x + w * (0.2 + i * 0.3), y + h * 0.6, w * 0.1, h * 0.25, '#4fb27a')
      cloud(x + w * 0.65, y + h * 0.3, w * 0.12)
      break
    case 'underwater':
      for (let i = 0; i < 6; i++) blob(ctx, x + ((i * 41) % 90) * (w / 100) + w * 0.05, y + h * (0.85 - i * 0.13), w * 0.04, w * 0.04, 'rgba(255,255,255,0.7)')
      break
    case 'aurora':
      ;[p.sparkle, '#6ee7c8', '#b79cff'].forEach((c, i) => {
        ctx.globalAlpha = 0.5
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.ellipse(x + w * (0.3 + i * 0.2), y + h * 0.4, w * 0.12, h * 0.4, 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })
      break
    case 'canyon':
      hill(y + h * 1.0, '#c9623a')
      hill(y + h * 1.12, '#a35a3a')
      break
    case 'waterfall':
      ctx.fillStyle = '#bfe8ff'
      ctx.fillRect(x + w * 0.4, y, w * 0.2, h)
      hill(y + h * 1.05, '#7fd08a')
      break
    case 'storm':
      blob(ctx, x + w * 0.5, y + h * 0.3, w * 0.35, h * 0.2, '#5a5a86')
      break
    // ('none' is never drawn: the room leaves out the window)
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, room: RoomSpec, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, [w / 2, w / 2, w * 0.1, w * 0.1])
  ctx.clip()
  drawView(ctx, room.walls.windows, room, x, y, w, h)
  ctx.restore()
  ctx.strokeStyle = lighten(room.palette.accent, 0.2)
  ctx.lineWidth = Math.max(3, w * 0.07)
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, [w / 2, w / 2, w * 0.1, w * 0.1])
  ctx.stroke()
}

/** The floor in perspective: a gradient from the wall to the front, with the pattern of what it is made of. */
function drawFloor(ctx: CanvasRenderingContext2D, room: RoomSpec, kind: FloorKind, w: number, h: number, horizon: number) {
  const { floor, floorAlt } = room.palette
  const g = ctx.createLinearGradient(0, horizon, 0, h)
  g.addColorStop(0, mix(floor, room.palette.wall, 0.25))
  g.addColorStop(1, floor)
  ctx.fillStyle = g
  ctx.fillRect(0, horizon, w, h - horizon)
  const rows = 6
  // Row edges get further apart toward the front, like a floor seen from above and behind.
  const rowY = (i: number) => horizon + (h - horizon) * Math.pow(i / rows, 1.6)
  if (kind === 'checker' || kind === 'tiles' || kind === 'stone' || kind === 'ice') {
    // Tiles in perspective: the columns lean toward the middle of the horizon, so every row lines up with the next.
    const cols = 14
    const spread = (y: number) => 0.3 + 1.25 * ((y - horizon) / (h - horizon))
    const edgeX = (c: number, y: number) => w / 2 + (c - cols / 2) * (w / cols) * spread(y)
    for (let r = 0; r < rows; r++) {
      const y0 = rowY(r)
      const y1 = rowY(r + 1)
      for (let c = 0; c < cols; c++) {
        const quad = () => {
          ctx.beginPath()
          ctx.moveTo(edgeX(c, y0), y0)
          ctx.lineTo(edgeX(c + 1, y0), y0)
          ctx.lineTo(edgeX(c + 1, y1), y1)
          ctx.lineTo(edgeX(c, y1), y1)
          ctx.closePath()
        }
        if (kind === 'checker' && (r + c) % 2 === 0) {
          quad()
          ctx.fillStyle = floorAlt
          ctx.fill()
        } else if (kind !== 'checker') {
          quad()
          ctx.strokeStyle = 'rgba(255,255,255,0.28)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }
    }
  } else if (kind === 'wood') {
    ctx.strokeStyle = mix(floor, floorAlt, 0.6)
    ctx.lineWidth = 2
    for (let i = 1; i < rows * 2; i++) {
      const y = rowY(i / 2)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  } else if (kind === 'carpet') {
    blob(ctx, w / 2, horizon + (h - horizon) * 0.55, w * 0.42, (h - horizon) * 0.38, floorAlt)
    ctx.strokeStyle = room.palette.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(w / 2, horizon + (h - horizon) * 0.55, w * 0.4, (h - horizon) * 0.35, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (kind === 'water') {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2
    for (let i = 1; i < rows; i++)
      for (let c = 0; c < 6; c++) {
        ctx.beginPath()
        ctx.arc(((c + 0.5 + (i % 2) * 0.5) * w) / 6, rowY(i), (w / 40) * (1 + i * 0.3), Math.PI, 0)
        ctx.stroke()
      }
  } else {
    // sand, grass, moon, cloud: soft speckles that grow toward the front
    for (let i = 0; i < 40; i++) {
      const y = rowY(1 + ((i * 7) % (rows * 4)) / 4)
      const x = ((i * 97) % 100) * (w / 100)
      const r = ((y - horizon) / (h - horizon)) * (kind === 'cloud' ? 26 : kind === 'moon' ? 14 : 5) + 2
      blob(ctx, x, y, r, r * (kind === 'cloud' || kind === 'moon' ? 0.45 : 1), kind === 'cloud' ? 'rgba(255,255,255,0.7)' : floorAlt)
    }
  }
}

export function drawRoomBackground(ctx: CanvasRenderingContext2D, room: RoomSpec, width: number, height: number): void {
  const { palette, walls } = room
  const horizon = height * 0.46
  ctx.save()

  // The wall: lighter at the top, with a warm trim where it meets the floor.
  const wall = ctx.createLinearGradient(0, 0, 0, horizon)
  wall.addColorStop(0, lighten(palette.wall, 0.3))
  wall.addColorStop(1, palette.wall)
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, width, horizon)
  if (!walls.back) {
    // An open-air world: the sky goes all the way down.
    ctx.fillStyle = palette.sky
    ctx.fillRect(0, 0, width, horizon)
  }

  // Windows: a pair, or one big one, each showing the world outside.
  if (walls.windows !== 'none') {
    const ww = Math.min(width * 0.16, horizon * 0.62)
    const wh = horizon * 0.62
    const y = horizon * 0.12
    for (const cx of [width * 0.28, width * 0.72]) drawWindow(ctx, room, cx - ww / 2, y, ww, wh)
  }

  drawFloor(ctx, room, room.floor, width, height, horizon)
  ctx.fillStyle = palette.accent
  ctx.fillRect(0, horizon - 4, width, 8)

  // The decor, back to front: pieces higher on the screen first, so nearer ones stand over them.
  const order: Zone[] = ['sky', 'backWall', 'leftWall', 'rightWall', 'cornersBack', 'frontEdge', 'cornersFront']
  let n = 0
  for (const zone of order) {
    for (const piece of room.decor.filter((d) => d.zone === zone)) {
      const shape = SHAPES[piece.kind] ?? 'ball'
      for (const slot of slots(zone, piece.count ?? 1, width, height, horizon)) {
        drawProp(ctx, shape, slot.x, slot.y, slot.s, tint(room, n), lighten(tint(room, n + 1), 0.45))
        n++
      }
    }
  }

  // A few sparkles, and a soft edge so the middle (where the figures stand) is the brightest.
  for (let i = 0; i < 14; i++) {
    starPath(ctx, ((i * 71) % 100) * (width / 100), ((i * 37) % 60) * (height / 100) + height * 0.04, Math.min(width, height) * 0.012)
    ctx.fillStyle = palette.sparkle
    ctx.fill()
  }
  const edge = ctx.createRadialGradient(width / 2, height * 0.55, Math.min(width, height) * 0.35, width / 2, height * 0.55, Math.max(width, height) * 0.75)
  edge.addColorStop(0, 'rgba(0,0,0,0)')
  edge.addColorStop(1, room.time === 'night' ? 'rgba(10,5,40,0.45)' : 'rgba(80,40,120,0.18)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
