// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import useKeys from './useKeys'

describe('useKeys', () => {
  it('starts with no key held', () => {
    const { result } = renderHook(() => useKeys())
    expect(result.current.current).toEqual({})
  })

  it('remembers keys while they are held, in lower case', () => {
    const { result } = renderHook(() => useKeys())
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'W' })
    expect(result.current.current).toEqual({ arrowup: true, w: true })
    fireEvent.keyUp(window, { key: 'ArrowUp' })
    expect(result.current.current.arrowup).toBe(false)
    expect(result.current.current.w).toBe(true)
  })

  it('does not move the unicorn while the child types a name', () => {
    const { result } = renderHook(() => useKeys())
    const input = document.createElement('input')
    document.body.append(input)
    fireEvent.keyDown(input, { key: 'a' })
    expect(result.current.current.a).toBeUndefined()
    input.remove()
  })

  it('does not move the unicorn while a dropdown list is open', () => {
    const { result } = renderHook(() => useKeys())
    const list = document.createElement('ul')
    list.setAttribute('role', 'listbox')
    document.body.append(list)
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    expect(result.current.current.arrowdown).toBeUndefined()
    list.remove()
  })

  it('still lets go of a key when the release happens in a text field', () => {
    const { result } = renderHook(() => useKeys())
    fireEvent.keyDown(window, { key: 'd' })
    const input = document.createElement('input')
    document.body.append(input)
    fireEvent.keyUp(input, { key: 'd' })
    expect(result.current.current.d).toBe(false)
    input.remove()
  })

  it('keeps one object for its whole life', () => {
    const { result, rerender } = renderHook(() => useKeys())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('stops listening when it goes away', () => {
    const { result, unmount } = renderHook(() => useKeys())
    unmount()
    fireEvent.keyDown(window, { key: 'x' })
    expect(result.current.current.x).toBeUndefined()
  })
})
