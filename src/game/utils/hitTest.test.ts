import { describe, expect, it } from 'vitest'
import { findNpcAtPoint } from './hitTest'
import type { NPC } from '../types'

function makeNpc(id: string, x: number, y: number): NPC {
  return { id, x, y, question: { id: `${id}Q`, prompt: 'p', choices: [], correctIndex: 0 } }
}

describe('findNpcAtPoint', () => {
  const npcs = [makeNpc('a', 100, 100), makeNpc('b', 400, 400)]

  it('finds the npc whose portrait contains the point', () => {
    expect(findNpcAtPoint(npcs, 110, 90, new Set())?.id).toBe('a')
  })

  it('returns undefined when the point is outside every portrait', () => {
    expect(findNpcAtPoint(npcs, 250, 250, new Set())).toBeUndefined()
  })

  it('ignores already-answered npcs', () => {
    expect(findNpcAtPoint(npcs, 100, 100, new Set(['a']))).toBeUndefined()
  })

  it('respects a custom hit box size', () => {
    expect(findNpcAtPoint(npcs, 150, 100, new Set(), 10)).toBeUndefined()
    expect(findNpcAtPoint(npcs, 150, 100, new Set(), 60)?.id).toBe('a')
  })
})
