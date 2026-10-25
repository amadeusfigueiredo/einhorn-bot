// @vitest-environment jsdom
import { LOCALES } from './i18n/translate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen, setReducedMotion, within } from '../test/ui'
import { buildStages, STAGES } from './constants/stages'
import { createInitialState } from './logic/gameMachine'
import { gameStore, useGame } from './logic/gameStore.instance'
import { profileStore } from './player/playerName'
import { introStore } from './intro/introStore'
import { transitionStore, isTransitioning } from './transition/transitionStore'
import { TOTAL_STICKERS } from './stickers/albumModel'
import { soundSettings } from './audio/soundSettings'
import { pauseStore } from './pause/pauseStore'
import { startStore } from './start/startStore'
import { placeStore } from './places/placeStore'
import { moveStore } from './moves/moveStore'
import { stickerStore } from './stickers/stickerStore'
import { heroSettings } from './player/heroSettings'
import { newBag } from './views/three/amara/amaraMoves'
import { newUnicornBag } from './views/three/unicornMoves'
import { DONE_MS, REDUCED_MS } from './transition/transitionModel'
import GameShell from './GameShell'

// Animations do not run in jsdom: the library is replaced by plain elements so things appear and go at once.
vi.mock('framer-motion', async () => (await import('../test/framerMock')).default)
// No pictures, no sound files, no WebGL, no canvas: only the HTML game around them.
// (The picture fetching is the stand-in; which pictures a stage names is the real thing.)
const imageCalls = vi.hoisted(() => ({ keys: [] as string[][], hold: false, release: [] as (() => void)[] }))
vi.mock('./utils/loader', async (orig) => ({
  ...(await orig<typeof import('./utils/loader')>()),
  loadImageAssets: async ({ imageKeys }: { imageKeys: string[] }) => {
    imageCalls.keys.push(imageKeys)
    if (imageCalls.hold) await new Promise<void>((resolve) => imageCalls.release.push(resolve))
    return {}
  },
  loadAudioAssets: () => ({}),
}))
vi.mock('./hooks/useAudio', () => ({ default: () => ({ enableAudioNow: () => {} }) }))
vi.mock('./audio/sfx', () => ({ playSfx: vi.fn() }))

// The renderers are stand-ins that hand the shell's callbacks to the test, like a player walking up to a unicorn.
const view: { onTrigger?: (kind: 'gate' | 'npc', id: string) => void; stageName?: string } = {}
vi.mock('./views/Canvas2DView', () => ({
  default: (props: { onTrigger: (kind: 'gate' | 'npc', id: string) => void; stage: { name: string } }) => {
    view.onTrigger = props.onTrigger
    view.stageName = props.stage.name
    return <div data-testid="view" />
  },
}))
// ... and the 2D version of the same three places, drawn in code.
const place2dView: { place?: string; from?: string; stageIndex?: number } = {}
vi.mock('./views/Canvas2DPlaceView', () => ({
  default: (props: { place: string; from: string; stageIndex: number }) => {
    Object.assign(place2dView, props)
    return <div data-testid="place-view-2d" data-place={props.place} />
  },
}))
cleanupAfterEach()

class FakeResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

/** What App does: the stage follows the game's stage index. */
function Harness({ controlsSlot }: { controlsSlot?: HTMLElement | null }) {
  const stageIndex = useGame((g) => g.stageIndex)
  const stage = buildStages(1440, 810)[stageIndex]
  return <GameShell stage={stage} stageIndex={stageIndex} canvasWidth={1440} canvasHeight={810} stageMenu={<p>the stage picker</p>} controlsSlot={controlsSlot} />
}

function resetGame() {
  imageCalls.keys.length = 0
  imageCalls.hold = false
  imageCalls.release.length = 0
  moveStore.setState({ current: null, bag: newBag(), unicornBag: newUnicornBag() })
  stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false })
  heroSettings.getState().setHero('amara')
  placeStore.setState({ place: 'class', from: 'class', trip: null })
  startStore.getState().close()
  pauseStore.getState().resume()
  gameStore.getState().dispose()
  gameStore.setState(createInitialState(STAGES, null))
  transitionStore.getState().finish()
  introStore.setState({ active: false })
  profileStore.setState({ name: 'Amara', skipped: false, modalOpen: false })
  soundSettings.getState().setMuted(false)
  window.history.replaceState(null, '', '/')
}

