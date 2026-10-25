// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { ParentGate } from './ParentGate'

cleanupAfterEach()

/** Dice that always give 13 × 4. */
const dice = () => 0

describe('the gate screen', () => {
  it('shows the sum and puts the cursor in the answer', () => {
    renderUI(<ParentGate onOpen={() => {}} onClose={() => {}} random={dice} />, 'en')
    expect(screen.getByText('13 × 4')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByPlaceholderText('Your answer'))
  })

  it('opens on the right answer, by the button or by Enter', () => {
    const onOpen = vi.fn()
    renderUI(<ParentGate onOpen={onOpen} onClose={() => {}} random={dice} />, 'en')
    const input = screen.getByPlaceholderText('Your answer')
    fireEvent.change(input, { target: { value: '52' } })
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    fireEvent.submit(input.closest('form')!)
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('on a wrong answer it says so, clears the answer and asks a new sum', () => {
    const onOpen = vi.fn()
    // Each sum takes two rolls: 16 × 4 first, then 13 × 9.
    const rolls = [0.5, 0, 0, 0.99]
    let n = 0
    const rolling = () => rolls[n++ % rolls.length]
    renderUI(<ParentGate onOpen={onOpen} onClose={() => {}} random={rolling} />, 'en')
    const first = screen.getByText(/×/).textContent
    const input = screen.getByPlaceholderText('Your answer') as HTMLInputElement
    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpen).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('not it')
    expect(input.value).toBe('')
    expect(screen.getByText(/×/).textContent).not.toBe(first)
    expect(document.activeElement).toBe(input)
  })

  it('"Back" leaves without opening', () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()
    renderUI(<ParentGate onOpen={onOpen} onClose={onClose} random={dice} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('works in German and Portuguese', () => {
    const de = renderUI(<ParentGate onOpen={() => {}} onClose={() => {}} random={dice} />, 'de')
    expect(screen.getByText(/Nur für Erwachsene/)).toBeTruthy()
    de.unmount()
    renderUI(<ParentGate onOpen={() => {}} onClose={() => {}} random={dice} />, 'pt')
    expect(screen.getByText(/Só para adultos/)).toBeTruthy()
  })

  it('draws with the real dice when none are given', () => {
    renderUI(<ParentGate onOpen={() => {}} onClose={() => {}} />, 'en')
    expect(screen.getByText(/\d+ × \d+/)).toBeTruthy()
  })
})
