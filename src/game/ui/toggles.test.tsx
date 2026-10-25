// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { soundSettings } from '../audio/soundSettings'
import { gameStore } from '../logic/gameStore.instance'
import { languageSettings } from '../i18n/language'
import { profileStore } from '../player/playerName'
import { LanguageSelect } from './LanguageSelect'
import { NameButton } from './NameButton'
import { ControlBar } from './ControlBar'
import { SoundToggle } from './SoundToggle'

cleanupAfterEach()
beforeEach(() => {
  soundSettings.getState().setMuted(false)
  profileStore.getState().skip()
})
afterEach(() => {
  act(() => gameStore.getState().jumpToStage(0))
})

describe('SoundToggle', () => {
  it('says that sound can be turned off while it is on', () => {
    renderUI(<SoundToggle onUnmute={() => {}} />, 'en')
    const b = screen.getByRole('button', { name: 'Turn sound off' })
    expect(b.getAttribute('aria-pressed')).toBe('false')
  })

  it('muting it keeps music quiet and says so', () => {
    const onUnmute = vi.fn()
    renderUI(<SoundToggle onUnmute={onUnmute} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Turn sound off' }))
    expect(soundSettings.getState().muted).toBe(true)
    expect(screen.getByRole('button', { name: 'Turn sound on' }).getAttribute('aria-pressed')).toBe('true')
    expect(onUnmute).not.toHaveBeenCalled()
  })

  it('turning it back on lets the music start (a tap is the moment browsers allow it)', () => {
    const onUnmute = vi.fn()
    soundSettings.getState().setMuted(true)
    renderUI(<SoundToggle onUnmute={onUnmute} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Turn sound on' }))
    expect(soundSettings.getState().muted).toBe(false)
    expect(onUnmute).toHaveBeenCalledTimes(1)
  })

  it('shows a speaker either way, with the words available', () => {
    const { container } = renderUI(<SoundToggle onUnmute={() => {}} />, 'en')
    expect(container.textContent).toContain('🔊')
    fireEvent.click(screen.getByRole('button'))
    expect(container.textContent).toContain('🔇')
    expect(container.textContent).toContain('Sound off')
  })

  it('speaks German and Portuguese', () => {
    const de = renderUI(<SoundToggle onUnmute={() => {}} />, 'de')
    expect(screen.getByRole('button').getAttribute('aria-label')).not.toBe('Turn sound off')
    de.unmount()
    renderUI(<SoundToggle onUnmute={() => {}} />, 'pt')
    expect(screen.getByRole('button').getAttribute('aria-label')!.length).toBeGreaterThan(3)
  })
})


describe('NameButton', () => {
  it('asks for a name when there is none', () => {
    renderUI(<NameButton />, 'en')
    const b = screen.getByRole('button', { name: 'Enter your name' })
    expect(b.textContent).toContain('Name')
    expect(b.querySelector('.name-toggle__avatar')?.textContent).toBe('✏️')
  })

  it('shows the child\'s name and first letter once she has one', () => {
    profileStore.getState().setName('amara')
    renderUI(<NameButton />, 'en')
    const b = screen.getByRole('button', { name: 'Change name: now amara' })
    expect(b.textContent).toContain('amara')
    expect(b.querySelector('.name-toggle__avatar')?.textContent).toBe('A')
  })

  it('opens the name dialog', () => {
    renderUI(<NameButton />, 'en')
    fireEvent.click(screen.getByRole('button'))
    expect(profileStore.getState().modalOpen).toBe(true)
    profileStore.getState().closeModal()
  })

  it('is switched off while a unicorn is talking or asking (typing would collide with the answers)', () => {
    renderUI(<NameButton />, 'en')
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false)
    act(() => {
      gameStore.getState().dispatch({ type: 'TALK', key: { kind: 'npc', id: 'stage1Npc1' } })
    })
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('LanguageSelect', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: /Language/ }))

  it('starts closed and names the current language', () => {
    languageSettings.getState().setLang('de')
    renderUI(<LanguageSelect />, 'de')
    const b = screen.getByRole('button', { name: /Deutsch/ })
    expect(b.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('compact shows the short code, the full one shows the name', () => {
    const compact = renderUI(<LanguageSelect compact />, 'en')
    expect(compact.container.textContent).toContain('EN')
    compact.unmount()
    const full = renderUI(<LanguageSelect />, 'en')
    expect(full.container.textContent).toContain('English')
  })

  it('opens a list of all three languages, each in its own language, with the current one selected', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual([expect.stringContaining('Deutsch'), expect.stringContaining('Português'), expect.stringContaining('English')])
    expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true'])
    expect(options[1].getAttribute('lang')).toBe('pt-BR')
  })

  it('a click on an option changes the language of the whole game and closes the list', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    fireEvent.click(screen.getByRole('option', { name: /Português/ }))
    expect(languageSettings.getState().lang).toBe('pt')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('the arrow keys move and Enter chooses', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const list = screen.getByRole('listbox')
    fireEvent.keyDown(list, { key: 'Home' })
    fireEvent.keyDown(list, { key: 'Enter' })
    expect(languageSettings.getState().lang).toBe('de')
  })

  it('ArrowDown on the closed button opens the list', () => {
    renderUI(<LanguageSelect />, 'en')
    fireEvent.keyDown(screen.getByRole('button', { name: /Language/ }), { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('Escape closes it without changing anything, and does not close a dialog around it', () => {
    renderUI(<div onKeyDown={() => expect.unreachable('Escape reached the dialog')}><LanguageSelect /></div>, 'en')
    open()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(languageSettings.getState().lang).toBe('en')
  })

  it('the highlighted row is announced to screen readers', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const list = screen.getByRole('listbox')
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-en$/)
    fireEvent.keyDown(list, { key: 'ArrowUp' })
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-pt$/)
  })

  it('moving the pointer highlights a row', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    fireEvent.mouseEnter(screen.getByRole('option', { name: /Deutsch/ }))
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toMatch(/-de$/)
  })

  it('clicking the button again closes the list without changing anything', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    fireEvent.click(screen.getByRole('button', { name: /Language/ }))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(languageSettings.getState().lang).toBe('en')
  })

  it('keys it does not know do nothing: they are left for the page', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const list = screen.getByRole('listbox')
    expect(fireEvent.keyDown(list, { key: 'x' })).toBe(true)
    expect(screen.getByRole('listbox')).toBe(list)
  })

  it('other keys on the closed button do not open it', () => {
    renderUI(<LanguageSelect />, 'en')
    fireEvent.keyDown(screen.getByRole('button', { name: /Language/ }), { key: 'a' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('the list takes the focus when it opens, and the button gets it back when a language is chosen', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    expect(document.activeElement).toBe(screen.getByRole('listbox'))
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Home' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: ' ' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Language|Sprache/ }))
  })

  it('Escape gives the focus back to the button; Tab just moves on and closes the list', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Language/ }))
    open()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Tab' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('the arrow keys stop at the ends of the list', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const list = screen.getByRole('listbox')
    fireEvent.keyDown(list, { key: 'End' })
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-en$/)
    fireEvent.keyDown(list, { key: 'Home' })
    fireEvent.keyDown(list, { key: 'ArrowUp' })
    expect(list.getAttribute('aria-activedescendant')).toMatch(/-de$/)
  })

  it('moving the focus out of the menu closes it, moving it inside does not', () => {
    renderUI(<div><LanguageSelect /><button type="button">elsewhere</button></div>, 'en')
    open()
    const list = screen.getByRole('listbox')
    fireEvent.blur(list, { relatedTarget: screen.getByRole('option', { name: /Deutsch/ }) })
    expect(screen.getByRole('listbox')).toBe(list)
    fireEvent.blur(list, { relatedTarget: screen.getByText('elsewhere') })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('pressing on a row does not take the focus from the list (or the tap would close it before it lands)', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const proceeded = fireEvent.mouseDown(screen.getByRole('option', { name: /Deutsch/ }))
    expect(proceeded).toBe(false)
  })

  it('the current language is marked with a tick', () => {
    renderUI(<LanguageSelect />, 'en')
    open()
    const rows = screen.getAllByRole('option')
    expect(rows.map((r) => r.textContent?.includes('✓'))).toEqual([false, false, true])
  })
})

