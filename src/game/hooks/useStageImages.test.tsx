// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { LoaderImageAssets, StageConfig } from '../types'
import { useStageImages } from './useStageImages'

const loader = vi.hoisted(() => ({ calls: [] as string[][], release: [] as (() => void)[], fail: false }))
vi.mock('../utils/loader', async (orig) => ({
  ...(await orig<typeof import('../utils/loader')>()),
  loadImageAssets: ({ imageKeys }: { imageKeys: string[] }) => {
    loader.calls.push(imageKeys)
    return new Promise((resolve, reject) => {
      loader.release.push(() => (loader.fail ? reject(new Error('no network')) : resolve(Object.fromEntries(imageKeys.map((k) => [k, { src: `${k}.png` } as HTMLImageElement])))))
    })
  },
}))

const stage = (n: number, npcs = 3) => ({ name: `stage${n}`, background: `stage${n}Background`, npcs: Array.from({ length: npcs }, (_, i) => ({ imageKey: `stage${n}Npc${i + 1}` })) }) as unknown as StageConfig
const flush = async () => {
  while (loader.release.length) {
    const r = loader.release.shift()!
    await act(async () => {
      r()
      await Promise.resolve()
    })
  }
}

beforeEach(() => {
  loader.calls.length = 0
  loader.release.length = 0
  loader.fail = false
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (window as { requestIdleCallback?: unknown }).requestIdleCallback
  delete (window as { cancelIdleCallback?: unknown }).cancelIdleCallback
})

describe('useStageImages', () => {
  it("asks for this stage's background, its three portraits and the shared pictures, and nothing of the other stages", () => {
    renderHook(() => useStageImages({ stage: stage(1), blocking: false }))
    expect(loader.calls).toHaveLength(1)
    expect(loader.calls[0]).toEqual(['stage1Background', 'stage1Npc1', 'stage1Npc2', 'stage1Npc3', 'stage1Npc4', 'player1'])
  })

  it('a blocking game waits for them, then is loaded', async () => {
    const { result } = renderHook(() => useStageImages({ stage: stage(1), blocking: true }))
    expect(result.current.loaded).toBe(false)
    await flush()
    expect(result.current.loaded).toBe(true)
    expect(result.current.assetsRef.current.stage1Background).toBeTruthy()
  })

  it('a game that does not block is loaded at once, and the pictures arrive behind it', async () => {
    const { result } = renderHook(() => useStageImages({ stage: stage(1), blocking: false }))
    expect(result.current.loaded).toBe(true)
    expect(result.current.assetsRef.current.stage1Npc1).toBeUndefined()
    await flush()
    expect(result.current.assetsRef.current.stage1Npc1).toBeTruthy()
  })

  it('goes on (loaded, with what it has) when the pictures cannot be fetched', async () => {
    loader.fail = true
    const { result } = renderHook(() => useStageImages({ stage: stage(1), blocking: true }))
    await flush()
    expect(result.current.loaded).toBe(true)
    expect(console.warn).toHaveBeenCalled()
    expect(result.current.assetsRef.current.stage1Background).toBeUndefined()
  })

  it('fetches the pictures of the next stage when the browser is idle, not before', async () => {
    const idle: (() => void)[] = []
    window.requestIdleCallback = ((cb: () => void) => (idle.push(cb), idle.length)) as never
    window.cancelIdleCallback = (() => {}) as never
    const { result } = renderHook(() => useStageImages({ stage: stage(1), next: stage(2), blocking: false }))
    await flush()
    expect(loader.calls).toHaveLength(1)
    expect(idle).toHaveLength(1)
    await act(async () => idle[0]())
    expect(loader.calls).toHaveLength(2)
    expect(loader.calls[1]).toContain('stage2Background')
    await flush()
    expect(result.current.assetsRef.current.stage2Npc2).toBeTruthy()
  })

  it('does not fetch the next stage on a connection set to save data', async () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } })
    renderHook(() => useStageImages({ stage: stage(1), next: stage(2), blocking: false }))
    await flush()
    await act(async () => void vi.advanceTimersByTime(6000))
    expect(loader.calls).toHaveLength(1)
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined })
  })

  it('does it after a short wait where there is no idle call', async () => {
    renderHook(() => useStageImages({ stage: stage(1), next: stage(2), blocking: false }))
    await flush()
    expect(loader.calls).toHaveLength(1)
    await act(async () => void vi.advanceTimersByTime(1600))
    expect(loader.calls).toHaveLength(2)
  })

  it('does not fetch the next stage when it has been unmounted first (and gives the idle call back)', async () => {
    const cancel = vi.fn()
    window.requestIdleCallback = (() => 7) as never
    window.cancelIdleCallback = cancel as never
    const view = renderHook(() => useStageImages({ stage: stage(1), next: stage(2), blocking: false }))
    await flush()
    view.unmount()
    expect(cancel).toHaveBeenCalledWith(7)
  })

  it('drops the short wait too when it is unmounted', async () => {
    const view = renderHook(() => useStageImages({ stage: stage(1), next: stage(2), blocking: false }))
    await flush()
    view.unmount()
    await act(async () => void vi.advanceTimersByTime(3000))
    expect(loader.calls).toHaveLength(1)
  })

  it('has no next stage after the last one: nothing more to fetch', async () => {
    renderHook(() => useStageImages({ stage: stage(15), blocking: false }))
    await flush()
    await act(async () => void vi.advanceTimersByTime(5000))
    expect(loader.calls).toHaveLength(1)
  })

  it('fetches a picture once, however often it is asked for (stages 13-15 reuse the art of 1-3)', async () => {
    const view = renderHook(({ s }) => useStageImages({ stage: s, blocking: false }), { initialProps: { s: stage(1) } })
    await flush()
    view.rerender({ s: stage(2) })
    await flush()
    const sharedAgain = loader.calls.slice(1).flat()
    expect(sharedAgain).not.toContain('player1')
    expect(sharedAgain).not.toContain('stage1Npc4')
    expect(sharedAgain).toContain('stage2Background')
    view.rerender({ s: stage(1) })
    await flush()
    expect(loader.calls).toHaveLength(2)
  })

  it('a stage change asks for the new stage at once, and never shows the loading screen again', async () => {
    const view = renderHook(({ s }) => useStageImages({ stage: s, blocking: true }), { initialProps: { s: stage(1) } })
    await flush()
    expect(view.result.current.loaded).toBe(true)
    view.rerender({ s: stage(3) })
    expect(view.result.current.loaded).toBe(true)
    expect(loader.calls.at(-1)).toContain('stage3Background')
  })

  it('keeps the same pictures object for the whole game (the views hold on to it)', async () => {
    const view = renderHook(({ s }) => useStageImages({ stage: s, blocking: false }), { initialProps: { s: stage(1) } })
    const first = view.result.current.assetsRef
    await flush()
    view.rerender({ s: stage(2) })
    await flush()
    expect(view.result.current.assetsRef).toBe(first)
    const keys = Object.keys(first.current as LoaderImageAssets)
    expect(keys).toContain('stage1Background')
    expect(keys).toContain('stage2Background')
  })
})
