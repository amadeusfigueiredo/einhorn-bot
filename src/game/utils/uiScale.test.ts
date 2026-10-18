import { describe, expect, it } from 'vitest'
import { uiScale } from './uiScale'

describe('uiScale', () => {
  it('leaves the landscape canvas alone', () => {
    expect(uiScale(1440, 810)).toBe(1)
  })

  it('enlarges UI on the portrait canvas', () => {
    expect(uiScale(760, 1350)).toBeGreaterThan(1)
  })
})
