import type { NPC, Subject, Difficulty } from '../types'

// --- Curriculum content -----------------------------------------------
// Pure data: every stage's subject, difficulty and NPC questions. The text of
// each question lives in src/locales/<lang>.json under `questions.<id>`; here
// only its id and the position of the right answer. Layout,
// art and the nextStage chain are derived from this in constants/stages.ts.
//
// 15 stages = 5 Grundschul-Fächer (subjects) x 3 stages each, difficulty
// ramping leicht -> mittel -> schwer within every subject block, and each
// stage's own 4 questions are ordered easiest-first too.
//
// Grade-level rule (as requested): Deutsch and Mathematik stay within
// Klasse 1-2. Sachunterricht, Musik, and Bildende Kunst may reach into
// Klasse 3-4. Skewed toward the harder end throughout for a gifted 6-year-
// old who wants a real challenge, not a repeat of what she already knows.

export type NpcContent = Omit<NPC, 'x' | 'y'>

export type StageSpec = {
  n: number
  subject: Subject
  difficulty: Difficulty
  npcs: NpcContent[]
}

export const STAGE_SPECS: StageSpec[] = [
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc2',
        question: {
          id: 'stage1Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc3',
        question: {
          id: 'stage1Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc4',
        role: 'teacher',
        question: {
          id: 'stage1Npc4Q',
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
          correctIndex: 1,
          kind: 'number',
        },
      },
      {
        id: 'stage2Npc2',
        question: {
          id: 'stage2Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage2Npc3',
        question: {
          id: 'stage2Npc3Q',
          correctIndex: 1,
          kind: 'number',
        },
      },
      {
        id: 'stage2Npc4',
        role: 'teacher',
        question: {
          id: 'stage2Npc4Q',
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
          correctIndex: 0,
          kind: 'number',
        },
      },
      {
        id: 'stage3Npc2',
        question: {
          id: 'stage3Npc2Q',
          correctIndex: 1,
          kind: 'number',
        },
      },
      {
        id: 'stage3Npc3',
        question: {
          id: 'stage3Npc3Q',
          correctIndex: 0,
          kind: 'number',
        },
      },
      {
        id: 'stage3Npc4',
        role: 'teacher',
        question: {
          id: 'stage3Npc4Q',
          correctIndex: 0,
          kind: 'number',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage4Npc2',
        question: {
          id: 'stage4Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage4Npc3',
        question: {
          id: 'stage4Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage4Npc4',
        role: 'teacher',
        question: {
          id: 'stage4Npc4Q',
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
          correctIndex: 2,
        },
      },
      {
        id: 'stage5Npc2',
        question: {
          id: 'stage5Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage5Npc3',
        question: {
          id: 'stage5Npc3Q',
          correctIndex: 0,
        },
      },
      {
        id: 'stage5Npc4',
        role: 'teacher',
        question: {
          id: 'stage5Npc4Q',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc2',
        question: {
          id: 'stage6Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc3',
        question: {
          id: 'stage6Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc4',
        role: 'teacher',
        question: {
          id: 'stage6Npc4Q',
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
          correctIndex: 2,
        },
      },
      {
        id: 'stage7Npc2',
        question: {
          id: 'stage7Npc2Q',
          correctIndex: 2,
        },
      },
      {
        id: 'stage7Npc3',
        question: {
          id: 'stage7Npc3Q',
          correctIndex: 0,
        },
      },
      {
        id: 'stage7Npc4',
        role: 'teacher',
        question: {
          id: 'stage7Npc4Q',
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
          correctIndex: 2,
        },
      },
      {
        id: 'stage8Npc2',
        question: {
          id: 'stage8Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage8Npc3',
        question: {
          id: 'stage8Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage8Npc4',
        role: 'teacher',
        question: {
          id: 'stage8Npc4Q',
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
          correctIndex: 0,
        },
      },
      {
        id: 'stage9Npc2',
        question: {
          id: 'stage9Npc2Q',
          correctIndex: 2,
        },
      },
      {
        id: 'stage9Npc3',
        question: {
          id: 'stage9Npc3Q',
          correctIndex: 0,
        },
      },
      {
        id: 'stage9Npc4',
        role: 'teacher',
        question: {
          id: 'stage9Npc4Q',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage10Npc2',
        question: {
          id: 'stage10Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage10Npc3',
        question: {
          id: 'stage10Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage10Npc4',
        role: 'teacher',
        question: {
          id: 'stage10Npc4Q',
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
          correctIndex: 2,
        },
      },
      {
        id: 'stage11Npc2',
        question: {
          id: 'stage11Npc2Q',
          correctIndex: 2,
        },
      },
      {
        id: 'stage11Npc3',
        question: {
          id: 'stage11Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage11Npc4',
        role: 'teacher',
        question: {
          id: 'stage11Npc4Q',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage12Npc2',
        question: {
          id: 'stage12Npc2Q',
          correctIndex: 2,
        },
      },
      {
        id: 'stage12Npc3',
        question: {
          id: 'stage12Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage12Npc4',
        role: 'teacher',
        question: {
          id: 'stage12Npc4Q',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage13Npc2',
        question: {
          id: 'stage13Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage13Npc3',
        question: {
          id: 'stage13Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage13Npc4',
        role: 'teacher',
        question: {
          id: 'stage13Npc4Q',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage14Npc2',
        question: {
          id: 'stage14Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage14Npc3',
        question: {
          id: 'stage14Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage14Npc4',
        role: 'teacher',
        question: {
          id: 'stage14Npc4Q',
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
          correctIndex: 1,
        },
      },
      {
        id: 'stage15Npc2',
        question: {
          id: 'stage15Npc2Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage15Npc3',
        question: {
          id: 'stage15Npc3Q',
          correctIndex: 1,
        },
      },
      {
        id: 'stage15Npc4',
        role: 'teacher',
        question: {
          id: 'stage15Npc4Q',
          correctIndex: 1,
        },
      },
    ],
  },
]
