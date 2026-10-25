import type { MessageId } from '../../i18n/translate'

/**
 * The four sports of the sports hall, left to right along its back wall: each has an archway of its own colour (no
 * red) and, one by one, a place of its own with three activities (see NOTES.md).
 */
export const SPORTS = [
  { id: 'pony', color: '#7ED39A', labelKey: 'sports.pony' },
  { id: 'pool', color: '#8EC5FF', labelKey: 'sports.pool' },
  { id: 'dojo', color: '#B79CFF', labelKey: 'sports.dojo' },
  { id: 'dance', color: '#FF7EB6', labelKey: 'sports.dance' },
] as const satisfies readonly { id: string; color: string; labelKey: MessageId }[]

export type SportId = (typeof SPORTS)[number]['id']

export const SPORT_KEYS = SPORTS.map((s) => s.labelKey)

/** x of the middle of each archway (z is the back wall): evenly spaced, right of the door to the corridor. */
export const ARCH_X = [-3.9, -1.3, 1.3, 3.9] as const
