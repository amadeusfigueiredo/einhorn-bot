import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { STAGE_SPECS } from './stageSpecs'
import { isTeacher } from './teachers'
import { lookForNpc } from './stageLooks'

describe('teacher unicorns', () => {
  it('every stage has exactly one teacher', () => {
    for (const stage of STAGES) {
      expect((stage.npcs ?? []).filter(isTeacher), stage.name).toHaveLength(1)
    }
  })

  it('the teacher asks the last (hardest) question of the stage', () => {
    // Questions are ordered easiest-first in stageSpecs.ts.
    for (const spec of STAGE_SPECS) {
      const last = spec.npcs[spec.npcs.length - 1]
      expect(isTeacher(last), `stage ${spec.n}`).toBe(true)
    }
  })

  it('being a teacher changes no id, position or right answer', () => {
    const layout = STAGES.map((s) => (s.npcs ?? []).map((n) => [n.id, n.x, n.y, n.question.id, n.question.correctIndex]))
    expect(layout).toMatchSnapshot()
  })

  it('only the teacher is dressed as one', () => {
    STAGES.forEach((stage, si) => {
      ;(stage.npcs ?? []).forEach((npc, i) => {
        expect(lookForNpc(si, i, npc).accessory === 'teacher', npc.id).toBe(isTeacher(npc))
      })
    })
  })

  it('the teacher keeps the colours of the unicorn it would have been', () => {
    const stage = STAGES[0]
    const i = stage.npcs!.findIndex(isTeacher)
    const plain = lookForNpc(0, i)
    const teacher = lookForNpc(0, i, stage.npcs![i])
    expect(teacher.coat).toBe(plain.coat)
    expect(teacher.mane).toEqual(plain.mane)
  })
})
