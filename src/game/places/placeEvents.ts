import type { DialogEffect } from './data/hangouts'

/** What a talk makes happen in the room (a hop with confetti, a hug with hearts, a pass of the ball, a glowing book). */
export type PlaceEffect = DialogEffect

type Listener = (effect: PlaceEffect, book?: number) => void
const listeners = new Set<Listener>()

/** The talk (page elements) tells the room (the picture) what its choice did. */
export function emitPlaceEffect(effect: PlaceEffect, book?: number): void {
  for (const listener of [...listeners]) listener(effect, book)
}

/** The room listens for them while it is there. Returns how to stop listening. */
export function onPlaceEffect(listener: Listener): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
