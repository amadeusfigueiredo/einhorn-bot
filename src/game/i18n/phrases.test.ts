import { describe, it, expect } from 'vitest'
import { translate } from './translate'
import { progressText, subjectText, difficultyText, nameButtonText, nameButtonLabel } from './phrases'

const de = (id: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate('de', id, vars)
const en = (id: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate('en', id, vars)

describe('phrases', () => {
  it('progress shows the total only when it differs from what is required', () => {
    expect(progressText(de, 2, 4, 4)).toBe('2 von 4')
    expect(progressText(de, 2, 4, 5)).toBe('2 von 4 (5)')
  })

  it('names subjects and difficulties by id', () => {
    expect(subjectText(en, 'Deutsch')).toBe('English')
    expect(difficultyText(en, 'schwer')).toBe('hard')
  })

  it('the name button shows the name, or a word when there is none', () => {
    expect(nameButtonText(en, 'Amara')).toBe('Amara')
    expect(nameButtonText(en, null)).toBe('Name')
    expect(nameButtonLabel(en, 'Amara')).toBe('Change name: now Amara')
    expect(nameButtonLabel(en, null)).toBe('Enter your name')
  })
})
