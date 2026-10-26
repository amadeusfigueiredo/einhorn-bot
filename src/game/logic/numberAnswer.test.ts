import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { LANGUAGES } from '../i18n/languages'
import { LOCALES } from '../i18n/translate'
import { MAX_DIGITS, asksForNumber, choiceForNumber, isWhole, typeKey } from './numberAnswer'

describe('whole numbers', () => {
  it('are one to four digits, with spaces round them allowed', () => {
    for (const ok of ['0', '7', '12', '100', '9999', ' 42 ']) expect(isWhole(ok), ok).toBe(true)
    for (const bad of ['', 'a', '1.5', '-3', '12345', '1 2', 'ten', '٣']) expect(isWhole(bad), bad).toBe(false)
  })
})

describe('which questions are asked by typing', () => {
  const numbers = ['11', '12', '13', '10']
  it('only those that say so and whose answers are all numbers', () => {
    expect(asksForNumber({ kind: 'number' }, numbers)).toBe(true)
    expect(asksForNumber({ kind: 'choice' }, numbers)).toBe(false)
    expect(asksForNumber({}, numbers)).toBe(false)
    expect(asksForNumber(undefined, numbers)).toBe(false)
    expect(asksForNumber({ kind: 'number' }, ['ball', 'lake'])).toBe(false)
    expect(asksForNumber({ kind: 'number' }, ['1', 'two'])).toBe(false)
    expect(asksForNumber({ kind: 'number' }, [])).toBe(false)
  })

  it('are the six harder sums, and their answers are numbers in every language', () => {
    const asked = STAGES.flatMap((s, si) => (s.npcs ?? []).filter((n) => n.question.kind === 'number').map((n) => ({ si, n })))
    expect(asked.map((a) => a.n.question.id)).toEqual(['stage2Npc1Q', 'stage2Npc3Q', 'stage3Npc1Q', 'stage3Npc2Q', 'stage3Npc3Q', 'stage3Npc4Q'])
    for (const { n } of asked) {
      for (const l of LANGUAGES) {
        const choices = (LOCALES[l.code].questions as Record<string, { choices: string[] }>)[n.question.id].choices
        expect(asksForNumber(n.question, choices), `${n.question.id} ${l.code}`).toBe(true)
      }
    }
  })
})

describe('what a typed number is', () => {
  const choices = ['11', '12', '13', '10']
  it('the answer with that value', () => {
    expect(choiceForNumber('12', choices, 1)).toBe(1)
    expect(choiceForNumber('10', choices, 1)).toBe(3)
    expect(choiceForNumber(' 13 ', choices, 1)).toBe(2)
  })

  it('a number that is not among the answers is wrong (never the right one)', () => {
    expect(choiceForNumber('99', choices, 1)).toBe(0)
    expect(choiceForNumber('99', choices, 0)).toBe(1)
    expect(choiceForNumber('', choices, 2)).toBe(0)
    expect(choiceForNumber('x', choices, 0)).toBe(1)
  })

  it('a number typed with leading zeros is the same number', () => {
    expect(choiceForNumber('012', choices, 1)).toBe(1)
  })

  it('every number question: its right answer typed is right, and any other number is wrong', () => {
    for (const s of STAGES)
      for (const n of s.npcs ?? []) {
        if (n.question.kind !== 'number') continue
        const choices = (LOCALES.en.questions as Record<string, { choices: string[] }>)[n.question.id].choices
        const right = choices[n.question.correctIndex]
        expect(choiceForNumber(right, choices, n.question.correctIndex), n.question.id).toBe(n.question.correctIndex)
        expect(choiceForNumber('7777', choices, n.question.correctIndex), n.question.id).not.toBe(n.question.correctIndex)
        choices.forEach((c, i) => i !== n.question.correctIndex && expect(choiceForNumber(c, choices, n.question.correctIndex)).toBe(i))
      }
  })
})

describe('typing', () => {
  it('adds digits up to the most, and takes the last off with back', () => {
    let typed = ''
    for (const k of '1234') typed = typeKey(typed, k)
    expect(typed).toBe('1234')
    expect(MAX_DIGITS).toBe(4)
    expect(typeKey(typed, '5')).toBe('1234')
    expect(typeKey(typed, 'back')).toBe('123')
    expect(typeKey('', 'back')).toBe('')
  })

  it('has no leading zeros and takes only digits', () => {
    expect(typeKey('0', '5')).toBe('5')
    expect(typeKey('', '0')).toBe('0')
    expect(typeKey('0', '0')).toBe('0')
    expect(typeKey('1', 'a')).toBe('1')
    expect(typeKey('1', 'ok')).toBe('1')
  })
})
