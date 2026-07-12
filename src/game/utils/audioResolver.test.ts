import { describe, expect, it } from 'vitest'
import { resolveStageAudioKey } from './audioResolver'

const TRACKS = ['stage1', 'stage2', 'stage11', 'stage12']

describe('resolveStageAudioKey', () => {
  it('uses the stage own track when it has one', () => {
    expect(resolveStageAudioKey(0, 'stage1', TRACKS)).toBe('stage1')
    expect(resolveStageAudioKey(10, 'stage11', TRACKS)).toBe('stage11')
  })

  it('falls back to a cycled track when the stage has no dedicated one', () => {
    const result = resolveStageAudioKey(2, 'stage3', TRACKS)
    expect(TRACKS).toContain(result)
  })

  it('is deterministic for the same stage index', () => {
    const a = resolveStageAudioKey(6, 'stage7', TRACKS)
    const b = resolveStageAudioKey(6, 'stage7', TRACKS)
    expect(a).toBe(b)
  })

  it('spreads fallback stages across different tracks, not always the same one', () => {
    const results = new Set(
      Array.from({ length: TRACKS.length }, (_, i) =>
        resolveStageAudioKey(i, `stageX${i}`, TRACKS)
      )
    )
    expect(results.size).toBeGreaterThan(1)
  })

  it('returns undefined when there are no tracks at all', () => {
    expect(resolveStageAudioKey(0, 'stage1', [])).toBeUndefined()
  })

  it('cycles back around for stage indices beyond the track count', () => {
    expect(resolveStageAudioKey(4, 'stage5', TRACKS)).toBe(
      resolveStageAudioKey(0, 'stage1-other', TRACKS)
    )
  })
})
