import { afterEach } from 'vitest'
import { cleanup, render, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from '../game/i18n/I18nProvider'
import { MotionRoot } from '../game/ui/MotionRoot'
import { languageSettings } from '../game/i18n/language'
import type { Lang } from '../game/i18n/languages'

// jsdom has no canvas. Code that probes for WebGL (the 2D/3D choice) gets "no" instead of a noisy warning.
if (typeof HTMLCanvasElement !== 'undefined') HTMLCanvasElement.prototype.getContext = (() => null) as never

// jsdom has no PointerEvent, so pointer events would lose their position and kind. A mouse event with a `pointerType` is enough.
if (typeof window !== 'undefined' && !('PointerEvent' in window)) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerType: string
    readonly pointerId: number
    constructor(type: string, init: MouseEventInit & { pointerType?: string; pointerId?: number } = {}) {
      super(type, init)
      this.pointerType = init.pointerType ?? ''
      this.pointerId = init.pointerId ?? 0
    }
  }
  Object.defineProperty(window, 'PointerEvent', { configurable: true, writable: true, value: PointerEventPolyfill })
}

export { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

/** Call once at the top of a component test file: unmounts everything after each test. */
export function cleanupAfterEach(): void {
  afterEach(() => cleanup())
}

/** Draws a component the way the game does: with texts in `lang` and the animation library set up. */
function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <MotionRoot>{children}</MotionRoot>
    </I18nProvider>
  )
}

/** (Providers are a wrapper, so `rerender(<Thing />)` keeps them too.) */
export function renderUI(ui: ReactElement, lang: Lang = 'en'): RenderResult {
  languageSettings.getState().setLang(lang)
  return render(ui, { wrapper: Providers })
}

/** A pretend `prefers-reduced-motion` for jsdom, which has no matchMedia. */
export function setReducedMotion(reduce: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  })
}
