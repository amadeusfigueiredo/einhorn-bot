// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { cleanupAfterEach, renderUI, screen } from '../../test/ui'
import { Header } from './Header'

cleanupAfterEach()

describe('Header', () => {
  it('is the title of the page, with a line under it, in each language', () => {
    for (const lang of ['de', 'pt', 'en'] as const) {
      const { unmount, container } = renderUI(<Header />, lang)
      expect(screen.getByRole('heading', { level: 1 }).textContent!.length).toBeGreaterThan(3)
      expect(container.querySelector('.app-subtitle')!.textContent!.length).toBeGreaterThan(3)
      expect(screen.getByRole('banner')).toBeTruthy()
      unmount()
    }
  })

  it('keeps the game name in every language and changes the line under it', () => {
    const read = (lang: 'de' | 'pt' | 'en') => {
      const { unmount, container } = renderUI(<Header />, lang)
      const out = { title: screen.getByRole('heading', { level: 1 }).textContent, sub: container.querySelector('.app-subtitle')!.textContent }
      unmount()
      return out
    }
    const all = (['de', 'pt', 'en'] as const).map(read)
    for (const r of all) expect(r.title).toContain('Unicorn Dream School')
    expect(new Set(all.map((r) => r.sub)).size).toBeGreaterThan(1)
  })
})
