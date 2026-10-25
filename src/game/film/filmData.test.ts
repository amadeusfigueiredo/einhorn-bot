import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { CLASS_TRANSITION as C, DOOR_THEMES, doorTheme, EXIT_DOOR, exitDoorAt, exitDoorShown, INTRO_FILM, OUTRO_FILM, SUBJECT_COLORS, SUBJECT_FIRST_STAGE } from './filmData'

describe('class change timeline', () => {
  it('lasts 14 seconds', () => {
    expect(C.duration).toBe(14)
  })

  it('runs in order: bye, to the door, door opens, corridor, knock, next door, next class, flash', () => {
    expect(C.sayBye[0]).toBe(0)
    expect(C.walkToDoor[0]).toBe(C.sayBye[1])
    expect(C.doorAOpen[0]).toBeGreaterThan(C.walkToDoor[0])
    expect(C.doorAOpen[0]).toBeLessThan(C.walkToDoor[1])
    expect(C.throughDoorA[0]).toBeGreaterThanOrEqual(C.doorAOpen[1])
    expect(C.doorAClose[0]).toBe(C.throughDoorA[1])
    expect(C.corridorWalk[0]).toBe(C.doorAClose[1])
    expect(C.knock[0]).toBe(C.corridorWalk[1])
    expect(C.doorBOpen[0]).toBe(C.knock[1])
    expect(C.enterRoomB[0]).toBe(C.doorBOpen[1])
    expect(C.roomBLook[0]).toBe(C.enterRoomB[1])
    expect(C.flash[1]).toBe(C.duration)
  })

  it('the corridor walk is about three seconds or a little more', () => {
    const [a, b] = C.corridorWalk
    expect(b - a).toBeGreaterThanOrEqual(3)
    expect(b - a).toBeLessThanOrEqual(4)
  })

  it('the next stage is switched on behind the film when the cut to its class happens', () => {
    expect(C.swapAt).toBe(C.enterRoomB[0])
    expect(C.swapAt).toBeLessThan(C.duration)
  })

  it('the title card is on while the camera shows the new room, before the flash', () => {
    expect(C.titleCard[0]).toBeGreaterThanOrEqual(C.roomBLook[0])
    expect(C.titleCard[1]).toBeLessThanOrEqual(C.flash[0])
  })
})

describe('intro film timeline', () => {
  it('lasts 60 seconds and its shots follow each other without gaps', () => {
    expect(INTRO_FILM.duration).toBe(60)
    expect(INTRO_FILM.shots[0].from).toBe(0)
    INTRO_FILM.shots.slice(1).forEach((s, i) => expect(s.from).toBe(INTRO_FILM.shots[i].to))
    expect(INTRO_FILM.shots.at(-1)!.to).toBeGreaterThanOrEqual(60)
  })

  it('starts with the audience coming in and ends at the gate', () => {
    expect(INTRO_FILM.shots[0].name).toBe('theatre')
    expect(INTRO_FILM.shots.at(-1)!.name).toBe('gate')
  })

  it('has the five class doors popping up inside the classes shot', () => {
    const classes = INTRO_FILM.shots.find((s) => s.name === 'classes')!
    expect(INTRO_FILM.doorsFrom).toBeGreaterThanOrEqual(classes.from)
    expect(INTRO_FILM.doorsFrom + 4).toBeLessThan(classes.to)
  })

  it('the curtains open before the title and the bell rings inside the school shot', () => {
    expect(INTRO_FILM.curtainsOpen[1]).toBeLessThanOrEqual(INTRO_FILM.title[0] + 0.5)
    const school = INTRO_FILM.shots.find((s) => s.name === 'school')!
    expect(INTRO_FILM.bell[0]).toBeGreaterThanOrEqual(school.from)
    expect(INTRO_FILM.bell[1]).toBeLessThanOrEqual(school.to)
  })
})

