// What every 3D stage looks like: a room in the unicorn school that fits the
// subject, carrying the mood of that stage's 2D background picture. Pure data,
// keyed by the stage's scene name, so stages can be added or reordered without
// shifting rooms. No words go into the rooms (only numbers, symbols, shapes),
// so they never need translating.
import type { SceneName } from '../types'
import type { TimeOfDay } from './timeOfDay'
import type { ParticleKind } from './particles'
import type { WorldId } from './worlds'

export type DecorId =
  | 'chalkboard'
  | 'desk'
  | 'bookshelf'
  | 'abacus'
  | 'numberBlocks'
  | 'geoShapes'
  | 'roseBush'
  | 'rosePot'
  | 'plantPot'
  | 'aquarium'
  | 'globe'
  | 'telescope'
  | 'planetRinged'
  | 'planetSmall'
  | 'moon'
  | 'planetMobile'
  | 'starField'
  | 'flaskSet'
  | 'beaker'
  | 'piano'
  | 'drum'
  | 'musicStand'
  | 'noteFloat'
  | 'spotlight'
  | 'easel'
  | 'paintPots'
  | 'sculpture'
  | 'frame'
  | 'rainbowArch'
  | 'waterfall'
  | 'bird'
  | 'cloud'
  | 'letterBlocks'
  | 'stoneTower'
  | 'feather'
  | 'petal'
  | 'book'
  | 'donut'
  | 'iceCream'
  | 'funnyFlower'
  | 'sunFlower'
  | 'rainbowCloud'
  | 'castle'
  | 'lollipop'
  | 'starLollipop'
  | 'donutTower'
  | 'cupcake'
  | 'cake'
  | 'mushroom'
  | 'rocket'
  | 'crystal'
  | 'balloon'
  | 'rollDonut'
  | 'bouncyBall'
  | 'palm'
  | 'umbrella'
  | 'surfboard'
  | 'sandcastle'
  | 'crater'
  | 'ufo'
  | 'earth'
  | 'bigTree'
  | 'lantern'
  | 'eucalyptus'
  | 'lilyPad'
  | 'pool'
  | 'steam'
  | 'floatingIsland'
  | 'glowMushroom'
  | 'glowPlant'
  | 'aurora'
  | 'igloo'
  | 'snowman'
  | 'awning'
  | 'macaronStool'
  | 'cliff'
  | 'paintFall'
  | 'comet'
  | 'seaShell'
  | 'lighthouse'
  | 'coral'
  | 'seaweed'
  | 'clam'
  | 'bubble'

/**
 * Where a piece goes, relative to the play area: along the back or a side
 * wall, in the back or front corners, along the low front edge, or up in the
 * air above the back of the room.
 */
export type Zone = 'backWall' | 'leftWall' | 'rightWall' | 'cornersBack' | 'cornersFront' | 'frontEdge' | 'sky'

/** What the windows show. */
export type WindowView =
  | 'none' | 'storm' | 'stars' | 'clouds' | 'waterfall' | 'meadow' | 'rainbow'
  | 'sea' | 'moon' | 'underwater' | 'aurora' | 'canyon' | 'forest'

/** What the floor is made of. */
export type FloorKind = 'wood' | 'tiles' | 'stone' | 'carpet' | 'sand' | 'grass' | 'checker' | 'ice' | 'cloud' | 'water' | 'moon'

export type DecorPlacement = { kind: DecorId; zone: Zone; count?: number }

export type RoomPalette = {
  wall: string
  floor: string
  floorAlt: string
  /** Main light tint. */
  light: string
  /** Trim, glows and small details. */
  accent: string
  /** Floating sparkles. */
  sparkle: string
  /** Behind everything (the page around the 3D view). */
  sky: string
}

export type RoomSpec = {
  /** The 2D background this room takes its mood from (an image key). */
  inspiredBy: string
  /** Which of the 15 worlds this is (its name is in worlds.ts). */
  world: WorldId
  /** Morning, sunset or night: easy, medium or hard stages. */
  time: TimeOfDay
  /** What drifts through the air. */
  particles: ParticleKind
  /** The one piece that makes this world itself; no two worlds share one. */
  hero: DecorId
  palette: RoomPalette
  floor: FloorKind
  walls: { back: boolean; left: boolean; right: boolean; windows: WindowView }
  decor: readonly DecorPlacement[]
}

const WALLS = { back: true, left: true, right: true } as const

