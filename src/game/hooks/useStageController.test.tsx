// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStageController } from './useStageController'
import { gameStore } from '../logic/gameStore.instance'
import { STAGES } from '../constants/stages'
import { buildStages } from '../constants/stages'
import { pickCanvasSize } from '../utils/canvasSize'

function viewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

beforeEach(() => {
  viewport(1280, 720)
  act(() => gameStore.getState().jumpToStage(0))
})
afterEach(() => {
  viewport(1024, 768)
  act(() => gameStore.getState().jumpToStage(0))
})

describe('useStageController', () => {
  it('knows the stage the game is on, with its content', () => {
    const { result } = renderHook(() => useStageController())
    expect(result.current.stageIndex).toBe(0)
    expect(result.current.stage.subject).toBe(STAGES[0].subject)
    expect(result.current.stage.npcs?.length).toBeGreaterThan(0)
  })

  it('follows the game to another stage', () => {
    const { result } = renderHook(() => useStageController())
    act(() => gameStore.getState().jumpToStage(4))
    expect(result.current.stageIndex).toBe(4)
    expect(result.current.stage.subject).toBe(STAGES[4].subject)
  })

  it('places the characters for the size of the window, landscape or portrait', () => {
    const { result } = renderHook(() => useStageController())
    const landscape = pickCanvasSize(1280, 720)
    expect(result.current.canvasWidth).toBe(landscape.width)
    expect(result.current.stage.npcs).toEqual(buildStages(landscape.width, landscape.height)[0].npcs)
    viewport(390, 844)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    const portrait = pickCanvasSize(390, 844)
    expect(result.current.canvasWidth).toBe(portrait.width)
    expect(result.current.canvasHeight).toBe(portrait.height)
    expect(result.current.stage.npcs).toEqual(buildStages(portrait.width, portrait.height)[0].npcs)
  })

  it('the stage buttons move the game itself', () => {
    const { result } = renderHook(() => useStageController())
    act(() => result.current.nextStage())
    expect(gameStore.getState().stageIndex).toBe(1)
    act(() => result.current.prevStage())
    expect(gameStore.getState().stageIndex).toBe(0)
  })

  it('cannot go before the first stage', () => {
    const { result } = renderHook(() => useStageController())
    act(() => result.current.prevStage())
    expect(gameStore.getState().stageIndex).toBe(0)
  })
})
