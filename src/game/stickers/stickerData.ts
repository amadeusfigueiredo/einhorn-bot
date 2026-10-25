import type { Localized } from '../i18n/languages'
import { roomsOpen } from '../places/roomsOpen'

/**
 * The play stickers: a sticker for doing something fun, on top of the one for every stage (`data/stickers.ts`). Pure
 * data: what each is called, how to win it and the rule that wins it. Every rule counts one kind of event.
 */
export const STICKER_EVENTS = [
  'visitYard',
  'visitLibrary',
  'kick',
  'bounce',
  'somersault',
  'slide',
  'swing',
  'talk',
  'hug',
  'cheer',
  'book',
  'globe',
  'lamp',
  'aquarium',
  'move',
  'answer',
  'stage',
  'splash',
  'rainbow',
  'dusk',
  'note',
  'song',
  'take',
  'draw',
  'paint',
  'wash',
  'brush',
  'style',
  'groom',
  'groomTake',
  'show',
  'showGold',
  'companion',
  'ride',
  'napoleonDance',
  'moonwalk',
  'feed',
  'feedKind',
  'dinner',
  'dinnerGold',
  'gallop',
  'gallopKind',
  'race',
  'raceGold',
  'swim',
  'swimKind',
  'meet',
  'meetGold',
  'dojo',
  'dojoKind',
  'kataTake',
  'belt',
  'beltGold',
  'groove',
  'grooveKind',
  'floorTake',
  'gala',
  'galaGold',
  'code',
  'codeKind',
  'techDay',
  'techDayGold',
  'discover',
  'discoverKind',
  'labDay',
  'labDayGold',
  'explore',
  'exploreKind',
  'expedition',
  'expeditionGold',
  'glow',
  'glowKind',
  'nightShow',
  'nightShowGold',
] as const
export type StickerEvent = (typeof STICKER_EVENTS)[number]

export type StickerRule = {
  type: StickerEvent
  /** How many it takes. */
  need: number
  /** Count the different things (different friends, books, moves) instead of every time. */
  distinct?: boolean
}

export type PlaySticker = {
  id: string
  emoji: string
  name: Localized
  /** How to win it, said to the child. */
  how: Localized
  rule: StickerRule
}

const T = (de: string, pt: string, en: string): Localized => ({ de, pt, en })