export const CLASSROOMS: Record<SceneName, RoomSpec> = {
  // 1. Maths: the candy classroom. Pink walls, a checker floor, a little castle.
  stage1: {
    inspiredBy: 'stage1Background',
    world: 'candyClassroom',
    time: 'morning',
    particles: 'confetti',
    hero: 'castle',
    palette: { wall: '#ffb3d9', floor: '#ffe3ef', floorAlt: '#fff0d6', light: '#fff4e6', accent: '#ff7eb6', sparkle: '#ffd1e8', sky: '#ffb3d9' },
    floor: 'checker',
    walls: { ...WALLS, windows: 'meadow' },
    decor: [
      { kind: 'chalkboard', zone: 'backWall' },
      { kind: 'castle', zone: 'backWall' },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'abacus', zone: 'leftWall' },
      { kind: 'numberBlocks', zone: 'rightWall' },
      { kind: 'donutTower', zone: 'cornersBack', count: 2 },
      { kind: 'lollipop', zone: 'cornersFront' },
      { kind: 'cupcake', zone: 'cornersFront' },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'rollDonut', zone: 'frontEdge' },
      { kind: 'balloon', zone: 'sky', count: 2 },
      { kind: 'petal', zone: 'sky', count: 4 },
    ],
  },
  // 2. Maths: the beach school at sunset. Sand, palms, a surfboard for a board.
  stage2: {
    inspiredBy: 'stage2Background',
    world: 'beach',
    time: 'sunset',
    particles: 'sparkles',
    hero: 'surfboard',
    palette: { wall: '#9fd4ff', floor: '#ffe2a8', floorAlt: '#ffd88f', light: '#fff1d6', accent: '#ff7e9e', sparkle: '#fff1a8', sky: '#ffc48a' },
    floor: 'sand',
    walls: { ...WALLS, windows: 'sea' },
    decor: [
      { kind: 'surfboard', zone: 'backWall' },
      { kind: 'donut', zone: 'backWall' },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'palm', zone: 'leftWall' },
      { kind: 'palm', zone: 'rightWall' },
      { kind: 'umbrella', zone: 'cornersBack', count: 2 },
      { kind: 'sandcastle', zone: 'cornersFront' },
      { kind: 'starLollipop', zone: 'cornersFront' },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'bouncyBall', zone: 'frontEdge' },
      { kind: 'feather', zone: 'sky', count: 4 },
    ],
  },
  // 3. Maths: the moon class at night. Craters, Earth in the sky, a rocket.
  stage3: {
    inspiredBy: 'stage3Background',
    world: 'moon',
    time: 'night',
    particles: 'stars',
    hero: 'rocket',
    palette: { wall: '#2a2350', floor: '#c9bedf', floorAlt: '#b7abd0', light: '#e6eaff', accent: '#b79cff', sparkle: '#fff1a8', sky: '#0e0a26' },
    floor: 'moon',
    walls: { ...WALLS, windows: 'moon' },
    decor: [
      { kind: 'chalkboard', zone: 'backWall' },
      { kind: 'rocket', zone: 'backWall' },
      { kind: 'crater', zone: 'cornersFront', count: 2 },
      { kind: 'crystal', zone: 'cornersBack', count: 2 },
      { kind: 'earth', zone: 'sky' },
      { kind: 'ufo', zone: 'sky' },
      { kind: 'planetSmall', zone: 'sky' },
      { kind: 'starField', zone: 'sky' },
      { kind: 'sunFlower', zone: 'frontEdge', count: 2 },
      { kind: 'balloon', zone: 'sky', count: 2 },
    ],
  },
  // 4. German: the treehouse library. Wooden planks, a giant tree, books.
  stage4: {
    inspiredBy: 'stage4Background',
    world: 'treehouse',
    time: 'morning',
    particles: 'leaves',
    hero: 'bigTree',
    palette: { wall: '#b07e4a', floor: '#d6a86a', floorAlt: '#c99658', light: '#fff4e1', accent: '#7ed3a0', sparkle: '#ffe08a', sky: '#7ed3a0' },
    floor: 'wood',
    walls: { ...WALLS, windows: 'forest' },
    decor: [
      { kind: 'bigTree', zone: 'backWall' },
      { kind: 'bookshelf', zone: 'backWall', count: 2 },
      { kind: 'rainbowArch', zone: 'backWall' },
      { kind: 'letterBlocks', zone: 'frontEdge', count: 3 },
      { kind: 'mushroom', zone: 'cornersFront', count: 2 },
      { kind: 'lollipop', zone: 'cornersBack', count: 2 },
      { kind: 'sunFlower', zone: 'frontEdge', count: 2 },
      { kind: 'rollDonut', zone: 'frontEdge' },
      { kind: 'petal', zone: 'sky', count: 5 },
    ],
  },
  // 5. German: the underwater school. Blue water floor, coral, a giant clam.
  stage5: {
    inspiredBy: 'stage5Background',
    world: 'underwater',
    time: 'sunset',
    particles: 'bubbles',
    hero: 'clam',
    palette: { wall: '#3fa7d6', floor: '#4fb4e0', floorAlt: '#69c6ee', light: '#d6f5ff', accent: '#ff9ec4', sparkle: '#e6fbff', sky: '#1f6fa8' },
    floor: 'water',
    walls: { ...WALLS, windows: 'underwater' },
    decor: [
      { kind: 'clam', zone: 'backWall' },
      { kind: 'bookshelf', zone: 'backWall', count: 2 },
      { kind: 'coral', zone: 'cornersBack', count: 2 },
      { kind: 'seaweed', zone: 'leftWall', count: 2 },
      { kind: 'seaweed', zone: 'rightWall', count: 2 },
      { kind: 'letterBlocks', zone: 'cornersFront', count: 2 },
      { kind: 'cupcake', zone: 'cornersFront' },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'bouncyBall', zone: 'frontEdge' },
      { kind: 'starLollipop', zone: 'cornersBack' },
      { kind: 'bubble', zone: 'sky', count: 6 },
    ],
  },
  // 6. German: the cloud castle at night. Lanterns, towers, cloud cushions.
  stage6: {
    inspiredBy: 'stage6Background',
    world: 'cloudCastle',
    time: 'night',
    particles: 'stars',
    hero: 'stoneTower',
    palette: { wall: '#6b4fd8', floor: '#e9e1ff', floorAlt: '#f4efff', light: '#eef2ff', accent: '#c9a7ff', sparkle: '#fff1a8', sky: '#2f3570' },
    floor: 'cloud',
    walls: { ...WALLS, windows: 'stars' },
    decor: [
      { kind: 'castle', zone: 'backWall' },
      { kind: 'rainbowArch', zone: 'backWall' },
      { kind: 'stoneTower', zone: 'cornersBack' },
      { kind: 'bookshelf', zone: 'leftWall', count: 2 },
      { kind: 'bookshelf', zone: 'rightWall', count: 2 },
      { kind: 'lantern', zone: 'sky', count: 3 },
      { kind: 'cloud', zone: 'sky', count: 3 },
      { kind: 'bird', zone: 'sky', count: 3 },
      { kind: 'lollipop', zone: 'cornersFront' },
      { kind: 'cupcake', zone: 'cornersFront' },
      { kind: 'sunFlower', zone: 'frontEdge', count: 2 },
      { kind: 'balloon', zone: 'sky', count: 2 },
    ],
  },
  // 7. Science: the koala forest in the morning. Eucalyptus, grass, falling leaves.
  stage7: {
    inspiredBy: 'stage7Background',
    world: 'koalaForest',
    time: 'morning',
    particles: 'leaves',
    hero: 'eucalyptus',
    palette: { wall: '#4f9a7a', floor: '#9fd38a', floorAlt: '#8cc77a', light: '#f2ffe6', accent: '#ffb347', sparkle: '#e0ff9e', sky: '#2f6e4b' },
    floor: 'grass',
    walls: { ...WALLS, windows: 'forest' },
    decor: [
      { kind: 'eucalyptus', zone: 'backWall', count: 2 },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'desk', zone: 'leftWall', count: 2 },
      { kind: 'globe', zone: 'rightWall' },
      { kind: 'mushroom', zone: 'cornersFront', count: 2 },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'rollDonut', zone: 'frontEdge' },
      { kind: 'starLollipop', zone: 'cornersBack' },
      { kind: 'petal', zone: 'sky', count: 6 },
    ],
  },
  // 8. Science: the capybara hot spring at sunset. A steaming pool, lily pads.
  stage8: {
    inspiredBy: 'stage8Background',
    world: 'hotSpring',
    time: 'sunset',
    particles: 'bubbles',
    hero: 'pool',
    palette: { wall: '#b9a6e8', floor: '#cfc5d9', floorAlt: '#c0b5ce', light: '#fff0e6', accent: '#ff8fc4', sparkle: '#fff1f7', sky: '#8a74c9' },
    floor: 'stone',
    walls: { ...WALLS, windows: 'clouds' },
    decor: [
      { kind: 'pool', zone: 'backWall' },
      { kind: 'flaskSet', zone: 'backWall', count: 2 },
      { kind: 'beaker', zone: 'leftWall', count: 2 },
      { kind: 'beaker', zone: 'rightWall', count: 2 },
      { kind: 'lilyPad', zone: 'frontEdge', count: 2 },
      { kind: 'steam', zone: 'sky', count: 4 },
      { kind: 'cupcake', zone: 'cornersFront' },
      { kind: 'lollipop', zone: 'cornersFront' },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'bouncyBall', zone: 'frontEdge' },
    ],
  },
  // 9. Science: the glowing forest at night. Floating islands, glowing plants.
  stage9: {
    inspiredBy: 'stage9Background',
    world: 'glowForest',
    time: 'night',
    particles: 'fireflies',
    hero: 'floatingIsland',
    palette: { wall: '#14423a', floor: '#1f5a4a', floorAlt: '#276a58', light: '#c9ffe9', accent: '#7be0d6', sparkle: '#b6ffe0', sky: '#0b2a24' },
    floor: 'grass',
    walls: { ...WALLS, windows: 'waterfall' },
    decor: [
      { kind: 'waterfall', zone: 'backWall' },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'floatingIsland', zone: 'sky', count: 2 },
      { kind: 'glowMushroom', zone: 'cornersFront', count: 2 },
      { kind: 'glowPlant', zone: 'cornersBack', count: 2 },
      { kind: 'aquarium', zone: 'leftWall' },
      { kind: 'plantPot', zone: 'rightWall', count: 2 },
      { kind: 'sunFlower', zone: 'frontEdge', count: 2 },
      { kind: 'rollDonut', zone: 'frontEdge' },
    ],
  },
  // 10. Music: the flower meadow in the morning. A rainbow, a piano on a stage.
  stage10: {
    inspiredBy: 'stage10Background',
    world: 'flowerMeadow',
    time: 'morning',
    particles: 'petals',
    hero: 'piano',
    palette: { wall: '#8ecbff', floor: '#a8e08a', floorAlt: '#98d37a', light: '#fff7e0', accent: '#ffd166', sparkle: '#ffe08a', sky: '#6fb4ff' },
    floor: 'grass',
    walls: { ...WALLS, windows: 'rainbow' },
    decor: [
      { kind: 'piano', zone: 'backWall' },
      { kind: 'rainbowArch', zone: 'backWall' },
      { kind: 'drum', zone: 'leftWall', count: 2 },
      { kind: 'musicStand', zone: 'rightWall', count: 2 },
      { kind: 'sunFlower', zone: 'cornersBack', count: 2 },
      { kind: 'noteFloat', zone: 'sky', count: 6 },
      { kind: 'starLollipop', zone: 'cornersFront' },
      { kind: 'cupcake', zone: 'cornersFront' },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'rollDonut', zone: 'frontEdge' },
    ],
  },
  // 11. Music: the shell stage by the sea at sunset. A giant scallop, a lighthouse.
  stage11: {
    inspiredBy: 'stage11Background',
    world: 'shellStage',
    time: 'sunset',
    particles: 'sparkles',
    hero: 'seaShell',
    palette: { wall: '#ffb3a0', floor: '#d9b48a', floorAlt: '#cba47a', light: '#ffe0c9', accent: '#ff7ec7', sparkle: '#ffe6a8', sky: '#ff8a7a' },
    floor: 'wood',
    walls: { ...WALLS, windows: 'sea' },
    decor: [
      { kind: 'seaShell', zone: 'backWall' },
      { kind: 'spotlight', zone: 'cornersBack', count: 2 },
      { kind: 'lighthouse', zone: 'rightWall' },
      { kind: 'palm', zone: 'leftWall' },
      { kind: 'musicStand', zone: 'frontEdge', count: 3 },
      { kind: 'noteFloat', zone: 'sky', count: 5 },
      { kind: 'lollipop', zone: 'cornersFront' },
      { kind: 'starLollipop', zone: 'cornersFront' },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'bouncyBall', zone: 'frontEdge' },
    ],
  },
  // 12. Music: the aurora concert at night. Ice floor, igloo, snowman, northern lights.
  stage12: {
    inspiredBy: 'stage12Background',
    world: 'aurora',
    time: 'night',
    particles: 'snow',
    hero: 'aurora',
    palette: { wall: '#2b3a7a', floor: '#cfe8ff', floorAlt: '#bfdcf5', light: '#e6f2ff', accent: '#6ee7c8', sparkle: '#e6ffff', sky: '#0f1a4a' },
    floor: 'ice',
    walls: { ...WALLS, windows: 'aurora' },
    decor: [
      { kind: 'aurora', zone: 'sky' },
      { kind: 'piano', zone: 'backWall' },
      { kind: 'igloo', zone: 'leftWall' },
      { kind: 'drum', zone: 'rightWall', count: 2 },
      { kind: 'snowman', zone: 'cornersFront' },
      { kind: 'crystal', zone: 'cornersFront' },
      { kind: 'crystal', zone: 'cornersBack', count: 2 },
      { kind: 'musicStand', zone: 'leftWall' },
      { kind: 'starField', zone: 'sky' },
      { kind: 'moon', zone: 'sky' },
      { kind: 'balloon', zone: 'sky', count: 2 },
      { kind: 'bouncyBall', zone: 'frontEdge' },
    ],
  },
  // 13. Art: the ice-cream studio in the morning. Striped awning, giant cones, easels.
  stage13: {
    inspiredBy: 'stage1Background',
    world: 'iceCreamStudio',
    time: 'morning',
    particles: 'confetti',
    hero: 'awning',
    palette: { wall: '#ffd9e8', floor: '#fff7fb', floorAlt: '#ffc2dd', light: '#fff4ee', accent: '#ff7eb6', sparkle: '#ffd1e8', sky: '#ffb3d1' },
    floor: 'checker',
    walls: { ...WALLS, windows: 'clouds' },
    decor: [
      { kind: 'awning', zone: 'backWall' },
      { kind: 'frame', zone: 'backWall' },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'macaronStool', zone: 'cornersBack', count: 2 },
      { kind: 'easel', zone: 'leftWall', count: 2 },
      { kind: 'easel', zone: 'rightWall' },
      { kind: 'iceCream', zone: 'cornersFront', count: 2 },
      { kind: 'paintPots', zone: 'frontEdge', count: 3 },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'rollDonut', zone: 'frontEdge' },
      { kind: 'petal', zone: 'sky', count: 5 },
    ],
  },
  // 14. Art: the paint canyon at sunset. A waterfall of colours, canyon walls.
  stage14: {
    inspiredBy: 'stage2Background',
    world: 'paintCanyon',
    time: 'sunset',
    particles: 'confetti',
    hero: 'paintFall',
    palette: { wall: '#d9774a', floor: '#e8c9a0', floorAlt: '#dbb88c', light: '#fff0dd', accent: '#ffb38a', sparkle: '#ffe0b0', sky: '#a35a3a' },
    floor: 'stone',
    walls: { ...WALLS, windows: 'canyon' },
    decor: [
      { kind: 'paintFall', zone: 'backWall' },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'cliff', zone: 'leftWall', count: 2 },
      { kind: 'cliff', zone: 'rightWall', count: 2 },
      { kind: 'easel', zone: 'cornersFront', count: 2 },
      { kind: 'paintPots', zone: 'frontEdge', count: 3 },
      { kind: 'starLollipop', zone: 'cornersBack' },
      { kind: 'mushroom', zone: 'cornersBack' },
      { kind: 'sunFlower', zone: 'frontEdge', count: 2 },
      { kind: 'bouncyBall', zone: 'frontEdge' },
      { kind: 'balloon', zone: 'sky', count: 2 },
    ],
  },
  // 15. Art: the Saturn studio, the finale at night. Saturn, comets, a castle at the end.
  stage15: {
    inspiredBy: 'stage3Background',
    world: 'saturn',
    time: 'night',
    particles: 'stars',
    hero: 'planetRinged',
    palette: { wall: '#241a52', floor: '#4b2f7a', floorAlt: '#3b2564', light: '#fff6d8', accent: '#ffd166', sparkle: '#fff1a8', sky: '#0a0820' },
    floor: 'carpet',
    walls: { ...WALLS, windows: 'stars' },
    decor: [
      { kind: 'castle', zone: 'backWall' },
      { kind: 'frame', zone: 'backWall', count: 2 },
      { kind: 'rainbowCloud', zone: 'backWall' },
      { kind: 'frame', zone: 'leftWall', count: 2 },
      { kind: 'sculpture', zone: 'cornersBack', count: 2 },
      { kind: 'planetRinged', zone: 'sky' },
      { kind: 'comet', zone: 'sky', count: 2 },
      { kind: 'starField', zone: 'sky' },
      { kind: 'rocket', zone: 'cornersFront', count: 2 },
      { kind: 'funnyFlower', zone: 'frontEdge', count: 2 },
      { kind: 'balloon', zone: 'sky', count: 3 },
    ],
  },
}

export function roomFor(scene: SceneName): RoomSpec {
  return CLASSROOMS[scene]
}
