import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
  type JSX,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import useKeys from './hooks/useKeys'
import useAudioManager from './hooks/useAudio'
import { loadAudioAssets } from './utils/loader'
import { useStageImages } from './hooks/useStageImages'
import type { LoaderAudioAssets, LoaderImageAssets, StageConfig } from './types'
import { POPUPS } from './data/popups'
import { gameStore, useGame } from './logic/gameStore.instance'
import { getActivePrompt } from './utils/getActivePrompt'
import { findQuestion, isVisiting, isWorldPaused } from './logic/gameMachine'
import { useHero } from './player/heroSettings'
import { createWorld, resizeWorld } from './logic/world'
import { MoveControls } from './components/MoveControls'
import { AnimatePresence } from 'framer-motion'
import { NumberCard } from './ui/NumberCard'
import { QuestionCard } from './ui/QuestionCard'
import { asksForNumber, choiceForNumber } from './logic/numberAnswer'
import { DialogueBox } from './ui/DialogueBox'
import { FeedbackPopup } from './ui/FeedbackPopup'
import { EndingScreen } from './ui/EndingScreen'
import { StageCard } from './ui/StageCard'
import { LoadingScreen } from './ui/LoadingScreen'
import { ViewErrorBoundary } from './views/ViewErrorBoundary'
import { NameModal } from './ui/NameModal'
import { ControlBar } from './ui/ControlBar'
import { Hud } from './ui/Hud'
import { PauseMenu } from './ui/PauseMenu'
import { pauseStore, usePaused } from './pause/pauseStore'
import { heroSettings } from './player/heroSettings'
import { usePauseControls } from './pause/usePauseControls'
import { moveStore } from './moves/moveStore'
import { weatherClock } from './places/yard/weatherClock'
import { useDanceControls } from './moves/useDanceControls'
import { isBusy } from './places/placeBusy'
import { MoveCaption } from './ui/MoveCaption'
import { StickerBook } from './ui/StickerBook'
import { StickerToast } from './ui/StickerToast'
import { stickerStore, useBookOpen } from './stickers/stickerStore'
import { TodoPanel } from './todo/TodoPanel'
import { todoStore, useTodoOpen } from './todo/todoStore'
import { missingClasses } from './logic/classProgress'
import { usePracticeWatch } from './parent/usePractice'
import { useStickerWatch } from './stickers/useStickerWatch'
import { useIntroActive } from './intro/introStore'
import { useStartActive } from './start/startStore'
import { placeStore, usePlace, usePlaceFrom, useTrip } from './places/placeStore'
import { StageTransition } from './transition/StageTransition'
import { transitionStore, useTransition } from './transition/transitionStore'
import { shouldTransition, transitionsEnabled } from './transition/transitionModel'
import { usePlayerName, useProfile, fillName } from './player/playerName'
import { useLang } from './i18n/language'
import { useT } from './i18n/useT'
import { subjectText } from './i18n/phrases'
import { useSfx } from './hooks/useGameEffects'
import { useFitSize } from './hooks/useFitSize'
import { pickGreeting, pickRevisitGreeting, hashString } from './data/dialogue'
import { STAGES } from './constants/stages'
import Canvas2DView from './views/Canvas2DView'

// The 2D view of the yard, the library and the corridor (drawn in code, no three.js): only downloaded when a place is shown in 2D.
const Canvas2DPlaceView = lazy(() => import('./views/Canvas2DPlaceView'))
/** The cut of a walk through a door: she is in the other place now; through a class door of the corridor, in that class. */
function arriveNow() {
  const trip = placeStore.getState().trip
  placeStore.getState().arrive()
  if (trip?.to === 'class' && trip.stage !== undefined) gameStore.getState().enterStage(trip.stage)
}

type GameShellProps = {
  stage: StageConfig
  stageIndex: number
  canvasWidth: number
  canvasHeight: number
  /** The stage picker: it lives in a small menu next to the toggles, out of a child's way. */
  stageMenu?: ReactNode
  /**
   * Where the buttons around the game go (they are kept out of the playfield): the page's
   * slot for them; `null` while the page has none yet; left out, they sit right above the game.
   */
  controlsSlot?: HTMLElement | null
}

