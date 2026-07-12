import { describe, expect, it } from 'vitest'
import { getActivePrompt } from './getActivePrompt'
import type { StageConfig } from '../types'

const stage: StageConfig = {
  name: 'stage1',
  subject: 'Mathematik',
  difficulty: 'leicht',
  gates: [
    {
      id: 'gate1',
      area: { x: 0, y: 0, w: 10, h: 10 },
      question: {
        id: 'gateQ',
        prompt: 'Gate question?',
        choices: ['a', 'b'],
        correctIndex: 0,
      },
    },
  ],
  npcs: [
    {
      id: 'npc1',
      x: 100,
      y: 100,
      question: {
        id: 'npcQ',
        prompt: 'NPC question?',
        choices: ['x', 'y', 'z'],
        correctIndex: 2,
      },
    },
  ],
}

describe('getActivePrompt', () => {
  it('returns null when there is no active question', () => {
    expect(getActivePrompt(null, stage)).toBeNull()
  })

  it('resolves a gate question by id', () => {
    expect(getActivePrompt({ kind: 'gate', id: 'gate1' }, stage)).toEqual({
      prompt: 'Gate question?',
      choices: ['a', 'b'],
    })
  })

  it('resolves an npc question by id', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'npc1' }, stage)).toEqual({
      prompt: 'NPC question?',
      choices: ['x', 'y', 'z'],
    })
  })

  it('returns null when the id is not found', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'missing' }, stage)).toBeNull()
  })

  it('does not cross-match a gate id against npcs', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'gate1' }, stage)).toBeNull()
  })
})
