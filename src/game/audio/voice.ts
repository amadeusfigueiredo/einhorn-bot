import { sharedAudioContext } from './audioContext'
import { effectsBus } from './effectsBus'
import { soundSettings } from './soundSettings'

/**
 * A little girl's voice for the unicorns: wordless, so every child in the
 * world understands it ("yay!", "uh-oh", a giggle, a whinny). Like the other
 * sounds it is made in the browser, so there are no recordings to license:
 * a buzzing tone (the voice box) passes through three band filters that
 * shape a vowel (the mouth), with a little vibrato on the long notes.
 */
export type Vowel = 'a' | 'o' | 'i' | 'u' | 'e'

/** The three resonances of each vowel in a child's voice (Hz); a child's are higher than a grown-up's. */
export const FORMANTS: Record<Vowel, readonly [number, number, number]> = {
  a: [1000, 1600, 3200],
  o: [700, 1100, 3200],
  i: [400, 3000, 3800],
  u: [450, 1100, 3200],
  e: [700, 2600, 3400],
}

/** How loud each resonance is next to the first. */
export const FORMANT_GAINS = [1, 0.7, 0.35] as const
const FORMANT_Q = 7

export type VoiceNote = {
  /** Pitch at the start (Hz); it glides to `to` over the note when that is given. */
  freq: number
  to?: number
  start: number
  dur: number
  gain?: number
  vowel: Vowel
  /** The mouth glides from `vowel` to this one (a → i is "hi"). */
  vowelTo?: Vowel
  /** Vibrato speed in Hz; none when missing. */
  vibrato?: number
}

export type VoiceName = 'hello' | 'yay' | 'giggle' | 'uhoh' | 'whinny' | 'squeak' | 'cheer' | 'ooh' | 'wheee'

const YAY: VoiceNote[] = [
  { freq: 620, to: 880, start: 0, dur: 0.2, vowel: 'i', vowelTo: 'a' },
  { freq: 1000, to: 1060, start: 0.2, dur: 0.45, vowel: 'e', vibrato: 6 },
]

const GIGGLE: VoiceNote[] = [1000, 1150, 1020, 1150, 1060].map((freq, i) => ({
  freq,
  start: i * 0.09,
  dur: 0.07,
  gain: 0.2 - i * 0.02,
  vowel: 'e' as const,
}))

export const VOICES: Record<VoiceName, VoiceNote[]> = {
  // "Hi!": the mouth opens to a closed smile.
  hello: [{ freq: 700, to: 950, start: 0, dur: 0.3, vowel: 'a', vowelTo: 'i' }],
  yay: YAY,
  giggle: GIGGLE,
  // A soft, falling "oh-oh" that says "not quite" without scaring anyone.
  uhoh: [
    { freq: 600, to: 570, start: 0, dur: 0.17, gain: 0.2, vowel: 'a' },
    { freq: 480, to: 440, start: 0.21, dur: 0.32, gain: 0.2, vowel: 'o', vibrato: 5 },
  ],
  // A little neigh: up with a wobble, then down.
  whinny: [
    { freq: 700, to: 1500, start: 0, dur: 0.3, vowel: 'e', vowelTo: 'i', vibrato: 11 },
    { freq: 1500, to: 800, start: 0.3, dur: 0.4, vowel: 'a', vibrato: 11 },
  ],
  squeak: [{ freq: 1300, to: 1700, start: 0, dur: 0.09, gain: 0.16, vowel: 'i' }],
  // A phase is done: a big "yaaay!" and a giggle after it.
  cheer: [
    { freq: 620, to: 900, start: 0, dur: 0.2, vowel: 'i', vowelTo: 'a' },
    { freq: 1000, to: 1100, start: 0.2, dur: 0.55, gain: 0.22, vowel: 'a', vibrato: 6 },
    { freq: 1250, to: 1320, start: 0.2, dur: 0.55, gain: 0.1, vowel: 'e', vibrato: 6 },
    ...GIGGLE.map((n) => ({ ...n, start: n.start + 0.8 })),
  ],
  // Wonder: a long, soft "ooh".
  ooh: [{ freq: 520, to: 700, start: 0, dur: 0.6, gain: 0.18, vowel: 'u', vowelTo: 'o', vibrato: 5 }],
  // A happy "wheee!" that glides up.
  wheee: [{ freq: 600, to: 1500, start: 0, dur: 0.7, gain: 0.18, vowel: 'e', vowelTo: 'i', vibrato: 7 }],
}

/** The loudness of a note when it names none; voices are kept gentle next to the chimes. */
export const DEFAULT_VOICE_GAIN = 0.28

/** A steady pitch factor (0.88 – 1.16) from a name, so each unicorn always sounds like itself. */
export function pitchFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 0.88 + (h % 29) / 100
}

/**
 * How the whole voice is set, all as factors (1 = as written in `VOICES`). The game plays with `VOICE_TUNING`; the
 * voice lab (`/dev/voice-lab.html`) turns each of them while someone listens and prints the numbers to put there.
 */
