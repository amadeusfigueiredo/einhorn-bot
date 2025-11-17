import type { StageConfig } from '../types'

export const STAGES: StageConfig[] = [
  {
    name: 'stage1',
    background: 'stage1Background',
    requiredToAdvance: 4,
    nextStage: 'stage2',
    gates: [],
    npcs: [
      {
        id: 'stage1Npc1',
        imageKey: 'stage1Npc1',
        x: 180,
        y: 360,
        question: {
          id: 'question1Stage1Npc1',
          prompt: 'Wie viele farbe hat der Regenbogen?',
          choices: ['8', '7', '4', '6'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc2',
        imageKey: 'stage1Npc2',
        x: 360,
        y: 220,
        question: {
          id: 'question2Stage1Npc2',
          prompt: 'Wie viele Tage hat eine Woche?',
          choices: ['6', '7', '5', '8'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage1Npc3',
        imageKey: 'stage1Npc3',
        x: 620,
        y: 320,
        question: {
          id: 'question3Stage1Npc3',
          prompt: 'Welche ist die Hauptstadt Deutschlands?',
          choices: ['Bremen', 'Koeln', 'Rostock', 'Berlin'],
          correctIndex: 3,
        },
      },
      {
        id: 'stage1Npc4',
        imageKey: 'stage1Npc4',
        x: 840,
        y: 280,
        question: {
          id: 'question4Stage1Npc4',
          prompt: 'In welche Kontinent ist Brasilien?',
          choices: ['Afrika', 'Sudamerika', 'Asien', 'Europa'],
          correctIndex: 1,
        },
      },
    ],
  },
  {
    name: 'stage2',
    background: 'stage2Background',
    requiredToAdvance: 1,
    nextStage: 'stage3',
    gates: [],
    npcs: [
      {
        id: 'stage2Npc1',
        imageKey: 'stage2Npc1',
        x: 220,
        y: 160,
        question: {
          id: 'stage2Gate2Question',
          prompt:
            'Willkommen zu der Einhornschule. Bist du bereit fuer dein Unterricht?',
          choices: ['JA!', 'NEIN', 'ICH WEISS ES NICHT'],
          correctIndex: 0,
        },
      },
    ],
  },
  {
    name: 'stage3',
    background: 'stage3Background',
    requiredToAdvance: 1,
    nextStage: 'stage4',
    gates: [],
    npcs: [
      {
        id: 'stage3Npc1',
        imageKey: 'stage3Npc1',
        x: 180,
        y: 360,
        question: {
          id: 'stage3Npc1Question',
          prompt: 'Was ist klein und hat kein Bein?',
          choices: ['Schnecke', 'Ameize', 'Schlange', 'Frosch'],
          correctIndex: 0,
        },
      },
    ],
  },
  {
    name: 'stage4',
    background: 'stage4Background',
    requiredToAdvance: 1,
    nextStage: 'stage5',
    gates: [],
    npcs: [
      {
        id: 'stage4Npc1',
        imageKey: 'stage4Npc1',
        x: 140,
        y: 110,
        question: {
          id: 'stage4Npc1Question',
          prompt: 'WELCHE IST DER KAELTESTE JAHRESZEIT?',
          choices: ['FRUEHLING', 'SOMMER', 'HERBST', 'WINTER'],
          correctIndex: 3,
        },
      },
      {
        id: 'stage4Npc2',
        imageKey: 'stage4Npc2',
        x: 320,
        y: 110,
        question: {
          id: 'stage4Npc2Question',
          prompt: 'Magst du Obst?',
          choices: ['Ja!', 'Nein'],
          correctIndex: 0,
        },
      },
    ],
  },
  {
    name: 'stage5',
    background: 'stage5Background',
    requiredToAdvance: 2,
    nextStage: 'stage6',
    gates: [],
    npcs: [
      {
        id: 'stage5Npc1',
        imageKey: 'stage5Npc1',
        x: 122,
        y: 260,
        question: {
          id: 'stage5Npc1Question',
          prompt: 'KANNST DU MIR EIN LIED VORSINGEN?',
          choices: ['JA!', 'NEIN'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage5Npc2',
        imageKey: 'stage5Npc2',
        x: 480,
        y: 460,
        question: {
          id: 'stage5Npc2Question',
          prompt: 'Was ist gross und hat grosse Zaehne?',
          choices: ['Frosch', 'Biene', 'Schnecke', 'Hai'],
          correctIndex: 3,
        },
      },
    ],
  },
  {
    name: 'stage6',
    background: 'stage6Background',
    requiredToAdvance: 1,
    nextStage: 'stage7',
    gates: [],
    npcs: [
      {
        id: 'stage6Npc1',
        imageKey: 'stage6Npc1',
        x: 180,
        y: 360,
        question: {
          id: 'stage6Npc1Question',
          prompt: 'Was ist klein und hat kein Bein?',
          choices: ['Schnecke', 'Ameize', 'Schlange', 'Frosch'],
          correctIndex: 0,
        },
      },
    ],
  },
  {
    name: 'stage7',
    background: 'stage7Background',
    requiredToAdvance: 1,
    nextStage: null,
    gates: [],
    npcs: [
      {
        id: 'stage7Npc1',
        imageKey: 'stage7Npc1',
        x: 380,
        y: 360,
        question: {
          id: 'stage7Npc1Question',
          prompt: 'Zum welchen Glitzer wird das Horn sein wenn es einfällt?',
          choices: ['Regenbogen', 'Gold', 'Silber', 'Gelb'],
          correctIndex: 0,
        },
      },
    ],
  },
]
