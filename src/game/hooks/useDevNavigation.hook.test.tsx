// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react'
import { STAGES } from '../constants/stages'
import { gameStore } from '../logic/gameStore.instance'
import { placeStore } from '../places/placeStore'
import { useDevNavigation } from './useDevNavigation'

afterEach(() => {
  act(() => placeStore.setState({ place: 'class', from: 'class', trip: null }))
  act(() => gameStore.setState({ phase: 'exploring' }))
  document.body.innerHTML = ''
})

function setup(currentStageIndex = 3) {
  const setStageIndex = vi.fn()
  const hook = renderHook((p: { at: number }) => useDevNavigation({ setStageIndex, currentStageIndex: p.at }), { initialProps: { at: currentStageIndex } })
  return { setStageIndex, ...hook }
}

describe('useDevNavigation', () => {
  it('next and previous move one stage, and stay inside the school', () => {
    const { result, setStageIndex, rerender } = setup(3)
    act(() => result.current.nextStage())
    expect(setStageIndex).toHaveBeenLastCalledWith(4)
    act(() => result.current.prevStage())
    expect(setStageIndex).toHaveBeenLastCalledWith(2)
    rerender({ at: 0 })
    act(() => result.current.prevStage())
    expect(setStageIndex).toHaveBeenLastCalledWith(0)
    rerender({ at: STAGES.length - 1 })
    act(() => result.current.nextStage())
    expect(setStageIndex).toHaveBeenLastCalledWith(STAGES.length - 1)
  })

  it('typing a stage number and submitting jumps there (counted from 1) and clears the box', () => {
    const { result, setStageIndex } = setup()
    act(() => result.current.setJumpInput('7'))
    expect(result.current.jumpInput).toBe('7')
    act(() => result.current.handleJumpSubmit())
    expect(setStageIndex).toHaveBeenLastCalledWith(6)
    expect(result.current.jumpInput).toBe('')
  })

  it('a number outside the school is brought back inside', () => {
    const { result, setStageIndex } = setup()
    act(() => result.current.setJumpInput('999'))
    act(() => result.current.handleJumpSubmit())
    expect(setStageIndex).toHaveBeenLastCalledWith(STAGES.length - 1)
  })

  it('something that is not a number goes nowhere, but still clears the box', () => {
    const { result, setStageIndex } = setup()
    act(() => result.current.setJumpInput('abc'))
    act(() => result.current.handleJumpSubmit())
    expect(setStageIndex).not.toHaveBeenCalled()
    expect(result.current.jumpInput).toBe('')
  })

  it('the keys 1 and 2 go to the next and the previous stage', () => {
    const { setStageIndex } = setup(5)
    fireEvent.keyDown(window, { key: '1' })
    expect(setStageIndex).toHaveBeenLastCalledWith(6)
    fireEvent.keyDown(window, { key: '2' })
    expect(setStageIndex).toHaveBeenLastCalledWith(4)
  })

  it('the keys 1 and 2 do nothing in a built game (children cannot skip a class), unless the address says ?dev', () => {
    vi.stubEnv('DEV', false)
    const { setStageIndex } = setup(5)
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: '2' })
    expect(setStageIndex).not.toHaveBeenCalled()
    window.history.replaceState(null, '', '/?dev')
    fireEvent.keyDown(window, { key: '1' })
    expect(setStageIndex).toHaveBeenCalledWith(6)
    window.history.replaceState(null, '', '/')
    vi.unstubAllEnvs()
  })

  it('the keys 1 and 2 leave the stage alone in the yard and the library (there they answer a friend)', () => {
    const { setStageIndex } = setup(3)
    for (const place of ['yard', 'library'] as const) {
      act(() => placeStore.setState({ place }))
      fireEvent.keyDown(window, { key: '1' })
      fireEvent.keyDown(window, { key: '2' })
    }
    expect(setStageIndex).not.toHaveBeenCalled()
    act(() => placeStore.setState({ place: 'class' }))
    fireEvent.keyDown(window, { key: '1' })
    expect(setStageIndex).toHaveBeenCalledWith(4)
  })

  it('other keys do nothing', () => {
    const { setStageIndex } = setup()
    fireEvent.keyDown(window, { key: '3' })
    fireEvent.keyDown(window, { key: 'a' })
    expect(setStageIndex).not.toHaveBeenCalled()
  })

  it('typing a 1 into a box (the name, the stage number) does not change the stage', () => {
    const { setStageIndex } = setup()
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    fireEvent.keyDown(window, { key: '1' })
    const area = document.createElement('textarea')
    document.body.append(area)
    area.focus()
    fireEvent.keyDown(window, { key: '2' })
    expect(setStageIndex).not.toHaveBeenCalled()
  })

  it('nothing changes the stage while a teacher is talking or asking', () => {
    const { setStageIndex } = setup()
    for (const phase of ['talking', 'asking'] as const) {
      act(() => gameStore.setState({ phase }))
      fireEvent.keyDown(window, { key: '1' })
      fireEvent.keyDown(window, { key: '2' })
    }
    expect(setStageIndex).not.toHaveBeenCalled()
  })

  it('stops listening when it goes away', () => {
    const { setStageIndex, unmount } = setup()
    unmount()
    fireEvent.keyDown(window, { key: '1' })
    expect(setStageIndex).not.toHaveBeenCalled()
  })

describe('useDevNavigation: the questions inside a class', () => {
  // (the hooks of the tests before listen to the keys until they are taken away)
  beforeEach(() => cleanup())
  it('3 goes on one question and 4 back one, in the class she is in, and the buttons do the same', () => {
    act(() => gameStore.getState().devJump(2, 1))
    const { result } = setup(2)
    fireEvent.keyDown(window, { key: '3' })
    expect(gameStore.getState().answered.size).toBe(2)
    fireEvent.keyDown(window, { key: '4' })
    expect(gameStore.getState().answered.size).toBe(1)
    act(() => result.current.nextQuestion())
    expect(gameStore.getState().answered.size).toBe(2)
    act(() => result.current.prevQuestion())
    expect(gameStore.getState().answered.size).toBe(1)
  })

  it('does nothing in the yard or the library, where the number keys answer a friend', () => {
    act(() => gameStore.getState().devJump(2, 1))
    setup(2)
    act(() => placeStore.setState({ place: 'yard' }))
    fireEvent.keyDown(window, { key: '3' })
    expect(gameStore.getState().answered.size).toBe(1)
  })
})
})
