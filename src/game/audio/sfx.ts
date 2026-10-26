import { sharedAudioContext } from './audioContext'
import { effectsBus } from './effectsBus'
import { soundSettings } from './soundSettings'

/**
 * Sound effects are synthesised with the Web Audio API, so the game ships no
 * extra audio files and there is nothing to license (see CREDITS.md).
 */
export type Sfx = 'select' | 'tick' | 'correct' | 'wrong' | 'stage' | 'fanfare' | 'pop' | 'bell' | 'glockenspiel' | 'whoosh' | 'doorOpen' | 'doorClose' | 'knock' | 'sparkle' | 'curtain' | 'boing' | 'kick' | 'whee' | 'squeak' | 'yay' | 'splash' | MoveSfx

/** One note of a sound; with `glideTo` the pitch slides from `freq` to it over the note (a boing, a slide whistle). */
/** The sounds of the dance moves (see views/three/amara/amaraMoves.ts and views/three/unicornMoves.ts). */
export type MoveSfx = 'tada' | 'robot' | 'swish' | 'clap' | 'twinkle' | 'cluck' | 'zip' | 'bloop' | 'ding' | 'giggle' | 'yawn' | 'woo' | 'rainbow' | 'disco' | 'shimmy' | 'hop' | 'neigh' | 'clop'

export type Note = { freq: number; start: number; dur: number; gain?: number; type?: OscillatorType; glideTo?: number }

