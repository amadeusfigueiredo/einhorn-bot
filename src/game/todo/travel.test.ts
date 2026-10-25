import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STAGES } from '../constants/stages'
import { hallStore } from '../hall/hallStore'
import { createInitialState } from '../logic/gameMachine'
import { gameStore } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { placeStore } from '../places/placeStore'
import { goToClass, goToPlace } from './travel'
import { todoStore } from './todoStore'

beforeEach(() => {
  gameStore.setState(createInitialState(STAGES, null))
  placeStore.setState({ place: 'class', from: 'class', trip: null })
  pauseStore.getState().pause()
  todoStore.getState().openList()
})

describe('"Go there"', () => {
  it('in a classroom goes straight into the other class', () => {
    goToClass(6)
    expect(gameStore.getState().stageIndex).toBe(6)
  })

  it('in the corridor asks her to walk to the door of that class', () => {
    placeStore.setState({ place: 'hall' })
    const walk = vi.fn()
    const stop = hallStore.subscribe((s) => s.walkTo && walk(s.walkTo.index))
    goToClass(8)
    stop()
    expect(walk).toHaveBeenCalledWith(8)
  })

  it.each(['yard', 'library'] as const)('in the %s steps through the nearest door and comes out in that class', (place) => {
    placeStore.setState({ place })
    goToClass(4)
    expect(placeStore.getState().trip).toEqual({ from: place, to: 'class', stage: 4 })
  })

  it.each(['yard', 'library'] as const)('goes to the %s through a door, from anywhere', (to) => {
    goToPlace(to)
    expect(placeStore.getState().trip).toEqual({ from: 'class', to })
  })

  it('closes the list and lets the game go on, whichever way she goes', () => {
    goToClass(2)
    expect(todoStore.getState().open).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
    pauseStore.getState().pause()
    todoStore.getState().openList()
    goToPlace('yard')
    expect(todoStore.getState().open).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
  })
})
