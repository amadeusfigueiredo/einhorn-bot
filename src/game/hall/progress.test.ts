import { describe, expect, it } from 'vitest'
import { doorState, firstTodo } from './progress'

const flags = (done: number[], total = 15) => Array.from({ length: total }, (_, i) => done.includes(i))

describe('what a door of the corridor says', () => {
  it('the first class still to do is the one to do next: a glow and a badge', () => {
    expect(firstTodo(flags([]))).toBe(0)
    expect(firstTodo(flags([0, 1, 2]))).toBe(3)
    expect(doorState(flags([0, 1, 2]), 3)).toBe('next')
  })

  it('a finished class has its star, wherever it is', () => {
    const done = flags([0, 5, 14])
    for (const i of [0, 5, 14]) expect(doorState(done, i)).toBe('done')
  })

  it('every other door is plain and open: no padlock, nothing is locked, whatever she has or has not done', () => {
    const done = flags([0, 5, 14])
    for (const i of [2, 3, 4, 6, 13]) expect(doorState(done, i)).toBeUndefined()
    expect(doorState(flags([]), 14)).toBeUndefined()
    expect(doorState(flags([]), 7)).toBeUndefined()
  })

  it('the next door is the first one still to do, even when later classes are done', () => {
    const done = flags([1, 2, 3])
    expect(doorState(done, 0)).toBe('next')
    expect(doorState(done, 4)).toBeUndefined()
  })

  it('when everything is done no door is next', () => {
    const done = flags(Array.from({ length: 15 }, (_, i) => i))
    expect(firstTodo(done)).toBeNull()
    for (let i = 0; i < 15; i++) expect(doorState(done, i)).toBe('done')
  })
})
