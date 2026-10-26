// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import useAudioManager from './useAudio'
import { DEFAULT_MUSIC_VOLUME, musicLevel, soundSettings } from '../audio/soundSettings'
import { pauseStore } from '../pause/pauseStore'
import type { LoaderAudioAssets, StageConfig } from '../types'

class FakeTrack {
  paused = true
  loop = false
  volume = 1
  currentTime = 0
  play = vi.fn(async () => {
    this.paused = false
  })
  pause = vi.fn(() => {
    this.paused = true
  })
}

const track = () => new FakeTrack() as unknown as HTMLAudioElement & FakeTrack
const stage = (name: string) => ({ name }) as unknown as StageConfig

type Tracks = { stage1: ReturnType<typeof track>; stage2: ReturnType<typeof track> }
function setup(over: { stage?: StageConfig; stageIndex?: number; audio?: LoaderAudioAssets | null } = {}) {
  const tracks: Tracks = { stage1: track(), stage2: track() }
  const audioRef = { current: over.audio === undefined ? (tracks as unknown as LoaderAudioAssets) : over.audio }
  const props = { audioRef, stage: over.stage ?? stage('stage1'), stageIndex: over.stageIndex ?? 0, assetsLoaded: true }
  const hook = renderHook((p: typeof props) => useAudioManager(p), { initialProps: props })
  return { ...hook, props, tracks, audioRef }
}

const flush = () => act(async () => {})

beforeEach(() => {
  soundSettings.getState().setMuted(false)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  soundSettings.getState().setMusicVolume(DEFAULT_MUSIC_VOLUME)
  pauseStore.getState().resume()
  cleanup()
  vi.restoreAllMocks()
})

