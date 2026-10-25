import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { CLASSROOMS } from './classrooms'
import { sceneLight, TIME_LIGHT, timeForDifficulty, TIMES } from './timeOfDay'

const HEX = /^#[0-9a-f]{6}$/i

describe('time of day', () => {
  it('easy is morning, medium is sunset, hard is night', () => {
    expect(timeForDifficulty('leicht')).toBe('morning')
    expect(timeForDifficulty('mittel')).toBe('sunset')
    expect(timeForDifficulty('schwer')).toBe('night')
  })

  it('every stage is lit by the time its difficulty asks for', () => {
    for (const stage of STAGES) {
      expect(CLASSROOMS[stage.name].time, stage.name).toBe(timeForDifficulty(stage.difficulty))
    }
  })

  it('five stages of each time of day', () => {
    for (const t of TIMES) expect(STAGES.filter((s) => CLASSROOMS[s.name].time === t).length, t).toBe(5)
  })

  it('every preset has proper colours, a sensible strength and a sky', () => {
    for (const t of TIMES) {
      const l = TIME_LIGHT[t]
      for (const c of [l.hemiSky, l.key, ...l.sky]) expect(c, t).toMatch(HEX)
      expect(l.hemiIntensity).toBeGreaterThan(0.3)
      expect(l.hemiIntensity).toBeLessThan(3)
      expect(l.keyIntensity).toBeGreaterThan(0.3)
      expect(l.keyIntensity).toBeLessThan(3)
      expect(l.keyPosition[1], 'the light comes from above').toBeGreaterThan(3)
      expect(l.bloom).toBeGreaterThanOrEqual(0)
      expect(l.bloom).toBeLessThan(1.5)
    }
  })

  it('the day gets darker and glowier from morning to night', () => {
    const [m, s, n] = TIMES.map((t) => TIME_LIGHT[t])
    expect(m.hemiIntensity).toBeGreaterThan(s.hemiIntensity)
    expect(s.hemiIntensity).toBeGreaterThan(n.hemiIntensity)
    expect(m.keyIntensity).toBeGreaterThan(n.keyIntensity)
    expect(m.bloom).toBeLessThan(s.bloom)
    expect(s.bloom).toBeLessThan(n.bloom)
  })

  it('a sunset sun is lower and to the side', () => {
    expect(TIME_LIGHT.sunset.keyPosition[1]).toBeLessThan(TIME_LIGHT.morning.keyPosition[1])
    expect(Math.abs(TIME_LIGHT.sunset.keyPosition[0])).toBeGreaterThan(Math.abs(TIME_LIGHT.morning.keyPosition[0]))
  })

  describe('sceneLight', () => {
    it('uses the room floor for the bounce light and the time for the rest', () => {
      const l = sceneLight('sunset', '#ffffff', '#123456')
      expect(l.hemiGround).toBe('#123456')
      expect(l.hemiSky).toBe(TIME_LIGHT.sunset.hemiSky)
      expect(l.hemiIntensity).toBe(TIME_LIGHT.sunset.hemiIntensity)
      expect(l.bloom).toBe(TIME_LIGHT.sunset.bloom)
      expect(l.sky).toEqual(TIME_LIGHT.sunset.sky)
    })

    it('tints the sun with the room: a pink room at sunset is pinker than the sunset alone', () => {
      const plain = sceneLight('morning', '#ffffff', '#000000').key
      const pink = sceneLight('morning', '#ff8fc4', '#000000').key
      expect(pink).not.toBe(plain)
      expect(pink).toMatch(HEX)
    })

    it('is a valid light for every room', () => {
      for (const [name, room] of Object.entries(CLASSROOMS)) {
        const l = sceneLight(room.time, room.palette.light, room.palette.floorAlt)
        expect(l.key, name).toMatch(HEX)
        expect(l.hemiGround, name).toMatch(HEX)
      }
    })
  })
})
