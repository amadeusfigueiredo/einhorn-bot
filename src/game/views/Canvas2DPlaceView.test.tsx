// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { recorder } from '../../test/canvas'

vi.mock('../audio/sfx', () => ({ playSfx: () => {} }))
vi.mock('../audio/voice', () => ({ playVoice: () => {}, pitchFor: () => 1 }))

import { STAGES } from '../constants/stages'
import { gameStore } from '../logic/gameStore.instance'
import { exitDoorSpot, hallArrival, hallDoorSpot, hallFootZ } from '../hall/hallLayout'
import { pauseStore } from '../pause/pauseStore'
import { drawingStore } from '../places/library/drawing/drawingStore'
import { readerStore } from '../places/library/bookReader'
import { musicStore } from '../places/library/musicStore'
import { DOOR_SPOTS, arrivalAt } from '../places/placeLayout'
import { placeStore } from '../places/placeStore'
import { sayStore } from '../places/sayStore'
import { talkStore } from '../places/talkStore'
import { TALKS } from '../places/view2d/actions2d'
import { followX, frameFor, project } from '../places/view2d/frame2d'
import { profileStore } from '../player/playerName'
import { startStore } from '../start/startStore'
import Canvas2DPlaceView from './Canvas2DPlaceView'

cleanupAfterEach()

const W = 1280
const H = 720
let clock = 1000
let queue: FrameRequestCallback[] = []
let drawn = recorder()

/** Runs `n` frames of 50 ms. */
function frames(n: number) {
  for (let i = 0; i < n; i++) {
    clock += 50
    const run = queue
    queue = []
    act(() => run.forEach((cb) => cb(clock)))
  }
}

function setup(place: 'yard' | 'library' | 'hall' = 'library', from: 'yard' | 'class' | 'library' | 'hall' = 'yard', keys: Record<string, boolean> = {}) {
  const keysRef = { current: keys }
  placeStore.setState({ place, from, trip: null })
  const view = renderUI(<Canvas2DPlaceView place={place} from={from} stageIndex={0} canvasWidth={W} canvasHeight={H} keysRef={keysRef} />, 'en')
  const canvas = view.container.querySelector('canvas')!
  // The canvas is shown at its own size in the corner of the window.
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H, x: 0, y: 0, toJSON: () => {} })
  const tap = (x: number, y: number) => fireEvent.pointerDown(canvas, { clientX: x, clientY: y })
  return { ...view, canvas, keysRef, tap }
}

const textsOf = (calls: string[]) => calls.filter((c) => c.startsWith('fillText:')).map((c) => c.slice(9).split(',')[0])
/** The texts of the latest picture only. */
const texts = () => {
  const last = drawn.calls.lastIndexOf('clearRect:0,0,1280,720')
  return textsOf(drawn.calls.slice(last))
}
const lastFrame = () => {
  drawn.calls.length = 0
  frames(1)
  return drawn.calls.slice()
}

