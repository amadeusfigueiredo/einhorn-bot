import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { requiredAnswers } from './gameMachine'
import { parseDevJump, resolveDevJump, stepQuestion } from './devJump'

describe('the developers\' jump in the address', () => {
  it('reads the class (as the children number it), how many are answered, or how many are left', () => {
    expect(parseDevJump('?stage=5')).toEqual({ stage: 5 })
    expect(parseDevJump('?stage=5&answered=2')).toEqual({ stage: 5, answered: 2 })
    expect(parseDevJump('?stage=5&left=1')).toEqual({ stage: 5, left: 1 })
    expect(parseDevJump('?class=9&left=2')).toEqual({ stage: 9, left: 2 })
    expect(parseDevJump('?left=1')).toEqual({ left: 1 })
    expect(parseDevJump('?answered=0')).toEqual({ answered: 0 })
  })

  it('asks for nothing when the address has nothing about it, or only nonsense', () => {
    for (const search of ['', '?view=3d&lang=en', '?stage=', '?stage=abc', '?stage=0', '?stage=-3', '?stage=2.5', '?left=0', '?left=x', '?answered=-1', '?stage=%20']) expect(parseDevJump(search), search).toBeNull()
  })

  it('ignores the parts that are nonsense and keeps the ones that are not', () => {
    expect(parseDevJump('?stage=4&left=x&answered=1')).toEqual({ stage: 4, answered: 1 })
  })

  it('goes to the class in the address, or stays in the class she is in', () => {
    expect(resolveDevJump({ stage: 5 }, 0, STAGES).stageIndex).toBe(4)
    expect(resolveDevJump({ left: 1 }, 7, STAGES).stageIndex).toBe(7)
    expect(resolveDevJump({ stage: 99 }, 0, STAGES).stageIndex).toBe(STAGES.length - 1)
  })

  it('answers the first `answered` questions, or leaves `left`', () => {
    const required = requiredAnswers(STAGES[4])
    expect(resolveDevJump({ stage: 5 }, 0, STAGES).answered).toBe(0)
    expect(resolveDevJump({ stage: 5, answered: 2 }, 0, STAGES).answered).toBe(2)
    expect(resolveDevJump({ stage: 5, left: 1 }, 0, STAGES).answered).toBe(required - 1)
    expect(resolveDevJump({ stage: 5, left: 2 }, 0, STAGES).answered).toBe(required - 2)
  })

  it('never answers them all (the class would be finished with no "well done"), and never a negative number', () => {
    const required = requiredAnswers(STAGES[4])
    expect(resolveDevJump({ stage: 5, answered: 99 }, 0, STAGES).answered).toBe(required - 1)
    expect(resolveDevJump({ stage: 5, left: 99 }, 0, STAGES).answered).toBe(0)
  })

  it('"left wins": when both are given', () => {
    expect(resolveDevJump({ stage: 5, answered: 0, left: 1 }, 0, STAGES).answered).toBe(requiredAnswers(STAGES[4]) - 1)
  })

  it('stepping inside a class moves one question and stays between the first and the last open one', () => {
    expect(stepQuestion(1, 4, 1)).toBe(2)
    expect(stepQuestion(1, 4, -1)).toBe(0)
    expect(stepQuestion(0, 4, -1)).toBe(0)
    expect(stepQuestion(3, 4, 1)).toBe(3)
  })
})
