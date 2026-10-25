// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

/** A browser that refuses the page's storage (private windows, blocked site data): reading it throws. */
const refuseStorage = () => {
  // (and there is no canvas to draw on in this test window)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  return vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new Error('storage is blocked')
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('a browser that refuses storage', () => {
  it('the language still works, and falls back to the browser language or German', async () => {
    refuseStorage()
    vi.resetModules()
    const { languageSettings } = await import('./i18n/language')
    expect(['de', 'pt', 'en']).toContain(languageSettings.getState().lang)
    expect(() => languageSettings.getState().setLang('pt')).not.toThrow()
    expect(languageSettings.getState().lang).toBe('pt')
  })

  it('the name still works for the visit, without being saved', async () => {
    refuseStorage()
    vi.resetModules()
    const { profileStore } = await import('./player/playerName')
    expect(() => profileStore.getState().setName('Mia')).not.toThrow()
    expect(profileStore.getState().name).toBe('Mia')
  })
})
