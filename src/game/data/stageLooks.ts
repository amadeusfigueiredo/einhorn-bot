// Who is in every classroom: 3 students and the teacher of each of the 15
// stages, each with their own colours, horn and accessories, and what the
// player additionally wears in some stages. Pure data in the design's terms
// (`DesignLook`); `fromDesign` turns it into the `UnicornLook` the 3D view
// draws. The teacher is the 4th unicorn of a stage (`role: 'teacher'` in
// stageSpecs.ts) and always wears the teacher outfit.
import type { NPC } from '../types'
import { isTeacher } from './teachers'
import {
  NPC_LOOKS,
  PLAYER_LOOK,
  RAINBOW,
  TEACHER_LOOK,
  type Accessory,
  type HornType,
  type UnicornLook,
  type WornAccessory,
} from './unicornLooks'
import { lighten } from '../utils/color'
import { DEFAULT_OUTFIT, applyOutfit, type Outfit } from '../player/outfit'

type DesignAccessory = { type: Exclude<Accessory, 'none' | 'flowers'> | 'flowerCrown'; color?: string }

type DesignLook = {
  body: string
  /** A colour, or 'rainbow'. */
  mane: string
  hooves: string
  horn: HornType
  hornColor?: string
  spots?: string
  stars?: string
  paintSpots?: boolean
  accessories?: readonly DesignAccessory[]
}

type StageDesign = {
  students: readonly [DesignLook, DesignLook, DesignLook]
  teacher: DesignLook
  /** What the player wears here on top of the usual backpack. */
  playerExtra?: readonly DesignAccessory[]
}

