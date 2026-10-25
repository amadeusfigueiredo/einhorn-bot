import { fillName } from '../player/playerName'
import type { Lang } from '../i18n/language'
import type { Dialog, DialogEffect, DialogNode, DialogOption } from './data/hangouts'

/** Where a talk is: the node she is reading. A finished talk is `null`. */
export type TalkState = { dialog: Dialog; node: string }

export function startTalk(dialog: Dialog): TalkState {
  if (!dialog.start) throw new Error('a talk needs a start')
  return { dialog, node: 'start' }
}

export function currentNode(talk: TalkState): DialogNode {
  const node = talk.dialog[talk.node]
  if (!node) throw new Error(`no node ${talk.node} in the talk`)
  return node
}

/** What she reads: the line in her language with her name in it (without a name, "Hi {name}!" reads "Hi!"). */
export function lineOf(talk: TalkState, lang: Lang, name: string | null): string {
  return fillName(currentNode(talk).text[lang], name)
    .replace(/ +([!?,.])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim()
}

/** What each option says, in her language. */
export function optionLabels(talk: TalkState, lang: Lang): string[] {
  return currentNode(talk).options.map((o) => o.label[lang])
}

export type Chosen = { talk: TalkState | null; effect?: DialogEffect; book?: number }

/** She picks option `index`: the talk goes on to its `next` node, or is over when it has none. Its effect (and book) are handed back. */
export function choose(talk: TalkState, index: number): Chosen {
  const option: DialogOption | undefined = currentNode(talk).options[index]
  if (!option) throw new Error(`no option ${index} at ${talk.node}`)
  return { talk: option.next ? { dialog: talk.dialog, node: option.next } : null, effect: option.effect, book: option.book }
}
