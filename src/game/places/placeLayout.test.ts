import { describe, expect, it } from 'vitest'
import { STAGES, buildStages } from '../constants/stages'
import { PORTRAIT_HEIGHT, PORTRAIT_WIDTH, WIDE_HEIGHT, WIDE_WIDTH, WIDTH, HEIGHT } from '../constants/dimensions'
import { exitDoorAt, exitDoorShown } from '../film/filmData'
import { UNIT, gameToWorld } from '../views/three/coords'
import { DOOR_SPACING, AREAS, DOOR_SPOTS, SEEN_DEPTH, arrivalAt, doorFootZ, doorSpot, placeCamera, seenDepth, viewHalfWidth, walkBounds, yardDoorAt, yardDoorScale } from './placeLayout'
import { DOORS } from './placeModel'

const SIZES = [
  ['landscape', WIDTH, HEIGHT],
  ['wide (a phone held sideways)', WIDE_WIDTH, WIDE_HEIGHT],
  ['portrait (a phone held upright)', PORTRAIT_WIDTH, PORTRAIT_HEIGHT],
] as const

describe('the yard door of a classroom', () => {
  it.each(SIZES)('stands inside the room at %s', (_name, w, h) => {
    const halfW = w / UNIT / 2
    const halfH = h / UNIT / 2
    const [x, , z] = yardDoorAt(halfW, halfH)
    expect(Math.abs(x)).toBeLessThan(halfW)
    expect(Math.abs(z)).toBeLessThan(halfH)
  })

  it('beside the door to the next class, a door apart, when the room is wide', () => {
    const halfW = WIDTH / UNIT / 2
    const halfH = HEIGHT / UNIT / 2
    const exit = exitDoorAt(halfW, halfH)
    const yard = yardDoorAt(halfW, halfH)
    expect(yard[2]).toBe(exit[2])
    expect(exit[0] - yard[0]).toBeCloseTo(DOOR_SPACING)
    // Their frames (3.6 wide at full size, a little smaller for the yard door) do not touch.
    expect(exit[0] - yard[0] - (3.6 / 2) * yardDoorScale(halfW, halfH) - 3.6 / 2).toBeGreaterThan(-0.1)
  })

  it('on a phone held upright it is where the badge and the buttons do not cover, in the front corner, and smaller', () => {
    const halfW = PORTRAIT_WIDTH / UNIT / 2
    const halfH = PORTRAIT_HEIGHT / UNIT / 2
    expect(exitDoorShown(halfW, halfH)).toBe(false)
    const [x, , z] = yardDoorAt(halfW, halfH)
    expect(x).toBeGreaterThan(0)
    expect(z).toBeGreaterThan(0)
    expect(yardDoorScale(halfW, halfH)).toBeLessThan(0.8)
  })

  it.each(SIZES)('keeps well clear of every unicorn in all 15 stages at %s', (_name, w, h) => {
    const halfW = w / UNIT / 2
    const halfH = h / UNIT / 2
    const [dx, , dz] = yardDoorAt(halfW, halfH)
    const stages = buildStages(w, h)
    for (let i = 0; i < STAGES.length; i++) {
      for (const npc of stages[i].npcs ?? []) {
        const p = gameToWorld(npc.x, npc.y, w, h)
        expect(Math.hypot(p.x - dx, p.z - dz), `stage ${i + 1} ${npc.id}`).toBeGreaterThan(1.4)
      }
    }
  })

  it('has its foot on the camera side, unless that is past the edge of the room', () => {
    expect(doorFootZ(-2.8, 4.05)).toBeCloseTo(-1.8)
    expect(doorFootZ(2.9, 4.05)).toBeCloseTo(1.9)
    expect(doorFootZ(3.5, 4.05)).toBeCloseTo(2.5)
  })
})

