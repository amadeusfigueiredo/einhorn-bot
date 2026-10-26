// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ reduceMotion: false, play: vi.fn(), sound: vi.fn(), voice: vi.fn(), say: vi.fn() }))
vi.mock('../utils/prefersReducedMotion', () => ({ prefersReducedMotion: () => mocks.reduceMotion }))
vi.mock('../audio/sfx', () => ({ playSfx: mocks.play }))
vi.mock('../audio/voice', () => ({ playVoice: mocks.say }))
vi.mock('../audio/soundForTransition', () => ({ soundForTransition: mocks.sound, voiceForTransition: mocks.voice }))
vi.mock('../logic/gameStore.instance', async () => {
  const { createStore } = await import('zustand/vanilla')
  return { gameStore: createStore(() => ({ popup: null, activeQuestion: null, phase: 'idle', stageIndex: 0 })) }
})

import { gameStore } from '../logic/gameStore.instance'
import { useCorrectAnswerBurst, useGameEffects, useSfx } from './useGameEffects'
import type { Particle } from '../engine/particles'
import type { StageConfig } from '../types'

const store = gameStore as unknown as { setState: (s: object) => void }
const stage = { npcs: [{ id: 'a', x: 10, y: 20 }, { id: 'b', x: 300, y: 400 }] } as unknown as StageConfig

afterEach(() => cleanup())

beforeEach(() => {
  mocks.reduceMotion = false
  mocks.play.mockClear()
  mocks.sound.mockReset()
  mocks.voice.mockReset()
  mocks.say.mockClear()
  store.setState({ popup: null, activeQuestion: null, phase: 'idle', stageIndex: 0 })
})

describe('useSfx', () => {
  it('plays the sound the game change deserves', () => {
    renderHook(() => useSfx())
    mocks.sound.mockReturnValue('correct')
    act(() => store.setState({ phase: 'correct' }))
    expect(mocks.play).toHaveBeenCalledWith('correct')
  })

  it('stays quiet when the change deserves no sound', () => {
    renderHook(() => useSfx())
    mocks.sound.mockReturnValue(null)
    act(() => store.setState({ phase: 'walking' }))
    expect(mocks.play).not.toHaveBeenCalled()
  })

  it('leaves the stage whoosh to the stage card', () => {
    renderHook(() => useSfx())
    mocks.sound.mockReturnValue('stage')
    act(() => store.setState({ stageIndex: 1 }))
    expect(mocks.play).not.toHaveBeenCalled()
  })

  it('speaks the voice the game change deserves, at its pitch, on top of the chime', () => {
    renderHook(() => useSfx())
    mocks.sound.mockReturnValue('correct')
    mocks.voice.mockReturnValue({ name: 'yay', pitch: 1.1 })
    act(() => store.setState({ phase: 'correct' }))
    expect(mocks.play).toHaveBeenCalledWith('correct')
    expect(mocks.say).toHaveBeenCalledWith('yay', 1.1)
  })

  it('says nothing when the change deserves no voice', () => {
    renderHook(() => useSfx())
    mocks.voice.mockReturnValue(null)
    act(() => store.setState({ phase: 'walking' }))
    expect(mocks.say).not.toHaveBeenCalled()
  })

  it('stops listening when it goes away', () => {
    const { unmount } = renderHook(() => useSfx())
    unmount()
    mocks.sound.mockReturnValue('correct')
    act(() => store.setState({ phase: 'x' }))
    expect(mocks.play).not.toHaveBeenCalled()
  })
})

