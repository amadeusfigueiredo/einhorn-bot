import { createContext } from 'react'
import type { Lang } from './languages'
import { translate, translateList, type ListId, type MessageId, type Vars } from './translate'

export type I18n = {
  lang: Lang
  /** One text by id, e.g. `t('stage.of', { n: 3, total: 15 })`. */
  t: (id: MessageId, vars?: Vars) => string
  /** A list of texts by id, e.g. `list('feedback.winLines')`. */
  list: (id: ListId) => readonly string[]
}

export function makeI18n(lang: Lang): I18n {
  return {
    lang,
    t: (id, vars) => translate(lang, id, vars),
    list: (id) => translateList(lang, id),
  }
}

export const I18nContext = createContext<I18n | null>(null)
