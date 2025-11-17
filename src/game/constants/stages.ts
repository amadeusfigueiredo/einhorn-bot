import type { StageConfig } from '../types'

export const STAGES: StageConfig[] = [
  // STUFE 1 - 6 (Original, leicht korrigiert)
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
      {
        id: 'stage3Npc2',
        imageKey: 'stage3Npc2',
        x: 1180,
        y: 660,
        question: {
          id: 'stage3Npc2Question',
          prompt: 'Was ist blau und hat ein Hau?',
          choices: ['Himmel', 'Ameize', 'Schlange', 'Frosch'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage3Npc3',
        imageKey: 'stage3Npc3',
        x: 820,
        y: 560,
        question: {
          id: 'stage3Npc3Question',
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
    requiredToAdvance: 2,
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
      {
        id: 'stage4Npc3',
        imageKey: 'stage4Npc3',
        x: 700,
        y: 400,
        question: {
          id: 'stage4Npc3Question',
          prompt: 'Wie viele Stunden hat ein Tag?',
          choices: ['12', '48', '24', '10'],
          correctIndex: 2,
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
      {
        id: 'stage5Npc3',
        imageKey: 'stage5Npc3',
        x: 750,
        y: 150,
        question: {
          id: 'stage5Npc3Question',
          prompt: 'Wofür steht das "i" in Einhörnern?',
          choices: ['Inaktiv', 'Immer', 'Individualität', 'Igel'],
          correctIndex: 2,
        },
      },
    ],
  },
  {
    name: 'stage6',
    background: 'stage6Background',
    requiredToAdvance: 2,
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
      {
        id: 'stage6Npc2',
        imageKey: 'stage6Npc2',
        x: 500,
        y: 150,
        question: {
          id: 'stage6Npc2Question',
          prompt: 'Wie nennt man Baby-Einhörner?',
          choices: ['Einhorn-Bebis', 'Fohlen', 'Einhörnchen', 'Stutfohlen'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage6Npc3',
        imageKey: 'stage6Npc3',
        x: 800,
        y: 400,
        question: {
          id: 'stage6Npc3Question',
          prompt: 'Welche Farbe symbolisiert Reinheit?',
          choices: ['Gelb', 'Grün', 'Weiß', 'Rot'],
          correctIndex: 2,
        },
      },
    ],
  },

  // STUFE 7 (Ihre ursprüngliche Endstufe, jetzt erweitert)
  {
    name: 'stage7',
    background: 'stage7Background',
    requiredToAdvance: 3,
    nextStage: 'stage8',
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
      {
        id: 'stage7Npc2',
        imageKey: 'stage7Npc2',
        x: 650,
        y: 200,
        question: {
          id: 'stage7Npc2Question',
          prompt: 'Was hat Ohren, kann aber nicht hören?',
          choices: ['Ein Baum', 'Eine Tasse', 'Ein Esel', 'Ein Löffel'],
          correctIndex: 1,
        },
      },
      {
        id: 'stage7Npc3',
        imageKey: 'stage7Npc3',
        x: 100,
        y: 100,
        question: {
          id: 'stage7Npc3Question',
          prompt: 'Welches Tier kann seinen Schwanz abwerfen?',
          choices: ['Hund', 'Katze', 'Eidechse', 'Affe'],
          correctIndex: 2,
        },
      },
    ],
  },

  // STUFE 8 (Neu)
  {
    name: 'stage8',
    background: 'stage8Background',
    requiredToAdvance: 3,
    nextStage: 'stage9',
    gates: [],
    npcs: [
      {
        id: 'stage8Npc1',
        imageKey: 'stage8Npc1',
        x: 200,
        y: 400,
        question: {
          id: 'stage8Npc1Question',
          prompt: 'Was ist immer nass?',
          choices: ['Ein Handtuch', 'Ein Stein', 'Wasser', 'Eine Ente'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage8Npc2',
        imageKey: 'stage8Npc2',
        x: 500,
        y: 150,
        question: {
          id: 'stage8Npc2Question',
          prompt: 'Wie viele Beine hat eine Spinne?',
          choices: ['4', '6', '8', '10'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage8Npc3',
        imageKey: 'stage8Npc3',
        x: 800,
        y: 250,
        question: {
          id: 'stage8Npc3Question',
          prompt: 'Was macht ein Hund, wenn er sich freut?',
          choices: ['Gähnen', 'Mit dem Schwanz wedeln', 'Kratzen', 'Bellen'],
          correctIndex: 1,
        },
      },
    ],
  },

  // STUFE 9 (Neu)
  {
    name: 'stage9',
    background: 'stage9Background',
    requiredToAdvance: 3,
    nextStage: 'stage10',
    gates: [],
    npcs: [
      {
        id: 'stage9Npc1',
        imageKey: 'stage9Npc1',
        x: 150,
        y: 150,
        question: {
          id: 'stage9Npc1Question',
          prompt: 'Welcher Planet ist der Erde am nächsten?',
          choices: ['Jupiter', 'Mars', 'Venus', 'Saturn'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage9Npc2',
        imageKey: 'stage9Npc2',
        x: 480,
        y: 350,
        question: {
          id: 'stage9Npc2Question',
          prompt: 'Was ist die kleinste Einheit der Materie?',
          choices: ['Molekül', 'Zelle', 'Atom', 'Staubkorn'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage9Npc3',
        imageKey: 'stage9Npc3',
        x: 750,
        y: 450,
        question: {
          id: 'stage9Npc3Question',
          prompt: 'Wie viele Kontinente gibt es auf der Erde?',
          choices: ['5', '6', '7', '8'],
          correctIndex: 2,
        },
      },
    ],
  },

  // STUFE 10 (Neu)
  {
    name: 'stage10',
    background: 'stage10Background',
    requiredToAdvance: 3,
    nextStage: 'stage11',
    gates: [],
    npcs: [
      {
        id: 'stage10Npc1',
        imageKey: 'stage10Npc1',
        x: 250,
        y: 250,
        question: {
          id: 'stage10Npc1Question',
          prompt: 'Welche Farbe entsteht aus Blau und Gelb?',
          choices: ['Rot', 'Violett', 'Orange', 'Grün'],
          correctIndex: 3,
        },
      },
      {
        id: 'stage10Npc2',
        imageKey: 'stage10Npc2',
        x: 600,
        y: 400,
        question: {
          id: 'stage10Npc2Question',
          prompt: 'Was ist das Gegenteil von "schnell"?',
          choices: ['Langsam', 'Leise', 'Groß', 'Kalt'],
          correctIndex: 0,
        },
      },
      {
        id: 'stage10Npc3',
        imageKey: 'stage10Npc3',
        x: 80,
        y: 450,
        question: {
          id: 'stage10Npc3Question',
          prompt: 'Wie nennt man den kleinen Bruder eines Ponys?',
          choices: ['Hengst', 'Fohlen', 'Esel', 'Stute'],
          correctIndex: 1,
        },
      },
    ],
  },

  // STUFE 11 (Neu)
  {
    name: 'stage11',
    background: 'stage11Background',
    requiredToAdvance: 3,
    nextStage: 'stage12',
    gates: [],
    npcs: [
      {
        id: 'stage11Npc1',
        imageKey: 'stage11Npc1',
        x: 180,
        y: 200,
        question: {
          id: 'stage11Npc1Question',
          prompt: 'Welche Form hat ein Ei?',
          choices: ['Quadratisch', 'Rund', 'Oval', 'Dreieckig'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage11Npc2',
        imageKey: 'stage11Npc2',
        x: 500,
        y: 300,
        question: {
          id: 'stage11Npc2Question',
          prompt: 'Was kann man fangen, aber nicht werfen?',
          choices: ['Ein Ball', 'Einen Fisch', 'Eine Erkältung', 'Einen Stock'],
          correctIndex: 2,
        },
      },
      {
        id: 'stage11Npc3',
        imageKey: 'stage11Npc3',
        x: 850,
        y: 450,
        question: {
          id: 'stage11Npc3Question',
          prompt: 'Wann gibt es mehr Sterne: Tag oder Nacht?',
          choices: ['Tag', 'Nacht', 'Beide gleich', 'Nur bei Neumond'],
          correctIndex: 1,
        },
      },
    ],
  },

  // STUFE 12 (Finale Stufe)
  {
    name: 'stage12',
    background: 'stage12Background',
    requiredToAdvance: 3,
    nextStage: null, // ENDE DES SPIELS
    gates: [],
    npcs: [
      {
        id: 'stage12Npc1',
        imageKey: 'stage12Npc1',
        x: 200,
        y: 300,
        question: {
          id: 'stage12Npc1Question',
          prompt: 'Was ist größer: ein Elefant oder ein Floh?',
          choices: [
            'Der Elefant',
            'Der Floh',
            'Sie sind gleich',
            'Hängt von der Art ab',
          ],
          correctIndex: 0,
        },
      },
      {
        id: 'stage12Npc2',
        imageKey: 'stage12Npc2',
        x: 500,
        y: 400,
        question: {
          id: 'stage12Npc2Question',
          prompt: 'Was hat einen Hals, aber keinen Kopf?',
          choices: ['Ein Mensch', 'Ein Baum', 'Eine Giraffe', 'Ein Hemd'],
          correctIndex: 3,
        },
      },
      {
        id: 'stage12Npc3',
        imageKey: 'stage12Npc3',
        x: 750,
        y: 200,
        question: {
          id: 'stage12Npc3Question',
          prompt: 'Was ist das magischste Wort der Welt?',
          choices: ['Bitte', 'Danke', 'Simsalabim', 'Glitzer'],
          correctIndex: 1, // Wir wählen 'Danke' als die netteste Antwort :)
        },
      },
    ],
  },
]
