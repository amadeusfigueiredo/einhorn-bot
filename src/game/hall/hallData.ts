/**
 * What the round window of each class door shows: the colour of the walls or the sky inside that class, so a child
 * can see which class is behind the door before opening it. (Class 1 … 15 in order; from the design of the corridor.)
 */
export const CLASS_WINDOW = [
  '#FFD1E6', '#8A6BF0', '#2A1F66', '#D6F1FF', '#3A9AD6', '#2A2470', '#E3F6FF', '#FFB3B3',
  '#0F2840', '#CDEBFF', '#C46BB0', '#1A1E48', '#FFE3EF', '#FF8FB8', '#2A1450',
] as const

/** The window colour of the class at `index` (0-based), or none for an index that is not a class. */
export function classWindow(index: number): string | undefined {
  return CLASS_WINDOW[index]
}
