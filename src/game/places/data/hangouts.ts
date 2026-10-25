import type { Localized } from '../../i18n/languages'

/**
 * What is said in the yard and the library, in every language. There are no school questions here: she talks to
 * friends and things. `{name}` is her name (left out if she gave none).
 */
const T = (de: string, pt: string, en: string): Localized => ({ de, pt, en })

/** What a choice does besides moving the talk on: a happy jump with confetti, a hug with hearts, the ball, or a glowing book. */
export type DialogEffect = 'yay' | 'hug' | 'ball' | 'highlightBook'

export type DialogOption = { label: Localized; next?: string; effect?: DialogEffect; book?: number }
export type DialogNode = { text: Localized; options: DialogOption[] }
/** A talk always starts at 'start'; an option without `next` ends it. */
export type Dialog = Record<string, DialogNode>

/** Friend 1 (a pink unicorn who plays with a ball) asks about her day. */
export const FRIEND_DAY: Dialog = {
  start: {
    text: T('Hallo {name}! Hast du heute einen schönen Tag?', 'Oi {name}! Você está tendo um dia bom hoje?', 'Hi {name}! Are you having a nice day today?'),
    options: [
      { label: T('Ja, super!', 'Sim, ótimo!', 'Yes, great!'), next: 'yes', effect: 'yay' },
      { label: T('Nicht so gut …', 'Não muito …', 'Not so good …'), next: 'no', effect: 'hug' },
    ],
  },
  yes: {
    text: T('Juhu! Das freut mich! Komm, wir hüpfen!', 'Eba! Que legal! Vem, vamos pular!', "Yay! That makes me happy! Come on, let's jump!"),
    options: [{ label: T('Tschüss!', 'Tchau!', 'Bye!') }],
  },
  no: {
    text: T('Oh, komm her, eine Umarmung! Der Tag wird bestimmt noch besser.', 'Ah, vem cá, um abraço! O dia ainda vai ficar melhor.', "Oh, come here, a hug! The day will surely get better."),
    options: [{ label: T('Danke!', 'Obrigada!', 'Thank you!') }],
  },
}

/** Friend 2 (a mint unicorn by the sandbox) asks what she likes to play. */
export const FRIEND_PLAY: Dialog = {
  start: {
    text: T('Hi {name}! Was spielst du am liebsten?', 'Oi {name}! Do que você mais gosta de brincar?', 'Hi {name}! What do you like to play most?'),
    options: [
      { label: T('Schaukeln', 'Balanço', 'Swinging'), next: 'swing' },
      { label: T('Rutschen', 'Escorrega', 'Sliding'), next: 'slide' },
      { label: T('Ball spielen', 'Bola', 'Playing ball'), next: 'ball', effect: 'ball' },
    ],
  },
  swing: { text: T('Schaukeln ist toll! Probier mal die Schaukel!', 'Balançar é demais! Experimenta o balanço!', 'Swinging is great! Try the swing!'), options: [{ label: T('Viel Spaß!', 'Divirta-se!', 'Have fun!') }] },
  slide: { text: T('Die Rutsche ist super schnell!', 'O escorrega é super rápido!', 'The slide is super fast!'), options: [{ label: T('Viel Spaß!', 'Divirta-se!', 'Have fun!') }] },
  ball: { text: T('Fang! Wir spielen zusammen!', 'Pega! Vamos brincar juntos!', "Catch! Let's play together!"), options: [{ label: T('Viel Spaß!', 'Divirta-se!', 'Have fun!') }] },
}

/** The owl who looks after the library. */
export const OWL_LIBRARIAN: Dialog = {
  start: {
    text: T('Hallo {name}! Psst … hier lesen wir leise. Soll ich dir ein Buch zeigen?', 'Oi {name}! Psiu … aqui a gente lê baixinho. Quer que eu mostre um livro?', 'Hello {name}! Psst … we read quietly here. Shall I show you a book?'),
    options: [
      { label: T('Ja, bitte!', 'Sim, por favor!', 'Yes, please!'), next: 'show', effect: 'highlightBook' },
      { label: T('Ich suche selbst', 'Eu mesma procuro', "I'll look myself"), next: 'self' },
    ],
  },
  show: { text: T('Probier dieses hier! Es leuchtet.', 'Experimenta este! Ele está brilhando.', 'Try this one! It is glowing.'), options: [{ label: T('Okay!', 'Tá bom!', 'Okay!') }] },
  self: { text: T('Viel Spaß beim Suchen!', 'Boa busca!', 'Happy searching!'), options: [{ label: T('Okay!', 'Tá bom!', 'Okay!') }] },
}

/** The unicorn who is reading in the nook: recommends a book. */
export const READING_UNICORN: Dialog = {
  start: {
    text: T('Ich lese gerade über Sterne. Was liest du am liebsten?', 'Estou lendo sobre estrelas. O que você mais gosta de ler?', 'I am reading about stars right now. What do you like to read most?'),
    options: [
      { label: T('Tiere', 'Bichos', 'Animals'), next: 'tip', effect: 'highlightBook', book: 1 },
      { label: T('Weltall', 'Espaço', 'Space'), next: 'tip', effect: 'highlightBook', book: 3 },
      { label: T('Süßes', 'Doces', 'Sweets'), next: 'tip', effect: 'highlightBook', book: 2 },
    ],
  },
  tip: { text: T('Dann nimm das leuchtende Buch!', 'Então pega o livro que está brilhando!', 'Then take the glowing book!'), options: [{ label: T('Okay!', 'Tá bom!', 'Okay!') }] },
}

/** What a thing of the yard or the library does when she goes to it. */
export type PlaceThing = {
  id: string
  /** The name of it, for the screen reader and the tooltip. */
  label: Localized
  /** A line it says out loud (an animal, a swing). */
  say?: Localized
  dialog?: Dialog
}

