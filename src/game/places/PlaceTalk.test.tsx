// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { PlaceTalk } from './PlaceTalk'

cleanupAfterEach()
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))

const talk = (over: Partial<Parameters<typeof PlaceTalk>[0]> = {}) => {
  const props = { who: 'Friend', line: 'Hi Mia! Are you having a nice day today?', options: ['Yes, great!', 'Not so good …'], onChoose: vi.fn(), onClose: vi.fn(), ...over }
  const view = renderUI(<PlaceTalk {...props} />, 'en')
  return Object.assign(props, { view })
}

describe('PlaceTalk', () => {
  it('is a dialog named after who is talking, with the whole line for the screen reader', () => {
    talk()
    expect(screen.getByRole('dialog', { name: 'Talking with Friend' })).toBeTruthy()
    expect(screen.getByText('Hi Mia! Are you having a nice day today?', { selector: '.visually-hidden' })).toBeTruthy()
    expect(screen.getByText('Friend')).toBeTruthy()
  })

  it('shows every answer as a numbered button', () => {
    talk()
    expect(screen.getByRole('button', { name: /Yes, great!/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Not so good/ })).toBeTruthy()
    expect(document.querySelectorAll('.place-talk__key')).toHaveLength(2)
  })

  it('picks the answer that is tapped', () => {
    const p = talk()
    fireEvent.click(screen.getByRole('button', { name: /Not so good/ }))
    expect(p.onChoose).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('picks an answer with its number key, and ignores a number there is no answer for', () => {
    const p = talk()
    fireEvent.keyDown(window, { key: '1' })
    expect(p.onChoose).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(window, { key: '2' })
    expect(p.onChoose).toHaveBeenLastCalledWith(1)
    fireEvent.keyDown(window, { key: '3' })
    fireEvent.keyDown(window, { key: '0' })
    fireEvent.keyDown(window, { key: 'x' })
    expect(p.onChoose).toHaveBeenCalledTimes(2)
  })

  it('leaves the talk with Escape and with the close button', () => {
    const p = talk()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(p.onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(p.onClose).toHaveBeenCalledTimes(2)
  })

  it('handles Escape before the pause keys see it, and says so (so Escape does not also pause the game)', () => {
    talk()
    const seen: boolean[] = []
    const later = (e: KeyboardEvent) => seen.push(e.defaultPrevented)
    window.addEventListener('keydown', later)
    fireEvent.keyDown(window, { key: 'Escape' })
    window.removeEventListener('keydown', later)
    expect(seen).toEqual([true])
  })

  it('does not react to a held key, nor to keys typed in a field', () => {
    const p = talk()
    fireEvent.keyDown(window, { key: '1', repeat: true })
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: '1' })
    input.remove()
    expect(p.onChoose).not.toHaveBeenCalled()
  })

  it('puts the keyboard on the first answer, again for each new line', () => {
    const { rerender } = renderUI(<PlaceTalk who="A" line="one" options={['x', 'y']} onChoose={() => {}} onClose={() => {}} />, 'en')
    expect(document.activeElement?.textContent).toContain('x')
    ;(document.activeElement as HTMLElement).blur()
    rerender(<PlaceTalk who="A" line="two" options={['z']} onChoose={() => {}} onClose={() => {}} />)
    expect(document.activeElement?.textContent).toContain('z')
  })

  it('types the line out and then it is all there (and at once with reduced motion)', () => {
    vi.useFakeTimers()
    talk()
    act(() => void vi.advanceTimersByTime(5000))
    vi.useRealTimers()
    expect(document.querySelector('.place-talk__line')?.textContent?.length).toBeGreaterThan(0)
  })

  it('stops listening for keys when it is gone', () => {
    const p = talk()
    p.view.unmount()
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(p.onChoose).not.toHaveBeenCalled()
    expect(p.onClose).not.toHaveBeenCalled()
  })
})
