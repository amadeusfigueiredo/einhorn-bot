// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { pauseStore } from '../pause/pauseStore'
import { soundSettings } from '../audio/soundSettings'
import { heroSettings } from '../player/heroSettings'
import { startStore } from '../start/startStore'
import { PauseButton, PauseMenu } from './PauseMenu'

cleanupAfterEach()
afterEach(() => {
  startStore.getState().close()
  heroSettings.getState().setHero('amara')
  pauseStore.getState().resume()
  soundSettings.getState().setMuted(false)
})

describe('PauseButton', () => {
  it('is a round button that pauses the game', () => {
    renderUI(<PauseButton />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Pause the game' }))
    expect(pauseStore.getState().paused).toBe(true)
  })

  it('has its name in German and Portuguese', () => {
    const de = renderUI(<PauseButton />, 'de')
    expect(screen.getByRole('button', { name: 'Spiel anhalten' })).toBeTruthy()
    de.unmount()
    renderUI(<PauseButton />, 'pt')
    expect(screen.getByRole('button', { name: 'Pausar o jogo' })).toBeTruthy()
  })
})

describe('PauseMenu', () => {
  it('is a dialog called Pause that holds the page while it is open', () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    const dialog = screen.getByRole('dialog', { name: /Pause/ })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('puts the focus on "Keep playing", so Enter goes on', () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Keep playing/ }))
  })

  it('"Keep playing" ends the pause', () => {
    pauseStore.getState().pause()
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: /Keep playing/ }))
    expect(pauseStore.getState().paused).toBe(false)
  })

  it('has the language and the sound, so a child can change them while it waits', () => {
    const onUnmute = vi.fn()
    renderUI(<PauseMenu onUnmute={onUnmute} />, 'en')
    expect(screen.getByRole('button', { name: /language/i })).toBeTruthy()
    act(() => soundSettings.getState().setMuted(true))
    fireEvent.click(screen.getByRole('button', { name: /sound/i }))
    expect(soundSettings.getState().muted).toBe(false)
    expect(onUnmute).toHaveBeenCalledTimes(1)
  })

  it('lets a child change who she plays: Amara or the unicorn, the one in use marked', () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    const amara = screen.getByRole('button', { name: /Amara/ })
    const unicorn = screen.getByRole('button', { name: /Unicorn/ })
    expect(amara.getAttribute('aria-pressed')).toBe('true')
    expect(unicorn.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(unicorn)
    expect(heroSettings.getState().hero).toBe('unicorn')
    expect(unicorn.getAttribute('aria-pressed')).toBe('true')
    expect(amara.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(amara)
    expect(heroSettings.getState().hero).toBe('amara')
  })

  it('the choice is a labelled group, in the language of the game', () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'de')
    expect(screen.getByRole('group', { name: 'Mit wem spielst du?' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Einhorn/ })).toBeTruthy()
  })

  it('"Main menu" goes on playing and opens the start menu (language and hero again)', () => {
    pauseStore.getState().pause()
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Main menu' }))
    expect(pauseStore.getState().paused).toBe(false)
    expect(startStore.getState().active).toBe(true)
  })

  it('"Main menu" is in German and Portuguese too', () => {
    const de = renderUI(<PauseMenu onUnmute={() => {}} />, 'de')
    expect(screen.getByRole('button', { name: 'Hauptmenü' })).toBeTruthy()
    de.unmount()
    renderUI(<PauseMenu onUnmute={() => {}} />, 'pt')
    expect(screen.getByRole('button', { name: 'Menu principal' })).toBeTruthy()
  })

  it('has the two volumes, music and sounds, so a child can turn them while it waits', () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    expect(screen.getByRole('slider', { name: /Music/ })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /Sounds/ })).toBeTruthy()
  })

  it('tells how else to pause', () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    expect(screen.getByText('P or Esc also pauses')).toBeTruthy()
  })

  it('speaks German and Portuguese', () => {
    const de = renderUI(<PauseMenu onUnmute={() => {}} />, 'de')
    expect(screen.getByRole('button', { name: /Weiterspielen/ })).toBeTruthy()
    de.unmount()
    renderUI(<PauseMenu onUnmute={() => {}} />, 'pt')
    expect(screen.getByRole('button', { name: /Continuar a jogar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Unicórnio/ })).toBeTruthy()
  })
})

describe('the way to the corner for grown-ups', () => {
  it('is a button in the pause menu that opens the gate, and "Back" returns to the menu', async () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: /For grown-ups/ }))
    expect(await screen.findByText('Just for grown-ups')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: /Just for grown-ups/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Keep playing/ }))
  })
})

describe('the way to the wardrobe', () => {
  it('is a button in the pause menu that opens the wardrobe, and "Done" returns to the menu', async () => {
    renderUI(<PauseMenu onUnmute={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: /Dress up/ }))
    expect(await screen.findByRole('dialog', { name: /Dress-up/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('dialog', { name: /Pause/ })).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Keep playing/ }))
  })
})
