// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { playSfx } from '../audio/sfx'
import { playVoice } from '../audio/voice'
import { pauseStore } from '../pause/pauseStore'
import { STICKERS } from '../data/stickers'
import { STAGES } from '../constants/stages'
import { StageTransition } from './StageTransition'
import { DONE_MS, REDUCED_MS } from './transitionModel'

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))
vi.mock('../audio/voice', () => ({ playVoice: vi.fn() }))

cleanupAfterEach()
beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(playSfx).mockClear()
  vi.mocked(playVoice).mockClear()
})
afterEach(() => {
  pauseStore.getState().resume()
  vi.useRealTimers()
})

const at = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const root = (c: HTMLElement) => c.querySelector('.transition') as HTMLElement

// The 2D game has no film of the walk through the corridor: after the "Stage complete!" card a still title card shows.
describe('StageTransition: the still title card', () => {
  it('is a short, still card with no film, over after a moment', () => {
    const onDone = vi.fn()
    const { container } = renderUI(<StageTransition from={3} to={4} onDone={onDone} />, 'en')
    expect(container.querySelector('.transition__card')).toBeTruthy()
    expect(playSfx).not.toHaveBeenCalled()
    at(REDUCED_MS - 50)
    expect(onDone).not.toHaveBeenCalled()
    at(100)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('the card names the stage, its subject and level and the world', () => {
    const { container } = renderUI(<StageTransition from={10} to={11} onDone={() => {}} />, 'en')
    expect(container.querySelector('.transition__card-stage')?.textContent).toBe('Stage 12 of 15')
    expect(container.querySelector('.transition__card-subject')?.textContent).toBe('Music · hard')
    expect(container.querySelector('.transition__card-world')?.textContent).toBe('Aurora Concert')
  })

  it('names the world in German and Portuguese too', () => {
    const de = renderUI(<StageTransition to={11} onDone={() => {}} />, 'de')
    expect(de.container.querySelector('.transition__card-world')?.textContent).toBe('Polarlicht-Konzert')
    de.unmount()
    const pt = renderUI(<StageTransition to={11} onDone={() => {}} />, 'pt')
    expect(pt.container.querySelector('.transition__card-world')?.textContent).toBe('Concerto da aurora')
  })

  it('a tap or Enter, Space, Escape skip it', () => {
    const onDone = vi.fn()
    const { container, unmount } = renderUI(<StageTransition to={4} onDone={onDone} />)
    fireEvent.pointerDown(root(container))
    expect(onDone).toHaveBeenCalledTimes(1)
    unmount()
    for (const key of ['Enter', ' ', 'Escape']) {
      const again = vi.fn()
      const view = renderUI(<StageTransition to={4} onDone={again} />)
      fireEvent.keyDown(window, { key })
      expect(again, key).toHaveBeenCalledTimes(1)
      view.unmount()
    }
  })

  it('hands back exactly once, however it is ended', () => {
    const onDone = vi.fn()
    const { container } = renderUI(<StageTransition to={4} onDone={onDone} />)
    fireEvent.pointerDown(root(container))
    fireEvent.pointerDown(root(container))
    at(REDUCED_MS * 2)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('other keys do nothing, and a pause holds the card', () => {
    const onDone = vi.fn()
    renderUI(<StageTransition to={4} onDone={onDone} />)
    fireEvent.keyDown(window, { key: 'a' })
    act(() => pauseStore.getState().pause())
    at(REDUCED_MS * 5)
    expect(onDone).not.toHaveBeenCalled()
    act(() => pauseStore.getState().resume())
    at(REDUCED_MS + 10)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('stops its timer when it is taken away', () => {
    const onDone = vi.fn()
    const { unmount } = renderUI(<StageTransition to={4} onDone={onDone} />)
    unmount()
    at(REDUCED_MS + 1000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('every stage has its card', () => {
    STAGES.forEach((_, i) => {
      const { container, unmount } = renderUI(<StageTransition to={i} onDone={() => {}} />)
      expect(container.querySelector('.transition__card-stage')?.textContent).toBe(`Stage ${i + 1} of 15`)
      unmount()
    })
  })
})

describe('StageTransition: a finished stage', () => {
  it.each(['Enter', ' ', 'Escape'])('%s on the "Stage complete!" card goes on to the next class, like the button', (key) => {
    renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    expect(screen.getByRole('dialog', { name: 'Stage complete!' })).toBeTruthy()
    fireEvent.keyDown(window, { key })
    expect(screen.queryByRole('dialog', { name: 'Stage complete!' })).toBeNull()
  })

  it('other keys leave the card where it is', () => {
    renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByRole('dialog', { name: 'Stage complete!' })).toBeTruthy()
  })

  it('starts with "Stage complete!": three stars, the sticker won, and a button to the next class', () => {
    const { container } = renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    expect(container.querySelector('.transition__done-stars')?.textContent).toBe('★ ★ ★')
    expect(container.querySelector('.transition__sticker-badge')?.textContent).toBe(STICKERS[4].emoji)
    expect(screen.getByText('You won a sticker.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /To the next class/ })).toBeTruthy()
    expect(playSfx).toHaveBeenCalledWith('sparkle')
    expect(playSfx).not.toHaveBeenCalledWith('correct')
    expect(playVoice).toHaveBeenCalledWith('cheer')
    expect(container.querySelector('.transition__card')).toBeNull()
  })

  it('focuses the button so Enter goes on', () => {
    renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /To the next class/ }))
  })

  it('the button goes on to the title card', () => {
    const { container } = renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: /To the next class/ }))
    expect(container.querySelector('.transition__done')).toBeNull()
    expect(container.querySelector('.transition__card')).toBeTruthy()
  })

  it('waits for a tap, but not for ever: the title card comes by itself after a few seconds', () => {
    const { container } = renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    at(DONE_MS - 100)
    expect(container.querySelector('.transition__done')).toBeTruthy()
    at(200)
    expect(container.querySelector('.transition__card')).toBeTruthy()
  })

  it('a pause holds the card, however long; going on gives it its full time again', () => {
    const { container } = renderUI(<StageTransition from={4} to={5} completed onDone={() => {}} />, 'en')
    at(DONE_MS - 100)
    act(() => pauseStore.getState().pause())
    at(DONE_MS * 5)
    expect(container.querySelector('.transition__done')).toBeTruthy()
    act(() => pauseStore.getState().resume())
    at(DONE_MS - 100)
    expect(container.querySelector('.transition__done')).toBeTruthy()
    at(200)
    expect(container.querySelector('.transition__card')).toBeTruthy()
  })

  it('a tap on the card goes on to the title card rather than skipping everything', () => {
    const onDone = vi.fn()
    const { container } = renderUI(<StageTransition from={4} to={5} completed onDone={onDone} />, 'en')
    fireEvent.pointerDown(root(container))
    expect(onDone).not.toHaveBeenCalled()
    expect(container.querySelector('.transition__card')).toBeTruthy()
  })
})
