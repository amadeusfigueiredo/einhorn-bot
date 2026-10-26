import type { Localized } from '../../i18n/languages'
import type { Note } from '../../audio/sfx'

/**
 * The xylophone of the library: eight bars, C to the C above, in the colours of the rainbow. Pure data and maths, so a
 * test can play a tune; the pad is in `MusicPad.tsx`, the sound in `sfx.ts`.
 */
export type Bar = {
  /** The number of the bar, 0 (low C) to 7 (high C). */
  id: number
  freq: number
  color: string
  /** What the note is called, in each language (the Germans say H for B, the Portuguese say Do, Re, Mi). */
  name: Localized
  /** The keys of the keyboard that play it. */
  keys: readonly [string, string]
}

const N = (en: string, de: string, pt: string): Localized => ({ en, de, pt })

export const BARS: readonly Bar[] = [
  { id: 0, freq: 523.25, color: '#FF6B6B', name: N('C', 'C', 'Dó'), keys: ['1', 'a'] },
  { id: 1, freq: 587.33, color: '#FFA94D', name: N('D', 'D', 'Ré'), keys: ['2', 's'] },
  { id: 2, freq: 659.25, color: '#FFE066', name: N('E', 'E', 'Mi'), keys: ['3', 'd'] },
  { id: 3, freq: 698.46, color: '#8CE99A', name: N('F', 'F', 'Fá'), keys: ['4', 'f'] },
  { id: 4, freq: 783.99, color: '#4DD4C0', name: N('G', 'G', 'Sol'), keys: ['5', 'g'] },
  { id: 5, freq: 880, color: '#74C0FC', name: N('A', 'A', 'Lá'), keys: ['6', 'h'] },
  { id: 6, freq: 987.77, color: '#9775FA', name: N('B', 'H', 'Si'), keys: ['7', 'j'] },
  { id: 7, freq: 1046.5, color: '#E599F7', name: N('C', 'C', 'Dó'), keys: ['8', 'k'] },
]

/** Which bar a key of the keyboard plays, or null. */
export function barForKey(key: string): number | null {
  const k = key.toLowerCase()
  const bar = BARS.find((b) => b.keys.includes(k))
  return bar ? bar.id : null
}

/**
 * One struck bar as notes of the audio engine: a clear ring, a quiet overtone an octave up and a faint bright one (a
 * little glockenspiel) that dies faster.
 */
export function barNotes(id: number): Note[] {
  const { freq } = BARS[id]
  return [
    { freq, start: 0, dur: 1.1, gain: 0.17 },
    { freq: freq * 2, start: 0, dur: 0.55, gain: 0.05 },
    { freq: freq * 2.76, start: 0, dur: 0.2, gain: 0.03 },
  ]
}

/** A bar of a song: which one, and for how many beats. */
export type Beat = { bar: number; beats: number }

export type Song = {
  id: string
  name: Localized
  /** Beats a minute. */
  bpm: number
  notes: readonly Beat[]
}

const q = (...bars: number[]): Beat[] => bars.map((bar) => ({ bar, beats: 1 }))
const h = (bar: number): Beat => ({ bar, beats: 2 })

/** Three songs every child knows (none is under copyright). C = 0, D = 1, E = 2, F = 3, G = 4, A = 5. */
export const SONGS: readonly Song[] = [
  {
    id: 'twinkle',
    name: N('Twinkle, twinkle', 'Funkel, funkel', 'Brilha, brilha'),
    bpm: 100,
    notes: [
      ...q(0, 0, 4, 4, 5, 5), h(4),
      ...q(3, 3, 2, 2, 1, 1), h(0),
      ...q(4, 4, 3, 3, 2, 2), h(1),
      ...q(4, 4, 3, 3, 2, 2), h(1),
      ...q(0, 0, 4, 4, 5, 5), h(4),
      ...q(3, 3, 2, 2, 1, 1), h(0),
    ],
  },
  {
    id: 'ducks',
    name: N('Little ducks', 'Alle meine Entchen', 'Patinhos'),
    bpm: 110,
    notes: [...q(0, 1, 2, 3), h(4), h(4), ...q(5, 5, 5, 5), h(4), ...q(5, 5, 5, 5), h(4), ...q(3, 3, 3, 3), h(2), h(2), ...q(1, 1, 1, 1), h(0)],
  },
  {
    id: 'joy',
    name: N('Ode to joy', 'Freude, schöner Götterfunken', 'Ode à alegria'),
    bpm: 108,
    notes: [
      ...q(2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2),
      { bar: 2, beats: 1.5 },
      { bar: 1, beats: 0.5 },
      h(1),
      ...q(2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2),
      { bar: 1, beats: 1.5 },
      { bar: 0, beats: 0.5 },
      h(0),
    ],
  },
]

export function songById(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id)
}

/** When each note of a song sounds, in seconds from the start, and how long it lasts. */
export function songSchedule(song: Song): { bar: number; at: number; length: number }[] {
  const beat = 60 / song.bpm
  let at = 0
  return song.notes.map((n) => {
    const entry = { bar: n.bar, at, length: n.beats * beat }
    at += n.beats * beat
    return entry
  })
}

/** How long a song takes (seconds). */
export function songLength(song: Song): number {
  const s = songSchedule(song)
  const last = s[s.length - 1]
  return last.at + last.length
}

/** The rules for a tune she records: it stops at this many notes or seconds (the rest is not kept), and fewer notes than the minimum is not a tune. */
export const TUNE_RULES = { maxEvents: 64, maxSeconds: 40, minEvents: 4 } as const
