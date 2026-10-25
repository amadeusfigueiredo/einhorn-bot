// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, renderHook } from '@testing-library/react'
import type { DanceContext } from './danceKeys'
import { moveStore } from './moveStore'
import { useDanceControls } from './useDanceControls'

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))

const open: DanceContext = { hero: 'amara', view: '3d', paused: false, covered: false, nameCardOpen: false, worldPaused: false, busy: false, menuOpen: false }
afterEach(() => {
  cleanup()
  moveStore.getState().cancel()
})

describe('useDanceControls', () => {
  it('Space starts a move when she can dance', () => {
    renderHook(() => useDanceControls(() => open))
    fireEvent.keyDown(window, { key: ' ' })
    expect(moveStore.getState().current).not.toBeNull()
  })

  it('and stops the page from scrolling', () => {
    renderHook(() => useDanceControls(() => open))
    const e = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })

  it('does nothing when she cannot (and lets the key alone)', () => {
    renderHook(() => useDanceControls(() => ({ ...open, paused: true })))
    const e = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    window.dispatchEvent(e)
    expect(moveStore.getState().current).toBeNull()
    expect(e.defaultPrevented).toBe(false)
  })

  it('does nothing for other keys and for a Space on a button', () => {
    renderHook(() => useDanceControls(() => open))
    fireEvent.keyDown(window, { key: 'a' })
    const button = document.createElement('button')
    document.body.appendChild(button)
    fireEvent.keyDown(button, { key: ' ' })
    button.remove()
    expect(moveStore.getState().current).toBeNull()
  })

  it('reads the latest situation at the moment of the key', () => {
    let situation = { ...open, paused: true }
    renderHook(() => useDanceControls(() => situation))
    fireEvent.keyDown(window, { key: ' ' })
    expect(moveStore.getState().current).toBeNull()
    situation = open
    fireEvent.keyDown(window, { key: ' ' })
    expect(moveStore.getState().current).not.toBeNull()
  })

  it('stops listening when it goes away', () => {
    const view = renderHook(() => useDanceControls(() => open))
    view.unmount()
    fireEvent.keyDown(window, { key: ' ' })
    expect(moveStore.getState().current).toBeNull()
  })
})
