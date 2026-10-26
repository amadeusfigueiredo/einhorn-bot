import type { Localized } from '../i18n/languages'
import { LANGUAGES, type Lang } from '../i18n/languages'
import { translate, type MessageId, type Vars } from '../i18n/translate'
import { subjectText } from '../i18n/phrases'
import { WORLD_IDS, WORLD_NAMES } from '../data/worlds'
import { HALL_SECTIONS } from './hallLayout'

/** The name of a class (0-based) in this language: what its room is called. */
export function className(lang: Lang, index: number): string {
  return WORLD_NAMES[WORLD_IDS[index]][lang]
}

/** The sign over a class door: "3 · Moon Class". */
export function doorSignText(lang: Lang, index: number): string {
  return translate(lang, 'hall.doorSign', { n: index + 1, name: className(lang, index) })
}

/** The banner of a subject block: "Maths · 1–3". */
export function bannerText(lang: Lang, section: number): string {
  const { subject, classes } = HALL_SECTIONS[section]
  return translate(lang, 'hall.banner', { subject: subjectText((id, vars) => translate(lang, id, vars), subject), from: classes[0] + 1, to: classes[2] + 1 })
}

/** A line in all three languages at once (what a thing says out loud, see `sayStore`). */
export function saidInAll(id: MessageId, vars?: Vars): Localized {
  const text = {} as Localized
  for (const l of LANGUAGES) text[l.code] = translate(l.code, id, vars)
  return text
}
