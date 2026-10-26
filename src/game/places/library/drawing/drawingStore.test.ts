import { describe, expect, it, vi } from 'vitest'
import type { StorageLike } from '../../../utils/progressStorage'
import { isBusy } from '../../placeBusy'
import { COLOURS, MAX_STROKES, PAPER } from './drawingModel'
import { DRAWING_STORAGE_KEY, UNDO_STEPS, createDrawingStore, drawingStore, isDrawingOpen } from './drawingStore'

function memory(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] }
}
function setup(storage: StorageLike | null = memory()) {
  const earn = vi.fn()
  const store = createDrawingStore({ storage, earn })
  return { store, earn, storage }
}
const RED = COLOURS[0].color
const BLUE = COLOURS[4].color

/** One stroke: down, a move, up. */
function draw(store: ReturnType<typeof setup>['store'], color = RED, width = 0.01) {
  store.getState().begin(color, width, 0.2, 0.2)
  store.getState().move(0.5, 0.5)
  store.getState().end()
}

describe('the drawing board', () => {
  it('opens and closes, and has the room while it is open', () => {
    const { store } = setup()
    expect(store.getState().open).toBe(false)
    store.getState().openBoard()
    expect(store.getState().open).toBe(true)
    store.getState().close()
    expect(store.getState().open).toBe(false)
  })

  it('opening it asks for the whole picture to be painted again', () => {
    const { store } = setup()
    const before = store.getState().revision
    store.getState().openBoard()
    expect(store.getState().revision).toBe(before + 1)
  })

  it('is one of the things that keep her from walking about while it is open', () => {
    drawingStore.getState().openBoard()
    expect(isDrawingOpen()).toBe(true)
    expect(isBusy()).toBe(true)
    drawingStore.getState().close()
    expect(isDrawingOpen()).toBe(false)
    expect(isBusy()).toBe(false)
  })
})

describe('drawing', () => {
  it('a stroke is a pen down, a move and a pen up', () => {
    const { store } = setup()
    store.getState().begin(RED, 0.01, 0.2, 0.2)
    expect(store.getState().drawing).toBe(true)
    expect(store.getState().strokes).toHaveLength(1)
    store.getState().move(0.5, 0.5)
    store.getState().move(0.6, 0.5)
    store.getState().end()
    expect(store.getState().drawing).toBe(false)
    expect(store.getState().strokes[0].points).toEqual([[0.2, 0.2], [0.5, 0.5], [0.6, 0.5]])
    expect(store.getState().strokes[0].color).toBe(RED)
  })

  it('a pen that is not down draws nothing, and a second pen down at once is not another stroke', () => {
    const { store } = setup()
    store.getState().move(0.5, 0.5)
    store.getState().end()
    expect(store.getState().strokes).toHaveLength(0)
    store.getState().begin(RED, 0.01, 0.1, 0.1)
    store.getState().begin(BLUE, 0.01, 0.9, 0.9)
    expect(store.getState().strokes).toHaveLength(1)
  })

  it('does not take a move too small to see', () => {
    const { store } = setup()
    store.getState().begin(RED, 0.01, 0.5, 0.5)
    const before = store.getState().strokes
    store.getState().move(0.5001, 0.5)
    expect(store.getState().strokes).toBe(before)
  })

  it('closing the board with the pen still down finishes the stroke', () => {
    const { store, storage } = setup()
    store.getState().openBoard()
    store.getState().begin(RED, 0.01, 0.1, 0.1)
    store.getState().close()
    expect(store.getState().drawing).toBe(false)
    expect(JSON.parse(storage!.getItem(DRAWING_STORAGE_KEY)!)).toHaveLength(1)
  })

  it('has no room for another stroke when the paper is full', () => {
    const { store } = setup()
    for (let i = 0; i < MAX_STROKES; i++) draw(store)
    expect(store.getState().strokes).toHaveLength(MAX_STROKES)
    store.getState().begin(RED, 0.01, 0.5, 0.5)
    expect(store.getState().drawing).toBe(false)
    expect(store.getState().strokes).toHaveLength(MAX_STROKES)
  })
})

