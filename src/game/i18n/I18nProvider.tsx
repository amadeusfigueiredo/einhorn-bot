import { useMemo, type ReactNode } from 'react'
import { useLang } from './language'
import { I18nContext, makeI18n } from './i18nContext'

/**
 * Gives components the texts of the current language (read them with
 * `useT()`). The language itself lives in `languageSettings` because the
 * canvas and 3D code read it outside React; this only re-renders its subtree
 * when the language changes.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useLang()
  const value = useMemo(() => makeI18n(lang), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
