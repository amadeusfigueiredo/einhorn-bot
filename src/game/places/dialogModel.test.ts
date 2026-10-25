import { describe, expect, it } from 'vitest'
import { FRIEND_DAY, READING_UNICORN, type Dialog } from './data/hangouts'
import { choose, currentNode, lineOf, optionLabels, startTalk } from './dialogModel'

describe('a talk', () => {
  it('starts at the start', () => {
    const talk = startTalk(FRIEND_DAY)
    expect(talk.node).toBe('start')
    expect(currentNode(talk)).toBe(FRIEND_DAY.start)
  })

  it('cannot start without a start', () => {
    expect(() => startTalk({ other: { text: { de: '', pt: '', en: '' }, options: [] } })).toThrow(/start/)
  })

  it('reads the line in her language with her name in it', () => {
    const talk = startTalk(FRIEND_DAY)
    expect(lineOf(talk, 'en', 'Mia')).toBe('Hi Mia! Are you having a nice day today?')
    expect(lineOf(talk, 'de', 'Mia')).toBe('Hallo Mia! Hast du heute einen schönen Tag?')
    expect(lineOf(talk, 'pt', 'Mia')).toBe('Oi Mia! Você está tendo um dia bom hoje?')
  })

  it('reads fine without a name: no gap before the "!"', () => {
    const talk = startTalk(FRIEND_DAY)
    expect(lineOf(talk, 'en', null)).toBe('Hi! Are you having a nice day today?')
    expect(lineOf(talk, 'de', '')).toBe('Hallo! Hast du heute einen schönen Tag?')
  })

  it('collapses a doubled space and a space before a comma', () => {
    const d: Dialog = { start: { text: { de: 'a {name} , b', pt: 'a  b', en: 'x' }, options: [{ label: { de: '', pt: '', en: '' } }] } }
    expect(lineOf(startTalk(d), 'de', null)).toBe('a, b')
    expect(lineOf(startTalk(d), 'pt', null)).toBe('a b')
  })

  it('lists the options in her language', () => {
    expect(optionLabels(startTalk(FRIEND_DAY), 'en')).toEqual(['Yes, great!', 'Not so good …'])
    expect(optionLabels(startTalk(FRIEND_DAY), 'de')).toEqual(['Ja, super!', 'Nicht so gut …'])
  })

  it('goes on to the node an option names, and hands back its effect', () => {
    const talk = startTalk(FRIEND_DAY)
    const yes = choose(talk, 0)
    expect(yes.talk?.node).toBe('yes')
    expect(yes.effect).toBe('yay')
    const no = choose(talk, 1)
    expect(no.talk?.node).toBe('no')
    expect(no.effect).toBe('hug')
  })

  it('is over when the option names no next node', () => {
    const end = choose({ dialog: FRIEND_DAY, node: 'yes' }, 0)
    expect(end.talk).toBeNull()
    expect(end.effect).toBeUndefined()
  })

  it('hands back the book to glow', () => {
    const chosen = choose(startTalk(READING_UNICORN), 1)
    expect(chosen).toMatchObject({ effect: 'highlightBook', book: 3 })
  })

  it('says so when the choice or the node is not there', () => {
    expect(() => choose(startTalk(FRIEND_DAY), 5)).toThrow(/no option/)
    expect(() => currentNode({ dialog: FRIEND_DAY, node: 'nowhere' })).toThrow(/no node/)
  })
})
