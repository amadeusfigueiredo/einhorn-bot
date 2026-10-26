import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { isTeacher } from './teachers'
import { PLAYER_LOOK, RAINBOW, wearing, type HornType } from './unicornLooks'
import { STAGE_LOOKS, fromDesign, lookForNpc, playerLookFor } from './stageLooks'

describe('stage looks', () => {
  it('every one of the 15 stages has three students and a teacher', () => {
    expect(STAGE_LOOKS).toHaveLength(15)
    for (const s of STAGE_LOOKS) expect(s.students).toHaveLength(3)
  })

  it('the four unicorns of a stage all look different', () => {
    STAGE_LOOKS.forEach((s, i) => {
      const looks = [...s.students, s.teacher].map((l) => JSON.stringify(l))
      expect(new Set(looks).size, `stage ${i + 1}`).toBe(4)
      expect(new Set([...s.students, s.teacher].map((l) => l.coat)).size, `stage ${i + 1} coats`).toBe(4)
    })
  })

  it('only the teacher wears the teacher outfit, and stands a little taller', () => {
    for (const s of STAGE_LOOKS) {
      expect(wearing(s.teacher, 'teacher')).toBeDefined()
      expect(s.teacher.build).toBeGreaterThan(1)
      for (const student of s.students) expect(wearing(student, 'teacher')).toBeUndefined()
    }
  })

  it('all five horns are used, and the game is not one horn on repeat', () => {
    const used = new Set<HornType>()
    for (const s of STAGE_LOOKS) for (const l of [...s.students, s.teacher]) used.add(l.hornType ?? 'straight')
    expect([...used].sort()).toEqual(['curly', 'curved', 'rainbow', 'star', 'straight'])
  })

  it('the teacher is the fourth unicorn of every stage, and gets the teacher look', () => {
    STAGES.forEach((stage, si) => {
      const npcs = stage.npcs ?? []
      expect(npcs.findIndex(isTeacher), `stage ${si + 1}`).toBe(3)
      npcs.forEach((npc, i) => {
        const look = lookForNpc(si, i, npc)
        expect(look).toBe(i === 3 ? STAGE_LOOKS[si].teacher : STAGE_LOOKS[si].students[i])
      })
    })
  })

  it('stages without a design fall back to the spare looks', () => {
    const a = lookForNpc(40, 0)
    expect(a.coat).toBeTruthy()
    expect(lookForNpc(40, 1, { role: 'teacher' }).accessory).toBe('teacher')
  })
})

describe('fromDesign', () => {
  it("turns 'rainbow' into the full rainbow and a colour into two shades", () => {
    const rainbow = fromDesign({ body: '#fff', mane: 'rainbow', hooves: '#000', horn: 'star' }, 0, 0)
    expect(rainbow.mane).toEqual(RAINBOW)
    const plain = fromDesign({ body: '#fff', mane: '#3cc9a5', hooves: '#000', horn: 'curly' }, 0, 0)
    expect(plain.mane).toHaveLength(2)
    expect(plain.mane[0]).toBe('#3cc9a5')
    expect(plain.hornType).toBe('curly')
    expect(plain.horn).toBe('#ffd166')
  })

  it('the first accessory is the main one, the rest are extras, and flowerCrown is flowers', () => {
    const look = fromDesign(
      { body: '#fff', mane: '#000', hooves: '#000', horn: 'straight', accessories: [{ type: 'flowerCrown' }, { type: 'pearls' }, { type: 'bow', color: '#123456' }] },
      1,
      0
    )
    expect(look.accessory).toBe('flowers')
    expect(look.extras?.map((e) => e.type)).toEqual(['pearls', 'bow'])
    expect(wearing(look, 'bow')).toBe('#123456')
    expect(wearing(look, 'pearls')).toBeDefined()
  })
})

describe('playerLookFor', () => {
  it('Amara always carries her backpack and keeps her rainbow', () => {
    STAGE_LOOKS.forEach((_, i) => {
      const look = playerLookFor(i)
      expect(wearing(look, 'backpack')).toBeDefined()
      expect(look.mane).toEqual(RAINBOW)
      expect(look.coat).toBe(PLAYER_LOOK.coat)
    })
  })

  it('wears a helmet on the moon and in the finale, a scarf in the ice stage, a crown at the end', () => {
    expect(wearing(playerLookFor(2), 'helmet')).toBeDefined()
    expect(wearing(playerLookFor(14), 'helmet')).toBeDefined()
    expect(wearing(playerLookFor(14), 'crown')).toBeDefined()
    expect(wearing(playerLookFor(11), 'scarf')).toBeDefined()
    expect(wearing(playerLookFor(0), 'helmet')).toBeUndefined()
  })

  it('beyond the designed stages it is the plain player', () => {
    expect(playerLookFor(99)).toBe(PLAYER_LOOK)
  })
})
