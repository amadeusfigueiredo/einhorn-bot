import { DOOR_THEMES, type DoorTheme } from '../../film/filmData'
import { classWindow } from '../../hall/hallData'
import { HALL, HALL_SECTIONS, hallDoorSpot, exitDoorSpot, roomDoorSpot, ROOM_DOORS, sectionGaps, sectionSpan, benchX, HALL_BENCH } from '../../hall/hallLayout'
import { HALL_WALKERS, walkerPlace } from '../../hall/hallFolk'
import { doorState, type DoorState } from '../../hall/progress'
import { bannerText, doorSignText } from '../../hall/hallText'
import { translate, type MessageId } from '../../i18n/translate'
import type { Lang } from '../../i18n/language'
import { RAINBOW, type UnicornLook } from '../../data/unicornLooks'
import type { AnimalType } from '../../data/animals'
import { BOOKS } from '../data/hangouts'
import { FRIEND_LOOKS } from '../data/friendLooks'
import { BARS } from '../library/xylophone'
import { bookSlot, LIBRARY_SPOTS } from '../library/libraryLayout'
import { TABLE_TOP } from '../library/libraryDims'
import { YARD_SPOTS, TRAMPOLINE_AT, BALL_START } from '../yard/yardLayout'
import { DOOR_SPOTS, DANCE_SKY, DOJO_SKY, LIBRARY_SKY, POOL_SKY, PONY_SKY, SCIENCE_SKY, SPORTS_SKY, TECH_SKY, YARD_SKY, AREAS, type RoomId } from '../placeLayout'
import { PLACE_DOOR_THEMES } from '../placeDoors'
import { roomsOpen } from '../roomsOpen'
import { ARCH_X, SPORTS } from '../sports/sportsData'
import type { PlaceId } from '../placeModel'
import { drawAnimal2D } from '../../utils/drawAnimal2D'
import { drawUnicorn2D } from '../../utils/drawUnicorn2D'
import { lighten, mix } from '../../utils/color'
import { depthScale, figureSize, project, type Frame } from './frame2d'

/** What the drawing needs to know besides where things are. */
export type Scene2D = {
  /** Seconds, for the idle motion. */
  t: number
  reduceMotion: boolean
  lang: Lang
  /** For each class, is it finished? (The corridor's doors show a star, the glow of the next one, or nothing.) */
  done: readonly boolean[]
}

/** Something to draw, and how far back it stands (so what is further away is drawn first). */
export type Drawable = { z: number; draw: () => void }

/** The colours of the corridor (the 3D corridor's, so the two views agree). */
const HC = { sky: '#E9DFFF', wall: '#E3D8FF', wainscot: '#C9B5FF', floor: '#FFF0F8', window: '#8FD3FF', pot: '#FF9E7E', leaf: '#5FBF6A', bench: '#C9935F' } as const

const SIGN_KEY: Record<PlaceId, MessageId> = { class: 'places.toClass', yard: 'places.toYard', library: 'places.toLibrary', hall: 'places.toHall', sports: 'places.toSports', pony: 'places.toPony', pool: 'places.toPool', dojo: 'places.toDojo', dance: 'places.toDance', tech: 'places.toTech', science: 'places.toScience' }

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[], fill: string) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

/** Is something at the world x on screen (with `margin` world units to spare)? */
function visible(f: Frame, x: number, margin = 3): boolean {
  const half = f.W / f.scale / 2
  return Math.abs(x - f.camX) <= half + margin
}

/** The line of floor between two depths, filled across the whole screen. */
/** The floor's colour from the horizon to the very bottom of the screen (the bands drawn over it stop at the front edge of the floor). */
function floorBase(ctx: CanvasRenderingContext2D, f: Frame, fill: string) {
  ctx.fillStyle = fill
  ctx.fillRect(0, f.horizon, f.W, f.H - f.horizon)
}

function floorBand(ctx: CanvasRenderingContext2D, f: Frame, z0: number, z1: number, fill: string) {
  const a = project(f, 0, z0).y
  const b = project(f, 0, z1).y
  ctx.fillStyle = fill
  ctx.fillRect(0, a, f.W, b - a)
}

