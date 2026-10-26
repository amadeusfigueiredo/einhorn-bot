/** A bag of the moves not done yet: all of them are done before one comes round again. */
export type MoveBag<Id extends string = string> = { left: readonly Id[]; last: Id | null }

export function newBagOf<Id extends string>(ids: readonly Id[]): MoveBag<Id> {
  return { left: ids, last: null }
}

/**
 * Draws the next move at random from the bag (`random` gives 0 up to but not including 1). When the bag runs dry it
 * is filled again from `ids`, and the move done last is not the first of the new round.
 */
export function drawFrom<Id extends string>(ids: readonly Id[], bag: MoveBag<Id>, random: () => number): { id: Id; bag: MoveBag<Id> } {
  let left = bag.left.length ? bag.left : ids
  if (bag.last && left.length === ids.length) left = left.filter((id) => id !== bag.last)
  const index = Math.min(left.length - 1, Math.floor(random() * left.length))
  const id = left[index]
  const rest = left.filter((_, i) => i !== index)
  // Putting back the one set aside: it is in the next round's bag again.
  const next = bag.left.length ? rest : [...rest, ...(bag.last ? [bag.last] : [])]
  return { id, bag: { left: next, last: id } }
}
