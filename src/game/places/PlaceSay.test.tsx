// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { PlaceSay } from './PlaceSay'
import { SAY_SECONDS, sayStore } from './sayStore'

cleanupAfterEach()
afterEach(() => {
  vi.useRealTimers()
  act(() => sayStore.getState().clear())
})

const globe = { de: 'Die Erde dreht sich!', pt: 'A Terra está girando!', en: 'The Earth is spinning!' }

describe('PlaceSay', () => {
  it('shows nothing when nothing is said', () => {
    const { container } = renderUI(<PlaceSay />, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('shows the line in her language, as a status for the screen reader', () => {
    renderUI(<PlaceSay />, 'de')
    act(() => sayStore.getState().say(globe))
    expect(screen.getByRole('status').textContent).toBe('Die Erde dreht sich!')
  })

  it.each([
    ['en', 'The Earth is spinning!'],
    ['pt', 'A Terra está girando!'],
  ] as const)('says it in %s too', (lang, text) => {
    renderUI(<PlaceSay />, lang)
    act(() => sayStore.getState().say(globe))
    expect(screen.getByText(text)).toBeTruthy()
  })

  it('goes away by itself after a few seconds', () => {
    vi.useFakeTimers()
    renderUI(<PlaceSay />, 'en')
    act(() => sayStore.getState().say(globe))
    act(() => void vi.advanceTimersByTime(SAY_SECONDS * 1000 - 100))
    expect(screen.queryByRole('status')).not.toBeNull()
    act(() => void vi.advanceTimersByTime(200))
    expect(screen.queryByRole('status')).toBeNull()
    expect(sayStore.getState().saying).toBeNull()
  })

  it('a new line restarts the time: the same line said again stays up a full time from the second saying', () => {
    vi.useFakeTimers()
    renderUI(<PlaceSay />, 'en')
    act(() => sayStore.getState().say(globe))
    act(() => void vi.advanceTimersByTime(SAY_SECONDS * 1000 - 500))
    act(() => sayStore.getState().say(globe))
    act(() => void vi.advanceTimersByTime(1000))
    expect(screen.queryByRole('status')).not.toBeNull()
    act(() => void vi.advanceTimersByTime(SAY_SECONDS * 1000))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not leave a timer behind when it goes away first', () => {
    vi.useFakeTimers()
    const view = renderUI(<PlaceSay />, 'en')
    act(() => sayStore.getState().say(globe))
    view.unmount()
    act(() => void vi.advanceTimersByTime(SAY_SECONDS * 1000 + 100))
    expect(sayStore.getState().saying).not.toBeNull()
  })
})
