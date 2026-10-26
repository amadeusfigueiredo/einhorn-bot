import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'
import type { Dancing } from '../moves/moveStore'
import type { PlaceId } from '../places/placeModel'
import { STAGES } from '../constants/stages'
import { questionIds } from '../logic/classProgress'
import { watchGame } from './watchGame'

function setup() {
  const game = createStore<{ stageIndex: number; solved: ReadonlySet<string>; answered: ReadonlySet<string> }>(() => ({ stageIndex: 0, solved: new Set(), answered: new Set() }))
  const moves = createStore<{ current: Dancing | null }>(() => ({ current: null }))
  const places = createStore<{ place: PlaceId }>(() => ({ place: 'class' }))
  const earn = vi.fn()
  const stop = watchGame({ game, moves, places }, earn)
  return { game, moves, places, earn, stop }
}

const ids = (stage: number) => questionIds(STAGES[stage])

describe('watching the game for stickers', () => {
  it('a right answer is one more name among the solved ones', () => {
    const { game, earn } = setup()
    game.setState({ solved: new Set([ids(0)[0]]) })
    expect(earn).toHaveBeenCalledExactlyOnceWith('answer')
    game.setState({ solved: new Set(ids(0).slice(0, 2)) })
    expect(earn).toHaveBeenCalledTimes(2)
  })

  it('the answer that finishes a class is an answer and a class finished', () => {
    const { game, earn } = setup()
    game.setState({ solved: new Set(ids(0).slice(0, -1)) })
    earn.mockClear()
    game.setState({ solved: new Set(ids(0)) })
    expect(earn.mock.calls.map((c) => c[0])).toEqual(['answer', 'stage'])
  })

  it('a class finished is told once per class, in any order: class 5 first, then class 2', () => {
    const { game, earn } = setup()
    game.setState({ solved: new Set(ids(4)) })
    expect(earn.mock.calls.filter((c) => c[0] === 'stage')).toHaveLength(1)
    game.setState({ solved: new Set([...ids(4), ...ids(1)]) })
    expect(earn.mock.calls.filter((c) => c[0] === 'stage')).toHaveLength(2)
  })

  it('an answer that does not finish a class is not a class finished', () => {
    const { game, earn } = setup()
    game.setState({ solved: new Set([ids(3)[0], ids(8)[0]]) })
    expect(earn.mock.calls.map((c) => c[0])).toEqual(['answer'])
  })

  it('going into another class, or jumping, solves nothing: no answer, no class finished', () => {
    const { game, earn } = setup()
    game.setState({ stageIndex: 5 })
    game.setState({ stageIndex: 0 })
    expect(earn).not.toHaveBeenCalled()
  })

  it('going into a finished class from the corridor is not an answer, though everything there counts as answered', () => {
    const { game, earn } = setup()
    game.setState({ solved: new Set(ids(1)), stageIndex: 4 })
    earn.mockClear()
    // into class 2 (finished): the class changes, nothing is solved, all its questions show as answered
    game.setState({ stageIndex: 1, answered: new Set(ids(1)) })
    // and back to a class she is still doing
    game.setState({ stageIndex: 4, answered: new Set() })
    expect(earn).not.toHaveBeenCalled()
  })

  it('each new dance is a move, named by who did it', () => {
    const { moves, earn } = setup()
    moves.setState({ current: { hero: 'unicorn', id: 'bow', key: 1 } })
    expect(earn).toHaveBeenCalledExactlyOnceWith('move', 'unicorn:bow')
    moves.setState({ current: null })
    expect(earn).toHaveBeenCalledTimes(1)
    moves.setState({ current: { hero: 'amara', id: 'twirl', key: 2 } })
    expect(earn).toHaveBeenLastCalledWith('move', 'amara:twirl')
  })

  it('the same move going on (another change of the store) is not a new move', () => {
    const { moves, earn } = setup()
    moves.setState({ current: { hero: 'amara', id: 'twirl', key: 1 } })
    moves.setState({ current: { hero: 'amara', id: 'twirl', key: 1 } })
    expect(earn).toHaveBeenCalledTimes(1)
  })

  it('walking into the yard and the library is a visit; the classroom is not', () => {
    const { places, earn } = setup()
    places.setState({ place: 'yard' })
    expect(earn).toHaveBeenLastCalledWith('visitYard')
    places.setState({ place: 'class' })
    expect(earn).toHaveBeenCalledTimes(1)
    places.setState({ place: 'library' })
    expect(earn).toHaveBeenLastCalledWith('visitLibrary')
    expect(earn).toHaveBeenCalledTimes(2)
  })

  it('another change while she stays where she is is not a visit', () => {
    const { places, earn } = setup()
    places.setState({ place: 'yard' })
    places.setState({ place: 'yard' })
    expect(earn).toHaveBeenCalledTimes(1)
  })

  it('stops listening when told to', () => {
    const { game, places, moves, earn, stop } = setup()
    stop()
    game.setState({ stageIndex: 1 })
    places.setState({ place: 'yard' })
    moves.setState({ current: { hero: 'amara', id: 'twirl', key: 1 } })
    expect(earn).not.toHaveBeenCalled()
  })
})
