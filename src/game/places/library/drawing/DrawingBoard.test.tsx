// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from '../../../../test/ui'
import { playSfx } from '../../../audio/sfx'
import { DrawingBoard, PAPER_WIDTH } from './DrawingBoard'
import { COLOURS, MAX_STROKES, PAPER } from './drawingModel'
import { drawingStore } from './drawingStore'

vi.mock('../../../audio/sfx', () => ({ playSfx: vi.fn() }))
vi.mock('../../../stickers/stickerStore', () => ({ earnSticker: vi.fn() }))

cleanupAfterEach()

type Call = { name: string; args: unknown[] }
let calls: Call[] = []
let fills: unknown[] = []
const sizes: { observed: Element[]; callbacks: (() => void)[]; disconnected: number } = { observed: [], callbacks: [], disconnected: 0 }

beforeEach(() => {
  calls = []
  fills = []
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, name: string) => (...args: unknown[]) => void calls.push({ name, args }),
    set: (_t, name: string, value: unknown) => {
      if (name === 'strokeStyle') fills.push(value)
      return true
    },
  })
  HTMLCanvasElement.prototype.getContext = (() => ctx) as never
  HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 10, top: 20, width: 960, height: 640, right: 970, bottom: 660, x: 10, y: 20, toJSON: () => ({}) })
  vi.mocked(playSfx).mockClear()
  drawingStore.setState({ open: false, strokes: [], past: [], drawing: false, revision: 0 })
})
afterEach(() => {
  drawingStore.getState().close()
  vi.unstubAllGlobals()
})

const paper = () => screen.getByRole('img', { name: 'The paper to draw on' })
/** A pen on the paper: pointer events at a fraction of it (the paper's box is 960 x 640 at 10, 20). */
const pointer = (type: 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel', fx: number, fy: number, extra: Record<string, unknown> = {}) =>
  fireEvent[type](paper(), { clientX: 10 + 960 * fx, clientY: 20 + 640 * fy, pointerId: 1, pointerType: 'touch', ...extra })
const stroke = (points: [number, number][]) => {
  pointer('pointerDown', ...points[0])
  for (const p of points.slice(1)) pointer('pointerMove', ...p)
  pointer('pointerUp', ...points[points.length - 1])
}
const open = () => act(() => drawingStore.getState().openBoard())

describe('the drawing board', () => {
  it('shows nothing while it is closed', () => {
    renderUI(<DrawingBoard />, 'en')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is a dialog with a paper, ten paints, three brushes and the buttons, with the first paint under the cursor', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    expect(screen.getByRole('dialog', { name: 'Drawing board' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Colours' }).querySelectorAll('button')).toHaveLength(COLOURS.length)
    expect(screen.getByRole('group', { name: 'Brush' }).querySelectorAll('button')).toHaveLength(3)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Red' }))
    expect(screen.getByText('Draw with your finger or the mouse.')).toBeTruthy()
  })

  it('paints the picture so far on the paper when it opens', () => {
    drawingStore.setState({ strokes: [{ color: COLOURS[0].color, width: 0.01, points: [[0.1, 0.1], [0.5, 0.5]] }] })
    renderUI(<DrawingBoard />, 'en')
    open()
    expect(calls[0]).toEqual({ name: 'fillRect', args: [0, 0, PAPER_WIDTH, PAPER_WIDTH * (2 / 3)] })
    expect(calls.some((c) => c.name === 'stroke')).toBe(true)
  })

  it('"×" closes it, and so does Escape', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Close the drawing board' }))
    expect(drawingStore.getState().open).toBe(false)
    open()
    // (The pause keys give way to an open board, and the key press is marked as handled.)
    const notPrevented = fireEvent.keyDown(window, { key: 'Escape' })
    expect(drawingStore.getState().open).toBe(false)
    expect(notPrevented).toBe(false)
  })

  it('other keys do nothing here, and Escape in a text field is left alone', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: 'Escape', repeat: true })
    fireEvent.keyDown(window, { key: 'Escape', ctrlKey: true })
    const field = document.createElement('input')
    document.body.append(field)
    fireEvent.keyDown(field, { key: 'Escape' })
    field.remove()
    expect(drawingStore.getState().open).toBe(true)
  })
})

