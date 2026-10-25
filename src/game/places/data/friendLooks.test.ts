import { describe, expect, it } from 'vitest'
import { FRIEND_LOOKS } from './friendLooks'

describe('the friends', () => {
  it('each have their own coat, mane and horn, so they are told apart', () => {
    const looks = Object.values(FRIEND_LOOKS)
    for (const pick of [(l: (typeof looks)[number]) => l.coat, (l: (typeof looks)[number]) => l.mane[0], (l: (typeof looks)[number]) => l.hornType]) {
      expect(new Set(looks.map(pick)).size).toBe(looks.length)
    }
  })

  it('are made of real colours', () => {
    for (const look of Object.values(FRIEND_LOOKS)) {
      for (const c of [look.coat, look.horn, look.accessoryColor, ...look.mane, ...look.hooves]) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(look.build).toBeGreaterThan(0.8)
      expect(look.build).toBeLessThan(1.2)
    }
  })
})
