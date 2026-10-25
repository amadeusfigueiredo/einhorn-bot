// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react'
import { pauseStore } from './pauseStore'
import { usePauseControls } from './usePauseControls'

const mount = (filmPlaying = false, nameCardOpen = false) => renderHook((p: { filmPlaying: boolean; nameCardOpen: boolean }) => usePauseControls(p), { initialProps: { filmPlaying, nameCardOpen } })
const visibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => pauseStore.getState().resume())
afterEach(() => {
  cleanup()
  visibility('visible')
  pauseStore.getState().resume()
  document.body.innerHTML = ''
})

describe('usePauseControls', () => {
  it('P pauses and goes on', () => {
    mount()
    fireEvent.keyDown(window, { key: 'p' })
    expect(pauseStore.getState().paused).toBe(true)
    fireEvent.keyDown(window, { key: 'P' })
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('Escape pauses a stage and goes on', () => {
    mount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('Escape leaves a film alone; P still pauses it', () => {
    mount(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(false)
    fireEvent.keyDown(window, { key: 'p' })
    expect(pauseStore.getState().paused).toBe(true)
  })

  it('Escape leaves the name card alone', () => {
    mount(false, true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('Escape closes an open menu first instead of pausing', () => {
    const open = document.createElement('button')
    open.setAttribute('aria-expanded', 'true')
    document.body.appendChild(open)
    mount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('does not pause while a name is typed', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    mount()
    fireEvent.keyDown(input, { key: 'p' })
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('pauses by itself when the tab goes into the background, and waits there when it is back', () => {
    mount()
    act(() => visibility('hidden'))
    expect(pauseStore.getState().paused).toBe(true)
    act(() => visibility('visible'))
    expect(pauseStore.getState().paused).toBe(true)
  })

  it('follows a change between stage and film', () => {
    const { rerender } = mount(false)
    rerender({ filmPlaying: true, nameCardOpen: false })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(false)
    rerender({ filmPlaying: false, nameCardOpen: false })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(true)
  })

  it('stops listening when it goes away', () => {
    const { unmount } = mount()
    unmount()
    fireEvent.keyDown(window, { key: 'p' })
    act(() => visibility('hidden'))
    expect(pauseStore.getState().paused).toBe(false)
  })
})