export const SEQUENCES: Record<Sfx, Note[]> = {
  select: [
    { freq: 660, start: 0, dur: 0.09 },
    { freq: 880, start: 0.07, dur: 0.12 },
  ],
  tick: [{ freq: 1250, start: 0, dur: 0.025, gain: 0.05, type: 'square' }],
  // The school bell in the intro: ding, dong.
  bell: [
    { freq: 880, start: 0, dur: 0.7, gain: 0.12 },
    { freq: 1320, start: 0, dur: 0.5, gain: 0.05 },
    { freq: 660, start: 0.45, dur: 0.9, gain: 0.12 },
    { freq: 990, start: 0.45, dur: 0.6, gain: 0.05 },
  ],
  // The circle closing over the old classroom.
  whoosh: [
    { freq: 520, start: 0, dur: 0.18, gain: 0.05, type: 'triangle' },
    { freq: 330, start: 0.1, dur: 0.22, gain: 0.05, type: 'triangle' },
    { freq: 200, start: 0.22, dur: 0.3, gain: 0.04, type: 'triangle' },
  ],
  // A few bright notes as the title floats in.
  glockenspiel: [
    { freq: 1046.5, start: 0, dur: 0.35, gain: 0.07 },
    { freq: 1318.5, start: 0.18, dur: 0.35, gain: 0.07 },
    { freq: 1568, start: 0.36, dur: 0.35, gain: 0.07 },
    { freq: 2093, start: 0.6, dur: 0.6, gain: 0.07 },
  ],
  // A soft bubble: an animal speaks or is tapped.
  pop: [
    { freq: 720, start: 0, dur: 0.06, gain: 0.07 },
    { freq: 1080, start: 0.045, dur: 0.09, gain: 0.06 },
  ],
  // The magic doors of the class change: a creak that rises, a soft thud, two knocks, a glitter, a curtain swish.
  doorOpen: [
    { freq: 196, start: 0, dur: 0.3, gain: 0.05, type: 'triangle' },
    { freq: 262, start: 0.15, dur: 0.35, gain: 0.05, type: 'triangle' },
    { freq: 392, start: 0.35, dur: 0.3, gain: 0.04 },
  ],
  doorClose: [
    { freq: 262, start: 0, dur: 0.15, gain: 0.05, type: 'triangle' },
    { freq: 130, start: 0.12, dur: 0.22, gain: 0.08, type: 'triangle' },
  ],
  knock: [
    { freq: 150, start: 0, dur: 0.08, gain: 0.1, type: 'triangle' },
    { freq: 150, start: 0.22, dur: 0.08, gain: 0.1, type: 'triangle' },
  ],
  sparkle: [
    { freq: 1568, start: 0, dur: 0.2, gain: 0.05 },
    { freq: 2093, start: 0.08, dur: 0.2, gain: 0.05 },
    { freq: 2637, start: 0.16, dur: 0.3, gain: 0.04 },
  ],
  curtain: [
    { freq: 220, start: 0, dur: 0.5, gain: 0.04, type: 'triangle' },
    { freq: 330, start: 0.25, dur: 0.6, gain: 0.04, type: 'triangle' },
  ],
  // The yard: a trampoline's boing, a kicked ball's thump, the slide's whee, a hug's squeak and a happy cheer.
  boing: [
    { freq: 180, start: 0, dur: 0.32, gain: 0.12, type: 'triangle', glideTo: 620 },
    { freq: 360, start: 0.02, dur: 0.28, gain: 0.05, glideTo: 1240 },
  ],
  kick: [
    { freq: 220, start: 0, dur: 0.14, gain: 0.18, type: 'triangle', glideTo: 110 },
    { freq: 1400, start: 0, dur: 0.03, gain: 0.05, type: 'square' },
    { freq: 520, start: 0.1, dur: 0.18, gain: 0.07, glideTo: 880 },
  ],
  whee: [{ freq: 1300, start: 0, dur: 0.7, gain: 0.08, glideTo: 420 }],
  squeak: [
    { freq: 1500, start: 0, dur: 0.07, gain: 0.07, glideTo: 2000 },
    { freq: 1900, start: 0.1, dur: 0.07, gain: 0.06, glideTo: 1400 },
  ],
  yay: [
    { freq: 784, start: 0, dur: 0.12, gain: 0.1, glideTo: 880 },
    { freq: 988, start: 0.1, dur: 0.12, gain: 0.1, glideTo: 1100 },
    { freq: 1318, start: 0.2, dur: 0.4, gain: 0.1, glideTo: 1568 },
  ],
  // A foot in a puddle: a quick drop in pitch and a little plop.
  splash: [
    { freq: 1100, start: 0, dur: 0.1, gain: 0.08, type: 'triangle', glideTo: 380 },
    { freq: 640, start: 0.05, dur: 0.12, gain: 0.06, glideTo: 260 },
    { freq: 1500, start: 0.12, dur: 0.05, gain: 0.04, glideTo: 900 },
  ],
  // Amara's moves: each its own little sound.
  tada: [
    { freq: 523.25, start: 0, dur: 0.12, gain: 0.1 },
    { freq: 659.25, start: 0.1, dur: 0.12, gain: 0.1 },
    { freq: 1046.5, start: 0.2, dur: 0.5, gain: 0.1 },
  ],
  robot: [
    { freq: 440, start: 0, dur: 0.08, gain: 0.07, type: 'square' },
    { freq: 330, start: 0.14, dur: 0.08, gain: 0.07, type: 'square' },
    { freq: 550, start: 0.28, dur: 0.08, gain: 0.07, type: 'square' },
    { freq: 220, start: 0.42, dur: 0.12, gain: 0.07, type: 'square' },
  ],
  swish: [
    { freq: 900, start: 0, dur: 0.18, gain: 0.05, type: 'triangle', glideTo: 400 },
    { freq: 400, start: 0.2, dur: 0.18, gain: 0.05, type: 'triangle', glideTo: 900 },
  ],
  clap: [
    { freq: 1800, start: 0, dur: 0.04, gain: 0.08, type: 'square' },
    { freq: 1800, start: 0.3, dur: 0.04, gain: 0.08, type: 'square' },
    { freq: 180, start: 0.3, dur: 0.1, gain: 0.12, type: 'triangle', glideTo: 110 },
  ],
  twinkle: [
    { freq: 1568, start: 0, dur: 0.18, gain: 0.06 },
    { freq: 2093, start: 0.1, dur: 0.18, gain: 0.06 },
    { freq: 1760, start: 0.2, dur: 0.18, gain: 0.06 },
    { freq: 2637, start: 0.3, dur: 0.4, gain: 0.05 },
  ],
  cluck: [
    { freq: 520, start: 0, dur: 0.07, gain: 0.09, type: 'square', glideTo: 340 },
    { freq: 520, start: 0.12, dur: 0.07, gain: 0.09, type: 'square', glideTo: 340 },
    { freq: 620, start: 0.26, dur: 0.14, gain: 0.09, type: 'square', glideTo: 280 },
  ],
  zip: [{ freq: 300, start: 0, dur: 0.45, gain: 0.06, type: 'triangle', glideTo: 1500 }],
  bloop: [
    { freq: 260, start: 0, dur: 0.14, gain: 0.1, glideTo: 520 },
    { freq: 390, start: 0.16, dur: 0.14, gain: 0.1, glideTo: 780 },
  ],
  ding: [
    { freq: 1318.5, start: 0, dur: 0.4, gain: 0.09 },
    { freq: 1976, start: 0, dur: 0.3, gain: 0.04 },
  ],
  giggle: [
    { freq: 900, start: 0, dur: 0.07, gain: 0.07, glideTo: 1200 },
    { freq: 1000, start: 0.09, dur: 0.07, gain: 0.07, glideTo: 1300 },
    { freq: 1100, start: 0.18, dur: 0.07, gain: 0.07, glideTo: 1400 },
    { freq: 1000, start: 0.27, dur: 0.1, gain: 0.07, glideTo: 1200 },
  ],
  yawn: [{ freq: 700, start: 0, dur: 0.9, gain: 0.07, type: 'triangle', glideTo: 200 }],
  woo: [
    { freq: 400, start: 0, dur: 0.25, gain: 0.08, glideTo: 600 },
    { freq: 600, start: 0.25, dur: 0.25, gain: 0.08, glideTo: 350 },
    { freq: 350, start: 0.5, dur: 0.25, gain: 0.08, glideTo: 560 },
  ],
  rainbow: [
    { freq: 523.25, start: 0, dur: 0.2, gain: 0.07 },
    { freq: 587.33, start: 0.1, dur: 0.2, gain: 0.07 },
    { freq: 659.25, start: 0.2, dur: 0.2, gain: 0.07 },
    { freq: 783.99, start: 0.3, dur: 0.2, gain: 0.07 },
    { freq: 880, start: 0.4, dur: 0.2, gain: 0.07 },
    { freq: 1046.5, start: 0.5, dur: 0.4, gain: 0.07 },
  ],
  disco: [
    { freq: 392, start: 0, dur: 0.1, gain: 0.09, type: 'triangle' },
    { freq: 392, start: 0.15, dur: 0.1, gain: 0.09, type: 'triangle' },
    { freq: 523.25, start: 0.3, dur: 0.1, gain: 0.09, type: 'triangle' },
    { freq: 784, start: 0.45, dur: 0.3, gain: 0.09, type: 'triangle' },
  ],
  shimmy: [
    { freq: 1500, start: 0, dur: 0.05, gain: 0.05, type: 'square' },
    { freq: 1700, start: 0.08, dur: 0.05, gain: 0.05, type: 'square' },
    { freq: 1500, start: 0.16, dur: 0.05, gain: 0.05, type: 'square' },
    { freq: 1700, start: 0.24, dur: 0.05, gain: 0.05, type: 'square' },
    { freq: 1500, start: 0.32, dur: 0.05, gain: 0.05, type: 'square' },
  ],
  hop: [
    { freq: 330, start: 0, dur: 0.12, gain: 0.1, type: 'triangle', glideTo: 660 },
    { freq: 330, start: 0.3, dur: 0.12, gain: 0.1, type: 'triangle', glideTo: 660 },
  ],
  // The unicorn's own: a whinny up and down, and hooves on the ground.
  neigh: [
    { freq: 620, start: 0, dur: 0.24, gain: 0.08, type: 'sawtooth', glideTo: 1150 },
    { freq: 1150, start: 0.22, dur: 0.3, gain: 0.07, type: 'triangle', glideTo: 520 },
    { freq: 940, start: 0.5, dur: 0.14, gain: 0.05, type: 'triangle', glideTo: 720 },
  ],
  clop: [
    { freq: 190, start: 0, dur: 0.07, gain: 0.14, type: 'triangle', glideTo: 120 },
    { freq: 170, start: 0.13, dur: 0.07, gain: 0.14, type: 'triangle', glideTo: 110 },
    { freq: 190, start: 0.3, dur: 0.07, gain: 0.14, type: 'triangle', glideTo: 120 },
    { freq: 170, start: 0.43, dur: 0.07, gain: 0.14, type: 'triangle', glideTo: 110 },
  ],
  correct: [
    { freq: 523.25, start: 0, dur: 0.14 },
    { freq: 659.25, start: 0.1, dur: 0.14 },
    { freq: 783.99, start: 0.2, dur: 0.14 },
    { freq: 1046.5, start: 0.3, dur: 0.4 },
  ],
  wrong: [
    { freq: 330, start: 0, dur: 0.16, type: 'triangle' },
    { freq: 262, start: 0.14, dur: 0.28, type: 'triangle' },
  ],
  stage: [
    { freq: 392, start: 0, dur: 0.18 },
    { freq: 523.25, start: 0.12, dur: 0.18 },
    { freq: 698.46, start: 0.24, dur: 0.3 },
  ],
  fanfare: [
    { freq: 523.25, start: 0, dur: 0.18 },
    { freq: 659.25, start: 0.16, dur: 0.18 },
    { freq: 783.99, start: 0.32, dur: 0.18 },
    { freq: 1046.5, start: 0.48, dur: 0.22 },
    { freq: 783.99, start: 0.66, dur: 0.14 },
    { freq: 1046.5, start: 0.8, dur: 0.6 },
  ],
}

export function playSfx(name: Sfx): void {
  playNotes(SEQUENCES[name])
}

/** Plays notes of the sounds volume (a sound of the game, or a tune made by hand). Nothing while muted. */
export function playNotes(notes: readonly Note[]): void {
  if (soundSettings.getState().muted) return
  const ctx = sharedAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const t0 = ctx.currentTime
  for (const note of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = note.type ?? 'sine'
    osc.frequency.value = note.freq
    const peak = note.gain ?? 0.14
    const start = t0 + note.start
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)
    if (note.glideTo) {
      osc.frequency.setValueAtTime(note.freq, start)
      osc.frequency.exponentialRampToValueAtTime(note.glideTo, start + note.dur)
    }
    osc.connect(gain).connect(effectsBus(ctx))
    osc.start(start)
    osc.stop(start + note.dur + 0.05)
  }
}
