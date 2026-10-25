import { describe, it, expect } from 'vitest'
import { menuKey } from './menuKeys'

describe('menuKey', () => {
  it('moves down and up and stops at the ends', () => {
    expect(menuKey('ArrowDown', 0, 3)).toEqual({ type: 'move', index: 1 })
    expect(menuKey('ArrowDown', 2, 3)).toEqual({ type: 'move', index: 2 })
    expect(menuKey('ArrowUp', 2, 3)).toEqual({ type: 'move', index: 1 })
    expect(menuKey('ArrowUp', 0, 3)).toEqual({ type: 'move', index: 0 })
  })

  it('Home and End jump to the first and last item', () => {
    expect(menuKey('Home', 2, 3)).toEqual({ type: 'move', index: 0 })
    expect(menuKey('End', 0, 3)).toEqual({ type: 'move', index: 2 })
  })

  it('Enter and Space choose the highlighted item', () => {
    expect(menuKey('Enter', 1, 3)).toEqual({ type: 'choose', index: 1 })
    expect(menuKey(' ', 2, 3)).toEqual({ type: 'choose', index: 2 })
  })

  it('Escape and Tab close the menu', () => {
    expect(menuKey('Escape', 1, 3)).toEqual({ type: 'close' })
    expect(menuKey('Tab', 1, 3)).toEqual({ type: 'close' })
  })

  it('ignores every other key', () => {
    expect(menuKey('a', 1, 3)).toBeNull()
    expect(menuKey('ArrowLeft', 1, 3)).toBeNull()
  })
})
