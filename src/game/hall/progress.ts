/**
 * What the corridor's doors say about each class, as numbers and nothing else (no React, no storage).
 *
 * Every door is open: she can go into any class at any time, in any order. A door that is finished has a golden star;
 * the first one still to do is the suggestion, with a glow and a "New!" badge; the others are plain. (Which classes are
 * finished is worked out in `logic/classProgress.ts`; `done` here is that list, one flag for each class.) Class ids are
 * the zero-based index of the stage; the children see them as 1 … 15.
 */

/** How a door looks (see `film/sets/ThemedDoor.tsx`): `locked` is a look the doors can have but the corridor does not use any more. */
export type DoorState = 'done' | 'next' | 'locked'

/** The first class that is not finished, or null when every one is. */
export function firstTodo(done: readonly boolean[]): number | null {
  const i = done.indexOf(false)
  return i < 0 ? null : i
}

/** Done (a star), the one to do next (a glow and a badge), or nothing (a plain door, still to do). */
export function doorState(done: readonly boolean[], index: number): DoorState | undefined {
  if (done[index]) return 'done'
  return index === firstTodo(done) ? 'next' : undefined
}