describe('useCorrectAnswerBurst', () => {
  it('bursts at the unicorn that was just answered', () => {
    const onBurst = vi.fn()
    renderHook(() => useCorrectAnswerBurst({ current: stage }, onBurst))
    act(() => store.setState({ activeQuestion: { id: 'b' } }))
    expect(onBurst).not.toHaveBeenCalled()
    // the question closes in the same update that shows the "right" popup
    act(() => store.setState({ popup: { id: 'WIN', token: 2 }, activeQuestion: null }))
    expect(onBurst).toHaveBeenCalledTimes(1)
    expect(onBurst).toHaveBeenCalledWith(stage.npcs![1])
  })

  it('does not burst for a wrong answer', () => {
    const onBurst = vi.fn()
    renderHook(() => useCorrectAnswerBurst({ current: stage }, onBurst))
    act(() => store.setState({ activeQuestion: { id: 'a' } }))
    act(() => store.setState({ popup: { id: 'TRY_AGAIN', token: 1 }, activeQuestion: null }))
    expect(onBurst).not.toHaveBeenCalled()
  })

  it('does not burst twice for the same popup', () => {
    const onBurst = vi.fn()
    renderHook(() => useCorrectAnswerBurst({ current: stage }, onBurst))
    act(() => store.setState({ activeQuestion: { id: 'a' } }))
    act(() => store.setState({ popup: { id: 'WIN', token: 5 }, activeQuestion: null }))
    act(() => store.setState({ activeQuestion: { id: 'a' } }))
    act(() => store.setState({ phase: 'again' }))
    expect(onBurst).toHaveBeenCalledTimes(1)
  })

  it('has no sparkles with reduced motion', () => {
    mocks.reduceMotion = true
    const onBurst = vi.fn()
    renderHook(() => useCorrectAnswerBurst({ current: stage }, onBurst))
    act(() => store.setState({ activeQuestion: { id: 'a' } }))
    act(() => store.setState({ popup: { id: 'WIN', token: 1 }, activeQuestion: null }))
    expect(onBurst).not.toHaveBeenCalled()
  })

  it('does nothing when the unicorn is not on this stage', () => {
    const onBurst = vi.fn()
    renderHook(() => useCorrectAnswerBurst({ current: stage }, onBurst))
    act(() => store.setState({ activeQuestion: { id: 'ghost' } }))
    act(() => store.setState({ popup: { id: 'WIN', token: 1 }, activeQuestion: null }))
    expect(onBurst).not.toHaveBeenCalled()
  })

  it('looks at the stage as it is now', () => {
    const ref = { current: stage }
    const onBurst = vi.fn()
    renderHook(() => useCorrectAnswerBurst(ref, onBurst))
    ref.current = { npcs: [{ id: 'z', x: 7, y: 8 }] } as unknown as StageConfig
    act(() => store.setState({ activeQuestion: { id: 'z' } }))
    act(() => store.setState({ popup: { id: 'WIN', token: 1 }, activeQuestion: null }))
    expect(onBurst).toHaveBeenCalledWith({ id: 'z', x: 7, y: 8 })
  })
})

describe('useGameEffects', () => {
  it('adds a burst of sparkles to the 2D view at the unicorn that was answered', () => {
    const particlesRef = { current: [] as Particle[] }
    renderHook(() => useGameEffects({ current: stage }, particlesRef))
    act(() => store.setState({ activeQuestion: { id: 'b' } }))
    act(() => store.setState({ popup: { id: 'WIN', token: 1 }, activeQuestion: null }))
    expect(particlesRef.current.length).toBeGreaterThan(10)
    expect(particlesRef.current.every((p) => p.x === 300 && p.y === 400)).toBe(true)
  })

  it('keeps the sparkles that are already there', () => {
    const old = { x: 1, y: 1, vx: 0, vy: 0, age: 0, life: 1, size: 1, color: '#000' }
    const particlesRef = { current: [old] as Particle[] }
    renderHook(() => useGameEffects({ current: stage }, particlesRef))
    act(() => store.setState({ activeQuestion: { id: 'a' } }))
    act(() => store.setState({ popup: { id: 'WIN', token: 1 }, activeQuestion: null }))
    expect(particlesRef.current[0]).toBe(old)
    expect(particlesRef.current.length).toBeGreaterThan(1)
  })
})
