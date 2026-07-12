import type { StageConfig, NPC, Subject, Difficulty } from '../types'
import { getNpcPosition } from '../utils/npcLayout'
import { WIDTH, HEIGHT } from './dimensions'

type NpcContent = Omit<NPC, 'x' | 'y'>

// A stage "template": everything except NPC positions, which depend on the
// canvas size they'll actually be rendered at (see buildStages below).
type StageTemplate = Omit<StageConfig, 'npcs'> & { npcs: NpcContent[] }

// Positions are derived instead of hand-typed so NPCs stay spread across the
// full canvas (and reachable by the player) regardless of canvas size.
// `stageSeed` just varies the zig-zag pattern between consecutive stages.
function layoutStage(
  stageSeed: number,
  npcs: NpcContent[],
  width: number,
  height: number
): NPC[] {
  return npcs.map((npc, index) => ({
    ...npc,
    ...getNpcPosition({
      index,
      total: npcs.length,
      stageSeed,
      width,
      height,
    }),
  }))
}

/**
 * Builds the stage list with NPC positions laid out for a specific canvas
 * size. Call this with the *actual* on-screen canvas dimensions (which
 * change between the landscape and portrait design resolutions) rather than
 * relying on the WIDTH/HEIGHT-default `STAGES` export below.
 */
export function buildStages(width: number, height: number): StageConfig[] {
  return STAGE_TEMPLATES.map((template, stageSeed) => ({
    ...template,
    npcs: layoutStage(stageSeed, template.npcs, width, height),
  }))
}

// --- Curriculum ---------------------------------------------------------
// 15 stages = 5 Grundschul-Fächer (subjects) x 3 stages each, difficulty
// ramping leicht -> mittel -> schwer within every subject block, and each
// stage's own 4 questions are ordered easiest-first too.
//
// Grade-level rule (as requested): Deutsch and Mathematik stay within
// Klasse 1-2. Sachunterricht, Musik, and Bildende Kunst may reach into
// Klasse 3-4. Skewed toward the harder end throughout for a gifted 6-year-
// old who wants a real challenge, not a repeat of what she already knows.
//
// Art/asset note: there's only enough background/NPC artwork for 12
// distinct-looking stages. Stages 13-15 reuse stage 1-3's art (same
// pictures, new questions) - swap in new images under the same filenames
// later if more art gets made.
function artStage(newStageNumber: number): number {
  return ((newStageNumber - 1) % 12) + 1
}

type StageSpec = {
  n: number
  subject: Subject
  difficulty: Difficulty
  npcs: NpcContent[]
}

// Most source stages only have 3 real NPC portraits (Npc1-3); stage1 is the
// only one with a spare 4th (Npc4), which every stage's 4th NPC borrows.
function imageKeyFor(art: number, index: number): string {
  return index < 3 ? `stage${art}Npc${index + 1}` : 'stage1Npc4'
}

function buildStageTemplate(spec: StageSpec): StageTemplate {
  const { n, subject, difficulty, npcs } = spec
  const art = artStage(n)
  const withArt = npcs.map((npc, i) => ({
    ...npc,
    imageKey: imageKeyFor(art, i),
  }))

  return {
    name: `stage${n}` as StageTemplate['name'],
    background: `stage${art}Background` as StageTemplate['background'],
    requiredToAdvance: 4,
    nextStage: n < 15 ? (`stage${n + 1}` as StageTemplate['nextStage']) : null,
    gates: [],
    subject,
    difficulty,
    npcs: withArt,
  }
}

