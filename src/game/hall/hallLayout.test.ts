import { describe, expect, it } from 'vitest'
import { AREAS, DOOR_SPOTS, walkBounds, placeCamera, HALL_HEADROOM, HEADROOM, headroomOf, SIN_ELEVATION } from '../places/placeLayout'
import { STAGES } from '../constants/stages'
import { CLASS_COUNT, DOORS_PER_SUBJECT, HALL, HALL_SECTIONS, doorNear, exitDoorSpot, hallArrival, hallDoorSpot, hallDoorX, hallFootZ, nearBlock, sectionGaps, sectionSpan } from './hallLayout'

describe('the corridor layout', () => {
  it('has a class door for every class of the school, in order, left to right', () => {
    expect(CLASS_COUNT).toBe(STAGES.length)
    const xs = Array.from({ length: CLASS_COUNT }, (_, i) => hallDoorX(i))
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    expect(new Set(xs).size).toBe(CLASS_COUNT)
  })

  it('puts three doors to a subject, a door spacing apart, and a wider gap between the subjects', () => {
    for (let i = 1; i < CLASS_COUNT; i++) {
      const gap = hallDoorX(i) - hallDoorX(i - 1)
      expect(gap, `door ${i + 1}`).toBeCloseTo(i % DOORS_PER_SUBJECT === 0 ? HALL.doorSpacing + HALL.subjectGap : HALL.doorSpacing, 9)
    }
  })

  it('has the whole row of doors inside the corridor, with room at both ends, and the green door before the first class door', () => {
    expect(hallDoorX(0) - 1.4).toBeGreaterThan(-HALL.halfW)
    expect(hallDoorX(CLASS_COUNT - 1) + 1.4).toBeLessThan(HALL.halfW)
    expect(HALL.exitDoorX).toBeLessThan(hallDoorX(0) - 2)
    expect(exitDoorSpot()[0]).toBe(HALL.exitDoorX)
  })

  it('stands every door in the back wall, on the floor', () => {
    for (let i = 0; i < CLASS_COUNT; i++) {
      const [x, y, z] = hallDoorSpot(i)
      expect(x).toBe(hallDoorX(i))
      expect(y).toBe(0)
      expect(z).toBeGreaterThan(HALL.wallZ)
      expect(z).toBeLessThan(HALL.wallZ + 0.5)
    }
  })

  it('is long enough for the fifteen doors and the three big doors of the rooms: 76 units, centred on 0', () => {
    expect(HALL.halfW * 2).toBe(76)
    expect(AREAS.hall.halfW).toBe(HALL.halfW)
  })

  it('shares the green door with the layout of the places', () => {
    expect(DOOR_SPOTS.hall.yard).toEqual(exitDoorSpot())
  })

  it('has the place where she stands at a door in front of it, inside where she can walk, the same for every door', () => {
    const b = walkBounds('hall')
    expect(hallFootZ()).toBe(HALL.wallZ + HALL.footFromWall)
    expect(hallFootZ()).toBeGreaterThanOrEqual(b.minZ)
    expect(hallFootZ()).toBeLessThanOrEqual(b.maxZ)
    for (let i = 0; i < CLASS_COUNT; i++) {
      expect(hallDoorX(i)).toBeGreaterThan(b.minX)
      expect(hallDoorX(i)).toBeLessThan(b.maxX)
    }
  })
})

describe('the subject blocks', () => {
  it('are five of three classes each, in the order of the school, with the subjects the stages have', () => {
    expect(HALL_SECTIONS).toHaveLength(5)
    const flat = HALL_SECTIONS.flatMap((s) => [...s.classes])
    expect(flat).toEqual(Array.from({ length: CLASS_COUNT }, (_, i) => i))
    for (const s of HALL_SECTIONS) for (const c of s.classes) expect(STAGES[c].subject, `class ${c + 1}`).toBe(s.subject)
  })

  it('have a colour each, all different', () => {
    expect(new Set(HALL_SECTIONS.map((s) => s.color)).size).toBe(5)
  })

  it('span their three doors with room either side, and do not overlap', () => {
    for (let i = 0; i < 5; i++) {
      const span = sectionSpan(i)
      expect(span.from).toBeLessThan(hallDoorX(HALL_SECTIONS[i].classes[0]))
      expect(span.to).toBeGreaterThan(hallDoorX(HALL_SECTIONS[i].classes[2]))
      expect(span.middle).toBeCloseTo((span.from + span.to) / 2, 9)
      if (i > 0) expect(span.from).toBeGreaterThanOrEqual(sectionSpan(i - 1).to - 1e-9)
    }
  })

  it('have a gap between each two: a window and a plant stand there', () => {
    const gaps = sectionGaps()
    expect(gaps).toHaveLength(4)
    gaps.forEach((x, i) => {
      expect(x).toBeGreaterThan(sectionSpan(i).middle)
      expect(x).toBeLessThan(sectionSpan(i + 1).middle)
      expect(x).toBeGreaterThan(hallDoorX(HALL_SECTIONS[i].classes[2]))
      expect(x).toBeLessThan(hallDoorX(HALL_SECTIONS[i + 1].classes[0]))
    })
  })
})

