// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LANG_STORAGE_KEY, languageSettings, parseLang, resolveLang } from './language'

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('parseLang', () => {
  it.each([
    ['de', 'de'],
    ['pt', 'pt'],
    ['en', 'en'],
    ['EN', 'en'],
    ['pt-BR', 'pt'],
    ['en-GB', 'en'],
    ['de_AT', 'de'],
  ])('%s -> %s', (input, want) => {
    expect(parseLang(input)).toBe(want)
  })

  it.each([null, undefined, '', 'fr', 'x', '12'])('%s is not a language of the game', (input) => {
    expect(parseLang(input)).toBeNull()
  })
})

describe('resolveLang', () => {
  const none = { search: '', stored: null, browser: null }

  it('falls back to German, the language the game was written in', () => {
    expect(resolveLang(none)).toBe('de')
    expect(resolveLang({ search: '', stored: 'fr', browser: 'es-ES' })).toBe('de')
  })

  it('the URL beats the saved choice, which beats the browser', () => {
    expect(resolveLang({ search: '?lang=pt', stored: 'en', browser: 'de' })).toBe('pt')
    expect(resolveLang({ search: '', stored: 'en', browser: 'pt-PT' })).toBe('en')
    expect(resolveLang({ search: '', stored: null, browser: 'pt-PT' })).toBe('pt')
  })

  it('skips choices the game cannot speak instead of stopping there', () => {
    expect(resolveLang({ search: '?lang=fr', stored: 'en', browser: 'pt' })).toBe('en')
    expect(resolveLang({ search: '?lang=fr', stored: 'es', browser: 'pt' })).toBe('pt')
  })

  it('reads other parameters in the URL without being confused', () => {
    expect(resolveLang({ search: '?view=3d&lang=en&intro=0', stored: null, browser: null })).toBe('en')
  })
})

describe('languageSettings', () => {
  it('remembers the choice on this device', () => {
    languageSettings.getState().setLang('pt')
    expect(languageSettings.getState().lang).toBe('pt')
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe('pt')
  })

  it('tells the page which language it is in (for screen readers and hyphenation)', () => {
    languageSettings.getState().setLang('en')
    expect(document.documentElement.lang).toMatch(/^en/)
    languageSettings.getState().setLang('de')
    expect(document.documentElement.lang).toMatch(/^de/)
  })

  it('keeps ?lang= in the address in step, so a reload does not undo the switch', () => {
    window.history.replaceState(null, '', '/?lang=de&view=3d')
    languageSettings.getState().setLang('en')
    const url = new URL(window.location.href)
    expect(url.searchParams.get('lang')).toBe('en')
    expect(url.searchParams.get('view')).toBe('3d')
  })

  it('leaves the address alone when it had no ?lang=', () => {
    window.history.replaceState(null, '', '/?view=2d')
    languageSettings.getState().setLang('pt')
    expect(window.location.search).toBe('?view=2d')
  })

  it('still switches when the device cannot save (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => languageSettings.getState().setLang('pt')).not.toThrow()
    expect(languageSettings.getState().lang).toBe('pt')
    spy.mockRestore()
  })

  it('tells listeners when the language changes', () => {
    languageSettings.getState().setLang('de')
    const seen: string[] = []
    const stop = languageSettings.subscribe((s) => seen.push(s.lang))
    languageSettings.getState().setLang('en')
    languageSettings.getState().setLang('pt')
    stop()
    expect(seen).toEqual(['en', 'pt'])
  })
})
