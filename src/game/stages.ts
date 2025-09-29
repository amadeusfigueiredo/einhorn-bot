import type { StageConfig } from './types'

export const STAGES: StageConfig[] = [
  {
    name: 'park',
    bg: 'park',
    // Must answer all 4 NPCs to advance
    requiredToAdvance: 4,
    nextStage: 'street',
    gates: [], // none in this stage; all progress via NPCs
    npcs: [
      {
        id: 'npc-luna',
        x: 180,
        y: 360,
        question: {
          id: 'q-luna',
          prompt: 'Luna: Wie viele farbe hat der Regenbogen?',
          choices: ['8', '7', '4', '6'],
          correctIndex: 1,
        },
      },
      {
        id: 'npc-spark',
        x: 360,
        y: 220,
        question: {
          id: 'q-spark',
          prompt: 'Spark: First day tip?',
          choices: [
            'Run late',
            'Bring glitter glue',
            'Hide in bushes',
            'Forget snacks',
          ],
          correctIndex: 1,
        },
      },
      {
        id: 'npc-ember',
        x: 620,
        y: 320,
        question: {
          id: 'q-ember',
          prompt: 'Ember: Welche ist die Hauptstadt Deutschlands?',
          choices: ['Bremen', 'Koeln', 'Rostock', 'Berlin'],
          correctIndex: 3,
        },
      },
      {
        id: 'npc-nova',
        x: 840,
        y: 280,
        question: {
          id: 'q-nova',
          prompt: 'Nova: In welche Kontinent ist Brasilien?',
          choices: ['Afrika', 'Sudamerika', 'Asien', 'Europa'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    name: 'street',
    bg: 'street',
    requiredToAdvance: 2,
    nextStage: 'school-yard',
    gates: [
      {
        id: 'street-1',
        area: { x: 260, y: 380, w: 90, h: 90 },
        question: {
          id: 'q-cross',
          prompt: 'In welche Monat ist Ostern?',
          choices: ['April', 'Mai', 'Januar', 'August'],
          correctIndex: 0,
        },
      },
      {
        id: 'street-2',
        area: { x: 740, y: 140, w: 90, h: 120 },
        question: {
          id: 'q-sign',
          prompt: 'A sign says “SLOW”. What do you do?',
          choices: ['Gallop', 'Teleport', 'Slow down', 'Close eyes'],
          correctIndex: 2,
        },
      },
    ],
    npcs: [], // none here (you can add more later)
  },
  {
    name: 'school-yard',
    bg: 'school',
    requiredToAdvance: 1,
    nextStage: null,
    gates: [
      {
        id: 'yard-1',
        area: { x: 820, y: 360, w: 110, h: 100 },
        question: {
          id: 'q-welcome',
          prompt: 'Welcome to Unicorn School! Ready for class?',
          choices: ['Yes!', 'Neigh...'],
          correctIndex: 0,
        },
      },
    ],
    npcs: [],
  },
]