const npc = (stageIndex: number, i: number) => STAGES[stageIndex].npcs![i]
const rightChoice = (stageIndex: number, i: number) => npc(stageIndex, i).question.correctIndex
const wrongChoice = (stageIndex: number, i: number) => (rightChoice(stageIndex, i) + 1) % 4

/** The player walks up to a unicorn, reads the greeting and gets the question. */
function talkTo(stageIndex: number, i: number) {
  act(() => view.onTrigger!('npc', npc(stageIndex, i).id))
  // The first press finishes the typing of the greeting, the second goes on to the question.
  fireEvent.keyDown(window, { key: 'e' })
  fireEvent.keyDown(window, { key: 'e' })
}
const choose = (index: number) => {
  const buttons = within(screen.getByRole('dialog', { name: /./ })).getAllByRole('button')
  fireEvent.click(buttons[index])
}

beforeEach(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver
  resetGame()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  resetGame()
})

const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10)
  })
}

describe('GameShell: a game from first visit to the end', () => {
  it('shows the game with its controls, the stage announced for screen readers, and no loading screen once the pictures are there', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    expect(screen.getByTestId('view')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Turn sound off/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Change view/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Language/ })).toBeTruthy()
    expect(screen.getByText('Stage 1 of 15: Maths')).toBeTruthy()
    expect(screen.queryByRole('status', { name: '' })?.textContent ?? '').not.toContain('on their way')
  })

  it('has the on-screen arrows for phones', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    expect(screen.getAllByRole('button', { name: /Up|Down|Left|Right/ })).toHaveLength(4)
  })

  it('the opening title card shows for the first stage and goes by itself', async () => {
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    expect(container.querySelector('.stage-card')).toBeTruthy()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
    })
    expect(container.querySelector('.stage-card')).toBeNull()
  })

  it('the first visit asks for a name on a welcome card, and the game waits', async () => {
    profileStore.setState({ name: null, skipped: false, modalOpen: true })
    renderUI(<Harness />, 'en')
    await settle()
    expect(screen.getByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('What is your name?'), { target: { value: 'Lia' } })
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    expect(screen.queryByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeNull()
    expect(profileStore.getState().name).toBe('Lia')
  })

  it('the welcome card waits for the start menu, and nothing of the game is drawn behind it', async () => {
    profileStore.setState({ name: null, skipped: false, modalOpen: true })
    startStore.getState().open()
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    expect(screen.queryByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeNull()
    expect(screen.queryByTestId('view')).toBeNull()
    expect(container.querySelector('.view-fallback')).toBeTruthy()
    act(() => startStore.getState().close())
    await settle()
    expect(screen.getByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeTruthy()
    expect(screen.getByTestId('view')).toBeTruthy()
  })

  it('the start menu has its own look: a pause behind it shows no pause menu, and P still toggles it', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => startStore.getState().open())
    fireEvent.keyDown(window, { key: 'p' })
    expect(pauseStore.getState().paused).toBe(true)
    expect(screen.queryByRole('dialog', { name: /Pause/ })).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(true)
    act(() => startStore.getState().close())
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
  })

  it('the welcome card waits for the intro to be over', async () => {
    profileStore.setState({ name: null, skipped: false, modalOpen: true })
    introStore.setState({ active: true })
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    expect(screen.queryByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeNull()
    // Nothing of the game is drawn behind the intro.
    expect(screen.queryByTestId('view')).toBeNull()
    expect(container.querySelector('.view-fallback')).toBeTruthy()
    act(() => introStore.getState().finish())
    await settle()
    expect(screen.getByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeTruthy()
    expect(screen.getByTestId('view')).toBeTruthy()
  })

  it('walking up to a unicorn: it greets Amara by name, then asks the question with the answers', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => view.onTrigger!('npc', npc(0, 0).id))
    expect(screen.getByRole('dialog', { name: 'Teacher Unicorn' }).textContent).toContain('Amara')
    fireEvent.keyDown(window, { key: 'e' })
    fireEvent.keyDown(window, { key: 'e' })
    const q = screen.getByRole('dialog', { name: 'What is 7 + 5?' })
    expect(within(q).getAllByRole('button').map((b) => b.textContent)).toEqual(['A11', 'B12', 'C13', 'D10'])
  })

  it('a wrong answer: "Almost!", the right answer, and "Try again" closes it so she can try at once', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    talkTo(0, 0)
    choose(wrongChoice(0, 0))
    expect(screen.getByRole('heading', { name: 'Almost!' })).toBeTruthy()
    expect(screen.getByText('The right answer: 12')).toBeTruthy()
    expect(gameStore.getState().phase).toBe('wrong')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.queryByRole('heading', { name: 'Almost!' })).toBeNull()
    expect(gameStore.getState().phase).toBe('exploring')
    // Nothing was earned.
    expect(gameStore.getState().answered.size).toBe(0)
    // And the unicorn can be asked again.
    talkTo(0, 0)
    expect(screen.getByRole('dialog', { name: 'What is 7 + 5?' })).toBeTruthy()
  })

  it('"Almost!" also goes by itself after five seconds', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    talkTo(0, 1)
    choose(wrongChoice(0, 1))
    expect(screen.getByRole('heading', { name: 'Almost!' })).toBeTruthy()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4900)
    })
    expect(screen.getByRole('heading', { name: 'Almost!' })).toBeTruthy()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    expect(screen.queryByRole('heading', { name: 'Almost!' })).toBeNull()
  })

  it('a right answer: "Correct!" with a star, which goes by itself after a second and a half', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    talkTo(0, 0)
    choose(rightChoice(0, 0))
    expect(screen.getByRole('heading', { name: 'Correct!' })).toBeTruthy()
    expect(screen.getByText(/\+1 star/)).toBeTruthy()
    expect(gameStore.getState().answered.size).toBe(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1700)
    })
    expect(screen.queryByRole('heading', { name: 'Correct!' })).toBeNull()
    expect(gameStore.getState().phase).toBe('exploring')
  })

  it('the answers in German come with German texts', async () => {
    renderUI(<Harness />, 'de')
    await settle()
    talkTo(0, 0)
    expect(screen.getByRole('dialog', { name: 'Wie viel ist 7 + 5?' })).toBeTruthy()
    choose(rightChoice(0, 0))
    expect(screen.getByRole('heading', { name: 'Richtig!' })).toBeTruthy()
  })




  describe('going into a class from the corridor', () => {
    const startAt = (frontier: number) => act(() => gameStore.getState().jumpToStage(frontier))

    it('has no film of finishing a stage: the walk through the corridor door is its own film', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      startAt(5)
      await settle()
      act(() => transitionStore.getState().finish())
      act(() => gameStore.getState().enterStage(2))
      await settle()
      expect(isTransitioning()).toBe(false)
      expect(screen.queryByTestId('class-film')).toBeNull()
      expect(screen.queryByRole('dialog', { name: 'Stage complete!' })).toBeNull()
      expect(view.stageName).toBe('stage3')
    })

    it('shows the title card of the class she goes into, even after a film took it away before', async () => {
      const { container } = renderUI(<Harness />, 'en')
      await settle()
      startAt(4)
      await settle()
      act(() => transitionStore.getState().finish())
      expect(container.querySelector('.stage-card')).toBeNull()
      act(() => gameStore.getState().enterStage(1))
      await settle()
      expect(container.querySelector('.stage-card')).toBeTruthy()
    })

    it('what the unicorns say there is a greeting for a finished class, and nothing is asked: talking ends with the greeting', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      startAt(5)
      await settle()
      act(() => transitionStore.getState().finish())
      act(() => gameStore.getState().enterStage(1))
      await settle()
      act(() => view.onTrigger!('npc', npc(1, 0).id))
      expect(gameStore.getState().phase).toBe('talking')
      const dialog = screen.getByRole('dialog')
      expect(dialog.textContent).toMatch(/Hello, Amara!|already|Well done|Lovely|schoolyard/)
      // The first press finishes the typing, the second goes on: there is no question after it.
      fireEvent.keyDown(window, { key: 'e' })
      fireEvent.keyDown(window, { key: 'e' })
      expect(gameStore.getState().phase).toBe('exploring')
      expect(screen.queryByRole('dialog', { name: /./ })).toBeNull()
      expect(gameStore.getState().answered.size).toBe((STAGES[1].npcs ?? []).length + (STAGES[1].gates ?? []).length)
    })

    it('in a class she is playing the greeting is still the usual one, and the question comes next', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      talkTo(0, 0)
      expect(screen.getByRole('dialog', { name: /./ })).toBeTruthy()
      expect(gameStore.getState().phase).toBe('asking')
    })
  })

  describe('a question answered by typing a number', () => {
    // Stage 3 asks its four sums that way; stage 1 still shows the answers to pick from.
    const typeNumber = (text: string) => {
      for (const d of text) fireEvent.click(screen.getByRole('button', { name: d }))
      fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    }
    const rightNumber = (stageIndex: number, i: number) => (LOCALES.en.questions as Record<string, { choices: string[] }>)[npc(stageIndex, i).question.id].choices[rightChoice(stageIndex, i)]

    it('shows a number pad instead of the answers, and the right number is a right answer', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      act(() => gameStore.getState().jumpToStage(2))
      await settle()
      talkTo(2, 0)
      expect(screen.getByRole('status', { name: 'Your answer' })).toBeTruthy()
      expect(screen.queryByText('Which number comes after 19?')).toBeNull()
      typeNumber(rightNumber(2, 0))
      expect(gameStore.getState().phase).toBe('correct')
      expect(gameStore.getState().answered.has(npc(2, 0).id)).toBe(true)
    })

    it('a wrong number, even one that is not among the answers, is a wrong answer and she can try again', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      act(() => gameStore.getState().jumpToStage(2))
      await settle()
      talkTo(2, 0)
      typeNumber('7777')
      expect(gameStore.getState().phase).toBe('wrong')
      expect(gameStore.getState().answered.size).toBe(0)
    })

    it('a stage that has no such question is asked as before, with the answers to pick from', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      talkTo(0, 0)
      expect(screen.queryByRole('status', { name: 'Your answer' })).toBeNull()
      choose(rightChoice(0, 0))
      expect(gameStore.getState().phase).toBe('correct')
    })
  })

  it('?transition=0 turns the walk off', async () => {
    window.history.replaceState(null, '', '/?transition=0')
    renderUI(<Harness />, 'en')
    await settle()
    act(() => gameStore.getState().jumpToStage(6))
    await settle()
    expect(isTransitioning()).toBe(false)
    expect(screen.getByText('Stage 7 of 15: Science')).toBeTruthy()
  })

  it('the stage picker is in the gear menu, not on the screen', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    expect(screen.queryByText('the stage picker')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByText('the stage picker')).toBeTruthy()
  })

  /** Plays stage 15 from the first question to the last right answer. */
  async function winTheGame() {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => gameStore.getState().jumpToStage(14))
    await settle()
    // The jump gets its title card; it is over after a moment.
    await act(async () => void (await vi.advanceTimersByTimeAsync(0)))
    act(() => transitionStore.getState().finish())
    for (let i = 0; i < 4; i++) {
      talkTo(14, i)
      choose(rightChoice(14, i))
      await act(async () => void (await vi.advanceTimersByTimeAsync(1700)))
    }
  }

  it('finishing a stage: "Stage complete!" with the sticker, then a still title card, then the next classroom', async () => {
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    for (let i = 0; i < 4; i++) {
      talkTo(0, i)
      choose(rightChoice(0, i))
      if (i < 3) await act(async () => void (await vi.advanceTimersByTimeAsync(1700)))
    }
    // The game is already in stage 2; the card covers it.
    expect(gameStore.getState().stageIndex).toBe(1)
    expect(isTransitioning()).toBe(true)
    expect(screen.getByRole('dialog', { name: 'Stage complete!' })).toBeTruthy()
    // The "Right!" banner of the last answer does not show through.
    expect(screen.queryByRole('heading', { name: 'Correct!' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /To the next class/ }))
    expect(container.querySelector('.transition__card')).toBeTruthy()
    expect(isTransitioning()).toBe(true)
    await act(async () => void (await vi.advanceTimersByTimeAsync(REDUCED_MS + 50)))
    expect(isTransitioning()).toBe(false)
    expect(container.querySelector('.transition')).toBeNull()
    expect(view.stageName).toBe('stage2')
    // The opening card is only for the first stage: not shown a second time.
    expect(container.querySelector('.stage-card')).toBeNull()
    expect(screen.getByText('Stage 2 of 15: Maths')).toBeTruthy()
  })

  it('the stage-complete card does not wait for ever', async () => {
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    for (let i = 0; i < 4; i++) {
      talkTo(0, i)
      choose(rightChoice(0, i))
      if (i < 3) await act(async () => void (await vi.advanceTimersByTimeAsync(1700)))
    }
    await act(async () => void (await vi.advanceTimersByTimeAsync(DONE_MS + 50)))
    expect(container.querySelector('.transition__card')).toBeTruthy()
  })

  it('a jump to another stage (the gear menu) gets the still title card but not the "Stage complete!" card', async () => {
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    act(() => gameStore.getState().jumpToStage(6))
    await settle()
    expect(isTransitioning()).toBe(true)
    expect(container.querySelector('.transition__card-stage')?.textContent).toBe('Stage 7 of 15')
    expect(screen.queryByRole('dialog', { name: 'Stage complete!' })).toBeNull()
  })

  it('the last answer of the last stage: "Correct!", then the finale with the album (no ending film in the 2D game), and "Play again" starts over', async () => {
    await winTheGame()
    expect(screen.getByRole('dialog', { name: /You did it, Amara!/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sticker album' }))
    // the album shows every sticker there is (as the book in the menu does), with the ones she has won in colour
    expect(screen.getByText(new RegExp(`^\\d+ of ${TOTAL_STICKERS} stickers$`))).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
    expect(gameStore.getState().stageIndex).toBe(0)
    expect(screen.queryByRole('dialog', { name: /You did it/ })).toBeNull()
  })

  it('"Keep playing for 100 %" on the finale card closes it and goes on in the school, with everything still done', async () => {
    await winTheGame()
    expect(screen.getByText(/Look for the stickers you are missing/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep playing for 100 %' }))
    expect(screen.queryByRole('dialog', { name: /You did it/ })).toBeNull()
    expect(gameStore.getState()).toMatchObject({ phase: 'exploring', popup: null })
    // she is back in the school: the "What is left?" list says every class is done and points to the stickers
    fireEvent.click(screen.getByRole('button', { name: 'What is left?' }))
    expect(screen.getByText('All classes are done!')).toBeTruthy()
  })

  it('the last class finished while others are still to do is not the ending: "Class done!", and "Show me" lists the classes that are left', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    // she goes straight into the last class from the corridor: the classes before it are not done
    act(() => gameStore.getState().enterStage(14))
    await settle()
    for (let i = 0; i < 4; i++) {
      talkTo(14, i)
      choose(rightChoice(14, i))
      if (i < 3) await act(async () => void (await vi.advanceTimersByTimeAsync(1700)))
    }
    expect(screen.getByRole('heading', { name: 'Class done!' })).toBeTruthy()
    expect(screen.getByText('But the school is not finished yet: 14 classes are still waiting for you.')).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: /You did it/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }))
    expect(screen.getByRole('dialog', { name: /Classes still to do/ })).toBeTruthy()
    expect(screen.getByText('14 classes still to do')).toBeTruthy()
    // she goes to the first one from the list, and the game goes on there
    fireEvent.click(screen.getAllByRole('button', { name: 'Go' })[0])
    expect(gameStore.getState().stageIndex).toBe(0)
    expect(screen.queryByRole('dialog', { name: /Classes still to do/ })).toBeNull()
  })

  it('finishing a class goes on to the next one still to do: the ones already done are skipped', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    // class 2 and 3 are done already (she did them first): finishing class 1 goes on to class 4
    act(() => gameStore.setState({ solved: new Set([...(STAGES[1].npcs ?? []), ...(STAGES[2].npcs ?? [])].map((n) => n.id)) }))
    await settle()
    for (let i = 0; i < 4; i++) {
      talkTo(0, i)
      choose(rightChoice(0, i))
      await act(async () => void (await vi.advanceTimersByTimeAsync(1700)))
    }
    expect(gameStore.getState().stageIndex).toBe(3)
  })

  it('the "What is left?" button in the bar opens the list and the game waits behind it', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'What is left?' }))
    expect(screen.getByRole('dialog', { name: /Classes still to do/ })).toBeTruthy()
    expect(screen.getByText('15 classes still to do')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Back to the game/ }))
    expect(screen.queryByRole('dialog', { name: /Classes still to do/ })).toBeNull()
  })






  it('muting sound and changing language keep the game going', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Turn sound off' }))
    expect(soundSettings.getState().muted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Language/ }))
    fireEvent.click(screen.getByRole('option', { name: /Português/ }))
    expect(screen.getAllByText(/Fase 1 de 15/).length).toBeGreaterThan(0)
  })

  it('the buttons and the stage status are outside the game frame: the playfield is free', async () => {
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    const frame = container.querySelector('.game-frame')!
    const bar = container.querySelector('.control-bar')!
    expect(bar).toBeTruthy()
    expect(frame.contains(bar)).toBe(false)
    expect(frame.querySelector('.frame-toggles')).toBeNull()
    expect(frame.getAttribute('data-overlay')).toBeNull()
    // the stage's name, stars and the school's dots are in the bar, and not over the game
    expect(bar.querySelector('.hud')).not.toBeNull()
    expect(frame.querySelector('.hud')).toBeNull()
  })

  it('the status is only for a classroom: in the yard, the library and the corridor the bar has none', async () => {
    setReducedMotion(true)
    const { container } = renderUI(<Harness />, 'en')
    await settle()
    expect(container.querySelector('.control-bar .hud')).not.toBeNull()
    act(() => void placeStore.getState().go('yard'))
    await settle()
    expect(container.querySelector('.control-bar .hud')).toBeNull()
    expect(container.querySelector('.control-bar__status')).toBeNull()
    act(() => void placeStore.getState().go('class'))
    await settle()
    expect(container.querySelector('.control-bar .hud')).not.toBeNull()
  })

  it('the pause button outside the game stops it with a menu, and "Keep playing" goes on', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    expect(screen.queryByRole('dialog', { name: /Pause/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Pause the game' }))
    expect(pauseStore.getState().paused).toBe(true)
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Keep playing/ }))
    expect(pauseStore.getState().paused).toBe(false)
    expect(screen.queryByRole('dialog', { name: /Pause/ })).toBeNull()
  })

  it('P and Escape pause a stage, and Escape goes on', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: /Pause/ })).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(true)
  })

  it('the sticker button opens the sticker book in place of the pause menu, and "Back to the game" goes on', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Sticker book' }))
    expect(pauseStore.getState().paused).toBe(true)
    expect(screen.getByRole('dialog', { name: 'My sticker book' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: /Pause/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Back to the game/ }))
    expect(pauseStore.getState().paused).toBe(false)
    expect(screen.queryByRole('dialog', { name: 'My sticker book' })).toBeNull()
  })

  it('Escape closes the sticker book and goes on, and the next pause shows the pause menu, not the book', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Sticker book' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(pauseStore.getState().paused).toBe(false)
    expect(stickerStore.getState().bookOpen).toBe(false)
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'My sticker book' })).toBeNull()
  })

  it('the book shows the classes she has finished', async () => {
    gameStore.setState({ ...createInitialState(STAGES, { stageIndex: 3, answeredIds: [] }) })
    renderUI(<Harness />, 'en')
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Sticker book' }))
    expect(screen.getByText(/^3 of \d+ stickers/)).toBeTruthy()
  })


  it('hands the browser scripts the sticker store too', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    expect((window as unknown as { __unicornGame: { stickers: unknown } }).__unicornGame.stickers).toBe(stickerStore)
  })


  it('the pause menu is in the language of the game', async () => {
    renderUI(<Harness />, 'de')
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Spiel anhalten' }))
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Weiterspielen/ })).toBeTruthy()
  })

  it('draws the buttons into the slot the page gives it, and nowhere while the page has none yet', async () => {
    const slot = document.createElement('div')
    document.body.appendChild(slot)
    const view = renderUI(<Harness controlsSlot={slot} />, 'en')
    await settle()
    expect(slot.querySelector('.control-bar')).toBeTruthy()
    expect(view.container.querySelector('.control-bar')).toBeNull()
    view.unmount()
    const waiting = renderUI(<Harness controlsSlot={null} />, 'en')
    await settle()
    expect(document.querySelector('.control-bar')).toBeNull()
    waiting.unmount()
    slot.remove()
  })

  it('hands the browser scripts the live game store in development, and with ?e2e in the address', async () => {
    delete (window as unknown as Record<string, unknown>).__unicornGame
    renderUI(<Harness />, 'en')
    await settle()
    const hook = (window as unknown as { __unicornGame?: { store: unknown; moves: unknown } }).__unicornGame
    expect(hook?.store).toBe(gameStore)
    expect(hook?.moves).toBe(moveStore)
  })

  it('in the shipped game it hides the store unless the address asks for it', async () => {
    vi.stubEnv('DEV', false)
    delete (window as unknown as Record<string, unknown>).__unicornGame
    const { unmount } = renderUI(<Harness />, 'en')
    await settle()
    expect((window as unknown as Record<string, unknown>).__unicornGame).toBeUndefined()
    unmount()
    window.history.replaceState(null, '', '/?e2e')
    renderUI(<Harness />, 'en')
    await settle()
    expect((window as unknown as { __unicornGame?: { store: unknown } }).__unicornGame?.store).toBe(gameStore)
    window.history.replaceState(null, '', '/')
    vi.unstubAllEnvs()
  })

  it('opens no question for a unicorn that is not in this stage', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => view.onTrigger!('npc', 'no-such-unicorn'))
    expect(screen.queryByRole('dialog', { name: /./ })).toBeNull()
  })



  describe("The hero's moves on the Space bar", () => {
    const space = () => fireEvent.keyDown(window, { key: ' ' })

    it('does nothing in the 2D view, where she is not drawn', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      space()
      expect(moveStore.getState().current).toBeNull()
    })
  })

  describe('the pictures come a stage at a time', () => {
    it('waits for the pictures of the stage on the loading screen, then shows the game', async () => {
      imageCalls.hold = true
      renderUI(<Harness />, 'en')
      await settle()
      expect(document.querySelector('.loading')).not.toBeNull()
      await act(async () => {
        imageCalls.release.splice(0).forEach((r) => r())
        await vi.advanceTimersByTimeAsync(10)
      })
      expect(document.querySelector('.loading')).toBeNull()
      expect(screen.getByTestId('view')).toBeTruthy()
      expect(imageCalls.keys[0]).toEqual(['stage1Background', 'stage1Npc1', 'stage1Npc2', 'stage1Npc3', 'stage1Npc4', 'player1'])
    })

    it('fetches the next stage when the browser has time, and a stage she jumps to when she gets there', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      expect(imageCalls.keys).toHaveLength(1)
      await act(async () => void vi.advanceTimersByTimeAsync(5000))
      expect(imageCalls.keys.at(-1)).toContain('stage2Background')
      act(() => void gameStore.getState().dispatch({ type: 'JUMP_TO_STAGE', stageIndex: 4 }))
      await settle()
      expect(imageCalls.keys.flat()).toContain('stage5Background')
      // not a picture that is already in
      expect(imageCalls.keys.slice(1).flat()).not.toContain('player1')
    })

    it('the music files are set up but download nothing until played (no stage music is fetched by the shell)', async () => {
      renderUI(<Harness />, 'en')
      await settle()
      expect(imageCalls.keys.flat().some((k) => /m4a|mp4/.test(k))).toBe(false)
    })
  })
})

