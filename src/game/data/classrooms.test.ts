import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { CLASSROOMS, roomFor, type DecorId } from './classrooms'

/** Every picture in public/assets, by image key. */
const ASSET_KEYS = new Set(
  Object.keys(import.meta.glob('../../../public/assets/*.png')).map((p) => p.split('/').pop()!.replace('.png', ''))
)
const kinds = (scene: Parameters<typeof roomFor>[0]) => roomFor(scene).decor.map((d) => d.kind)

describe('classrooms', () => {
  it('has a room for every stage scene name', () => {
    expect(Object.keys(CLASSROOMS).sort()).toEqual(STAGES.map((s) => s.name).sort())
  })

  it("is inspired by its stage's own 2D background, and that picture exists (stages 13 to 15 have none: their 2D room is drawn in code)", () => {
    for (const stage of STAGES) {
      const room = roomFor(stage.name)
      if (stage.background) expect(room.inspiredBy, stage.name).toBe(stage.background)
      else expect(Number(stage.name.replace('stage', '')), stage.name).toBeGreaterThan(12)
      expect(ASSET_KEYS.has(room.inspiredBy), room.inspiredBy).toBe(true)
    }
  })

  it('the picture check really sees the assets', () => {
    expect(ASSET_KEYS.has('stage1Background')).toBe(true)
    expect(ASSET_KEYS.has('noSuchPicture')).toBe(false)
  })

  const TREATS: readonly DecorId[] = [
    'donut', 'donutTower', 'iceCream', 'cupcake', 'cake', 'lollipop', 'starLollipop', 'castle', 'mushroom',
    'rocket', 'crystal', 'balloon', 'rollDonut', 'bouncyBall', 'funnyFlower', 'sunFlower',
    // fun things that belong to one world
    'glowMushroom', 'floatingIsland', 'snowman', 'sandcastle', 'ufo', 'lantern', 'lilyPad', 'bubble', 'comet', 'macaronStool',
  ]
  const MOVERS: readonly DecorId[] = ['rollDonut', 'bouncyBall', 'balloon']
  const roomsWith = (kind: DecorId) => STAGES.filter((s) => kinds(s.name).includes(kind)).length

  it('every room has several kinds of toys and treats, and one that moves about', () => {
    for (const stage of STAGES) {
      const found = new Set(kinds(stage.name).filter((k) => TREATS.includes(k)))
      expect(found.size, stage.name).toBeGreaterThanOrEqual(4)
      expect(kinds(stage.name).some((k) => MOVERS.includes(k)), `${stage.name} mover`).toBe(true)
    }
  })

  it('the rooms are not all the same: no toy in most of them, many different ones overall', () => {
    const used = new Set(STAGES.flatMap((s) => kinds(s.name)).filter((k) => TREATS.includes(k)))
    expect(used.size).toBeGreaterThanOrEqual(14)
    for (const k of TREATS) expect(roomsWith(k), k).toBeLessThanOrEqual(9)
    // The giant donut was in every room once; now it is a treat among others.
    expect(roomsWith('donut')).toBeLessThanOrEqual(3)
  })

  it('every world has a hero piece of its own, and it is in the room', () => {
    const heroes = STAGES.map((s) => roomFor(s.name).hero)
    expect(new Set(heroes).size).toBe(15)
    for (const s of STAGES) expect(kinds(s.name), s.name).toContain(roomFor(s.name).hero)
  })

  it('there is a little castle, and it waits at the end of the school', () => {
    expect(roomsWith('castle')).toBeGreaterThanOrEqual(3)
    expect(kinds('stage15')).toContain('castle')
  })

  it('rainbows are in most rooms', () => {
    const RAINBOWS: readonly DecorId[] = ['rainbowArch', 'rainbowCloud']
    const withRainbow = STAGES.filter((s) => kinds(s.name).some((k) => RAINBOWS.includes(k)))
    expect(withRainbow.length).toBeGreaterThanOrEqual(9)
  })

  it('every room is furnished', () => {
    for (const stage of STAGES) expect(roomFor(stage.name).decor.length, stage.name).toBeGreaterThanOrEqual(4)
  })
})