const DESIGN: readonly StageDesign[] = [
  // Stage 1
  {
    students: [
      { body: '#BFF3E4', mane: '#3CC9A5', hooves: '#2A8C78', horn: 'curly', hornColor: '#FFD166' },
      { body: '#E6D9FF', mane: '#8A6BF0', hooves: '#6B4FD8', horn: 'curved', hornColor: '#FF9EC4', accessories: [{ type: 'bow', color: '#FF7EB6' }] },
      { body: '#FFE3A0', mane: '#FF9E5E', hooves: '#C9733A', horn: 'rainbow', spots: '#FFC65C' },
    ],
    teacher: { body: '#F7D6E6', mane: '#C46BB0', hooves: '#8A3A7A', horn: 'straight', hornColor: '#FFD166', accessories: [{ type: 'teacher' }] },
  },
  // Stage 2
  {
    students: [
      { body: '#FFD9C2', mane: '#FF7E9E', hooves: '#C9505E', horn: 'star', hornColor: '#FFF7FB' },
      { body: '#BDE3FF', mane: '#3A9AD6', hooves: '#2A5FA8', horn: 'straight', hornColor: '#FFF3A0', spots: '#8EC5FF', accessories: [{ type: 'sunglasses' }] },
      { body: '#D9F7C9', mane: '#4FB27A', hooves: '#2E8C5A', horn: 'curly', hornColor: '#FF7EB6' },
    ],
    teacher: { body: '#FFF3C4', mane: '#FFB347', hooves: '#C48A5C', horn: 'curved', hornColor: '#FF7EB6', accessories: [{ type: 'teacher' }] },
  },
  // Stage 3
  {
    students: [
      { body: '#C9B5FF', mane: '#FF9EF0', hooves: '#6B4FD8', horn: 'rainbow', accessories: [{ type: 'helmet' }] },
      { body: '#9FE3F5', mane: '#1E6FA8', hooves: '#14405A', horn: 'star', hornColor: '#FFF3A0', spots: '#5AC2E0', accessories: [{ type: 'helmet' }] },
      { body: '#FFB3D4', mane: '#FFE680', hooves: '#E05C98', horn: 'curly', hornColor: '#FFF7FB', accessories: [{ type: 'helmet' }] },
    ],
    teacher: { body: '#A9B6E8', mane: '#FFF7FB', hooves: '#3B4A9A', horn: 'straight', hornColor: '#FFD166', accessories: [{ type: 'teacher' }] },
    playerExtra: [{ type: 'helmet' }],
  },
  // Stage 4
  {
    students: [
      { body: '#FFE0F0', mane: '#FF5E9E', hooves: '#B03A70', horn: 'curved', hornColor: '#B79CFF', accessories: [{ type: 'bow', color: '#FFD166' }] },
      { body: '#C8F2C9', mane: '#FFB347', hooves: '#4F9A5A', horn: 'curly', hornColor: '#FFF7FB', spots: '#8FD99A' },
      { body: '#B79CFF', mane: '#FFF3A0', hooves: '#4A3A9A', horn: 'rainbow' },
    ],
    teacher: { body: '#E9DCCF', mane: '#8A5A30', hooves: '#5A3A20', horn: 'straight', hornColor: '#FFD166', accessories: [{ type: 'teacher' }] },
  },
  // Stage 5
  {
    students: [
      { body: '#FFC4DD', mane: '#FF5E7E', hooves: '#C9505E', horn: 'curly', hornColor: '#FFF3A0', accessories: [{ type: 'pearls' }] },
      { body: '#FFF3C4', mane: '#FF9E5E', hooves: '#C9733A', horn: 'curved', hornColor: '#6EE7C8', spots: '#FFD08A' },
      { body: '#E9B8FF', mane: '#6B4FD8', hooves: '#4A3A9A', horn: 'star', hornColor: '#8EC5FF', accessories: [{ type: 'pearls' }] },
    ],
    teacher: { body: '#BDF2E4', mane: '#3CC9A5', hooves: '#2A8C78', horn: 'rainbow', accessories: [{ type: 'teacher' }] },
  },
  // Stage 6
  {
    students: [
      { body: '#3A2A7A', mane: '#FFD166', hooves: '#FFD166', horn: 'star', hornColor: '#FFF3A0', stars: '#FFE9A8' },
      { body: '#FFE3EF', mane: '#8EC5FF', hooves: '#6FA8F2', horn: 'curved', hornColor: '#E9B8FF' },
      { body: '#D9F7FF', mane: '#B79CFF', hooves: '#6B4FD8', horn: 'curly', hornColor: '#FFD166' },
    ],
    teacher: { body: '#FFF7E0', mane: '#6B4FD8', hooves: '#3B2A5C', horn: 'rainbow', accessories: [{ type: 'teacher' }] },
  },
  // Stage 7
  {
    students: [
      { body: '#FFE9A8', mane: '#FF7EB6', hooves: '#C48A5C', horn: 'straight', hornColor: '#B79CFF', accessories: [{ type: 'flowerCrown' }] },
      { body: '#FFB38A', mane: '#FFF7FB', hooves: '#C9733A', horn: 'curly', hornColor: '#6EE7C8', spots: '#FFD9C2' },
      { body: '#8EC5FF', mane: '#FFD166', hooves: '#2A5FA8', horn: 'curved', hornColor: '#FFF7FB' },
    ],
    teacher: { body: '#E3F7D9', mane: '#4FB27A', hooves: '#2E8C5A', horn: 'star', hornColor: '#FF7EB6', accessories: [{ type: 'teacher' }] },
  },
  // Stage 8
  {
    students: [
      { body: '#FFD6E7', mane: '#E05C98', hooves: '#9E3A6A', horn: 'rainbow' },
      { body: '#C9E8FF', mane: '#FFF7FB', hooves: '#6FA8F2', horn: 'straight', hornColor: '#FF9EC4', spots: '#A9D8FF' },
      { body: '#F2C9A8', mane: '#9E6B45', hooves: '#6B4530', horn: 'curly', hornColor: '#FFD166' },
    ],
    teacher: { body: '#E9DFFF', mane: '#FF9E5E', hooves: '#6B4FD8', horn: 'curved', hornColor: '#FFD166', accessories: [{ type: 'teacher' }] },
  },
  // Stage 9
  {
    students: [
      { body: '#2A4A6A', mane: '#3CE0C8', hooves: '#3CE0C8', horn: 'star', hornColor: '#7DF9FF', stars: '#7DF9FF' },
      { body: '#FFD6F5', mane: '#FF9EF0', hooves: '#B05AC0', horn: 'curly', hornColor: '#7DF9FF' },
      { body: '#E9F5FF', mane: '#B79CFF', hooves: '#6B4FD8', horn: 'rainbow' },
    ],
    teacher: { body: '#FFE9A8', mane: '#3CE0C8', hooves: '#C48A5C', horn: 'curved', hornColor: '#FF9EF0', accessories: [{ type: 'teacher' }] },
  },
  // Stage 10
  {
    students: [
      { body: '#FFD166', mane: '#FF7E3E', hooves: '#C9733A', horn: 'curved', hornColor: '#FF7EB6', accessories: [{ type: 'headphones', color: '#FF7EB6' }] },
      { body: '#FFC4DD', mane: '#6B4FD8', hooves: '#4A3A9A', horn: 'straight', hornColor: '#6EE7C8', spots: '#FF9EC4' },
      { body: '#9BE3B0', mane: '#FFF7FB', hooves: '#2E8C5A', horn: 'rainbow' },
    ],
    teacher: { body: '#FFF7FB', mane: '#8EC5FF', hooves: '#3A9AD6', horn: 'curly', hornColor: '#B79CFF', accessories: [{ type: 'teacher' }] },
  },
  // Stage 11
  {
    students: [
      { body: '#FFB38A', mane: '#FFF3A0', hooves: '#C9505E', horn: 'curly', hornColor: '#8EC5FF' },
      { body: '#B7AACF', mane: '#FF9EC4', hooves: '#5A4A80', horn: 'star', hornColor: '#FFD166', spots: '#D9CFF0' },
      { body: '#FFF3C4', mane: '#3A9AD6', hooves: '#C48A5C', horn: 'straight', hornColor: '#FF7EB6' },
    ],
    teacher: { body: '#FFD6E7', mane: '#8A6BF0', hooves: '#8A3A7A', horn: 'rainbow', accessories: [{ type: 'teacher' }] },
  },
  // Stage 12
  {
    students: [
      { body: '#E9F5FF', mane: '#6EF7C0', hooves: '#3A9AD6', horn: 'curly', hornColor: '#FF9EF0', accessories: [{ type: 'scarf', color: '#FF7EB6' }] },
      { body: '#FF9EC4', mane: '#FFF7FB', hooves: '#B03A70', horn: 'star', hornColor: '#E9F5FF', accessories: [{ type: 'scarf', color: '#8EC5FF' }] },
      { body: '#B79CFF', mane: '#6EF7C0', hooves: '#4A3A9A', horn: 'curved', hornColor: '#FFF7FB', stars: '#FFFFFF' },
    ],
    teacher: { body: '#DDE8FA', mane: '#FF7EB6', hooves: '#26306A', horn: 'straight', hornColor: '#FFD166', accessories: [{ type: 'teacher' }, { type: 'scarf', color: '#FFD166' }] },
    playerExtra: [{ type: 'scarf', color: '#6EE7C8' }],
  },
  // Stage 13
  {
    students: [
      { body: '#FFF3C4', mane: '#FF9EC4', hooves: '#9E6B45', horn: 'curly', hornColor: '#FF7EB6', spots: '#9E6B45' },
      { body: '#C8F2E4', mane: '#9E6B45', hooves: '#6B4530', horn: 'rainbow' },
      { body: '#FFC4DD', mane: '#FFF7FB', hooves: '#E05C98', horn: 'star', hornColor: '#6EE7C8', accessories: [{ type: 'bow', color: '#8EC5FF' }] },
    ],
    teacher: { body: '#E9DCCF', mane: '#B79CFF', hooves: '#5A3A20', horn: 'curved', hornColor: '#FFD166', accessories: [{ type: 'teacher' }] },
  },
  // Stage 14
  {
    students: [
      { body: '#FF8E8E', mane: '#FFD166', hooves: '#B03A3A', horn: 'straight', hornColor: '#FFF7FB', spots: '#FFC4C4' },
      { body: '#8EC5FF', mane: '#FF7EB6', hooves: '#2A5FA8', horn: 'rainbow', paintSpots: true },
      { body: '#FFE680', mane: '#4FB27A', hooves: '#C9A030', horn: 'curved', hornColor: '#8EC5FF' },
    ],
    teacher: { body: '#FFF7FB', mane: '#B79CFF', hooves: '#6B4FD8', horn: 'curly', hornColor: '#FF7EB6', accessories: [{ type: 'teacher' }], paintSpots: true },
  },
  // Stage 15
  {
    students: [
      { body: '#FF9EF0', mane: '#FFF3A0', hooves: '#B05AC0', horn: 'rainbow', stars: '#FFE9A8' },
      { body: '#6B4FD8', mane: '#6EF7C0', hooves: '#FFD166', horn: 'star', hornColor: '#FFD166', stars: '#FFFFFF' },
      { body: '#FFE9A8', mane: '#FF7EB6', hooves: '#C48A5C', horn: 'curly', hornColor: '#FFF7FB' },
    ],
    teacher: { body: '#E9F5FF', mane: '#FFD166', hooves: '#6B4FD8', horn: 'curved', hornColor: '#FF9EF0', accessories: [{ type: 'teacher' }] },
    playerExtra: [{ type: 'crown' }, { type: 'helmet' }],
  },
]

