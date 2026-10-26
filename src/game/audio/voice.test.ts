import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_VOICE_GAIN, FORMANTS, FORMANT_GAINS, NEUTRAL_TUNING, pitchFor, scheduleVoice, VOICES, VOICE_MAKEUP, VOICE_TUNING, voiceBus, type VoiceName, type VoiceTuning } from './voice'
import { soundSettings } from './soundSettings'

const NAMES = Object.keys(VOICES) as VoiceName[]

/** A pretend Web Audio API that records what is built, so the voice can be checked without a speaker. */
type Param = { value: number; sets: [number, number][]; ramps: [number, number][]; lin: [number, number][] }
const param = (): Param => {
  const p: Param = { value: 0, sets: [], ramps: [], lin: [] }
  return Object.assign(p, {
    setValueAtTime: (v: number, t: number) => void p.sets.push([v, t]),
    exponentialRampToValueAtTime: (v: number, t: number) => void p.ramps.push([v, t]),
    linearRampToValueAtTime: (v: number, t: number) => void p.lin.push([v, t]),
  })
}
type Node = { kind: string; to: unknown[]; [k: string]: unknown }
class Fake {
  currentTime = 5
  state: AudioContextState = 'running'
  destination = { kind: 'destination', to: [] } as Node
  nodes: Node[] = []
  resumed = 0
  resume() {
    this.resumed++
    this.state = 'running'
    return Promise.resolve()
  }
  private make<T extends object>(kind: string, extra: T) {
    const n = { kind, to: [] as unknown[], connect(x: Node) { n.to.push(x); return x }, ...extra } as Node & T
    this.nodes.push(n)
    return n
  }
  createOscillator() {
    const n = this.make('osc', { type: 'sine', frequency: param(), started: -1, stopped: -1, start(t: number) { n.started = t }, stop(t: number) { n.stopped = t } })
    return n
  }
  sampleRate = 8000
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length)
    return { length, getChannelData: () => data }
  }
  createBufferSource() {
    const n = this.make('air', { buffer: null as unknown, loop: false, started: -1, stopped: -1, start(t: number) { n.started = t }, stop(t: number) { n.stopped = t } })
    return n
  }
  createGain() { return this.make('gain', { gain: param() }) }
  createBiquadFilter() { return this.make('band', { type: '', frequency: param(), Q: param() }) }
  createDynamicsCompressor() { return this.make('squash', { threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }) }
}
const as = (f: Fake) => f as unknown as BaseAudioContext
const ofKind = (f: Fake, kind: string) => f.nodes.filter((n) => n.kind === kind) as (Node & Record<string, any>)[] // eslint-disable-line @typescript-eslint/no-explicit-any

describe('the voice sounds (the notes)', () => {
  it('there is a voice for every moment: hello, yay, giggle, uh-oh, whinny, squeak, cheer, ooh, wheee', () => {
    expect([...NAMES].sort()).toEqual(['cheer', 'giggle', 'hello', 'ooh', 'squeak', 'uhoh', 'wheee', 'whinny', 'yay'])
  })

  it.each(NAMES)('%s is short, in a child\'s range and gentle', (name) => {
    expect(VOICES[name].length).toBeGreaterThan(0)
    for (const n of VOICES[name]) {
      // A girl's voice, not a man's and not a dog whistle.
      for (const f of [n.freq, n.to ?? n.freq]) {
        expect(f).toBeGreaterThanOrEqual(400)
        expect(f).toBeLessThanOrEqual(1800)
      }
      expect(n.start).toBeGreaterThanOrEqual(0)
      expect(n.dur).toBeGreaterThan(0.05)
      expect(n.start + n.dur).toBeLessThan(2)
      expect(n.gain ?? DEFAULT_VOICE_GAIN).toBeGreaterThan(0)
      expect(n.gain ?? DEFAULT_VOICE_GAIN).toBeLessThanOrEqual(0.3)
      expect(FORMANTS[n.vowel]).toBeDefined()
      if (n.vowelTo) expect(FORMANTS[n.vowelTo]).toBeDefined()
    }
  })

  it('"yay" and the cheer go up, "uh-oh" goes down: a child hears the difference without words', () => {
    const rise = (name: VoiceName) => {
      const [first, ...rest] = VOICES[name]
      const last = rest.at(-1) ?? first
      return (last.to ?? last.freq) - first.freq
    }
    expect(rise('yay')).toBeGreaterThan(0)
    expect(rise('cheer')).toBeGreaterThan(0)
    const [uh, oh] = VOICES.uhoh
    expect(oh.freq).toBeLessThan(uh.freq)
    expect(oh.to!).toBeLessThan(oh.freq)
  })

  it('"uh-oh" is quieter and shorter than the cheer, so a wrong answer never scares', () => {
    const loud = (name: VoiceName) => Math.max(...VOICES[name].map((n) => n.gain ?? DEFAULT_VOICE_GAIN))
    const length = (name: VoiceName) => Math.max(...VOICES[name].map((n) => n.start + n.dur))
    expect(loud('uhoh')).toBeLessThan(loud('cheer'))
    expect(length('uhoh')).toBeLessThan(length('cheer'))
  })

  it('the cheer is the biggest sound: longer than a "yay" and with a giggle after it', () => {
    const end = (name: VoiceName) => Math.max(...VOICES[name].map((n) => n.start + n.dur))
    expect(end('cheer')).toBeGreaterThan(end('yay'))
    expect(VOICES.cheer.filter((n) => n.dur < 0.1)).toHaveLength(VOICES.giggle.length)
  })

  it('the giggle is five quick notes that die away', () => {
    expect(VOICES.giggle).toHaveLength(5)
    const gains = VOICES.giggle.map((n) => n.gain!)
    expect(gains).toEqual([...gains].sort((a, b) => b - a))
    VOICES.giggle.slice(1).forEach((n, i) => expect(n.start - VOICES.giggle[i].start).toBeLessThan(0.15))
  })

  it('every vowel has three resonances, rising, with the first the loudest', () => {
    for (const hz of Object.values(FORMANTS)) {
      expect(hz[0]).toBeLessThan(hz[1])
      expect(hz[1]).toBeLessThan(hz[2])
    }
    expect([...FORMANT_GAINS]).toEqual([...FORMANT_GAINS].sort((a, b) => b - a))
  })
})

