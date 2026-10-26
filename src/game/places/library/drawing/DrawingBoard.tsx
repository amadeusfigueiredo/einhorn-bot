import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { playSfx } from '../../../audio/sfx'
import { useT } from '../../../i18n/useT'
import { isTypingTarget } from '../../../utils/typingTarget'
import { ASPECT, BRUSHES, COLOURS, ERASER, fitPaper, hasRoom, paintDrawing, paintStroke, type Stroke } from './drawingModel'
import { drawingStore, useDrawing } from './drawingStore'

/** How many pixels wide the paper is inside (it is shown at the size the page has room for). */
export const PAPER_WIDTH = 960

/**
 * The drawing board over the library: a sheet of paper to draw on with a finger or the mouse, eight paints and an
 * eraser, three brushes, undo, clear and a button that saves the picture as a file. Page elements, not part of the
 * picture. The picture is kept on the device. Escape closes it. (Drawing itself needs a pointer: the buttons are all
 * reachable with the keyboard.)
 */
export function DrawingBoard() {
  const { t } = useT()
  const open = useDrawing((s) => s.open)
  const strokes = useDrawing((s) => s.strokes)
  const revision = useDrawing((s) => s.revision)
  const canUndo = useDrawing((s) => s.past.length > 0)
  const [paint, setPaint] = useState(COLOURS[3].color)
  const [brush, setBrush] = useState<(typeof BRUSHES)[number]['id']>('medium')
  const canvas = useRef<HTMLCanvasElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  /** How wide the paper is shown (pixels): as big as the room allows, 3 wide for 2 high. */
  const [shown, setShown] = useState<number | null>(null)
  /** The pointer that has the pen down, and how many points of the stroke have been painted. */
  const pen = useRef<{ id: number; painted: number } | null>(null)
  const full = !hasRoom(strokes)

  const context = () => canvas.current?.getContext('2d') ?? null

  // The whole picture is painted again when the board opens and after an undo or a clear (not while she draws).
  useEffect(() => {
    const g = context()
    if (open && g) paintDrawing(g, drawingStore.getState().strokes, PAPER_WIDTH)
  }, [open, revision])

  useEffect(() => {
    const box = stage.current
    if (!open || !box || typeof ResizeObserver === 'undefined') return
    const fit = () => setShown(fitPaper(box.clientWidth, box.clientHeight))
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(box)
    return () => watch.disconnect()
  }, [open])

  useEffect(() => {
    if (!open) return
    first.current?.focus({ preventScroll: true })
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      if (e.key !== 'Escape') return
      drawingStore.getState().close()
      e.preventDefault()
    }
    // In the capture phase, like the xylophone, so that Escape closes the board and does not also pause the game.
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  /** Where on the paper a pointer is, as fractions of it. */
  const place = useCallback((e: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const box = e.currentTarget.getBoundingClientRect()
    return [(e.clientX - box.left) / Math.max(1, box.width), (e.clientY - box.top) / Math.max(1, box.height)]
  }, [])

  const paintLast = (from: number) => {
    const g = context()
    const all = drawingStore.getState().strokes
    if (g && all.length > 0) paintStroke(g, all[all.length - 1], PAPER_WIDTH, from)
  }

  if (!open) return null
  const width = BRUSHES.find((b) => b.id === brush)!.width

  const down = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pen.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    const [x, y] = place(e)
    drawingStore.getState().begin(paint, width, x, y)
    if (!drawingStore.getState().drawing) return
    pen.current = { id: e.pointerId, painted: 1 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    paintLast(0)
  }
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pen.current?.id !== e.pointerId) return
    const [x, y] = place(e)
    drawingStore.getState().move(x, y)
    const all = drawingStore.getState().strokes
    const n = all[all.length - 1].points.length
    if (n > pen.current.painted) {
      paintLast(pen.current.painted - 1)
      pen.current.painted = n
    }
  }
  const up = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pen.current?.id !== e.pointerId) return
    pen.current = null
    drawingStore.getState().end()
  }

  const save = () => {
    canvas.current?.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${t('draw.fileName')}.png`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="draw-board" role="dialog" aria-label={t('draw.title')}>
      <div className="draw-board__head">
        <h2 className="draw-board__title">
          <span aria-hidden="true">🎨</span> {t('draw.title')}
        </h2>
        <button type="button" className="music-pad__close" onClick={() => drawingStore.getState().close()} aria-label={t('draw.close')}>
          ×
        </button>
      </div>
      <div ref={stage} className="draw-board__stage">
        <canvas
          ref={canvas}
          className="draw-board__paper"
          style={shown === null ? undefined : { width: shown }}
          width={PAPER_WIDTH}
          height={Math.round(PAPER_WIDTH * ASPECT)}
          role="img"
          aria-label={t('draw.canvas')}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
      </div>
      <p className="draw-board__hint" role="status">
        {full ? t('draw.full') : t('draw.hint')}
      </p>
      <div className="draw-board__tools">
        <div className="draw-board__group" role="group" aria-label={t('draw.colours')}>
          {COLOURS.map((c, i) => (
            <button
              key={c.id}
              ref={i === 0 ? first : undefined}
              type="button"
              className={c.id === ERASER ? 'draw-board__paint is-eraser' : 'draw-board__paint'}
              style={{ background: c.color }}
              aria-pressed={paint === c.color}
              aria-label={t(`draw.colour.${c.id}`)}
              title={t(`draw.colour.${c.id}`)}
              onClick={() => setPaint(c.color)}
            >
              {c.id === ERASER && <span aria-hidden="true">🧽</span>}
            </button>
          ))}
        </div>
        <div className="draw-board__group" role="group" aria-label={t('draw.brushes')}>
          {BRUSHES.map((b) => (
            <button key={b.id} type="button" className="draw-board__brush" aria-pressed={brush === b.id} aria-label={t(`draw.brush.${b.id}`)} title={t(`draw.brush.${b.id}`)} onClick={() => setBrush(b.id)}>
              <span className="draw-board__dot" style={{ width: `${6 + b.width * 500}px`, height: `${6 + b.width * 500}px` }} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="draw-board__group">
          <button type="button" className="btn draw-board__button" onClick={() => drawingStore.getState().undo()} disabled={!canUndo}>
            <span aria-hidden="true">↩️</span> {t('draw.undo')}
          </button>
          <button
            type="button"
            className="btn draw-board__button"
            onClick={() => {
              playSfx('pop')
              drawingStore.getState().clear()
            }}
            disabled={strokes.length === 0}
          >
            <span aria-hidden="true">🗑️</span> {t('draw.clear')}
          </button>
          <button type="button" className="btn draw-board__button" onClick={save}>
            <span aria-hidden="true">💾</span> {t('draw.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export type { Stroke }
