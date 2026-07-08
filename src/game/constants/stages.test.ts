import { describe, expect, it } from 'vitest'
import { STAGES } from './stages'
import { WIDTH, HEIGHT } from './dimensions'

const stageNames = new Set(STAGES.map((s) => s.name))

describe('STAGES data integrity', () => {
  it('has at least one stage', () => {
    expect(STAGES.length).toBeGreaterThan(0)
  })

  it.each(STAGES.map((s) => [s.name, s] as const))(
    '%s: every question has a correctIndex within its choices',
    (_name, stage) => {
      const questions = [
        ...(stage.gates ?? []).map((g) => g.question),
        ...(stage.npcs ?? []).map((n) => n.question),
      ]
      for (const q of questions) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(q.choices.length)
      }
    }
  )

  it.each(STAGES.map((s) => [s.name, s] as const))(
    '%s: NPC ids are unique within the stage',
    (_name, stage) => {
      const ids = (stage.npcs ?? []).map((n) => n.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  )

  it.each(STAGES.map((s) => [s.name, s] as const))(
    '%s: every NPC is positioned within the reachable canvas area',
    (_name, stage) => {
      for (const n of stage.npcs ?? []) {
        expect(n.x).toBeGreaterThan(0)
        expect(n.x).toBeLessThan(WIDTH)
        expect(n.y).toBeGreaterThan(0)
        expect(n.y).toBeLessThan(HEIGHT)
      }
    }
  )

  it.each(STAGES.map((s) => [s.name, s] as const))(
    '%s: requiredToAdvance never exceeds the number of available questions',
    (_name, stage) => {
      const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
      if (stage.requiredToAdvance !== undefined) {
        expect(stage.requiredToAdvance).toBeLessThanOrEqual(total)
        expect(stage.requiredToAdvance).toBeGreaterThan(0)
      }
    }
  )

  it('every nextStage points at a real stage', () => {
    for (const stage of STAGES) {
      if (stage.nextStage !== null && stage.nextStage !== undefined) {
        expect(stageNames.has(stage.nextStage)).toBe(true)
      }
    }
  })

  it('only the last stage has no nextStage', () => {
    STAGES.slice(0, -1).forEach((stage) => {
      expect(stage.nextStage).not.toBeNull()
    })
    expect(STAGES[STAGES.length - 1].nextStage).toBeNull()
  })
})
