// The 15 worlds of the school: what each classroom is called. The look of a
// world is in classrooms.ts; this is only the name (for the stage card and
// the transition between stages).
import type { Localized } from '../i18n/languages'

export type WorldId =
  | 'candyClassroom' | 'beach' | 'moon' | 'treehouse' | 'underwater'
  | 'cloudCastle' | 'koalaForest' | 'hotSpring' | 'glowForest' | 'flowerMeadow'
  | 'shellStage' | 'aurora' | 'iceCreamStudio' | 'paintCanyon' | 'saturn'

export const WORLD_IDS: readonly WorldId[] = [
  'candyClassroom', 'beach', 'moon', 'treehouse', 'underwater',
  'cloudCastle', 'koalaForest', 'hotSpring', 'glowForest', 'flowerMeadow',
  'shellStage', 'aurora', 'iceCreamStudio', 'paintCanyon', 'saturn',
]

export const WORLD_NAMES: Record<WorldId, Localized> = {
  candyClassroom: { de: 'Bonbon-Klasse', pt: 'Sala dos doces', en: 'Candy Classroom' },
  beach: { de: 'Strandschule', pt: 'Escola na praia', en: 'Beach School' },
  moon: { de: 'Mondklasse', pt: 'Aula na lua', en: 'Moon Class' },
  treehouse: { de: 'Baumhaus-Bibliothek', pt: 'Biblioteca na árvore', en: 'Treehouse Library' },
  underwater: { de: 'Unterwasser-Schule', pt: 'Escola submarina', en: 'Underwater School' },
  cloudCastle: { de: 'Wolkenschloss', pt: 'Castelo de nuvens', en: 'Cloud Castle' },
  koalaForest: { de: 'Koala-Wald', pt: 'Floresta dos coalas', en: 'Koala Forest' },
  hotSpring: { de: 'Capybara-Quelle', pt: 'Fonte das capivaras', en: 'Capybara Hot Spring' },
  glowForest: { de: 'Leuchtwald', pt: 'Floresta brilhante', en: 'Glowing Forest' },
  flowerMeadow: { de: 'Blumenwiese', pt: 'Campo de flores', en: 'Flower Meadow' },
  shellStage: { de: 'Muschel-Bühne', pt: 'Palco de concha', en: 'Shell Stage' },
  aurora: { de: 'Polarlicht-Konzert', pt: 'Concerto da aurora', en: 'Aurora Concert' },
  iceCreamStudio: { de: 'Eisdiele-Atelier', pt: 'Ateliê da sorveteria', en: 'Ice-Cream Studio' },
  paintCanyon: { de: 'Farb-Wasserfall', pt: 'Cânion de tintas', en: 'Paint Canyon' },
  saturn: { de: 'Saturn-Atelier', pt: 'Ateliê de Saturno', en: 'Saturn Studio' },
}
