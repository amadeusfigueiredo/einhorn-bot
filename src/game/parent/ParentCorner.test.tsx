// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STAGES } from '../constants/stages'
import { doneFlags } from '../logic/classProgress'
import { createInitialState } from '../logic/gameMachine'
import { gameStore } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { profileStore } from '../player/playerName'
import { stickerStore } from '../stickers/stickerStore'
import { cleanupAfterEach, fireEvent, renderUI, screen, within } from '../../test/ui'
import ParentCorner from './ParentCorner'
import { dayKey } from './practiceModel'
import { practiceStore } from './practiceStore'

cleanupAfterEach()

beforeEach(() => {
  profileStore.setState({ name: 'Mia', skipped: false, modalOpen: false })
  gameStore.setState(createInitialState(STAGES, { stageIndex: 3, answeredIds: [] }))
  practiceStore.getState().clear()
  pauseStore.getState().pause()
})
afterEach(() => {
  pauseStore.getState().resume()
  practiceStore.getState().clear()
  gameStore.setState(createInitialState(STAGES, null))
  vi.useRealTimers()
})

/** The gate is a sum: read it and answer it. */
function pass() {
  const [a, b] = screen.getByText(/\d+ × \d+/).textContent!.split('×').map((x) => Number(x.trim()))
  fireEvent.change(screen.getByPlaceholderText('Your answer'), { target: { value: String(a * b) } })
  fireEvent.click(screen.getByRole('button', { name: 'Open' }))
}

describe('the corner for grown-ups', () => {
  it('is behind the gate, and shows nothing of the game until it is passed', () => {
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    expect(screen.getByText('Just for grown-ups')).toBeTruthy()
    expect(screen.queryByText('Progress')).toBeNull()
    pass()
    expect(screen.getByText('Corner for grown-ups')).toBeTruthy()
  })

  it('shows the name, how far she has got and the state of every class', () => {
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    expect(screen.getByText('Playing: Mia')).toBeTruthy()
    expect(screen.getByText('Classes done: 3 of 15')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Progress' }).getAttribute('value')).toBe('3')
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(STAGES.length)
    expect(within(rows[0]).getByText('Done')).toBeTruthy()
    expect(within(rows[3]).getByText('Playing now')).toBeTruthy()
    // every class is open: the ones not done are simply still to do
    expect(within(rows[4]).getByText('Still to do')).toBeTruthy()
  })

  it('says so when no name was given yet, and when every class is finished', () => {
    profileStore.setState({ name: null })
    gameStore.setState({ phase: 'ending' })
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    expect(screen.getByText('Playing: no name yet')).toBeTruthy()
    expect(screen.getByText('All 15 classes finished!')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('value')).toBe('15')
  })

  it('shows the right answers and the tries again of each class, and marks the one that was hard', () => {
    practiceStore.setState({ classes: { '0': { right: 5, wrong: 1 }, '1': { right: 1, wrong: 4 } } })
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    const rows = screen.getAllByRole('row').slice(1)
    const cells = (i: number) => within(rows[i]).getAllByRole('cell').map((c) => c.textContent)
    expect(cells(0)).toEqual(['5', '1'])
    expect(cells(1)).toEqual(['1', '4'])
    expect(cells(2)).toEqual(['–', '–'])
    expect(within(rows[1]).getAllByRole('cell')[1].className).toBe('is-hard')
    expect(within(rows[0]).getAllByRole('cell')[1].className).toBe('')
  })

  it('shows the playing time, in all and today, and the stickers', () => {
    const before = stickerStore.getState().got
    practiceStore.setState({ seconds: 4980, days: { [dayKey(new Date())]: 22 * 60 } })
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    expect(screen.getByText('In all: 1 h 23 min')).toBeTruthy()
    expect(screen.getByText('Today: 22 min')).toBeTruthy()
    expect(screen.getByText(/^\d+ of \d+ stickers$/)).toBeTruthy()
    expect(stickerStore.getState().got).toBe(before)
  })

  it('has the language and the volume, and the tip that nothing is timed or scored', () => {
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    expect(screen.getByRole('button', { name: /language/i })).toBeTruthy()
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(screen.getByText(/no timers and no scores/)).toBeTruthy()
  })

  it('starts over only after a second question, and then goes back to class 1, clears the practice and lets the game go on', () => {
    practiceStore.setState({ seconds: 600, classes: { '0': { right: 3, wrong: 0 } } })
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(doneFlags(gameStore.getState().solved, STAGES).filter(Boolean)).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'No, keep playing' }))
    expect(screen.getByRole('button', { name: 'Start over' })).toBeTruthy()
    expect(practiceStore.getState().seconds).toBe(600)
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, start over' }))
    expect(gameStore.getState().solved.size).toBe(0)
    expect(gameStore.getState().stageIndex).toBe(0)
    expect(practiceStore.getState().seconds).toBe(0)
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('"Back" leaves, from the gate and from the corner', () => {
    const onClose = vi.fn()
    const gate = renderUI(<ParentCorner onClose={onClose} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    gate.unmount()
    renderUI(<ParentCorner onClose={onClose} />, 'en')
    pass()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('starts at the top, with the title where the focus is', () => {
    renderUI(<ParentCorner onClose={() => {}} />, 'en')
    pass()
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Corner for grown-ups' }))
  })

  it('is in German and Portuguese', () => {
    const de = renderUI(<ParentCorner onClose={() => {}} />, 'de')
    expect(screen.getByText('Nur für Erwachsene')).toBeTruthy()
    de.unmount()
    renderUI(<ParentCorner onClose={() => {}} />, 'pt')
    expect(screen.getByText('Só para adultos')).toBeTruthy()
  })
})