describe('useAudioManager', () => {
  it('plays nothing until the child does something (browsers do not allow it earlier)', async () => {
    const { tracks } = setup()
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
  })

  it.each(['keydown', 'click', 'touchstart'] as const)('starts the stage music on the first %s', async (type) => {
    const { tracks } = setup()
    fireEvent(window, new Event(type))
    await flush()
    expect(tracks.stage1.play).toHaveBeenCalledTimes(1)
    expect(tracks.stage1.loop).toBe(true)
    expect(tracks.stage1.volume).toBeCloseTo(0.6)
  })

  it('plays at the volume of the music slider, not the sounds', async () => {
    soundSettings.getState().setMusicVolume(0.25)
    soundSettings.getState().setEffectsVolume(1)
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    expect(tracks.stage1.volume).toBeCloseTo(musicLevel(0.25))
    expect(tracks.stage1.volume).toBeCloseTo(0.2)
  })

  it('the music slider turns the music that is playing, at once, up and down and to silence', async () => {
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    act(() => soundSettings.getState().setMusicVolume(0.1))
    expect(tracks.stage1.volume).toBeCloseTo(musicLevel(0.1))
    act(() => soundSettings.getState().setMusicVolume(1))
    expect(tracks.stage1.volume).toBeCloseTo(0.8)
    act(() => soundSettings.getState().setMusicVolume(0))
    expect(tracks.stage1.volume).toBe(0)
  })

  it('the sounds slider leaves the music alone', async () => {
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    const before = tracks.stage1.volume
    act(() => soundSettings.getState().setEffectsVolume(0.1))
    expect(tracks.stage1.volume).toBe(before)
    act(() => soundSettings.getState().setEffectsVolume(1))
  })

  it('the slider before any music has started does not start it', async () => {
    const { tracks } = setup()
    act(() => soundSettings.getState().setMusicVolume(0.5))
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
  })

  it('does not start it a second time on later gestures', async () => {
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.click(window)
    await flush()
    expect(tracks.stage1.play).toHaveBeenCalledTimes(1)
  })

  it('a stage with its own track plays it, others take one in turn', async () => {
    const a = setup({ stage: stage('stage2'), stageIndex: 1 })
    fireEvent.click(window)
    await flush()
    expect(a.tracks.stage2.play).toHaveBeenCalledTimes(1)
    expect(a.tracks.stage1.play).not.toHaveBeenCalled()
    cleanup()
    const b = setup({ stage: stage('stageX'), stageIndex: 3 })
    fireEvent.click(window)
    await flush()
    // two tracks, stage index 3 -> the second
    expect(b.tracks.stage2.play).toHaveBeenCalledTimes(1)
  })

  it('moving to another stage stops the old music and starts the new', async () => {
    const { rerender, props, tracks } = setup()
    fireEvent.click(window)
    await flush()
    rerender({ ...props, stage: stage('stage2'), stageIndex: 1 })
    await flush()
    expect(tracks.stage1.pause).toHaveBeenCalled()
    expect(tracks.stage1.currentTime).toBe(0)
    expect(tracks.stage2.play).toHaveBeenCalledTimes(1)
  })

  it('a stage that shares the track keeps it playing without a restart', async () => {
    const { rerender, props, tracks } = setup({ stage: stage('other'), stageIndex: 0 })
    fireEvent.click(window)
    await flush()
    const before = tracks.stage1.play.mock.calls.length
    rerender({ ...props, stage: stage('other2'), stageIndex: 2 })
    await flush()
    expect(tracks.stage1.pause).not.toHaveBeenCalled()
    expect(tracks.stage1.play.mock.calls.length).toBeGreaterThanOrEqual(before)
  })

  it('muting silences the music at once, un-muting brings it back', async () => {
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    act(() => soundSettings.getState().setMuted(true))
    expect(tracks.stage1.pause).toHaveBeenCalled()
    const plays = tracks.stage1.play.mock.calls.length
    act(() => soundSettings.getState().setMuted(false))
    await flush()
    expect(tracks.stage1.play.mock.calls.length).toBe(plays + 1)
  })

  it('a pause silences the music at once, and going on brings it back', async () => {
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    act(() => pauseStore.getState().pause())
    expect(tracks.stage1.pause).toHaveBeenCalled()
    const plays = tracks.stage1.play.mock.calls.length
    act(() => pauseStore.getState().resume())
    await flush()
    expect(tracks.stage1.play.mock.calls.length).toBe(plays + 1)
  })

  it('a pause does not start music that has not started yet', async () => {
    const { tracks } = setup()
    act(() => pauseStore.getState().pause())
    fireEvent.click(window)
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
  })

  it('music stays off when the game goes on while muted', async () => {
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    act(() => soundSettings.getState().setMuted(true))
    act(() => pauseStore.getState().pause())
    const plays = tracks.stage1.play.mock.calls.length
    act(() => pauseStore.getState().resume())
    await flush()
    expect(tracks.stage1.play.mock.calls.length).toBe(plays)
  })

  it('while muted it does not even try to play', async () => {
    soundSettings.getState().setMuted(true)
    const { tracks } = setup()
    fireEvent.click(window)
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
  })

  it('un-muting before the first gesture does not start music on its own', async () => {
    const { tracks } = setup()
    act(() => soundSettings.getState().setMuted(true))
    act(() => soundSettings.getState().setMuted(false))
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
  })

  it('a browser that refuses to play is not a crash', async () => {
    const { tracks } = setup()
    tracks.stage1.play.mockRejectedValueOnce(new Error('NotAllowedError'))
    fireEvent.click(window)
    await flush()
    expect(console.warn).toHaveBeenCalled()
  })

  it('works before the music files have loaded, and when there are none', async () => {
    const { audioRef, tracks } = setup({ audio: null })
    fireEvent.click(window)
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
    audioRef.current = {} as LoaderAudioAssets
    expect(() => fireEvent.click(window)).not.toThrow()
  })

  it('enableAudioNow starts the music from a button, once the files are there', async () => {
    const { result, tracks } = setup()
    await act(async () => result.current.enableAudioNow())
    expect(tracks.stage1.play).toHaveBeenCalledTimes(1)
    expect(result.current.showEnableAudio).toBe(false)
  })

  it('enableAudioNow with no files yet only warns', async () => {
    const { result } = setup({ audio: null })
    await act(async () => result.current.enableAudioNow())
    expect(console.warn).toHaveBeenCalledWith('enableAudioNow: no assets present yet')
  })

  it('stops the music and rewinds it when the game goes away', async () => {
    const { unmount, tracks } = setup()
    fireEvent.click(window)
    await flush()
    unmount()
    expect(tracks.stage1.pause).toHaveBeenCalled()
    expect(tracks.stage1.currentTime).toBe(0)
  })

  it('stops waiting for a gesture when it goes away', async () => {
    const { unmount, tracks } = setup()
    unmount()
    fireEvent.click(window)
    await flush()
    expect(tracks.stage1.play).not.toHaveBeenCalled()
  })

  it('a refused play on the first gesture says so, and keeps going', async () => {
    const { tracks } = setup()
    tracks.stage1.play.mockRejectedValueOnce(new Error('NotAllowedError'))
    fireEvent.keyDown(window, { key: 'a' })
    await flush()
    expect(console.warn).toHaveBeenCalledWith('onFirstGesture: audio play blocked')
  })

  it('enableAudioNow says so when the browser refuses to play', async () => {
    const { result, tracks } = setup()
    tracks.stage1.play.mockRejectedValueOnce(new Error('NotAllowedError'))
    await act(async () => result.current.enableAudioNow())
    await flush()
    expect(console.warn).toHaveBeenCalledWith('enableAudioNow: audio play blocked')
  })

  it('enableAudioNow with files but none for this stage only warns, and names the stage', async () => {
    const { result } = setup({ audio: {} as LoaderAudioAssets, stage: stage('stageX') })
    await act(async () => result.current.enableAudioNow())
    expect(console.warn).toHaveBeenCalledWith('enableAudioNow: no audio found in assets for current stage', { stageName: 'stageX' })
  })

  it('a track that did not load is skipped: the next one is used', async () => {
    const stage2 = track()
    const audio = { stage1: undefined, stage2 } as unknown as LoaderAudioAssets
    const { result } = setup({ audio, stage: stage('nothing'), stageIndex: 0 })
    await act(async () => result.current.enableAudioNow())
    expect(stage2.play).toHaveBeenCalledTimes(1)
  })

  it('a stage change still goes on when the old music will not stop, and says so', async () => {
    const { result, rerender, props, tracks } = setup()
    await act(async () => result.current.enableAudioNow())
    tracks.stage1.pause.mockImplementationOnce(() => {
      throw new Error('already gone')
    })
    rerender({ ...props, stage: stage('stage2'), stageIndex: 1 })
    await flush()
    expect(console.warn).toHaveBeenCalledWith('useAudioManager: failed to stop previous audio', expect.any(Error))
    expect(tracks.stage2.play).toHaveBeenCalled()
  })

  it('a refused play after a stage change says so', async () => {
    const { result, rerender, props, tracks } = setup()
    await act(async () => result.current.enableAudioNow())
    tracks.stage2.play.mockRejectedValueOnce(new Error('NotAllowedError'))
    rerender({ ...props, stage: stage('stage2'), stageIndex: 1 })
    await flush()
    expect(console.warn).toHaveBeenCalledWith('useAudioManager: failed to autoplay after stage change')
  })

  it('a music element that breaks while the game goes away does not crash it', async () => {
    const { result, unmount, tracks } = setup()
    await act(async () => result.current.enableAudioNow())
    tracks.stage1.pause.mockImplementation(() => {
      throw new Error('gone')
    })
    expect(() => unmount()).not.toThrow()
    expect(console.error).toHaveBeenCalled()
  })

  it('un-muting after the music was allowed starts it again, un-muting before does not', async () => {
    const { result, tracks } = setup()
    await act(async () => result.current.enableAudioNow())
    act(() => soundSettings.getState().setMuted(true))
    expect(tracks.stage1.pause).toHaveBeenCalled()
    tracks.stage1.play.mockClear()
    act(() => soundSettings.getState().setMuted(false))
    await flush()
    expect(tracks.stage1.play).toHaveBeenCalledTimes(1)
  })
})
