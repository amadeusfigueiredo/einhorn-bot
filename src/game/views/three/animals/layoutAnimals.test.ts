import { describe, it, expect } from 'vitest'
import { STAGE_ANIMALS, type AnimalSpec, type Place } from '../../../data/animals'
import { ROOM, DESK, POD_COLS, CHAIR_DZ, FLOOR_ZONES, podDeskZ } from '../../../classroom/roomData'
import { STAGE_AGE } from '../../../classroom/kidLook'
import { animalsFor } from '../../../data/animals'
import { ANIMAL_SCALE, classroomAnimalArea, layoutAnimals, NARROW, onFloor, placePoint, relocateForNarrow, RIM, yawFacingRoom } from './layoutAnimals'

const LANDSCAPE = { halfW: 7.2, halfH: 4.05 }
const PORTRAIT = { halfW: 3.8, halfH: 6.75 }

const spec = (id: string, at: Place, extra: Partial<AnimalSpec> = {}): AnimalSpec => ({ id, type: 'koala', behavior: 'idle', at, lines: [], ...extra })

describe('placePoint', () => {
  it('puts the four edges around the floor, clear of it', () => {
    const { halfW, halfH } = LANDSCAPE
    expect(placePoint({ edge: 'left', t: 0.5 }, LANDSCAPE)[0]).toBeCloseTo(-(halfW + RIM.side))
    expect(placePoint({ edge: 'right', t: 0.5 }, LANDSCAPE)[0]).toBeCloseTo(halfW + RIM.side)
    expect(placePoint({ edge: 'back', t: 0.5 }, LANDSCAPE)[2]).toBeCloseTo(-(halfH + RIM.back))
    expect(placePoint({ edge: 'front', t: 0.5 }, LANDSCAPE)[2]).toBeCloseTo(halfH + RIM.front)
  })

  it('runs t from back to front on the sides and left to right on the back and front', () => {
    expect(placePoint({ edge: 'left', t: 0 }, LANDSCAPE)[2]).toBeLessThan(placePoint({ edge: 'left', t: 1 }, LANDSCAPE)[2])
    expect(placePoint({ edge: 'back', t: 0 }, LANDSCAPE)[0]).toBeLessThan(placePoint({ edge: 'back', t: 1 }, LANDSCAPE)[0])
    expect(placePoint({ edge: 'front', t: 0 }, LANDSCAPE)[0]).toBeLessThan(placePoint({ edge: 'front', t: 1 }, LANDSCAPE)[0])
  })

  it('keeps the height, and clamps t into the edge', () => {
    expect(placePoint({ edge: 'back', t: 0.3, y: 2.4 }, LANDSCAPE)[1]).toBe(2.4)
    expect(placePoint({ edge: 'back', t: 0.3 }, LANDSCAPE)[1]).toBe(0)
    expect(placePoint({ edge: 'back', t: -5 }, LANDSCAPE)).toEqual(placePoint({ edge: 'back', t: 0 }, LANDSCAPE))
    expect(placePoint({ edge: 'back', t: 5 }, LANDSCAPE)).toEqual(placePoint({ edge: 'back', t: 1 }, LANDSCAPE))
  })

  it('scales with the room', () => {
    const a = placePoint({ edge: 'right', t: 0 }, LANDSCAPE)
    const b = placePoint({ edge: 'right', t: 0 }, PORTRAIT)
    expect(a[0]).toBeGreaterThan(b[0])
    expect(a[2]).toBeGreaterThan(b[2])
  })
})

describe('yawFacingRoom', () => {
  // A model faces +x; its heading h turns +x to (cos h, -sin h) in the (x, z) plane.
  const dir = (h: number) => [Math.cos(h), -Math.sin(h)]
  it('every edge looks toward the middle of the room', () => {
    expect(dir(yawFacingRoom('left'))[0]).toBeCloseTo(1)
    expect(dir(yawFacingRoom('right'))[0]).toBeCloseTo(-1)
    expect(dir(yawFacingRoom('back'))[1]).toBeCloseTo(1)
    expect(dir(yawFacingRoom('front'))[1]).toBeCloseTo(-1)
  })
})

describe('layoutAnimals', () => {
  it('no animal on the ground stands on the floor where the unicorns are, in any room size', () => {
    for (const area of [LANDSCAPE, PORTRAIT, { halfW: 8, halfH: 3.6 }]) {
      for (const stage of STAGE_ANIMALS) {
        for (const p of layoutAnimals(stage, area)) {
          const points = [p.from, ...(p.to ? [p.to] : [])]
          for (const pt of points) {
            if (pt[1] < 0.5) expect(onFloor([pt[0], pt[1], pt[2]], area), `${p.spec.id} at ${pt}`).toBe(false)
          }
        }
      }
    }
  })

  it('keeps one placed animal per spec, in order, with its own spec', () => {
    const specs = STAGE_ANIMALS[3]
    const placed = layoutAnimals(specs, LANDSCAPE)
    expect(placed.map((p) => p.spec)).toEqual([...specs])
  })

  it('gives the path of a walker as two different points', () => {
    for (const stage of STAGE_ANIMALS) {
      for (const p of layoutAnimals(stage, LANDSCAPE)) {
        if (p.spec.to) {
          expect(p.to).not.toBeNull()
          expect(p.to).not.toEqual(p.from)
        } else expect(p.to).toBeNull()
      }
    }
  })

  it('animals look into the room from where they stand', () => {
    const [a] = layoutAnimals([spec('x', { edge: 'right', t: 0.4 })], LANDSCAPE)
    expect(a.yaw).toBe(Math.PI)
  })

  it('the scale is bigger than 1 so animals stand next to the unicorns', () => {
    expect(ANIMAL_SCALE).toBeGreaterThan(1)
  })
})

