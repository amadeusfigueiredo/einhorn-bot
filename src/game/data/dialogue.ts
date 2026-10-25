import type { Subject } from '../types'
import { LOCALES, translate, translateList } from '../i18n/translate'
import type { Lang } from '../i18n/language'
import { fillName } from '../player/playerName'

/** What every unicorn teacher is called in the speech box (German). */
export const SPEAKER_NAME = translate('de', 'dialogue.speaker')

/** German greeting templates; every language's text is in src/locales/<lang>.json. */
export const GREETINGS: Record<Subject, readonly string[]> = LOCALES.de.greetings

/** Stable pick: the same NPC always greets the same way. */
export function pickGreeting(
  subject: Subject,
  npcId: string,
  lang: Lang = 'de',
  name: string | null = null
): string {
  const options = translateList(lang, `greetings.${subject}`)
  return fillName(options[hashString(npcId) % options.length], name)
}

/** What a unicorn says to her in a class she has already finished: a greeting, never a question (the same unicorn always says the same). */
export function pickRevisitGreeting(npcId: string, lang: Lang = 'de', name: string | null = null): string {
  const options = translateList(lang, 'hall.revisit')
  return fillName(options[hashString(npcId) % options.length], name)
}

/** Small stable hash, so the same NPC or question always gets the same line. */
export function hashString(text: string): number {
  let hash = 0
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return hash
}
