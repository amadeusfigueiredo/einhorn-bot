import { describe, expect, it } from 'vitest'
import { createHallStore, hallStore } from './hallStore'

describe('the corridor store: the request to walk to a door', () => {
  it('starts with no request', () => {
    expect(createHallStore().getState().walkTo).toBeNull()
  })

  it('asks her to walk to the door of a class (0-based)', () => {
    const store = createHallStore()
    store.getState().goTo(6)
    expect(store.getState().walkTo).toMatchObject({ index: 6 })
  })

  it('asking again for the same class is a new request, so she walks again (each has its own key)', () => {
    const store = createHallStore()
    store.getState().goTo(3)
    const first = store.getState().walkTo!
    store.getState().goTo(3)
    const second = store.getState().walkTo!
    expect(second.index).toBe(first.index)
    expect(second.key).not.toBe(first.key)
  })

  it('is one corridor for the whole game', () => {
    expect(hallStore).toBe(hallStore)
    hallStore.getState().goTo(1)
    expect(hallStore.getState().walkTo?.index).toBe(1)
  })
})