describe('ending film timeline', () => {
  it('lasts 20 seconds in four shots', () => {
    expect(OUTRO_FILM.duration).toBe(20)
    expect(OUTRO_FILM.shots.map((s) => s.name)).toEqual(['crown', 'parade', 'album', 'night'])
    OUTRO_FILM.shots.slice(1).forEach((s, i) => expect(s.from).toBe(OUTRO_FILM.shots[i].to))
  })

  it('all 15 stickers have landed before the album shot ends', () => {
    const last = OUTRO_FILM.stickersFrom + 14 * OUTRO_FILM.stickerEvery + 0.8
    expect(last).toBeLessThanOrEqual(OUTRO_FILM.shots[2].to)
  })

  it('"play again" appears during the night shot', () => {
    expect(OUTRO_FILM.againAt).toBeGreaterThanOrEqual(OUTRO_FILM.shots[3].from)
    expect(OUTRO_FILM.againAt).toBeLessThan(OUTRO_FILM.duration)
  })
})

describe('door themes', () => {
  it('there is one per stage, each with 2 to 4 decorations and a hex colour', () => {
    expect(DOOR_THEMES).toHaveLength(STAGES.length)
    for (const t of DOOR_THEMES) {
      expect(t.decor.length).toBeGreaterThanOrEqual(2)
      expect(t.decor.length).toBeLessThanOrEqual(4)
      for (const c of [t.door, t.trim, t.glow]) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('no two neighbouring classes have the same door', () => {
    DOOR_THEMES.slice(1).forEach((t, i) => expect(`${t.door}${t.trim}`).not.toBe(`${DOOR_THEMES[i].door}${DOOR_THEMES[i].trim}`))
  })

  it('doorTheme clamps out-of-range stages', () => {
    expect(doorTheme(-4)).toBe(DOOR_THEMES[0])
    expect(doorTheme(99)).toBe(DOOR_THEMES.at(-1))
    expect(doorTheme(6)).toBe(DOOR_THEMES[6])
  })

  it('there is one colour and one first stage per subject, and the first stages are 3 apart', () => {
    expect(SUBJECT_COLORS).toHaveLength(5)
    expect(SUBJECT_FIRST_STAGE).toHaveLength(5)
    SUBJECT_FIRST_STAGE.forEach((s, i) => expect(s).toBe(i * 3))
    SUBJECT_FIRST_STAGE.forEach((s, i) => {
      if (i > 0) expect(STAGES[s].subject).not.toBe(STAGES[s - 1].subject)
    })
  })
})

describe('the magic door of a class', () => {
  it('in the landscape room it stands at x 5.6, z -2.8 (right of the teacher, at the back)', () => {
    expect(EXIT_DOOR[0]).toBeCloseTo(5.6)
    expect(EXIT_DOOR[1]).toBe(0)
    expect(EXIT_DOOR[2]).toBeCloseTo(-2.8)
  })

  it('is a fixed share of the play area, so it stays inside the room at any size', () => {
    for (const [halfW, halfH] of [[7.2, 4.05], [3.8, 6.75], [8, 3.6]]) {
      const [x, , z] = exitDoorAt(halfW, halfH)
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(halfW)
      expect(z).toBeLessThan(0)
      expect(z).toBeGreaterThan(-halfH)
      expect(-z / halfH).toBeCloseTo(56 / 81)
    }
  })

  it('the game room shows it in a wide room, and a square-ish one', () => {
    expect(exitDoorShown(7.2, 4.05)).toBe(true)
    expect(exitDoorShown(8, 3.6)).toBe(true)
    expect(exitDoorShown(5, 5)).toBe(true)
  })

  it('and leaves it out on a phone held upright, where the buttons and badge cover the top of the room', () => {
    expect(exitDoorShown(3.8, 6.75)).toBe(false)
    expect(exitDoorShown(3, 4)).toBe(false)
  })

  it('stands at the back and on the right, behind the unicorns', () => {
    const [x, , z] = exitDoorAt(7.2, 4.05)
    expect(x).toBeGreaterThan(3)
    expect(z).toBeLessThan(-2)
  })
})
