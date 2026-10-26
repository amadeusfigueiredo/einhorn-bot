import type { useT } from '../i18n/useT'
import { duration } from './practiceModel'

type Translate = ReturnType<typeof useT>['t']

/** "1 h 5 min", "20 min" or "nothing yet". */
export function timeText(t: Translate, seconds: number): string {
  const { hours, minutes } = duration(seconds)
  if (hours === 0 && minutes === 0) return t('parent.timeNone')
  return hours > 0 ? t('parent.hoursMinutes', { hours, minutes }) : t('parent.minutes', { minutes })
}
