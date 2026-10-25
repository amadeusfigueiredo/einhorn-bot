import { afterEach, describe, expect, it, vi } from 'vitest'
import { FRIEND_DAY, READING_UNICORN } from './data/hangouts'
import { onPlaceEffect } from './placeEvents'
import { stickerStore } from '../stickers/stickerStore'
import { createTalkStore, isTalking, talkStore } from './talkStore'

afterEach(() => talkStore.getState().close())

describe('the talk store', () => {
  it('has nobody talking at first', () => {
    const s = createTalkStore()
    expect(s.getState().talk).toBeNull()
  })

  it('opens a talk at its start, with who it is with', () => {
    const s = createTalkStore()
    s.getState().open('friendDay', FRIEND_DAY)
    expect(s.getState().talk).toMatchObject({ id: 'friendDay', state: { node: 'start' } })
  })

  it('goes on to the next node when she answers, and tells the room what the answer made happen', () => {
    const effects = vi.fn()
    const stop = onPlaceEffect(effects)
    const s = createTalkStore()
    s.getState().open('friendDay', FRIEND_DAY)
    s.getState().choose(0)
    expect(s.getState().talk?.state.node).toBe('yes')
    expect(effects).toHaveBeenCalledExactlyOnceWith('yay', undefined)
    stop()
  })

  it('ends the talk on an answer that has no next, with no effect', () => {
    const effects = vi.fn()
    const stop = onPlaceEffect(effects)
    const s = createTalkStore()
    s.getState().open('friendDay', FRIEND_DAY)
    s.getState().choose(1)
    s.getState().choose(0)
    expect(s.getState().talk).toBeNull()
    expect(effects).toHaveBeenCalledTimes(1)
    expect(effects).toHaveBeenCalledWith('hug', undefined)
    stop()
  })

  it('passes the book to glow along', () => {
    const effects = vi.fn()
    const stop = onPlaceEffect(effects)
    const s = createTalkStore()
    s.getState().open('readingUnicorn', READING_UNICORN)
    s.getState().choose(1)
    expect(effects).toHaveBeenCalledWith('highlightBook', 3)
    stop()
  })

  it('ignores an answer when nobody is talking', () => {
    const effects = vi.fn()
    const stop = onPlaceEffect(effects)
    const s = createTalkStore()
    s.getState().choose(0)
    expect(s.getState().talk).toBeNull()
    expect(effects).not.toHaveBeenCalled()
    stop()
  })

  it('closes', () => {
    const s = createTalkStore()
    s.getState().open('friendDay', FRIEND_DAY)
    s.getState().close()
    expect(s.getState().talk).toBeNull()
  })

  it('the shared one says whether anybody is talking', () => {
    expect(isTalking()).toBe(false)
    talkStore.getState().open('friendDay', FRIEND_DAY)
    expect(isTalking()).toBe(true)
  })
})

describe('a talk is told to the stickers', () => {
  it('when it starts, with who it is with: meeting a friend', () => {
    stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false })
    const s = createTalkStore()
    s.getState().open('friendDay', FRIEND_DAY)
    expect(stickerStore.getState().counts.talk).toBe(1)
    expect(stickerStore.getState().seen.talk).toEqual(['friendDay'])
    expect(stickerStore.getState().got).toContain('hello')
    s.getState().open('friendDay', FRIEND_DAY)
    expect(stickerStore.getState().seen.talk).toEqual(['friendDay'])
    s.getState().open('owl', READING_UNICORN)
    expect(stickerStore.getState().seen.talk).toEqual(['friendDay', 'owl'])
  })
})
