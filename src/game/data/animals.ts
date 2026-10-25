// The animal friends of the 15 classrooms: who they are, what they do, where
// they keep to and what they say. Pure data, no React or three.js.
//
// Animals live on the rim of the room or in the air above it, never on the
// floor where the unicorns stand and Amara walks, so they can not block the
// way (`layoutAnimals` turns a `Place` into a point and the tests check it).
// Every stage has 2 to 4 of them; the fairy only comes to stages 1, 6, 9, 13
// and 15.
import type { Lang } from '../i18n/languages'

export type AnimalType =
  | 'koala' | 'capybara' | 'monkey' | 'snowMonkey' | 'penguin' | 'parrot' | 'fairy' | 'bunny' | 'crab' | 'owl'
  | 'octopus' | 'turtle' | 'seal' | 'dolphin' | 'frog' | 'duckling' | 'snail' | 'hedgehog' | 'polarBear' | 'bee'
  | 'butterfly' | 'seagull' | 'starfish' | 'seahorse'

export const ANIMAL_TYPES: readonly AnimalType[] = [
  'koala', 'capybara', 'monkey', 'snowMonkey', 'penguin', 'parrot', 'fairy', 'bunny', 'crab', 'owl',
  'octopus', 'turtle', 'seal', 'dolphin', 'frog', 'duckling', 'snail', 'hedgehog', 'polarBear', 'bee',
  'butterfly', 'seagull', 'starfish', 'seahorse',
]

/** What an animal does. The body motion and the limb loops are in animalMotion.ts. */
export type Behavior =
  | 'idle' | 'nod' | 'chew' | 'swing' | 'hop' | 'wander' | 'fly' | 'float' | 'spaceFloat' | 'swim' | 'slide'
  | 'conduct' | 'drum' | 'shake' | 'clap' | 'paint' | 'read' | 'sleep' | 'jump' | 'crawl' | 'blowBubbles'
  | 'sniff' | 'balance' | 'wave' | 'cheer' | 'cruise'

export type Holds =
  | 'donut' | 'iceCream' | 'book' | 'banana' | 'brush' | 'baton' | 'maracas' | 'drumstick' | 'leaf' | 'coconut'
  | 'chalk' | 'abcSign' | 'mallet'

export type Outfit = 'sunglasses' | 'helmet' | 'towel' | 'orange' | 'flowerCrown' | 'glasses' | 'bow' | 'paintSpots' | 'scarf'

/** The rim of the play area an animal keeps to. */
export type Edge = 'left' | 'right' | 'back' | 'front'

/**
 * A spot on the rim: `t` runs from 0 to 1 along the edge (back to front for
 * the side edges, left to right for the back and front edges); `y` is the
 * height above the floor (0 = on the ground).
 */
export type Place = { edge: Edge; t: number; y?: number }

/** One line an animal says, in every language of the game. */
export type Line = Record<Lang, string>

export type AnimalSpec = {
  /** Unique across the game; the speech timers and sounds are keyed by it. */
  id: string
  type: AnimalType
  behavior: Behavior
  at: Place
  /** Where a walking, flying or swimming animal goes to and fro. */
  to?: Place
  scale?: number
  holds?: Holds
  outfit?: Outfit
  /** A colour that sets this animal apart from others of its kind (the second parrot is gold). */
  tint?: string
  /** Said at random while the animal is in the room; empty = silent. */
  lines: readonly Line[]
}

/** The stages that have the fairy, as stage numbers (1-based). */
export const FAIRY_STAGES: readonly number[] = [1, 6, 9, 13, 15]

const L = (de: string, pt: string, en: string): Line => ({ de, pt, en })

type Draft = Omit<AnimalSpec, 'id'>

