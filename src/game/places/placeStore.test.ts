import { afterEach, describe, expect, it } from 'vitest'
import { createPlaceStore, isTravelling, placeStore } from './placeStore'

afterEach(() => placeStore.setState({ place: 'class', from: 'class', trip: null }))

describe('place store', () => {
  it('starts in the classroom, on no trip', () => {
    const s = createPlaceStore().getState()
    expect(s.place).toBe('class')
    expect(s.trip).toBeNull()
    expect(s.from).toBe('class')
  })

  it('a door starts a trip; she is still in the old place until the film cuts', () => {
    const s = createPlaceStore()
    expect(s.getState().go('yard')).toBe(true)
    expect(s.getState().trip).toEqual({ from: 'class', to: 'yard' })
    expect(s.getState().place).toBe('class')
  })

  it('the cut puts her in the new place and remembers where she came from; the end of the film clears the trip', () => {
    const s = createPlaceStore()
    s.getState().go('yard')
    s.getState().arrive()
    expect(s.getState().place).toBe('yard')
    expect(s.getState().from).toBe('class')
    expect(s.getState().trip).not.toBeNull()
    s.getState().finish()
    expect(s.getState().trip).toBeNull()
  })

  it('there is no door where there is none: nothing happens', () => {
    const s = createPlaceStore()
    expect(s.getState().go('library')).toBe(false)
    expect(s.getState().go('class')).toBe(false)
    expect(s.getState().trip).toBeNull()
  })

  it('a second door while she is on her way does nothing', () => {
    const s = createPlaceStore()
    s.getState().go('yard')
    expect(s.getState().go('yard')).toBe(false)
    expect(s.getState().trip).toEqual({ from: 'class', to: 'yard' })
  })

  it('the whole round: class, yard, library, yard, class', () => {
    const s = createPlaceStore()
    const go = (to: 'class' | 'yard' | 'library') => {
      expect(s.getState().go(to), to).toBe(true)
      s.getState().arrive()
      s.getState().finish()
    }
    go('yard')
    expect(s.getState().from).toBe('class')
    go('library')
    expect(s.getState().from).toBe('yard')
    go('yard')
    expect(s.getState().from).toBe('library')
    go('class')
    expect(s.getState().place).toBe('class')
    expect(s.getState().from).toBe('yard')
  })

  it('arriving or finishing with no trip changes nothing', () => {
    const s = createPlaceStore()
    s.getState().arrive()
    s.getState().finish()
    expect(s.getState()).toMatchObject({ place: 'class', trip: null })
  })

  it('arriving twice (the cut and then a skip) is the same as once', () => {
    const s = createPlaceStore()
    s.getState().go('yard')
    s.getState().arrive()
    s.getState().arrive()
    expect(s.getState().place).toBe('yard')
    expect(s.getState().from).toBe('class')
  })

  it('the loops ask isTravelling()', () => {
    expect(isTravelling()).toBe(false)
    placeStore.getState().go('yard')
    expect(isTravelling()).toBe(true)
    placeStore.getState().finish()
    expect(isTravelling()).toBe(false)
  })
})

describe('jump: through the nearest door to a place with no door from here', () => {
  it('starts the walk through a door, like go, to any place', () => {
    const s = createPlaceStore()
    expect(s.getState().jump('library')).toBe(true)
    expect(s.getState().trip).toEqual({ from: 'class', to: 'library' })
    // (go would not have allowed that: the library is not next to the classroom)
    expect(createPlaceStore().getState().go('library')).toBe(false)
  })

  it('says which class she goes into when it is one', () => {
    const s = createPlaceStore()
    s.setState({ place: 'yard' })
    expect(s.getState().jump('class', 6)).toBe(true)
    expect(s.getState().trip).toEqual({ from: 'yard', to: 'class', stage: 6 })
  })

  it('does nothing when she is on her way already, or already there', () => {
    const s = createPlaceStore()
    s.setState({ place: 'yard', trip: { from: 'yard', to: 'library' } })
    expect(s.getState().jump('hall')).toBe(false)
    s.setState({ trip: null })
    expect(s.getState().jump('yard')).toBe(false)
    expect(s.getState().trip).toBeNull()
  })

  it('arrives on the other side as with any door', () => {
    const s = createPlaceStore()
    s.getState().jump('library')
    s.getState().arrive()
    expect(s.getState()).toMatchObject({ place: 'library', from: 'class' })
    s.getState().finish()
    expect(s.getState().trip).toBeNull()
  })
})
