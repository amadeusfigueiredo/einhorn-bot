import { afterEach, describe, expect, it } from 'vitest'
import { effectsBus } from './effectsBus'
import { soundSettings } from './soundSettings'

/** A pretend audio context that keeps what is built on it. */
function fakeContext() {
  const made: { gain: { value: number }; to: unknown[]; connect: (x: unknown) => unknown }[] = []
  return {
    made,
    destination: { kind: 'destination' },
    createGain() {
      const node = { gain: { value: -1 }, to: [] as unknown[], connect(x: unknown) { node.to.push(x); return x } }
      made.push(node)
      return node
    },
  }
}
const ctx = (f: ReturnType<typeof fakeContext>) => f as unknown as BaseAudioContext

afterEach(() => soundSettings.getState().setEffectsVolume(1))

describe('effectsBus', () => {
  it('is one gain in front of the speakers, at the volume of the sounds', () => {
    soundSettings.getState().setEffectsVolume(0.4)
    const f = fakeContext()
    const bus = effectsBus(ctx(f)) as unknown as (typeof f.made)[number]
    expect(bus.gain.value).toBe(0.4)
    expect(bus.to).toEqual([f.destination])
  })

  it('is made once for each audio context, however many sounds ask for it', () => {
    const f = fakeContext()
    const a = effectsBus(ctx(f))
    const b = effectsBus(ctx(f))
    expect(a).toBe(b)
    expect(f.made).toHaveLength(1)
    expect(effectsBus(ctx(fakeContext()))).not.toBe(a)
  })

  it('follows the slider live: a sound that is already playing gets quieter at once', () => {
    const f = fakeContext()
    const bus = effectsBus(ctx(f)) as unknown as (typeof f.made)[number]
    soundSettings.getState().setEffectsVolume(0.1)
    expect(bus.gain.value).toBe(0.1)
    soundSettings.getState().setEffectsVolume(0.8)
    expect(bus.gain.value).toBe(0.8)
  })

  it('does not move when something else changes (the music slider, the mute)', () => {
    const f = fakeContext()
    const bus = effectsBus(ctx(f)) as unknown as (typeof f.made)[number]
    bus.gain.value = 0.55
    soundSettings.getState().setMusicVolume(0.1)
    soundSettings.getState().setMuted(true)
    soundSettings.getState().setMuted(false)
    expect(bus.gain.value).toBe(0.55)
    soundSettings.getState().setMusicVolume(0.75)
  })
})