/**
 * Everything that is the same in every view: input, assets, audio, and the
 * HTML overlay (HUD, dialogue, quiz, popups). The renderer inside the frame
 * is 2D canvas or 3D, chosen by the view setting.
 */
export default function GameShell({
  stage,
  stageIndex,
  canvasWidth,
  canvasHeight,
  stageMenu,
  controlsSlot,
}: GameShellProps): JSX.Element {
  const keysRef = useKeys()
  // Test hook for the Playwright scripts: the live game store (dev builds, or ?e2e in the URL).
  useEffect(() => {
    if (!import.meta.env.DEV && !window.location.search.includes('e2e')) return
    ;(window as unknown as Record<string, unknown>).__unicornGame = { store: gameStore, hero: heroSettings, pause: pauseStore, place: placeStore, moves: moveStore, stickers: stickerStore, weather: weatherClock }
  }, [])
  const { areaRef, fit } = useFitSize({ width: canvasWidth, height: canvasHeight })
  // This repo is the 2D-only version of the game: there is no 3D view.
  const view = '2d' as const
  const lang = useLang()
  const name = usePlayerName()
  const introActive = useIntroActive()
  // The start menu and the intro film have the screen (and the GPU) to themselves: the game waits behind them.
  const startActive = useStartActive()
  const covered = introActive || startActive
  // The welcome card waits until the intro is over.
  const modalOpen = useProfile((s) => s.modalOpen) && !covered
  const transition = useTransition((s) => s)
  // The opening title card is for the first stage shown; later stages get the transition's.
  const [openingCard, setOpeningCard] = useState(true)
  const lastStage = useRef<number | null>(null)
  const lastEntries = useRef(0)
  useEffect(() => {
    // Going into a class from the corridor has its own walk (see the hall film): it is not the film of finishing a stage.
    const entries = gameStore.getState().entries
    const entered = entries !== lastEntries.current
    lastEntries.current = entries
    if (entered) {
      setOpeningCard(true)
    } else if (shouldTransition(lastStage.current, stageIndex) && transitionsEnabled(window.location.search)) {
      // Finishing a stage (not a jump or a restart) starts with the "Stage complete!" card.
      transitionStore.getState().start(stageIndex, gameStore.getState().phase === 'nextStage', lastStage.current)
      setOpeningCard(false)
    }
    lastStage.current = stageIndex
  }, [stageIndex])
  const { t, list } = useT()
  const kickers = list('personal.questionKicker')

  const phase = useGame((g) => g.phase)
  // In a class she has finished the unicorns greet her and ask nothing.
  const visiting = useGame((g) => isVisiting(g))
  const activeQuestion = useGame((g) => g.activeQuestion)
  const popup = useGame((g) => g.popup)

  const [world] = useState(() => createWorld(canvasWidth, canvasHeight))
  // The pictures come a stage at a time (the 2D view waits for them; the 3D view does not draw them).
  const { assetsRef, loaded: assetsLoaded } = useStageImages({ stage, next: STAGES[stageIndex + 1], blocking: view === '2d' })
  // The music files are set up at once but download nothing until they are played.
  const audioRef = useRef<LoaderAudioAssets | null>(null)
  if (audioRef.current === null) audioRef.current = loadAudioAssets()

  // A new stage cancels any click-to-move target from the previous one.
  useEffect(() => {
    world.moveTargetRef.current = null
  }, [stageIndex, world])

  // Once a popup closes, drop any E/Enter press that was held behind it so
  // it can't instantly re-trigger a conversation.
  useEffect(() => {
    if (popup) return
    const keys = keysRef.current
    keys['e'] = false
    keys['enter'] = false
  }, [popup, keysRef])

  // The player is the same size as every NPC - recomputed whenever the canvas
  // size changes (e.g. rotating the phone), not just once on load.
  useEffect(() => {
    resizeWorld(world, canvasWidth, canvasHeight)
  }, [world, canvasWidth, canvasHeight])

  const { enableAudioNow } = useAudioManager({
    audioRef,
    stage,
    stageIndex,
    assetsLoaded,
  })

  useSfx()

  const onTrigger = useCallback(
    (kind: 'gate' | 'npc', id: string) => {
      gameStore.getState().interact({ kind, id })
      if (keysRef.current) {
        // consume the keys so the same press can't re-trigger the prompt
        keysRef.current['e'] = false
        keysRef.current['enter'] = false
      }
    },
    [keysRef]
  )

  const activePrompt =
    phase === 'asking' ? getActivePrompt(activeQuestion, stage, lang) : null
  const numberQuestion = phase === 'asking' && activeQuestion ? findQuestion(stage, activeQuestion) : undefined
  const talkingNpc =
    phase === 'talking'
      ? stage.npcs?.find((n) => n.id === activeQuestion?.id)
      : undefined
  const imageSrc = (key?: string) =>
    key ? assetsRef.current?.[key as keyof LoaderImageAssets]?.src : undefined
  const { beginAsking, answer, restart } = gameStore.getState()
  // After a wrong answer: the text of the right one, to show kindly.
  const rightAnswer = (() => {
    if (popup?.id !== 'TRY_AGAIN' || !popup.question) return null
    const question = findQuestion(stage, popup.question)
    const text = getActivePrompt(popup.question, stage, lang)
    return question && text ? (text.choices[question.correctIndex] ?? null) : null
  })()

  const viewProps = {
    stage,
    stageIndex,
    canvasWidth,
    canvasHeight,
    keysRef,
    world,
    assetsRef,
    onTrigger,
  }

  // A film has its own pause button (and its own look when paused); a stage gets the pause menu.
  const paused = usePaused()
  const place = usePlace()
  const placeFrom = usePlaceFrom()
  const trip = useTrip()
  // The 2D game has no film of a walk through a door: a door just takes her through.
  useEffect(() => {
    if (!trip) return
    arriveNow()
    placeStore.getState().finish()
  }, [trip])
  const filmPlaying = covered || transition.active || trip !== null
  usePauseControls({ filmPlaying, nameCardOpen: modalOpen })
  // What she does wins stickers; the book takes the place of the pause menu, and going on (P, Escape) closes it.
  useStickerWatch()
  usePracticeWatch()
  const bookOpen = useBookOpen()
  const todoOpen = useTodoOpen()
  const solved = useGame((g) => g.solved)
  const classesLeft = missingClasses(solved, STAGES).length
  useEffect(() => {
    if (!paused) {
      stickerStore.getState().closeBook()
      todoStore.getState().closeList()
    }
  }, [paused])
  // Space: Amara does one of her moves, when nothing else has the game.
  const hero = useHero()
  const danceContext = useCallback(
    () => ({ hero, view, paused, covered: covered || filmPlaying, nameCardOpen: modalOpen, worldPaused: isWorldPaused(phase), busy: isBusy(), menuOpen: !!document.querySelector('[aria-expanded="true"]') }),
    [hero, view, paused, covered, filmPlaying, modalOpen, phase]
  )
  useDanceControls(danceContext)

  // The stage's name, stars and the school's dots live in the bar, not over the room (and only in a classroom).
  const status =
    place === 'class' ? (
      <>
        <Hud stage={stage} stageIndex={stageIndex} />
      </>
    ) : undefined
  const controls = <ControlBar onUnmute={enableAudioNow} stageMenu={stageMenu} status={status} />

  return (
    <>
      {/* The buttons stay outside the game: in the page's top bar when it gave a place for them, else just above the game. */}
      {controlsSlot === undefined ? <div className="top-controls">{controls}</div> : controlsSlot && createPortal(controls, controlsSlot)}
      <div className="stage-area" ref={areaRef}>
        <div
          className="game-frame"
          style={{ width: fit.width }}
          data-view={view}
          data-feedback={popup?.id === 'TRY_AGAIN' ? 'wrong' : undefined}
          data-asking={activePrompt ? 'true' : undefined}
        >
          {covered ? (
            // Nothing is drawn behind the menu or the intro: they have the screen (and the GPU) to themselves.
            <div className="view-fallback" style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }} />
          ) : place !== 'class' ? (
            <ViewErrorBoundary>
              <Suspense fallback={<div className="view-fallback" style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }} />}>
                <Canvas2DPlaceView key={place} place={place} from={placeFrom} stageIndex={stageIndex} canvasWidth={canvasWidth} canvasHeight={canvasHeight} keysRef={keysRef} />
              </Suspense>
            </ViewErrorBoundary>
          ) : (
            <Canvas2DView {...viewProps} />
          )}
          <MoveCaption />
          <StickerToast />
          <MoveControls keysRef={keysRef} moveTargetRef={world.moveTargetRef} />
          {/* Announced to screen readers whenever the stage changes. */}
          <p className="visually-hidden" aria-live="polite">
            {t('stage.announce', { n: stageIndex + 1, total: STAGES.length, subject: subjectText(t, stage.subject) })}
          </p>

          {assetsLoaded && openingCard && !covered && (
            <StageCard
              key={stageIndex}
              stage={stage}
              stageIndex={stageIndex}
              totalStages={STAGES.length}
            />
          )}

          <AnimatePresence>
            {talkingNpc && (
              <DialogueBox
                key={`talk-${talkingNpc.id}`}
                text={visiting ? pickRevisitGreeting(talkingNpc.id, lang, name) : pickGreeting(stage.subject, talkingNpc.id, lang, name)}
                portraitSrc={imageSrc(talkingNpc.imageKey)}
                onContinue={beginAsking}
              />
            )}
            {activePrompt && activeQuestion && asksForNumber(numberQuestion, activePrompt.choices) ? (
              <NumberCard
                key={`ask-${activeQuestion.id}`}
                kicker={name ? fillName(kickers[hashString(activeQuestion.id) % kickers.length], name) : undefined}
                prompt={activePrompt.prompt}
                onSubmit={(typed) => answer(choiceForNumber(typed, activePrompt.choices, numberQuestion!.correctIndex))}
              />
            ) : (
              activePrompt && (
                <QuestionCard
                  key={`ask-${activeQuestion?.id}`}
                  kicker={
                    name && activeQuestion
                      ? fillName(kickers[hashString(activeQuestion.id) % kickers.length], name)
                      : undefined
                  }
                  prompt={activePrompt.prompt}
                  choices={activePrompt.choices}
                  onPick={answer}
                />
              )
            )}
          </AnimatePresence>

          <AnimatePresence>
            {popup &&
              assetsLoaded &&
              !transition.active &&
              (popup.id === 'GAME_END' ? (
                <EndingScreen
                  key="ending"
                  onRestart={restart}
                  onKeepPlaying={() => gameStore.getState().keepPlaying()}
                />
              ) : (
                <FeedbackPopup
                  key={`popup-${popup.token}`}
                  config={POPUPS[popup.id]}
                  seed={popup.token}
                  answer={rightAnswer}
                  onDismiss={() => gameStore.getState().dispatch({ type: 'POPUP_EXPIRED', token: popup.token })}
                  left={classesLeft}
                  onShowLeft={() => {
                    gameStore.getState().dispatch({ type: 'POPUP_EXPIRED', token: popup.token })
                    pauseStore.getState().pause()
                    todoStore.getState().openList()
                  }}
                />
              ))}
          </AnimatePresence>

          {!assetsLoaded && <LoadingScreen />}

          <AnimatePresence>{modalOpen && <NameModal key="name-modal" />}</AnimatePresence>
        {paused && !filmPlaying && (bookOpen ? <StickerBook /> : todoOpen ? <TodoPanel /> : <PauseMenu onUnmute={enableAudioNow} />)}
        </div>
        {transition.active && transition.to !== null && (
          <StageTransition key={transition.to} from={transition.from} to={transition.to} completed={transition.completed} onDone={() => transitionStore.getState().finish()} />
        )}
      </div>
    </>
  )
}
