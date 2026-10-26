import { useEffect, useId, useRef, useState } from 'react'
import { useT } from '../i18n/useT'
import { VolumeControls } from './VolumeControls'

/**
 * A small 🎚️ button that opens the two volume sliders next to it. Escape or a tap elsewhere closes it (the same
 * way as the other menus of the controls bar).
 */
export function VolumeMenu() {
  const { t } = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="volume-menu" ref={root}>
      <button
        type="button"
        className="sound-toggle volume-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={open ? t('sound.volumeClose') : t('sound.volumeOpen')}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">🎚️</span>
        <span className="menu-toggle__text" aria-hidden="true">{t('sound.volume')}</span>
      </button>
      {open && (
        <div className="volume-menu__panel" id={id}>
          <VolumeControls />
        </div>
      )}
    </div>
  )
}
