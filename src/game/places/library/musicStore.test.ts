import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMusicStore, PRESSED_MS, TAIL_MS, type MusicDeps } from './musicStore'
import { songById, songSchedule } from './xylophone'

function setup() {
  let now = 0
  const queue: { at: number; fn: () => void; id: number; live: boolean }[] = []
  let id = 0
  const played: number[] = []
  const earned: [string, string | undefined][] = []
  const deps: MusicDeps = {
    play: (bar) => void played.push(bar),
    now: () => now,
    timers: {
      set: (fn, ms) => {
        const t = { at: now + ms, fn, id: ++id, live: true }
        queue.push(t)
        return t
      },
      clear: (h) => void ((h as { live: boolean }).live = false),
    },
    earn: (type, key) => void earned.push([type, key]),
  }
  const store = createMusicStore(deps)
  /** Moves the clock on by `ms`, running what is due in order. */
  const advance = (ms: number) => {
    const target = now + ms
    for (;;) {
      const due = queue.filter((t) => t.live && t.at <= target).sort((a, b) => a.at - b.at || a.id - b.id)[0]
      if (!due) break
      due.live = false
      now = due.at
      due.fn()
    }
    now = target
  }
  return { store, advance, played, earned, setNow: (ms: number) => (now = ms), pending: () => queue.filter((t) => t.live).length }
}

