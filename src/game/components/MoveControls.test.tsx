// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { MoveControls } from './MoveControls'
import type { Keys, MoveTarget } from '../types'

cleanupAfterEach()

function setup(target: MoveTarget | null = { x: 10, y: 20 } as MoveTarget) {
  const keysRef = { current: {} as Keys }
  const moveTargetRef = { current: target }
  renderUI(<MoveControls keysRef={keysRef} moveTargetRef={moveTargetRef} />, 'en')
  return { keysRef, moveTargetRef }
}

const DIRECTIONS = [
  ['Up', 'arrowup'],
  ['Left', 'arrowleft'],
  ['Down', 'arrowdown'],
  ['Right', 'arrowright'],
] as const

describe('MoveControls (the on-screen arrows)', () => {
  it('has four labelled buttons in a labelled group', () => {
    setup()
    expect(screen.getByLabelText('Movement controls')).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(4)
    for (const [name] of DIRECTIONS) expect(screen.getByRole('button', { name })).toBeTruthy()
  })

  it.each(DIRECTIONS)('%s holds its key while pressed and lets go when released', (name, key) => {
    const { keysRef } = setup()
    const button = screen.getByRole('button', { name })
    fireEvent.pointerDown(button)
    expect(keysRef.current[key]).toBe(true)
    fireEvent.pointerUp(button)
    expect(keysRef.current[key]).toBe(false)
  })

  it.each(DIRECTIONS)('%s also lets go when the finger slides off or the touch is cancelled', (name, key) => {
    const { keysRef } = setup()
    const button = screen.getByRole('button', { name })
    fireEvent.pointerDown(button)
    fireEvent.pointerLeave(button)
    expect(keysRef.current[key]).toBe(false)
    fireEvent.pointerDown(button)
    fireEvent.pointerCancel(button)
    expect(keysRef.current[key]).toBe(false)
  })

  it('walking with the arrows cancels a walk to a tapped spot', () => {
    const { moveTargetRef } = setup()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Up' }))
    expect(moveTargetRef.current).toBeNull()
  })

  it('two arrows can be held at once (diagonal)', () => {
    const { keysRef } = setup()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Up' }))
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Right' }))
    expect(keysRef.current.arrowup).toBe(true)
    expect(keysRef.current.arrowright).toBe(true)
  })

  it('the buttons are plain buttons, so they never submit a form', () => {
    setup()
    for (const b of screen.getAllByRole('button')) expect(b.getAttribute('type')).toBe('button')
  })
})
