import { useCallback, useEffect, useMemo, useRef, type JSX, type PointerEvent } from 'react'
import { STAGES } from '../constants/stages'
import { playerLookFor } from '../data/stageLooks'
import { doneFlags } from '../logic/classProgress'
import { hallArrival } from '../hall/hallLayout'
import { useT } from '../i18n/useT'
import { useGame } from '../logic/gameStore.instance'
import { isPaused } from '../pause/pauseStore'
import { isBusy } from '../places/placeBusy'
import { BookReader } from '../places/library/BookReader'
import { readerStore } from '../places/library/bookReader'
import { DrawingBoard } from '../places/library/drawing/DrawingBoard'
import { drawingStore } from '../places/library/drawing/drawingStore'
import { MusicPad } from '../places/library/MusicPad'
import { musicStore } from '../places/library/musicStore'
import { arrivalAt, DANCE_SKY, DOJO_SKY, LIBRARY_SKY, POOL_SKY, PONY_SKY, SCIENCE_SKY, SPORTS_SKY, TECH_SKY, walkBounds, YARD_SKY, type RoomId } from '../places/placeLayout'
import type { PlaceId } from '../places/placeModel'
import { PlaceSay } from '../places/PlaceSay'
import { PlaceTalk } from '../places/PlaceTalk'
import { lineOf, optionLabels } from '../places/dialogModel'
import { isTravelling } from '../places/placeStore'
import { createWalker, stepWalker } from '../places/placeWorld'
import { sayStore } from '../places/sayStore'
import { talkStore, useTalk } from '../places/talkStore'
import { doThing, THING_NAMES } from '../places/view2d/actions2d'
import { drawBackdrop, playerDrawable, standing, type Scene2D } from '../places/view2d/draw2d'
import { followX, frameFor, unproject } from '../places/view2d/frame2d'
import { doorNear, standFor, thingAt, thingsFor, type Thing2D } from '../places/view2d/things2d'
import { worldRunning } from '../places/worldRunning'
import { useOutfit } from '../player/outfitSettings'
import { usePlayerName } from '../player/playerName'
import type { Keys } from '../types'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'

type Props = {
  place: RoomId
  /** The place she came from: she stands in front of the door she came through. */
  from: PlaceId
  stageIndex: number
  canvasWidth: number
  canvasHeight: number
  keysRef: React.RefObject<Keys>
}

const NO_KEYS: Keys = {}

const SKY: Record<RoomId, string> = { yard: YARD_SKY[0], library: LIBRARY_SKY[0], hall: '#E9DFFF', sports: SPORTS_SKY[0], pony: PONY_SKY[0], pool: POOL_SKY[0], dojo: DOJO_SKY[0], dance: DANCE_SKY[0], tech: TECH_SKY[0], science: SCIENCE_SKY[0] }

/**
 * The 2D view of the yard, the library and the corridor: the same rooms, doors, friends and things to do as the 3D view,
 * drawn in code on a canvas. She walks with the arrow keys or a tap; a tap on a door, a friend, a book or the xylophone
 * takes her there and does what it does (the same stores as the 3D rooms, so both views play the same game).
 */
export default function Canvas2DPlaceView({ place, from, stageIndex, canvasWidth: W, canvasHeight: H, keysRef }: Props): JSX.Element {
  const { t, lang } = useT()
  const name = usePlayerName()
  const outfit = useOutfit()
  const solved = useGame((g) => g.solved)
  const done = useMemo(() => doneFlags(solved, STAGES), [solved])
  const talk = useTalk()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const things = useMemo(() => thingsFor(place), [place])
  const bounds = useMemo(() => walkBounds(place), [place])
  const look = useMemo(() => playerLookFor(stageIndex, outfit), [stageIndex, outfit])
  const walker = useMemo(() => {
    const spawn = place === 'hall' ? hallArrival(from, stageIndex) : arrivalAt(place, from)
    return createWalker(spawn.x, spawn.z)
  }, [place, from, stageIndex])
  const camRef = useRef(followX(place, W, H, walker.x))
  // What the loop reads without being restarted every time the language or what is done changes.
  const sceneRef = useRef({ lang, done, look })
  sceneRef.current = { lang, done, look }

  // A talk, a book, the pad, the board and the advice all end when she leaves the place.
  useEffect(
    () => () => {
      talkStore.getState().close()
      readerStore.getState().close()
      musicStore.getState().close()
      drawingStore.getState().close()
      sayStore.getState().clear()
    },
    [place]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = prefersReducedMotion()
    let last = performance.now()
    // The clock of the idle motion: it stops while the game is paused, so everything holds still then.
    let animT = 0
    let raf = 0
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!isPaused()) animT += dt
      if (worldRunning()) {
        const keys = isBusy() ? NO_KEYS : (keysRef.current ?? NO_KEYS)
        stepWalker(walker, { dt, keys, bounds })
        // E or Enter next to a door goes through it, as next to a friend it starts a talk.
        if (keys['e'] || keys['enter']) {
          const near = doorNear(things, walker)
          if (near) {
            keys['e'] = false
            keys['enter'] = false
            doThing(near.use)
          }
        }
      }
      // The view follows her along a long room, easing toward her.
      const target = followX(place, W, H, walker.x)
      camRef.current = still ? target : camRef.current + (target - camRef.current) * Math.min(1, dt * 6)
      const f = frameFor(place, W, H, camRef.current)
      const s: Scene2D = { t: animT, reduceMotion: still, lang: sceneRef.current.lang, done: sceneRef.current.done }
      drawBackdrop(ctx, f, s)
      const drawables = [...standing(ctx, f, s), playerDrawable(ctx, f, s, { x: walker.x, z: walker.z, facingLeft: walker.facingLeft, moving: walker.moving, look: sceneRef.current.look })]
      drawables.sort((a, b) => a.z - b.z).forEach((d) => d.draw())
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [place, W, H, walker, bounds, things, keysRef])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (isPaused() || isTravelling() || isBusy()) return
      const rect = e.currentTarget.getBoundingClientRect()
      const sx = ((e.clientX - rect.left) / rect.width) * W
      const sy = ((e.clientY - rect.top) / rect.height) * H
      const f = frameFor(place, W, H, camRef.current)
      const hit: Thing2D | null = thingAt(things, f, sx, sy)
      if (hit) {
        const stand = standFor(hit, walker.x)
        walker.target = { x: stand.x, z: stand.z, radius: 0.4, onArrive: () => doThing(hit.use) }
      } else {
        const spot = unproject(f, sx, sy)
        walker.target = { x: spot.x, z: spot.z }
      }
    },
    [place, W, H, things, walker]
  )

  const title = t(`places.${place}`)
  const who = talk ? THING_NAMES[talk.id][lang] : ''
  return (
    <div className="three-wrap place-wrap" data-place={place} data-view="2d" style={{ aspectRatio: `${W} / ${H}`, background: SKY[place] }}>
      <canvas ref={canvasRef} width={W} height={H} role="img" aria-label={t('places.label', { place: title })} onPointerDown={onPointerDown} />
      <div className="place-title">{title}</div>
      <PlaceSay />
      {place === 'library' && (
        <>
          <BookReader />
          <MusicPad />
          <DrawingBoard />
        </>
      )}
      {talk && <PlaceTalk who={who} line={lineOf(talk.state, lang, name)} options={optionLabels(talk.state, lang)} onChoose={talkStore.getState().choose} onClose={talkStore.getState().close} />}
    </div>
  )
}