describe('the music store', () => {
  it('starts closed and free, with no tune', () => {
    const { store } = setup()
    expect(store.getState()).toMatchObject({ open: false, mode: 'free', take: [], lit: null, struck: null, lesson: null, finished: false })
  })

  it('opens and closes', () => {
    const { store } = setup()
    store.getState().openPanel()
    expect(store.getState().open).toBe(true)
    store.getState().close()
    expect(store.getState().open).toBe(false)
  })

  it('opening forgets that a song was just finished', () => {
    const { store } = setup()
    store.setState({ finished: true })
    store.getState().openPanel()
    expect(store.getState().finished).toBe(false)
  })

  describe('striking a bar', () => {
    it('rings it and tells the stickers which note it was', () => {
      const { store, played, earned } = setup()
      store.getState().strike(3)
      expect(played).toEqual([3])
      expect(earned).toEqual([['note', '3']])
    })

    it('shows it pressed for a moment, and again when it is struck again', () => {
      const { store, advance } = setup()
      store.getState().strike(2)
      const first = store.getState().struck!
      expect(first.event).toBe(2)
      advance(PRESSED_MS - 10)
      expect(store.getState().struck).not.toBeNull()
      advance(20)
      expect(store.getState().struck).toBeNull()
      store.getState().strike(2)
      expect(store.getState().struck!.n).toBeGreaterThan(first.n)
    })

    it('an old press that ends does not put out a newer one', () => {
      const { store, advance } = setup()
      store.getState().strike(1)
      advance(PRESSED_MS - 20)
      store.getState().strike(4)
      advance(40)
      expect(store.getState().struck?.event).toBe(4)
      advance(PRESSED_MS)
      expect(store.getState().struck).toBeNull()
    })

    it('does not record when she is not recording', () => {
      const { store } = setup()
      store.getState().strike(1)
      expect(store.getState().take).toEqual([])
    })
  })

  describe('recording and playing back', () => {
    it('keeps the bars she strikes, with the time between them, the first at 0', () => {
      const { store, advance, setNow } = setup()
      store.getState().record()
      expect(store.getState().mode).toBe('recording')
      advance(5000)
      setNow(5000)
      store.getState().strike(0)
      advance(500)
      store.getState().strike(2)
      advance(750)
      store.getState().strike(4)
      expect(store.getState().take).toEqual([
        { event: 0, at: 0 },
        { event: 2, at: 0.5 },
        { event: 4, at: 1.25 },
      ])
    })

    it('starting again throws the old tune away', () => {
      const { store } = setup()
      store.getState().record()
      store.getState().strike(1)
      store.getState().record()
      expect(store.getState().take).toEqual([])
    })

    it('stopping keeps the tune and stops keeping bars', () => {
      const { store } = setup()
      store.getState().record()
      store.getState().strike(1)
      store.getState().stopRecording()
      expect(store.getState().mode).toBe('free')
      store.getState().strike(2)
      expect(store.getState().take).toHaveLength(1)
    })

    it('stopping when not recording changes nothing', () => {
      const { store } = setup()
      store.getState().stopRecording()
      expect(store.getState().mode).toBe('free')
    })

    it('plays the tune back note by note at the times she played them, lighting each bar', () => {
      const { store, advance, played, setNow } = setup()
      store.getState().record()
      setNow(0)
      store.getState().strike(0)
      advance(400)
      store.getState().strike(3)
      advance(600)
      store.getState().strike(5)
      store.getState().stopRecording()
      played.length = 0
      store.getState().playTake()
      expect(store.getState().mode).toBe('playing')
      advance(1)
      expect(played).toEqual([0])
      expect(store.getState().lit).toBe(0)
      advance(399)
      expect(played).toEqual([0, 3])
      expect(store.getState().lit).toBe(3)
      advance(600)
      expect(played).toEqual([0, 3, 5])
      expect(store.getState().mode).toBe('playing')
      advance(TAIL_MS + 10)
      expect(store.getState()).toMatchObject({ mode: 'free', lit: null })
    })

    it('a tune of four notes or more wins the composer sticker when it is played back, not before, and a short one does not', () => {
      const { store, advance, earned } = setup()
      store.getState().record()
      for (const bar of [0, 1, 2, 3]) {
        store.getState().strike(bar)
        advance(300)
      }
      expect(earned.some(([t]) => t === 'take')).toBe(false)
      store.getState().playTake()
      advance(3000)
      expect(earned.filter(([t]) => t === 'take')).toHaveLength(1)
      store.getState().record()
      for (const bar of [0, 1]) {
        store.getState().strike(bar)
        advance(300)
      }
      store.getState().playTake()
      advance(3000)
      expect(earned.filter(([t]) => t === 'take')).toHaveLength(1)
    })

    it('does nothing when there is no tune to play', () => {
      const { store, played } = setup()
      store.getState().playTake()
      expect(store.getState().mode).toBe('free')
      expect(played).toEqual([])
    })

    it('playing back does not count as playing notes for the stickers', () => {
      const { store, advance, earned } = setup()
      store.getState().record()
      for (const bar of [0, 1, 2, 3]) store.getState().strike(bar)
      const notes = earned.filter(([t]) => t === 'note').length
      store.getState().playTake()
      advance(3000)
      expect(earned.filter(([t]) => t === 'note')).toHaveLength(notes)
    })

    it('playing back stops a recording that was going on', () => {
      const { store } = setup()
      store.getState().record()
      store.getState().strike(1)
      store.getState().playTake()
      expect(store.getState().mode).toBe('playing')
    })
  })

  describe('listening to a song', () => {
    it('plays every note of the song in its order at its tempo, lighting each bar, and is free at the end', () => {
      const { store, advance, played } = setup()
      const song = songById('ducks')!
      const plan = songSchedule(song)
      store.getState().listen('ducks')
      expect(store.getState()).toMatchObject({ mode: 'playing', lesson: 'ducks' })
      advance(plan.at(-1)!.at * 1000 + 1)
      expect(played).toEqual(song.notes.map((n) => n.bar))
      advance(TAIL_MS + 10)
      expect(store.getState()).toMatchObject({ mode: 'free', lit: null, lesson: null })
    })

    it('does not give stickers for hearing', () => {
      const { store, advance, earned } = setup()
      store.getState().listen('twinkle')
      advance(60_000)
      expect(earned).toEqual([])
    })

    it('does nothing for a song that is not there', () => {
      const { store } = setup()
      store.getState().listen('nope')
      expect(store.getState().mode).toBe('free')
    })
  })

  describe('playing along', () => {
    const play = (store: ReturnType<typeof setup>['store'], id: string) => {
      for (const n of songById(id)!.notes) store.getState().strike(n.bar)
    }

    it('lights the first bar of the song', () => {
      const { store } = setup()
      store.getState().follow('ducks')
      expect(store.getState()).toMatchObject({ mode: 'follow', lesson: 'ducks', lit: songById('ducks')!.notes[0].bar, finished: false })
    })

    it('lights the next bar after each right one, and stays on a wrong one', () => {
      const { store } = setup()
      const notes = songById('ducks')!.notes
      store.getState().follow('ducks')
      store.getState().strike(notes[0].bar)
      expect(store.getState().lit).toBe(notes[1].bar)
      store.getState().strike((notes[1].bar + 2) % 8)
      expect(store.getState().lit).toBe(notes[1].bar)
    })

    it('a wrong bar still rings (a try is not punished)', () => {
      const { store, played } = setup()
      store.getState().follow('ducks')
      store.getState().strike(7)
      expect(played).toEqual([7])
    })

    it('playing it through finishes the song, tells the stickers once and goes back to free play', () => {
      const { store, earned } = setup()
      store.getState().follow('twinkle')
      play(store, 'twinkle')
      expect(store.getState()).toMatchObject({ mode: 'free', lit: null, lesson: null, finished: true })
      expect(earned.filter(([t]) => t === 'song')).toEqual([['song', 'twinkle']])
    })

    it('each song she finishes is told with its own name', () => {
      const { store, earned } = setup()
      for (const id of ['twinkle', 'ducks', 'joy']) {
        store.getState().follow(id)
        play(store, id)
      }
      expect(earned.filter(([t]) => t === 'song').map(([, k]) => k)).toEqual(['twinkle', 'ducks', 'joy'])
    })

    it('a bar struck after the song is over is just a note', () => {
      const { store, earned } = setup()
      store.getState().follow('ducks')
      play(store, 'ducks')
      store.getState().strike(3)
      expect(earned.filter(([t]) => t === 'song')).toHaveLength(1)
      expect(store.getState().finished).toBe(true)
    })

    it('does nothing for a song that is not there', () => {
      const { store } = setup()
      store.getState().follow('nope')
      expect(store.getState().mode).toBe('free')
    })

    it('starting another song starts it from its first bar', () => {
      const { store } = setup()
      store.getState().follow('ducks')
      store.getState().strike(songById('ducks')!.notes[0].bar)
      store.getState().follow('joy')
      expect(store.getState().lit).toBe(songById('joy')!.notes[0].bar)
      expect(store.getState().lesson).toBe('joy')
    })
  })

  describe('stopping', () => {
    it('stop puts out the lights, stops the tune and leaves nothing waiting to play', () => {
      const { store, advance, played, pending } = setup()
      store.getState().listen('twinkle')
      advance(1500)
      const heard = played.length
      store.getState().stop()
      expect(store.getState()).toMatchObject({ mode: 'free', lit: null, lesson: null, struck: null })
      expect(pending()).toBe(0)
      advance(30_000)
      expect(played).toHaveLength(heard)
    })

    it('closing the pad stops everything and keeps her tune', () => {
      const { store, advance, played } = setup()
      store.getState().record()
      store.getState().strike(1)
      store.getState().strike(2)
      store.getState().openPanel()
      store.getState().playTake()
      advance(10)
      store.getState().close()
      const heard = played.length
      advance(10_000)
      expect(played).toHaveLength(heard)
      expect(store.getState()).toMatchObject({ open: false, mode: 'free', lit: null })
      expect(store.getState().take).toHaveLength(2)
    })

    it('listening while a tune plays stops the tune', () => {
      const { store, advance, played } = setup()
      store.getState().record()
      store.getState().strike(1)
      store.getState().strike(2)
      store.getState().playTake()
      store.getState().listen('ducks')
      played.length = 0
      advance(300)
      expect(store.getState().lesson).toBe('ducks')
      expect(played).toEqual([songById('ducks')!.notes[0].bar])
    })
  })
})

describe('the real xylophone', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.doUnmock('../../audio/sfx'))

  it('rings with the audio engine, the bar as three notes, and uses the page timers', async () => {
    const calls: unknown[][] = []
    vi.doMock('../../audio/sfx', async (orig) => ({ ...(await orig<typeof import('../../audio/sfx')>()), playNotes: (notes: unknown[]) => void calls.push(notes) }))
    vi.useFakeTimers()
    const { musicStore, isMusicOpen } = await import('./musicStore')
    expect(isMusicOpen()).toBe(false)
    musicStore.getState().openPanel()
    expect(isMusicOpen()).toBe(true)
    musicStore.getState().strike(4)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toHaveLength(3)
    expect(musicStore.getState().struck?.event).toBe(4)
    vi.advanceTimersByTime(PRESSED_MS + 5)
    expect(musicStore.getState().struck).toBeNull()
    musicStore.getState().listen('ducks')
    musicStore.getState().stop()
    vi.useRealTimers()
  })
})
