// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { STAGES } from '../constants/stages'
import { gameStore } from '../logic/gameStore.instance'
import { doneFlags } from '../logic/classProgress'
import { requiredAnswers } from '../logic/gameMachine'

const dev = vi.hoisted(() => ({ enabled: true }))
vi.mock('../utils/devTools', () => ({ devToolsEnabled: () => dev.enabled }))

import { useDevJump } from './useDevJump'

beforeEach(() => {
  dev.enabled = true
  gameStore.getState().startOver()
})
afterEach(() => gameStore.getState().startOver())

describe('useDevJump: ?stage=5&left=1 in the address', () => {
  it('goes into the class with only the last question left', () => {
    renderHook(() => useDevJump('?stage=5&left=1'))
    const s = gameStore.getState()
    expect(s.stageIndex).toBe(4)
    // the classes before it are finished
    expect(doneFlags(s.solved, STAGES).slice(0, 4)).toEqual([true, true, true, true])
    expect(s.answered.size).toBe(requiredAnswers(STAGES[4]) - 1)
  })

  it('or with the first questions answered', () => {
    renderHook(() => useDevJump('?stage=3&answered=2'))
    expect(gameStore.getState()).toMatchObject({ stageIndex: 2 })
    expect(gameStore.getState().answered.size).toBe(2)
  })

  it('or only the class (nothing answered)', () => {
    renderHook(() => useDevJump('?stage=9'))
    expect(gameStore.getState().stageIndex).toBe(8)
    expect(gameStore.getState().answered.size).toBe(0)
  })

  it('stays in the class she is in when the address names none', () => {
    gameStore.getState().jumpToStage(6)
    renderHook(() => useDevJump('?left=2'))
    expect(gameStore.getState().stageIndex).toBe(6)
    expect(gameStore.getState().answered.size).toBe(requiredAnswers(STAGES[6]) - 2)
  })

  it('does nothing when the address asks for nothing', () => {
    gameStore.getState().jumpToStage(3)
    renderHook(() => useDevJump('?view=3d'))
    expect(gameStore.getState().stageIndex).toBe(3)
  })

  it('does nothing for children: the tools are for the developers only', () => {
    dev.enabled = false
    renderHook(() => useDevJump('?stage=5&left=1'))
    expect(gameStore.getState().stageIndex).toBe(0)
    expect(gameStore.getState().answered.size).toBe(0)
  })

  it('reads the address once, when the page opens, not again when the page draws again', () => {
    const { rerender } = renderHook(() => useDevJump('?stage=5&left=1'))
    gameStore.getState().jumpToStage(1)
    rerender()
    expect(gameStore.getState().stageIndex).toBe(1)
  })

  it('reads the real address by default', () => {
    window.history.replaceState(null, '', '/?stage=4&left=1')
    renderHook(() => useDevJump())
    expect(gameStore.getState().stageIndex).toBe(3)
    window.history.replaceState(null, '', '/')
  })
})