const DEFAULT_COLOR: Record<WornAccessory['type'], string> = {
  bow: '#ff7ec7',
  glasses: '#2a1a52',
  flowers: '#fff4e1',
  crown: '#ffd166',
  scarf: '#ff6b8b',
  teacher: TEACHER_LOOK.accessoryColor,
  sunglasses: '#2a1a52',
  helmet: '#dff1ff',
  pearls: '#fff4e1',
  headphones: '#ff7ec7',
  backpack: '#ff7ec7',
}

function worn(a: DesignAccessory): WornAccessory {
  const type = a.type === 'flowerCrown' ? 'flowers' : a.type
  return { type, color: a.color ?? DEFAULT_COLOR[type] }
}

/** `slot` picks the idle personality and body build, so a classroom is not in lockstep. */
export function fromDesign(d: DesignLook, slot: number, stageIndex: number): UnicornLook {
  const base = NPC_LOOKS[(((stageIndex * 3 + slot) % NPC_LOOKS.length) + NPC_LOOKS.length) % NPC_LOOKS.length]
  const all = (d.accessories ?? []).map(worn)
  const [main, ...extras] = all
  const isTeach = main?.type === 'teacher'
  return {
    coat: d.body,
    mane: d.mane === 'rainbow' ? RAINBOW : [d.mane, lighten(d.mane, 0.45)],
    horn: d.hornColor ?? '#ffd166',
    hooves: [d.hooves],
    accessory: main?.type ?? 'none',
    accessoryColor: main?.color ?? '#ffd166',
    personality: isTeach ? 'proud' : base.personality,
    // The teacher stands a little taller than the pupils.
    build: isTeach ? 1.08 : base.build,
    hornLength: 1,
    hornType: d.horn,
    spots: d.spots,
    glitter: d.stars,
    paintSpots: d.paintSpots,
    extras: extras.length ? extras : undefined,
  }
}