describe('the yard and the library', () => {
  it('have a door spot for every door the model says they have', () => {
    for (const place of ['yard', 'library'] as const) {
      expect(Object.keys(DOOR_SPOTS[place]).sort()).toEqual([...DOORS[place]].sort())
    }
  })

  it('the library has its door to the corridor at the other end of the back wall from the door to the yard, a door apart', () => {
    const [yard, hall] = [doorSpot('library', 'yard'), doorSpot('library', 'hall')]
    expect(hall[0] - yard[0]).toBeGreaterThan(3.6)
    expect(hall[0] + 1.8).toBeLessThan(AREAS.library.halfW)
    expect(arrivalAt('library', 'hall').x).toBeLessThan(hall[0] - 1.5)
  })

  it('doorSpot knows its doors and says so when there is none', () => {
    expect(doorSpot('yard', 'library')[0]).toBeGreaterThan(0)
    expect(doorSpot('yard', 'class')[0]).toBeLessThan(0)
    expect(() => doorSpot('library', 'class')).toThrow(/no door/)
  })

  it('keep their doors inside the room, a door apart', () => {
    const [a, b] = [doorSpot('yard', 'class'), doorSpot('yard', 'library')]
    expect(Math.abs(a[0]) + 1.8).toBeLessThan(AREAS.yard.halfW)
    expect(b[0] - a[0]).toBeGreaterThan(3.6)
  })

  it('put her in front of the door she came through, far enough in for her unicorn to be on screen', () => {
    const fromClass = arrivalAt('yard', 'class')
    const door = doorSpot('yard', 'class')
    expect(fromClass.z).toBeGreaterThan(door[2])
    expect(fromClass.x).toBeGreaterThan(door[0] + 1.5)
    const fromLibrary = arrivalAt('yard', 'library')
    expect(fromLibrary.x).toBeLessThan(doorSpot('yard', 'library')[0] - 1.5)
    expect(arrivalAt('library', 'yard').x).toBeGreaterThan(doorSpot('library', 'yard')[0] + 1.5)
  })

  it('use the door of the other place on the way if she came by no door they have (a jump): the first door they have', () => {
    expect(arrivalAt('library', 'class')).toEqual(arrivalAt('library', 'yard'))
    expect(arrivalAt('yard', 'yard')).toEqual(arrivalAt('yard', 'class'))
  })

  it('let her walk to every arrival spot and every door', () => {
    const inside = (place: 'yard' | 'library', x: number, z: number) => {
      const b = walkBounds(place)
      return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ
    }
    for (const [place, from] of [['yard', 'class'], ['yard', 'library'], ['library', 'yard'], ['library', 'hall']] as const) {
      const a = arrivalAt(place, from)
      expect(inside(place, a.x, a.z), `${place} from ${from}`).toBe(true)
    }
    for (const place of ['yard', 'library'] as const) {
      for (const spot of Object.values(DOOR_SPOTS[place])) {
        expect(inside(place, spot![0], doorFootZ(spot![2], AREAS[place].halfD))).toBe(true)
      }
    }
  })

  it('make the yard twice the size of a classroom and the library the size of one', () => {
    expect(AREAS.yard.halfW).toBe(AREAS.library.halfW * 2)
    expect(AREAS.yard.halfD).toBeGreaterThan(AREAS.library.halfD)
  })

  it('keep the walking bounds inside each room, a door deep off the back wall', () => {
    for (const room of ['yard', 'library'] as const) {
      const b = walkBounds(room)
      const { halfW, halfD } = AREAS[room]
      expect(b.minX).toBeGreaterThan(-halfW)
      expect(b.maxX).toBeLessThan(halfW)
      expect(b.minZ).toBeCloseTo(-halfD + 1.4, 6)
      expect(b.maxZ).toBeLessThan(halfD)
    }
  })

  it('show all of the library, a part of the yard, and less still on a phone held upright', () => {
    expect(viewHalfWidth('library', 1000, 600)).toBe(AREAS.library.halfW)
    expect(viewHalfWidth('library', 600, 600)).toBe(AREAS.library.halfW)
    expect(viewHalfWidth('library', 400, 800)).toBeLessThan(AREAS.library.halfW)
    expect(viewHalfWidth('yard', 1000, 600)).toBeLessThan(AREAS.yard.halfW)
    expect(viewHalfWidth('yard', 400, 800)).toBeLessThan(viewHalfWidth('yard', 1000, 600))
  })

  it('show the whole depth of the library and at most SEEN_DEPTH of the yard', () => {
    expect(seenDepth('library')).toBe(AREAS.library.halfD * 2)
    expect(seenDepth('yard')).toBe(SEEN_DEPTH)
    expect(SEEN_DEPTH).toBeLessThan(AREAS.yard.halfD * 2)
  })

  describe('placeCamera', () => {
    const cam = (room: 'yard' | 'library', x: number, z: number, viewW = 1000, viewH = 600) => placeCamera({ room, viewW, viewH, player: { x, z } })

    it('holds still on the library, wherever she is: it is all in the picture', () => {
      for (const [x, z] of [[-6, -2], [0, 0], [6, 3]]) {
        const c = cam('library', x, z)
        expect(c.x).toBeCloseTo(0, 9)
        expect(c.z).toBeCloseTo(0, 9)
      }
    })

    it('follows her along the yard, and stops at its edges', () => {
      expect(cam('yard', 0, 0).x).toBe(0)
      expect(cam('yard', 3, 0).x).toBe(3)
      expect(cam('yard', 100, 0).x).toBe(AREAS.yard.halfW - viewHalfWidth('yard', 1000, 600))
      expect(cam('yard', -100, 0).x).toBe(-(AREAS.yard.halfW - viewHalfWidth('yard', 1000, 600)))
      const reachZ = AREAS.yard.halfD - SEEN_DEPTH / 2
      expect(cam('yard', 0, 100).z).toBe(reachZ)
      expect(cam('yard', 0, -100).z).toBe(-reachZ)
      expect(cam('yard', 0, 1).z).toBe(1)
    })

    it('zooms so that the part it shows fits the picture, tighter on a phone held upright', () => {
      const wide = cam('yard', 0, 0)
      const tall = cam('yard', 0, 0, 400, 800)
      expect(wide.zoom).toBeGreaterThan(0)
      expect(wide.zoom * viewHalfWidth('yard', 1000, 600) * 2).toBeLessThanOrEqual(1000)
      expect(tall.zoom * viewHalfWidth('yard', 400, 800) * 2).toBeLessThanOrEqual(400)
    })

    it('keeps its middle inside any room however small the picture', () => {
      for (const room of ['yard', 'library'] as const) {
        const c = cam(room, 50, 50, 300, 200)
        expect(Math.abs(c.x)).toBeLessThanOrEqual(AREAS[room].halfW)
        expect(Math.abs(c.z)).toBeLessThanOrEqual(AREAS[room].halfD)
      }
    })
  })
})

describe('the way into a place from where she has no door', () => {
  it('she stands in front of the one door a place has, when she comes from somewhere it has no door to (a jump)', () => {
    const door = DOOR_SPOTS.pony.sports!
    expect(arrivalAt('pony', 'class')).toEqual(arrivalAt('pony', 'sports'))
    expect(arrivalAt('pony', 'class').x).toBeGreaterThan(door[0] + 1.5)
  })
})
