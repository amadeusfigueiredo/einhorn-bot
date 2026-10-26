import { isWorldPaused } from '../logic/gameMachine'
import { useGame } from '../logic/gameStore.instance'
import { profileStore, usePlayerName } from '../player/playerName'
import { useT } from '../i18n/useT'
import { nameButtonLabel, nameButtonText } from '../i18n/phrases'

/** Shows the child's name and reopens the name dialog to change it. */
export function NameButton() {
  const name = usePlayerName()
  const { t } = useT()
  // Not while a teacher is talking or asking: typing would collide with the answers.
  const busy = useGame((g) => isWorldPaused(g.phase))
  return (
    <button
      type="button"
      className="sound-toggle name-toggle"
      aria-label={nameButtonLabel(t, name)}
      disabled={busy}
      onClick={() => profileStore.getState().openModal()}
    >
      <span className="name-toggle__avatar" aria-hidden="true">{name ? name.slice(0, 1).toUpperCase() : '✏️'}</span>
      <span className="name-toggle__text">{nameButtonText(t, name)}</span>
    </button>
  )
}
