// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderUI, setReducedMotion, cleanupAfterEach } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { StageCard } from './StageCard'
import { pauseStore } from '../pause/pauseStore'

// Animations do not run in jsdom: with the library replaced by plain elements, the card appears and goes at once.
vi.mock('framer-motion', async () => (await import('../../test/framerMock')).default)

cleanupAfterEach()
afterEach(() => {
  pauseStore.getState().resume()
  vi.useRealTimers()
  setReducedMotion(false)
})

describe('StageCard timing', () => {
  it('is there at first and goes away by itself after about two seconds', () => {
    vi.useFakeTimers()
    const { container } = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    expect(container.querySelector('.stage-card')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1800))
    expect(container.querySelector('.stage-card')).toBeTruthy()
    act(() => vi.advanceTimersByTime(200))
    expect(container.querySelector('.stage-card')).toBeNull()
  })

  it('a pause holds it; going on gives it its full time again', () => {
    vi.useFakeTimers()
    const { container } = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    act(() => vi.advanceTimersByTime(1500))
    act(() => pauseStore.getState().pause())
    act(() => vi.advanceTimersByTime(60_000))
    expect(container.querySelector('.stage-card')).toBeTruthy()
    act(() => pauseStore.getState().resume())
    act(() => vi.advanceTimersByTime(1800))
    expect(container.querySelector('.stage-card')).toBeTruthy()
    act(() => vi.advanceTimersByTime(200))
    expect(container.querySelector('.stage-card')).toBeNull()
  })

  it('with reduced motion it is shorter: under a second', () => {
    vi.useFakeTimers()
    setReducedMotion(true)
    const { container } = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    act(() => vi.advanceTimersByTime(850))
    expect(container.querySelector('.stage-card')).toBeTruthy()
    act(() => vi.advanceTimersByTime(100))
    expect(container.querySelector('.stage-card')).toBeNull()
  })

  it('a new stage card starts its own timer', () => {
    vi.useFakeTimers()
    const first = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    act(() => vi.advanceTimersByTime(2000))
    expect(first.container.querySelector('.stage-card')).toBeNull()
    first.unmount()
    const second = renderUI(<StageCard stage={STAGES[1]} stageIndex={1} totalStages={15} />)
    expect(second.container.querySelector('.stage-card')).toBeTruthy()
  })
})
