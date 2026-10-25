// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from './test/ui'
import { STAGES } from './game/constants/stages'
import { gameStore } from './game/logic/gameStore.instance'
import { introStore } from './game/intro/introStore'
import { startStore } from './game/start/startStore'
import { heroSettings } from './game/player/heroSettings'

// The game itself, the stage picker have their own tests; here only how the app puts them together.
const shell = vi.hoisted(() => ({ props: undefined as undefined | Record<string, unknown> }))
vi.mock('./game/GameShell', () => ({
  default: (props: Record<string, unknown>) => {
    shell.props = props
    return <div data-testid="game">{props.stageMenu as never}</div>
  },
}))
vi.mock('./game/start/StartMenu', () => ({
  StartMenu: ({ onStart }: { onStart: () => void }) => (
    <div data-testid="menu">
      <button onClick={onStart}>go</button>
    </div>
  ),
}))

import App from './App'

cleanupAfterEach()

function viewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

beforeEach(() => {
  viewport(1280, 720)
  act(() => gameStore.getState().jumpToStage(0))
  act(() => introStore.setState({ active: false }))
  act(() => startStore.getState().close())
})
afterEach(() => {
  viewport(1024, 768)
})

describe('App', () => {
  it('shows the title, then the game', () => {
    renderUI(<App />, 'en')
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByTestId('game')).toBeTruthy()
  })

  it('gives the game its stage, the number of the stage and the size of the window', () => {
    renderUI(<App />, 'en')
    expect(shell.props).toMatchObject({ stageIndex: 0, canvasWidth: expect.any(Number), canvasHeight: expect.any(Number) })
    expect((shell.props!.stage as { name: string }).name).toBe(STAGES[0].name)
  })

  it('follows the game to the next stage', () => {
    renderUI(<App />, 'en')
    act(() => gameStore.getState().jumpToStage(3))
    expect(shell.props!.stageIndex).toBe(3)
    expect((shell.props!.stage as { name: string }).name).toBe(STAGES[3].name)
  })

  it('puts the stage picker in the game menu, showing the right stage', () => {
    const { container } = renderUI(<App />, 'en')
    expect(container.querySelector('.stage-selector-panel')).toBeTruthy()
    expect(container.querySelector('.stage-selector-current')!.textContent).toContain(`1 / ${STAGES.length}`)
  })

  it('has no stage picker in a built game (it would skip the classes the corridor keeps locked)', () => {
    vi.stubEnv('DEV', false)
    const { container } = renderUI(<App />, 'en')
    expect(container.querySelector('.stage-selector-panel')).toBeNull()
    vi.unstubAllEnvs()
  })

  it('has the stage picker in a built game when the address says ?dev', () => {
    vi.stubEnv('DEV', false)
    window.history.replaceState(null, '', '/?dev')
    const { container } = renderUI(<App />, 'en')
    expect(container.querySelector('.stage-selector-panel')).toBeTruthy()
    window.history.replaceState(null, '', '/')
    vi.unstubAllEnvs()
  })

  it('has no "Watch the intro" button (the 2D game has no intro film)', () => {
    renderUI(<App />, 'en')
    expect(screen.queryByRole('button', { name: /intro/i })).toBeNull()
  })

  it('the picker\'s arrows move the whole game', () => {
    renderUI(<App />, 'en')
    fireEvent.click(screen.getByLabelText('Next stage'))
    expect(gameStore.getState().stageIndex).toBe(1)
    fireEvent.click(screen.getByLabelText('Previous stage'))
    expect(gameStore.getState().stageIndex).toBe(0)
  })

  it('the picker jumps to a typed stage number', () => {
    const { container } = renderUI(<App />, 'en')
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(gameStore.getState().stageIndex).toBe(4)
  })

  it('keeps the game under the start menu, so nothing has to load afterwards', () => {
    act(() => introStore.setState({ active: true }))
    renderUI(<App />, 'en')
    expect(screen.getByTestId('game')).toBeTruthy()
  })

  describe('the start menu', () => {
    it('is first, every time the game opens, and the game waits under it', () => {
      act(() => startStore.getState().open())
      renderUI(<App />, 'en')
      expect(screen.getByTestId('menu')).toBeTruthy()
      expect(screen.getByTestId('game')).toBeTruthy()
    })

    it('is not there when the game opens past it', () => {
      renderUI(<App />, 'en')
      expect(screen.queryByTestId('menu')).toBeNull()
    })

    it('"Let\'s go" closes the menu and finishes the intro that was waiting (the 2D game has no intro film), so the welcome card follows', () => {
      act(() => introStore.setState({ active: true }))
      act(() => startStore.getState().open())
      renderUI(<App />, 'en')
      fireEvent.click(screen.getByText('go'))
      expect(screen.queryByTestId('menu')).toBeNull()
      expect(introStore.getState().active).toBe(false)
    })

    it('the hero picked in the menu is the one the game is played with', () => {
      act(() => heroSettings.getState().setHero('unicorn'))
      act(() => startStore.getState().open())
      renderUI(<App />, 'en')
      fireEvent.click(screen.getByText('go'))
      expect(heroSettings.getState().hero).toBe('unicorn')
      act(() => heroSettings.getState().setHero('amara'))
    })
  })
})
