import type { DoorTheme } from '../film/filmData'
import { DOOR_THEMES } from '../film/filmData'
import type { PlaceId } from './placeModel'

/** The look of the door that leads to a place: green for the yard, brown for the library, pink for the classroom. */
export const PLACE_DOOR_THEMES: Record<PlaceId, DoorTheme> = {
  yard: { door: '#7ED39A', trim: '#3FAF6A', glow: '#E8FFD6', decor: ['funnyFlower', 'starLollipop', 'bubble'] },
  library: { door: '#C9935F', trim: '#9E6B45', glow: '#FFF0DA', decor: ['book', 'book', 'starLollipop'] },
  class: DOOR_THEMES[0],
  /** The school corridor: lilac like its walls, with the colours of the five subjects round it. */
  /** The big door of the sports hall: sunny orange. */
  sports: { door: '#FFB45E', trim: '#E88A2B', glow: '#FFF1D6', decor: ['starLollipop', 'bubble', 'funnyFlower'] },
  /** The door of the pony yard: the green of its archway. */
  pony: { door: '#8ADFA6', trim: '#3FAF6A', glow: '#E8FFD6', decor: ['funnyFlower', 'starLollipop', 'bubble'] },
  pool: { door: '#8EC5FF', trim: '#4A90E2', glow: '#E3F6FF', decor: ['bubble', 'starLollipop', 'funnyFlower'] },
  dojo: { door: '#B79CFF', trim: '#7B5CF0', glow: '#F1E8FF', decor: ['starLollipop', 'lantern', 'bubble'] },
  dance: { door: '#FF9EC9', trim: '#E05A9E', glow: '#FFE3F1', decor: ['starLollipop', 'bubble', 'funnyFlower'] },
  tech: { door: '#6EA8FF', trim: '#3A6FD8', glow: '#E3EEFF', decor: ['bubble', 'starLollipop', 'lantern'] },
  science: { door: '#9B7BFF', trim: '#6A4BD8', glow: '#EFE6FF', decor: ['starLollipop', 'bubble', 'funnyFlower'] },
  hall: { door: '#C9B5FF', trim: '#8E6CF0', glow: '#F1E8FF', decor: ['starLollipop', 'lantern', 'funnyFlower'] },
}