describe('drawing on it', () => {
  it('a stroke with the pen puts a line in the picture and paints it as it goes', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    calls = []
    stroke([[0.1, 0.1], [0.3, 0.4], [0.5, 0.5]])
    const { strokes } = drawingStore.getState()
    expect(strokes).toHaveLength(1)
    expect(strokes[0].points).toEqual([[0.1, 0.1], [0.3, 0.4], [0.5, 0.5]])
    expect(calls.filter((c) => c.name === 'stroke').length).toBeGreaterThanOrEqual(2)
    expect(drawingStore.getState().drawing).toBe(false)
  })

  it('a tap is a dot', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    calls = []
    pointer('pointerDown', 0.5, 0.5)
    pointer('pointerUp', 0.5, 0.5)
    expect(drawingStore.getState().strokes[0].points).toEqual([[0.5, 0.5]])
    expect(calls.some((c) => c.name === 'arc')).toBe(true)
  })

  it('uses the paint and the brush she chose', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Pink' }))
    fireEvent.click(screen.getByRole('button', { name: 'Thick' }))
    expect(screen.getByRole('button', { name: 'Pink' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Thick' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Red' }).getAttribute('aria-pressed')).toBe('false')
    stroke([[0.1, 0.1], [0.4, 0.4]])
    expect(drawingStore.getState().strokes[0]).toMatchObject({ color: COLOURS.find((c) => c.id === 'pink')!.color, width: 0.04 })
    fireEvent.click(screen.getByRole('button', { name: 'Eraser' }))
    stroke([[0.2, 0.2], [0.3, 0.3]])
    expect(drawingStore.getState().strokes[1].color).toBe(PAPER)
  })

  it('starts with a green medium brush', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    stroke([[0.1, 0.1], [0.4, 0.4]])
    expect(drawingStore.getState().strokes[0]).toMatchObject({ color: COLOURS.find((c) => c.id === 'green')!.color, width: 0.016 })
  })

  it('ignores the right mouse button, a second finger and the lift of a finger that is not drawing', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    pointer('pointerDown', 0.1, 0.1, { pointerType: 'mouse', button: 2 })
    expect(drawingStore.getState().strokes).toHaveLength(0)
    pointer('pointerDown', 0.1, 0.1, { pointerId: 1 })
    pointer('pointerDown', 0.9, 0.9, { pointerId: 2 })
    pointer('pointerMove', 0.5, 0.5, { pointerId: 2 })
    pointer('pointerUp', 0.5, 0.5, { pointerId: 2 })
    expect(drawingStore.getState().drawing).toBe(true)
    expect(drawingStore.getState().strokes).toHaveLength(1)
    pointer('pointerCancel', 0.5, 0.5, { pointerId: 1 })
    expect(drawingStore.getState().drawing).toBe(false)
    pointer('pointerMove', 0.5, 0.5)
    pointer('pointerUp', 0.5, 0.5)
    expect(drawingStore.getState().strokes).toHaveLength(1)
  })

  it('draws with the left mouse button', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    pointer('pointerDown', 0.1, 0.1, { pointerType: 'mouse', button: 0 })
    pointer('pointerUp', 0.1, 0.1, { pointerType: 'mouse', button: 0 })
    expect(drawingStore.getState().strokes).toHaveLength(1)
  })

  it('takes the pointer for itself (so a finger that leaves the paper keeps drawing)', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    const capture = vi.fn()
    ;(paper() as unknown as { setPointerCapture: typeof capture }).setPointerCapture = capture
    pointer('pointerDown', 0.1, 0.1)
    expect(capture).toHaveBeenCalledWith(1)
    pointer('pointerUp', 0.1, 0.1)
  })

  it('says so when the paper is full, and draws no more', () => {
    drawingStore.setState({ strokes: Array.from({ length: MAX_STROKES }, () => ({ color: COLOURS[0].color, width: 0.01, points: [[0.1, 0.1]] as const })) })
    renderUI(<DrawingBoard />, 'en')
    open()
    expect(screen.getByText('The paper is full. Clear it to go on drawing.')).toBeTruthy()
    pointer('pointerDown', 0.5, 0.5)
    expect(drawingStore.getState().drawing).toBe(false)
  })
})