describe('pitchFor', () => {
  it('is always the same for the same name, and stays in a gentle range', () => {
    expect(pitchFor('npc-1')).toBe(pitchFor('npc-1'))
    for (const id of ['', 'a', 'npc-1', 'npc-2', 'Zebra', 'a-very-long-name-with-many-letters']) {
      expect(pitchFor(id)).toBeGreaterThanOrEqual(0.88)
      expect(pitchFor(id)).toBeLessThan(1.17)
    }
  })

  it('gives different unicorns different voices', () => {
    const pitches = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(pitchFor))
    expect(pitches.size).toBeGreaterThan(4)
  })
})

describe('scheduleVoice (how a note is built)', () => {
  it('a note is a buzzing wave through three vowel filters into a soft envelope', () => {
    const f = new Fake()
    const out = f.destination
    scheduleVoice(as(f), out as unknown as AudioNode, [{ freq: 800, start: 0.5, dur: 0.2, vowel: 'a' }], 10)
    const [osc] = ofKind(f, 'osc')
    expect(osc.type).toBe('sawtooth')
    expect(osc.frequency.sets[0]).toEqual([800, 10.5])
    expect(osc.started).toBeCloseTo(10.5)
    expect(osc.stopped).toBeGreaterThan(10.7)
    const bands = ofKind(f, 'band')
    expect(bands.map((b) => b.frequency.sets[0][0])).toEqual([...FORMANTS.a])
    expect(bands.every((b) => b.type === 'bandpass')).toBe(true)
    expect(osc.to).toHaveLength(3)
    const [env] = ofKind(f, 'gain').filter((g) => g.to.includes(out))
    expect(env.gain.sets[0][0]).toBeLessThan(0.001)
    expect(env.gain.ramps[0][0]).toBe(DEFAULT_VOICE_GAIN)
    expect(env.gain.ramps[1][0]).toBeLessThan(0.001)
    expect(env.gain.ramps[1][1]).toBeCloseTo(10.7)
  })

  it('glides the pitch and the vowel when the note says so', () => {
    const f = new Fake()
    scheduleVoice(as(f), f.destination as unknown as AudioNode, [{ freq: 700, to: 950, start: 0, dur: 0.3, vowel: 'a', vowelTo: 'i' }], 0)
    const [osc] = ofKind(f, 'osc')
    expect(osc.frequency.ramps).toEqual([[950, 0.3]])
    const bands = ofKind(f, 'band')
    expect(bands.map((b) => b.frequency.lin[0][0])).toEqual([...FORMANTS.i])
  })

  it('has no vibrato oscillator unless asked, and one at the right speed when asked', () => {
    const plain = new Fake()
    scheduleVoice(as(plain), plain.destination as unknown as AudioNode, [{ freq: 800, start: 0, dur: 0.2, vowel: 'o' }], 0)
    expect(ofKind(plain, 'osc')).toHaveLength(1)
    const wobble = new Fake()
    scheduleVoice(as(wobble), wobble.destination as unknown as AudioNode, [{ freq: 800, start: 0, dur: 0.2, vowel: 'o', vibrato: 6 }], 0)
    const [, lfo] = ofKind(wobble, 'osc')
    expect(lfo.frequency.value).toBe(6)
    // A shallow wobble (about 2%): a shy voice, not a siren.
    const depth = ofKind(wobble, 'gain').find((g) => g.gain.value > 0)!
    expect(depth.gain.value).toBeCloseTo(16)
  })

  it('pitch scales every note, including the glide', () => {
    const f = new Fake()
    scheduleVoice(as(f), f.destination as unknown as AudioNode, [{ freq: 600, to: 900, start: 0, dur: 0.2, vowel: 'a' }], 0, 1.1)
    const [osc] = ofKind(f, 'osc')
    expect(osc.frequency.sets[0][0]).toBeCloseTo(660)
    expect(osc.frequency.ramps[0][0]).toBeCloseTo(990)
  })

  it('a very short note still gets a soft start that fits inside it', () => {
    const f = new Fake()
    scheduleVoice(as(f), f.destination as unknown as AudioNode, [{ freq: 1000, start: 0, dur: 0.06, vowel: 'e' }], 0)
    const [env] = ofKind(f, 'gain').filter((g) => g.to.includes(f.destination))
    expect(env.gain.ramps[0][1]).toBeLessThan(0.06)
  })
})

