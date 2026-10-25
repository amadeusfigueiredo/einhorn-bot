// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { savesData, whenIdle } from './whenIdle'

/** The browsers' idle calls, set or taken away (jsdom may bring its own: this shadows it). */
const setIdle = (request: unknown, cancel: unknown = undefined) => {
  Object.defineProperty(window, 'requestIdleCallback', { configurable: true, writable: true, value: request })
  Object.defineProperty(window, 'cancelIdleCallback', { configurable: true, writable: true, value: cancel })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setIdle(undefined)
  Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined })
})

describe('whenIdle', () => {
  it('runs the work when the browser says it is idle, with a limit so it still runs on a busy page', () => {
    const request = vi.fn((cb: () => void, options?: { timeout: number }) => (options && cb(), 5))
    setIdle(request, vi.fn())
    const work = vi.fn()
    whenIdle(work)
    expect(work).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][1]).toEqual({ timeout: 4000 })
  })

  it('gives the idle call back when cancelled', () => {
    const cancel = vi.fn()
    setIdle(() => 9, cancel)
    whenIdle(() => {})()
    expect(cancel).toHaveBeenCalledWith(9)
  })

  it('without an idle call, waits a second and a half (or the time it is given)', () => {
    vi.useFakeTimers()
    setIdle(undefined)
    const work = vi.fn()
    whenIdle(work)
    vi.advanceTimersByTime(1499)
    expect(work).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2)
    expect(work).toHaveBeenCalledTimes(1)
    const later = vi.fn()
    whenIdle(later, 300)
    vi.advanceTimersByTime(301)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('without an idle call, can be cancelled before the wait is over', () => {
    vi.useFakeTimers()
    setIdle(undefined)
    const work = vi.fn()
    whenIdle(work)()
    vi.advanceTimersByTime(5000)
    expect(work).not.toHaveBeenCalled()
  })
})

describe('savesData', () => {
  it('is true only when the browser says the visitor wants to save data', () => {
    expect(savesData()).toBe(false)
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: false } })
    expect(savesData()).toBe(false)
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } })
    expect(savesData()).toBe(true)
  })
})