describe('GameShell: the yard, the library and the corridor are drawn in 2D', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    setReducedMotion(false)
  })

  it('the classroom is drawn in the classroom, not a place', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    expect(screen.getByTestId('view')).toBeTruthy()
    expect(screen.queryByTestId('place-view-2d')).toBeNull()
  })

  it.each(['yard', 'library'] as const)('the %s is drawn as a place of its own, not as the classroom', async (to) => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => void placeStore.getState().go('yard'))
    await settle()
    if (to === 'library') {
      act(() => void placeStore.getState().go('library'))
      await settle()
    }
    expect(screen.getByTestId('place-view-2d').getAttribute('data-place')).toBe(to)
    expect(screen.queryByTestId('view')).toBeNull()
    expect(place2dView.stageIndex).toBe(0)
  })

  it('a door takes her through at once: there is no film of the walk in the 2D game', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => void placeStore.getState().go('yard'))
    await settle()
    expect(placeStore.getState().place).toBe('yard')
    expect(placeStore.getState().trip).toBeNull()
  })

  it('the corridor is drawn too, and she comes into it from the class she was in', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => void placeStore.getState().go('hall'))
    await settle()
    expect(screen.getByTestId('place-view-2d').getAttribute('data-place')).toBe('hall')
    expect(place2dView.from).toBe('class')
  })

  it('a door of the corridor to a class takes her into that class and the game enters it', async () => {
    renderUI(<Harness />, 'en')
    await settle()
    act(() => gameStore.getState().jumpToStage(3))
    await settle()
    act(() => void placeStore.getState().go('hall'))
    await settle()
    act(() => void placeStore.getState().go('class', 1))
    await settle()
    expect(screen.getByTestId('view')).toBeTruthy()
    expect(gameStore.getState().stageIndex).toBe(1)
  })
})
