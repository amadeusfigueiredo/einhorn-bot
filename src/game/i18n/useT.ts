import { useContext } from 'react'
import { I18nContext, type I18n } from './i18nContext'

/** The current language's texts; needs an <I18nProvider> above. */
export function useT(): I18n {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useT() needs an <I18nProvider> above it')
  return value
}
