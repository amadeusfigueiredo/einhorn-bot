/**
 * The maths of the xylophone's way of learning, for any activity whose play is a row of things done one after the other
 * (bars struck, steps danced, moves of a kata, commands to a robot): a tune she records, a lesson in which the next step
 * glows. Pure, so a test can play a whole activity; nothing here knows what an "event" is (a bar, a step) except that two
 * of them can be the same.
 */

/** One thing done, and when (seconds from the first thing of the take). */
export type Moment<E> = { event: E; at: number }

/** What she did, in order: the first at 0. */
export type Take<E> = readonly Moment<E>[]

/** How much of a take is kept, and how little is not a creation at all. */
export type TakeRules = { maxEvents: number; maxSeconds: number; minEvents: number }

/** Adds an event done `at` seconds after the first one (the first is at 0). A full take is left as it is. */
export function addToTake<E>(take: Take<E>, event: E, at: number, rules: TakeRules): Take<E> {
  if (take.length >= rules.maxEvents || at > rules.maxSeconds) return take
  return [...take, { event, at: take.length === 0 ? 0 : at }]
}

/** How long a take lasts, from its first event to its last (0 for none or one). */
export function takeLength<E>(take: Take<E>): number {
  return take.length ? take[take.length - 1].at : 0
}

/** Is it long enough to be a creation of her own? */
export function isCreation<E>(take: Take<E>, rules: TakeRules): boolean {
  return take.length >= rules.minEvents
}

/** Where she is in a lesson she does along with the glow: the steps, and which one comes next. */
export type Guide<E> = { steps: readonly E[]; position: number }

export function startGuide<E>(steps: readonly E[]): Guide<E> {
  return { steps, position: 0 }
}

/** The step to do now, or undefined when the lesson is done. */
export function expected<E>(g: Guide<E>): E | undefined {
  return g.steps[g.position]
}

/**
 * She does something: the right step moves the lesson on, a wrong one does not (and does not hurt: it only sounds).
 * `done` when the lesson is over.
 */
export function guideStrike<E>(g: Guide<E>, event: E, same: (a: E, b: E) => boolean = Object.is): { guide: Guide<E>; right: boolean; done: boolean } {
  const next = expected(g)
  if (next === undefined || !same(next, event)) return { guide: g, right: false, done: false }
  const guide = { steps: g.steps, position: g.position + 1 }
  return { guide, right: true, done: guide.position >= g.steps.length }
}

/** How far she is through a lesson, 0 to 1 (a bar of progress under the glow). */
export function progressOf<E>(g: Guide<E>): number {
  return g.steps.length === 0 ? 1 : g.position / g.steps.length
}