const DRAFTS: readonly (readonly Draft[])[] = [
  // 1: candy classroom
  [
    { type: 'koala', behavior: 'chew', at: { edge: 'right', t: 0.25 }, holds: 'donut', lines: [L('Mmh, Donut!', 'Hmm, rosquinha!', 'Mmm, donut!'), L('Noch einen, bitte!', 'Mais uma, por favor!', 'Another one, please!')] },
    { type: 'monkey', behavior: 'swing', at: { edge: 'back', t: 0.75, y: 2.8 }, holds: 'banana', lines: [L('Uh-uh-ah!', 'Uh-uh-ah!', 'Ooh-ooh-aah!'), L('Schau mal, ich schwinge!', 'Olha, estou balançando!', 'Look, I am swinging!')] },
    { type: 'fairy', behavior: 'fly', at: { edge: 'back', t: 0.15, y: 2.4 }, to: { edge: 'back', t: 0.6, y: 2.6 }, lines: [L('Zähl die Punkte!', 'Conta os pontinhos!', 'Count the dots!'), L('Du kannst das!', 'Você consegue!', 'You can do it!')] },
  ],
  // 2: beach school
  [
    { type: 'capybara', behavior: 'nod', at: { edge: 'front', t: 0.15 }, outfit: 'sunglasses', lines: [L('Sooo entspannt …', 'Que relaxante …', 'So relaxed …'), L('Sonne ist toll!', 'Sol é demais!', 'Sunshine is great!')] },
    { type: 'crab', behavior: 'wander', at: { edge: 'front', t: 0.55 }, to: { edge: 'front', t: 0.85 }, lines: [L('Zwick!', 'Belisco!', 'Snip!'), L('Ich gehe seitwärts!', 'Eu ando de lado!', 'I walk sideways!')] },
    { type: 'monkey', behavior: 'swing', at: { edge: 'left', t: 0.12, y: 2.8 }, holds: 'coconut', lines: [L('Kokos-Post!', 'Correio de coco!', 'Coconut mail!')] },
    { type: 'seagull', behavior: 'fly', at: { edge: 'back', t: 0.1, y: 2.5 }, to: { edge: 'back', t: 0.9, y: 2.6 }, holds: 'iceCream', lines: [] },
  ],
  // 3: moon class
  [
    { type: 'koala', behavior: 'spaceFloat', at: { edge: 'right', t: 0.2, y: 1.8 }, holds: 'iceCream', outfit: 'helmet', lines: [L('Schwerelos!', 'Sem gravidade!', 'Weightless!'), L('Mein Eis schwebt!', 'Meu sorvete flutua!', 'My ice cream floats!')] },
    { type: 'capybara', behavior: 'spaceFloat', at: { edge: 'left', t: 0.3, y: 1.6 }, outfit: 'helmet', lines: [L('Hallo Erde!', 'Olá Terra!', 'Hello Earth!')] },
    { type: 'bunny', behavior: 'hop', at: { edge: 'front', t: 0.3 }, to: { edge: 'front', t: 0.6 }, lines: [L('Hopp!', 'Pula!', 'Hop!'), L('Auf dem Mond hüpft man hoch!', 'Na lua se pula alto!', 'You hop high on the moon!')] },
  ],
  // 4: treehouse library
  [
    { type: 'monkey', behavior: 'swing', at: { edge: 'left', t: 0.15, y: 2.8 }, holds: 'book', lines: [L('Ich lese mit!', 'Eu leio junto!', 'I am reading along!'), L('Kopfüber lesen ist lustig!', 'Ler de cabeça pra baixo é divertido!', 'Reading upside down is fun!')] },
    { type: 'capybara', behavior: 'read', at: { edge: 'front', t: 0.75 }, holds: 'book', lines: [L('Psst … Bibliothek!', 'Psiu … biblioteca!', 'Shh … library!')] },
    { type: 'owl', behavior: 'idle', at: { edge: 'right', t: 0.6 }, lines: [L('Huhu!', 'Uhu!', 'Hoo-hoo!')] },
    { type: 'butterfly', behavior: 'fly', at: { edge: 'left', t: 0.2, y: 1.8 }, to: { edge: 'left', t: 0.55, y: 2.2 }, lines: [] },
  ],
  // 5: underwater school (floating in the air here)
  [
    { type: 'octopus', behavior: 'wave', at: { edge: 'right', t: 0.2 }, holds: 'chalk', lines: [L('Ich hab 8 Kreiden!', 'Eu tenho 8 gizes!', 'I have 8 chalks!'), L('Ich schreibe ganz schnell!', 'Eu escrevo bem rápido!', 'I write really fast!')] },
    { type: 'turtle', behavior: 'swim', at: { edge: 'back', t: 0.1, y: 2.0 }, to: { edge: 'back', t: 0.9, y: 2.1 }, holds: 'abcSign', lines: [L('Langsam, aber klug!', 'Devagar, mas esperta!', 'Slow, but smart!')] },
    { type: 'crab', behavior: 'wander', at: { edge: 'front', t: 0.6 }, to: { edge: 'front', t: 0.85 }, lines: [L('Klick-klack!', 'Clique-claque!', 'Click-clack!')] },
    { type: 'seahorse', behavior: 'float', at: { edge: 'left', t: 0.6, y: 1.2 }, lines: [] },
  ],
  // 6: cloud castle
  [
    { type: 'owl', behavior: 'idle', at: { edge: 'right', t: 0.25 }, holds: 'book', outfit: 'glasses', lines: [L('Leise lesen, bitte!', 'Leia baixinho, por favor!', 'Quiet reading, please!')] },
    { type: 'fairy', behavior: 'fly', at: { edge: 'back', t: 0.2, y: 2.4 }, to: { edge: 'back', t: 0.7, y: 2.6 }, holds: 'book', lines: [L('Ich bring dir ein Buch!', 'Eu te trago um livro!', 'I am bringing you a book!'), L('Lies den Satz laut!', 'Leia a frase em voz alta!', 'Read the sentence out loud!')] },
    { type: 'koala', behavior: 'sleep', at: { edge: 'left', t: 0.7 }, lines: [L('Zzz …', 'Zzz …', 'Zzz …')] },
  ],
  // 7: koala forest
  [
    { type: 'koala', behavior: 'swing', at: { edge: 'back', t: 0.15, y: 2.8 }, lines: [L('Mama, noch mal!', 'Mamãe, de novo!', 'Mum, again!')] },
    { type: 'koala', behavior: 'chew', at: { edge: 'right', t: 0.3 }, holds: 'leaf', lines: [L('Eukalyptus, lecker!', 'Eucalipto, delícia!', 'Eucalyptus, yummy!')] },
    { type: 'monkey', behavior: 'swing', at: { edge: 'back', t: 0.85, y: 2.8 }, holds: 'banana', lines: [L('Banane?', 'Banana?', 'Banana?')] },
    { type: 'bunny', behavior: 'hop', at: { edge: 'front', t: 0.2 }, to: { edge: 'front', t: 0.5 }, lines: [L('Hoppel!', 'Pula-pula!', 'Boing!')] },
  ],
  // 8: capybara hot spring
  [
    { type: 'capybara', behavior: 'blowBubbles', at: { edge: 'left', t: 0.25 }, outfit: 'orange', lines: [L('Blub blub!', 'Blub blub!', 'Blub blub!')] },
    { type: 'capybara', behavior: 'float', at: { edge: 'front', t: 0.3 }, lines: [L('Meine Entchen fahren mit!', 'Meus patinhos vão junto!', 'My ducklings ride along!')] },
    { type: 'duckling', behavior: 'float', at: { edge: 'front', t: 0.8, y: 0.1 }, lines: [L('Piep!', 'Piu!', 'Peep!')] },
    { type: 'snowMonkey', behavior: 'float', at: { edge: 'right', t: 0.7 }, outfit: 'towel', lines: [L('Ahhh, so warm!', 'Ahhh, quentinho!', 'Ahhh, so warm!')] },
  ],
  // 9: glowing forest
  [
    { type: 'fairy', behavior: 'fly', at: { edge: 'back', t: 0.25, y: 2.4 }, to: { edge: 'back', t: 0.75, y: 2.6 }, lines: [L('Tipp: Licht + Pflanze!', 'Dica: luz + planta!', 'Hint: light + plant!')] },
    { type: 'snail', behavior: 'crawl', at: { edge: 'front', t: 0.15 }, to: { edge: 'front', t: 0.4 }, lines: [L('Ich leuchte langsam …', 'Eu brilho devagar …', 'I glow slowly …')] },
    { type: 'hedgehog', behavior: 'sniff', at: { edge: 'right', t: 0.8 }, lines: [L('Schnüffel, schnüffel!', 'Fareja, fareja!', 'Sniff, sniff!')] },
    { type: 'owl', behavior: 'idle', at: { edge: 'right', t: 0.15 }, lines: [L('Huu-huu!', 'Uhu-uhu!', 'Hoo-hoo!')] },
  ],
  // 10: flower meadow concert
  [
    { type: 'capybara', behavior: 'drum', at: { edge: 'left', t: 0.75 }, holds: 'drumstick', lines: [L('Bumm-bumm!', 'Bum-bum!', 'Boom-boom!')] },
    { type: 'monkey', behavior: 'shake', at: { edge: 'front', t: 0.8 }, holds: 'maracas', lines: [L('Tschk-tschk!', 'Tchic-tchic!', 'Shk-shk!')] },
    { type: 'frog', behavior: 'idle', at: { edge: 'right', t: 0.3 }, lines: [L('Quaak-la!', 'Croac-lá!', 'Ribbit-la!')] },
    { type: 'bee', behavior: 'fly', at: { edge: 'back', t: 0.1, y: 2.2 }, to: { edge: 'back', t: 0.9, y: 2.4 }, lines: [] },
  ],
  // 11: shell stage by the sea
  [
    { type: 'seal', behavior: 'balance', at: { edge: 'front', t: 0.2 }, holds: 'donut', lines: [L('Ow-ow! Bravo!', 'Ou-ou! Bravo!', 'Arf-arf! Bravo!')] },
    { type: 'dolphin', behavior: 'jump', at: { edge: 'back', t: 0.4 }, lines: [L('Iiih-hi-hi!', 'Iiih-hi-hi!', 'Eee-hee-hee!')] },
    { type: 'crab', behavior: 'drum', at: { edge: 'front', t: 0.65 }, lines: [L('Tak-tak-tak!', 'Tac-tac-tac!', 'Tap-tap-tap!')] },
    { type: 'starfish', behavior: 'wave', at: { edge: 'right', t: 0.75 }, lines: [L('Hallo, Amara!', 'Olá, Amara!', 'Hello, Amara!')] },
  ],
  // 12: aurora concert
  [
    { type: 'penguin', behavior: 'conduct', at: { edge: 'left', t: 0.2 }, holds: 'baton', lines: [L('Und … los!', 'E … já!', 'And … go!'), L('Lauter, bitte!', 'Mais alto, por favor!', 'Louder, please!')] },
    { type: 'penguin', behavior: 'slide', at: { edge: 'front', t: 0.1 }, to: { edge: 'front', t: 0.5 }, lines: [L('Wiiieee!', 'Uhuuul!', 'Wheeee!')] },
    { type: 'penguin', behavior: 'hop', at: { edge: 'front', t: 0.8 }, scale: 0.6, lines: [] },
    { type: 'polarBear', behavior: 'drum', at: { edge: 'right', t: 0.75 }, holds: 'mallet', lines: [L('Pling-plong!', 'Plim-plom!', 'Ping-pong!')] },
  ],
  // 13: ice-cream studio
  [
    { type: 'capybara', behavior: 'paint', at: { edge: 'left', t: 0.75 }, holds: 'brush', lines: [L('Ich male dich!', 'Vou te pintar!', 'I am painting you!')] },
    { type: 'koala', behavior: 'chew', at: { edge: 'right', t: 0.3 }, holds: 'iceCream', lines: [L('Mmh, Erdbeer!', 'Hmm, morango!', 'Mmm, strawberry!')] },
    { type: 'monkey', behavior: 'swing', at: { edge: 'back', t: 0.3, y: 2.8 }, lines: [L('Upsi, Farbe!', 'Ops, tinta!', 'Oops, paint!')] },
    { type: 'fairy', behavior: 'fly', at: { edge: 'back', t: 0.55, y: 2.4 }, to: { edge: 'back', t: 0.9, y: 2.6 }, lines: [L('Mischen macht Neues!', 'Misturar cria cores novas!', 'Mixing makes something new!')] },
  ],
  // 14: paint canyon
  [
    { type: 'parrot', behavior: 'nod', at: { edge: 'right', t: 0.2 }, lines: [L('Rosa! Rosa! Krah!', 'Rosa! Rosa! Craaa!', 'Pink! Pink! Squawk!'), L('Richtig! Richtig!', 'Certo! Certo!', 'Right! Right!')] },
    { type: 'parrot', behavior: 'fly', at: { edge: 'back', t: 0.9, y: 2.4 }, to: { edge: 'back', t: 0.1, y: 2.6 }, tint: '#ffd166', lines: [] },
    { type: 'monkey', behavior: 'swing', at: { edge: 'left', t: 0.2, y: 2.8 }, holds: 'brush', lines: [L('Ich male im Flug!', 'Pinto voando!', 'I paint while flying!')] },
    { type: 'capybara', behavior: 'float', at: { edge: 'front', t: 0.65, y: 0.1 }, outfit: 'paintSpots', lines: [L('Ich bin bunt! Hihi', 'Estou colorida! Hihi', 'I am colourful! Hehe')] },
  ],
  // 15: Saturn studio, the finale
  [
    { type: 'fairy', behavior: 'fly', at: { edge: 'back', t: 0.1, y: 2.4 }, to: { edge: 'back', t: 0.6, y: 2.6 }, lines: [L('Letzte Frage – du schaffst das!', 'Última pergunta – você consegue!', 'Last question – you can do it!')] },
    { type: 'koala', behavior: 'spaceFloat', at: { edge: 'right', t: 0.25, y: 1.8 }, outfit: 'helmet', lines: [L('Wir glauben an dich!', 'A gente acredita em você!', 'We believe in you!')] },
    { type: 'penguin', behavior: 'spaceFloat', at: { edge: 'left', t: 0.3, y: 1.7 }, outfit: 'helmet', lines: [L('Du schaffst das!', 'Você consegue!', 'You can do it!')] },
    { type: 'capybara', behavior: 'cheer', at: { edge: 'front', t: 0.5 }, lines: [L('Hurra!', 'Viva!', 'Hooray!')] },
  ],
]

/** The animals of every stage, in stage order; ids are `a<stage>-<n>`. */
export const STAGE_ANIMALS: readonly (readonly AnimalSpec[])[] = DRAFTS.map((stage, si) =>
  stage.map((d, i) => ({ ...d, id: `a${si + 1}-${i + 1}` }))
)

/** The animals of the stage at `stageIndex` (none beyond the designed stages). */
export function animalsFor(stageIndex: number): readonly AnimalSpec[] {
  return STAGE_ANIMALS[stageIndex] ?? []
}

/** What an animal says in `lang`. */
export function say(line: Line, lang: Lang): string {
  return line[lang] ?? line.de
}
