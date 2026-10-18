import { soundSettings, useMuted } from '../audio/soundSettings'

export function SoundToggle({ onUnmute }: { onUnmute: () => void }) {
  const muted = useMuted()

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
      aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      onClick={toggle}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
      <span className="sound-toggle__label">{muted ? 'Ton aus' : 'Ton an'}</span>
    </button>
  )
}