describe('narrow rooms (phones held upright)', () => {
  it('the portrait room counts as narrow and the landscape ones do not', () => {
    expect(PORTRAIT.halfW).toBeLessThan(NARROW)
    expect(LANDSCAPE.halfW).toBeGreaterThan(NARROW)
  })

  it('animals on the ground at the sides move to the back wall; airborne and front ones stay', () => {
    const specs = [
      spec('l', { edge: 'left', t: 0.3 }),
      spec('r', { edge: 'right', t: 0.3 }),
      spec('r2', { edge: 'right', t: 0.6 }),
      spec('air', { edge: 'left', t: 0.3, y: 2.8 }),
      spec('f', { edge: 'front', t: 0.4 }),
    ]
    const moved = relocateForNarrow(specs)
    expect([...moved.keys()].sort()).toEqual(['l', 'r', 'r2'])
    for (const p of moved.values()) expect(p.edge).toBe('back')
    // Two from the same side do not pile up on one spot.
    expect(moved.get('r')!.t).not.toBe(moved.get('r2')!.t)
    expect(moved.get('l')!.t).toBeLessThan(0.5)
    expect(moved.get('r')!.t).toBeGreaterThan(0.5)
  })

  it('in a portrait room nobody ends up on the side walls on the ground', () => {
    for (const stage of STAGE_ANIMALS) {
      for (const p of layoutAnimals(stage, PORTRAIT)) {
        if (p.from[1] < 0.5) expect(Math.abs(p.from[0]), p.spec.id).toBeLessThan(PORTRAIT.halfW)
      }
    }
  })

  it('a walker that was moved keeps a walk of its own on the new edge', () => {
    const [p] = layoutAnimals([spec('w', { edge: 'left', t: 0.2 }, { behavior: 'wander', to: { edge: 'left', t: 0.5 } })], PORTRAIT)
    expect(p.to).not.toBeNull()
    expect(p.to![2]).toBeCloseTo(p.from[2])
    expect(p.to![0]).toBeGreaterThan(p.from[0])
  })
})

describe('the animals of the real classroom', () => {
  const CLASSES = Object.keys(STAGE_AGE).map(Number)
  const ANIMAL_RADIUS = 0.35

  it('has classes to check', () => {
    expect(CLASSES.length).toBeGreaterThan(0)
  })

  for (const metre of [0.6, 1, 1.3]) {
    it(`keeps every animal on the ground out of the pods, chairs, cubbies, reading corner and maker table, inside the walls (${metre} px per metre)`, () => {
      const area = classroomAnimalArea(metre)
      for (const stage of CLASSES) {
        for (const p of layoutAnimals(animalsFor(stage - 1), area)) {
          for (const pt of [p.from, p.to]) {
            if (!pt || pt[1] >= 0.5) continue
            const [x, z] = [pt[0] / metre, pt[2] / metre]
            for (const col of POD_COLS) {
              for (const row of [0, 1]) {
                const [za, zb] = podDeskZ(row)
                const inX = Math.abs(x - col) < DESK.w / 2 + ANIMAL_RADIUS
                const inZ = z > za - CHAIR_DZ - ANIMAL_RADIUS && z < zb + CHAIR_DZ + ANIMAL_RADIUS
                expect(inX && inZ, `${p.spec.id} stands in a pod at ${x.toFixed(2)}, ${z.toFixed(2)}`).toBe(false)
              }
            }
            for (const zone of FLOOR_ZONES) {
              const inside = x > zone.x0 - ANIMAL_RADIUS && x < zone.x1 + ANIMAL_RADIUS && z > zone.z0 - ANIMAL_RADIUS && z < zone.z1 + ANIMAL_RADIUS
              expect(inside, `${p.spec.id} stands on furniture at ${x.toFixed(2)}, ${z.toFixed(2)}`).toBe(false)
            }
            expect(Math.abs(x), `${p.spec.id} is outside the side walls`).toBeLessThan(ROOM.W / 2)
            expect(Math.abs(z), `${p.spec.id} is outside the front or back wall`).toBeLessThan(ROOM.D / 2)
          }
        }
      }
    })
  }

  it('does not move side animals to the back for a narrow phone', () => {
    const area = classroomAnimalArea(0.5)
    expect(area.halfW).toBeLessThan(NARROW)
    const placed = layoutAnimals([spec('side', { edge: 'right', t: 0.5 })], area)
    expect(placed[0].yaw).toBe(yawFacingRoom('right'))
    expect(placed[0].from[0]).toBeGreaterThan(0)
  })

  it('still moves them in the old room', () => {
    const placed = layoutAnimals([spec('side', { edge: 'right', t: 0.5 })], { halfW: 3, halfH: 5 })
    expect(placed[0].yaw).toBe(yawFacingRoom('back'))
  })
})