describe('the 15 worlds', () => {
  const HEX = /^#[0-9a-f]{6}$/i
  const rooms = Object.entries(CLASSROOMS)

  it('every colour of every palette is a real colour', () => {
    for (const [name, room] of rooms) for (const [key, value] of Object.entries(room.palette)) expect(value, `${name} ${key}`).toMatch(HEX)
  })

  it('no two worlds share a wall colour or the same floor + window + particles', () => {
    expect(new Set(rooms.map(([, r]) => r.palette.wall)).size).toBe(15)
    expect(new Set(rooms.map(([, r]) => `${r.floor}|${r.walls.windows}|${r.particles}`)).size).toBe(15)
  })

  it('floors and windows are varied: many materials and many views', () => {
    expect(new Set(rooms.map(([, r]) => r.floor)).size).toBeGreaterThanOrEqual(10)
    expect(new Set(rooms.map(([, r]) => r.walls.windows)).size).toBeGreaterThanOrEqual(10)
  })

  it('every world has its own signature: its world-only pieces are not in other worlds', () => {
    const ONLY: Record<string, DecorId[]> = {
      stage2: ['palm', 'umbrella', 'surfboard', 'sandcastle'],
      stage3: ['crater', 'ufo', 'earth'],
      stage4: ['bigTree'],
      stage5: ['clam', 'coral', 'seaweed', 'bubble'],
      stage7: ['eucalyptus'],
      stage8: ['pool', 'steam', 'lilyPad'],
      stage9: ['floatingIsland', 'glowMushroom', 'glowPlant'],
      stage11: ['seaShell', 'lighthouse'],
      stage12: ['aurora', 'igloo', 'snowman'],
      stage13: ['awning', 'macaronStool'],
      stage14: ['paintFall', 'cliff'],
      stage15: ['comet'],
    }
    for (const [stage, pieces] of Object.entries(ONLY)) {
      for (const piece of pieces) {
        expect(kinds(stage as keyof typeof CLASSROOMS), `${stage} has ${piece}`).toContain(piece)
        // A palm may also stand on the shell stage's beach; everything else belongs to one world.
        const elsewhere = rooms.filter(([n, r]) => n !== stage && r.decor.some((d) => d.kind === piece)).map(([n]) => n)
        expect(elsewhere.length, `${piece} elsewhere: ${elsewhere}`).toBeLessThanOrEqual(piece === 'palm' ? 1 : 0)
      }
    }
  })

  it('the sea worlds are by the sea, the space worlds in space', () => {
    expect(CLASSROOMS.stage2.walls.windows).toBe('sea')
    expect(CLASSROOMS.stage11.walls.windows).toBe('sea')
    expect(CLASSROOMS.stage3.walls.windows).toBe('moon')
    expect(CLASSROOMS.stage5.walls.windows).toBe('underwater')
    expect(CLASSROOMS.stage12.walls.windows).toBe('aurora')
    expect(CLASSROOMS.stage2.floor).toBe('sand')
    expect(CLASSROOMS.stage12.floor).toBe('ice')
    expect(CLASSROOMS.stage5.floor).toBe('water')
    expect(CLASSROOMS.stage3.floor).toBe('moon')
  })

  it('every room has walls and a back wall to hang things on', () => {
    for (const [name, room] of rooms) {
      expect(room.walls.back, name).toBe(true)
      expect(room.decor.some((d) => d.zone === 'backWall'), name).toBe(true)
    }
  })

  it('no room is overcrowded', () => {
    for (const [name, room] of rooms) {
      const pieces = room.decor.reduce((n, d) => n + (d.count ?? 1), 0)
      expect(pieces, name).toBeLessThanOrEqual(36)
    }
  })
})
