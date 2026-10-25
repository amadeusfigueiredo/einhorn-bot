import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'
import { watchPractice, type WatchedGame } from './watchPractice'

const start = { stageIndex: 2, answered: new Set<string>(), popup: null as null | { id: 'WIN' | 'TRY_AGAIN' | 'GAME_END'; token: number } }

function setup() {
  const game = createStore(() => ({ ...start })) as unknown as WatchedGame & { setState: (s: Partial<typeof start>) => void }
  const answer = vi.fn()
  const stop = watchPractice(game, answer)
  return { game, answer, stop }
}

describe('watching the answers', () => {
  it('a name more in the list of answered is a right answer in that class', () => {
    const { game, answer } = setup()
    game.setState({ answered: new Set(['a']) })
    expect(answer).toHaveBeenCalledWith(2, 'right')
    game.setState({ answered: new Set(['a', 'b']) })
    expect(answer).toHaveBeenCalledTimes(2)
  })

  it('a new "try again" popup is a wrong answer, once for each', () => {
    const { game, answer } = setup()
    game.setState({ popup: { id: 'TRY_AGAIN', token: 1 } })
    expect(answer).toHaveBeenCalledWith(2, 'wrong')
    game.setState({ popup: { id: 'TRY_AGAIN', token: 1 } })
    expect(answer).toHaveBeenCalledTimes(1)
    game.setState({ popup: { id: 'TRY_AGAIN', token: 2 } })
    expect(answer).toHaveBeenCalledTimes(2)
  })

  it('a win popup, a change of class and a shorter list (a restart) count for nothing', () => {
    const { game, answer } = setup()
    game.setState({ popup: { id: 'WIN', token: 1 } })
    game.setState({ stageIndex: 3, answered: new Set(['x', 'y']) })
    game.setState({ answered: new Set() })
    expect(answer).not.toHaveBeenCalled()
  })

  it('stops when told to', () => {
    const { game, answer, stop } = setup()
    stop()
    game.setState({ answered: new Set(['a']) })
    expect(answer).not.toHaveBeenCalled()
  })
})
