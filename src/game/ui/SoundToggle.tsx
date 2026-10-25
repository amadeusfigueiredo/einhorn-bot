import { soundSettings, useMuted } from '../audio/soundSettings'
import { useT } from '../i18n/useT'

export function SoundToggle({ onUnmute }: { onUnmute: () => void }) {
  const muted = useMuted()
  const { t } = useT()

  const toggle = () => {
    soundSettings.getState().toggleMuted()
    // Unmuting is a user gesture: the right moment to let music start.
    if (muted) onUnmute()
  }

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={muted}
      aria-label={muted ? t('sound.turnOn') : t('sound.turnOff')}
      onClick={toggle}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
      <span className="sound-toggle__label">{muted ? t('sound.off') : t('sound.on')}</span>
    </button>
  )
}
