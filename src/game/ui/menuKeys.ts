export type MenuAction = { type: 'move'; index: number } | { type: 'choose'; index: number } | { type: 'close' }

/** What an open dropdown list does with a key, given the highlighted row. */
export function menuKey(key: string, index: number, count: number): MenuAction | null {
  switch (key) {
    case 'ArrowDown':
      return { type: 'move', index: Math.min(index + 1, count - 1) }
    case 'ArrowUp':
      return { type: 'move', index: Math.max(index - 1, 0) }
    case 'Home':
      return { type: 'move', index: 0 }
    case 'End':
      return { type: 'move', index: count - 1 }
    case 'Enter':
    case ' ':
      return { type: 'choose', index }
    case 'Escape':
    case 'Tab':
      return { type: 'close' }
    default:
      return null
  }
}
