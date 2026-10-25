// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, renderHook } from '@testing-library/react'
import { useT } from './useT'

describe('useT', () => {
  it('needs an I18nProvider above it and says so, instead of showing wrong texts', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useT())).toThrow('useT() needs an <I18nProvider> above it')
    expect(() => render(<Probe />)).toThrow('useT()')
    vi.restoreAllMocks()
  })
})

function Probe() {
  useT()
  return null
}
