import { useT } from '../i18n/useT'
import { moveName, useMove } from '../moves/moveStore'

/** The name of the move being done, for a moment over the game (and for the screen reader, politely). */
export function MoveCaption() {
  const move = useMove()
  const { t, lang } = useT()
  if (!move) return null
  return (
    <p className="move-caption" role="status">
      {t(move.hero === 'amara' ? 'dance.caption' : 'dance.captionUnicorn', { move: moveName(move, lang) })}
    </p>
  )
}
