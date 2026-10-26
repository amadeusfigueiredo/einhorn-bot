import { describe, expect, it, vi } from 'vitest'
import { emitPlaceEffect, onPlaceEffect } from './placeEvents'

describe('place effects', () => {
  it('reach everyone listening, with the book if there is one', () => {
    const a = vi.fn()
    const b = vi.fn()
    const stopA = onPlaceEffect(a)
    const stopB = onPlaceEffect(b)
    emitPlaceEffect('yay')
    emitPlaceEffect('highlightBook', 3)
    expect(a).toHaveBeenNthCalledWith(1, 'yay', undefined)
    expect(a).toHaveBeenNthCalledWith(2, 'highlightBook', 3)
    expect(b).toHaveBeenCalledTimes(2)
    stopA()
    stopB()
  })

  it('stop reaching one that stopped listening', () => {
    const a = vi.fn()
    const stop = onPlaceEffect(a)
    stop()
    emitPlaceEffect('hug')
    expect(a).not.toHaveBeenCalled()
  })

  it('are fine with nobody listening, and with a listener that stops in the middle', () => {
    expect(() => emitPlaceEffect('ball')).not.toThrow()
    const calls: string[] = []
    let stopFirst = () => {}
    stopFirst = onPlaceEffect(() => {
      calls.push('first')
      stopFirst()
    })
    const stopSecond = onPlaceEffect(() => calls.push('second'))
    emitPlaceEffect('yay')
    expect(calls).toEqual(['first', 'second'])
    stopSecond()
  })
})
