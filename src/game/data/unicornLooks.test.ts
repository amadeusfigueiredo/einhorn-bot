import { describe, it, expect } from 'vitest'
import { NPC_LOOKS, PLAYER_LOOK, RAINBOW, TEACHER_LOOK, wearing, type UnicornLook } from './unicornLooks'

const HEX = /^#[0-9a-f]{6}$/i

describe('looks', () => {
  it('the rainbow has seven soft colours', () => {
    expect(RAINBOW).toHaveLength(7)
    for (const c of RAINBOW) expect(c).toMatch(HEX)
    expect(new Set(RAINBOW).size).toBe(7)
  })

  it('Amara is white with the whole rainbow, a gold horn and her backpack', () => {
    expect(PLAYER_LOOK.coat).toBe('#ffffff')
    expect(PLAYER_LOOK.mane).toEqual(RAINBOW)
    expect(PLAYER_LOOK.stripes).toEqual(RAINBOW)
    expect(PLAYER_LOOK.horn).toBe('#ffd166')
    expect(PLAYER_LOOK.hornType).toBe('straight')
    expect(wearing(PLAYER_LOOK, 'backpack')).toBeDefined()
  })

  it('there are eight spare looks, all different from each other and from Amara', () => {
    expect(NPC_LOOKS).toHaveLength(8)
    expect(new Set(NPC_LOOKS.map((l) => l.coat)).size).toBe(8)
    expect(new Set(NPC_LOOKS.map((l) => JSON.stringify(l))).size).toBe(8)
    for (const l of NPC_LOOKS) expect(l.coat).not.toBe(PLAYER_LOOK.coat)
  })

  it('every look has real colours, a size near normal and a personality', () => {
    for (const l of [...NPC_LOOKS, PLAYER_LOOK]) {
      expect(l.coat).toMatch(HEX)
      expect(l.horn).toMatch(HEX)
      expect(l.accessoryColor).toMatch(HEX)
      for (const c of [...l.mane, ...l.hooves]) expect(c).toMatch(HEX)
      expect(l.mane.length).toBeGreaterThan(0)
      expect(l.hooves.length).toBeGreaterThan(0)
      expect(l.build).toBeGreaterThan(0.8)
      expect(l.build).toBeLessThan(1.2)
      expect(l.hornLength).toBeGreaterThan(0.7)
      expect(l.hornLength).toBeLessThan(1.4)
      expect(['bouncy', 'sleepy', 'curious', 'proud']).toContain(l.personality)
    }
  })

  it('the personalities are mixed, so a classroom is not all asleep', () => {
    expect(new Set(NPC_LOOKS.map((l) => l.personality)).size).toBe(4)
  })

  it('the teacher outfit has its own dark colour for cap and pointer, gold for the tie', () => {
    expect(TEACHER_LOOK.accessoryColor).toMatch(HEX)
    expect(TEACHER_LOOK.tieColor).toMatch(HEX)
    expect(TEACHER_LOOK.accessoryColor).not.toBe(TEACHER_LOOK.tieColor)
  })
})

describe('wearing', () => {
  const base: UnicornLook = { ...NPC_LOOKS[0], accessory: 'none', extras: undefined }

  it('says nothing about things not worn', () => {
    expect(wearing(base, 'bow')).toBeUndefined()
    expect(wearing(base, 'helmet')).toBeUndefined()
  })

  it('finds the main accessory by its type and gives its colour', () => {
    expect(wearing({ ...base, accessory: 'crown', accessoryColor: '#123456' }, 'crown')).toBe('#123456')
  })

  it('finds extras too, and the main one wins when both name the same thing', () => {
    const look: UnicornLook = { ...base, accessory: 'bow', accessoryColor: '#111111', extras: [{ type: 'helmet', color: '#222222' }, { type: 'bow', color: '#333333' }] }
    expect(wearing(look, 'helmet')).toBe('#222222')
    expect(wearing(look, 'bow')).toBe('#111111')
  })

  it('"none" is never reported as something worn', () => {
    expect(wearing(base, 'teacher')).toBeUndefined()
  })
})
