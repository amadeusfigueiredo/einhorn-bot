// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCanvasSize } from './useCanvasSize'
import { pickCanvasSize } from '../utils/canvasSize'

function setViewport(width: number, height: number, event: 'resize' | 'orientationchange' = 'resize') {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event(event))
  })
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
})

describe('useCanvasSize', () => {
  it('starts with the size that suits the window', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
    const { result } = renderHook(() => useCanvasSize())
    expect(result.current).toEqual(pickCanvasSize(390, 844))
  })

  it('follows the window as it is resized', () => {
    const { result } = renderHook(() => useCanvasSize())
    setViewport(1280, 720)
    expect(result.current).toEqual(pickCanvasSize(1280, 720))
    setViewport(390, 844)
    expect(result.current).toEqual(pickCanvasSize(390, 844))
  })

  it('follows a phone being turned', () => {
    const { result } = renderHook(() => useCanvasSize())
    setViewport(844, 390, 'orientationchange')
    expect(result.current).toEqual(pickCanvasSize(844, 390))
    expect(result.current.width).toBeGreaterThan(result.current.height)
  })

  it('stops listening when it goes away', () => {
    const { result, unmount } = renderHook(() => useCanvasSize())
    const before = result.current
    unmount()
    setViewport(390, 844)
    expect(result.current).toBe(before)
  })
})