describe('where she stands on coming in', () => {
  it('from a class: in front of the door of that class, a step from the wall', () => {
    for (const i of [0, 4, 14]) {
      const a = hallArrival('class', i)
      expect(a.x).toBe(hallDoorX(i))
      expect(a.z).toBeGreaterThan(hallFootZ())
    }
  })

  it('from the yard (or anywhere else): at the green door, on the way in from the left', () => {
    for (const from of ['yard', 'library', 'hall'] as const) {
      const a = hallArrival(from, 7)
      expect(a.x).toBeGreaterThan(HALL.exitDoorX)
      expect(a.x).toBeLessThan(hallDoorX(0))
      expect(a.z).toBeGreaterThan(hallFootZ())
    }
  })

  it('always inside where she can walk', () => {
    const b = walkBounds('hall')
    for (let i = 0; i < CLASS_COUNT; i++) {
      for (const a of [hallArrival('class', i), hallArrival('yard', i)]) {
        expect(a.x).toBeGreaterThanOrEqual(b.minX)
        expect(a.x).toBeLessThanOrEqual(b.maxX)
        expect(a.z).toBeGreaterThanOrEqual(b.minZ)
        expect(a.z).toBeLessThanOrEqual(b.maxZ)
      }
    }
  })
})

describe('doorNear', () => {
  it('finds the door she is at, when she is within reach of it', () => {
    for (let i = 0; i < CLASS_COUNT; i++) expect(doorNear(hallDoorX(i), 1.5)).toBe(i)
    expect(doorNear(hallDoorX(4) + 1, 1.5)).toBe(4)
  })

  it('picks the nearer of two doors', () => {
    expect(doorNear(hallDoorX(1) + 0.4, 5)).toBe(1)
    expect(doorNear(hallDoorX(1) + 2.0, 5)).toBe(2)
  })

  it('finds none far from every door (in the gap, before the first, past the last)', () => {
    expect(doorNear(hallDoorX(0) - 4, 1.5)).toBeNull()
    expect(doorNear(hallDoorX(14) + 3, 1.5)).toBeNull()
    expect(doorNear(sectionGaps()[0], 0.5)).toBeNull()
  })
})

describe('the camera of the corridor', () => {
  it('follows her along the corridor and stops at its ends (the picture never shows past a wall)', () => {
    const at = (x: number) => placeCamera({ room: 'hall', viewW: 1280, viewH: 700, player: { x, z: 0 } })
    expect(at(0).x).toBe(0)
    expect(at(10).x).toBe(10)
    expect(at(-1000).x).toBeCloseTo(-at(1000).x, 9)
    expect(at(1000).x).toBeLessThan(HALL.halfW)
    expect(at(1000).x).toBeGreaterThan(HALL.halfW - 8)
  })

  it('shows the tall wall: much more room above the floor than a yard or a library', () => {
    expect(HALL_HEADROOM).toBeGreaterThan(HEADROOM * 2)
    expect(headroomOf('hall')).toBe(HALL_HEADROOM)
    expect(headroomOf('yard')).toBe(HEADROOM)
    expect(headroomOf('library')).toBe(HEADROOM)
  })

  it('aims further back the more room there is above the floor', () => {
    const hall = placeCamera({ room: 'hall', viewW: 1280, viewH: 700, player: { x: 0, z: 0 } })
    const yard = placeCamera({ room: 'yard', viewW: 1280, viewH: 700, player: { x: 0, z: 0 } })
    expect(hall.aimBack).toBeCloseTo(-HALL_HEADROOM / 2 / SIN_ELEVATION, 9)
    expect(yard.aimBack).toBeCloseTo(-HEADROOM / 2 / SIN_ELEVATION, 9)
    expect(hall.aimBack).toBeLessThan(yard.aimBack)
  })

  it('shows the whole depth of the corridor at once, so it does not move toward or away from the wall', () => {
    const a = placeCamera({ room: 'hall', viewW: 1280, viewH: 700, player: { x: 0, z: -2 } })
    const b = placeCamera({ room: 'hall', viewW: 1280, viewH: 700, player: { x: 0, z: 2.8 } })
    expect(a.z).toBeCloseTo(b.z, 1)
  })
})

describe('which subject blocks a film looks at', () => {
  it('takes the blocks within the picture of the door it looks at and no others', () => {
    for (let s = 0; s < HALL_SECTIONS.length; s++) {
      const { middle } = sectionSpan(s)
      expect(nearBlock(s, middle)).toBe(true)
    }
    expect(nearBlock(0, hallDoorX(CLASS_COUNT - 1))).toBe(false)
    expect(nearBlock(HALL_SECTIONS.length - 1, hallDoorX(0))).toBe(false)
  })

  it('always has at least one block, and never all of them, near any door', () => {
    for (let c = 0; c < CLASS_COUNT; c++) {
      const near = HALL_SECTIONS.filter((_, s) => nearBlock(s, hallDoorX(c))).length
      expect(near).toBeGreaterThanOrEqual(1)
      expect(near).toBeLessThan(HALL_SECTIONS.length)
    }
  })
})