const BASE_STICKERS: readonly PlaySticker[] = [
  { id: 'yard', emoji: '🌳', name: T('Hofkind', 'Criança do pátio', 'Yard kid'), how: T('Geh in den Schulhof.', 'Vá ao pátio da escola.', 'Go out to the schoolyard.'), rule: { type: 'visitYard', need: 1 } },
  { id: 'library', emoji: '📚', name: T('Leseratte', 'Rato de biblioteca', 'Library mouse'), how: T('Geh in die Bibliothek.', 'Vá à biblioteca.', 'Go into the library.'), rule: { type: 'visitLibrary', need: 1 } },
  { id: 'kicker', emoji: '⚽', name: T('Ballkünstlerin', 'Craque da bola', 'Ball star'), how: T('Schieß den Einhornball 5 Mal.', 'Chute a bola de unicórnio 5 vezes.', 'Kick the unicorn ball 5 times.'), rule: { type: 'kick', need: 5 } },
  { id: 'kickerPro', emoji: '🥅', name: T('Torjägerin', 'Artilheira', 'Goal hero'), how: T('Schieß den Ball 25 Mal.', 'Chute a bola 25 vezes.', 'Kick the ball 25 times.'), rule: { type: 'kick', need: 25 } },
  { id: 'bouncer', emoji: '🤸', name: T('Hüpfmeisterin', 'Mestra dos pulos', 'Bounce champion'), how: T('Hüpf 10 Mal auf dem Trampolin.', 'Pule 10 vezes na cama elástica.', 'Bounce 10 times on the trampoline.'), rule: { type: 'bounce', need: 10 } },
  { id: 'somersault', emoji: '🌀', name: T('Saltokönigin', 'Rainha da cambalhota', 'Somersault queen'), how: T('Spring auf dem Trampolin einen Salto.', 'Faça uma cambalhota na cama elástica.', 'Do a somersault on the trampoline.'), rule: { type: 'somersault', need: 1 } },
  { id: 'slider', emoji: '🛝', name: T('Rutschkind', 'Escorregador', 'Slider'), how: T('Rutsch die Rutsche hinunter.', 'Desça pelo escorregador.', 'Go down the slide.'), rule: { type: 'slide', need: 1 } },
  { id: 'sliderPro', emoji: '🎢', name: T('Rutschmeisterin', 'Mestra do escorregador', 'Slide champion'), how: T('Rutsch 5 Mal.', 'Escorregue 5 vezes.', 'Go down the slide 5 times.'), rule: { type: 'slide', need: 5 } },
  { id: 'swinger', emoji: '🎠', name: T('Schaukelkind', 'Balançando', 'Swinger'), how: T('Schaukle auf der Schaukel.', 'Brinque no balanço.', 'Have a go on the swing.'), rule: { type: 'swing', need: 1 } },
  { id: 'hello', emoji: '👋', name: T('Hallo!', 'Olá!', 'Hello!'), how: T('Sprich mit einem Freund.', 'Converse com um amigo.', 'Talk to a friend.'), rule: { type: 'talk', need: 1 } },
  { id: 'chatterbox', emoji: '💬', name: T('Plaudertasche', 'Tagarela', 'Chatterbox'), how: T('Sprich mit 6 verschiedenen Freunden.', 'Converse com 6 amigos diferentes.', 'Talk to 6 different friends.'), rule: { type: 'talk', need: 6, distinct: true } },
  { id: 'hugger', emoji: '🤗', name: T('Kuschelkind', 'Abraçadora', 'Hugger'), how: T('Lass dich von einem Freund trösten.', 'Ganhe um abraço de um amigo.', 'Get a hug from a friend.'), rule: { type: 'hug', need: 1 } },
  { id: 'cheerer', emoji: '🎉', name: T('Jubelkind', 'Torcedora', 'Cheerer'), how: T('Freu dich mit einem Freund.', 'Comemore com um amigo.', 'Cheer with a friend.'), rule: { type: 'cheer', need: 1 } },
  { id: 'reader', emoji: '📖', name: T('Bücherwurm', 'Traça de livros', 'Bookworm'), how: T('Lies ein Buch bis zur letzten Seite.', 'Leia um livro até a última página.', 'Read a book to the last page.'), rule: { type: 'book', need: 1 } },
  { id: 'readerPro', emoji: '🐛', name: T('Großer Bücherwurm', 'Grande traça', 'Big bookworm'), how: T('Lies alle 5 Bücher.', 'Leia todos os 5 livros.', 'Read all 5 books.'), rule: { type: 'book', need: 5, distinct: true } },
  { id: 'globe', emoji: '🌍', name: T('Weltreisende', 'Viajante do mundo', 'World traveller'), how: T('Dreh den Globus.', 'Gire o globo.', 'Spin the globe.'), rule: { type: 'globe', need: 1 } },
  { id: 'lamp', emoji: '🌟', name: T('Gemütlich', 'Aconchego', 'Cozy'), how: T('Mach das Sternenlicht an.', 'Acenda a estrela de luz.', 'Switch on the star lamp.'), rule: { type: 'lamp', need: 1 } },
  { id: 'aquarium', emoji: '🐠', name: T('Fischfreundin', 'Amiga dos peixes', 'Fish friend'), how: T('Tipp auf das Aquarium.', 'Toque no aquário.', 'Tap the aquarium.'), rule: { type: 'aquarium', need: 1 } },
  { id: 'dancer', emoji: '💃', name: T('Tänzerin', 'Dançarina', 'Dancer'), how: T('Tanz einmal (Leertaste).', 'Dance uma vez (barra de espaço).', 'Dance once (Space bar).'), rule: { type: 'move', need: 1 } },
  { id: 'danceStar', emoji: '🕺', name: T('Tanzstar', 'Estrela da dança', 'Dance star'), how: T('Tanz 12 verschiedene Tänze.', 'Dance 12 danças diferentes.', 'Do 12 different dances.'), rule: { type: 'move', need: 12, distinct: true } },
  { id: 'thinker', emoji: '🧠', name: T('Denkerin', 'Pensadora', 'Thinker'), how: T('Beantworte 5 Fragen richtig.', 'Acerte 5 perguntas.', 'Answer 5 questions right.'), rule: { type: 'answer', need: 5 } },
  { id: 'scholar', emoji: '🎓', name: T('Schlauköpfchen', 'Sabichona', 'Clever clogs'), how: T('Beantworte 20 Fragen richtig.', 'Acerte 20 perguntas.', 'Answer 20 questions right.'), rule: { type: 'answer', need: 20 } },
  { id: 'splash', emoji: '💦', name: T('Pfützenspringerin', 'Pula-poças', 'Puddle jumper'), how: T('Spring 5 Mal in eine Pfütze, wenn es regnet.', 'Pule 5 vezes numa poça quando chover.', 'Splash in a puddle 5 times when it rains.'), rule: { type: 'splash', need: 5 } },
  { id: 'rainbow', emoji: '🌈', name: T('Regenbogenfinderin', 'Caçadora de arco-íris', 'Rainbow spotter'), how: T('Sieh den Regenbogen im Schulhof.', 'Veja o arco-íris no pátio.', 'See the rainbow in the schoolyard.'), rule: { type: 'rainbow', need: 1 } },
  { id: 'dusk', emoji: '🌙', name: T('Glühwürmchenfreundin', 'Amiga dos vaga-lumes', 'Firefly friend'), how: T('Bleib im Schulhof, bis die Glühwürmchen kommen.', 'Fique no pátio até os vaga-lumes aparecerem.', 'Stay in the yard until the fireflies come out.'), rule: { type: 'dusk', need: 1 } },
  { id: 'musician', emoji: '🎹', name: T('Musikerin', 'Musicista', 'Musician'), how: T('Spiel alle 8 Klänge des Xylophons.', 'Toque todas as 8 notas do xilofone.', 'Play all 8 notes of the xylophone.'), rule: { type: 'note', need: 8, distinct: true } },
  { id: 'songPlayer', emoji: '🎶', name: T('Liedspielerin', 'Tocadora de músicas', 'Song player'), how: T('Spiel ein ganzes Lied mit den Lichtern mit.', 'Toque uma música inteira seguindo as luzes.', 'Play a whole song along with the lights.'), rule: { type: 'song', need: 1 } },
  { id: 'concert', emoji: '🎤', name: T('Konzertstar', 'Estrela do concerto', 'Concert star'), how: T('Spiel alle 3 Lieder mit.', 'Toque as 3 músicas.', 'Play all 3 songs.'), rule: { type: 'song', need: 3, distinct: true } },
  { id: 'composer', emoji: '🎼', name: T('Komponistin', 'Compositora', 'Composer'), how: T('Nimm eine Melodie mit mindestens 4 Tönen auf und spiel sie ab.', 'Grave uma melodia de pelo menos 4 notas e toque de volta.', 'Record a tune of at least 4 notes and play it back.'), rule: { type: 'take', need: 1 } },
  { id: 'artist', emoji: '🎨', name: T('Künstlerin', 'Artista', 'Artist'), how: T('Mal etwas auf der Staffelei.', 'Desenhe algo no cavalete.', 'Draw something on the easel.'), rule: { type: 'draw', need: 1 } },
  { id: 'painter', emoji: '🖌️', name: T('Malerin', 'Pintora', 'Painter'), how: T('Mal 25 Striche.', 'Faça 25 traços.', 'Draw 25 strokes.'), rule: { type: 'draw', need: 25 } },
  { id: 'colourful', emoji: '🖍️', name: T('Farbenfroh', 'Colorida', 'Colourful'), how: T('Mal mit 6 verschiedenen Farben.', 'Desenhe com 6 cores diferentes.', 'Paint with 6 different colours.'), rule: { type: 'paint', need: 6, distinct: true } },
  { id: 'firstStage', emoji: '⭐', name: T('Erste Klasse geschafft', 'Primeira turma concluída', 'First class done'), how: T('Schaff eine Klasse.', 'Conclua uma turma.', 'Finish a class.'), rule: { type: 'stage', need: 1 } },
  { id: 'fiveStages', emoji: '🏅', name: T('Fünf Klassen', 'Cinco turmas', 'Five classes'), how: T('Schaff fünf Klassen.', 'Conclua cinco turmas.', 'Finish five classes.'), rule: { type: 'stage', need: 5 } },
]

