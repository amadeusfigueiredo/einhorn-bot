import { describe, expect, it } from 'vitest'
import { STAGES } from '../constants/stages'
import { questionIds } from '../logic/classProgress'
import { PLAY_STICKERS, STICKER_EVENTS } from './stickerData'
import { completionPercent, whereIs, whereOf } from './whereModel'

describe('where each sticker is won', () => {
  it('every kind of event happens somewhere: no sticker is left without a place', () => {
    for (const event of STICKER_EVENTS) expect(['yard', 'library', 'pony', 'pool', 'dojo', 'dance', 'tech', 'science', 'class', 'anywhere'], event).toContain(whereOf(event))
  })

  it('washing, brushing, styling and the show are in the pony yard', () => {
    for (const event of ['wash', 'brush', 'style', 'groom', 'groomTake', 'show', 'showGold', 'companion', 'ride', 'napoleonDance', 'moonwalk', 'feed', 'feedKind', 'dinner', 'dinnerGold', 'gallop', 'gallopKind', 'race', 'raceGold'] as const) expect(whereOf(event)).toBe('pony')
    expect(whereIs('showStar')).toBe('pony')
  })

  it('swimming and the swim day are at the pool', () => {
    for (const event of ['swim', 'swimKind', 'meet', 'meetGold'] as const) expect(whereOf(event)).toBe('pool')
    expect(whereIs('meetStar')).toBe('pool')
  })

  it('manners, techniques, the kata and the belt test are in the dojo', () => {
    for (const event of ['dojo', 'dojoKind', 'kataTake', 'belt', 'beltGold'] as const) expect(whereOf(event)).toBe('dojo')
    expect(whereIs('blackBelt')).toBe('dojo')
  })

  it('ballet, hip-hop, the light-up floor and the gala are in the dance hall', () => {
    for (const event of ['groove', 'grooveKind', 'floorTake', 'gala', 'galaGold'] as const) expect(whereOf(event)).toBe('dance')
    expect(whereIs('grandGala')).toBe('dance')
  })

  it('the robot, the call, the web and the tech day are in the tech room', () => {
    for (const event of ['code', 'codeKind', 'techDay', 'techDayGold'] as const) expect(whereOf(event)).toBe('tech')
    expect(whereIs('grandTech')).toBe('tech')
  })

  it('chemistry, electricity, the planets and the lab day are in the science room', () => {
    for (const event of ['discover', 'discoverKind', 'labDay', 'labDayGold'] as const) expect(whereOf(event)).toBe('science')
    expect(whereIs('grandLab')).toBe('science')
  })

  it('the globe\'s lessons and expedition are in the library', () => {
    for (const event of ['explore', 'exploreKind', 'expedition', 'expeditionGold'] as const) expect(whereOf(event)).toBe('library')
    expect(whereIs('grandExpedition')).toBe('library')
  })

  it('the star lamp\'s lessons and night show are in the library', () => {
    for (const event of ['glow', 'glowKind', 'nightShow', 'nightShowGold'] as const) expect(whereOf(event)).toBe('library')
    expect(whereIs('grandNight')).toBe('library')
  })

  it('the games of the yard are in the yard, the books and the xylophone in the library, the questions in a classroom', () => {
    for (const event of ['kick', 'bounce', 'slide', 'swing', 'splash', 'rainbow', 'dusk', 'visitYard', 'talk', 'hug', 'cheer'] as const) expect(whereOf(event)).toBe('yard')
    for (const event of ['book', 'globe', 'lamp', 'aquarium', 'note', 'song', 'take', 'draw', 'paint', 'visitLibrary'] as const) expect(whereOf(event)).toBe('library')
    expect(whereOf('answer')).toBe('class')
    expect(whereOf('stage')).toBe('class')
    expect(whereOf('move')).toBe('anywhere')
  })

  it('tells where each play sticker is, by its id', () => {
    expect(whereIs('kicker')).toBe('yard')
    expect(whereIs('reader')).toBe('library')
    expect(whereIs('thinker')).toBe('class')
    expect(whereIs('dancer')).toBe('anywhere')
    expect(whereIs('no-such-sticker')).toBe('anywhere')
    for (const s of PLAY_STICKERS) expect(whereIs(s.id)).toBe(whereOf(s.rule.type))
  })
})

describe('how much of the whole game is done', () => {
  const everything = new Set(STAGES.flatMap(questionIds))

  it('0 at the start and 100 with every class and every sticker', () => {
    expect(completionPercent(new Set(), 0)).toBe(0)
    expect(completionPercent(everything, PLAY_STICKERS.length)).toBe(100)
  })

  it('counts the classes and the stickers together', () => {
    const total = STAGES.length + PLAY_STICKERS.length
    expect(completionPercent(new Set(questionIds(STAGES[0])), 0)).toBe(Math.round(100 / total))
    expect(completionPercent(everything, 0)).toBe(Math.round((100 * STAGES.length) / total))
    expect(completionPercent(new Set(), PLAY_STICKERS.length)).toBe(Math.round((100 * PLAY_STICKERS.length) / total))
  })

  it('never goes past 100, whatever the count it is given', () => {
    expect(completionPercent(everything, 999)).toBe(100)
  })

  it('the classes are all that counts for a class: three of four questions is not a class', () => {
    expect(completionPercent(new Set(questionIds(STAGES[0]).slice(0, 3)), 0)).toBe(0)
  })
})
