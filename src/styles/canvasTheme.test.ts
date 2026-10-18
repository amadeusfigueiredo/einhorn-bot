import { describe, expect, it } from 'vitest'
import { canvasTheme, withAlpha } from './canvasTheme'

describe('canvasTheme', () => {
  it('falls back to the token values without a DOM', () => {
    expect(canvasTheme().night950).toBe('#1b1033')
    expect(canvasTheme().gold400).toBe('#ffd166')
  })

  it('converts hex to rgba', () => {
    expect(withAlpha('#ff7ec7', 0.5)).toBe('rgba(255, 126, 199, 0.5)')
  })

  it('leaves non-hex colours alone', () => {
    expect(withAlpha('rgb(1, 2, 3)', 0.5)).toBe('rgb(1, 2, 3)')
  })
})
