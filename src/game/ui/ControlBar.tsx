import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { SoundToggle } from './SoundToggle'
import { LanguageSelect } from './LanguageSelect'
import { NameButton } from './NameButton'
import { StageMenu } from './StageMenu'
import { PauseButton } from './PauseMenu'
import { StickerButton } from './StickerButton'
import { TodoButton } from '../todo/TodoButton'
import { VolumeMenu } from './VolumeMenu'
import { useT } from '../i18n/useT'

/**
 * The bar around the game, kept outside it so the playfield is free: the
 * stage's status (`status`, in a classroom), the buttons a child uses all the
 * time (pause, the sticker book), and one preferences button that opens a
 * dropdown with the rest (sound, volume, language, name, the dev tools). On every size,
 * so the row never gets long. Escape or a tap elsewhere closes the dropdown.
 */
export function ControlBar({ onUnmute, stageMenu, status }: { onUnmute: () => void; stageMenu?: ReactNode; status?: ReactNode }) {
  const { t } = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="control-bar" ref={root} data-open={open ? 'true' : undefined}>
      {status && <div className="control-bar__status">{status}</div>}
      <PauseButton />
      <StickerButton />
      <TodoButton />
      <button
        type="button"
        className="sound-toggle control-bar__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? t('hud.overlayPrefsClose') : t('hud.overlayPrefs')}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">🎛️</span>
        <span className="control-bar__caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      <div className="control-bar__items" id={id}>
        <SoundToggle onUnmute={onUnmute} />
        <VolumeMenu />
        <LanguageSelect compact />
        <NameButton />
        {stageMenu && <StageMenu>{stageMenu}</StageMenu>}
      </div>
    </div>
  )
}
