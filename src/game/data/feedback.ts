// Copy for the feedback popups. Wrong answers never scold: they name what to
// do next.
export const WIN_TITLE = 'Richtig!'
export const WIN_LINES: readonly string[] = [
  'Das hast du super gemacht.',
  'Genau so! Weiter geht es.',
  'Klasse, du bist richtig schlau.',
  'Stark! Die Einhörner sind begeistert.',
]

export const WRONG_TITLE = 'Fast!'
export const WRONG_HINTS: readonly string[] = [
  'Lies die Frage noch einmal langsam.',
  'Probier es gleich noch einmal.',
  'Denk in Ruhe nach. Du schaffst das.',
]

export const ENDING_TITLE = 'Geschafft!'
export const ENDING_TEXT =
  'Du hast die ganze Einhornschule gemeistert. Alle Einhörner jubeln dir zu.'
export const ENDING_BUTTON = 'Nochmal spielen'

export const NEXT_LINE_HINT = 'Weiter mit E, Enter oder Tippen'

/** Deterministic pick so a given popup shows the same line while it is open. */
export function pickLine(lines: readonly string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length]
}
