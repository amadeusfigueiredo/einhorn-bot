import type { StageConfig, Question, NPC, Gate } from '../types'
import { questionText } from '../i18n/translate'
import type { Lang } from '../i18n/language'

/**
 * Determines which question and choices to display based on the active question key.
 */

export function getActivePrompt(
  questionKey: { kind: 'gate' | 'npc'; id: string } | null,
  stage: StageConfig,
  lang: Lang = 'de'
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

  const text = question && questionText(lang, question.id)
  return text ? { prompt: text.prompt, choices: [...text.choices] } : null
}
