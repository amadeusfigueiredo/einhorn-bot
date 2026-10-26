import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playNotes, playSfx, SEQUENCES, type Note, type Sfx } from './sfx'
import { soundSettings } from './soundSettings'

const NAMES = Object.keys(SEQUENCES) as Sfx[]

/** A pretend Web Audio API that counts what is played (one shared log: the game keeps a single audio context). */
type OscLog = { freq: number; type: string; started: number; stopped: number }
const log = { slides: [] as { from: number; to: number; at: number; end: number }[], oscillators: [] as OscLog[], resumed: 0, created: 0, gains: [] as { gain: { value: number }; to: unknown[] }[] }
let contextState: AudioContextState = 'running'

class FakeContext {
  currentTime = 10
  destination = { kind: 'destination' }
  constructor() {
    log.created++
  }
  get state() {
    return contextState
  }
  resume() {
    log.resumed++
    contextState = 'running'
    return Promise.resolve()
  }
  createOscillator() {
    const o = { frequency: {
        value: 0,
        setValueAtTime: (f: number, t: number) => void log.slides.push({ from: f, to: 0, at: t, end: 0 }),
        exponentialRampToValueAtTime: (f: number, t: number) => {
          log.slides[log.slides.length - 1].to = f
          log.slides[log.slides.length - 1].end = t
        },
      }, type: 'sine', started: 0, stopped: 0 } as {
      frequency: { value: number; setValueAtTime: (f: number, t: number) => void; exponentialRampToValueAtTime: (f: number, t: number) => void }
      type: string
      started: number
      stopped: number
      connect: (x: unknown) => unknown
      start: (t: number) => void
      stop: (t: number) => void
    }
    o.connect = (x) => x
    o.start = (t) => (o.started = t)
    o.stop = (t) => {
      o.stopped = t
      log.oscillators.push({ freq: o.frequency.value, type: o.type, started: o.started, stopped: o.stopped })
    }
    return o
  }
  createGain() {
    const param = { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }
    const node = { gain: param, to: [] as unknown[], connect: (x: unknown) => (node.to.push(x), x) }
    log.gains.push(node)
    return node
  }
}

describe('sound effects (the notes)', () => {
  it('there are sounds for every moment of the game', () => {
    for (const n of ['select', 'tick', 'correct', 'wrong', 'stage', 'fanfare', 'pop', 'bell', 'glockenspiel', 'whoosh'] as Sfx[]) {
      expect(NAMES, n).toContain(n)
    }
  })

  it.each(NAMES)('%s is a short tune of audible, gentle notes', (name) => {
    const notes = SEQUENCES[name]
    expect(notes.length).toBeGreaterThan(0)
    for (const n of notes) {
      expect(n.freq).toBeGreaterThan(100)
      expect(n.freq).toBeLessThan(3000)
      if (n.glideTo) {
        expect(n.glideTo).toBeGreaterThan(100)
        expect(n.glideTo).toBeLessThan(3000)
      }
      expect(n.start).toBeGreaterThanOrEqual(0)
      expect(n.dur).toBeGreaterThan(0.01)
      expect(n.start + n.dur).toBeLessThan(2)
      expect(n.gain ?? 0.14).toBeGreaterThan(0)
      expect(n.gain ?? 0.14).toBeLessThanOrEqual(0.2)
    }
  })

  it('the good sounds are higher and brighter than the "almost" sound', () => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(mean(SEQUENCES.correct.map((n) => n.freq))).toBeGreaterThan(mean(SEQUENCES.wrong.map((n) => n.freq)))
  })

  it('the typing tick is very quiet and very short', () => {
    expect(SEQUENCES.tick[0].gain!).toBeLessThanOrEqual(0.06)
    expect(SEQUENCES.tick[0].dur).toBeLessThan(0.05)
  })
})

