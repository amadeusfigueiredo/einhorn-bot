import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { earnSticker } from '../../../stickers/stickerStore'
import type { StickerEvent } from '../../../stickers/stickerData'
import type { StorageLike } from '../../../utils/progressStorage'
import { registerBusy } from '../../placeBusy'
import { ERASER, COLOURS, extendStroke, hasRoom, parseDrawing, pointsIn, MAX_POINTS, startStroke, type Stroke } from './drawingModel'

export const DRAWING_STORAGE_KEY = 'amaras-einhorn-schule:drawing:v1'

/** How many steps back she can undo. */
export const UNDO_STEPS = 20

export type DrawingState = {
  /** The board is open over the library (nobody walks about while it is). */
  open: boolean
  /** The picture so far (the stroke being drawn is the last of them while the pen is down). */
  strokes: readonly Stroke[]
  /** The pictures before the last changes, newest last: what undo goes back to. */
  past: readonly (readonly Stroke[])[]
  /** Is the pen down? */
  drawing: boolean
  /** Counts the changes the picture has to be painted anew for (an undo, a clear, the board opening), not the strokes. */
  revision: number
  openBoard: () => void
  close: () => void
  /** The pen comes down at (x, y) with a paint and a brush. Nothing happens when the paper is full. */
  begin: (color: string, width: number, x: number, y: number) => void
  /** The pen moves on. */
  move: (x: number, y: number) => void
  /** The pen comes up: the stroke counts. */
  end: () => void
  undo: () => void
  clear: () => void
}

export type DrawingDeps = {
  storage: StorageLike | null
  earn: (type: StickerEvent, key?: string) => void
}

function read(storage: StorageLike | null): Stroke[] {
  try {
    const raw = storage?.getItem(DRAWING_STORAGE_KEY)
    return (raw ? parseDrawing(JSON.parse(raw)) : null) ?? []
  } catch {
    return []
  }
}

/** The drawing board: the picture is kept on the device, like her stickers. */
export function createDrawingStore({ storage, earn }: DrawingDeps) {
  return createStore<DrawingState>((set, get) => {
    const keep = (strokes: readonly Stroke[]) => {
      try {
        storage?.setItem(DRAWING_STORAGE_KEY, JSON.stringify(strokes))
      } catch {
        // Remembering is a nicety; the board works without it.
      }
    }
    /** The picture changes in a way that cannot be undone by taking off the last stroke: remember it, to go back to. */
    const remember = (): readonly (readonly Stroke[])[] => [...get().past, get().strokes].slice(-UNDO_STEPS)
    return {
      open: false,
      strokes: read(storage),
      past: [],
      drawing: false,
      revision: 0,
      openBoard: () => set({ open: true, revision: get().revision + 1 }),
      close: () => {
        if (get().drawing) get().end()
        set({ open: false })
      },
      begin: (color, width, x, y) => {
        const { strokes, drawing } = get()
        if (drawing || !hasRoom(strokes)) return
        set({ past: remember(), strokes: [...strokes, startStroke(color, width, x, y)], drawing: true })
      },
      move: (x, y) => {
        const { strokes, drawing } = get()
        if (!drawing) return
        const last = strokes[strokes.length - 1]
        const next = extendStroke(last, x, y, MAX_POINTS - pointsIn(strokes))
        if (next !== last) set({ strokes: [...strokes.slice(0, -1), next] })
      },
      end: () => {
        const { strokes, drawing } = get()
        if (!drawing) return
        set({ drawing: false })
        keep(strokes)
        const last = strokes[strokes.length - 1]
        earn('draw')
        // (Wiping out with the paper's colour is not painting with it.)
        if (last.color !== COLOURS.find((c) => c.id === ERASER)!.color) earn('paint', last.color)
      },
      undo: () => {
        const { past, drawing } = get()
        if (drawing || past.length === 0) return
        const strokes = past[past.length - 1]
        set({ strokes, past: past.slice(0, -1), revision: get().revision + 1 })
        keep(strokes)
      },
      clear: () => {
        const { strokes, drawing } = get()
        if (drawing || strokes.length === 0) return
        set({ past: remember(), strokes: [], revision: get().revision + 1 })
        keep([])
      },
    }
  })
}

export const drawingStore = createDrawingStore({ storage: typeof window === 'undefined' ? null : window.localStorage, earn: earnSticker })

export function useDrawing<T>(select: (s: DrawingState) => T): T {
  return useStore(drawingStore, select)
}

/** Non-React code (the room's taps and walking) asks this. */
export function isDrawingOpen(): boolean {
  return drawingStore.getState().open
}

// The open board has the room.
registerBusy(isDrawingOpen)
