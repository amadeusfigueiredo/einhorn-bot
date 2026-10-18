/**
 * Canvas drawing can't use CSS variables directly, so it reads the same
 * tokens (src/styles/tokens.css) once and caches them. The fallbacks only
 * apply when there is no DOM (unit tests) and mirror tokens.css.
 */
export type CanvasTheme = {
  night950: string
  night800: string
  dusk600: string
  dusk400: string
  moon50: string
  moon300: string
  rose400: string
  mint400: string
  gold400: string
  lilac300: string
  fontDisplay: string
  fontBody: string
}

const FALLBACK: CanvasTheme = {
  night950: '#1b1033',
  night800: '#2a1a52',
  dusk600: '#4b2f8f',
  dusk400: '#8e6be0',
  moon50: '#fff4e1',
  moon300: '#e4d3f2',
  rose400: '#ff7ec7',
  mint400: '#7be0d6',
  gold400: '#ffd166',
  lilac300: '#c9a7ff',
  fontDisplay: "'Fredoka', system-ui, sans-serif",
  fontBody: "'Andika', system-ui, sans-serif",
}

const VARS: Record<keyof CanvasTheme, string> = {
  night950: '--night-950',
  night800: '--night-800',
  dusk600: '--dusk-600',
  dusk400: '--dusk-400',
  moon50: '--moon-50',
  moon300: '--moon-300',
  rose400: '--rose-400',
  mint400: '--mint-400',
  gold400: '--gold-400',
  lilac300: '--lilac-300',
  fontDisplay: '--font-display',
  fontBody: '--font-body',
}

let cached: CanvasTheme | null = null

export function canvasTheme(): CanvasTheme {
  if (cached) return cached
  if (typeof document === 'undefined') return FALLBACK
  const style = getComputedStyle(document.documentElement)
  const theme = { ...FALLBACK }
  for (const key of Object.keys(VARS) as Array<keyof CanvasTheme>) {
    const value = style.getPropertyValue(VARS[key]).trim()
    if (value) theme[key] = value
  }
  cached = theme
  return theme
}

/** Hex colour + alpha -> rgba() string for canvas fills. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
