import { useId } from 'react'
import { playSfx } from '../audio/sfx'
import { soundSettings, useEffectsVolume, useMusicVolume } from '../audio/soundSettings'
import { useT } from '../i18n/useT'

const STEPS = 20

function Slider({ label, icon, value, onChange, onDone }: { label: string; icon: string; value: number; onChange: (v: number) => void; onDone?: () => void }) {
  const id = useId()
  const percent = Math.round(value * 100)
  return (
    <div className="volume-row">
      <label className="volume-row__label" htmlFor={id}>
        <span aria-hidden="true">{icon}</span> {label}
      </label>
      <input
        id={id}
        className="volume-row__slider"
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(value * STEPS)}
        aria-valuetext={`${percent} %`}
        onChange={(e) => onChange(Number(e.target.value) / STEPS)}
        // A sample of the sound when the slider is let go, so the child hears how loud it is.
        onPointerUp={onDone}
        onKeyUp={onDone}
      />
      <output className="volume-row__value" htmlFor={id}>
        {percent}
      </output>
    </div>
  )
}

/** Two sliders: the music and the sounds of the game, each with its own volume (the mute button silences both). */
export function VolumeControls() {
  const { t } = useT()
  const music = useMusicVolume()
  const effects = useEffectsVolume()
  return (
    <div className="volume-controls" role="group" aria-label={t('sound.volume')}>
      <Slider label={t('sound.music')} icon="🎵" value={music} onChange={(v) => soundSettings.getState().setMusicVolume(v)} />
      <Slider label={t('sound.effects')} icon="🔔" value={effects} onChange={(v) => soundSettings.getState().setEffectsVolume(v)} onDone={() => playSfx('pop')} />
    </div>
  )
}