describe('ControlBar', () => {
  const bar = (stageMenu?: ReactNode) => renderUI(<ControlBar onUnmute={() => {}} stageMenu={stageMenu} />, 'en')
  const trigger = () => screen.getByRole('button', { name: /preferences/i })

  it('holds every button of the game: sound, language, name and the stage menu', () => {
    bar(<p>stages</p>)
    expect(screen.getByRole('button', { name: /turn sound/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Volume of the music and the sounds' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /language/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /name/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy()
  })

  it('has no stage menu when there is none to show', () => {
    bar()
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()
  })

  it('the preferences button opens and closes the dropdown (the stylesheet shows it on phones only)', () => {
    const { container } = bar()
    const root = container.querySelector('.control-bar')!
    expect(root.getAttribute('data-open')).toBeNull()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger())
    expect(root.getAttribute('data-open')).toBe('true')
    expect(screen.getByRole('button', { name: 'Close the preferences' }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Close the preferences' }))
    expect(root.getAttribute('data-open')).toBeNull()
  })

  it('the trigger points at the buttons it opens', () => {
    const { container } = bar()
    expect(container.querySelector('.control-bar__items')!.id).toBe(trigger().getAttribute('aria-controls'))
  })

  it('Escape closes the dropdown, and so does a tap outside it (but not a tap on its buttons)', () => {
    const { container } = renderUI(
      <div>
        <ControlBar onUnmute={() => {}} />
        <p>elsewhere</p>
      </div>,
      'en'
    )
    const root = container.querySelector('.control-bar')!
    fireEvent.click(trigger())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(root.getAttribute('data-open')).toBeNull()
    fireEvent.click(trigger())
    fireEvent.pointerDown(screen.getByRole('button', { name: /turn sound/i }))
    expect(root.getAttribute('data-open')).toBe('true')
    fireEvent.pointerDown(container.querySelector('p')!)
    expect(root.getAttribute('data-open')).toBeNull()
  })

  it('other keys leave the dropdown open', () => {
    const { container } = bar()
    fireEvent.click(trigger())
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(container.querySelector('.control-bar')!.getAttribute('data-open')).toBe('true')
  })

  it('does not listen while closed', () => {
    const add = vi.spyOn(window, 'addEventListener')
    bar()
    expect(add.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(0)
    add.mockRestore()
  })

  it('shows the stage status (what the game gives it) first in the bar, outside the dropdown', () => {
    const { container } = renderUI(<ControlBar onUnmute={() => {}} status={<span>Stage 3</span>} />, 'en')
    const status = container.querySelector('.control-bar__status')!
    expect(status.textContent).toBe('Stage 3')
    expect(container.querySelector('.control-bar__items')!.contains(status)).toBe(false)
    expect(container.querySelector('.control-bar')!.firstElementChild).toBe(status)
  })

  it('has no status box when there is no status to show', () => {
    const { container } = bar()
    expect(container.querySelector('.control-bar__status')).toBeNull()
  })

  it('there is no switch to hide the info any more: it is not over the game', () => {
    bar()
    expect(screen.queryByRole('button', { name: /Hide the info|Show the info/ })).toBeNull()
  })

  it('keeps pause and the sticker book in the bar, and the rest in the dropdown', () => {
    const { container } = bar()
    const items = container.querySelector('.control-bar__items')!
    expect(items.contains(screen.getByRole('button', { name: /Turn sound off/ }))).toBe(true)
    expect(items.contains(screen.getByRole('button', { name: /Language/ }))).toBe(true)
    expect(items.contains(screen.getByRole('button', { name: /Pause/ }))).toBe(false)
  })

  it('speaks German and Portuguese', () => {
    const de = renderUI(<ControlBar onUnmute={() => {}} />, 'de')
    expect(screen.getByRole('button', { name: 'Einstellungen' })).toBeTruthy()
    de.unmount()
    renderUI(<ControlBar onUnmute={() => {}} />, 'pt')
    expect(screen.getByRole('button', { name: 'Preferências' })).toBeTruthy()
  })
})
