import { describe, expect, it } from 'vitest'
import { roomsOpen } from './roomsOpen'

describe('roomsOpen: the special rooms are open for everybody', () => {
  it('is open with nothing in the address, and with anything but ?rooms=0', () => {
    expect(roomsOpen('')).toBe(true)
    expect(roomsOpen('?view=3d')).toBe(true)
    expect(roomsOpen('?rooms')).toBe(true)
    expect(roomsOpen('?intro=0&rooms=1')).toBe(true)
  })

  it('is closed with ?rooms=0', () => {
    expect(roomsOpen('?rooms=0')).toBe(false)
    expect(roomsOpen('?intro=0&rooms=0&view=3d')).toBe(false)
  })

  it('reads the address of the page by default', () => {
    expect(roomsOpen()).toBe(true)
  })
})