export type VoiceTuning = {
  /** Higher or lower overall (1.2 is about a small third up). */
  pitch: number
  /** The vowel resonances higher (a smaller, brighter mouth) or lower (rounder). */
  formants: number
  /** Sharper vowels (more) or softer, more blurred ones (less). */
  resonance: number
  /** Faster (more) or slower (less). */
  speed: number
  /** How much the long notes wobble; 0 is steady. */
  vibrato: number
  /** Breath mixed into the tone, 0 (clean) to 1 (a whisper). */
  breath: number
  /** Louder or quieter than the chimes' level. */
  volume: number
}

export const NEUTRAL_TUNING: VoiceTuning = { pitch: 1, formants: 1, resonance: 1, speed: 1, vibrato: 1, breath: 0, volume: 1 }

/** What the game plays with. Tuned by numbers so far (nobody listened); the lab's "copy" button gives the numbers to put here. */
export const VOICE_TUNING: VoiceTuning = { ...NEUTRAL_TUNING }

/** The highest a vowel resonance may go (Hz): above it the filter no longer shapes a voice. */
const MAX_FORMANT = 6000

/** A second of white noise, made once for each audio context: the breath. */
const noises = new WeakMap<BaseAudioContext, AudioBuffer>()
function noise(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noises.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    // A fixed pattern (not Math.random): the same breath every time.
    let seed = 12345
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      data[i] = seed / 2147483648 - 1
    }
    noises.set(ctx, buffer)
  }
  return buffer
}

/** Sets up the oscillators of `notes` on any audio context (the live one, or an offline one that renders a sound to a file). */
export function scheduleVoice(ctx: BaseAudioContext, destination: AudioNode, notes: readonly VoiceNote[], t0: number, pitch = 1, tuning: VoiceTuning = VOICE_TUNING): void {
  for (const note of notes) {
    const start = t0 + note.start / tuning.speed
    const end = start + note.dur / tuning.speed
    const f0 = note.freq * pitch * tuning.pitch
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(f0, start)
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to * pitch * tuning.pitch, end)

    if (note.vibrato && tuning.vibrato > 0) {
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.frequency.value = note.vibrato
      depth.gain.value = f0 * 0.02 * tuning.vibrato
      lfo.connect(depth).connect(osc.frequency)
      lfo.start(start)
      lfo.stop(end + 0.05)
    }

    // A soft start and end, so there is no click.
    const envelope = ctx.createGain()
    const peak = (note.gain ?? DEFAULT_VOICE_GAIN) * tuning.volume
    const attack = Math.min(0.03, (note.dur / tuning.speed) / 3)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(peak, start + attack)
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)
    envelope.connect(destination)

    // The breath goes through the same vowel filters as the tone: an airy "ah", not a hiss beside it.
    let air: AudioBufferSourceNode | null = null
    let airLevel: GainNode | null = null
    if (tuning.breath > 0) {
      air = ctx.createBufferSource()
      air.buffer = noise(ctx)
      air.loop = true
      airLevel = ctx.createGain()
      airLevel.gain.value = tuning.breath
      air.connect(airLevel)
    }

    FORMANTS[note.vowel].forEach((hz, i) => {
      const band = ctx.createBiquadFilter()
      const level = ctx.createGain()
      band.type = 'bandpass'
      band.Q.value = FORMANT_Q * tuning.resonance
      band.frequency.setValueAtTime(Math.min(MAX_FORMANT, hz * tuning.formants), start)
      if (note.vowelTo) band.frequency.linearRampToValueAtTime(Math.min(MAX_FORMANT, FORMANTS[note.vowelTo][i] * tuning.formants), end)
      level.gain.value = FORMANT_GAINS[i]
      osc.connect(band).connect(level).connect(envelope)
      airLevel?.connect(band)
    })

    osc.start(start)
    osc.stop(end + 0.05)
    if (air) {
      air.start(start)
      air.stop(end + 0.05)
    }
  }
}

/** How much the voice bus is turned up after the compressor; it brings the voices to about the loudness of the chimes. */
export const VOICE_MAKEUP = 0.7

/**
 * Where voices go: a compressor evens out the notes (a vowel is louder at some pitches than others, and each unicorn has its own pitch), then a gain brings them up to the chimes.
 * Returns the node to connect to.
 */
export function voiceBus(ctx: BaseAudioContext): AudioNode {
  const squash = ctx.createDynamicsCompressor()
  squash.threshold.value = -34
  squash.knee.value = 20
  squash.ratio.value = 8
  squash.attack.value = 0.003
  squash.release.value = 0.12
  const makeup = ctx.createGain()
  makeup.gain.value = VOICE_MAKEUP
  squash.connect(makeup).connect(effectsBus(ctx))
  return squash
}

/** Plays a voice sound; `pitch` makes it higher or lower (see `pitchFor`). Silent when muted. */
export function playVoice(name: VoiceName, pitch = 1, tuning: VoiceTuning = VOICE_TUNING): void {
  if (soundSettings.getState().muted) return
  const ctx = sharedAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  scheduleVoice(ctx, voiceBus(ctx), VOICES[name], ctx.currentTime, pitch, tuning)
}
