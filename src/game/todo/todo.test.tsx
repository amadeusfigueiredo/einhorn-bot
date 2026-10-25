// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen, within } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { roomFor } from '../data/classrooms'
import { WORLD_NAMES } from '../data/worlds'
import { hallStore } from '../hall/hallStore'
import { questionIds } from '../logic/classProgress'
import { createInitialState } from '../logic/gameMachine'
import { gameStore } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { placeStore } from '../places/placeStore'
import { TodoButton } from './TodoButton'
import { TodoPanel } from './TodoPanel'
import { createTodoStore, todoStore } from './todoStore'

cleanupAfterEach()
const everything = new Set(STAGES.flatMap(questionIds))
const done = (...classes: number[]) => new Set(classes.flatMap((i) => questionIds(STAGES[i])))

beforeEach(() => {
  gameStore.setState(createInitialState(STAGES, null))
  placeStore.setState({ place: 'class', from: 'class', trip: null })
  pauseStore.getState().resume()
  todoStore.getState().closeList()
})
afterEach(() => {
  pauseStore.getState().resume()
  todoStore.getState().closeList()
  gameStore.setState(createInitialState(STAGES, null))
})

describe('the list store', () => {
  it('starts closed, opens and closes', () => {
    const store = createTodoStore()
    expect(store.getState().open).toBe(false)
    store.getState().openList()
    expect(store.getState().open).toBe(true)
    store.getState().closeList()
    expect(store.getState().open).toBe(false)
  })
})

describe('TodoButton: "What is left?" in the bar', () => {
  it('says how many classes are left, and opens the list with the game waiting behind it', () => {
    renderUI(<TodoButton />, 'en')
    const button = screen.getByRole('button', { name: 'What is left?' })
    expect(button.textContent).toContain('15')
    fireEvent.click(button)
    expect(todoStore.getState().open).toBe(true)
    expect(pauseStore.getState().paused).toBe(true)
  })

  it('counts down as classes are done, and shows no count at the end', () => {
    renderUI(<TodoButton />, 'en')
    act(() => gameStore.setState({ solved: done(0, 1, 2) }))
    expect(screen.getByRole('button', { name: 'What is left?' }).textContent).toContain('12')
    act(() => gameStore.setState({ solved: everything }))
    expect(screen.getByRole('button', { name: 'What is left?' }).textContent).not.toMatch(/\d/)
  })
})

describe('TodoPanel: the classes still to do', () => {
  it('is a dialog that lists every class not finished, with its name and how many questions are answered', () => {
    gameStore.setState({ solved: new Set([...done(0, 1), STAGES[4].npcs![0].id]) })
    renderUI(<TodoPanel />, 'en')
    const dialog = screen.getByRole('dialog', { name: /Classes still to do/ })
    expect(within(dialog).getByText('13 classes still to do')).toBeTruthy()
    const items = within(dialog).getAllByRole('listitem')
    expect(items).toHaveLength(13)
    expect(items[0].textContent).toContain('3')
    expect(items[0].textContent).toContain(WORLD_NAMES[roomFor(STAGES[2].name).world].en)
    expect(items[0].textContent).toContain('0 of 4 questions')
    expect(within(dialog).getByText('1 of 4 questions')).toBeTruthy()
  })

  it('says "1 class" for the last one, and that all is done with nothing to list, with a hint about the stickers', () => {
    gameStore.setState({ solved: new Set([...everything].filter((id) => !questionIds(STAGES[6]).includes(id))) })
    const view = renderUI(<TodoPanel />, 'en')
    expect(screen.getByText('1 class still to do')).toBeTruthy()
    view.unmount()
    gameStore.setState({ solved: everything })
    renderUI(<TodoPanel />, 'en')
    expect(screen.getByText('All classes are done!')).toBeTruthy()
    expect(screen.getByText(/stickers you are still missing/)).toBeTruthy()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('in a classroom a "Go" button takes her straight into that class, and the game goes on', () => {
    gameStore.setState({ stageIndex: 0 })
    pauseStore.getState().pause()
    todoStore.getState().openList()
    renderUI(<TodoPanel />, 'en')
    fireEvent.click(screen.getAllByRole('button', { name: 'Go' })[2])
    expect(gameStore.getState().stageIndex).toBe(3)
    expect(todoStore.getState().open).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('the class she is in says "You are here" and has no Go button', () => {
    gameStore.setState({ stageIndex: 0 })
    renderUI(<TodoPanel />, 'en')
    expect(screen.getByText('You are here')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(14)
  })

  it('in the corridor "Go" asks her to walk to that door', () => {
    placeStore.setState({ place: 'hall' })
    renderUI(<TodoPanel />, 'en')
    const walk = vi.fn()
    const stop = hallStore.subscribe((s) => s.walkTo && walk(s.walkTo.index))
    fireEvent.click(screen.getAllByRole('button', { name: 'Go' })[4])
    stop()
    expect(walk).toHaveBeenCalledWith(4)
    expect(todoStore.getState().open).toBe(false)
  })

  it.each(['yard', 'library'] as const)('in the %s "Go" steps through the nearest door and comes out in that class', (place) => {
    placeStore.setState({ place, trip: null })
    renderUI(<TodoPanel />, 'en')
    fireEvent.click(screen.getAllByRole('button', { name: 'Go' })[2])
    expect(placeStore.getState().trip).toEqual({ from: place, to: 'class', stage: 2 })
    expect(todoStore.getState().open).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('puts the focus on the way back, which closes the list and goes on with the game', () => {
    pauseStore.getState().pause()
    todoStore.getState().openList()
    renderUI(<TodoPanel />, 'en')
    const back = screen.getByRole('button', { name: /Back to the game/ })
    expect(document.activeElement).toBe(back)
    fireEvent.click(back)
    expect(todoStore.getState().open).toBe(false)
    expect(pauseStore.getState().paused).toBe(false)
  })

  it.each([
    ['de', /Diese Klassen fehlen noch/],
    ['pt', /Aulas que ainda faltam/],
  ] as const)('speaks %s', (lang, title) => {
    renderUI(<TodoPanel />, lang)
    expect(screen.getByRole('dialog', { name: title })).toBeTruthy()
  })
})
