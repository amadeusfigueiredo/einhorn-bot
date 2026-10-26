/**
 * Every language the game can be played in, in the order the dropdown lists
 * them. To add one: add an entry here and a `src/locales/<code>.json` with the
 * same ids as `de.json` (the tests check it). Names are written in their own language so a child can
 * always find theirs.
 */
export const LANGUAGES = [
  { code: 'de', name: 'Deutsch', short: 'DE', htmlLang: 'de' },
  { code: 'pt', name: 'Português', short: 'PT', htmlLang: 'pt-BR' },
  { code: 'en', name: 'English', short: 'EN', htmlLang: 'en' },
] as const

export type Lang = (typeof LANGUAGES)[number]['code']

export type LanguageInfo = (typeof LANGUAGES)[number]

export function languageInfo(lang: Lang): LanguageInfo {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]
}

/** One text in every language of the game. */
export type Localized = Record<Lang, string>
