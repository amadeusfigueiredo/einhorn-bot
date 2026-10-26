import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '../../i18n/languages'
import {
  BARS,
  TUNE_RULES,
  SONGS,
  barForKey,
  barNotes,
  songById,
  songLength,
  songSchedule,
} from './xylophone'

describe('the bars of the xylophone', () => {
  it('are eight, numbered from 0, going up in pitch from C to the C above', () => {
    expect(BARS).toHaveLength(8)
    BARS.forEach((b, i) => expect(b.id).toBe(i))
    for (let i = 1; i < 8; i++) expect(BARS[i].freq).toBeGreaterThan(BARS[i - 1].freq)
    expect(BARS[7].freq).toBeCloseTo(BARS[0].freq * 2, 0)
  })

  it('are the notes of the C major scale (a half step between E and F and between B and C)', () => {
    const semitones = BARS.slice(1).map((b, i) => Math.round(12 * Math.log2(b.freq / BARS[i].freq)))
    expect(semitones).toEqual([2, 2, 1, 2, 2, 2, 1])
  })

  it('have a colour each, all different, and a name in every language', () => {
    expect(new Set(BARS.map((b) => b.color)).size).toBe(8)
    for (const b of BARS) for (const l of LANGUAGES) expect(b.name[l.code].length, `${b.id} ${l.code}`).toBeGreaterThan(0)
  })

  it('call the seventh note B in English and H in German, and use do-re-mi in Portuguese', () => {
    expect(BARS[6].name).toEqual({ en: 'B', de: 'H', pt: 'Si' })
    expect(BARS.map((b) => b.name.pt)).toEqual(['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si', 'Dó'])
  })

  it('are played by the keys 1 to 8 and by A S D F G H J K, each key for one bar', () => {
    const all = BARS.flatMap((b) => b.keys)
    expect(new Set(all).size).toBe(16)
    BARS.forEach((b) => {
      expect(barForKey(String(b.id + 1))).toBe(b.id)
      expect(barForKey('asdfghjk'[b.id])).toBe(b.id)
      expect(barForKey('ASDFGHJK'[b.id])).toBe(b.id)
    })
  })

  it('are not played by other keys', () => {
    for (const k of ['0', '9', 'z', ' ', 'Enter', 'Escape', 'ArrowRight', 'p']) expect(barForKey(k)).toBeNull()
  })

  it('ring as three notes: the pitch, one octave up softly, and a faint bright one that dies first', () => {
    for (const b of BARS) {
      const [a, octave, bright] = barNotes(b.id)
      expect(a.freq).toBe(b.freq)
      expect(octave.freq).toBeCloseTo(b.freq * 2, 6)
      expect(bright.freq).toBeGreaterThan(octave.freq)
      expect(a.gain!).toBeGreaterThan(octave.gain!)
      expect(octave.gain!).toBeGreaterThan(bright.gain!)
      expect(a.dur).toBeGreaterThan(octave.dur)
      expect(octave.dur).toBeGreaterThan(bright.dur)
      for (const n of [a, octave, bright]) expect(n.start).toBe(0)
    }
  })

  it('never ring loud: a chord of ten bars stays inside what a speaker takes', () => {
    for (const b of BARS) expect(barNotes(b.id).reduce((sum, n) => sum + n.gain!, 0)).toBeLessThan(0.3)
  })
})

describe('the songs', () => {
  it('are three, each with a name in every language, all different', () => {
    expect(SONGS.map((s) => s.id)).toEqual(['twinkle', 'ducks', 'joy'])
    for (const s of SONGS) for (const l of LANGUAGES) expect(s.name[l.code].length).toBeGreaterThan(0)
    expect(new Set(SONGS.map((s) => s.name.en)).size).toBe(3)
  })

  it('only use bars the xylophone has, and no silly lengths', () => {
    for (const s of SONGS) {
      for (const n of s.notes) {
        expect(Number.isInteger(n.bar)).toBe(true)
        expect(n.bar).toBeGreaterThanOrEqual(0)
        expect(n.bar).toBeLessThan(BARS.length)
        expect(n.beats).toBeGreaterThan(0)
        expect(n.beats).toBeLessThanOrEqual(2)
      }
    }
  })

  it('are long enough to be a song and short enough to learn: between 20 and 60 notes, and about 10 to 40 seconds', () => {
    for (const s of SONGS) {
      expect(s.notes.length, s.id).toBeGreaterThanOrEqual(20)
      expect(s.notes.length, s.id).toBeLessThanOrEqual(60)
      expect(songLength(s), s.id).toBeGreaterThan(10)
      expect(songLength(s), s.id).toBeLessThan(40)
    }
  })

  it('twinkle begins C C G G A A G and ends on C, the way everybody knows it', () => {
    const t = songById('twinkle')!
    expect(t.notes.slice(0, 7).map((n) => n.bar)).toEqual([0, 0, 4, 4, 5, 5, 4])
    expect(t.notes.at(-1)!.bar).toBe(0)
    expect(t.notes).toHaveLength(42)
  })

  it('the ducks begin C D E F G G and end on C', () => {
    const d = songById('ducks')!
    expect(d.notes.slice(0, 6).map((n) => n.bar)).toEqual([0, 1, 2, 3, 4, 4])
    expect(d.notes.at(-1)!.bar).toBe(0)
  })

  it('ode to joy begins E E F G G F E D and ends C, with the dotted rhythm in the middle', () => {
    const j = songById('joy')!
    expect(j.notes.slice(0, 8).map((n) => n.bar)).toEqual([2, 2, 3, 4, 4, 3, 2, 1])
    expect(j.notes.at(-1)!.bar).toBe(0)
    expect(j.notes.some((n) => n.beats === 1.5)).toBe(true)
  })

  it('every song ends on the home note (C), which is where a song comes to rest', () => {
    for (const s of SONGS) expect(s.notes.at(-1)!.bar, s.id).toBe(0)
  })

  it('songById finds each and nothing for an id that is not there', () => {
    for (const s of SONGS) expect(songById(s.id)).toBe(s)
    expect(songById('nope')).toBeUndefined()
  })

  it('schedules each note when the one before it is done, at the tempo of the song', () => {
    const twinkle = songById('twinkle')!
    const plan = songSchedule(twinkle)
    const beat = 60 / twinkle.bpm
    expect(plan).toHaveLength(twinkle.notes.length)
    expect(plan[0].at).toBe(0)
    expect(plan[1].at).toBeCloseTo(beat, 9)
    for (let i = 1; i < plan.length; i++) expect(plan[i].at).toBeCloseTo(plan[i - 1].at + plan[i - 1].length, 9)
    expect(plan[6].length).toBeCloseTo(2 * beat, 9)
    expect(plan.map((p) => p.bar)).toEqual(twinkle.notes.map((n) => n.bar))
  })

  it('takes as long as its beats at its tempo', () => {
    for (const s of SONGS) expect(songLength(s)).toBeCloseTo((s.notes.reduce((sum, n) => sum + n.beats, 0) * 60) / s.bpm, 9)
  })
})

describe('the rules of a tune she records', () => {
  it('keeps at most 64 notes and 40 seconds, and a tune is four notes or more (as it always was)', () => {
    expect(TUNE_RULES).toEqual({ maxEvents: 64, maxSeconds: 40, minEvents: 4 })
  })
})
