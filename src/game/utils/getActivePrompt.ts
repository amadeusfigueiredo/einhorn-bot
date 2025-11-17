import type { StageConfig, Question, NPC, Gate } from '../types'

/**
 * Determines which question and choices to display based on the active question key.
 */

export function getActivePrompt(
  questionKey: { kind: 'gate' | 'npc'; id: string } | null,
  stage: StageConfig
): { prompt: string; choices: string[] } | null {
  if (!questionKey) return null

  let question: Question | undefined

  if (questionKey.kind === 'gate') {
    const g = (stage.gates ?? []).find((x: Gate) => x.id === questionKey.id)
    question = g?.question
  } else {
    const n = (stage.npcs ?? []).find((x: NPC) => x.id === questionKey.id)
    question = n?.question
  }

  if (question) {
    return { prompt: question.prompt, choices: question.choices }
  }
  return null
}