/** The stickers of the special rooms (the pony yard so far): only there while the rooms are (see `places/roomsOpen.ts`), so the book never asks for what a child cannot reach. */
const ROOM_STICKERS: readonly PlaySticker[] = [
  { id: 'ponyWasher', emoji: '🧽', name: T('Ponywäscherin', 'Lavadora de póneis', 'Pony washer'), how: T('Wasch Napoleon: reibe erst Seife, dann Wasser auf den Matsch.', 'Lave o Napoleão: esfregue sabão e depois enxague.', 'Wash Napoleon: soap first, then rinse the mud off.'), rule: { type: 'wash', need: 1 } },
  { id: 'ponyBrusher', emoji: '🪮', name: T('Glanzbürste', 'Escova brilhante', 'Shiny brush'), how: T('Bürste Napoleons Knoten aus dem Fell.', 'Escove os nós do Napoleão.', 'Brush the tangles out of Napoleon.'), rule: { type: 'brush', need: 1 } },
  { id: 'ponyBraider', emoji: '🎀', name: T('Bänderkünstlerin', 'Artista das fitas', 'Ribbon artist'), how: T('Binde Bänder in Napoleons Zopf nach einem Muster.', 'Amarre fitas na trança do Napoleão num padrão.', 'Tie ribbons into Napoleon\'s braid in a pattern.'), rule: { type: 'style', need: 1 } },
  { id: 'ponyCarer', emoji: '💖', name: T('Napoleons Pflegerin', 'Cuidadora do Napoleão', 'Napoleon\'s carer'), how: T('Wasch, bürste und frisiere Napoleon, alle drei Aufgaben.', 'Lave, escove e penteie o Napoleão: as três tarefas.', 'Wash, brush and style Napoleon: all three tasks.'), rule: { type: 'groom', need: 3, distinct: true } },
  { id: 'ponyStylist', emoji: '✨', name: T('Frisurenkünstlerin', 'Cabeleireira de póneis', 'Hair artist'), how: T('Erfinde eine Frisur mit mindestens 3 Bändern und spiel sie ab.', 'Invente um penteado com pelo menos 3 fitas e reproduza-o.', 'Make up a style with at least 3 ribbons and play it back.'), rule: { type: 'groomTake', need: 1 } },
  { id: 'showStar', emoji: '🏆', name: T('Schaustar', 'Estrela do espetáculo', 'Show star'), how: T('Schaff eine Schau: Napoleon gewaschen, gebürstet und geflochten.', 'Vença um espetáculo: Napoleão lavado, escovado e entrançado.', 'Win a show: Napoleon washed, brushed and braided.'), rule: { type: 'show', need: 1 } },
  { id: 'showGold', emoji: '🥇', name: T('Ohne Hilfe', 'Sem ajuda', 'No help needed'), how: T('Gewinne eine Schau, ohne dir den Weg zeigen zu lassen.', 'Vença um espetáculo sem pedir o caminho.', 'Win a show without asking for the way.'), rule: { type: 'showGold', need: 1 } },
  { id: 'napoleonFriend', emoji: '🤝', name: T('Napoleons Freundin', 'Amiga do Napoleão', 'Napoleon\'s friend'), how: T('Nimm Napoleon aus dem Ponyhof mit.', 'Leve o Napoleão com você da quinta dos póneis.', 'Take Napoleon with you from the pony yard.'), rule: { type: 'companion', need: 1 } },
  { id: 'rider', emoji: '🏇', name: T('Reiterin', 'Cavaleira', 'Rider'), how: T('Reite auf Napoleon, statt zu laufen.', 'Monte o Napoleão em vez de andar.', 'Ride Napoleon instead of walking.'), rule: { type: 'ride', need: 1 } },
  { id: 'moonwalker', emoji: '🌛', name: T('Moonwalker', 'Moonwalker', 'Moonwalker'), how: T('Lass Napoleon den Moonwalk tanzen.', 'Peça ao Napoleão para dançar o moonwalk.', 'Have Napoleon dance the moonwalk.'), rule: { type: 'moonwalk', need: 1 } },
  { id: 'napoleonDancer', emoji: '🪩', name: T('Tanzlehrerin', 'Professora de dança', 'Dance teacher'), how: T('Lass Napoleon alle 12 Tänze tanzen.', 'Peça ao Napoleão para dançar as 12 danças.', 'Have Napoleon do all 12 dances.'), rule: { type: 'napoleonDance', need: 12, distinct: true } },
  { id: 'ponyFeeder', emoji: '🥕', name: T('Ponyfütterin', 'Alimentadora de póneis', 'Pony feeder'), how: T('Füttere Napoleon: schaff eine Fütterungs-Lektion.', 'Alimente o Napoleão: faça uma lição de alimentação.', 'Feed Napoleon: do a feeding lesson through.'), rule: { type: 'feed', need: 1 } },
  { id: 'ponyChef', emoji: '🥣', name: T('Ponykoch', 'Cozinheira de póneis', 'Pony chef'), how: T('Schaff Futter, Wasser und Portionen: alle drei Aufgaben.', 'Faça comida, água e porções: as três tarefas.', 'Do food, water and portions: all three feeding tasks.'), rule: { type: 'feedKind', need: 3, distinct: true } },
  { id: 'dinnerStar', emoji: '🍽️', name: T('Abendessen-Star', 'Estrela do jantar', 'Dinner star'), how: T('Gib Napoleon sein Abendessen als Herausforderung.', 'Dê o jantar ao Napoleão como desafio.', 'Give Napoleon his dinner as a challenge.'), rule: { type: 'dinner', need: 1 } },
  { id: 'dinnerGold', emoji: '🥉', name: T('Ohne Hilfe gefüttert', 'Jantar sem ajuda', 'Dinner, no help'), how: T('Schaff das Abendessen, ohne dir den Weg zeigen zu lassen.', 'Faça o jantar sem pedir o caminho.', 'Win the dinner without asking for the way.'), rule: { type: 'dinnerGold', need: 1 } },
  { id: 'feast', emoji: '🎂', name: T('Festmahl', 'Banquete', 'Feast'), how: T('Schaff alle 3 Abendessen.', 'Faça os 3 jantares.', 'Do all 3 dinners.'), rule: { type: 'dinner', need: 3, distinct: true } },
  { id: 'ponyRunner', emoji: '🐎', name: T('Galoppläuferin', 'Corredora de galope', 'Gallop learner'), how: T('Lerne eine Gangart oder einen Sprung mit Napoleon.', 'Aprenda um andamento ou um salto com o Napoleão.', 'Learn a gait or a jump with Napoleon.'), rule: { type: 'gallop', need: 1 } },
  { id: 'allGaits', emoji: '🐴', name: T('Alle Gangarten', 'Todos os andamentos', 'All the gaits'), how: T('Schaff die drei Reitaufgaben: Gangarten, Sprünge und Weg.', 'Faça as três tarefas: andamentos, saltos e caminho.', 'Do the three riding tasks: gaits, jumps and the trail.'), rule: { type: 'gallopKind', need: 3, distinct: true } },
  { id: 'raceStar', emoji: '🎽', name: T('Rennstar', 'Estrela da corrida', 'Race star'), how: T('Gewinne ein Rennen als Herausforderung.', 'Vença uma corrida como desafio.', 'Win a race as a challenge.'), rule: { type: 'race', need: 1 } },
  { id: 'raceGold', emoji: '🥈', name: T('Ohne Hilfe im Ziel', 'Meta sem ajuda', 'No help to the finish'), how: T('Gewinne ein Rennen, ohne dir den Weg zeigen zu lassen.', 'Vença uma corrida sem pedir o caminho.', 'Win a race without asking for the way.'), rule: { type: 'raceGold', need: 1 } },
  { id: 'grandRace', emoji: '🏁', name: T('Große Meisterschaft', 'Grande campeonato', 'Grand championship'), how: T('Gewinne alle 3 Rennen.', 'Vença as 3 corridas.', 'Win all 3 races.'), rule: { type: 'race', need: 3, distinct: true } },
  { id: 'swimmer', emoji: '🏊', name: T('Schwimmerin', 'Nadadora', 'Swimmer'), how: T('Schaff eine Lektion im Schwimmbad.', 'Faça uma lição na piscina.', 'Do a lesson at the pool.'), rule: { type: 'swim', need: 1 } },
  { id: 'poolPro', emoji: '🥽', name: T('Wasserratte', 'Rata de água', 'Water rat'), how: T('Schaff fertig machen, schwimmen und springen: alle drei Aufgaben.', 'Faça preparar-se, nadar e saltar: as três tarefas.', 'Do getting ready, swimming and jumping: all three tasks.'), rule: { type: 'swimKind', need: 3, distinct: true } },
  { id: 'meetStar', emoji: '🎖️', name: T('Wettkampfstar', 'Estrela da competição', 'Swim meet star'), how: T('Schaff einen Schwimmtag als Herausforderung.', 'Faça um dia de natação como desafio.', 'Do a swim day as a challenge.'), rule: { type: 'meet', need: 1 } },
  { id: 'meetGold', emoji: '🌊', name: T('Ohne Hilfe im Wasser', 'Na água sem ajuda', 'In the water, no help'), how: T('Schaff einen Schwimmtag, ohne dir den Weg zeigen zu lassen.', 'Faça um dia de natação sem pedir o caminho.', 'Do a swim day without asking for the way.'), rule: { type: 'meetGold', need: 1 } },
  { id: 'grandMeet', emoji: '🐬', name: T('Schwimm-Meisterin', 'Campeã de natação', 'Swim champion'), how: T('Schaff alle 3 Schwimmtage.', 'Faça os 3 dias de natação.', 'Do all 3 swim days.'), rule: { type: 'meet', need: 3, distinct: true } },
  { id: 'dojoStudent', emoji: '🥋', name: T('Dojo-Schülerin', 'Aluna do dojo', 'Dojo student'), how: T('Schaff eine Lektion im Dojo.', 'Faça uma lição no dojo.', 'Do a lesson in the dojo.'), rule: { type: 'dojo', need: 1 } },
  { id: 'dojoPro', emoji: '🙇', name: T('Gute Schülerin', 'Boa aluna', 'Good student'), how: T('Schaff Regeln, Techniken und eine Kata: alle drei Aufgaben.', 'Faça regras, técnicas e um kata: as três tarefas.', 'Do manners, techniques and a kata: all three tasks.'), rule: { type: 'dojoKind', need: 3, distinct: true } },
  { id: 'kataMaker', emoji: '🌸', name: T('Kata-Künstlerin', 'Artista do kata', 'Kata maker'), how: T('Erfinde eine Kata mit mindestens 4 Schritten und spiel sie ab.', 'Invente um kata com pelo menos 4 passos e reproduza-o.', 'Make up a kata with at least 4 steps and play it back.'), rule: { type: 'kataTake', need: 1 } },
  { id: 'beltStar', emoji: '🥷', name: T('Gürtelprüfung bestanden', 'Passou no exame', 'Belt passed'), how: T('Besteh eine Gürtelprüfung als Herausforderung.', 'Passe num exame de cinto como desafio.', 'Pass a belt test as a challenge.'), rule: { type: 'belt', need: 1 } },
  { id: 'beltGold', emoji: '🧘', name: T('Ruhig ohne Hilfe', 'Calma e sem ajuda', 'Calm, no help'), how: T('Besteh eine Prüfung, ohne dir den Weg zeigen zu lassen.', 'Passe num exame sem pedir o caminho.', 'Pass a test without asking for the way.'), rule: { type: 'beltGold', need: 1 } },
  { id: 'blackBelt', emoji: '⬛', name: T('Schwarzer Gürtel', 'Cinto preto', 'Black belt'), how: T('Besteh alle 3 Gürtelprüfungen.', 'Passe nos 3 exames.', 'Pass all 3 belt tests.'), rule: { type: 'belt', need: 3, distinct: true } },
  { id: 'groover', emoji: '🩰', name: T('Tänzerin im Takt', 'Dançarina no ritmo', 'Groover'), how: T('Schaff eine Lektion im Tanzsaal.', 'Faça uma lição na sala de dança.', 'Do a lesson in the dance hall.'), rule: { type: 'groove', need: 1 } },
  { id: 'danceHallPro', emoji: '🎧', name: T('Tanzsaal-Profi', 'Profissional da dança', 'Dance hall pro'), how: T('Schaff Ballett, Hip-Hop und Leuchtboden: alle drei Aufgaben.', 'Faça ballet, hip-hop e chão de luzes: as três tarefas.', 'Do ballet, hip-hop and the light-up floor: all three tasks.'), rule: { type: 'grooveKind', need: 3, distinct: true } },
  { id: 'floorMaker', emoji: '🔆', name: T('Lichtboden-Künstlerin', 'Artista do chão de luzes', 'Light floor maker'), how: T('Erfinde einen Bodentanz mit mindestens 4 Feldern und spiel ihn ab.', 'Invente uma dança com pelo menos 4 peças e reproduza-a.', 'Make up a floor dance with at least 4 tiles and play it back.'), rule: { type: 'floorTake', need: 1 } },
  { id: 'galaStar', emoji: '🎭', name: T('Galastar', 'Estrela da gala', 'Gala star'), how: T('Tanz eine Gala als Herausforderung.', 'Dance uma gala como desafio.', 'Dance a gala as a challenge.'), rule: { type: 'gala', need: 1 } },
  { id: 'galaGold', emoji: '🪞', name: T('Ohne Hilfe auf der Bühne', 'No palco sem ajuda', 'On stage, no help'), how: T('Tanz eine Gala, ohne dir den Weg zeigen zu lassen.', 'Dance uma gala sem pedir o caminho.', 'Dance a gala without asking for the way.'), rule: { type: 'galaGold', need: 1 } },
  { id: 'grandGala', emoji: '🎆', name: T('Tanzkönigin', 'Rainha da dança', 'Dance queen'), how: T('Tanz alle 3 Galas.', 'Dance as 3 galas.', 'Dance all 3 galas.'), rule: { type: 'gala', need: 3, distinct: true } },
  { id: 'coder', emoji: '🖥️', name: T('Programmiererin', 'Programadora', 'Coder'), how: T('Schaff eine Lektion im Technikraum.', 'Faça uma lição na sala de tecnologia.', 'Do a lesson in the tech room.'), rule: { type: 'code', need: 1 } },
  { id: 'techPro', emoji: '🔌', name: T('Technik-Profi', 'Profissional de tecnologia', 'Tech pro'), how: T('Schaff Roboter, Telefon und Internet: alle drei Aufgaben.', 'Faça robô, telefone e internet: as três tarefas.', 'Do the robot, the phone and the internet: all three tasks.'), rule: { type: 'codeKind', need: 3, distinct: true } },
  { id: 'techStar', emoji: '🛰️', name: T('Technik-Star', 'Estrela da tecnologia', 'Tech star'), how: T('Schaff einen Technik-Tag als Herausforderung.', 'Faça um dia de tecnologia como desafio.', 'Do a tech day as a challenge.'), rule: { type: 'techDay', need: 1 } },
  { id: 'techGold', emoji: '📡', name: T('Ohne Hilfe verbunden', 'Ligada sem ajuda', 'Connected, no help'), how: T('Schaff einen Technik-Tag, ohne dir den Weg zeigen zu lassen.', 'Faça um dia de tecnologia sem pedir o caminho.', 'Do a tech day without asking for the way.'), rule: { type: 'techDayGold', need: 1 } },
  { id: 'grandTech', emoji: '🧑‍💻', name: T('Technik-Meisterin', 'Mestra da tecnologia', 'Tech master'), how: T('Schaff alle 3 Technik-Tage.', 'Faça os 3 dias de tecnologia.', 'Do all 3 tech days.'), rule: { type: 'techDay', need: 3, distinct: true } },
  { id: 'scientist', emoji: '🔬', name: T('Forscherin', 'Cientista', 'Scientist'), how: T('Schaff eine Lektion im Wissenschaftsraum.', 'Faça uma lição na sala de ciências.', 'Do a lesson in the science room.'), rule: { type: 'discover', need: 1 } },
  { id: 'labPro', emoji: '🧬', name: T('Labor-Profi', 'Profissional de laboratório', 'Lab pro'), how: T('Schaff Chemie, Strom und Weltraum: alle drei Aufgaben.', 'Faça química, eletricidade e espaço: as três tarefas.', 'Do chemistry, electricity and space: all three tasks.'), rule: { type: 'discoverKind', need: 3, distinct: true } },
  { id: 'labStar', emoji: '🥼', name: T('Labor-Star', 'Estrela do laboratório', 'Lab star'), how: T('Schaff einen Labortag als Herausforderung.', 'Faça um dia de laboratório como desafio.', 'Do a lab day as a challenge.'), rule: { type: 'labDay', need: 1 } },
  { id: 'labGold', emoji: '🔭', name: T('Ohne Hilfe entdeckt', 'Descoberta sem ajuda', 'Discovered, no help'), how: T('Schaff einen Labortag, ohne dir den Weg zeigen zu lassen.', 'Faça um dia de laboratório sem pedir o caminho.', 'Do a lab day without asking for the way.'), rule: { type: 'labDayGold', need: 1 } },
  { id: 'grandLab', emoji: '🚀', name: T('Nobelpreis-Träumerin', 'Sonhadora do Nobel', 'Nobel dreamer'), how: T('Schaff alle 3 Labortage.', 'Faça os 3 dias de laboratório.', 'Do all 3 lab days.'), rule: { type: 'labDay', need: 3, distinct: true } },
  { id: 'explorer', emoji: '🧭', name: T('Entdeckerin', 'Exploradora', 'Explorer'), how: T('Schaff eine Lektion am Globus.', 'Faça uma lição no globo.', 'Do a lesson at the globe.'), rule: { type: 'explore', need: 1 } },
  { id: 'mapReader', emoji: '🗺️', name: T('Kartenleserin', 'Leitora de mapas', 'Map reader'), how: T('Schaff Kontinente, Ozeane und Hallos: alle drei Aufgaben.', 'Faça continentes, oceanos e olás: as três tarefas.', 'Do continents, oceans and hellos: all three tasks.'), rule: { type: 'exploreKind', need: 3, distinct: true } },
  { id: 'captainStar', emoji: '⛵', name: T('Kapitänin', 'Capitã', 'Captain'), how: T('Schaff eine Expedition als Herausforderung.', 'Faça uma expedição como desafio.', 'Do an expedition as a challenge.'), rule: { type: 'expedition', need: 1 } },
  { id: 'captainGold', emoji: '🌐', name: T('Ohne Hilfe um die Welt', 'À volta do mundo sem ajuda', 'Round the world, no help'), how: T('Schaff eine Expedition, ohne dir den Weg zeigen zu lassen.', 'Faça uma expedição sem pedir o caminho.', 'Do an expedition without asking for the way.'), rule: { type: 'expeditionGold', need: 1 } },
  { id: 'grandExpedition', emoji: '🏝️', name: T('Weltumseglerin', 'Navegadora do mundo', 'World sailor'), how: T('Schaff alle 3 Expeditionen.', 'Faça as 3 expedições.', 'Do all 3 expeditions.'), rule: { type: 'expedition', need: 3, distinct: true } },
  { id: 'lampLearner', emoji: '🔦', name: T('Lichtforscherin', 'Pesquisadora da luz', 'Light finder'), how: T('Schaff eine Lektion an der Sternenlampe.', 'Faça uma lição na lâmpada de estrela.', 'Do a lesson at the star lamp.'), rule: { type: 'glow', need: 1 } },
  { id: 'skyPro', emoji: '💫', name: T('Himmelskennerin', 'Conhecedora do céu', 'Sky pro'), how: T('Schaff Farben, Mond und Sterne: alle drei Aufgaben.', 'Faça cores, lua e estrelas: as três tarefas.', 'Do colours, the moon and the stars: all three tasks.'), rule: { type: 'glowKind', need: 3, distinct: true } },
  { id: 'nightStar', emoji: '🌌', name: T('Nachtstar', 'Estrela da noite', 'Night star'), how: T('Schaff eine Nachtshow als Herausforderung.', 'Faça um espetáculo da noite como desafio.', 'Do a night show as a challenge.'), rule: { type: 'nightShow', need: 1 } },
  { id: 'nightGold', emoji: '🌠', name: T('Ohne Hilfe unter den Sternen', 'Sob as estrelas sem ajuda', 'Under the stars, no help'), how: T('Schaff eine Nachtshow, ohne dir den Weg zeigen zu lassen.', 'Faça um espetáculo da noite sem pedir o caminho.', 'Do a night show without asking for the way.'), rule: { type: 'nightShowGold', need: 1 } },
  { id: 'grandNight', emoji: '🌃', name: T('Sternenkönigin', 'Rainha das estrelas', 'Star queen'), how: T('Schaff alle 3 Nachtshows.', 'Faça os 3 espetáculos da noite.', 'Do all 3 night shows.'), rule: { type: 'nightShow', need: 3, distinct: true } },
  { id: 'grandShow', emoji: '🎪', name: T('Große Schau', 'Grande espetáculo', 'Grand show'), how: T('Gewinne alle 3 Schauen.', 'Vença os 3 espetáculos.', 'Win all 3 shows.'), rule: { type: 'show', need: 3, distinct: true } },
]

export const PLAY_STICKERS: readonly PlaySticker[] = roomsOpen() ? [...BASE_STICKERS, ...ROOM_STICKERS] : BASE_STICKERS

export function stickerById(id: string): PlaySticker | undefined {
  return PLAY_STICKERS.find((s) => s.id === id)
}
