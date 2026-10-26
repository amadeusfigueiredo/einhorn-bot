import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { pauseStore } from '../pause/pauseStore'
import { profileStore } from '../player/playerName'
import { startStore } from '../start/startStore'
import { placeStore } from './placeStore'
import { worldRunning } from './worldRunning'

beforeEach(() => {
  pauseStore.getState().resume()
  startStore.getState().close()
  profileStore.setState({ modalOpen: false })
  placeStore.setState({ trip: null })
})

afterEach(() => {
  pauseStore.getState().resume()
  startStore.getState().close()
  profileStore.setState({ modalOpen: false })
  placeStore.setState({ place: 'class', from: 'class', trip: null })
})

describe('worldRunning', () => {
  it('is true when nothing stops the world', () => {
    expect(worldRunning()).toBe(true)
  })

  it('is false while paused', () => {
    pauseStore.getState().pause()
    expect(worldRunning()).toBe(false)
  })

  it('is false while a door is opening (a trip)', () => {
    placeStore.setState({ trip: { from: 'yard', to: 'class' } })
    expect(worldRunning()).toBe(false)
  })

  it('is false while the start menu is up', () => {
    startStore.getState().open()
    expect(worldRunning()).toBe(false)
  })

  it('is false while her name is asked', () => {
    profileStore.setState({ modalOpen: true })
    expect(worldRunning()).toBe(false)
  })
})
