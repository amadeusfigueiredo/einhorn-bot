// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { NumberCard } from './NumberCard'

cleanupAfterEach()

const card = (onSubmit = vi.fn(), kicker?: string) => {
  renderUI(<NumberCard kicker={kicker} prompt="What is 17 + 26?" onSubmit={onSubmit} />, 'en')
  return onSubmit
}
const key = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const shown = () => screen.getByRole('status', { name: 'Your answer' }).textContent

describe('the number card', () => {
  it('is a dialog with the question, a hint, and a pad of ten digits, erase and OK', () => {
    card(vi.fn(), 'Amara, do you know this?')
    expect(screen.getByRole('dialog', { name: 'What is 17 + 26?' })).toBeTruthy()
    expect(screen.getByText('Amara, do you know this?')).toBeTruthy()
    expect(shown()).toBe('Type the number')
    expect(screen.getAllByRole('button')).toHaveLength(12)
    expect((screen.getByRole('button', { name: 'OK' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows what is pressed, and sends it with OK', () => {
    const onSubmit = card()
    key('4')
    key('3')
    expect(shown()).toBe('43')
    expect((screen.getByRole('button', { name: 'OK' }) as HTMLButtonElement).disabled).toBe(false)
    key('OK')
    expect(onSubmit).toHaveBeenCalledWith('43')
  })

  it('erase takes off the last digit, down to the hint again', () => {
    card()
    key('4')
    key('3')
    key('Erase')
    expect(shown()).toBe('4')
    key('Erase')
    expect(shown()).toBe('Type the number')
    key('Erase')
    expect(shown()).toBe('Type the number')
  })

  it('takes at most four digits', () => {
    card()
    for (const d of ['1', '2', '3', '4', '5']) key(d)
    expect(shown()).toBe('1234')
  })

  it('works with the keyboard: digits, Backspace and Enter', () => {
    const onSubmit = card()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: '4' })
    fireEvent.keyDown(window, { key: '3' })
    fireEvent.keyDown(window, { key: '9' })
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(shown()).toBe('43')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('43')
  })

  it('ignores other keys, held keys, shortcuts, and keys typed in a text field', () => {
    card()
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: '5', repeat: true })
    fireEvent.keyDown(window, { key: '5', ctrlKey: true })
    const field = document.createElement('input')
    document.body.append(field)
    fireEvent.keyDown(field, { key: '5' })
    field.remove()
    expect(shown()).toBe('Type the number')
  })

  it('Enter on a button of the pad presses that button only (it does not also send)', () => {
    const onSubmit = card()
    fireEvent.keyDown(window, { key: '4' })
    fireEvent.keyDown(screen.getByRole('button', { name: '7' }), { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('starts with the focus in the dialog', () => {
    card()
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('speaks German and Portuguese', () => {
    const de = renderUI(<NumberCard prompt="Was ist 3 × 4?" onSubmit={() => {}} />, 'de')
    expect(screen.getByText('Tippe die Zahl ein')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeTruthy()
    de.unmount()
    renderUI(<NumberCard prompt="Quanto é 3 × 4?" onSubmit={() => {}} />, 'pt')
    expect(screen.getByText('Digite o número')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeTruthy()
  })
})
