// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'

import { render, screen, cleanup } from '@testing-library/react'
import { ViewErrorBoundary } from './ViewErrorBoundary'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Boom(): never {
  throw new Error('the chunk did not load')
}

describe('ViewErrorBoundary', () => {
  it('shows its children when all is well', () => {
    render(
      <ViewErrorBoundary>
        <p>the game</p>
      </ViewErrorBoundary>
    )
    expect(screen.getByText('the game')).toBeTruthy()
  })

  it('when the view fails it shows nothing broken', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <ViewErrorBoundary>
        <Boom />
      </ViewErrorBoundary>
    )
    expect(container.innerHTML).toBe('')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('View failed'), expect.any(Error))
  })
})
