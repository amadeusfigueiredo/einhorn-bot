import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { LOCALES } from '../i18n/translate'
import { GREETINGS, pickGreeting, pickRevisitGreeting } from './dialogue'

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

  describe('what the unicorns say in a class she has finished', () => {
    it('every language has four lines, each with a place for her name where it fits', () => {
      for (const lang of ['de', 'pt', 'en'] as const) {
        const lines = (LOCALES[lang] as unknown as { hall: { revisit: string[] } }).hall.revisit
        expect(lines, lang).toHaveLength(4)
        for (const line of lines) {
          expect(line.length).toBeGreaterThan(10)
          expect(line.length).toBeLessThanOrEqual(90)
        }
      }
    })

    it('says the same to the same unicorn every time, and not the same to all of them', () => {
      const ids = STAGES[0].npcs!.map((n) => n.id)
      expect(pickRevisitGreeting(ids[0], 'en')).toBe(pickRevisitGreeting(ids[0], 'en'))
      expect(new Set(Array.from({ length: 30 }, (_, i) => pickRevisitGreeting(`npc-${i}`, 'en'))).size).toBeGreaterThan(1)
    })

    it('uses her name when she has one and reads well without one', () => {
      const withName = Array.from({ length: 30 }, (_, i) => pickRevisitGreeting(`npc-${i}`, 'en', 'Mia')).join('|')
      expect(withName).toContain('Hello, Mia!')
      for (let i = 0; i < 30; i++) {
        const plain = pickRevisitGreeting(`npc-${i}`, 'en')
        expect(plain).not.toMatch(/\{|\}|, !/)
      }
    })

    it('never asks a question of its own that needs an answer (it is a greeting; the last line asks where to go next, no answer is taken)', () => {
      for (const lang of ['de', 'pt', 'en'] as const) {
        const lines = (LOCALES[lang] as unknown as { hall: { revisit: string[] } }).hall.revisit
        expect(lines.filter((l) => l.includes('?')).length).toBeLessThanOrEqual(1)
      }
    })

    it('speaks German and Portuguese', () => {
      expect(pickRevisitGreeting('npc-0', 'de', 'Mia')).toMatch(/Mia|schon|Fragen|besuchst|Pausenhof/)
      expect(pickRevisitGreeting('npc-0', 'pt', 'Mia')).toMatch(/Mia|fez|perguntas|visitar|pátio/)
    })
  })
})