export const YARD_THINGS: readonly PlaceThing[] = [
  { id: 'swing', label: T('Schaukel', 'Balanço', 'Swing'), say: T('Huiii! Höher!', 'Uhuuu! Mais alto!', 'Wheee! Higher!') },
  { id: 'slide', label: T('Rutsche', 'Escorrega', 'Slide'), say: T('Juhuuu!', 'Eeeba!', 'Woohoo!') },
  { id: 'friendDay', label: T('Freund', 'Amigo', 'Friend'), dialog: FRIEND_DAY },
  { id: 'friendPlay', label: T('Freundin', 'Amiga', 'Friend'), dialog: FRIEND_PLAY },
  { id: 'koala', label: T('Koala', 'Coala', 'Koala'), say: T('Ich mache Pause … zzz', 'Estou descansando … zzz', 'I am taking a break … zzz') },
  { id: 'capybara', label: T('Capybara', 'Capivara', 'Capybara'), say: T('Badezeit! Plitsch, platsch!', 'Hora do banho! Splash!', 'Bath time! Splish, splash!') },
]

export const LIBRARY_THINGS: readonly PlaceThing[] = [
  { id: 'books', label: T('Bücher', 'Livros', 'Books') },
  { id: 'owl', label: T('Eule', 'Coruja', 'Owl'), dialog: OWL_LIBRARIAN },
  { id: 'readingUnicorn', label: T('Einhorn', 'Unicórnio', 'Unicorn'), dialog: READING_UNICORN },
  { id: 'globe', label: T('Globus', 'Globo', 'Globe'), say: T('Die Erde dreht sich!', 'A Terra está girando!', 'The Earth is spinning!') },
  { id: 'starLamp', label: T('Sternlampe', 'Lâmpada', 'Star lamp'), say: T('Gemütlich!', 'Aconchegante!', 'Cozy!') },
  { id: 'aquarium', label: T('Aquarium', 'Aquário', 'Aquarium'), say: T('Blub, blub!', 'Blub, blub!', 'Blub, blub!') },
]

/** A book to read: three pages, a picture on the left and the text on the right. */
export type Book = {
  id: number
  color: string
  title: Localized
  pages: [Localized, Localized, Localized]
}

export const BOOKS: readonly Book[] = [
  {
    id: 0,
    color: '#8EC5FF',
    title: T('Der Mond-Koala', 'O coala da lua', 'The Moon Koala'),
    pages: [
      T('Koko der Koala wohnt auf dem Mond.', 'Koko, o coala, mora na lua.', 'Koko the koala lives on the moon.'),
      T('Jede Nacht zählt er die Sterne: 1, 2, 3 …', 'Toda noite ele conta as estrelas: 1, 2, 3 …', 'Every night he counts the stars: 1, 2, 3 …'),
      T('Dann schläft er im Mondkrater ein. Gute Nacht, Koko!', 'Depois dorme na cratera. Boa noite, Koko!', 'Then he falls asleep in a moon crater. Good night, Koko!'),
    ],
  },
  {
    id: 1,
    color: '#C79668',
    title: T('Capybara geht baden', 'A capivara vai ao banho', 'Capybara Takes a Bath'),
    pages: [
      T('Capi liebt warmes Wasser.', 'Capi adora água quentinha.', 'Capi loves warm water.'),
      T('Ein Papagei setzt sich auf ihren Kopf.', 'Um papagaio pousa na cabeça dela.', 'A parrot sits on her head.'),
      T('Zusammen sind sie ganz entspannt. Blub!', 'Juntos ficam bem relaxados. Blub!', 'Together they are totally relaxed. Blub!'),
    ],
  },
  {
    id: 2,
    color: '#FFB3D4',
    title: T('Das Eis-Einhorn', 'O unicórnio do sorvete', 'The Ice-Cream Unicorn'),
    pages: [
      T('Ein kleines Einhorn findet ein Riesen-Eis.', 'Um unicórnio pequeno acha um sorvete gigante.', 'A little unicorn finds a giant ice cream.'),
      T('Es teilt das Eis mit allen Freunden.', 'Ele divide o sorvete com todos os amigos.', 'It shares the ice cream with all its friends.'),
      T('Teilen macht doppelt Freude!', 'Dividir deixa todo mundo feliz!', 'Sharing makes the joy double!'),
    ],
  },
  {
    id: 3,
    color: '#6B4FD8',
    title: T('Amara und die Sterne', 'Amara e as estrelas', 'Amara and the Stars'),
    pages: [
      T('Amara schaut in den Nachthimmel.', 'Amara olha para o céu à noite.', 'Amara looks at the night sky.'),
      T('Ein kleiner Stern winkt ihr zu!', 'Uma estrelinha acena para ela!', 'A little star waves at her!'),
      T('Sie wünscht sich: noch mehr Abenteuer!', 'Ela faz um pedido: mais aventuras!', 'She makes a wish: even more adventures!'),
    ],
  },
  {
    id: 4,
    color: '#7ED39A',
    title: T('Der Regenbogen-Garten', 'O jardim arco-íris', 'The Rainbow Garden'),
    pages: [
      T('Im Garten wachsen bunte Blumen.', 'No jardim crescem flores coloridas.', 'Colourful flowers grow in the garden.'),
      T('Rot, Gelb, Grün, Blau und Lila!', 'Vermelho, amarelo, verde, azul e lilás!', 'Red, yellow, green, blue and purple!'),
      T('Und in der Mitte: ein Donut-Baum!', 'E no meio: uma árvore de donuts!', 'And in the middle: a doughnut tree!'),
    ],
  },
]