/** The look of every classroom, in stage order. */
export const STAGE_LOOKS: readonly { students: readonly UnicornLook[]; teacher: UnicornLook }[] = DESIGN.map((s, si) => ({
  students: s.students.map((l, i) => fromDesign(l, i, si)),
  teacher: fromDesign(s.teacher, 3, si),
}))

/**
 * The look of the NPC at `npcIndex` in stage `stageIndex`: the three students
 * are the first three unicorns, the teacher the fourth (or whoever the stage
 * marks as teacher). Beyond the designed stages the eight spare looks rotate.
 */
export function lookForNpc(stageIndex: number, npcIndex: number, npc?: Pick<NPC, 'role'>): UnicornLook {
  const set = STAGE_LOOKS[stageIndex]
  if (set) {
    const asTeacher = npc ? isTeacher(npc) : npcIndex >= 3
    return asTeacher ? set.teacher : set.students[Math.min(npcIndex, 2)]
  }
  const n = NPC_LOOKS.length
  const look = NPC_LOOKS[(((stageIndex * 3 + npcIndex) % n) + n) % n]
  return npc && isTeacher(npc) ? { ...look, accessory: 'teacher', accessoryColor: TEACHER_LOOK.accessoryColor } : look
}

/** Amara's unicorn in stage `stageIndex`: the rainbow unicorn with her backpack, plus what the stage asks for (helmet, scarf, crown), in the coat, horn and accessory the child chose (what the game always had when nothing was chosen). */
export function playerLookFor(stageIndex: number, outfit: Outfit = DEFAULT_OUTFIT): UnicornLook {
  const extra = DESIGN[stageIndex]?.playerExtra
  const base = !extra?.length ? PLAYER_LOOK : { ...PLAYER_LOOK, extras: [...PLAYER_LOOK.extras, ...extra.map(worn)] }
  return applyOutfit(base, outfit)
}
