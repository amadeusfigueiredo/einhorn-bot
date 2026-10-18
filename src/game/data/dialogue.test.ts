import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { GREETINGS, pickGreeting } from './dialogue'

describe('dialogue', () => {
  it('has greetings for every subject used in the curriculum', () => {
    for (const stage of STAGES) {
      expect(GREETINGS[stage.subject].length).toBeGreaterThan(0)
    }
  })

  it('always greets the same NPC the same way', () => {
    const npc = STAGES[0].npcs![0]
    expect(pickGreeting(STAGES[0].subject, npc.id)).toBe(
      pickGreeting(STAGES[0].subject, npc.id)
    )
  })

  it('keeps every greeting short enough for an early reader', () => {
    for (const lines of Object.values(GREETINGS)) {
      for (const line of lines) expect(line.length).toBeLessThanOrEqual(80)
    }
  })
})