/** A small round-topped sign over a door. */
function sign(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, u: number, maxWidth = u * 4.2) {
  const size = Math.max(10, u * 0.34)
  ctx.font = `700 ${size}px Fredoka, Nunito, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const w = Math.min(maxWidth, ctx.measureText(text).width + size)
  box(ctx, x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8, 'rgba(255, 255, 255, 0.92)')
  ctx.fillStyle = '#4A2E73'
  ctx.fillText(text, x, y, w - size * 0.5)
}

/**
 * A themed door standing on the floor at (x, y), `u` pixels to the world unit: an arched frame, the door, a knob, a
 * round window that shows the class inside, and its sign. The next one still to do glows and has a bouncing "New!"
 * badge; a finished one has a star over it; the others are plain (every door is open).
 */
export function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, theme: DoorTheme, label: string, opts: { state?: DoorState; windowColor?: string; badge?: string; t?: number; reduceMotion?: boolean; signWidth?: number } = {}) {
  const w = u * 2.3
  const h = u * 3.1
  const leaf = theme.door
  const trim = theme.trim
  ctx.save()
  if (opts.state === 'next') {
    const pulse = opts.reduceMotion ? 1 : 1 + Math.sin((opts.t ?? 0) * 3) * 0.06
    blob(ctx, x, y - h * 0.5, w * 0.85 * pulse, h * 0.62 * pulse, 'rgba(255, 240, 160, 0.45)')
  }
  // frame, arch, leaf
  box(ctx, x - w / 2 - u * 0.12, y - h - u * 0.12, w + u * 0.24, h + u * 0.12, [w / 2 + u * 0.12, w / 2 + u * 0.12, 0, 0], trim)
  box(ctx, x - w / 2, y - h, w, h, [w / 2, w / 2, 0, 0], leaf)
  // the round window, with the class behind the glass
  blob(ctx, x, y - h * 0.63, u * 0.5, u * 0.5, opts.windowColor ?? theme.glow)
  ctx.lineWidth = Math.max(2, u * 0.08)
  ctx.strokeStyle = lighten(trim, 0.4)
  ctx.beginPath()
  ctx.arc(x, y - h * 0.63, u * 0.5, 0, Math.PI * 2)
  ctx.stroke()
  blob(ctx, x + w * 0.3, y - h * 0.28, u * 0.09, u * 0.09, '#FFD166')
  if (opts.state === 'done') {
    ctx.fillStyle = '#FFD166'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = (i % 2 === 0 ? 0.3 : 0.13) * u
      ctx.lineTo(x + Math.cos(a) * r, y - h - u * 0.55 + Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
  }
  if (opts.badge) {
    const bounce = opts.reduceMotion ? 0 : Math.abs(Math.sin((opts.t ?? 0) * 4)) * u * 0.12
    const size = Math.max(10, u * 0.3)
    ctx.font = `700 ${size}px Fredoka, Nunito, sans-serif`
    const bw = ctx.measureText(opts.badge).width + size
    box(ctx, x - bw / 2, y - h - u * 0.85 - bounce, bw, size * 1.5, size * 0.75, '#FF7EB6')
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(opts.badge, x, y - h - u * 0.85 - bounce + size * 0.75)
  }
  sign(ctx, label, x, y - h - u * 0.3 - (opts.state === 'done' ? u * 0.4 : 0), u, opts.signWidth)
  ctx.restore()
}

/** The doors of the yard and the library (not the corridor's, which have their own), at the back wall. */
function placeDoors(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D, place: Exclude<RoomId, 'hall'>) {
  for (const [to, spot] of Object.entries(DOOR_SPOTS[place]) as [PlaceId, [number, number, number]][]) {
    if (!visible(f, spot[0])) continue
    const p = project(f, spot[0], spot[2])
    drawDoor(ctx, p.x, p.y, f.scale * p.k * 0.95, PLACE_DOOR_THEMES[to], translate(s.lang, SIGN_KEY[to]), { t: s.t, reduceMotion: s.reduceMotion })
  }
}

// ---- the sports hall ------------------------------------------------------------------------------------------------

function sportsBackdrop(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D) {
  const [top, bottom] = SPORTS_SKY
  const wall = ctx.createLinearGradient(0, 0, 0, f.horizon)
  wall.addColorStop(0, lighten(top, 0.25))
  wall.addColorStop(1, bottom)
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, f.W, f.horizon)
  floorBase(ctx, f, '#E8B878')
  floorBand(ctx, f, -AREAS.sports.halfD, AREAS.sports.halfD, '#E8B878')
  // the four archways, each of its own colour, with its name over it
  SPORTS.forEach((sport, i) => {
    const p = project(f, ARCH_X[i], -AREAS.sports.halfD + 0.3)
    const u = f.scale * p.k
    box(ctx, p.x - u * 1.25, p.y - u * 3.6, u * 2.5, u * 3.6, [u * 1.1, u * 1.1, 0, 0], sport.color)
    box(ctx, p.x - u * 0.95, p.y - u * 3.2, u * 1.9, u * 3.2, [u * 0.9, u * 0.9, 0, 0], lighten(sport.color, 0.45))
    sign(ctx, translate(s.lang, sport.labelKey), p.x, p.y - u * 3.75, u, u * 2.6)
  })
  placeDoors(ctx, f, s, 'sports')
}

// ---- the sports (in 2D only the room and its door: the games are in the 3D view) -----------------------------------

const SECTOR_LOOK: Partial<Record<RoomId, { sky: [string, string]; floor: string; fence?: boolean }>> = {
  pony: { sky: PONY_SKY, floor: '#A8DB8E', fence: true },
  pool: { sky: POOL_SKY, floor: '#8EC5FF' },
  dojo: { sky: DOJO_SKY, floor: '#E8D3A0' },
  dance: { sky: DANCE_SKY, floor: '#F6C6DD' },
  tech: { sky: TECH_SKY, floor: '#DCE6F5' },
  science: { sky: SCIENCE_SKY, floor: '#E8E0F5' },
}

function sectorBackdrop(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D) {
  const look = SECTOR_LOOK[f.place]!
  const [top, bottom] = look.sky
  const sky = ctx.createLinearGradient(0, 0, 0, f.horizon)
  sky.addColorStop(0, top)
  sky.addColorStop(1, bottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, f.W, f.horizon)
  floorBase(ctx, f, look.floor)
  floorBand(ctx, f, -AREAS[f.place].halfD, AREAS[f.place].halfD, look.floor)
  if (look.fence) {
    for (let x = f.W * 0.03; x < f.W; x += f.W * 0.06) box(ctx, x, f.horizon - f.scale * 0.9, f.scale * 0.14, f.scale * 1.1, 3, '#B98A5E')
    box(ctx, 0, f.horizon - f.scale * 0.55, f.W, f.scale * 0.1, 3, '#D2A276')
  }
  placeDoors(ctx, f, s, f.place as Exclude<RoomId, 'hall'>)
}

// ---- the library ----------------------------------------------------------------------------------------------------

function libraryBackdrop(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D) {
  const [top, bottom] = LIBRARY_SKY
  const wall = ctx.createLinearGradient(0, 0, 0, f.horizon)
  wall.addColorStop(0, lighten(top, 0.25))
  wall.addColorStop(1, bottom)
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, f.W, f.horizon)
  // the rainbow bookshelf along the back: three shelves of books
  const shelfTop = f.horizon * 0.2
  const rows = 3
  const rowH = (f.horizon - shelfTop - 4) / rows
  box(ctx, f.W * 0.1, shelfTop - 6, f.W * 0.8, f.horizon - shelfTop + 6, 8, '#8A5A33')
  for (let r = 0; r < rows; r++) {
    const y = shelfTop + r * rowH
    box(ctx, f.W * 0.11, y, f.W * 0.78, rowH - 4, 4, '#6F4526')
    const bw = Math.max(6, f.W / 90)
    for (let i = 0, x = f.W * 0.115; x < f.W * 0.88; i++, x += bw + 2) {
      const color = RAINBOW[(i * 3 + r * 2) % RAINBOW.length]
      const bh = rowH * (0.62 + ((i * 7 + r) % 4) * 0.08)
      box(ctx, x, y + rowH - 6 - bh, bw, bh, 2, color)
    }
  }
  // the window
  const ww = f.W * 0.1
  box(ctx, f.W * 0.02, f.horizon * 0.12, ww, f.horizon * 0.7, ww / 2, '#C7E8FF')
  floorBase(ctx, f, '#C98F55')
  floorBand(ctx, f, -AREAS.library.halfD, AREAS.library.halfD, '#C98F55')
  // wooden planks and the warm light
  ctx.strokeStyle = 'rgba(110, 60, 20, 0.22)'
  ctx.lineWidth = 2
  for (let i = 1; i < 9; i++) {
    const y = f.horizon + ((f.bottom - f.horizon) * i * i) / 81
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(f.W, y)
    ctx.stroke()
  }
  // the round rug under the table
  const t = project(f, LIBRARY_SPOTS.table.x, LIBRARY_SPOTS.table.z)
  const u = f.scale * t.k
  blob(ctx, t.x, t.y, u * 3.1, u * 1.2, '#B79CDD')
  blob(ctx, t.x, t.y, u * 2.5, u * 0.95, '#E7B3C8')
  placeDoors(ctx, f, s, 'library')
}

function libraryProps(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D): Drawable[] {
  const L = LIBRARY_SPOTS
  const at = (x: number, z: number) => {
    const p = project(f, x, z)
    return { ...p, u: f.scale * p.k }
  }
  const out: Drawable[] = []
  // the table with the five books standing in a fan
  out.push({
    z: L.table.z,
    draw: () => {
      const p = at(L.table.x, L.table.z)
      blob(ctx, p.x, p.y, p.u * 1.1, p.u * 0.3, 'rgba(60, 30, 90, 0.2)')
      box(ctx, p.x - p.u * 0.12, p.y - p.u * 0.7, p.u * 0.24, p.u * 0.7, 4, '#6F4526')
      blob(ctx, p.x, p.y - p.u * TABLE_TOP, p.u * 1.05, p.u * 0.33, '#C9935F')
      BOOKS.forEach((b, i) => {
        const slot = bookSlot(i, BOOKS.length)
        const bx = p.x + slot.x * p.u
        const by = p.y - p.u * TABLE_TOP + slot.z * p.u * 0.3
        ctx.save()
        ctx.translate(bx, by)
        ctx.rotate(slot.yaw * 0.5)
        box(ctx, -p.u * 0.17, -p.u * 0.46, p.u * 0.34, p.u * 0.46, 3, b.color)
        box(ctx, -p.u * 0.17, -p.u * 0.46, p.u * 0.07, p.u * 0.46, 2, lighten(b.color, 0.3))
        ctx.restore()
      })
    },
  })
  // the librarian's desk with the owl on it
  out.push({
    z: L.desk.z,
    draw: () => {
      const p = at(L.desk.x, L.desk.z)
      blob(ctx, p.x, p.y, p.u * 1.2, p.u * 0.3, 'rgba(60, 30, 90, 0.2)')
      box(ctx, p.x - p.u * 1.0, p.y - p.u * 0.85, p.u * 2.0, p.u * 0.85, 5, '#A06B3B')
      box(ctx, p.x - p.u * 1.05, p.y - p.u * 0.92, p.u * 2.1, p.u * 0.14, 4, '#C9935F')
      drawAnimal2D(ctx, 'owl', p.x + p.u * 0.25, p.y - p.u * 0.9, p.u * 1.0, s.t, s.reduceMotion)
    },
  })
  // the reading nook: a cushion, and a unicorn reading on it
  out.push({
    z: L.nook.z,
    draw: () => {
      const p = at(L.nook.x, L.nook.z)
      blob(ctx, p.x, p.y, p.u * 1.2, p.u * 0.4, '#E88FB8')
      blob(ctx, p.x, p.y - p.u * 0.12, p.u * 1.0, p.u * 0.32, '#FFB3D4')
      drawUnicorn2D(ctx, FRIEND_LOOKS.readingUnicorn, p.x, p.y - p.u * 0.2, p.u * 1.7, { t: s.t, phase: 2, reduceMotion: s.reduceMotion })
    },
  })
  out.push({
    z: L.globe.z,
    draw: () => {
      const p = at(L.globe.x, L.globe.z)
      box(ctx, p.x - p.u * 0.05, p.y - p.u * 0.9, p.u * 0.1, p.u * 0.9, 3, '#6F4526')
      blob(ctx, p.x, p.y, p.u * 0.5, p.u * 0.12, '#6F4526')
      blob(ctx, p.x, p.y - p.u * 1.25, p.u * 0.55, p.u * 0.55, '#4DA8E8')
      blob(ctx, p.x - p.u * 0.15, p.y - p.u * 1.3, p.u * 0.2, p.u * 0.16, '#6FCB6B')
      blob(ctx, p.x + p.u * 0.2, p.y - p.u * 1.15, p.u * 0.15, p.u * 0.2, '#6FCB6B')
      ctx.strokeStyle = '#FFD166'
      ctx.lineWidth = Math.max(2, p.u * 0.06)
      ctx.beginPath()
      ctx.ellipse(p.x, p.y - p.u * 1.25, p.u * 0.7, p.u * 0.16, 0.4, 0, Math.PI * 2)
      ctx.stroke()
    },
  })
  out.push({
    z: L.lamp.z,
    draw: () => {
      const p = at(L.lamp.x, L.lamp.z)
      blob(ctx, p.x, p.y, p.u * 0.55, p.u * 0.14, '#B79CDD')
      box(ctx, p.x - p.u * 0.05, p.y - p.u * 2.6, p.u * 0.1, p.u * 2.6, 3, '#B79CDD')
      ctx.fillStyle = '#FFD166'
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const r = (i % 2 === 0 ? 0.5 : 0.22) * p.u
        ctx.lineTo(p.x + Math.cos(a) * r, p.y - p.u * 2.9 + Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.fill()
    },
  })
  out.push({
    z: L.aquarium.z,
    draw: () => {
      const p = at(L.aquarium.x, L.aquarium.z)
      box(ctx, p.x - p.u * 0.9, p.y - p.u * 0.5, p.u * 1.8, p.u * 0.5, 4, '#8A5A33')
      box(ctx, p.x - p.u * 0.85, p.y - p.u * 1.4, p.u * 1.7, p.u * 0.95, 6, 'rgba(160, 220, 250, 0.7)')
      ;['#FF8F5A', '#FFD166', '#B79CFF'].forEach((c, i) => {
        const sway = s.reduceMotion ? 0 : Math.sin(s.t * 1.3 + i * 2) * p.u * 0.3
        blob(ctx, p.x + sway + (i - 1) * p.u * 0.35, p.y - p.u * (0.9 + i * 0.12), p.u * 0.14, p.u * 0.08, c)
      })
    },
  })
  out.push({
    z: L.music.z,
    draw: () => {
      const p = at(L.music.x, L.music.z)
      BARS.forEach((bar, i) => {
        const bw = p.u * 0.2
        box(ctx, p.x - p.u * 0.83 + i * (bw + p.u * 0.02), p.y - p.u * 0.85 - (7 - i) * p.u * 0.02, bw, p.u * (0.6 - i * 0.03), 3, bar.color)
      })
      box(ctx, p.x - p.u * 0.95, p.y - p.u * 0.28, p.u * 0.07, p.u * 0.28, 2, '#8A5A33')
      box(ctx, p.x + p.u * 0.88, p.y - p.u * 0.28, p.u * 0.07, p.u * 0.28, 2, '#8A5A33')
    },
  })
  out.push({
    z: L.easel.z,
    draw: () => {
      const p = at(L.easel.x, L.easel.z)
      ctx.strokeStyle = '#8A5A33'
      ctx.lineWidth = Math.max(3, p.u * 0.08)
      ctx.beginPath()
      ctx.moveTo(p.x - p.u * 0.6, p.y)
      ctx.lineTo(p.x - p.u * 0.1, p.y - p.u * 2.1)
      ctx.moveTo(p.x + p.u * 0.6, p.y)
      ctx.lineTo(p.x + p.u * 0.1, p.y - p.u * 2.1)
      ctx.stroke()
      box(ctx, p.x - p.u * 0.65, p.y - p.u * 2.3, p.u * 1.3, p.u * 0.95, 4, '#FFFFFF')
      ;['#FF7EB6', '#6FA8FF', '#FFD166'].forEach((c, i) => blob(ctx, p.x - p.u * 0.3 + i * p.u * 0.3, p.y - p.u * (1.9 - (i % 2) * 0.2), p.u * 0.12, p.u * 0.12, c))
    },
  })
  return out
}

// ---- the yard -------------------------------------------------------------------------------------------------------

function yardBackdrop(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, f.horizon)
  sky.addColorStop(0, YARD_SKY[0])
  sky.addColorStop(1, YARD_SKY[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, f.W, f.horizon)
  // a sun that glows a little, and clouds that drift
  const sun = f.W * 0.82 - (f.camX / 60) * f.W
  blob(ctx, sun, f.horizon * 0.28, f.horizon * 0.2, f.horizon * 0.2, 'rgba(255, 240, 160, 0.5)')
  blob(ctx, sun, f.horizon * 0.28, f.horizon * 0.13, f.horizon * 0.13, '#FFE066')
  for (let i = 0; i < 4; i++) {
    const drift = s.reduceMotion ? 0 : (s.t * 6 * (1 + i * 0.3)) % (f.W + 200)
    const x = ((i * 0.31 * f.W + drift - f.camX * 8) % (f.W + 200)) - 100
    blob(ctx, x, f.horizon * (0.2 + (i % 3) * 0.12), f.W * 0.06, f.horizon * 0.07, 'rgba(255,255,255,0.9)')
    blob(ctx, x + f.W * 0.04, f.horizon * (0.22 + (i % 3) * 0.12), f.W * 0.045, f.horizon * 0.06, 'rgba(255,255,255,0.9)')
  }
  // hills and a white fence at the back
  blob(ctx, f.W * 0.25 - f.camX * 5, f.horizon, f.W * 0.5, f.horizon * 0.3, '#8FDB8F')
  blob(ctx, f.W * 0.8 - f.camX * 5, f.horizon, f.W * 0.55, f.horizon * 0.22, '#6FCB7F')
  floorBase(ctx, f, '#7FD08A')
  floorBand(ctx, f, -AREAS.yard.halfD, AREAS.yard.halfD, '#7FD08A')
  for (let i = 0; i < 6; i++) floorBand(ctx, f, -AREAS.yard.halfD + i * 2.2, -AREAS.yard.halfD + i * 2.2 + 1.1, 'rgba(255,255,255,0.07)')
  const fenceY = f.horizon
  const post = f.scale * 1.2
  for (let x = Math.floor((f.camX - f.W / f.scale / 2) / 1.2) * 1.2; x < f.camX + f.W / f.scale / 2 + 1.2; x += 1.2) {
    const px = f.W / 2 + (x - f.camX) * f.scale
    box(ctx, px - 4, fenceY - post * 0.55, 8, post * 0.55, 3, '#FFFFFF')
  }
  placeDoors(ctx, f, s, 'yard')
}

function yardProps(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D): Drawable[] {
  const Y = YARD_SPOTS
  const at = (x: number, z: number) => {
    const p = project(f, x, z)
    return { ...p, u: f.scale * p.k }
  }
  const out: Drawable[] = []
  const add = (spot: { x: number; z: number }, draw: (p: ReturnType<typeof at>) => void) => {
    if (visible(f, spot.x, 4)) out.push({ z: spot.z, draw: () => draw(at(spot.x, spot.z)) })
  }
  add(Y.tree, (p) => {
    box(ctx, p.x - p.u * 0.35, p.y - p.u * 3, p.u * 0.7, p.u * 3, 6, '#9A6B3B')
    blob(ctx, p.x, p.y - p.u * 4, p.u * 2.2, p.u * 1.7, '#4FB27A')
    blob(ctx, p.x - p.u * 0.9, p.y - p.u * 4.4, p.u * 1.2, p.u * 1.0, '#6FCB8F')
    drawAnimal2D(ctx, 'koala', p.x + p.u * 0.2, p.y - p.u * 2.6, p.u * 1.1, s.t, s.reduceMotion)
  })
  add(Y.sandbox, (p) => {
    box(ctx, p.x - p.u * 1.5, p.y - p.u * 0.5, p.u * 3, p.u * 0.8, 6, '#C99A5B')
    box(ctx, p.x - p.u * 1.35, p.y - p.u * 0.42, p.u * 2.7, p.u * 0.58, 5, '#F2D58A')
  })
  add(Y.puddle, (p) => {
    blob(ctx, p.x, p.y - p.u * 0.1, p.u * 1.5, p.u * 0.55, '#8EC5FF')
    blob(ctx, p.x - p.u * 0.4, p.y - p.u * 0.18, p.u * 0.5, p.u * 0.15, 'rgba(255,255,255,0.6)')
    drawAnimal2D(ctx, 'capybara', p.x, p.y - p.u * 0.15, p.u * 1.3, s.t, s.reduceMotion)
  })
  add(Y.swing, (p) => {
    ctx.strokeStyle = '#B79CDD'
    ctx.lineWidth = Math.max(3, p.u * 0.12)
    ctx.beginPath()
    ctx.moveTo(p.x - p.u * 1.4, p.y)
    ctx.lineTo(p.x - p.u * 0.6, p.y - p.u * 3)
    ctx.lineTo(p.x + p.u * 0.6, p.y - p.u * 3)
    ctx.lineTo(p.x + p.u * 1.4, p.y)
    ctx.stroke()
    const sway = s.reduceMotion ? 0 : Math.sin(s.t * 1.8) * p.u * 0.35
    ctx.lineWidth = Math.max(1.5, p.u * 0.04)
    ctx.beginPath()
    ctx.moveTo(p.x - p.u * 0.3, p.y - p.u * 3)
    ctx.lineTo(p.x - p.u * 0.3 + sway, p.y - p.u * 1.1)
    ctx.moveTo(p.x + p.u * 0.3, p.y - p.u * 3)
    ctx.lineTo(p.x + p.u * 0.3 + sway, p.y - p.u * 1.1)
    ctx.stroke()
    box(ctx, p.x - p.u * 0.45 + sway, p.y - p.u * 1.15, p.u * 0.9, p.u * 0.14, 4, '#FF7EB6')
  })
  add(Y.slide, (p) => {
    ctx.fillStyle = '#FF9E7E'
    ctx.beginPath()
    ctx.moveTo(p.x - p.u * 1.5, p.y - p.u * 2.4)
    ctx.lineTo(p.x - p.u * 0.7, p.y - p.u * 2.4)
    ctx.lineTo(p.x + p.u * 1.6, p.y)
    ctx.lineTo(p.x + p.u * 0.8, p.y)
    ctx.closePath()
    ctx.fill()
    box(ctx, p.x - p.u * 1.5, p.y - p.u * 2.4, p.u * 0.12, p.u * 2.4, 3, '#B79CDD')
    box(ctx, p.x - p.u * 0.7, p.y - p.u * 2.6, p.u * 0.9, p.u * 0.14, 3, '#B79CDD')
  })
  add(Y.cart, (p) => {
    box(ctx, p.x - p.u * 0.9, p.y - p.u * 1.0, p.u * 1.8, p.u * 0.8, 6, '#FF7EB6')
    blob(ctx, p.x - p.u * 0.5, p.y - p.u * 0.1, p.u * 0.22, p.u * 0.22, '#4A2E73')
    blob(ctx, p.x + p.u * 0.5, p.y - p.u * 0.1, p.u * 0.22, p.u * 0.22, '#4A2E73')
    ;['#FFD166', '#7BE07F', '#6FA8FF'].forEach((c, i) => blob(ctx, p.x - p.u * 0.5 + i * p.u * 0.5, p.y - p.u * 1.12, p.u * 0.22, p.u * 0.22, c))
  })
  add(TRAMPOLINE_AT, (p) => {
    blob(ctx, p.x, p.y - p.u * 0.35, p.u * 1.5, p.u * 0.55, '#B79CDD')
    blob(ctx, p.x, p.y - p.u * 0.4, p.u * 1.25, p.u * 0.42, '#6FA8FF')
    ;[-1, 1].forEach((d) => box(ctx, p.x + d * p.u * 1.2 - 3, p.y - p.u * 0.35, 6, p.u * 0.35, 2, '#8A5A33'))
  })
  add(BALL_START, (p) => {
    blob(ctx, p.x, p.y, p.u * 0.3, p.u * 0.07, 'rgba(60,30,90,0.2)')
    blob(ctx, p.x, p.y - p.u * 0.3, p.u * 0.3, p.u * 0.3, '#FF7EB6')
    blob(ctx, p.x - p.u * 0.08, p.y - p.u * 0.38, p.u * 0.08, p.u * 0.06, '#FFFFFF')
  })
  const friend = (id: 'friendDay' | 'friendPlay', i: number) => {
    const spot = Y[id]
    add(spot, (p) => drawUnicorn2D(ctx, FRIEND_LOOKS[id], p.x, p.y, figureSize(f, spot.z), { t: s.t, phase: i * 2.3, reduceMotion: s.reduceMotion }))
  }
  friend('friendDay', 0)
  friend('friendPlay', 1)
  return out
}

// ---- the corridor ---------------------------------------------------------------------------------------------------

function hallBackdrop(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D) {
  ctx.fillStyle = HC.wall
  ctx.fillRect(0, 0, f.W, f.horizon)
  ctx.fillStyle = HC.wainscot
  ctx.fillRect(0, f.horizon * 0.8, f.W, f.horizon * 0.2)
  floorBase(ctx, f, HC.floor)
  floorBand(ctx, f, -AREAS.hall.halfD, AREAS.hall.halfD, HC.floor)
  // a tinted strip of floor under each subject, and the rainbow runner along the whole corridor
  HALL_SECTIONS.forEach((section, i) => {
    const span = sectionSpan(i)
    if (!visible(f, span.middle, (span.to - span.from) / 2 + 2)) return
    const a = project(f, span.from, -1.2)
    const b = project(f, span.to, 0.4)
    ctx.fillStyle = mix(HC.floor, section.color, 0.6)
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y)
  })
  RAINBOW.slice(0, 6).forEach((c, i) => {
    const y = project(f, 0, 2.0 + i * 0.16).y
    ctx.fillStyle = c
    ctx.fillRect(0, y, f.W, Math.max(3, f.scale * 0.14))
  })
  // the banner of each subject, a round window and a plant between the subjects
  HALL_SECTIONS.forEach((section, i) => {
    const span = sectionSpan(i)
    if (!visible(f, span.middle, 6)) return
    const p = project(f, span.middle, HALL.wallZ)
    const u = f.scale * p.k
    const text = bannerText(s.lang, i)
    ctx.font = `700 ${Math.max(11, u * 0.5)}px Fredoka, Nunito, sans-serif`
    const w = ctx.measureText(text).width + u
    box(ctx, p.x - w / 2, p.y - u * 4.9, w, u * 0.9, u * 0.45, section.color)
    ctx.fillStyle = '#4A2E73'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, p.x, p.y - u * 4.45)
  })
  sectionGaps().forEach((gx) => {
    if (!visible(f, gx, 3)) return
    const p = project(f, gx, HALL.wallZ + 0.1)
    const u = f.scale * p.k
    blob(ctx, p.x, p.y - u * 2.1, u * 0.8, u * 0.8, '#FFF7FB')
    blob(ctx, p.x, p.y - u * 2.1, u * 0.65, u * 0.65, HC.window)
    box(ctx, p.x - u * 0.3, p.y - u * 0.5, u * 0.6, u * 0.5, 5, HC.pot)
    blob(ctx, p.x, p.y - u * 0.9, u * 0.5, u * 0.45, HC.leaf)
  })
  // the big orange door to the sports hall at the far end (once the special rooms are open)
  if (roomsOpen()) {
    for (const to of ROOM_DOORS) {
      const [rx, , rz] = roomDoorSpot(to)
      if (!visible(f, rx)) continue
      const p = project(f, rx, rz)
      drawDoor(ctx, p.x, p.y, f.scale * p.k * 1.2, PLACE_DOOR_THEMES[to], translate(s.lang, SIGN_KEY[to]), { t: s.t, reduceMotion: s.reduceMotion, signWidth: f.scale * p.k * 3 })
    }
  }
  // the green door at the start, then the fifteen class doors
  const [ex, , ez] = exitDoorSpot()
  if (visible(f, ex)) {
    const p = project(f, ex, ez)
    drawDoor(ctx, p.x, p.y, f.scale * p.k * 0.95, PLACE_DOOR_THEMES.yard, translate(s.lang, 'hall.exitDoor'), { t: s.t, reduceMotion: s.reduceMotion, signWidth: f.scale * p.k * 2.7 })
  }
  for (let i = 0; i < 15; i++) {
    const [x, , z] = hallDoorSpot(i)
    if (!visible(f, x)) continue
    const state = doorState(s.done, i)
    const p = project(f, x, z)
    drawDoor(ctx, p.x, p.y, f.scale * p.k * 0.95, DOOR_THEMES[i], doorSignText(s.lang, i), { state, windowColor: classWindow(i), badge: state === 'next' ? translate(s.lang, 'hall.doorNew') : undefined, t: s.t, reduceMotion: s.reduceMotion, signWidth: f.scale * p.k * 2.8 })
  }
}

function hallFolk(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D): Drawable[] {
  const out: Drawable[] = []
  for (const w of HALL_WALKERS) {
    const place = walkerPlace(w, s.t, s.reduceMotion)
    if (!visible(f, place.x, 3)) continue
    out.push({
      z: w.z,
      draw: () => {
        const p = project(f, place.x, w.z)
        drawUnicorn2D(ctx, w.look as UnicornLook, p.x, p.y, figureSize(f, w.z, 1.7 * w.size), { t: s.t, phase: w.phase, facingLeft: place.facingLeft, reduceMotion: s.reduceMotion })
      },
    })
  }
  const animal = (type: AnimalType, x: number, z: number, units: number) => {
    if (!visible(f, x, 3)) return
    out.push({
      z,
      draw: () => {
        const p = project(f, x, z)
        drawAnimal2D(ctx, type, p.x, p.y, f.scale * p.k * units, s.t, s.reduceMotion)
      },
    })
  }
  const gaps = sectionGaps()
  // the koala reads on the bench in the first gap; the penguin and the capybara stand in the fourth
  if (visible(f, benchX(), 3)) {
    out.push({
      z: HALL_BENCH.z,
      draw: () => {
        const p = project(f, benchX(), HALL_BENCH.z)
        const u = f.scale * p.k
        box(ctx, p.x - u * 0.95, p.y - u * 0.5, u * 1.9, u * 0.14, 3, HC.bench)
        box(ctx, p.x - u * 0.85, p.y - u * 0.4, u * 0.1, u * 0.4, 2, '#8A5A33')
        box(ctx, p.x + u * 0.75, p.y - u * 0.4, u * 0.1, u * 0.4, 2, '#8A5A33')
        drawAnimal2D(ctx, 'koala', p.x, p.y - u * 0.48, u * 1.1, s.t, s.reduceMotion)
      },
    })
  }
  animal('penguin', gaps[3] + 1.5, 1.2, 1.1)
  animal('capybara', gaps[3] - 0.9, 1.6, 1.2)
  return out
}

// ---- everything -----------------------------------------------------------------------------------------------------

/** The room of a place: wall, floor and everything fixed to the wall (doors, shelf, banners). */
export function drawBackdrop(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D): void {
  ctx.clearRect(0, 0, f.W, f.H)
  if (f.place === 'library') libraryBackdrop(ctx, f, s)
  else if (f.place === 'sports') sportsBackdrop(ctx, f, s)
  else if (f.place in SECTOR_LOOK) sectorBackdrop(ctx, f, s)
  else if (f.place === 'yard') yardBackdrop(ctx, f, s)
  else hallBackdrop(ctx, f, s)
}

/** What stands on the floor (props and friends); the caller adds the player and draws them all, back to front. */
export function standing(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D): Drawable[] {
  if (f.place === 'library') return libraryProps(ctx, f, s)
  if (f.place === 'yard') return yardProps(ctx, f, s)
  if (f.place in SECTOR_LOOK || f.place === 'sports') return []
  return hallFolk(ctx, f, s)
}

/** Draw the player's unicorn where she stands. */
export function playerDrawable(ctx: CanvasRenderingContext2D, f: Frame, s: Scene2D, who: { x: number; z: number; facingLeft: boolean; moving: boolean; look: UnicornLook }): Drawable {
  return {
    z: who.z,
    draw: () => {
      const p = project(f, who.x, who.z)
      const hop = who.moving && !s.reduceMotion ? Math.abs(Math.sin(s.t * 9)) * p.k * f.scale * 0.12 : 0
      drawUnicorn2D(ctx, who.look, p.x, p.y - hop, figureSize(f, who.z), { t: s.t, facingLeft: who.facingLeft, reduceMotion: s.reduceMotion })
    },
  }
}

export { depthScale }
