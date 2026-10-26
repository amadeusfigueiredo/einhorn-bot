import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { hintTarget, nextNpcId, otherLang, progressDots, starStates } from './hudModel'

const subjects = STAGES.map((s) => s.subject)

describe('progressDots', () => {
  it('there is one dot per stage, in order', () => {
    const dots = progressDots(0, subjects)
    expect(dots).toHaveLength(15)
    expect(dots.map((d) => d.index)).toEqual(Array.from({ length: 15 }, (_, i) => i))
  })

  it('the stages before are done, this one is current, the rest are still to come', () => {
    const dots = progressDots(6, subjects)
    expect(dots.slice(0, 6).every((d) => d.state === 'done')).toBe(true)
    expect(dots[6].state).toBe('current')
    expect(dots.slice(7).every((d) => d.state === 'todo')).toBe(true)
  })

  it('exactly one dot is current, in every stage', () => {
    for (let s = 0; s < 15; s++) expect(progressDots(s, subjects).filter((d) => d.state === 'current')).toHaveLength(1)
  })

  it('in the first stage nothing is done, in the last everything but it is', () => {
    expect(progressDots(0, subjects).filter((d) => d.state === 'done')).toHaveLength(0)
    expect(progressDots(14, subjects).filter((d) => d.state === 'done')).toHaveLength(14)
  })

  it('the dots fall into five groups of three, one per subject', () => {
    const dots = progressDots(0, subjects)
    expect(dots.filter((d) => d.startsGroup).map((d) => d.index)).toEqual([3, 6, 9, 12])
  })

  it('the very first dot never has a gap before it', () => {
    expect(progressDots(0, subjects)[0].startsGroup).toBe(false)
    expect(progressDots(0, ['a'])[0].startsGroup).toBe(false)
  })

  it('works for any list of subjects, even an empty one', () => {
    expect(progressDots(0, [])).toEqual([])
    expect(progressDots(1, ['a', 'a', 'b']).map((d) => d.startsGroup)).toEqual([false, false, true])
  })

  it('a stage number beyond the end marks everything done', () => {
    expect(progressDots(99, subjects).every((d) => d.state === 'done')).toBe(true)
  })
})

describe('starStates', () => {
  it('lights the first stars', () => {
    expect(starStates(2, 4)).toEqual([true, true, false, false])
    expect(starStates(0, 4)).toEqual([false, false, false, false])
    expect(starStates(4, 4)).toEqual([true, true, true, true])
  })

  it('never lights more than there are, and copes with odd numbers', () => {
    expect(starStates(9, 4)).toEqual([true, true, true, true])
    expect(starStates(1, 0)).toEqual([])
    expect(starStates(1, -3)).toEqual([])
    expect(starStates(-2, 3)).toEqual([false, false, false])
  })
})

describe('otherLang', () => {
  it('German and Portuguese are each other\'s second language; English gets German', () => {
    expect(otherLang('de')).toBe('pt')
    expect(otherLang('pt')).toBe('de')
    expect(otherLang('en')).toBe('de')
  })
})

describe('nextNpcId and hintTarget', () => {
  const npcs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

  it('the next unicorn is the first one not asked yet', () => {
    expect(nextNpcId(npcs, new Set())).toBe('a')
    expect(nextNpcId(npcs, new Set(['a']))).toBe('b')
    expect(nextNpcId(npcs, new Set(['a', 'c']))).toBe('b')
    expect(nextNpcId(npcs, new Set(['b']))).toBe('a')
  })

  it('there is none when all are done, or when there are no unicorns', () => {
    expect(nextNpcId(npcs, new Set(['a', 'b', 'c', 'd']))).toBeNull()
    expect(nextNpcId([], new Set())).toBeNull()
    expect(nextNpcId(undefined, new Set())).toBeNull()
  })

  it('the hint goes to the unicorn beside Amara, else the next one', () => {
    expect(hintTarget('c', 'a')).toBe('c')
    expect(hintTarget(null, 'a')).toBe('a')
    expect(hintTarget(null, null)).toBeNull()
  })

  it('works with the real stages: the first unicorn of each stage is first in line', () => {
    for (const stage of STAGES) expect(nextNpcId(stage.npcs, new Set())).toBe(stage.npcs![0].id)
  })
})