describe('playSfx', () => {
  const saved = (globalThis as { window?: unknown }).window
  beforeEach(() => {
    ;(globalThis as unknown as { window: unknown }).window = { AudioContext: FakeContext }
    log.oscillators.length = 0
    log.resumed = 0
    contextState = 'running'
    soundSettings.getState().setMuted(false)
  })
  afterEach(() => {
    ;(globalThis as { window?: unknown }).window = saved
    soundSettings.getState().setMuted(false)
  })

  it('plays one oscillator per note, at the right pitch and time', () => {
    playSfx('correct')
    expect(log.oscillators).toHaveLength(SEQUENCES.correct.length)
    SEQUENCES.correct.forEach((n, i) => {
      expect(log.oscillators[i].freq).toBe(n.freq)
      expect(log.oscillators[i].started).toBeCloseTo(10 + n.start)
      expect(log.oscillators[i].stopped).toBeGreaterThan(log.oscillators[i].started)
    })
  })

  it.each(NAMES)('%s plays all its notes', (name) => {
    playSfx(name)
    expect(log.oscillators).toHaveLength(SEQUENCES[name].length)
  })

  it("uses the note's wave shape, a sine when it names none", () => {
    playSfx('tick')
    expect(log.oscillators[0].type).toBe('square')
    log.oscillators.length = 0
    playSfx('select')
    expect(log.oscillators.every((o) => o.type === 'sine')).toBe(true)
  })

  it('slides the pitch of a note that glides, and holds the pitch of one that does not', () => {
    log.slides.length = 0
    playSfx('boing')
    const gliding = SEQUENCES.boing.filter((n) => n.glideTo)
    expect(gliding.length).toBeGreaterThan(0)
    expect(log.slides.length).toBe(gliding.length)
    gliding.forEach((n, i) => {
      expect(log.slides[i].from).toBe(n.freq)
      expect(log.slides[i].to).toBe(n.glideTo)
      expect(log.slides[i].end).toBeCloseTo(log.slides[i].at + n.dur)
    })
    log.slides.length = 0
    playSfx('tick')
    expect(log.slides).toHaveLength(0)
  })

  it('is silent when muted', () => {
    soundSettings.getState().setMuted(true)
    playSfx('fanfare')
    expect(log.oscillators).toHaveLength(0)
  })

  describe('playNotes (a tune made by hand)', () => {
    const tune: Note[] = [
      { freq: 523.25, start: 0, dur: 1, gain: 0.17 },
      { freq: 1046.5, start: 0.2, dur: 0.5, type: 'triangle' },
    ]

    it('plays the notes it is given, at their pitch and time', () => {
      playNotes(tune)
      expect(log.oscillators).toHaveLength(2)
      expect(log.oscillators[0].freq).toBe(523.25)
      expect(log.oscillators[1].freq).toBe(1046.5)
      expect(log.oscillators[1].started).toBeCloseTo(10.2)
      expect(log.oscillators[1].type).toBe('triangle')
    })

    it('is what playSfx plays: the same oscillators for the same notes', () => {
      playNotes(SEQUENCES.correct)
      const direct = log.oscillators.map((o) => [o.freq, o.type, o.started])
      log.oscillators.length = 0
      playSfx('correct')
      expect(log.oscillators.map((o) => [o.freq, o.type, o.started])).toEqual(direct)
    })

    it('plays nothing for no notes', () => {
      playNotes([])
      expect(log.oscillators).toHaveLength(0)
    })

    it('is silent when muted', () => {
      soundSettings.getState().setMuted(true)
      playNotes(tune)
      expect(log.oscillators).toHaveLength(0)
    })

    it('wakes a sleeping audio context', () => {
      contextState = 'suspended'
      playNotes(tune)
      expect(log.resumed).toBe(1)
    })
  })

  it('wakes a sleeping audio context (browsers start it suspended until a tap)', () => {
    contextState = 'suspended'
    playSfx('pop')
    expect(log.resumed).toBe(1)
  })

  it('every note ends in the sounds bus (the sounds slider), and the bus in the speakers', () => {
    log.gains.length = 0
    playSfx('correct')
    // The bus is made once for the audio context (by an earlier sound): every note gain leads to that one node.
    expect(log.gains.length).toBeGreaterThan(0)
    const bus = log.gains[0].to[0] as { to: unknown[] }
    expect(bus.to.some((x) => (x as { kind?: string }).kind === 'destination')).toBe(true)
    for (const g of log.gains) expect(g.to).toEqual([bus])
  })

  it('reuses one audio context for every sound', () => {
    playSfx('pop')
    const created = log.created
    playSfx('pop')
    playSfx('bell')
    expect(log.created).toBe(created)
  })
})

describe('playSfx where there is no audio', () => {
  it('does nothing, without complaint', async () => {
    const saved = (globalThis as { window?: unknown }).window
    // A fresh copy of the module, so it has not cached an audio context yet.
    vi.resetModules()
    const fresh = await import('./sfx')
    ;(globalThis as { window?: unknown }).window = {}
    expect(() => fresh.playSfx('pop')).not.toThrow()
    ;(globalThis as { window?: unknown }).window = undefined
    expect(() => fresh.playSfx('pop')).not.toThrow()
    ;(globalThis as { window?: unknown }).window = saved
  })
})
