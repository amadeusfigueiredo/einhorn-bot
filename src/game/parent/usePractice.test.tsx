// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STAGES } from '../constants/stages'
import { createInitialState } from '../logic/gameMachine'
import { gameStore } from '../logic/gameStore.instance'
import { introStore } from '../intro/introStore'
import { pauseStore } from '../pause/pauseStore'
import { startStore } from '../start/startStore'
import { act, cleanupAfterEach, renderUI } from '../../test/ui'
import { practiceStore } from './practiceStore'
import { TICK_SECONDS, isPlaying, usePracticeWatch } from './usePractice'

cleanupAfterEach()

function Watcher() {
  usePracticeWatch()
  return null
}

beforeEach(() => {
  vi.useFakeTimers()
  practiceStore.getState().clear()
  gameStore.setState(createInitialState(STAGES, null))
  introStore.getState().finish()
  startStore.getState().close()
})
afterEach(() => {
  vi.useRealTimers()
  pauseStore.getState().resume()
  practiceStore.getState().clear()
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})

describe('is she playing', () => {
  const on = { visible: true, paused: false, startOpen: false, introActive: false }
  it('yes when nothing is in the way, and no when the tab is hidden, the game paused, or a menu or the intro has the screen', () => {
    expect(isPlaying(on)).toBe(true)
    for (const key of ['visible', 'paused', 'startOpen', 'introActive'] as const) {
      expect(isPlaying({ ...on, [key]: key === 'visible' ? false : true }), key).toBe(false)
    }
  })
})

describe('the play time', () => {
  const tick = (n = 1) => act(() => void vi.advanceTimersByTime(n * TICK_SECONDS * 1000))

  it('adds up every few seconds while she plays', () => {
    renderUI(<Watcher />, 'en')
    tick(3)
    expect(practiceStore.getState().seconds).toBe(3 * TICK_SECONDS)
  })

  it('stops while the game is paused, the start menu is up, the intro runs or the tab is hidden', () => {
    renderUI(<Watcher />, 'en')
    pauseStore.getState().pause()
    tick()
    pauseStore.getState().resume()
    startStore.getState().open()
    tick()
    startStore.getState().close()
    introStore.getState().start()
    tick()
    introStore.getState().finish()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    tick()
    expect(practiceStore.getState().seconds).toBe(0)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    tick()
    expect(practiceStore.getState().seconds).toBe(TICK_SECONDS)
  })

  it('stops counting when the game goes away', () => {
    const view = renderUI(<Watcher />, 'en')
    view.unmount()
    tick(2)
    expect(practiceStore.getState().seconds).toBe(0)
  })
})

describe('the answers', () => {
  it('counts a right answer and a wrong one in the class she is in', () => {
    renderUI(<Watcher />, 'en')
    const npc = STAGES[0].npcs![0]
    const key = { kind: 'npc' as const, id: npc.id }
    const game = gameStore.getState()
    act(() => {
      game.interact(key)
      game.beginAsking()
      game.answer((npc.question.correctIndex + 1) % 4)
    })
    expect(practiceStore.getState().classes).toEqual({ '0': { right: 0, wrong: 1 } })
    // (The "try again" popup has to go before she can talk to anyone again.)
    act(() => gameStore.getState().dispatch({ type: 'POPUP_EXPIRED', token: gameStore.getState().popup!.token }))
    act(() => {
      gameStore.getState().interact(key)
      gameStore.getState().beginAsking()
      gameStore.getState().answer(npc.question.correctIndex)
    })
    expect(practiceStore.getState().classes['0']).toEqual({ right: 1, wrong: 1 })
  })
})