beforeEach(() => {
  clock = 1000
  queue = []
  drawn = recorder()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queue.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => drawn.ctx) as never)
  placeStore.setState({ place: 'library', from: 'yard', trip: null })
  gameStore.getState().startOver()
  startStore.getState().close()
  profileStore.setState({ modalOpen: false })
  for (const s of [talkStore, readerStore, musicStore, drawingStore]) (s.getState() as { close?: () => void }).close?.()
  sayStore.getState().clear()
  if (pauseStore.getState().paused) pauseStore.getState().toggle()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Canvas2DPlaceView: the library, the yard and the corridor in 2D', () => {
  it('is one canvas of the design size, described for screen readers, with the name of the place on it', () => {
    const { canvas } = setup('library')
    expect(canvas.width).toBe(W)
    expect(canvas.height).toBe(H)
    expect(screen.getByRole('img', { name: /Library/ })).toBe(canvas)
    expect(screen.getAllByText('Library').length).toBeGreaterThan(0)
  })

  it('knows which place it shows', () => {
    const { container, unmount } = setup('yard')
    expect(container.querySelector('.place-wrap')?.getAttribute('data-place')).toBe('yard')
    expect(container.querySelector('.place-wrap')?.getAttribute('data-view')).toBe('2d')
    expect(screen.getByText('Schoolyard')).toBeTruthy()
    unmount()
    setup('hall', 'class')
    expect(screen.getByText('School corridor')).toBeTruthy()
  })

  it('draws a new picture of the room every frame: the doors with their signs, the unicorns', () => {
    setup('library')
    frames(2)
    expect(texts()).toEqual(expect.arrayContaining(['To the yard', 'To the corridor']))
    expect(lastFrame().length).toBeGreaterThan(300)
  })

  it('tap on the lilac door: she walks to it and the walk through it starts', () => {
    const { tap } = setup('library')
    const f = frameFor('library', W, H, 0)
    const door = DOOR_SPOTS.library.hall!
    const p = project(f, door[0], door[2])
    tap(p.x, p.y - 100)
    frames(5)
    expect(placeStore.getState().trip).toBeNull()
    frames(200)
    expect(placeStore.getState().trip).toEqual({ from: 'library', to: 'hall' })
  })

  it('tap on a book opens it; tap on the xylophone and the easel open their boards', () => {
    const { tap } = setup('library')
    const f = frameFor('library', W, H, 0)
    const book = project(f, 0.0, 0.7)
    tap(book.x, book.y - 0.9 * f.scale)
    frames(200)
    expect(readerStore.getState().reading).not.toBeNull()
  })

  it('tap on the floor: she walks there, and the picture changes as she goes', () => {
    const { tap } = setup('library')
    frames(2)
    const before = lastFrame().join('|')
    tap(900, 600)
    frames(10)
    expect(lastFrame().join('|')).not.toBe(before)
  })

  it('the arrow keys walk her, and E next to a door goes through it', () => {
    const { keysRef } = setup('library')
    const door = DOOR_SPOTS.library.yard!
    const start = arrivalAt('library', 'yard')
    expect(start.x).toBeGreaterThan(door[0])
    keysRef.current['arrowleft'] = true
    frames(20)
    keysRef.current['arrowleft'] = false
    frames(1)
    expect(placeStore.getState().trip).toBeNull()
    keysRef.current['e'] = true
    frames(2)
    expect(placeStore.getState().trip).toEqual({ from: 'library', to: 'yard' })
    expect(keysRef.current['e']).toBe(false)
  })

  it('E with nothing near does nothing', () => {
    const { keysRef } = setup('library')
    keysRef.current['e'] = true
    frames(2)
    expect(placeStore.getState().trip).toBeNull()
    expect(keysRef.current['e']).toBe(true)
  })

  it('a tap does nothing while the game is paused, a door is opening, or a book is open', () => {
    const { tap } = setup('library')
    const f = frameFor('library', W, H, 0)
    const door = project(f, DOOR_SPOTS.library.hall![0], DOOR_SPOTS.library.hall![2])
    act(() => pauseStore.getState().toggle())
    tap(door.x, door.y - 100)
    act(() => pauseStore.getState().toggle())
    frames(200)
    expect(placeStore.getState().trip).toBeNull()
    placeStore.setState({ trip: { from: 'library', to: 'yard' } })
    tap(door.x, door.y - 100)
    placeStore.setState({ trip: null })
    frames(200)
    expect(placeStore.getState().trip).toBeNull()
    act(() => readerStore.getState().open(1))
    tap(door.x, door.y - 100)
    act(() => readerStore.getState().close())
    frames(200)
    expect(placeStore.getState().trip).toBeNull()
  })

  it('the world stands still while it is paused', () => {
    const { keysRef } = setup('library')
    frames(2)
    act(() => pauseStore.getState().toggle())
    const before = lastFrame().join('|')
    keysRef.current['arrowright'] = true
    frames(10)
    expect(lastFrame().join('|')).toBe(before)
  })

  it('shows a friend\'s talk over the room, and the reader when a book is open', () => {
    setup('library')
    act(() => talkStore.getState().open('owl', TALKS.owl))
    expect(screen.getByText(/Hello|Psst/)).toBeTruthy()
    act(() => talkStore.getState().close())
    act(() => readerStore.getState().open(0))
    expect(screen.getByText('The Moon Koala')).toBeTruthy()
  })

  it('a talk, a book, the pad and the board end when she leaves the place', () => {
    const { unmount } = setup('library')
    act(() => {
      talkStore.getState().open('owl', TALKS.owl)
      readerStore.getState().open(0)
      musicStore.getState().openPanel()
      drawingStore.getState().openBoard()
      sayStore.getState().say({ de: 'a', pt: 'a', en: 'a' })
    })
    unmount()
    expect(talkStore.getState().talk).toBeNull()
    expect(readerStore.getState().reading).toBeNull()
    expect(musicStore.getState().open).toBe(false)
    expect(drawingStore.getState().open).toBe(false)
    expect(sayStore.getState().saying).toBeNull()
  })

  it('in the yard a tap on a friend walks over and starts the talk', () => {
    const { tap } = setup('yard', 'class')
    frames(2)
    // she came in by the door at the left end: the view stays at the left end of the yard
    const f = frameFor('yard', W, H, -5.4)
    const friend = project(f, -7.6, 1.9)
    tap(friend.x, friend.y - 100)
    frames(300)
    expect(talkStore.getState().talk?.id).toBe('friendPlay')
  })

  it('in the yard a tap on the koala, the capybara or the slide makes them say their line', () => {
    const { tap } = setup('yard', 'class')
    frames(2)
    const f = frameFor('yard', W, H, -5.4)
    const slide = project(f, 0.8, -3.7)
    tap(slide.x, slide.y - 60)
    frames(400)
    expect(sayStore.getState().saying?.text.en).toBe('Woohoo!')
  })

  it('in the corridor she comes in at the green door, with the doors in order and the first one open', () => {
    setup('hall', 'yard')
    frames(30)
    expect(texts()).toEqual(expect.arrayContaining(['1 · Candy Classroom', '2 · Beach School', 'Schoolyard & library']))
    // only the first door is the next one: the "New!" badge is over it, and there are padlocks on the others
    expect(texts().filter((x) => x === 'New!')).toHaveLength(1)
    // every door is open: no door has a padlock
    expect(drawn.calls.slice(drawn.calls.lastIndexOf('clearRect:0,0,1280,720')).filter((c) => c === 'strokeStyle=#E0A93B')).toHaveLength(0)
  })

  it('in the corridor every door takes her in, the next one and the far ones alike', () => {
    const { tap } = setup('hall', 'yard')
    frames(2)
    const f = frameFor('hall', W, H, followX('hall', W, H, hallArrival('yard', 0).x))
    const spot = (i: number) => hallDoorSpot(i)
    const third = project(f, spot(2)[0], spot(2)[2])
    tap(third.x, third.y - 150)
    frames(300)
    // (class 3 is not the next one to do, and still it opens)
    expect(placeStore.getState().trip).toEqual({ from: 'hall', to: 'class', stage: 2 })
    placeStore.setState({ trip: null, place: 'hall' })
    // the picture has followed her to the third door
    const moved = frameFor('hall', W, H, followX('hall', W, H, spot(2)[0]))
    const second = project(moved, spot(1)[0], spot(1)[2])
    tap(second.x, second.y - 150)
    frames(300)
    expect(placeStore.getState().trip).toEqual({ from: 'hall', to: 'class', stage: 1 })
    expect(hallFootZ()).toBeGreaterThan(spot(1)[2])
  })

  it('the green door of the corridor leads back to the yard', () => {
    const { tap } = setup('hall', 'yard')
    frames(2)
    const f = frameFor('hall', W, H, followX('hall', W, H, hallArrival('yard', 0).x))
    const green = project(f, exitDoorSpot()[0], exitDoorSpot()[2])
    tap(green.x, green.y - 150)
    frames(300)
    expect(placeStore.getState().trip).toEqual({ from: 'hall', to: 'yard' })
  })

  it('moves the view along with her in a long place, and holds it in the library', () => {
    const { keysRef } = setup('hall', 'yard')
    frames(2)
    const first = texts()
    keysRef.current['arrowright'] = true
    frames(120)
    keysRef.current['arrowright'] = false
    frames(20)
    expect(texts()).not.toEqual(first)
  })

  it('with reduced motion the view is where she is at once and nothing drifts', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }))
    const { keysRef } = setup('yard', 'class')
    frames(2)
    const a = lastFrame().join('|')
    frames(3)
    expect(lastFrame().join('|')).toBe(a)
    keysRef.current['arrowright'] = true
    frames(5)
    expect(lastFrame().join('|')).not.toBe(a)
  })

  it('does not crash on a browser that gives no 2D canvas, it just draws nothing', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { canvas } = setup('library')
    expect(() => frames(3)).not.toThrow()
    expect(canvas).toBeTruthy()
    expect(drawn.calls).toHaveLength(0)
  })

  it('nobody walks while a book is open, and a missing key list is no trouble', () => {
    // (with reduced motion nothing but walking changes the picture)
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }))
    const { keysRef } = setup('library')
    frames(2)
    act(() => readerStore.getState().open(0))
    const before = lastFrame().join('|')
    keysRef.current['arrowright'] = true
    frames(10)
    expect(lastFrame().join('|')).toBe(before)
    keysRef.current['arrowright'] = false
    act(() => readerStore.getState().close())
    keysRef.current = null as never
    expect(() => frames(3)).not.toThrow()
  })

  it('with every class done no door is the next one: no badge', () => {
    gameStore.setState({ solved: new Set(STAGES.flatMap((s) => (s.npcs ?? []).map((n) => n.id))) })
    setup('hall', 'class')
    frames(3)
    expect(texts().filter((x) => x === 'New!')).toHaveLength(0)
    expect(drawn.calls.slice(drawn.calls.lastIndexOf('clearRect:0,0,1280,720')).filter((c) => c === 'strokeStyle=#E0A93B')).toHaveLength(0)
  })

  it('the doors follow what is finished: the first still to do is the next one, wherever it is', () => {
    // class 1 is done, so class 2 is the next one
    gameStore.setState({ solved: new Set((STAGES[0].npcs ?? []).map((n) => n.id)) })
    setup('hall', 'class')
    frames(3)
    expect(texts().filter((x) => x === 'New!')).toHaveLength(1)
  })
})