describe('VoiceTuning (how the whole voice is set, for the lab)', () => {
  const play = (tuning: Partial<VoiceTuning>, notes = [{ freq: 800, to: 1000, start: 0.5, dur: 0.4, vowel: 'a' as const, vowelTo: 'i' as const, vibrato: 6 }]) => {
    const f = new Fake()
    scheduleVoice(as(f), f.destination as unknown as AudioNode, notes, 10, 1, { ...NEUTRAL_TUNING, ...tuning })
    return f
  }

  it('the game plays with the neutral numbers until somebody has listened', () => {
    expect(VOICE_TUNING).toEqual(NEUTRAL_TUNING)
  })

  it('pitch moves every note and glide up or down', () => {
    const [osc] = ofKind(play({ pitch: 1.25 }), 'osc')
    expect(osc.frequency.sets[0][0]).toBeCloseTo(1000)
    expect(osc.frequency.ramps[0][0]).toBeCloseTo(1250)
  })

  it('speed squeezes or stretches the times, the start and the end', () => {
    const [osc] = ofKind(play({ speed: 2 }), 'osc')
    expect(osc.started).toBeCloseTo(10.25)
    expect(osc.frequency.ramps[0][1]).toBeCloseTo(10.45)
    const slow = ofKind(play({ speed: 0.5 }), 'osc')[0]
    expect(slow.started).toBeCloseTo(11)
    expect(slow.frequency.ramps[0][1]).toBeCloseTo(11.8)
  })

  it('brightness moves the vowel resonances, at the start and at the end of a glide, and never past the top', () => {
    const f = play({ formants: 1.2 })
    const bands = ofKind(f, 'band')
    expect(bands.map((b) => b.frequency.sets[0][0])).toEqual(FORMANTS.a.map((hz) => Math.min(6000, hz * 1.2)))
    expect(bands.map((b) => b.frequency.lin[0][0])).toEqual(FORMANTS.i.map((hz) => Math.min(6000, hz * 1.2)))
    const high = ofKind(play({ formants: 5 }), 'band')
    expect(Math.max(...high.map((b) => b.frequency.sets[0][0]))).toBeLessThanOrEqual(6000)
  })

  it('resonance sharpens or softens the vowels', () => {
    expect(ofKind(play({ resonance: 2 }), 'band')[0].Q.value).toBeCloseTo(14)
    expect(ofKind(play({ resonance: 0.5 }), 'band')[0].Q.value).toBeCloseTo(3.5)
  })

  it('wobble scales the vibrato, and none at all leaves out its oscillator', () => {
    const depth = (t: number) => ofKind(play({ vibrato: t }), 'gain').find((g) => g.gain.value > 0)!.gain.value
    expect(depth(2)).toBeCloseTo(depth(1) * 2)
    expect(ofKind(play({ vibrato: 0 }), 'osc')).toHaveLength(1)
  })

  it('volume scales how loud a note is', () => {
    const peak = (v: number) => ofKind(play({ volume: v }), 'gain').find((g) => g.gain.ramps.length === 2)!.gain.ramps[0][0]
    expect(peak(2)).toBeCloseTo(peak(1) * 2)
  })

  it('no breath, no noise: nothing extra is built', () => {
    expect(ofKind(play({ breath: 0 }), 'air')).toHaveLength(0)
  })

  it('breath mixes noise through the same vowel filters, at the level asked for, for as long as the note', () => {
    const f = play({ breath: 0.4 })
    const [air] = ofKind(f, 'air')
    expect(air.loop).toBe(true)
    expect(air.started).toBeCloseTo(10.5)
    expect(air.stopped).toBeGreaterThan(10.9)
    const level = ofKind(f, 'gain').find((g) => g.gain.value === 0.4)!
    expect(air.to).toContain(level)
    expect(level.to).toHaveLength(3)
    expect(level.to.every((band) => (band as Node).kind === 'band')).toBe(true)
  })

  it('the breath is made once for every sound: the same buffer, and the same every time', () => {
    const f = new Fake()
    const notes = VOICES.giggle
    scheduleVoice(as(f), f.destination as unknown as AudioNode, notes, 0, 1, { ...NEUTRAL_TUNING, breath: 0.3 })
    const buffers = new Set(ofKind(f, 'air').map((a) => a.buffer))
    expect(buffers.size).toBe(1)
    const data = (ofKind(f, 'air')[0].buffer as { getChannelData: () => Float32Array }).getChannelData()
    expect(Math.max(...data)).toBeLessThanOrEqual(1)
    expect(Math.min(...data)).toBeGreaterThanOrEqual(-1)
    expect(new Set(data).size).toBeGreaterThan(100)
  })

  it('every tuning of the lab keeps every voice finite and inside two seconds', () => {
    const extremes: Partial<VoiceTuning>[] = [{ pitch: 0.6 }, { pitch: 1.6 }, { speed: 0.5 }, { speed: 1.8 }, { formants: 1.5, resonance: 3 }, { breath: 1, vibrato: 3, volume: 2.5 }]
    for (const t of extremes) {
      for (const name of NAMES) {
        const f = new Fake()
        scheduleVoice(as(f), f.destination as unknown as AudioNode, VOICES[name], 0, 1, { ...NEUTRAL_TUNING, ...t })
        for (const o of ofKind(f, 'osc')) {
          expect(Number.isFinite(o.started) && Number.isFinite(o.stopped), `${name} ${JSON.stringify(t)}`).toBe(true)
          expect(o.stopped).toBeLessThan(4.2)
        }
      }
    }
  })
})

