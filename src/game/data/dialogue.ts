import type { Subject } from '../types'

/** What every unicorn teacher is called in the speech box. */
export const SPEAKER_NAME = 'Einhorn-Lehrerin'

// Short, simple sentences: the player is just learning to read. Each subject
// has a few greetings so conversations don't all open the same way.
export const GREETINGS: Record<Subject, readonly string[]> = {
  Mathematik: [
    'Hallo! Ich liebe Zahlen. Hilfst du mir bei einer Rechenaufgabe?',
    'Schön, dass du da bist! Ich habe eine Zahlen-Frage für dich.',
    'Hui, ein Besuch! Magst du mit mir rechnen?',
  ],
  Deutsch: [
    'Hallo! Ich liebe Wörter. Hilfst du mir mit einer Frage?',
    'Schön, dass du da bist! Ich habe ein Wörter-Rätsel für dich.',
    'Hui, ein Besuch! Magst du mit mir Buchstaben knacken?',
  ],
  Sachunterricht: [
    'Hallo! Ich bin neugierig auf die Welt. Weißt du mehr als ich?',
    'Schön, dass du da bist! Ich habe eine Entdecker-Frage für dich.',
    'Hui, ein Besuch! Magst du mit mir die Natur erforschen?',
  ],
  Musik: [
    'Hallo! Hörst du die Musik? Ich habe eine Klang-Frage für dich.',
    'Schön, dass du da bist! Lass uns zusammen Töne entdecken.',
    'Hui, ein Besuch! Magst du mit mir ein Lied-Rätsel lösen?',
  ],
  'Bildende Kunst': [
    'Hallo! Ich liebe Farben. Hilfst du mir bei einer Mal-Frage?',
    'Schön, dass du da bist! Ich habe ein Farben-Rätsel für dich.',
    'Hui, ein Besuch! Magst du mit mir Bilder anschauen?',
  ],
}

/** Stable pick: the same NPC always greets the same way. */
export function pickGreeting(subject: Subject, npcId: string): string {
  const options = GREETINGS[subject]
  let hash = 0
  for (const ch of npcId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return options[hash % options.length]
}