const STAGE_SPECS: StageSpec[] = [
  // --- Mathematik (Klasse 1-2) ---------------------------------------
  {
    n: 1,
    subject: 'Mathematik',
    difficulty: 'leicht',
    npcs: [
      {
        id: 'stage1Npc1',
        question: {
          id: 'stage1Npc1Q',
          prompt: 'Wie viel ist 7 + 5?',
          choices: ['11', '12', '13', '10'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc2',
        question: {
          id: 'stage1Npc2Q',
          prompt: 'Welche Zahl kommt nach 19?',
          choices: ['18', '20', '21', '29'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc3',
        question: {
          id: 'stage1Npc3Q',
          prompt: 'Was ist die Hälfte von 10?',
          choices: ['4', '5', '6', '2'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc4',
        question: {
          id: 'stage1Npc4Q',
          prompt: 'Wie viele Ecken hat ein Dreieck?',
          choices: ['2', '3', '4', '5'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 2,
    subject: 'Mathematik',
    difficulty: 'mittel',
    npcs: [
      {
        id: 'stage2Npc1',
        question: {
          id: 'stage2Npc1Q',
          prompt: 'Wie viel ist 14 - 6?',
          choices: ['9', '8', '7', '6'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage2Npc2',
        question: {
          id: 'stage2Npc2Q',
          prompt: 'Welche Zahl ist die größte?',
          choices: ['45', '54', '39', '41'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage2Npc3',
        question: {
          id: 'stage2Npc3Q',
          prompt: 'Wie viel ist 6 + 6 + 6?',
          choices: ['16', '18', '20', '12'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage2Npc4',
        question: {
          id: 'stage2Npc4Q',
          prompt: 'Ein Würfel hat wie viele Seiten?',
          choices: ['4', '6', '8', '5'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 3,
    subject: 'Mathematik',
    difficulty: 'schwer',
    npcs: [
      {
        id: 'stage3Npc1',
        question: {
          id: 'stage3Npc1Q',
          prompt: 'Wie viel ist 17 + 26?',
          choices: ['43', '42', '53', '33'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage3Npc2',
        question: {
          id: 'stage3Npc2Q',
          prompt: 'Wie viel ist 3 × 4?',
          choices: ['7', '12', '10', '9'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage3Npc3',
        question: {
          id: 'stage3Npc3Q',
          prompt:
            'Anna hat 20 Bonbons. Sie isst 8 und verschenkt 5. Wie viele hat sie noch?',
          choices: ['7', '8', '12', '5'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage3Npc4',
        question: {
          id: 'stage3Npc4Q',
          prompt: 'Wie viel ist 100 - 45?',
          choices: ['55', '65', '45', '50'],
          correctIndex: 0,
        },
      },
    ],
  },

  // --- Deutsch (Klasse 1-2) -------------------------------------------
  {
    n: 4,
    subject: 'Deutsch',
    difficulty: 'leicht',
    npcs: [
      {
        id: 'stage4Npc1',
        question: {
          id: 'stage4Npc1Q',
          prompt: "Wie viele Buchstaben hat das Wort 'Katze'?",
          choices: ['4', '5', '6', '3'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage4Npc2',
        question: {
          id: 'stage4Npc2Q',
          prompt: "Welches Wort reimt sich auf 'Baum'?",
          choices: ['Haus', 'Raum', 'Blume', 'Tisch'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage4Npc3',
        question: {
          id: 'stage4Npc3Q',
          prompt: "Was ist das Gegenteil von 'groß'?",
          choices: ['dick', 'klein', 'laut', 'schnell'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage4Npc4',
        question: {
          id: 'stage4Npc4Q',
          prompt: 'Wie schreibt man das erste Wort eines Satzes?',
          choices: ['klein', 'groß', 'kursiv', 'unterstrichen'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 5,
    subject: 'Deutsch',
    difficulty: 'mittel',
    npcs: [
      {
        id: 'stage5Npc1',
        question: {
          id: 'stage5Npc1Q',
          prompt: 'Welches Wort ist ein Nomen (Namenwort)?',
          choices: ['laufen', 'schnell', 'Tisch', 'und'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage5Npc2',
        question: {
          id: 'stage5Npc2Q',
          prompt: "Wie lautet die Mehrzahl von 'Kind'?",
          choices: ['Kinds', 'Kinder', 'Kinden', 'Kindern'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage5Npc3',
        question: {
          id: 'stage5Npc3Q',
          prompt: 'Welches Wort ist richtig geschrieben?',
          choices: ['Fahrrad', 'Farhrad', 'Fahrad', 'Farad'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage5Npc4',
        question: {
          id: 'stage5Npc4Q',
          prompt: "Was ist das Gegenteil von 'schnell'?",
          choices: ['laut', 'langsam', 'leise', 'stark'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 6,
    subject: 'Deutsch',
    difficulty: 'schwer',
    npcs: [
      {
        id: 'stage6Npc1',
        question: {
          id: 'stage6Npc1Q',
          prompt: 'Welches Wort ist ein Verb (Tuwort)?',
          choices: ['Baum', 'springen', 'blau', 'Haus'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc2',
        question: {
          id: 'stage6Npc2Q',
          prompt: "Wie viele Silben hat das Wort 'Schmetterling'?",
          choices: ['2', '3', '4', '5'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc3',
        question: {
          id: 'stage6Npc3Q',
          prompt: 'Welches dieser Wörter wird immer großgeschrieben?',
          choices: ['laufen', 'Hund', 'schön', 'und'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc4',
        question: {
          id: 'stage6Npc4Q',
          prompt: "Was bedeutet 'froh'?",
          choices: ['traurig', 'glücklich', 'müde', 'wütend'],
          correctIndex: 1,
        },
      },
    ],
  },

  // --- Sachunterricht (Klasse 1-4) --------------------------------------
  {
    n: 7,
    subject: 'Sachunterricht',
    difficulty: 'leicht',
    npcs: [
      {
        id: 'stage7Npc1',
        question: {
          id: 'stage7Npc1Q',
          prompt: 'Wie viele Jahreszeiten gibt es?',
          choices: ['2', '3', '4', '5'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage7Npc2',
        question: {
          id: 'stage7Npc2Q',
          prompt: 'Welches Tier legt Eier?',
          choices: ['Hund', 'Katze', 'Huhn', 'Pferd'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage7Npc3',
        question: {
          id: 'stage7Npc3Q',
          prompt: 'Was brauchen Pflanzen zum Wachsen?',
          choices: ['Wasser und Licht', 'nur Dunkelheit', 'nur Sand', 'nichts'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage7Npc4',
        question: {
          id: 'stage7Npc4Q',
          prompt: 'Welche Farbe hat der Himmel an einem klaren Tag?',
          choices: ['grün', 'blau', 'rot', 'gelb'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 8,
    subject: 'Sachunterricht',
    difficulty: 'mittel',
    npcs: [
      {
        id: 'stage8Npc1',
        question: {
          id: 'stage8Npc1Q',
          prompt: 'Wie viele Kontinente gibt es auf der Erde?',
          choices: ['5', '6', '7', '8'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage8Npc2',
        question: {
          id: 'stage8Npc2Q',
          prompt: 'Welches Organ pumpt das Blut durch den Körper?',
          choices: ['die Lunge', 'das Herz', 'die Leber', 'der Magen'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage8Npc3',
        question: {
          id: 'stage8Npc3Q',
          prompt: 'Woher kommt der Regen?',
          choices: ['direkt aus dem Meer', 'aus Wolken', 'aus der Sonne', 'aus Flüssen'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage8Npc4',
        question: {
          id: 'stage8Npc4Q',
          prompt: 'Welches ist das größte Säugetier der Welt?',
          choices: ['Elefant', 'Giraffe', 'Blauwal', 'Nashorn'],
          correctIndex: 2,
        },
      },
    ],
  },
  {
    n: 9,
    subject: 'Sachunterricht',
    difficulty: 'schwer',
    npcs: [
      {
        id: 'stage9Npc1',
        question: {
          id: 'stage9Npc1Q',
          prompt:
            'Wie nennt man es, wenn Wasser verdunstet, Wolken bildet und als Regen zurückfällt?',
          choices: ['Wasserkreislauf', 'Sonnenkreislauf', 'Windkreislauf', 'Erdkreislauf'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage9Npc2',
        question: {
          id: 'stage9Npc2Q',
          prompt: 'Welcher Planet ist der Sonne am nächsten?',
          choices: ['Venus', 'Erde', 'Merkur', 'Mars'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage9Npc3',
        question: {
          id: 'stage9Npc3Q',
          prompt: 'Was passiert bei der Fotosynthese?',
          choices: [
            'Pflanzen erzeugen mit Licht Sauerstoff und Zucker',
            'Pflanzen trinken Öl',
            'Pflanzen fressen Insekten',
            'Pflanzen schlafen',
          ],
          correctIndex: 0,
        },
      },
      {
        id: 'stage9Npc4',
        question: {
          id: 'stage9Npc4Q',
          prompt: 'Welches ist der größte Ozean der Erde?',
          choices: ['Atlantik', 'Pazifik', 'Indischer Ozean', 'Arktischer Ozean'],
          correctIndex: 1,
        },
      },
    ],
  },

  // --- Musik (Klasse 1-4) ------------------------------------------------
  {
    n: 10,
    subject: 'Musik',
    difficulty: 'leicht',
    npcs: [
      {
        id: 'stage10Npc1',
        question: {
          id: 'stage10Npc1Q',
          prompt: 'Welches Instrument hat schwarze und weiße Tasten?',
          choices: ['Gitarre', 'Klavier', 'Trommel', 'Flöte'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage10Npc2',
        question: {
          id: 'stage10Npc2Q',
          prompt: 'Was macht man mit einer Trommel?',
          choices: ['blasen', 'schlagen', 'zupfen', 'streichen'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage10Npc3',
        question: {
          id: 'stage10Npc3Q',
          prompt: 'Wie viele Saiten hat eine klassische Gitarre normalerweise?',
          choices: ['4', '6', '8', '5'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage10Npc4',
        question: {
          id: 'stage10Npc4Q',
          prompt: 'Welches Instrument bläst man?',
          choices: ['Flöte', 'Klavier', 'Trommel', 'Gitarre'],
          correctIndex: 0,
        },
      },
    ],
  },
  {
    n: 11,
    subject: 'Musik',
    difficulty: 'mittel',
    npcs: [
      {
        id: 'stage11Npc1',
        question: {
          id: 'stage11Npc1Q',
          prompt: 'Wie heißt das Zeichen, das Stille in der Musik zeigt?',
          choices: ['Note', 'Notenschlüssel', 'Pause', 'Takt'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage11Npc2',
        question: {
          id: 'stage11Npc2Q',
          prompt: "Was bedeutet 'forte' in der Musik?",
          choices: ['leise', 'schnell', 'laut', 'langsam'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage11Npc3',
        question: {
          id: 'stage11Npc3Q',
          prompt: 'Welches Instrument gehört zu den Streichinstrumenten?',
          choices: ['Trompete', 'Geige', 'Klavier', 'Trommel'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage11Npc4',
        question: {
          id: 'stage11Npc4Q',
          prompt: 'Wie viele Linien hat ein Notensystem?',
          choices: ['4', '5', '6', '7'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 12,
    subject: 'Musik',
    difficulty: 'schwer',
    npcs: [
      {
        id: 'stage12Npc1',
        question: {
          id: 'stage12Npc1Q',
          prompt: "Wer komponierte 'Die Zauberflöte'?",
          choices: ['Beethoven', 'Mozart', 'Bach', 'Haydn'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage12Npc2',
        question: {
          id: 'stage12Npc2Q',
          prompt: "Was bedeutet 'piano' in der Musik?",
          choices: ['laut', 'schnell', 'leise', 'langsam'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage12Npc3',
        question: {
          id: 'stage12Npc3Q',
          prompt:
            'Wie heißt eine große Gruppe von Musikern, die zusammen klassische Musik spielt?',
          choices: ['Chor', 'Orchester', 'Band', 'Duett'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage12Npc4',
        question: {
          id: 'stage12Npc4Q',
          prompt: 'Welcher Notenwert dauert am längsten?',
          choices: ['Achtelnote', 'Viertelnote', 'Halbe Note', 'Ganze Note'],
          correctIndex: 3,
        },
      },
    ],
  },

  // --- Bildende Kunst (Klasse 1-4) ---------------------------------------
  {
    n: 13,
    subject: 'Bildende Kunst',
    difficulty: 'leicht',
    npcs: [
      {
        id: 'stage13Npc1',
        question: {
          id: 'stage13Npc1Q',
          prompt: 'Welche dieser Farben ist eine Grundfarbe?',
          choices: ['Grün', 'Blau', 'Lila', 'Braun'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage13Npc2',
        question: {
          id: 'stage13Npc2Q',
          prompt: 'Womit malt man normalerweise ein Bild?',
          choices: ['mit einem Löffel', 'mit einem Pinsel', 'mit einer Schere', 'mit einem Lineal'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage13Npc3',
        question: {
          id: 'stage13Npc3Q',
          prompt: 'Welche Form hat ein Ball?',
          choices: ['eckig', 'rund', 'spitz', 'flach'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage13Npc4',
        question: {
          id: 'stage13Npc4Q',
          prompt: 'Welche Farbe entsteht, wenn man Blau und Gelb mischt?',
          choices: ['Grün', 'Lila', 'Orange', 'Braun'],
          correctIndex: 0,
        },
      },
    ],
  },
  {
    n: 14,
    subject: 'Bildende Kunst',
    difficulty: 'mittel',
    npcs: [
      {
        id: 'stage14Npc1',
        question: {
          id: 'stage14Npc1Q',
          prompt: 'Wie nennt man ein Bild, das eine Person zeigt?',
          choices: ['Landschaft', 'Porträt', 'Stillleben', 'Skizze'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage14Npc2',
        question: {
          id: 'stage14Npc2Q',
          prompt: "Welcher Künstler malte die 'Sternennacht'?",
          choices: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Leonardo da Vinci'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage14Npc3',
        question: {
          id: 'stage14Npc3Q',
          prompt: 'Womit malt man Farben, die man mit Wasser vermischt?',
          choices: ['Ölfarbe', 'Aquarellfarbe', 'Bleistift', 'Kreide'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage14Npc4',
        question: {
          id: 'stage14Npc4Q',
          prompt: "Welche Farben nennt man 'kalte Farben'?",
          choices: ['Rot und Orange', 'Blau und Grün', 'Gelb und Rot', 'Braun und Schwarz'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    n: 15,
    subject: 'Bildende Kunst',
    difficulty: 'schwer',
    npcs: [
      {
        id: 'stage15Npc1',
        question: {
          id: 'stage15Npc1Q',
          prompt: "Wer malte die 'Mona Lisa'?",
          choices: ['Michelangelo', 'Leonardo da Vinci', 'Raffael', 'Vincent van Gogh'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage15Npc2',
        question: {
          id: 'stage15Npc2Q',
          prompt: 'Wie heißt die Kunstrichtung von Pablo Picasso mit zerlegten Formen?',
          choices: ['Impressionismus', 'Kubismus', 'Realismus', 'Barock'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage15Npc3',
        question: {
          id: 'stage15Npc3Q',
          prompt: "Was zeigt ein 'Stillleben'?",
          choices: [
            'bewegte Tiere',
            'unbelebte Gegenstände wie Obst',
            'Menschen beim Tanzen',
            'Landschaften bei Nacht',
          ],
          correctIndex: 1,
        },
      },
      {
        id: 'stage15Npc4',
        question: {
          id: 'stage15Npc4Q',
          prompt: 'Welche Farbe entsteht, wenn man alle drei Grundfarben mischt?',
          choices: ['Weiß', 'Braun', 'Grün', 'Rosa'],
          correctIndex: 1,
        },
      },
    ],
  },
]

const STAGE_TEMPLATES: StageTemplate[] = STAGE_SPECS.map(buildStageTemplate)

// Default landscape-laid-out stages, for consumers that only care about
// stage metadata (name, count, nextStage chain) and never render NPCs -
// dev navigation, stage-index lookups, data-integrity tests, etc.
export const STAGES: StageConfig[] = buildStages(WIDTH, HEIGHT)
