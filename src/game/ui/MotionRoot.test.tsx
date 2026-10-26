// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { m } from 'framer-motion'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { MotionRoot } from './MotionRoot'

afterEach(() => cleanup())

describe('MotionRoot', () => {
  it('shows its children', () => {
    render(
      <MotionRoot>
        <p>hello</p>
      </MotionRoot>
    )
    expect(screen.getByText('hello')).toBeTruthy()
  })

  it('lets the light "m" animation parts be used underneath', () => {
    render(
      <MotionRoot>
        <m.div data-testid="box" animate={{ opacity: 1 }} />
      </MotionRoot>
    )
    expect(screen.getByTestId('box')).toBeTruthy()
  })
})