describe('undo, clear and save', () => {
  it('undo is there once something is drawn, takes off the last stroke and paints the picture anew', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    const undo = screen.getByRole('button', { name: /Undo/ }) as HTMLButtonElement
    expect(undo.disabled).toBe(true)
    stroke([[0.1, 0.1], [0.4, 0.4]])
    stroke([[0.2, 0.2], [0.5, 0.5]])
    expect(undo.disabled).toBe(false)
    calls = []
    fireEvent.click(undo)
    expect(drawingStore.getState().strokes).toHaveLength(1)
    expect(calls[0].name).toBe('fillRect')
  })

  it('clear wipes the paper with a pop, and can be undone', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    const clear = screen.getByRole('button', { name: /Clear/ }) as HTMLButtonElement
    expect(clear.disabled).toBe(true)
    stroke([[0.1, 0.1], [0.4, 0.4]])
    fireEvent.click(clear)
    expect(drawingStore.getState().strokes).toHaveLength(0)
    expect(playSfx).toHaveBeenCalledWith('pop')
    fireEvent.click(screen.getByRole('button', { name: /Undo/ }))
    expect(drawingStore.getState().strokes).toHaveLength(1)
  })

  it('save gives the picture as a file she can keep', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    const blob = new Blob(['png'], { type: 'image/png' })
    HTMLCanvasElement.prototype.toBlob = ((done: (b: Blob | null) => void) => done(blob)) as never
    const url = vi.fn(() => 'blob:picture')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: url, revokeObjectURL: revoke })
    const clicked: { href: string; download: string }[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download })
    })
    fireEvent.click(screen.getByRole('button', { name: /Save picture/ }))
    expect(url).toHaveBeenCalledWith(blob)
    expect(clicked).toEqual([{ href: 'blob:picture', download: 'my-drawing.png' }])
    expect(revoke).toHaveBeenCalledWith('blob:picture')
    click.mockRestore()
  })

  it('save does nothing when the browser gives no picture', () => {
    renderUI(<DrawingBoard />, 'en')
    open()
    HTMLCanvasElement.prototype.toBlob = ((done: (b: Blob | null) => void) => done(null)) as never
    const url = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: url, revokeObjectURL: vi.fn() })
    fireEvent.click(screen.getByRole('button', { name: /Save picture/ }))
    expect(url).not.toHaveBeenCalled()
  })
})

describe('the size of the paper', () => {
  it('is as big as the room allows, whatever its shape, and follows when the room changes', () => {
    let resize: () => void = () => {}
    class FakeObserver {
      constructor(callback: () => void) {
        resize = callback
        sizes.callbacks.push(callback)
      }
      observe(el: Element) {
        sizes.observed.push(el)
      }
      disconnect() {
        sizes.disconnected++
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver)
    let room = { w: 900, h: 300 }
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => room.w })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => room.h })
    const view = renderUI(<DrawingBoard />, 'en')
    open()
    expect(paper().style.width).toBe('450px')
    room = { w: 300, h: 900 }
    act(() => resize())
    expect(paper().style.width).toBe('300px')
    view.unmount()
    expect(sizes.disconnected).toBeGreaterThan(0)
    delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth
    delete (HTMLElement.prototype as { clientHeight?: unknown }).clientHeight
  })

  it('is left to the style sheet where the browser cannot watch it', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    renderUI(<DrawingBoard />, 'en')
    open()
    expect(paper().getAttribute('style')).toBeNull()
  })
})

describe('in other languages', () => {
  it('has German and Portuguese names for the board and the paints', () => {
    const de = renderUI(<DrawingBoard />, 'de')
    open()
    expect(screen.getByRole('dialog', { name: 'Malstaffelei' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Radiergummi' })).toBeTruthy()
    de.unmount()
    renderUI(<DrawingBoard />, 'pt')
    expect(screen.getByRole('dialog', { name: 'Cavalete de desenho' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Borracha' })).toBeTruthy()
  })
})