describe('voiceBus', () => {
  it('squashes the loud notes, then turns the whole voice up to the level of the chimes', () => {
    const f = new Fake()
    const input = voiceBus(as(f)) as unknown as Node
    expect(input.kind).toBe('squash')
    expect(ofKind(f, 'squash')[0].ratio.value).toBeGreaterThan(1)
    const makeup = ofKind(f, 'gain')[0]
    expect(makeup.gain.value).toBe(VOICE_MAKEUP)
    expect(input.to).toContain(makeup)
    // ... into the sounds' bus (the sounds slider), which is what reaches the speakers.
    const bus = makeup.to[0] as Node
    expect(bus.kind).toBe('gain')
    expect(bus.to).toContain(f.destination)
  })
})

describe('playVoice', () => {
  const saved = (globalThis as { window?: unknown }).window
  let fake: Fake
  beforeEach(() => {
    fake = new Fake()
    ;(globalThis as unknown as { window: unknown }).window = { AudioContext: function () { return fake } }
    soundSettings.getState().setMuted(false)
  })
  afterEach(() => {
    ;(globalThis as { window?: unknown }).window = saved
    soundSettings.getState().setMuted(false)
    vi.resetModules()
  })

  // A fresh copy of the modules each time: the game keeps one audio context for good.
  const fresh = async () => {
    vi.resetModules()
    return import('./voice')
  }

  it.each(NAMES)('%s plays all its notes (one buzz per note, plus one per vibrato)', async (name) => {
    const { playVoice: play, VOICES: voices } = await fresh()
    play(name)
    const notes = voices[name]
    expect(ofKind(fake, 'osc')).toHaveLength(notes.length + notes.filter((n) => n.vibrato).length)
    expect(ofKind(fake, 'band')).toHaveLength(notes.length * 3)
  })

  it('starts at the current time of the audio clock', async () => {
    const { playVoice: play } = await fresh()
    play('hello')
    expect(ofKind(fake, 'osc')[0].started).toBe(5)
  })

  it('is silent when muted', async () => {
    const { playVoice: play } = await fresh()
    const { soundSettings: settings } = await import('./soundSettings')
    settings.getState().setMuted(true)
    play('cheer')
    expect(fake.nodes).toHaveLength(0)
  })

  it('wakes a sleeping audio context (browsers start it suspended until a tap)', async () => {
    const { playVoice: play } = await fresh()
    fake.state = 'suspended'
    play('yay')
    expect(fake.resumed).toBe(1)
  })

  it('does nothing, without complaint, where there is no audio', async () => {
    const { playVoice: play } = await fresh()
    ;(globalThis as unknown as { window: unknown }).window = {}
    expect(() => play('yay')).not.toThrow()
  })
})
