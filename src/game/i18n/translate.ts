import de from '../../locales/de.json'
import pt from '../../locales/pt.json'
import en from '../../locales/en.json'
import type { Lang } from './languages'

/** The shape every locale file has; `de.json` is the source of truth. */
export type Messages = typeof de

export const LOCALES: Record<Lang, Messages> = { de, pt, en }

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never

/** Dotted ids of the leaves of `T` whose value is `Leaf`. */
type IdsOf<T, Leaf> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : T[K] extends readonly unknown[] ? never : Join<K, IdsOf<T[K], Leaf>>
}[keyof T & string]

/** Every single text, e.g. `'stage.of'`, `'nameModal.title'`. Questions are read with `questionText`. */
export type MessageId = Exclude<IdsOf<Messages, string>, `questions.${string}`>
/** Every list of texts, e.g. `'greetings.Mathematik'`, `'feedback.winLines'`. */
export type ListId = Exclude<IdsOf<Messages, readonly string[]>, `questions.${string}`>

export type Vars = Record<string, string | number>

function lookup(lang: Lang, id: string): unknown {
  let node: unknown = LOCALES[lang]
  for (const part of id.split('.')) node = (node as Record<string, unknown> | undefined)?.[part]
  return node
}

function missing(id: string): string {
  if (import.meta.env.DEV) throw new Error(`Missing translation: ${id}`)
  return id
}

/** One text with `{placeholders}` filled in. */
export function translate(lang: Lang, id: MessageId, vars?: Vars): string {
  const text = lookup(lang, id)
  if (typeof text !== 'string') return missing(id)
  return vars ? text.replace(/\{(\w+)\}/g, (all, key: string) => (key in vars ? String(vars[key]) : all)) : text
}

/** A list of texts (greetings, praise lines …). */
export function translateList(lang: Lang, id: ListId): readonly string[] {
  const list = lookup(lang, id)
  return Array.isArray(list) ? list : [missing(id)]
}

export type QuestionText = { prompt: string; choices: readonly string[] }

/** A question's prompt and choices; the right answer stays `correctIndex` in stageSpecs. */
export function questionText(lang: Lang, questionId: string): QuestionText | null {
  return (LOCALES[lang].questions as Record<string, QuestionText | undefined>)[questionId] ?? null
}
