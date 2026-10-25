import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { canTravel, type PlaceId } from './placeModel'

/** A walk through a door. `stage` is the class she goes into when the door is one of the corridor's class doors (0-based). */
export type Trip = { from: PlaceId; to: PlaceId; stage?: number }

export type PlaceState = {
  /** Where she is now (during a walk through a door: where she was until the film cuts to the other side). */
  place: PlaceId
  /** The place she came from (she stands in front of the door she came through). */
  from: PlaceId
  /** The short film of a walk through a door is on screen. */
  trip: Trip | null
  /** Walk through a door (a class door of the corridor says which class). False when there is no such door from here, or she is already on her way. */
  go: (to: PlaceId, stage?: number) => boolean
  /**
   * The same walk through a door, to a place that has no door from here (a "Go there" of the list of what is left or of
   * a sticker's hint): she steps through the nearest door and comes out on the other side. False when she is already
   * there, or already on her way.
   */
  jump: (to: PlaceId, stage?: number) => boolean
  /** The film has cut to the other side. */
  arrive: () => void
  /** The film is over. */
  finish: () => void
}

export function createPlaceStore(): StoreApi<PlaceState> {
  return createStore<PlaceState>((set, get) => ({
    place: 'class',
    from: 'class',
    trip: null,
    go: (to, stage) => {
      const { place, trip } = get()
      if (trip || !canTravel(place, to)) return false
      set({ trip: stage === undefined ? { from: place, to } : { from: place, to, stage } })
      return true
    },
    jump: (to, stage) => {
      const { place, trip } = get()
      if (trip || (place === to && stage === undefined)) return false
      set({ trip: stage === undefined ? { from: place, to } : { from: place, to, stage } })
      return true
    },
    arrive: () => {
      const { trip } = get()
      if (trip) set({ place: trip.to, from: trip.from })
    },
    finish: () => set({ trip: null }),
  }))
}

/** The one place she is in. Not remembered: a new visit starts in the classroom. */
export const placeStore = createPlaceStore()

export function usePlace(): PlaceId {
  return useStore(placeStore, (s) => s.place)
}

export function usePlaceFrom(): PlaceId {
  return useStore(placeStore, (s) => s.from)
}

export function useTrip(): Trip | null {
  return useStore(placeStore, (s) => s.trip)
}

/** Non-React code (the game loops) asks this: the world stands still during the film of a door. */
export function isTravelling(): boolean {
  return placeStore.getState().trip !== null
}