describe('undo and clear', () => {
  it('undo takes off the last stroke, again and again, and a clear can be undone too', () => {
    const { store } = setup()
    draw(store, RED)
    draw(store, BLUE)
    store.getState().undo()
    expect(store.getState().strokes.map((s) => s.color)).toEqual([RED])
    store.getState().undo()
    expect(store.getState().strokes).toHaveLength(0)
    store.getState().undo()
    expect(store.getState().strokes).toHaveLength(0)
    draw(store, RED)
    draw(store, BLUE)
    store.getState().clear()
    expect(store.getState().strokes).toHaveLength(0)
    store.getState().undo()
    expect(store.getState().strokes.map((s) => s.color)).toEqual([RED, BLUE])
  })

  it('both ask for the picture to be painted anew', () => {
    const { store } = setup()
    draw(store)
    const r = store.getState().revision
    store.getState().undo()
    expect(store.getState().revision).toBe(r + 1)
    draw(store)
    store.getState().clear()
    expect(store.getState().revision).toBe(r + 2)
  })

  it('remembers only so many steps', () => {
    const { store } = setup()
    for (let i = 0; i < UNDO_STEPS + 10; i++) draw(store)
    for (let i = 0; i < UNDO_STEPS + 10; i++) store.getState().undo()
    expect(store.getState().strokes).toHaveLength(10)
  })

  it('do nothing on an empty paper, or while the pen is down', () => {
    const { store } = setup()
    store.getState().clear()
    expect(store.getState().past).toHaveLength(0)
    store.getState().begin(RED, 0.01, 0.5, 0.5)
    store.getState().undo()
    store.getState().clear()
    expect(store.getState().strokes).toHaveLength(1)
  })
})

describe('the stickers', () => {
  it('every stroke is drawing, and a colour used is painting with that colour', () => {
    const { store, earn } = setup()
    draw(store, RED)
    expect(earn).toHaveBeenCalledWith('draw')
    expect(earn).toHaveBeenCalledWith('paint', RED)
    draw(store, BLUE)
    expect(earn.mock.calls.filter(([type]) => type === 'draw')).toHaveLength(2)
    expect(earn).toHaveBeenCalledWith('paint', BLUE)
  })

  it('wiping out with the eraser is drawing but not painting', () => {
    const { store, earn } = setup()
    draw(store, PAPER)
    expect(earn).toHaveBeenCalledWith('draw')
    expect(earn.mock.calls.some(([type]) => type === 'paint')).toBe(false)
  })
})

describe('keeping the picture', () => {
  it('writes it down after each stroke, undo and clear, and a new store on the same storage has it', () => {
    const storage = memory()
    const { store } = setup(storage)
    draw(store, RED)
    draw(store, BLUE)
    expect(createDrawingStore({ storage, earn: vi.fn() }).getState().strokes).toHaveLength(2)
    store.getState().undo()
    expect(createDrawingStore({ storage, earn: vi.fn() }).getState().strokes).toHaveLength(1)
    store.getState().clear()
    expect(createDrawingStore({ storage, earn: vi.fn() }).getState().strokes).toHaveLength(0)
  })

  it('starts empty when what was saved is rubbish or cannot be read, and goes on when it cannot be written', () => {
    for (const bad of ['not json', '{"a":1}', 'null']) expect(createDrawingStore({ storage: memory({ [DRAWING_STORAGE_KEY]: bad }), earn: vi.fn() }).getState().strokes, bad).toEqual([])
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('no')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {},
    }
    const { store } = setup(broken)
    draw(store)
    expect(store.getState().strokes).toHaveLength(1)
    expect(setup(null).store.getState().strokes).toEqual([])
  })
})
