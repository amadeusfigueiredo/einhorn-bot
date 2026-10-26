// The light of a classroom follows how hard its stage is: easy stages are in
// the morning, middle ones at sunset, the hardest at night. Pure data; the 3D
// view turns it into lights, bloom and the sky behind the room.
import type { Difficulty } from '../types'
import { mix } from '../utils/color'

export type TimeOfDay = 'morning' | 'sunset' | 'night'

export type TimeLight = {
  /** The sky colour of the soft hemisphere light. */
  hemiSky: string
  hemiIntensity: number
  /** The sun (or moon) light, before it is tinted by the room. */
  key: string
  keyIntensity: number
  keyPosition: readonly [number, number, number]
  /** How strongly bright things glow. */
  bloom: number
  /** The sky behind the room, top to bottom. */
  sky: readonly [string, string]
}

export const TIME_LIGHT: Record<TimeOfDay, TimeLight> = {
  morning: {
    hemiSky: '#fff4fb',
    hemiIntensity: 1.5,
    key: '#fff1d6',
    keyIntensity: 1.3,
    keyPosition: [-5, 9, 4],
    bloom: 0.2,
    sky: ['#cdebff', '#ffe3ef'],
  },
  sunset: {
    hemiSky: '#ffd6e7',
    hemiIntensity: 1.3,
    key: '#ffa87a',
    keyIntensity: 1.15,
    keyPosition: [-9, 6.5, 3],
    bloom: 0.4,
    sky: ['#8a6bf0', '#ffc48a'],
  },
  night: {
    hemiSky: '#a9bdff',
    hemiIntensity: 1.0,
    key: '#9fcbff',
    keyIntensity: 0.85,
    keyPosition: [4, 9, 3],
    bloom: 0.75,
    sky: ['#0e0a26', '#3a2a7a'],
  },
}

export const TIMES: readonly TimeOfDay[] = ['morning', 'sunset', 'night']

/** Easy is morning, medium is sunset, hard is night. */
export function timeForDifficulty(difficulty: Difficulty): TimeOfDay {
  switch (difficulty) {
    case 'leicht':
      return 'morning'
    case 'mittel':
      return 'sunset'
    default:
      return 'night'
  }
}

export type SceneLight = {
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  key: string
  keyIntensity: number
  keyPosition: readonly [number, number, number]
  bloom: number
  sky: readonly [string, string]
}

/**
 * The lights of one room at one time of day: the time's sun tinted by the
 * room's own light colour, the room's floor colour bouncing back up.
 */
export function sceneLight(time: TimeOfDay, roomLight: string, roomFloor: string): SceneLight {
  const t = TIME_LIGHT[time]
  return {
    hemiSky: t.hemiSky,
    hemiGround: roomFloor,
    hemiIntensity: t.hemiIntensity,
    key: mix(roomLight, t.key, 0.55),
    keyIntensity: t.keyIntensity,
    keyPosition: t.keyPosition,
    bloom: t.bloom,
    sky: t.sky,
  }
}
