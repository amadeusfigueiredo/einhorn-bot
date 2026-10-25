import { describe, it, expect } from 'vitest'
import { POPUPS } from './popups'

describe('popups', () => {
  it('"Right!" is a quick celebration, "Almost!" is long enough to read, the ending waits for the child', () => {
    expect(POPUPS.WIN.durationMs).toBe(1600)
    expect(POPUPS.TRY_AGAIN.durationMs).toBe(5000)
    expect(POPUPS.GAME_END.durationMs).toBeNull()
  })

  it('each popup knows its own id', () => {
    for (const [id, p] of Object.entries(POPUPS)) expect(p.id).toBe(id)
  })

  it('"Almost!" stays on screen longer than "Right!"', () => {
    expect(POPUPS.TRY_AGAIN.durationMs!).toBeGreaterThan(POPUPS.WIN.durationMs!)
  })
})
