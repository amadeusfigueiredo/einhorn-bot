// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { languageSettings } from '../i18n/language'
import { heroSettings } from '../player/heroSettings'

import { PreviewPlaceholder, StartMenu } from './StartMenu'

cleanupAfterEach()
beforeEach(() => {
  act(() => languageSettings.getState().setLang('en'))
  act(() => heroSettings.getState().setHero('amara'))
})
afterEach(() => {
  act(() => languageSettings.getState().setLang('en'))
  act(() => heroSettings.getState().setHero('amara'))
})

const menu = (onStart = vi.fn()) => ({ onStart, ...renderUI(<StartMenu onStart={onStart} />, 'en') })
const toHeroStep = (lang = 'English') => fireEvent.click(screen.getByRole('button', { name: lang }))

describe('StartMenu: the pictures of the heroes', () => {
  it('draws the hero as an emoji where the 3D game has its small 3D picture', () => {
    menu()
    expect(screen.getByRole('button', { name: 'English' })).toBeTruthy()
    expect(document.querySelector('.hero-placeholder')?.textContent).toBe('👧')
  })

  it('the stand-ins are a girl for Amara and a unicorn for the unicorn, hidden from screen readers (the card has its own name)', () => {
    const { container } = render(
      <>
        <PreviewPlaceholder hero="amara" />
        <PreviewPlaceholder hero="unicorn" />
      </>
    )
    const marks = [...container.querySelectorAll('.hero-placeholder')]
    expect(marks.map((e) => e.textContent)).toEqual(['👧', '🦄'])
    expect(marks.every((e) => e.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})

describe('StartMenu: the language step', () => {
  it('is a dialog with the title, Amara waving, and one big button for each language, each written in its own', () => {
    menu()
    expect(screen.getByRole('dialog', { name: 'Start menu' }).getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Unicorn Dream School' })).toBeTruthy()
    expect(screen.getByText("Amara's")).toBeTruthy()
    for (const name of ['Deutsch', 'Português', 'English']) expect(screen.getByRole('button', { name })).toBeTruthy()
  })

  it('names the language in all three languages, so a child who cannot read the page finds hers', () => {
    menu()
    expect(screen.getByText('Sprache · Idioma · Language')).toBeTruthy()
  })

  it('has the focus on the language in use, so Enter goes on at once', () => {
    menu()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'English' }))
  })

  it('marks the language in use', () => {
    menu()
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('button', { name: 'Deutsch' }).getAttribute('aria-current')).toBeNull()
  })

  it('a language takes effect at once for the whole game, and the menu goes on to the heroes in it', () => {
    menu()
    toHeroStep('Português')
    expect(languageSettings.getState().lang).toBe('pt')
    expect(screen.getByRole('heading', { name: 'Com quem você joga?' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Vamos lá!/ })).toBeTruthy()
  })

  it('speaks German as the language of the game', () => {
    act(() => languageSettings.getState().setLang('de'))
    renderUI(<StartMenu onStart={() => {}} />, 'de')
    expect(screen.getByText('Amaras')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Startmenü' })).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Deutsch' }))
  })
})

describe('StartMenu: the hero step', () => {
  it('asks who is played, with Amara and the unicorn as two cards, and says the friend walks along', () => {
    menu()
    toHeroStep()
    expect(screen.getByRole('heading', { name: 'Who do you play?' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Amara/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Unicorn/ })).toBeTruthy()
    expect(screen.getByText('Your friend always walks along!')).toBeTruthy()
  })

  it('marks the saved hero, and has the focus on it', () => {
    act(() => heroSettings.getState().setHero('unicorn'))
    menu()
    toHeroStep()
    expect(screen.getByRole('button', { name: /Unicorn/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /Amara/ }).getAttribute('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Unicorn/ }))
  })

  it('a card takes effect at once', () => {
    menu()
    toHeroStep()
    fireEvent.click(screen.getByRole('button', { name: /Unicorn/ }))
    expect(heroSettings.getState().hero).toBe('unicorn')
    expect(screen.getByRole('button', { name: /Unicorn/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /Amara/ }).getAttribute('aria-pressed')).toBe('false')
  })

  it('"Let\'s go!" starts the game (the 2D game has no intro film, and no button for one)', () => {
    const { onStart } = menu()
    toHeroStep()
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Watch the intro' })).toBeNull()
  })

  it('goes back to the languages with the button, or with Escape, and nowhere else with Escape', () => {
    const { onStart } = menu()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('heading', { name: 'Unicorn Dream School' })).toBeTruthy()
    toHeroStep()
    fireEvent.click(screen.getByRole('button', { name: /Language/ }))
    expect(screen.getByRole('heading', { name: 'Unicorn Dream School' })).toBeTruthy()
    toHeroStep()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('heading', { name: 'Unicorn Dream School' })).toBeTruthy()
    expect(onStart).not.toHaveBeenCalled()
  })

  it('speaks Portuguese and German on the way', () => {
    const pt = menu()
    toHeroStep('Português')
    expect(screen.getByRole('button', { name: /Unicórnio/ })).toBeTruthy()
    expect(screen.getByText('Seu amigo vai sempre junto!')).toBeTruthy()
    pt.unmount()
    act(() => languageSettings.getState().setLang('de'))
    renderUI(<StartMenu onStart={() => {}} />, 'de')
    fireEvent.click(screen.getByRole('button', { name: 'Deutsch' }))
    expect(screen.getByRole('button', { name: /Einhorn/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: "Los geht's!" })).toBeTruthy()
  })

  it('stops listening to Escape when it goes away', () => {
    const view = menu()
    view.unmount()
    expect(() => fireEvent.keyDown(window, { key: 'Escape' })).not.toThrow()
  })
})
