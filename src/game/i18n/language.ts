import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { LANGUAGES, languageInfo, type Lang } from './languages'

export type { Lang } from './languages'

export const LANG_STORAGE_KEY = 'amaras-einhorn-schule:lang:v1'

export function parseLang(value: string | null | undefined): Lang | null {
  const v = value?.toLowerCase().slice(0, 2)
  return LANGUAGES.find((l) => l.code === v)?.code ?? null
}

/**
 * Which language to show. Priority: `?lang=` in the URL, then the saved
 * choice, then the browser language (if the game speaks it), then German,
 * the language the game was written in.
 */
export function resolveLang(opts: {
  search: string
  stored: string | null | undefined
  browser: string | null | undefined
}): Lang {
  return (
    parseLang(new URLSearchParams(opts.search).get('lang')) ??
    parseLang(opts.stored) ??
    parseLang(opts.browser) ??
    'de'
  )
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    return null
  }
}

function applyToDocument(lang: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = languageInfo(lang).htmlLang
}

type LangState = { lang: Lang; setLang: (lang: Lang) => void }

const initial: Lang =
  typeof window === 'undefined'
    ? 'de'
    : resolveLang({
        search: window.location.search,
        stored: readStored(),
        browser: window.navigator.language,
      })
applyToDocument(initial)

export const languageSettings = createStore<LangState>((set) => ({
  lang: initial,
  setLang: (lang) => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      /* private mode: the choice just isn't remembered */
    }
    const url = new URL(window.location.href)
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', lang)
      window.history.replaceState(null, '', url)
    }
    applyToDocument(lang)
    set({ lang })
  },
}))

export function useLang(): Lang {
  return useStore(languageSettings, (s) => s.lang)
}
