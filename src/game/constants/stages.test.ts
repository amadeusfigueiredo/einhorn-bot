import { describe, expect, it } from 'vitest'
import { STAGES, buildStages } from './stages'
import { WIDTH, HEIGHT, PORTRAIT_WIDTH, PORTRAIT_HEIGHT } from './dimensions'

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

describe('buildStages', () => {
  it('matches STAGES when built with the default (landscape) size', () => {
    expect(buildStages(WIDTH, HEIGHT)).toEqual(STAGES)
  })

  it('keeps every NPC within the reachable area of a portrait canvas', () => {
    const portraitStages = buildStages(PORTRAIT_WIDTH, PORTRAIT_HEIGHT)
    for (const stage of portraitStages) {
      for (const n of stage.npcs ?? []) {
        expect(n.x).toBeGreaterThan(0)
        expect(n.x).toBeLessThan(PORTRAIT_WIDTH)
        expect(n.y).toBeGreaterThan(0)
        expect(n.y).toBeLessThan(PORTRAIT_HEIGHT)
      }
    }
  })

  it('keeps stage content (ids, questions, requiredToAdvance) identical across sizes', () => {
    const landscape = buildStages(WIDTH, HEIGHT)
    const portrait = buildStages(PORTRAIT_WIDTH, PORTRAIT_HEIGHT)
    expect(portrait.map((s) => s.name)).toEqual(landscape.map((s) => s.name))
    expect(portrait.map((s) => s.requiredToAdvance)).toEqual(
      landscape.map((s) => s.requiredToAdvance)
    )
    landscape.forEach((stage, i) => {
      expect((portrait[i].npcs ?? []).map((n) => n.id)).toEqual(
        (stage.npcs ?? []).map((n) => n.id)
      )
      expect((portrait[i].npcs ?? []).map((n) => n.question)).toEqual(
        (stage.npcs ?? []).map((n) => n.question)
      )
    })
  })

  it('repositions NPCs rather than reusing landscape coordinates verbatim', () => {
    const landscape = buildStages(WIDTH, HEIGHT)
    const portrait = buildStages(PORTRAIT_WIDTH, PORTRAIT_HEIGHT)
    const landscapePositions = (landscape[0].npcs ?? []).map((n) => `${n.x},${n.y}`)
    const portraitPositions = (portrait[0].npcs ?? []).map((n) => `${n.x},${n.y}`)
    expect(portraitPositions).not.toEqual(landscapePositions)
  })
})

describe('curriculum structure', () => {
  const SUBJECT_ORDER = [
    'Mathematik',
    'Deutsch',
    'Sachunterricht',
    'Musik',
    'Bildende Kunst',
  ]
  const DIFFICULTY_ORDER = ['leicht', 'mittel', 'schwer']

  it('has 15 stages: 5 subjects x 3 stages each', () => {
    expect(STAGES).toHaveLength(15)
  })

  it('every stage has exactly 4 NPC questions', () => {
    for (const stage of STAGES) {
      expect(stage.npcs ?? []).toHaveLength(4)
    }
  })

  it('groups stages into sequential 3-stage blocks per subject, in order', () => {
    const subjectsInOrder = STAGES.map((s) => s.subject)
    const expected = SUBJECT_ORDER.flatMap((subject) => [
      subject,
      subject,
      subject,
    ])
    expect(subjectsInOrder).toEqual(expected)
  })

  it('ramps difficulty leicht -> mittel -> schwer within each subject block', () => {
    for (let block = 0; block < SUBJECT_ORDER.length; block++) {
      const stagesInBlock = STAGES.slice(block * 3, block * 3 + 3)
      expect(stagesInBlock.map((s) => s.difficulty)).toEqual(DIFFICULTY_ORDER)
    }
  })

  it('keeps Deutsch and Mathematik question text free of higher-grade markers', () => {
    // These two subjects are restricted to Klasse 1-2 per the curriculum
    // brief; a loose smell test that nobody accidentally wrote e.g.
    // "Klasse 3" content into them.
    const restricted = STAGES.filter(
      (s) => s.subject === 'Mathematik' || s.subject === 'Deutsch'
    )
    for (const stage of restricted) {
      for (const npc of stage.npcs ?? []) {
        expect(npc.question.prompt).not.toMatch(/Klasse\s*[3-9]/i)
      }
    }
  })

  it('has globally unique NPC ids across all 15 stages', () => {
    const allIds = STAGES.flatMap((s) => (s.npcs ?? []).map((n) => n.id))
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('has globally unique question ids across all 15 stages', () => {
    const allQuestionIds = STAGES.flatMap((s) =>
      (s.npcs ?? []).map((n) => n.question.id)
    )
    expect(new Set(allQuestionIds).size).toBe(allQuestionIds.length)
  })
})
