// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { cleanupAfterEach, fireEvent, renderUI, screen } from '../test/ui'
import { MoveControls } from './components/MoveControls'
import { useFitSize } from './hooks/useFitSize'
import type { Keys } from './types'

cleanupAfterEach()
afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  document.documentElement.removeAttribute('style')
})

describe('the on-screen arrows', () => {
  it('press and release do not break when the keys are not there yet', () => {
    renderUI(<MoveControls keysRef={{ current: null as unknown as Keys }} moveTargetRef={{ current: null }} />, 'en')
    const up = screen.getByRole('button', { name: /up/i })
    expect(() => {
      fireEvent.pointerDown(up)
      fireEvent.pointerUp(up)
    }).not.toThrow()
  })
})

describe('measuring the free space', () => {
  it('does nothing while there is no element to measure (the box stays empty)', () => {
    const { result } = renderHook(() => useFitSize({ width: 1440, height: 810 }))
    expect(result.current.areaRef.current).toBeNull()
    expect(result.current.fit.width).toBeGreaterThanOrEqual(0)
  })
})

describe('the colours the canvas draws with', () => {
  it("come from the page's colours when it has them, and from the built-in ones for any it has not", async () => {
    document.documentElement.style.setProperty('--rose-400', '#010203')
    const { canvasTheme } = await import('../styles/canvasTheme')
    const theme = canvasTheme()
    expect(theme.rose400).toBe('#010203')
    expect(theme.gold400).toBe('#ffd166')
    // asked again, it is the same (found once)
    expect(canvasTheme()).toBe(theme)
  })
})
