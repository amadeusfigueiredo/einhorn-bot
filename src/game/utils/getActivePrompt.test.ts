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
        id: 'stage1Npc2Q',
        correctIndex: 1,
      },
    },
  ],
  npcs: [
    {
      id: 'npc1',
      x: 100,
      y: 100,
      question: {
        id: 'stage1Npc1Q',
        correctIndex: 1,
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
      prompt: 'Welche Zahl kommt nach 19?',
      choices: ['18', '20', '21', '29'],
    })
  })

  it('resolves an npc question by id', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'npc1' }, stage)).toEqual({
      prompt: 'Wie viel ist 7 + 5?',
      choices: ['11', '12', '13', '10'],
    })
  })

  it('returns null when the id is not found', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'missing' }, stage)).toBeNull()
  })

  it('reads the text in the asked language', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'npc1' }, stage, 'en')?.prompt).toBe('What is 7 + 5?')
  })

  it('returns null when a question has no text', () => {
    const noText = { ...stage, npcs: [{ ...stage.npcs![0], question: { id: 'unknownQ', correctIndex: 0 } }] }
    expect(getActivePrompt({ kind: 'npc', id: 'npc1' }, noText)).toBeNull()
  })

  it('does not cross-match a gate id against npcs', () => {
    expect(getActivePrompt({ kind: 'npc', id: 'gate1' }, stage)).toBeNull()
  })
})
