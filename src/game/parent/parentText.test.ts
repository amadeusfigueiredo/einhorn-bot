import { describe, expect, it } from 'vitest'
import { timeText } from './parentText'

describe('the words for a time', () => {
  const t = (id: string, vars?: Record<string, string | number>) => `${id}:${JSON.stringify(vars ?? {})}`
  it('is nothing, minutes, or hours and minutes', () => {
    expect(timeText(t as never, 0)).toBe('parent.timeNone:{}')
    expect(timeText(t as never, 300)).toBe('parent.minutes:{"minutes":5}')
    expect(timeText(t as never, 3900)).toBe('parent.hoursMinutes:{"hours":1,"minutes":5}')
  })
})
