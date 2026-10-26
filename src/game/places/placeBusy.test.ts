import { afterEach, describe, expect, it } from 'vitest'
import { FRIEND_DAY } from './data/hangouts'
import { readerStore } from './library/bookReader'
import { musicStore } from './library/musicStore'
import { isBusy, registerBusy } from './placeBusy'
import { talkStore } from './talkStore'

afterEach(() => {
  talkStore.getState().close()
  readerStore.getState().close()
  musicStore.getState().close()
})

describe('isBusy', () => {
  it('is false with no talk and no book', () => {
    expect(isBusy()).toBe(false)
  })

  it('is true while she talks with a friend', () => {
    talkStore.getState().open('friendDay', FRIEND_DAY)
    expect(isBusy()).toBe(true)
  })

  it('is true while a book is open', () => {
    readerStore.getState().open(0)
    expect(isBusy()).toBe(true)
  })

  it('is false again when both are over', () => {
    talkStore.getState().open('friendDay', FRIEND_DAY)
    readerStore.getState().open(0)
    talkStore.getState().close()
    expect(isBusy()).toBe(true)
    readerStore.getState().close()
    expect(isBusy()).toBe(false)
  })

  it('is true while the xylophone is open', () => {
    musicStore.getState().openPanel()
    expect(isBusy()).toBe(true)
    musicStore.getState().close()
    expect(isBusy()).toBe(false)
  })

  it('asks whatever has said it can have the room (anything that registers), and is false for something that says no', () => {
    let busy = false
    registerBusy(() => busy)
    expect(isBusy()).toBe(false)
    busy = true
    expect(isBusy()).toBe(true)
    busy = false
  })
})
