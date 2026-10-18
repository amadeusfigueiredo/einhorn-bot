import { soundSettings } from './soundSettings'

/**
 * Sound effects are synthesised with the Web Audio API, so the game ships no
 * extra audio files and there is nothing to license (see CREDITS.md).
 */
export type Sfx = 'select' | 'tick' | 'correct' | 'wrong' | 'stage' | 'fanfare'

type Note = { freq: number; start: number; dur: number; gain?: number; type?: OscillatorType }

const SEQUENCES: Record<Sfx, Note[]> = {
  select: [
    { freq: 660, start: 0, dur: 0.09 },
    { freq: 880, start: 0.07, dur: 0.12 },
  ],
  tick: [{ freq: 1250, start: 0, dur: 0.025, gain: 0.05, type: 'square' }],
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

let audioContext: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  audioContext ??= new Ctor()
  return audioContext
}

export function playSfx(name: Sfx): void {
  if (soundSettings.getState().muted) return
  const ctx = context()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const t0 = ctx.currentTime
  for (const note of SEQUENCES[name]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = note.type ?? 'sine'
    osc.frequency.value = note.freq
    const peak = note.gain ?? 0.14
    const start = t0 + note.start
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + note.dur + 0.05)
  }
}
